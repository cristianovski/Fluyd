(() => {
    const form = document.querySelector("#financing-planner");
    if (!form) return;

    const pageType = document.body.dataset.financingType;
    const isAuto = pageType === "auto";
    const settings = isAuto
        ? { minimumFinancing: 1000, initialAsset: 80000, initialDown: 16000 }
        : { minimumFinancing: 10000, initialAsset: 400000, initialDown: 80000 };

    const steps = [...form.querySelectorAll("[data-step]")];
    const progressItems = [...document.querySelectorAll("[data-progress]")];
    const profileNext = document.querySelector("#profile-next");
    const valuesNext = document.querySelector("#values-next");
    const resultButton = document.querySelector("#planning-result-button");
    const resultPanel = document.querySelector("#planning-result");
    const restartButton = document.querySelector("#restart-planner");
    const termButtons = [...form.querySelectorAll("[data-term]")];
    const assetInput = document.querySelector("#asset-value");
    const assetOutput = document.querySelector("#asset-output");
    const downInput = document.querySelector("#down-payment");
    const downOutput = document.querySelector("#down-output");
    const incomeInput = document.querySelector("#family-income");
    const incomeOutput = document.querySelector("#income-output");
    const manualValueInputs = [...form.querySelectorAll("[data-range-input]")];
    const valuesSummary = document.querySelector("#values-summary");
    const termError = document.querySelector("#term-error");
    const profileError = document.querySelector("#profile-error");
    const stepThreeError = document.querySelector("#step-three-error");
    const whatsappFloat = document.querySelector("#finance-whatsapp-float");
    const query = new URLSearchParams(window.location.search);
    const cleanAttribution = (value) => value?.replace(/[\r\n]/g, " ").slice(0, 80);
    const attribution = [
        cleanAttribution(query.get("utm_source")),
        cleanAttribution(query.get("utm_medium")),
        cleanAttribution(query.get("utm_campaign")),
        cleanAttribution(query.get("utm_content")),
        cleanAttribution(query.get("utm_term"))
    ].filter(Boolean).join(" / ");

    const wholeMoney = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0
    });

    const state = { term: null, result: null };

    const valueOf = (input) => Number(input?.value || 0);
    const textFor = (name) => {
        const field = form.elements.namedItem(name);
        if (!field) return "Não informado";
        if (field.tagName === "SELECT") return field.options[field.selectedIndex]?.text || "Não informado";
        return String(field.value || "Não informado");
    };

    const setPressed = (buttons, selected) => {
        buttons.forEach((button) => {
            const active = button === selected;
            button.classList.toggle("is-selected", active);
            button.setAttribute("aria-pressed", String(active));
        });
    };

    const focusHeading = (container) => {
        window.requestAnimationFrame(() => container?.querySelector("h3[tabindex='-1']")?.focus());
    };

    const showStep = (number) => {
        steps.forEach((step) => {
            step.hidden = Number(step.dataset.step) !== number;
        });
        resultPanel.hidden = number !== 4;

        progressItems.forEach((item) => {
            const itemNumber = Number(item.dataset.progress);
            item.classList.toggle("is-active", number <= 3 && itemNumber === number);
            item.classList.toggle("is-complete", number > itemNumber);
            if (number <= 3 && itemNumber === number) item.setAttribute("aria-current", "step");
            else item.removeAttribute("aria-current");
        });

        const current = number === 4 ? resultPanel : steps.find((step) => Number(step.dataset.step) === number);
        focusHeading(current);
    };

    const validateRequired = (selector, error) => {
        const fields = [...form.querySelectorAll(selector)];
        fields.forEach((field) => field.setAttribute("aria-invalid", String(!field.checkValidity())));
        const invalid = fields.find((field) => !field.checkValidity());
        if (invalid) {
            if (error) error.hidden = false;
            invalid.focus();
            return false;
        }
        if (error) error.hidden = true;
        return true;
    };

    const updatePlanningValues = () => {
        const asset = valueOf(assetInput);
        const maximumDown = Math.max(0, asset - settings.minimumFinancing);
        downInput.max = String(maximumDown);
        if (valueOf(downInput) > maximumDown) downInput.value = String(maximumDown);

        const down = valueOf(downInput);
        const financed = Math.max(0, asset - down);
        const entryPercent = asset > 0 ? (down / asset) * 100 : 0;

        assetOutput.textContent = wholeMoney.format(asset);
        downOutput.textContent = wholeMoney.format(down);
        assetInput.setAttribute("aria-valuetext", wholeMoney.format(asset));
        downInput.setAttribute("aria-valuetext", wholeMoney.format(down));
        if (valuesSummary) {
            valuesSummary.textContent = `Valor pretendido para financiamento: ${wholeMoney.format(financed)} · Entrada equivalente a ${entryPercent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do bem.`;
        }

        if (incomeInput && incomeOutput) {
            const income = valueOf(incomeInput);
            incomeOutput.textContent = wholeMoney.format(income);
            incomeInput.setAttribute("aria-valuetext", wholeMoney.format(income));
        }

        manualValueInputs.forEach((manualInput) => {
            const rangeInput = document.querySelector(`#${manualInput.dataset.rangeInput}`);
            if (rangeInput) {
                manualInput.min = rangeInput.min;
                manualInput.max = rangeInput.max;
                manualInput.step = rangeInput.step;
                manualInput.value = rangeInput.value;
            }
        });
    };

    const profileLabel = () => {
        if (isAuto) return `${textFor("tipo_bem")} · ${textFor("condicao")} · ${textFor("origem")}`;
        return `${textFor("objetivo")} · ${textFor("tipo_imovel")}`;
    };

    const renderResult = () => {
        const asset = valueOf(assetInput);
        const down = valueOf(downInput);
        const financed = Math.max(0, asset - down);
        const entryPercent = asset > 0 ? (down / asset) * 100 : 0;
        state.result = { asset, down, financed, entryPercent, income: valueOf(incomeInput) };

        document.querySelector("#result-profile").textContent = profileLabel();
        document.querySelector("#result-financed").textContent = wholeMoney.format(financed);
        document.querySelector("#result-asset").textContent = wholeMoney.format(asset);
        document.querySelector("#result-entry").innerHTML = `${wholeMoney.format(down)}<span class="result-entry-detail">${entryPercent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do valor informado</span>`;
        document.querySelector("#result-term").textContent = `${state.term} meses`;

        const incomeResult = document.querySelector("#result-income");
        if (incomeResult) incomeResult.textContent = wholeMoney.format(state.result.income);

        const ratioResult = document.querySelector("#result-ratio");
        if (ratioResult) ratioResult.textContent = `${(100 - entryPercent).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do valor informado`;

        showStep(4);
        whatsappFloat?.classList.add("is-planner-result");
    };

    const buildMessage = () => {
        const data = new FormData(form);
        const result = state.result;
        const lines = [
            isAuto
                ? "Olá! Montei um planejamento inicial de financiamento de veículo no site da GLID e quero continuar a análise."
                : "Olá! Montei um planejamento inicial de financiamento imobiliário no site da GLID e quero continuar a análise.",
            "",
            `Nome: ${data.get("nome")}`,
            `Cidade/UF: ${data.get("cidade")}`,
            "",
            `Cenário: ${profileLabel()}`,
            `Valor do bem: ${wholeMoney.format(result.asset)}`,
            `Entrada prevista: ${wholeMoney.format(result.down)} (${result.entryPercent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)`,
            `Valor pretendido para financiamento: ${wholeMoney.format(result.financed)}`,
            `Prazo de planejamento: ${state.term} meses`
        ];

        if (isAuto) {
            lines.push(`Previsão de compra: ${textFor("previsao")}`);
        } else {
            lines.push(`Renda familiar aproximada: ${wholeMoney.format(result.income)}`);
            lines.push(`Interesse em usar FGTS: ${textFor("fgts")}`);
        }

        lines.push(
            "",
            "Entendo que este planejamento não é proposta nem garantia de aprovação. Taxa, CET, entrada, prazo, parcela e demais condições serão definidos pela instituição financeira após análise do cliente e do bem."
        );

        if (attribution) lines.push("", `Origem da visita: ${attribution}`);

        return lines.join("\n");
    };

    form.querySelectorAll("[data-required-step='1']").forEach((field) => {
        field.addEventListener("change", () => {
            const group = [...form.querySelectorAll("[data-required-step='1']")];
            const valid = group.every((item) => item.checkValidity());
            profileNext.disabled = !valid;
            field.setAttribute("aria-invalid", String(!field.checkValidity()));
            if (valid) profileError.hidden = true;
        });
    });

    profileNext.addEventListener("click", () => {
        if (!validateRequired("[data-required-step='1']", profileError)) return;
        showStep(2);
    });

    assetInput.addEventListener("input", updatePlanningValues);
    downInput.addEventListener("input", updatePlanningValues);
    incomeInput?.addEventListener("input", updatePlanningValues);

    manualValueInputs.forEach((manualInput) => {
        manualInput.addEventListener("change", () => {
            const rangeInput = document.querySelector(`#${manualInput.dataset.rangeInput}`);
            if (!rangeInput) return;
            const requested = Number(manualInput.value);
            const minimum = Number(rangeInput.min);
            const maximum = Number(rangeInput.max);
            rangeInput.value = String(Math.min(maximum, Math.max(minimum, Number.isFinite(requested) ? requested : minimum)));
            updatePlanningValues();
        });
    });

    valuesNext.addEventListener("click", () => {
        updatePlanningValues();
        showStep(3);
    });

    termButtons.forEach((button) => {
        button.addEventListener("click", () => {
            state.term = Number(button.dataset.term);
            setPressed(termButtons, button);
            termError.hidden = true;
            resultButton.disabled = false;
        });
    });

    form.querySelectorAll("[data-required-step='3']").forEach((field) => {
        const clearStepError = () => {
            field.setAttribute("aria-invalid", String(!field.checkValidity()));
            const valid = [...form.querySelectorAll("[data-required-step='3']")].every((item) => item.checkValidity());
            if (valid) stepThreeError.hidden = true;
        };
        field.addEventListener("input", clearStepError);
        field.addEventListener("change", clearStepError);
    });

    resultButton.addEventListener("click", () => {
        if (!state.term) {
            termError.hidden = false;
            return;
        }
        if (!validateRequired("[data-required-step='3']", stepThreeError)) return;
        renderResult();
    });

    form.querySelectorAll("[data-back]").forEach((button) => {
        button.addEventListener("click", () => showStep(Number(button.dataset.back)));
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (resultPanel.hidden || !state.result) return;
        if (!form.reportValidity()) return;
        window.location.href = `https://wa.me/557731420005?text=${encodeURIComponent(buildMessage())}`;
    });

    restartButton.addEventListener("click", () => {
        form.reset();
        state.term = null;
        state.result = null;
        assetInput.value = String(settings.initialAsset);
        downInput.value = String(settings.initialDown);
        setPressed(termButtons, null);
        resultButton.disabled = true;
        profileNext.disabled = true;
        profileError.hidden = true;
        termError.hidden = true;
        stepThreeError.hidden = true;
        form.querySelectorAll("[aria-invalid]").forEach((field) => field.removeAttribute("aria-invalid"));
        whatsappFloat?.classList.remove("is-planner-result");
        updatePlanningValues();
        showStep(1);
    });

    updatePlanningValues();
})();
