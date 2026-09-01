(function () {
    "use strict";

    const STORAGE_KEY = "glid_analytics_consent";
    const GRANTED = "granted";
    let banner = null;
    let restoreFocusTarget = null;

    const readChoice = () => {
        try {
            return window.localStorage.getItem(STORAGE_KEY);
        } catch (_error) {
            return null;
        }
    };

    const saveChoice = (choice) => {
        try {
            window.localStorage.setItem(STORAGE_KEY, choice);
        } catch (_error) {
            // The choice still applies to the current page when storage is unavailable.
        }
    };

    const removeAnalyticsCookies = () => {
        const hostname = window.location.hostname.replace(/^\./, "");
        const labels = hostname.split(".").filter(Boolean);
        const domainCandidates = [hostname];

        for (let index = 1; index < labels.length - 1; index += 1) {
            domainCandidates.push(labels.slice(index).join("."));
        }

        const domains = [
            "",
            ...domainCandidates.flatMap((domain) => [domain, `.${domain}`])
        ];

        document.cookie.split(";").forEach((cookie) => {
            const name = cookie.split("=")[0].trim();
            if (!/^_ga(?:_|$)/.test(name)) return;

            domains.forEach((domain) => {
                const domainPart = domain ? `; Domain=${domain}` : "";
                document.cookie = `${name}=; Max-Age=0; Path=/${domainPart}; SameSite=Lax`;
            });
        });
    };

    const applyChoice = (choice) => {
        const granted = choice === GRANTED;
        const previousChoice = readChoice();
        const shouldReload = !granted && Boolean(window.__glidTagManagerLoaded);

        saveChoice(choice);
        window.__glidAnalyticsConsent = choice;

        if (typeof window.gtag === "function") {
            window.gtag("consent", "update", {
                ad_storage: "denied",
                ad_user_data: "denied",
                ad_personalization: "denied",
                analytics_storage: granted ? "granted" : "denied"
            });
        }

        if (granted && typeof window.loadGlidTagManager === "function") {
            window.loadGlidTagManager();
        }

        if (!granted) removeAnalyticsCookies();

        if (previousChoice !== choice) {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: granted
                    ? "glid_analytics_consent_granted"
                    : "glid_analytics_consent_denied"
            });
        }

        banner?.remove();
        banner = null;

        const focusTarget = restoreFocusTarget;
        restoreFocusTarget = null;
        if (focusTarget?.isConnected) focusTarget.focus({ preventScroll: true });

        if (granted) {
            window.dispatchEvent(new CustomEvent("glid:analytics-consent-granted"));
        } else if (shouldReload) {
            window.location.reload();
        }
    };

    const showPreferences = (trigger = null) => {
        if (banner) {
            banner.querySelector("button")?.focus();
            return;
        }

        if (trigger && typeof trigger.focus === "function") restoreFocusTarget = trigger;

        banner = document.createElement("section");
        banner.className = "analytics-consent";
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-modal", "false");
        banner.setAttribute("aria-labelledby", "analytics-consent-title");
        banner.setAttribute("aria-describedby", "analytics-consent-description");
        banner.innerHTML = `
            <div class="analytics-consent__copy">
                <strong id="analytics-consent-title">Métricas opcionais</strong>
                <p id="analytics-consent-description">A GLID usa métricas para entender o uso do site e melhorar o simulador. Elas só são ativadas com a sua escolha e não incluem os campos pessoais do formulário.</p>
                <a href="/privacidade/">Ver Aviso de Privacidade</a>
            </div>
            <div class="analytics-consent__actions">
                <button type="button" data-analytics-choice="denied">Continuar sem métricas</button>
                <button class="analytics-consent__accept" type="button" data-analytics-choice="granted">Aceitar métricas</button>
            </div>`;

        banner.addEventListener("click", (event) => {
            const choiceButton = event.target.closest("[data-analytics-choice]");
            if (choiceButton) applyChoice(choiceButton.dataset.analyticsChoice);
        });

        document.body.appendChild(banner);
        banner.querySelector("button")?.focus({ preventScroll: true });
    };

    const addPreferencesControl = () => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "analytics-preferences-link";
        button.textContent = "Preferências de métricas";
        button.addEventListener("click", (event) => showPreferences(event.currentTarget));

        const legalNavigation = document.querySelector(".footer-legal");
        if (legalNavigation) {
            legalNavigation.appendChild(button);
            return;
        }

        button.classList.add("analytics-preferences-link--floating");
        document.body.appendChild(button);
    };

    addPreferencesControl();
    if (!readChoice()) showPreferences();
})();
