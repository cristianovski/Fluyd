(() => {
    const productSelect = document.querySelector("#lead-product");
    const nameInput = document.querySelector("#lead-name");
    const leadForm = document.querySelector("#lead-router");
    const query = new URLSearchParams(window.location.search);
    const availableProducts = [...(productSelect?.options || [])].map((option) => option.value);
    const requestedProduct = query.get("produto");

    if (productSelect && requestedProduct && availableProducts.includes(requestedProduct)) {
        productSelect.value = requestedProduct;
    }

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
            cleanAttribution(query.get("utm_campaign"))
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
})();
