(function () {
    "use strict";

    const STORAGE_KEY = "glid_analytics_consent";
    const GRANTED = "granted";
    const PREFERENCES_HASH = "#preferencias-metricas";
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

        if (
            window.location.hash === PREFERENCES_HASH
            && typeof window.history?.replaceState === "function"
        ) {
            window.history.replaceState(
                null,
                "",
                `${window.location.pathname}${window.location.search}`
            );
        }

        if (granted) {
            window.dispatchEvent(new CustomEvent("glid:analytics-consent-granted"));
        } else if (shouldReload) {
            window.location.reload();
        }
    };

    const showPreferences = (trigger = null) => {
        if (banner?.isConnected) {
            banner.querySelector("button")?.focus();
            return;
        }

        banner = null;

        if (trigger && typeof trigger.focus === "function") restoreFocusTarget = trigger;

        banner = document.createElement("section");
        banner.id = PREFERENCES_HASH.slice(1);
        banner.className = "analytics-consent";
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-modal", "false");
        banner.setAttribute("aria-labelledby", "analytics-consent-title");
        banner.setAttribute("aria-describedby", "analytics-consent-description");
        banner.innerHTML = `
            <div class="analytics-consent__copy">
                <strong id="analytics-consent-title">Métricas opcionais</strong>
                <p id="analytics-consent-description">Com sua autorização, usamos o Google Analytics para entender visitas e melhorar o site. Dados pessoais dos formulários não são enviados ao Google Analytics. Você pode mudar esta escolha no rodapé.</p>
                <a href="/privacidade/#privacy-third-parties">Como usamos métricas e cookies</a>
            </div>
            <div class="analytics-consent__actions">
                <button type="button" data-analytics-choice="denied">Recusar métricas</button>
                <button type="button" data-analytics-choice="granted">Aceitar métricas</button>
            </div>`;

        banner.addEventListener("click", (event) => {
            const choiceButton = event.target.closest("[data-analytics-choice]");
            if (choiceButton) applyChoice(choiceButton.dataset.analyticsChoice);
        });

        document.body.appendChild(banner);
        banner.querySelector("button")?.focus({ preventScroll: true });
    };

    const addPreferencesControl = () => {
        const link = document.createElement("a");
        link.href = PREFERENCES_HASH;
        link.className = "analytics-preferences-link";
        link.textContent = "Preferências de métricas";
        link.setAttribute("aria-controls", PREFERENCES_HASH.slice(1));
        link.setAttribute("aria-haspopup", "dialog");
        link.addEventListener("click", (event) => showPreferences(event.currentTarget));

        const legalNavigation = document.querySelector(".footer-legal");
        if (legalNavigation) {
            legalNavigation.appendChild(link);
            return;
        }

        link.classList.add("analytics-preferences-link--floating");
        document.body.appendChild(link);
    };

    const showPreferencesFromHash = () => {
        if (window.location.hash === PREFERENCES_HASH) showPreferences();
    };

    addPreferencesControl();
    window.addEventListener("hashchange", showPreferencesFromHash);
    if (!readChoice() || window.location.hash === PREFERENCES_HASH) showPreferences();
})();
