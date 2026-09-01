const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const htmlFiles = [
    "index.html",
    "404.html",
    "consorcio/index.html",
    "consorcios/index.html",
    "emprestimos/index.html",
    "seguros/index.html",
    "financiamentos/index.html",
    "financiamento-auto/index.html",
    "financiamento-imobiliario/index.html",
    "privacidade/index.html",
    "termos/index.html"
];

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const runConsentManager = ({ storedChoice = null, tagManagerLoaded = false } = {}) => {
    const storage = new Map();
    if (storedChoice) storage.set("glid_analytics_consent", storedChoice);

    const createdSections = [];
    const createdButtons = [];
    const cookieWrites = [];
    let reloads = 0;

    class MockElement {
        constructor(tagName) {
            this.tagName = tagName;
            this.listeners = {};
            this.children = [];
            this.dataset = {};
            this.isConnected = true;
            this.classList = { add() {} };
            this.firstButton = null;
        }

        addEventListener(type, listener) {
            this.listeners[type] = listener;
        }

        appendChild(child) {
            child.isConnected = true;
            this.children.push(child);
        }

        setAttribute(name, value) {
            this[name] = value;
        }

        querySelector(selector) {
            if (selector !== "button") return null;
            if (!this.firstButton) this.firstButton = new MockElement("button");
            return this.firstButton;
        }

        focus() {
            this.focused = true;
        }

        remove() {
            this.isConnected = false;
        }
    }

    const footer = new MockElement("footer");
    const body = new MockElement("body");
    const document = {
        body,
        createElement(tagName) {
            const element = new MockElement(tagName);
            if (tagName === "section") createdSections.push(element);
            if (tagName === "button") createdButtons.push(element);
            return element;
        },
        querySelector(selector) {
            return selector === ".footer-legal" ? footer : null;
        }
    };

    Object.defineProperty(document, "cookie", {
        get: () => "_ga=123; _ga_TEST=456; session=ok",
        set: (value) => cookieWrites.push(value)
    });

    const window = {
        __glidTagManagerLoaded: tagManagerLoaded,
        dataLayer: [],
        dispatchEvent() {},
        gtag() {},
        localStorage: {
            getItem: (key) => storage.get(key) || null,
            setItem: (key, value) => storage.set(key, value)
        },
        location: {
            hostname: "www.glid.com.br",
            reload: () => { reloads += 1; }
        },
        loadGlidTagManager() {
            this.__glidTagManagerLoaded = true;
        }
    };

    class CustomEvent {
        constructor(type) {
            this.type = type;
        }
    }

    vm.runInNewContext(read("assets/js/analytics-consent.js"), {
        CustomEvent,
        document,
        window
    });

    return {
        cookieWrites,
        createdButtons,
        createdSections,
        get reloads() { return reloads; },
        storage,
        window
    };
};

test("todas as páginas carregam o gerenciador e o controle de consentimento", () => {
    for (const file of htmlFiles) {
        const html = read(file);
        assert.match(html, /<script src="\/assets\/js\/gtm\.js"><\/script>/, file);
        assert.match(html, /<script src="\/assets\/js\/analytics-consent\.js" defer><\/script>/, file);
    }
});

test("o GTM usa consentimento básico e não carrega antes da autorização", () => {
    const source = read("assets/js/gtm.js");
    assert.match(source, /GTM-WKSWSR39/);
    assert.match(source, /analytics_storage: storedChoice === "granted" \? "granted" : "denied"/);
    assert.match(source, /ad_storage: "denied"/);
    assert.match(source, /ad_user_data: "denied"/);
    assert.match(source, /ad_personalization: "denied"/);
    assert.match(source, /if \(storedChoice === "granted"\) window\.loadGlidTagManager\(\)/);
    assert.match(source, /hasGlidAnalyticsConsent/);
});

test("o carregador só injeta o contêiner depois da autorização", () => {
    const insertedScripts = [];
    const firstScript = {
        parentNode: {
            insertBefore(script) {
                insertedScripts.push(script);
            }
        }
    };
    const document = {
        createElement: () => ({}),
        getElementsByTagName: () => [firstScript]
    };
    const window = {
        localStorage: { getItem: () => null }
    };

    vm.runInNewContext(read("assets/js/gtm.js"), { window, document, Date });
    assert.equal(insertedScripts.length, 0);
    assert.equal(window.hasGlidAnalyticsConsent(), false);

    window.__glidAnalyticsConsent = "granted";
    window.loadGlidTagManager();
    window.loadGlidTagManager();

    assert.equal(insertedScripts.length, 1);
    assert.match(insertedScripts[0].src, /GTM-WKSWSR39/);
});

test("a escolha pode ser concedida, recusada e reaberta no rodapé", () => {
    const source = read("assets/js/analytics-consent.js");
    assert.match(source, /glid_analytics_consent/);
    assert.match(source, /glid_analytics_consent_granted/);
    assert.match(source, /glid_analytics_consent_denied/);
    assert.match(source, /Preferências de métricas/);
    assert.match(source, /removeAnalyticsCookies/);
    assert.match(source, /window\.location\.reload\(\)/);
    assert.match(source, /aria-describedby/);
    assert.match(source, /labels\.slice\(index\)\.join\("\."\)/);
    assert.doesNotMatch(source, /querySelector\([^)]*(nome|telefone|cidade|whatsapp)/i);
});

test("a recusa apaga cookies no domínio GLID e a revogação recarrega sem GTM", () => {
    const firstVisit = runConsentManager();
    const initialBanner = firstVisit.createdSections[0];
    const denyButton = {
        dataset: { analyticsChoice: "denied" },
        closest: () => denyButton
    };
    initialBanner.listeners.click({ target: denyButton });

    assert.equal(firstVisit.storage.get("glid_analytics_consent"), "denied");
    assert.equal(firstVisit.reloads, 0);
    assert.ok(firstVisit.cookieWrites.some((write) => write.includes("Domain=.glid.com.br")));

    const revocation = runConsentManager({ storedChoice: "granted", tagManagerLoaded: true });
    const preferenceButton = revocation.createdButtons[0];
    preferenceButton.listeners.click({ currentTarget: preferenceButton });
    const reopenedBanner = revocation.createdSections[0];
    reopenedBanner.listeners.click({ target: denyButton });

    assert.equal(revocation.window.__glidAnalyticsConsent, "denied");
    assert.equal(revocation.reloads, 1);
    assert.equal(preferenceButton.focused, true);
});

test("eventos do simulador não entram no dataLayer sem consentimento", () => {
    for (const file of ["assets/js/consorcio-lead.js", "assets/js/consorcios.js"]) {
        const source = read(file);
        assert.match(source, /hasGlidAnalyticsConsent/);
        assert.match(source, /!window\.hasGlidAnalyticsConsent\(\)/);
    }

    const leadSource = read("assets/js/consorcio-lead.js");
    assert.match(leadSource, /glid:analytics-consent-granted/);
});

test("o aviso de privacidade descreve GA4, consentimento e campos excluídos", () => {
    const privacy = read("privacidade/index.html");
    assert.match(privacy, /Google Tag Manager e Google Analytics/);
    assert.match(privacy, /armazenamento analítico permanece desativado/);
    assert.match(privacy, /não envia ao Google os campos de nome, cidade, telefone/);
    assert.match(privacy, /glid_analytics_consent/);
});
