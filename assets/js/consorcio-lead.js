(() => {
    const SCENARIOS = window.GLID_CONSORTIUM_SCENARIOS;
    const CALCULATOR = window.GLID_CONSORTIUM_CALCULATOR;
    const form = document.querySelector("#lead-consortium-simulator");
    if (!form) return;

    if (
        !SCENARIOS?.assumptions
        || !SCENARIOS?.categories
        || typeof CALCULATOR?.calculate !== "function"
        || typeof CALCULATOR?.calculateReducedPlan !== "function"
    ) {
        form.innerHTML = '<div class="simulator-fallback" role="alert"><strong>O simulador está temporariamente indisponível.</strong><span>Você ainda pode solicitar uma análise diretamente com um consultor.</span><a class="button" href="https://wa.me/557731420005?text=Ol%C3%A1%21%20Quero%20simular%20um%20cons%C3%B3rcio%20com%20a%20GLID.">Falar com um consultor</a></div>';
        return;
    }

    const categoryButtons = [...form.querySelectorAll("[data-category]")];
    const modeButtons = [...form.querySelectorAll("[data-simulation-mode]")];
    const paymentPlanButtons = [...form.querySelectorAll("[data-payment-plan]")];
    const momentButtons = [...form.querySelectorAll("[data-moment]")];
    const stepPanels = [...form.querySelectorAll("[data-step]")];
    const progressItems = [...document.querySelectorAll("[data-progress]")];
    const categoryNext = document.querySelector("#category-next");
    const valuesNext = document.querySelector("#values-next");
    const resultButton = document.querySelector("#lead-result-button");
    const valueRange = document.querySelector("#lead-value-range");
    const valueLabel = document.querySelector("#lead-value-label");
    const valueOutput = document.querySelector("#lead-value-output");
    const valueMin = document.querySelector("#lead-value-min");
    const valueMax = document.querySelector("#lead-value-max");
    const termOptions = document.querySelector("#lead-term-options");
    const previewCredit = document.querySelector("#lead-preview-credit");
    const previewInstallmentLabel = document.querySelector("#lead-preview-installment-label");
    const previewInstallment = document.querySelector("#lead-preview-installment");
    const standardOptionValue = document.querySelector("#lead-standard-option-value");
    const reducedOptionValue = document.querySelector("#lead-reduced-option-value");
    const reducedValueNote = document.querySelector("#lead-reduced-value-note");
    const reducedValueWarning = document.querySelector("#lead-reduced-value-warning");
    const urgencyWarning = document.querySelector("#lead-urgency-warning");
    const categoryError = document.querySelector("#category-error");
    const qualificationError = document.querySelector("#qualification-error");
    const resultPanel = document.querySelector("#lead-simulator-result");
    const resultTitle = document.querySelector("#result-title");
    const resultCategory = document.querySelector("#lead-result-category");
    const resultCredit = document.querySelector("#lead-result-credit");
    const resultTerm = document.querySelector("#lead-result-term");
    const resultInstallmentLabel = document.querySelector("#lead-result-installment-label");
    const resultInstallment = document.querySelector("#lead-result-installment");
    const resultFee = document.querySelector("#lead-result-fee");
    const resultTotalPlan = document.querySelector("#lead-result-total-plan");
    const resultAfterReduced = document.querySelector("#lead-result-after-reduced");
    const resultReducedNote = document.querySelector("#lead-result-reduced-note");
    const resultReducedWarning = document.querySelector("#lead-result-reduced-warning");
    const resultContext = document.querySelector("#lead-result-context");
    const bidStrategy = document.querySelector("#lead-bid-strategy");
    const bidToggle = document.querySelector("#lead-bid-toggle");
    const bidContent = document.querySelector("#lead-bid-content");
    const ownBidInput = document.querySelector("#lead-own-bid-input");
    const ownBidHelp = document.querySelector("#lead-own-bid-help");
    const ownBidError = document.querySelector("#lead-own-bid-error");
    const useEmbedded = document.querySelector("#lead-use-embedded");
    const embeddedControl = document.querySelector("#lead-embedded-control");
    const embeddedRange = document.querySelector("#lead-embedded-range");
    const embeddedOutput = document.querySelector("#lead-embedded-output");
    const bidComposition = document.querySelector("#lead-bid-composition");
    const compositionOwn = document.querySelector("#lead-composition-own");
    const compositionEmbedded = document.querySelector("#lead-composition-embedded");
    const compositionTotal = document.querySelector("#lead-composition-total");
    const compositionPercent = document.querySelector("#lead-composition-percent");
    const compositionCredit = document.querySelector("#lead-composition-credit");
    const compositionCreditNote = document.querySelector("#lead-composition-credit-note");
    const bidImpact = document.querySelector("#lead-bid-impact");
    const resultBidSource = document.querySelector("#lead-result-bid-source");
    const resultReducedInstallment = document.querySelector("#lead-result-reduced-installment");
    const resultInstallmentSaving = document.querySelector("#lead-result-installment-saving");
    const resultReducedTerm = document.querySelector("#lead-result-reduced-term");
    const resultTermSaving = document.querySelector("#lead-result-term-saving");
    const combinationNote = document.querySelector("#lead-combination-note");
    const restartButton = document.querySelector("#lead-restart-simulator");
    const heroTitle = document.querySelector("#hero-title");
    const heroDescription = document.querySelector("#hero-description");
    const stickyCta = document.querySelector("#lead-sticky-cta");
    const query = new URLSearchParams(window.location.search);

    const state = {
        category: null,
        mode: "credit",
        valueIndex: 1,
        term: null,
        moment: null,
        reducedPlan: false,
        bidActive: false,
        ownBidValue: 0,
        useEmbedded: false,
        embeddedPercent: SCENARIOS.assumptions.embeddedReferenceMaxPercent
    };

    const money = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0
    });
    const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

    const momentLabels = {
        urgente: "O quanto antes",
        meses: "Nos próximos meses",
        flexivel: "Sem data definida"
    };

    const categoryAliases = {
        auto: "automovel",
        carro: "automovel",
        automovel: "automovel",
        veiculo: "automovel",
        moto: "moto",
        motocicleta: "moto",
        imovel: "imovel",
        casa: "imovel"
    };

    const categoryCopy = {
        automovel: {
            title: "Compare consórcios para automóvel com base no seu objetivo e orçamento.",
            description: "Veja uma estimativa de crédito, prazo e parcela para seu próximo veículo. Depois, receba uma análise humana das possibilidades disponíveis entre parceiros da GLID.",
            documentTitle: "Simule seu consórcio para automóvel | GLID"
        },
        moto: {
            title: "Compare consórcios para moto com base no seu objetivo e orçamento.",
            description: "Veja uma estimativa de crédito, prazo e parcela para sua moto. Depois, receba uma análise humana das possibilidades disponíveis entre parceiros da GLID.",
            documentTitle: "Simule seu consórcio para moto | GLID"
        },
        imovel: {
            title: "Compare consórcios para imóvel com base no seu objetivo e orçamento.",
            description: "Veja uma estimativa de crédito, prazo e parcela para casa, terreno ou construção. Depois, receba uma análise humana das possibilidades disponíveis entre parceiros da GLID.",
            documentTitle: "Simule seu consórcio para imóvel | GLID"
        }
    };

    const cleanAttribution = (value) => value?.replace(/[\r\n]/g, " ").slice(0, 80);
    const attribution = [
        cleanAttribution(query.get("utm_source")),
        cleanAttribution(query.get("utm_medium")),
        cleanAttribution(query.get("utm_campaign")),
        cleanAttribution(query.get("utm_content")),
        cleanAttribution(query.get("utm_term"))
    ].filter(Boolean).join(" / ");

    const floorTo = (value, increment) => Math.floor(value / increment) * increment;
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const plural = (value, singular, pluralForm) => value === 1 ? singular : pluralForm;
    const getCategory = () => SCENARIOS.categories[state.category];
    const getModeValues = () => {
        const category = getCategory();
        if (!category) return [];
        return state.mode === "credit" ? category.credits : category.installments;
    };

    const getBasePlan = () => {
        const category = getCategory();
        const values = getModeValues();
        const selectedValue = values[state.valueIndex];
        if (!category || !selectedValue || !state.term) return null;

        const feePercent = SCENARIOS.assumptions.administrationFeePercent;
        const feeRate = feePercent / 100;
        const credit = state.mode === "credit"
            ? selectedValue
            : floorTo(selectedValue * state.term / (1 + feeRate), category.creditRounding);
        const projection = CALCULATOR.calculate({
            credit,
            term: state.term,
            feePercent,
            bidPercent: 0,
            embeddedPercent: 0
        });

        return { ...projection, category, selectedValue };
    };

    const getReducedPlan = () => {
        const plan = getBasePlan();
        if (!plan) return null;
        return CALCULATOR.calculateReducedPlan({
            credit: plan.credit,
            term: plan.term,
            feePercent: plan.feePercent,
            commonFundPaymentPercent: SCENARIOS.assumptions.reducedCommonFundPaymentPercent
        });
    };

    const getBidPlan = () => {
        const plan = getBasePlan();
        if (!plan) return null;

        const embeddedPercent = state.useEmbedded
            ? clamp(Number(state.embeddedPercent) || 0, 0, SCENARIOS.assumptions.embeddedReferenceMaxPercent)
            : 0;
        const embeddedValue = plan.credit * embeddedPercent / 100;
        const totalBidLimit = plan.credit * SCENARIOS.assumptions.totalBidMaxPercent / 100;
        const maximumOwnValue = Math.max(0, totalBidLimit - embeddedValue);
        const ownBidValue = Number(state.ownBidValue) || 0;
        const totalBidValue = ownBidValue + embeddedValue;
        const valid = state.bidActive
            && ownBidValue > 0
            && ownBidValue <= maximumOwnValue
            && totalBidValue <= totalBidLimit;

        if (!valid) {
            return {
                valid: false,
                basePlan: plan,
                ownBidValue,
                embeddedPercent,
                embeddedValue,
                totalBidValue,
                totalBidLimit,
                maximumOwnValue
            };
        }

        const bidPercent = totalBidValue / plan.credit * 100;
        const projection = CALCULATOR.calculate({
            credit: plan.credit,
            term: plan.term,
            feePercent: plan.feePercent,
            bidPercent,
            embeddedPercent
        });

        return {
            ...projection,
            valid: true,
            basePlan: plan,
            ownBidValue,
            totalBidValue,
            totalBidLimit,
            maximumOwnValue
        };
    };

    const emit = (eventName, extra = {}) => {
        if (!Array.isArray(window.dataLayer)) return;
        const plan = getBasePlan();
        const bidPlan = getBidPlan();
        const reducedPlan = getReducedPlan();
        window.dataLayer.push({
            event: eventName,
            consortium_category: state.category || undefined,
            consortium_mode: state.mode,
            consortium_term: state.term || undefined,
            consortium_credit: plan ? Math.round(plan.credit) : undefined,
            consortium_moment: state.moment || undefined,
            consortium_reduced_plan: state.reducedPlan,
            consortium_reduced_initial_installment: state.reducedPlan && reducedPlan
                ? Math.round(reducedPlan.reducedInitialInstallment)
                : undefined,
            consortium_bid_source: bidPlan?.valid
                ? (bidPlan.embeddedValue > 0 ? "mixed" : "own")
                : undefined,
            consortium_bid_percent: bidPlan?.valid ? Number(bidPlan.bidPercent.toFixed(1)) : undefined,
            consortium_embedded_percent: bidPlan?.valid ? bidPlan.embeddedPercent : undefined,
            ...extra
        });
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
            item.classList.toggle("is-complete", itemStep < currentStep);
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
            : form.querySelector('[data-step="' + step + '"] h3');
        window.requestAnimationFrame(() => target?.focus());
    };

    const renderPlanPreview = () => {
        const plan = getBasePlan();
        const reducedPlan = getReducedPlan();
        if (!plan || !reducedPlan) return;

        const selectedInstallment = state.reducedPlan
            ? reducedPlan.reducedInitialInstallment
            : plan.initialInstallment;

        previewCredit.textContent = money.format(plan.credit);
        previewInstallmentLabel.textContent = state.reducedPlan
            ? "Parcela inicial reduzida"
            : "Parcela integral";
        previewInstallment.textContent = money.format(selectedInstallment) + " por mês";
        standardOptionValue.textContent = money.format(plan.initialInstallment) + " por mês";
        reducedOptionValue.textContent = money.format(reducedPlan.reducedInitialInstallment) + " por mês";
        reducedValueNote.hidden = !state.reducedPlan;
        reducedValueWarning.textContent = money.format(reducedPlan.deferredMonthlyAmount)
            + " do fundo comum por mês ficam adiados nesta hipótese e serão redistribuídos conforme o grupo.";
        setPressed(
            paymentPlanButtons,
            paymentPlanButtons.find((button) => button.dataset.paymentPlan === (state.reducedPlan ? "reduced" : "standard"))
        );
    };

    const renderTermOptions = () => {
        const category = getCategory();
        if (!category) return;
        if (!category.terms.includes(state.term)) state.term = category.defaultTerm;
        termOptions.innerHTML = category.terms.map((term) => (
            '<button class="term-option' + (term === state.term ? " is-selected" : "") + '" type="button" data-term="' + term + '" aria-pressed="' + String(term === state.term) + '"><strong>' + term + '</strong><small>meses</small></button>'
        )).join("");
    };

    const renderValueSelector = () => {
        const values = getModeValues();
        if (!values.length) return;
        state.valueIndex = clamp(state.valueIndex, 0, values.length - 1);
        valueRange.min = "0";
        valueRange.max = String(values.length - 1);
        valueRange.value = String(state.valueIndex);

        const selected = values[state.valueIndex];
        const isCreditMode = state.mode === "credit";
        const selectedLabel = isCreditMode ? money.format(selected) : money.format(selected) + " por mês";
        valueLabel.textContent = isCreditMode ? "Crédito desejado" : "Parcela integral de referência";
        valueOutput.textContent = selectedLabel;
        valueRange.setAttribute("aria-valuetext", selectedLabel);
        valueMin.textContent = money.format(values[0]) + (isCreditMode ? "" : "/mês");
        valueMax.textContent = money.format(values[values.length - 1]) + (isCreditMode ? "" : "/mês");
        renderPlanPreview();
    };

    const personalizeHero = (categoryKey) => {
        const copy = categoryCopy[categoryKey];
        if (!copy) return;
        heroTitle.textContent = copy.title;
        heroDescription.textContent = copy.description;
        document.title = copy.documentTitle;
    };

    const resetBidComposer = () => {
        state.bidActive = false;
        state.ownBidValue = 0;
        state.useEmbedded = false;
        state.embeddedPercent = SCENARIOS.assumptions.embeddedReferenceMaxPercent;

        bidStrategy.classList.remove("is-active");
        bidToggle.setAttribute("aria-pressed", "false");
        bidToggle.setAttribute("aria-expanded", "false");
        bidToggle.textContent = "Simular lance";
        bidContent.hidden = true;
        ownBidInput.value = "";
        ownBidInput.disabled = true;
        ownBidInput.required = false;
        ownBidInput.removeAttribute("aria-invalid");
        useEmbedded.checked = false;
        useEmbedded.disabled = true;
        embeddedRange.value = String(state.embeddedPercent);
        embeddedRange.disabled = true;
        embeddedControl.hidden = true;
        ownBidError.hidden = true;
        bidComposition.hidden = true;
        bidImpact.hidden = true;
        combinationNote.hidden = true;
    };

    const resetQualification = () => {
        state.moment = null;
        urgencyWarning.hidden = true;
        qualificationError.hidden = true;
        resultButton.disabled = true;
        setPressed(momentButtons, null);
        resetBidComposer();
    };

    const selectCategory = (categoryKey, button, track = true) => {
        if (!SCENARIOS.categories[categoryKey]) return;
        const firstTrackedSelection = !state.category && track;
        state.category = categoryKey;
        state.mode = "credit";
        state.valueIndex = getCategory().defaultCreditIndex;
        state.term = getCategory().defaultTerm;
        state.reducedPlan = false;
        setPressed(categoryButtons, button);
        setPressed(modeButtons, modeButtons.find((item) => item.dataset.simulationMode === "credit"));
        categoryNext.disabled = false;
        categoryError.hidden = true;
        resetQualification();
        renderTermOptions();
        renderValueSelector();
        personalizeHero(categoryKey);
        if (firstTrackedSelection) emit("consortium_lead_simulator_start");
        if (track) emit("consortium_lead_category_select");
    };

    const selectMode = (mode, button) => {
        if (!getCategory() || !["credit", "installment"].includes(mode)) return;
        state.mode = mode;
        state.valueIndex = mode === "credit"
            ? getCategory().defaultCreditIndex
            : getCategory().defaultInstallmentIndex;
        setPressed(modeButtons, button);
        resetBidComposer();
        renderValueSelector();
        emit("consortium_lead_mode_select");
    };

    const selectTerm = (term, button) => {
        const category = getCategory();
        if (!category?.terms.includes(term)) return;
        state.term = term;
        setPressed([...termOptions.querySelectorAll("[data-term]")], button);
        resetBidComposer();
        renderPlanPreview();
        emit("consortium_lead_term_select");
    };

    const selectPaymentPlan = (paymentPlan, button) => {
        if (!["standard", "reduced"].includes(paymentPlan)) return;
        state.reducedPlan = paymentPlan === "reduced";
        setPressed(paymentPlanButtons, button);
        renderPlanPreview();
        emit("consortium_lead_payment_plan_select", {
            consortium_payment_plan: paymentPlan
        });
    };

    const selectMoment = (moment, button) => {
        state.moment = moment;
        setPressed(momentButtons, button);
        urgencyWarning.hidden = moment !== "urgente";
        resultButton.disabled = false;
        qualificationError.hidden = true;
        if (moment === "urgente") emit("consortium_lead_urgency_warning");
    };

    const buildResultContext = (plan) => {
        const parts = [];
        if (state.moment === "urgente") {
            parts.push('<strong>Você indicou urgência.</strong> O consórcio não garante a compra em uma data determinada. <a href="/financiamentos/">Avalie também o financiamento.</a>');
        } else if (state.moment === "meses") {
            parts.push("Você indicou que consegue planejar nos próximos meses. Um consultor poderá avaliar os grupos disponíveis e explicar os cenários atuais.");
        } else {
            parts.push("Sua flexibilidade permite comparar diferentes combinações antes de decidir.");
        }

        if (state.mode === "installment") {
            parts.push("A carta foi estimada a partir da parcela integral de referência de " + money.format(plan.selectedValue) + " e do prazo escolhido.");
        } else {
            parts.push("A parcela foi estimada a partir da carta e do prazo escolhidos.");
        }

        resultContext.classList.toggle("is-caution", state.moment === "urgente");
        resultContext.innerHTML = parts.join("<br>");
    };

    const renderSelectedPlan = () => {
        const plan = getBasePlan();
        const reducedPlan = getReducedPlan();
        if (!plan || !reducedPlan) return;

        resultInstallmentLabel.textContent = state.reducedPlan
            ? "Parcela inicial reduzida estimada"
            : "Parcela integral estimada";
        resultInstallment.textContent = money.format(
            state.reducedPlan ? reducedPlan.reducedInitialInstallment : plan.initialInstallment
        ) + " por mês";
        resultAfterReduced.hidden = !state.reducedPlan;
        resultReducedNote.hidden = !state.reducedPlan;
        resultReducedWarning.textContent = money.format(reducedPlan.deferredMonthlyAmount)
            + " do fundo comum por mês ficam adiados nesta hipótese. A diferença será redistribuída conforme o grupo.";
    };

    const renderBidComposer = (showError = false) => {
        const plan = getBasePlan();
        if (!plan) return;

        bidStrategy.classList.toggle("is-active", state.bidActive);
        bidToggle.setAttribute("aria-pressed", String(state.bidActive));
        bidToggle.setAttribute("aria-expanded", String(state.bidActive));
        bidToggle.textContent = state.bidActive ? "Remover lance" : "Simular lance";
        bidContent.hidden = !state.bidActive;
        ownBidInput.disabled = !state.bidActive;
        ownBidInput.required = state.bidActive;

        if (!state.bidActive) {
            ownBidInput.removeAttribute("aria-invalid");
            ownBidError.hidden = true;
            bidComposition.hidden = true;
            bidImpact.hidden = true;
            combinationNote.hidden = true;
            return;
        }

        let bidPlan = getBidPlan();
        const ownHasPositiveValue = state.ownBidValue > 0;
        if (!ownHasPositiveValue && state.useEmbedded) {
            state.useEmbedded = false;
            useEmbedded.checked = false;
            bidPlan = getBidPlan();
        }

        useEmbedded.disabled = !ownHasPositiveValue;
        embeddedRange.disabled = !state.useEmbedded || !ownHasPositiveValue;
        embeddedControl.hidden = !state.useEmbedded || !ownHasPositiveValue;
        embeddedRange.max = String(SCENARIOS.assumptions.embeddedReferenceMaxPercent);
        embeddedRange.value = String(state.embeddedPercent);
        embeddedOutput.textContent = state.embeddedPercent + "% · " + money.format(plan.credit * state.embeddedPercent / 100);
        embeddedRange.setAttribute("aria-valuetext", state.embeddedPercent + "% da carta, " + money.format(plan.credit * state.embeddedPercent / 100));

        const invalidOwnValue = ownBidInput.value !== "" && !bidPlan.valid;
        ownBidInput.max = String(Math.floor(bidPlan.maximumOwnValue));
        ownBidInput.setAttribute("aria-invalid", String(invalidOwnValue || (showError && !bidPlan.valid)));
        ownBidError.hidden = !(invalidOwnValue || (showError && !bidPlan.valid));
        ownBidHelp.textContent = "Nesta estimativa, os recursos próprios podem chegar a "
            + money.format(bidPlan.maximumOwnValue)
            + " para manter o lance total em até "
            + SCENARIOS.assumptions.totalBidMaxPercent
            + "% da carta.";

        bidComposition.hidden = !bidPlan.valid;
        bidImpact.hidden = !bidPlan.valid || state.reducedPlan;
        combinationNote.hidden = !bidPlan.valid || !state.reducedPlan;

        if (!bidPlan.valid) return;

        compositionOwn.textContent = money.format(bidPlan.ownBidValue);
        compositionEmbedded.textContent = bidPlan.embeddedValue > 0
            ? money.format(bidPlan.embeddedValue)
            : "Não utilizado";
        compositionTotal.textContent = money.format(bidPlan.totalBidValue);
        compositionPercent.textContent = percent.format(bidPlan.bidPercent) + "% da carta nesta estimativa";
        compositionCredit.textContent = money.format(bidPlan.availableCredit);
        compositionCreditNote.textContent = bidPlan.embeddedValue > 0
            ? money.format(bidPlan.embeddedValue) + " da carta seriam destinados à composição do lance."
            : "Com recursos próprios, a carta permanece integral para a compra.";

        if (!state.reducedPlan) {
            resultBidSource.textContent = bidPlan.embeddedValue > 0
                ? "Recursos próprios + " + bidPlan.embeddedPercent + "% da carta"
                : "Somente recursos próprios";
            resultReducedInstallment.textContent = money.format(bidPlan.reducedInstallment) + " por mês";
            resultInstallmentSaving.textContent = "Cerca de " + money.format(bidPlan.installmentSaving) + " a menos por mês";
            resultReducedTerm.textContent = "Cerca de " + bidPlan.reducedTerm + " meses";
            resultTermSaving.textContent = bidPlan.monthsSaved + " " + plural(bidPlan.monthsSaved, "mês", "meses") + " a menos";
        }
    };

    const renderResult = () => {
        const plan = getBasePlan();
        if (!plan || !state.moment) return;

        resultCategory.textContent = plan.category.label + " · " + momentLabels[state.moment];
        resultCredit.textContent = money.format(plan.credit);
        resultTerm.textContent = plan.term + " meses";
        resultFee.textContent = plan.feePercent + "% adotados nesta estimativa";
        resultTotalPlan.textContent = money.format(plan.totalPlan);
        resultTitle.textContent = "Veja a estimativa do seu plano";
        buildResultContext(plan);
        renderSelectedPlan();
        renderBidComposer();
        showStep(4);

        emit("consortium_lead_result_view");
        if (state.moment !== "urgente") emit("consortium_lead_qualified_result");
    };

    const buildMessage = () => {
        const plan = getBasePlan();
        const reducedPlan = getReducedPlan();
        const bidPlan = getBidPlan();
        const data = new FormData(form);
        const lines = [
            "Olá! Fiz uma simulação de consórcio na página da GLID e quero validar as possibilidades atuais com um consultor.",
            "",
            "Nome: " + data.get("nome"),
            "Cidade/UF: " + data.get("cidade"),
            "Melhor período: " + data.get("periodo"),
            "",
            "Categoria: " + plan.category.label,
            "Forma de simular: " + (state.mode === "credit" ? "pelo valor da carta" : "pelo orçamento mensal"),
            "Crédito de referência: " + money.format(plan.credit),
            "Prazo escolhido: " + plan.term + " meses",
            "Parcela integral estimada: " + money.format(plan.initialInstallment) + " por mês",
            "Taxa de administração adotada na estimativa: " + plan.feePercent + "%",
            "Momento da compra: " + momentLabels[state.moment]
        ];

        if (state.reducedPlan && reducedPlan) {
            lines.push(
                "",
                "Interesse: parcela inicial reduzida",
                "Parcela inicial reduzida estimada: " + money.format(reducedPlan.reducedInitialInstallment) + " por mês",
                "Hipótese do redutor: pagamento de " + reducedPlan.commonFundPaymentPercent + "% do fundo comum, com taxa administrativa integral",
                "Valor após a contemplação: a confirmar conforme o mês, o saldo redistribuído e as regras do grupo"
            );
        }

        if (bidPlan?.valid) {
            lines.push(
                "",
                "Composição de lance:",
                "Recursos próprios: " + money.format(bidPlan.ownBidValue),
                "Parte embutida da carta: " + money.format(bidPlan.embeddedValue),
                "Lance total simulado: " + money.format(bidPlan.totalBidValue) + " (" + percent.format(bidPlan.bidPercent) + "% da carta)",
                "Crédito estimado disponível para a compra: " + money.format(bidPlan.availableCredit)
            );

            if (state.reducedPlan) {
                lines.push("Parcela posterior não projetada, pois depende do mês da contemplação, do saldo redistribuído e das regras do grupo.");
            } else {
                lines.push(
                    "Projeção matemática mantendo o prazo: " + money.format(bidPlan.reducedInstallment) + " por mês",
                    "Projeção matemática mantendo a parcela: cerca de " + bidPlan.reducedTerm + " meses"
                );
            }
        }

        lines.push(
            "",
            "Entendo que esta é uma estimativa ilustrativa, sem garantia de contemplação, e que valores, limites, compatibilidade e forma de abatimento dependem do grupo, do contrato e da administradora."
        );
        if (attribution) lines.push("", "Origem da visita: " + attribution);
        return lines.join("\n");
    };

    categoryButtons.forEach((button) => {
        button.addEventListener("click", () => selectCategory(button.dataset.category, button));
    });

    modeButtons.forEach((button) => {
        button.addEventListener("click", () => selectMode(button.dataset.simulationMode, button));
    });

    paymentPlanButtons.forEach((button) => {
        button.addEventListener("click", () => selectPaymentPlan(button.dataset.paymentPlan, button));
    });

    momentButtons.forEach((button) => {
        button.addEventListener("click", () => selectMoment(button.dataset.moment, button));
    });

    termOptions.addEventListener("click", (event) => {
        const button = event.target.closest("[data-term]");
        if (button) selectTerm(Number(button.dataset.term), button);
    });

    categoryNext.addEventListener("click", () => {
        if (!state.category) {
            categoryError.hidden = false;
            return;
        }
        renderTermOptions();
        renderValueSelector();
        showStep(2);
    });

    valueRange.addEventListener("input", () => {
        state.valueIndex = Number(valueRange.value);
        resetBidComposer();
        renderValueSelector();
    });

    valuesNext.addEventListener("click", () => {
        state.valueIndex = Number(valueRange.value);
        showStep(3);
    });

    resultButton.addEventListener("click", () => {
        if (!state.moment) {
            qualificationError.hidden = false;
            return;
        }
        renderResult();
    });

    bidToggle.addEventListener("click", () => {
        state.bidActive = !state.bidActive;
        renderBidComposer();
        if (state.bidActive) window.requestAnimationFrame(() => ownBidInput.focus());
        emit("consortium_lead_bid_composer_toggle", {
            consortium_bid_composer_active: state.bidActive
        });
    });

    ownBidInput.addEventListener("input", () => {
        state.ownBidValue = Number(ownBidInput.value) || 0;
        renderBidComposer();
    });

    ownBidInput.addEventListener("change", () => {
        renderBidComposer(true);
        const bidPlan = getBidPlan();
        if (bidPlan?.valid) emit("consortium_lead_bid_composition_update");
    });

    useEmbedded.addEventListener("change", () => {
        state.useEmbedded = useEmbedded.checked;
        renderBidComposer();
        const bidPlan = getBidPlan();
        if (bidPlan?.valid) emit("consortium_lead_bid_composition_update");
    });

    embeddedRange.addEventListener("input", () => {
        state.embeddedPercent = Number(embeddedRange.value);
        renderBidComposer();
    });

    embeddedRange.addEventListener("change", () => {
        const bidPlan = getBidPlan();
        if (bidPlan?.valid) emit("consortium_lead_bid_composition_update");
    });

    form.querySelectorAll("[data-back]").forEach((button) => {
        button.addEventListener("click", () => showStep(Number(button.dataset.back)));
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (resultPanel.hidden) return;
        if (state.bidActive && !getBidPlan()?.valid) {
            renderBidComposer(true);
            ownBidInput.focus();
            return;
        }
        if (!form.reportValidity()) return;
        emit("consortium_lead_whatsapp_intent");
        window.location.href = "https://wa.me/557731420005?text=" + encodeURIComponent(buildMessage());
    });

    restartButton.addEventListener("click", () => {
        form.reset();
        state.category = null;
        state.mode = "credit";
        state.valueIndex = 1;
        state.term = null;
        state.reducedPlan = false;
        setPressed(categoryButtons, null);
        setPressed(modeButtons, modeButtons.find((item) => item.dataset.simulationMode === "credit"));
        setPressed(paymentPlanButtons, paymentPlanButtons.find((item) => item.dataset.paymentPlan === "standard"));
        categoryNext.disabled = true;
        categoryError.hidden = true;
        termOptions.innerHTML = "";
        resetQualification();
        heroTitle.innerHTML = "Compare consórcios com base no seu <em>objetivo e orçamento.</em>";
        heroDescription.textContent = "Veja uma estimativa de crédito, prazo e parcela para automóvel, moto ou imóvel. Depois, receba uma análise humana das possibilidades disponíveis entre parceiros da GLID.";
        document.title = "Simule seu consórcio para carro, moto ou imóvel | GLID";
        showStep(1);
        document.querySelector("#simulador")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    document.querySelectorAll(".urgent-route, .button-secondary-dark").forEach((link) => {
        link.addEventListener("click", () => emit("consortium_lead_financing_route"));
    });

    resultContext.addEventListener("click", (event) => {
        if (event.target.closest("a")) emit("consortium_lead_financing_route");
    });

    document.querySelectorAll('a[href="#faq-parcela-reduzida-valor"]').forEach((link) => {
        link.addEventListener("click", () => {
            const faq = document.querySelector("#faq-parcela-reduzida-valor");
            if (faq) {
                faq.open = true;
                window.requestAnimationFrame(() => faq.querySelector("summary")?.focus());
            }
            emit("consortium_lead_reduced_faq_open");
        });
    });

    stickyCta?.addEventListener("click", () => emit("consortium_lead_sticky_cta"));

    if (stickyCta && "IntersectionObserver" in window) {
        const hero = document.querySelector(".lead-hero .hero-copy");
        const simulator = document.querySelector("#simulador");
        const footer = document.querySelector(".lead-footer");
        let heroVisible = true;
        let simulatorVisible = true;
        let footerVisible = false;
        const shouldShowStickyCta = () => !heroVisible && !simulatorVisible && !footerVisible;
        const updateSticky = () => {
            stickyCta.classList.toggle("is-visible", shouldShowStickyCta());
        };

        const heroObserver = new IntersectionObserver(([entry]) => {
            heroVisible = entry.isIntersecting;
            updateSticky();
        }, { rootMargin: "-68px 0px 0px 0px", threshold: 0 });

        const simulatorObserver = new IntersectionObserver(([entry]) => {
            simulatorVisible = entry.isIntersecting;
            updateSticky();
        }, { threshold: 0.08 });

        const footerObserver = new IntersectionObserver(([entry]) => {
            footerVisible = entry.isIntersecting;
            updateSticky();
        }, { rootMargin: "80px 0px 0px 0px", threshold: 0 });

        if (hero) heroObserver.observe(hero);
        if (simulator) simulatorObserver.observe(simulator);
        if (footer) footerObserver.observe(footer);
    }

    const requestedCategory = query.get("categoria") || query.get("tipo");
    const initialCategory = categoryAliases[requestedCategory?.toLowerCase()];
    if (initialCategory) {
        const initialButton = categoryButtons.find((button) => button.dataset.category === initialCategory);
        if (initialButton) selectCategory(initialCategory, initialButton, false);
    }

    showStep(1, false);
    emit("consortium_lead_page_view", {
        consortium_requested_category: initialCategory || "geral"
    });
})();
