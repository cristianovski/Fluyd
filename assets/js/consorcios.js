(() => {
    const SCENARIOS = window.GLID_CONSORTIUM_SCENARIOS;
    const CALCULATOR = window.GLID_CONSORTIUM_CALCULATOR;
    if (!SCENARIOS || typeof CALCULATOR?.calculate !== "function") return;

    const form = document.querySelector("#consortium-simulator");
    if (!form) return;

    const categoryButtons = [...form.querySelectorAll("[data-category]")];
    const momentButtons = [...form.querySelectorAll("[data-moment]")];
    const stepPanels = [...form.querySelectorAll("[data-step]")];
    const progressItems = [...document.querySelectorAll("[data-progress]")];
    const categoryNext = document.querySelector("#category-next");
    const creditNext = document.querySelector("#credit-next");
    const resultButton = document.querySelector("#result-button");
    const creditRange = document.querySelector("#credit-range");
    const creditOutput = document.querySelector("#credit-output");
    const creditMin = document.querySelector("#credit-min");
    const creditMax = document.querySelector("#credit-max");
    const urgencyWarning = document.querySelector("#urgency-warning");
    const categoryError = document.querySelector("#category-error");
    const momentError = document.querySelector("#moment-error");
    const resultPanel = document.querySelector("#simulator-result");
    const resultTitle = document.querySelector("#result-title");
    const resultCategory = document.querySelector("#result-category");
    const resultCredit = document.querySelector("#result-credit");
    const resultTerm = document.querySelector("#result-term");
    const resultInstallment = document.querySelector("#result-installment");
    const resultContext = document.querySelector("#result-context");
    const restartButton = document.querySelector("#restart-simulator");
    const whatsappFloat = document.querySelector("#consortium-whatsapp-float");
    const query = new URLSearchParams(window.location.search);

    const state = {
        category: null,
        optionIndex: 1,
        moment: null
    };

    const money = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0
    });

    const momentLabels = {
        urgente: "O quanto antes",
        meses: "Nos próximos meses",
        flexivel: "Sem data definida"
    };

    const emit = (eventName) => {
        if (!Array.isArray(window.dataLayer)) return;
        window.dataLayer.push({
            event: eventName,
            consortium_category: state.category || undefined
        });
    };

    const cleanAttribution = (value) => value?.replace(/[\r\n]/g, " ").slice(0, 80);

    const attribution = [
        cleanAttribution(query.get("utm_source")),
        cleanAttribution(query.get("utm_medium")),
        cleanAttribution(query.get("utm_campaign")),
        cleanAttribution(query.get("utm_content")),
        cleanAttribution(query.get("utm_term"))
    ].filter(Boolean).join(" / ");

    const getCategory = () => SCENARIOS.categories[state.category];
    const getOption = () => getCategory()?.options[state.optionIndex];
    const getPaymentRange = (option) => {
        const feePercent = SCENARIOS.assumptions.administrationFeePercent;
        const shorterPlan = CALCULATOR.calculate({
            credit: option.credit,
            term: option.term[0],
            feePercent
        });
        const longerPlan = CALCULATOR.calculate({
            credit: option.credit,
            term: option.term[1],
            feePercent
        });
        return [longerPlan.initialInstallment, shorterPlan.initialInstallment];
    };

    const setPressed = (buttons, activeButton) => {
        buttons.forEach((button) => {
            const selected = button === activeButton;
            button.classList.toggle("is-selected", selected);
            button.setAttribute("aria-pressed", String(selected));
        });
    };

    const updateProgress = (currentStep) => {
        progressItems.forEach((item) => {
            const itemStep = Number(item.dataset.progress);
            item.classList.toggle("is-active", itemStep === currentStep);
            item.classList.toggle("is-complete", itemStep < currentStep || currentStep === 4);
            if (itemStep === currentStep) item.setAttribute("aria-current", "step");
            else item.removeAttribute("aria-current");
        });
    };

    const showStep = (step, moveFocus = true) => {
        stepPanels.forEach((panel) => {
            panel.hidden = Number(panel.dataset.step) !== step;
        });
        resultPanel.hidden = step !== 4;
        updateProgress(step);

        if (!moveFocus) return;
        const target = step === 4
            ? resultTitle
            : form.querySelector(`[data-step="${step}"] h3`);
        window.requestAnimationFrame(() => target?.focus({ preventScroll: true }));
    };

    const renderCreditSelector = () => {
        const category = getCategory();
        if (!category) return;

        const lastIndex = category.options.length - 1;
        state.optionIndex = Math.min(Math.max(state.optionIndex, 0), lastIndex);
        creditRange.min = "0";
        creditRange.max = String(lastIndex);
        creditRange.value = String(state.optionIndex);

        const current = category.options[state.optionIndex];
        creditOutput.textContent = money.format(current.credit);
        creditRange.setAttribute("aria-valuetext", money.format(current.credit));
        creditMin.textContent = money.format(category.options[0].credit);
        creditMax.textContent = money.format(category.options[lastIndex].credit);
    };

    const selectCategory = (categoryKey, button) => {
        if (!SCENARIOS.categories[categoryKey]) return;
        const isFirstSelection = !state.category;
        state.category = categoryKey;
        state.optionIndex = 1;
        setPressed(categoryButtons, button);
        categoryNext.disabled = false;
        categoryError.hidden = true;
        renderCreditSelector();
        if (isFirstSelection) emit("simulator_start");
        emit("consortium_category_select");
    };

    const selectMoment = (moment, button) => {
        state.moment = moment;
        setPressed(momentButtons, button);
        resultButton.disabled = false;
        momentError.hidden = true;
        urgencyWarning.hidden = moment !== "urgente";
        if (moment === "urgente") emit("consortium_urgency_warning");
    };

    const buildMessage = ({ includeContact = false } = {}) => {
        const category = getCategory();
        const option = getOption();
        const payment = getPaymentRange(option);
        const lines = [
            "Olá! Fiz uma simulação inicial de consórcio no site da GLID e quero confirmar as condições atuais.",
            "",
            `Categoria: ${category.label}`,
            `Crédito de referência: ${money.format(option.credit)}`,
            `Prazo estimado: ${option.term[0]} a ${option.term[1]} meses`,
            `Parcela estimada: ${money.format(payment[0])} a ${money.format(payment[1])} por mês`,
            `Taxa de administração referencial: ${SCENARIOS.assumptions.administrationFeePercent}%`,
            `Momento da compra: ${momentLabels[state.moment]}`,
            "",
            "Entendo que esta é uma estimativa e que contemplação, valores, prazos e disponibilidade não são garantidos."
        ];

        if (includeContact) {
            const data = new FormData(form);
            lines.splice(2, 0,
                `Nome: ${data.get("nome")}`,
                `Cidade/UF: ${data.get("cidade")}`,
                ""
            );
        }

        if (attribution) lines.push("", `Origem da visita: ${attribution}`);
        return lines.join("\n");
    };

    const renderResult = () => {
        const category = getCategory();
        const option = getOption();
        if (!category || !option || !state.moment) return;
        const payment = getPaymentRange(option);

        resultCategory.textContent = category.label;
        resultCredit.textContent = money.format(option.credit);
        resultTerm.textContent = `${option.term[0]} a ${option.term[1]} meses`;
        resultInstallment.textContent = `${money.format(payment[0])} a ${money.format(payment[1])}`;

        resultContext.classList.toggle("is-caution", state.moment === "urgente");
        if (state.moment === "urgente") {
            resultContext.innerHTML = "<strong>Você indicou urgência.</strong> O cenário ajuda a entender valores, mas o consórcio não garante a compra em uma data determinada.";
        } else if (state.moment === "meses") {
            resultContext.textContent = "Você indicou que consegue planejar nos próximos meses. O consultor avaliará os grupos disponíveis e explicará os possíveis cenários.";
        } else {
            resultContext.textContent = "Sua flexibilidade de tempo permite avaliar diferentes combinações de crédito, prazo e parcela antes de decidir.";
        }

        showStep(4);
        emit("consortium_result_view");

        if (whatsappFloat) {
            whatsappFloat.href = `https://wa.me/557731420005?text=${encodeURIComponent(buildMessage())}`;
            whatsappFloat.setAttribute("aria-label", "Enviar esta simulação de consórcio pelo WhatsApp");
            whatsappFloat.classList.add("is-simulator-result");
            const label = whatsappFloat.querySelector("span");
            if (label) label.textContent = "Enviar simulação";
        }
    };

    categoryButtons.forEach((button) => {
        button.addEventListener("click", () => selectCategory(button.dataset.category, button));
    });

    momentButtons.forEach((button) => {
        button.addEventListener("click", () => selectMoment(button.dataset.moment, button));
    });

    categoryNext.addEventListener("click", () => {
        if (!state.category) {
            categoryError.hidden = false;
            return;
        }
        renderCreditSelector();
        showStep(2);
    });

    creditRange.addEventListener("input", () => {
        state.optionIndex = Number(creditRange.value);
        const option = getOption();
        if (option) creditOutput.textContent = money.format(option.credit);
    });

    creditNext.addEventListener("click", () => {
        state.optionIndex = Number(creditRange.value);
        showStep(3);
    });

    resultButton.addEventListener("click", () => {
        if (!state.moment) {
            momentError.hidden = false;
            return;
        }
        renderResult();
    });

    form.querySelectorAll("[data-back]").forEach((button) => {
        button.addEventListener("click", () => showStep(Number(button.dataset.back)));
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (resultPanel.hidden) return;
        if (!form.reportValidity()) return;
        emit("consortium_whatsapp_intent");
        window.location.href = `https://wa.me/557731420005?text=${encodeURIComponent(buildMessage({ includeContact: true }))}`;
    });

    restartButton.addEventListener("click", () => {
        form.reset();
        state.category = null;
        state.optionIndex = 1;
        state.moment = null;
        setPressed(categoryButtons, null);
        setPressed(momentButtons, null);
        categoryNext.disabled = true;
        resultButton.disabled = true;
        categoryError.hidden = true;
        momentError.hidden = true;
        urgencyWarning.hidden = true;

        if (whatsappFloat) {
            whatsappFloat.href = "https://wa.me/557731420005?text=Ol%C3%A1%21%20Vim%20pela%20p%C3%A1gina%20de%20cons%C3%B3rcios%20da%20GLID%20e%20quero%20tirar%20uma%20d%C3%BAvida.";
            whatsappFloat.setAttribute("aria-label", "Tirar uma dúvida sobre consórcio pelo WhatsApp");
            whatsappFloat.classList.remove("is-simulator-result");
            const label = whatsappFloat.querySelector("span");
            if (label) label.textContent = "Tirar uma dúvida";
        }

        showStep(1);
        document.querySelector("#simulador")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    const requestedCategory = query.get("categoria") || query.get("tipo");
    const categoryAliases = {
        auto: "automovel",
        carro: "automovel",
        automovel: "automovel",
        moto: "moto",
        motocicleta: "moto",
        imovel: "imovel"
    };

    const initialCategory = categoryAliases[requestedCategory?.toLowerCase()];
    if (initialCategory) {
        const initialButton = categoryButtons.find((button) => button.dataset.category === initialCategory);
        if (initialButton) selectCategory(initialCategory, initialButton);
    }

    showStep(1, false);
})();
