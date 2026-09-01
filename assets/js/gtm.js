(function (window, document, tagName, dataLayerName, containerId) {
    "use strict";

    window[dataLayerName] = window[dataLayerName] || [];

    let storedChoice = null;
    try {
        storedChoice = window.localStorage.getItem("glid_analytics_consent");
    } catch (_error) {
        storedChoice = null;
    }

    window.__glidAnalyticsConsent = storedChoice === "granted" ? "granted" : "denied";
    window.hasGlidAnalyticsConsent = function () {
        return window.__glidAnalyticsConsent === "granted";
    };

    window.gtag = window.gtag || function () {
        window[dataLayerName].push(arguments);
    };

    window.gtag("consent", "default", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: storedChoice === "granted" ? "granted" : "denied",
        functionality_storage: "granted",
        security_storage: "granted",
        wait_for_update: 500
    });

    window.loadGlidTagManager = window.loadGlidTagManager || function () {
        if (window.__glidTagManagerLoaded) return;
        window.__glidTagManagerLoaded = true;

        window[dataLayerName].push({
            "gtm.start": Date.now(),
            event: "gtm.js"
        });

        const firstScript = document.getElementsByTagName(tagName)[0];
        const gtmScript = document.createElement(tagName);
        const customLayer = dataLayerName === "dataLayer" ? "" : `&l=${dataLayerName}`;

        gtmScript.async = true;
        gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}${customLayer}`;
        firstScript.parentNode.insertBefore(gtmScript, firstScript);
    };

    if (storedChoice === "granted") window.loadGlidTagManager();
})(window, document, "script", "dataLayer", "GTM-WKSWSR39");
