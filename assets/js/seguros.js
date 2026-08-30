(() => {
    document.documentElement.classList.add("insurance-js");

    const form = document.querySelector("#auto-quote-form");
    if (!form) return;

    const steps = [...form.querySelectorAll(".quote-step")];
    const progressItems = [...form.querySelectorAll("[data-progress]")];
    const renewalField = form.querySelector("#renewal-field");
    const renewalInput = form.querySelector("#renewal-date");
    const plateInput = form.querySelector("#vehicle-plate");
    const zipInput = form.querySelector("#overnight-zip");
    const phoneInput = form.querySelector("#quote-phone");
    const status = form.querySelector("#quote-status");
    const query = new URLSearchParams(window.location.search);
    const cleanAttribution = (value) => value?.replace(/[\r\n]/g, " ").slice(0, 80);
    const attribution = [
        cleanAttribution(query.get("utm_source")),
        cleanAttribution(query.get("utm_medium")),
        cleanAttribution(query.get("utm_campaign")),
        cleanAttribution(query.get("utm_content")),
        cleanAttribution(query.get("utm_term"))
    ].filter(Boolean).join(" / ");
    let currentStep = 0;

    const setChoice = (button) => {
        const group = button.closest("[data-choice-group]");
        if (!group) return;

        group.querySelectorAll(".quote-option").forEach((option) => {
            const selected = option === button;
            option.classList.toggle("is-selected", selected);
            option.setAttribute("aria-pressed", String(selected));
        });

        const input = group.querySelector("input[type='hidden']");
        if (input) input.value = button.dataset.value || "";

        group.removeAttribute("aria-invalid");
        const errorId = group.getAttribute("aria-describedby");
        const error = errorId ? document.querySelector(`#${errorId}`) : null;
        if (error) error.hidden = true;

        if (group.dataset.choiceGroup === "modalidade" && renewalField && renewalInput) {
            const isRenewal = button.dataset.value === "Renovação";
            renewalField.hidden = !isRenewal;
            renewalInput.disabled = !isRenewal;
            if (!isRenewal) renewalInput.value = "";
        }
    };

    const validateChoices = (step) => {
        const requiredGroups = [...step.querySelectorAll("[data-required-choice]")];
        let firstInvalidButton = null;

        requiredGroups.forEach((group) => {
            const input = group.querySelector("input[type='hidden']");
            const isValid = Boolean(input?.value);
            group.toggleAttribute("aria-invalid", !isValid);

            const errorId = group.getAttribute("aria-describedby");
            const error = errorId ? document.querySelector(`#${errorId}`) : null;
            if (error) error.hidden = isValid;
            if (!isValid && !firstInvalidButton) firstInvalidButton = group.querySelector("button");
        });

        firstInvalidButton?.focus();
        return !firstInvalidButton;
    };

    const validateFields = (step) => {
        const fields = [...step.querySelectorAll("input:not([type='hidden']), select")];
        const firstInvalid = fields.find((field) => !field.disabled && !field.checkValidity());
        if (!firstInvalid) return true;
        firstInvalid.reportValidity();
        firstInvalid.focus();
        return false;
    };

    const validateStep = (stepIndex) => {
        const step = steps[stepIndex];
        return validateChoices(step) && validateFields(step);
    };

    const showStep = (stepIndex, shouldFocus = true) => {
        currentStep = Math.max(0, Math.min(stepIndex, steps.length - 1));

        steps.forEach((step, index) => {
            step.hidden = index !== currentStep;
        });

        progressItems.forEach((item, index) => {
            const isActive = index === currentStep;
            item.classList.toggle("is-active", isActive);
            item.classList.toggle("is-complete", index < currentStep);
            if (isActive) item.setAttribute("aria-current", "step");
            else item.removeAttribute("aria-current");
        });

        if (shouldFocus) {
            const heading = steps[currentStep]?.querySelector("h3");
            window.setTimeout(() => heading?.focus({ preventScroll: false }), 40);
        }
    };

    form.querySelectorAll(".quote-option").forEach((button) => {
        button.addEventListener("click", () => setChoice(button));
    });

    form.querySelectorAll("[data-next]").forEach((button) => {
        button.addEventListener("click", () => {
            if (validateStep(currentStep)) showStep(currentStep + 1);
        });
    });

    form.querySelectorAll("[data-back]").forEach((button) => {
        button.addEventListener("click", () => showStep(currentStep - 1));
    });

    form.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" || currentStep >= steps.length - 1 || event.target instanceof HTMLButtonElement) return;
        event.preventDefault();
        if (validateStep(currentStep)) showStep(currentStep + 1);
    });

    plateInput?.addEventListener("input", () => {
        plateInput.value = plateInput.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 7);
    });

    zipInput?.addEventListener("input", () => {
        const digits = zipInput.value.replace(/\D/g, "").slice(0, 8);
        zipInput.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    });

    phoneInput?.addEventListener("input", () => {
        let digits = phoneInput.value.replace(/\D/g, "").slice(0, 13);
        if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
        digits = digits.slice(0, 11);
        const area = digits.slice(0, 2);
        const first = digits.length > 10 ? digits.slice(2, 7) : digits.slice(2, 6);
        const last = digits.length > 10 ? digits.slice(7) : digits.slice(6);

        if (!digits.length) phoneInput.value = "";
        else if (digits.length < 3) phoneInput.value = `(${area}`;
        else if (!last) phoneInput.value = `(${area}) ${first}`;
        else phoneInput.value = `(${area}) ${first}-${last}`;
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!validateStep(currentStep)) return;

        const data = new FormData(form);
        const clean = (value, maxLength = 120) => String(value || "").replace(/[\r\n]+/g, " ").trim().slice(0, maxLength);
        const messageLines = [
            "Olá! Vim pela página de Seguro Auto da GLID e quero solicitar uma cotação.",
            "",
            `Veículo: ${clean(data.get("veiculo"))}`,
            `Modalidade: ${clean(data.get("modalidade"))}`,
            `Placa: ${clean(data.get("placa")) || "Não informada / veículo sem placa"}`,
            `CEP de pernoite: ${clean(data.get("cep"))}`,
            `Uso principal: ${clean(data.get("uso"))}`
        ];

        const renewalDate = clean(data.get("vencimento"));
        if (renewalDate) messageLines.push(`Vencimento da apólice: ${renewalDate}`);

        messageLines.push(
            "",
            `Nome: ${clean(data.get("nome"))}`,
            `WhatsApp: ${clean(data.get("whatsapp"))}`,
            `E-mail: ${clean(data.get("email")) || "Não informado"}`,
            `Melhor horário: ${clean(data.get("horario"))}`,
            "",
            "Quero receber as cotações retornadas comparadas por preço, cobertura e franquia."
        );

        if (attribution) messageLines.push("", `Origem da visita: ${attribution}`);

        if (status) status.textContent = "Abrindo o WhatsApp para você revisar e enviar a mensagem…";
        window.location.href = `https://wa.me/557731420005?text=${encodeURIComponent(messageLines.join("\n"))}`;
    });

    showStep(0, false);
})();
