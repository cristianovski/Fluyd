(() => {
    const SETTINGS = {
        tableReference: "29/08/2026",
        amount: { min: 1000, max: 100000, step: 500, initial: 10000 },
        profiles: {
            inss: {
                label: "Beneficiário INSS",
                minimumRate: 0.0165,
                referenceRate: 0.0185,
                maximumRate: 0.0185,
                allowedTerms: [36, 48, 60, 72, 84, 96, 108]
            },
            siape: {
                label: "Servidor federal - SIAPE",
                minimumRate: 0.0155,
                referenceRate: 0.0175,
                maximumRate: 0.018,
                allowedTerms: [36, 48, 60, 72, 84, 96, 108, 120]
            }
        }
    };

    const form = document.querySelector("#loan-simulator");
    if (!form) return;

    const profileButtons = [...form.querySelectorAll("[data-profile]")];
    const termButtons = [...form.querySelectorAll("[data-term]")];
    const stepPanels = [...form.querySelectorAll("[data-step]")];
    const progressItems = [...form.querySelectorAll("[data-progress]")];
    const profileNext = document.querySelector("#profile-next");
    const amountNext = document.querySelector("#amount-next");
    const resultButton = document.querySelector("#result-button");
    const amountInput = document.querySelector("#loan-amount");
    const amountOutput = document.querySelector("#amount-output");
    const profileError = document.querySelector("#profile-error");
    const termError = document.querySelector("#term-error");
    const resultPanel = document.querySelector("#simulator-result");
    const resultTitle = document.querySelector("#result-title");
    const resultProfile = document.querySelector("#result-profile");
    const resultInstallment = document.querySelector("#result-installment");
    const resultAmount = document.querySelector("#result-amount");
    const resultTerm = document.querySelector("#result-term");
    const resultReference = document.querySelector("#result-reference");
    const resultRateRange = document.querySelector("#result-rate-range");
    const resultReferenceRate = document.querySelector("#result-reference-rate");
    const resultTotalRange = document.querySelector("#result-total-range");
    const rateReferenceDate = document.querySelector("#rate-reference-date");
    const restartButton = document.querySelector("#restart-simulator");
    const whatsappFloat = document.querySelector("#loan-whatsapp-float");

    const state = {
        profile: null,
        amount: SETTINGS.amount.initial,
        term: null,
        result: null
    };

    if (rateReferenceDate) rateReferenceDate.textContent = SETTINGS.tableReference;

    const money = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const wholeMoney = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0
    });

    const getProfile = () => SETTINGS.profiles[state.profile];

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
        window.requestAnimationFrame(() => target?.focus());
    };

    const monthlyPayment = (principal, monthlyRate, installments) => {
        if (!Number.isFinite(principal) || principal <= 0) return null;
        if (!Number.isFinite(installments) || installments <= 0 || !Number.isInteger(installments)) return null;
        if (!Number.isFinite(monthlyRate) || monthlyRate < 0) return null;
        if (monthlyRate === 0) return principal / installments;

        return principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -installments)));
    };

    const effectiveAnnualRate = (monthlyRate) => Math.pow(1 + monthlyRate, 12) - 1;
    const formatRate = (rate) => `${(rate * 100).toFixed(2).replace(".", ",")}%`;
    const roundCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

    const updateAmountOutput = () => {
        const value = Number(amountInput.value);
        state.amount = value;
        amountOutput.textContent = wholeMoney.format(value);
        amountInput.setAttribute("aria-valuetext", wholeMoney.format(value));
    };

    const selectProfile = (profileKey, button) => {
        if (!SETTINGS.profiles[profileKey]) return;
        state.profile = profileKey;
        state.result = null;
        setPressed(profileButtons, button);
        updateTermAvailability();
        profileNext.disabled = false;
        profileError.hidden = true;
    };

    const updateTermAvailability = () => {
        const profile = getProfile();
        if (!profile) return;

        termButtons.forEach((button) => {
            const term = Number(button.dataset.term);
            const available = profile.allowedTerms.includes(term);
            button.hidden = !available;
            button.disabled = !available;
        });

        if (state.term && !profile.allowedTerms.includes(state.term)) {
            state.term = null;
            setPressed(termButtons, null);
            resultButton.disabled = true;
        }
    };

    const selectTerm = (term, button) => {
        const profile = getProfile();
        if (!profile?.allowedTerms.includes(term)) return;
        state.term = term;
        state.result = null;
        setPressed(termButtons, button);
        resultButton.disabled = false;
        termError.hidden = true;
    };

    const calculateResult = () => {
        const profile = getProfile();
        if (!profile || !profile.allowedTerms.includes(state.term)) return null;

        const minimumPayment = monthlyPayment(state.amount, profile.minimumRate, state.term);
        const referencePayment = monthlyPayment(state.amount, profile.referenceRate, state.term);
        const maximumPayment = monthlyPayment(state.amount, profile.maximumRate, state.term);

        if (![minimumPayment, referencePayment, maximumPayment].every(Number.isFinite)) return null;

        const roundedMinimumPayment = roundCurrency(minimumPayment);
        const roundedReferencePayment = roundCurrency(referencePayment);
        const roundedMaximumPayment = roundCurrency(maximumPayment);

        return {
            minimumPayment: roundedMinimumPayment,
            referencePayment: roundedReferencePayment,
            maximumPayment: roundedMaximumPayment,
            minimumTotal: roundCurrency(roundedMinimumPayment * state.term),
            maximumTotal: roundCurrency(roundedMaximumPayment * state.term)
        };
    };

    const renderResult = () => {
        const profile = getProfile();
        const calculation = calculateResult();
        if (!profile || !calculation) return;

        state.result = calculation;
        resultProfile.textContent = profile.label;
        resultInstallment.textContent = `${money.format(calculation.minimumPayment)} a ${money.format(calculation.maximumPayment)}`;
        resultAmount.textContent = wholeMoney.format(state.amount);
        resultTerm.textContent = `${state.term} meses`;
        resultReference.textContent = `aproximadamente ${money.format(calculation.referencePayment)} por mês`;

        const annualMinimum = effectiveAnnualRate(profile.minimumRate);
        const annualMaximum = effectiveAnnualRate(profile.maximumRate);
        resultRateRange.textContent = `${formatRate(profile.minimumRate)} a ${formatRate(profile.maximumRate)} a.m. (${formatRate(annualMinimum)} a ${formatRate(annualMaximum)} a.a. efetivos)`;
        resultReferenceRate.textContent = `${formatRate(profile.referenceRate)} ao mês`;
        resultTotalRange.textContent = `${money.format(calculation.minimumTotal)} a ${money.format(calculation.maximumTotal)}`;

        showStep(4);
        if (whatsappFloat) whatsappFloat.classList.add("is-simulator-result");
    };

    const buildMessage = ({ includeContact = false } = {}) => {
        const profile = getProfile();
        const calculation = state.result;
        if (!profile || !calculation) return "";

        const lines = [
            "Olá! Fiz uma simulação inicial de novo consignado no site da GLID e quero solicitar uma análise personalizada.",
            "",
            `Perfil: ${profile.label}`,
            `Valor desejado: ${wholeMoney.format(state.amount)}`,
            `Prazo de referência: ${state.term} meses`,
            `Parcela estimada: ${money.format(calculation.minimumPayment)} a ${money.format(calculation.maximumPayment)} por mês`,
            `Taxas consideradas: ${formatRate(profile.minimumRate)} a ${formatRate(profile.maximumRate)} ao mês`,
            `Data da referência: ${SETTINGS.tableReference}`,
            "",
            "Entendo que esta é uma estimativa, não uma proposta ou garantia de aprovação, e que a condição final e o CET dependem da análise da instituição financeira."
        ];

        if (includeContact) {
            const data = new FormData(form);
            lines.splice(2, 0,
                `Nome: ${data.get("nome")}`,
                `Cidade/UF: ${data.get("cidade")}`,
                ""
            );
        }

        return lines.join("\n");
    };

    profileButtons.forEach((button) => {
        button.addEventListener("click", () => selectProfile(button.dataset.profile, button));
    });

    termButtons.forEach((button) => {
        button.addEventListener("click", () => selectTerm(Number(button.dataset.term), button));
    });

    profileNext.addEventListener("click", () => {
        if (!state.profile) {
            profileError.hidden = false;
            return;
        }
        showStep(2);
    });

    amountInput.addEventListener("input", updateAmountOutput);

    amountNext.addEventListener("click", () => {
        const amount = Number(amountInput.value);
        if (!Number.isFinite(amount) || amount < SETTINGS.amount.min || amount > SETTINGS.amount.max) return;
        state.amount = amount;
        showStep(3);
    });

    resultButton.addEventListener("click", () => {
        if (!state.term) {
            termError.hidden = false;
            return;
        }
        renderResult();
    });

    form.querySelectorAll("[data-back]").forEach((button) => {
        button.addEventListener("click", () => showStep(Number(button.dataset.back)));
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (resultPanel.hidden || !state.result) return;
        if (!form.reportValidity()) return;

        window.location.href = `https://wa.me/557731420005?text=${encodeURIComponent(buildMessage({ includeContact: true }))}`;
    });

    restartButton.addEventListener("click", () => {
        form.reset();
        state.profile = null;
        state.amount = SETTINGS.amount.initial;
        state.term = null;
        state.result = null;
        setPressed(profileButtons, null);
        setPressed(termButtons, null);
        profileNext.disabled = true;
        resultButton.disabled = true;
        profileError.hidden = true;
        termError.hidden = true;
        amountInput.value = String(SETTINGS.amount.initial);
        updateAmountOutput();

        if (whatsappFloat) whatsappFloat.classList.remove("is-simulator-result");
        showStep(1);
    });

    updateAmountOutput();
})();
