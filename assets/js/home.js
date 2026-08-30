(() => {
    const productSelect = document.querySelector("#lead-product");
    const nameInput = document.querySelector("#lead-name");
    const leadForm = document.querySelector("#lead-router");
    const leadSubmit = leadForm?.querySelector(".form-submit");
    const hero = document.querySelector(".hero");
    const whatsappFloat = document.querySelector(".whatsapp-float");
    const mobileViewport = window.matchMedia?.("(max-width: 900px)");
    const query = new URLSearchParams(window.location.search);
    const availableProducts = [...(productSelect?.options || [])].map((option) => option.value);
    const requestedProduct = query.get("produto");

    if (productSelect && requestedProduct && availableProducts.includes(requestedProduct)) {
        productSelect.value = requestedProduct;
    }

    if (leadSubmit) leadSubmit.disabled = false;

    document.querySelectorAll("[data-product]").forEach((link) => {
        link.addEventListener("click", () => {
            if (productSelect) {
                productSelect.value = link.dataset.product || "";
                window.setTimeout(() => nameInput?.focus({ preventScroll: true }), 500);
            }
            const mobileMenu = link.closest("details");
            if (mobileMenu) mobileMenu.open = false;
        });
    });

    document.querySelectorAll(".mobile-menu nav a").forEach((link) => {
        link.addEventListener("click", () => {
            const menu = link.closest("details");
            if (menu) menu.open = false;
        });
    });

    leadForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!leadForm.reportValidity()) return;

        const data = new FormData(leadForm);
        const cleanAttribution = (value) => value?.replace(/[\r\n]/g, " ").slice(0, 80);
        const attribution = [
            cleanAttribution(query.get("utm_source")),
            cleanAttribution(query.get("utm_medium")),
            cleanAttribution(query.get("utm_campaign")),
            cleanAttribution(query.get("utm_content")),
            cleanAttribution(query.get("utm_term"))
        ].filter(Boolean).join(" / ");

        const messageLines = [
            "Olá! Vim pelo site da GLID e quero entender minhas opções.",
            "",
            `Nome: ${data.get("nome")}`,
            `Interesse: ${data.get("produto")}`,
            `Perfil: ${data.get("perfil")}`,
            `Cidade/UF: ${data.get("cidade")}`,
            "",
            "Gostaria de receber orientação sobre os próximos passos."
        ];

        if (attribution) messageLines.push("", `Origem da visita: ${attribution}`);
        const message = messageLines.join("\n");

        window.location.href = `https://wa.me/557731420005?text=${encodeURIComponent(message)}`;
    });

    if (hero && whatsappFloat) {
        document.documentElement.classList.add("js");
        let heroIsVisible = true;
        const updateWhatsappVisibility = () => {
            const isCompactViewport = mobileViewport?.matches ?? false;
            whatsappFloat.classList.toggle("is-visible", !isCompactViewport || !heroIsVisible);
        };

        if ("IntersectionObserver" in window) {
            const heroObserver = new IntersectionObserver(([entry]) => {
                heroIsVisible = entry.isIntersecting;
                updateWhatsappVisibility();
            }, { rootMargin: "-70px 0px 0px 0px", threshold: 0 });
            heroObserver.observe(hero);
        } else {
            heroIsVisible = false;
        }

        if (mobileViewport?.addEventListener) {
            mobileViewport.addEventListener("change", updateWhatsappVisibility);
        } else {
            mobileViewport?.addListener?.(updateWhatsappVisibility);
        }
        updateWhatsappVisibility();
    }
})();
