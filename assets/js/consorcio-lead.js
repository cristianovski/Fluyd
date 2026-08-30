(() => {
    const SCENARIOS = window.GLID_CONSORTIUM_SCENARIOS;
    const CALCULATOR = window.GLID_CONSORTIUM_CALCULATOR;
    const form = document.querySelector("#lead-consortium-simulator");
    if (!form) return;

    if (!SCENARIOS?.assumptions || !SCENARIOS?.categories || typeof CALCULATOR?.calculate !== "function") {
        form.innerHTML = '<div class="simulator-fallback" role="alert"><strong>O simulador está temporariamente indisponível.</strong><span>Você ainda pode solicitar uma análise diretamente com um consultor.</span><a class="button" href="https://wa.me/557731420005?text=Ol%C3%A1%21%20Quero%20simular%20um%20cons%C3%B3rcio%20com%20a%20GLID.">Falar com um consultor</a></div>';
        return;
    }

    const categoryButtons = [...form.querySelectorAll("[data-category]")];
    const modeButtons = [...form.querySelectorAll("[data-simulation-mode]")];
    const momentButtons = [...form.querySelectorAll("[data-moment]")];
    const bidButtons = [...form.querySelectorAll("[data-bid-option]")];
    const bidSourceButtons = [...form.querySelectorAll("[data-bid-source]")];
    const mixedSourceOption = form.querySelector('[data-bid-source="mixed"]');
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
    const previewInstallment = document.querySelector("#lead-preview-installment");
    const urgencyWarning = document.querySelector("#lead-urgency-warning");
    const categoryError = document.querySelector("#category-error");
    const qualificationError = document.querySelector("#qualification-error");
    const customBid = document.querySelector("#lead-custom-bid");
    const customBidInput = document.querySelector("#lead-custom-bid-input");
    const customBidAmount = document.querySelector("#lead-custom-bid-amount");
    const bidSourceBlock = document.querySelector("#lead-bid-source-block");
    const fgtsOption = document.querySelector("#lead-fgts-option");
    const mixedBid = document.querySelector("#lead-mixed-bid");
    const embeddedRange = document.querySelector("#lead-embedded-range");
    const embeddedOutput = document.querySelector("#lead-embedded-output");
    const sourceWarning = document.querySelector("#lead-source-warning");
    const resultPanel = document.querySelector("#lead-simulator-result");
    const resultTitle = document.querySelector("#result-title");
    const resultCategory = document.querySelector("#lead-result-category");
    const resultCredit = document.querySelector("#lead-result-credit");
    const resultTerm = document.querySelector("#lead-result-term");
    const resultInstallment = document.querySelector("#lead-result-installment");
    const resultFee = document.querySelector("#lead-result-fee");
    const resultBid = document.querySelector("#lead-result-bid");
    const resultContext = document.querySelector("#lead-result-context");
    const bidImpact = document.querySelector("#lead-bid-impact");
    const noBidResult = document.querySelector("#lead-no-bid-result");
    const resultBidSource = document.querySelector("#lead-result-bid-source");
    const resultReducedInstallment = document.querySelector("#lead-result-reduced-installment");
    const resultInstallmentSaving = document.querySelector("#lead-result-installment-saving");
    const resultReducedTerm = document.querySelector("#lead-result-reduced-term");
    const resultTermSaving = document.querySelector("#lead-result-term-saving");
    const availableCredit = document.querySelector("#lead-available-credit");
    const resultAvailableCredit = document.querySelector("#lead-result-available-credit");
    const availableCreditNote = document.querySelector("#lead-available-credit-note");
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
        bidOption: null,
        bidPercent: 0,
        bidSource: null,
        embeddedPercent: 0
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

    const sourceLabels = {
        own: "Recursos próprios",
        embedded: "Lance embutido",
        mixed: "Lance misto",
        fgts: "FGTS"
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

    const getCategory = () => SCENARIOS.categories[state.category];
    const getModeValues = () => {
        const category = getCategory();
        if (!category) return [];
        return state.mode === "credit" ? category.credits : category.installments;
    };

    const floorTo = (value, increment) => Math.floor(value / increment) * increment;
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const plural = (value, singular, pluralForm) => value === 1 ? singular : pluralForm;

    const getPlan = () => {
        const category = getCategory();
        const values = getModeValues();
        const selectedValue = values[state.valueIndex];
        if (!category || !selectedValue || !state.term) return null;

        const feePercent = SCENARIOS.assumptions.administrationFeePercent;
        const feeRate = feePercent / 100;
        const credit = state.mode === "credit"
            ? selectedValue
            : floorTo(selectedValue * state.term / (1 + feeRate), category.creditRounding);
        const bidPercent = Number(state.bidPercent) || 0;
        const embeddedPercent = state.bidSource === "embedded"
            ? bidPercent
            : state.bidSource === "mixed"
                ? clamp(Number(state.embeddedPercent) || 0, 0, bidPercent)
                : 0;
        const projection = CALCULATOR.calculate({
            credit,
            term: state.term,
            feePercent,
            bidPercent,
            embeddedPercent
        });

        return {
            ...projection,
            category,
            selectedValue
        };
    };

    const emit = (eventName, extra = {}) => {
        if (!Array.isArray(window.dataLayer)) return;
        const plan = getPlan();
        window.dataLayer.push({
            event: eventName,
            consortium_category: state.category || undefined,
            consortium_mode: state.mode,
            consortium_term: state.term || undefined,
            consortium_credit: plan ? Math.round(plan.credit) : undefined,
            consortium_moment: state.moment || undefined,
            consortium_bid_percent: state.bidOption === null ? undefined : state.bidPercent,
            consortium_bid_source: state.bidSource || undefined,
            consortium_embedded_percent: plan?.embeddedPercent || undefined,
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
        const plan = getPlan();
        if (!plan) return;
        previewCredit.textContent = money.format(plan.credit);
        previewInstallment.textContent = money.format(plan.initialInstallment) + " por mês";
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
        valueLabel.textContent = isCreditMode ? "Crédito desejado" : "Parcela mensal confortável";
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

    const syncFgtsVisibility = () => {
        fgtsOption.hidden = state.category !== "imovel";
        if (state.category !== "imovel" && state.bidSource === "fgts") {
            state.bidSource = null;
            setPressed(bidSourceButtons, null);
        }
    };

    const resetStrategy = () => {
        state.moment = null;
        state.bidOption = null;
        state.bidPercent = 0;
        state.bidSource = null;
        state.embeddedPercent = 0;
        customBidInput.value = "35";
        customBidInput.disabled = true;
        customBidInput.removeAttribute("aria-invalid");
        customBid.hidden = true;
        bidSourceBlock.hidden = true;
        mixedBid.hidden = true;
        sourceWarning.hidden = true;
        urgencyWarning.hidden = true;
        qualificationError.hidden = true;
        resultButton.disabled = true;
        setPressed(momentButtons, null);
        setPressed(bidButtons, null);
        setPressed(bidSourceButtons, null);
        mixedSourceOption.disabled = true;
        syncFgtsVisibility();
    };

    const selectCategory = (categoryKey, button, track = true) => {
        if (!SCENARIOS.categories[categoryKey]) return;
        const firstTrackedSelection = !state.category && track;
        state.category = categoryKey;
        state.mode = "credit";
        state.valueIndex = getCategory().defaultCreditIndex;
        state.term = getCategory().defaultTerm;
        setPressed(categoryButtons, button);
        setPressed(modeButtons, modeButtons.find((item) => item.dataset.simulationMode === "credit"));
        categoryNext.disabled = false;
        categoryError.hidden = true;
        resetStrategy();
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
        renderValueSelector();
        if (state.bidOption === "custom") updateCustomBid();
        if (state.bidSource === "mixed") syncMixedControl();
        emit("consortium_lead_mode_select");
    };

    const selectTerm = (term, button) => {
        const category = getCategory();
        if (!category?.terms.includes(term)) return;
        state.term = term;
        setPressed([...termOptions.querySelectorAll("[data-term]")], button);
        renderPlanPreview();
        if (state.bidOption === "custom") updateCustomBid();
        if (state.bidSource === "mixed") syncMixedControl();
        emit("consortium_lead_term_select");
    };

    const selectMoment = (moment, button) => {
        state.moment = moment;
        setPressed(momentButtons, button);
        urgencyWarning.hidden = moment !== "urgente";
        updateQualificationButton();
        if (moment === "urgente") emit("consortium_lead_urgency_warning");
    };

    const customBidIsValid = () => {
        const value = Number(customBidInput.value);
        const min = SCENARIOS.assumptions.customBidMinPercent;
        const max = SCENARIOS.assumptions.customBidMaxPercent;
        return Number.isInteger(value) && value >= min && value <= max;
    };

    const updateCustomBid = () => {
        const isValid = customBidIsValid();
        const value = Number(customBidInput.value);
        customBidInput.setAttribute("aria-invalid", String(!isValid));
        state.bidPercent = isValid ? value : 0;
        if (state.bidSource === "embedded") state.embeddedPercent = state.bidPercent;
        syncSourceAvailability();
        const plan = getPlan();
        customBidAmount.textContent = isValid && plan ? money.format(plan.bidValue) : "Informe de 1% a 80%";
        bidSourceBlock.hidden = !isValid;
        if (!isValid) {
            state.bidSource = null;
            setPressed(bidSourceButtons, null);
            mixedBid.hidden = true;
            sourceWarning.hidden = true;
        } else if (state.bidSource === "mixed") {
            syncMixedControl();
        } else {
            renderSourceWarning();
        }
        updateQualificationButton();
    };

    const selectBid = (option, button) => {
        state.bidOption = option;
        setPressed(bidButtons, button);
        customBid.hidden = option !== "custom";
        customBidInput.disabled = option !== "custom";

        if (option === "custom") {
            updateCustomBid();
        } else {
            state.bidPercent = Number(option);
            if (state.bidSource === "embedded") state.embeddedPercent = state.bidPercent;
            syncSourceAvailability();
            customBidInput.removeAttribute("aria-invalid");
            bidSourceBlock.hidden = state.bidPercent === 0;
            if (state.bidPercent === 0) {
                state.bidSource = null;
                state.embeddedPercent = 0;
                setPressed(bidSourceButtons, null);
                mixedBid.hidden = true;
                sourceWarning.hidden = true;
            } else if (state.bidSource === "mixed") {
                syncMixedControl();
            } else {
                renderSourceWarning();
            }
        }

        updateQualificationButton();
        emit("consortium_lead_bid_select");
    };

    function syncSourceAvailability() {
        const mixedUnavailable = state.bidPercent <= 1;
        mixedSourceOption.disabled = mixedUnavailable;
        if (mixedUnavailable && state.bidSource === "mixed") {
            state.bidSource = null;
            state.embeddedPercent = 0;
            setPressed(bidSourceButtons, null);
            mixedBid.hidden = true;
            sourceWarning.hidden = true;
        }
    }

    function syncMixedControl() {
        const maximum = Math.max(1, Math.floor(state.bidPercent - 1));
        embeddedRange.max = String(maximum);
        if (!(state.embeddedPercent > 0 && state.embeddedPercent < state.bidPercent)) {
            state.embeddedPercent = Math.min(20, Math.max(1, Math.floor(state.bidPercent / 2)), maximum);
        }
        embeddedRange.value = String(state.embeddedPercent);
        const plan = getPlan();
        embeddedOutput.textContent = state.embeddedPercent + "% · " + (plan ? money.format(plan.embeddedValue) : "—");
        updateQualificationButton();
    }

    function renderSourceWarning() {
        if (!state.bidSource) {
            sourceWarning.hidden = true;
            return;
        }

        const messages = {
            own: "Com recursos próprios, o valor integral da carta permanece disponível para a compra.",
            embedded: "No lance embutido, o valor usado é retirado da carta. Esta é apenas uma hipótese matemática e não indica que o grupo aceite todo o percentual selecionado.",
            mixed: "No lance misto, somente a parte embutida reduz o crédito disponível. O limite real depende do grupo.",
            fgts: "O uso do FGTS em consórcio imobiliário depende das regras aplicáveis e da análise do caso pelo consultor e pela administradora."
        };
        sourceWarning.textContent = messages[state.bidSource];
        sourceWarning.hidden = false;
    }

    const selectBidSource = (source, button) => {
        if (source === "fgts" && state.category !== "imovel") return;
        state.bidSource = source;
        state.embeddedPercent = source === "embedded" ? state.bidPercent : 0;
        setPressed(bidSourceButtons, button);
        mixedBid.hidden = source !== "mixed";
        if (source === "mixed") syncMixedControl();
        renderSourceWarning();
        updateQualificationButton();
        emit("consortium_lead_bid_source_select");
    };

    function updateQualificationButton() {
        const hasBidChoice = state.bidOption !== null;
        const validCustom = state.bidOption !== "custom" || customBidIsValid();
        const sourceIsValid = state.bidPercent === 0 || Boolean(state.bidSource);
        const mixedIsValid = state.bidSource !== "mixed"
            || (state.embeddedPercent > 0 && state.embeddedPercent < state.bidPercent);
        const isValid = Boolean(state.moment && hasBidChoice && validCustom && sourceIsValid && mixedIsValid);
        resultButton.disabled = !isValid;
        if (isValid) qualificationError.hidden = true;
    }

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
            parts.push("A carta foi estimada a partir da parcela mensal de " + money.format(plan.selectedValue) + " e do prazo escolhido.");
        } else {
            parts.push("A parcela foi estimada a partir da carta e do prazo escolhidos.");
        }

        resultContext.classList.toggle("is-caution", state.moment === "urgente");
        resultContext.innerHTML = parts.join("<br>");
    };

    const getBidSourceLabel = (plan) => {
        if (!state.bidSource) return "Sem origem informada";
        if (state.bidSource === "mixed") {
            return sourceLabels.mixed + " · " + plan.embeddedPercent + "% embutido";
        }
        return sourceLabels[state.bidSource];
    };

    const renderResult = () => {
        const plan = getPlan();
        if (!plan || !state.moment || state.bidOption === null) return;

        resultCategory.textContent = plan.category.label + " · " + momentLabels[state.moment];
        resultCredit.textContent = money.format(plan.credit);
        resultTerm.textContent = plan.term + " meses";
        resultInstallment.textContent = money.format(plan.initialInstallment) + " por mês";
        resultFee.textContent = plan.feePercent + "% referencial";
        resultBid.textContent = plan.bidPercent > 0
            ? plan.bidPercent + "% · " + money.format(plan.bidValue)
            : "Sem lance";
        buildResultContext(plan);

        const hasBid = plan.bidPercent > 0;
        resultTitle.textContent = hasBid
            ? "Veja como o lance poderia alterar seu plano"
            : "Sua referência inicial de crédito, prazo e parcela";
        bidImpact.hidden = !hasBid;
        noBidResult.hidden = hasBid;

        if (hasBid) {
            resultBidSource.textContent = getBidSourceLabel(plan);
            resultReducedInstallment.textContent = money.format(plan.reducedInstallment) + " por mês";
            resultInstallmentSaving.textContent = "Redução estimada de " + money.format(plan.installmentSaving) + " por mês";
            resultReducedTerm.textContent = "Cerca de " + plan.reducedTerm + " meses";
            resultTermSaving.textContent = plan.monthsSaved + " " + plural(plan.monthsSaved, "mês", "meses") + " a menos";

            const reducesAvailableCredit = plan.embeddedValue > 0;
            availableCredit.hidden = !reducesAvailableCredit;
            if (reducesAvailableCredit) {
                resultAvailableCredit.textContent = money.format(plan.availableCredit);
                availableCreditNote.textContent = money.format(plan.embeddedValue) + " da carta foram considerados nesta hipótese. A possibilidade e o limite real dependem do grupo.";
            }
        } else {
            availableCredit.hidden = true;
        }

        showStep(4);
        emit("consortium_lead_result_view", {
            consortium_reduced_installment: hasBid ? Math.round(plan.reducedInstallment) : undefined,
            consortium_reduced_term: hasBid ? plan.reducedTerm : undefined,
            consortium_available_credit: Math.round(plan.availableCredit)
        });
        if (state.moment !== "urgente") emit("consortium_lead_qualified_result");
    };

    const buildMessage = () => {
        const plan = getPlan();
        const data = new FormData(form);
        const lines = [
            "Olá! Fiz uma simulação de consórcio na página da GLID e quero validar as possibilidades atuais com um consultor.",
            "",
            "Nome: " + data.get("nome"),
            "Cidade/UF: " + data.get("cidade"),
            "Melhor período: " + data.get("periodo"),
            "",
            "Categoria: " + plan.category.label,
            "Forma de simular: " + (state.mode === "credit" ? "pelo valor da carta" : "pela parcela mensal"),
            "Crédito de referência: " + money.format(plan.credit),
            "Prazo escolhido: " + plan.term + " meses",
            "Parcela inicial estimada: " + money.format(plan.initialInstallment) + " por mês",
            "Taxa de administração referencial: " + plan.feePercent + "%",
            "Momento da compra: " + momentLabels[state.moment],
            "Lance simulado: " + (plan.bidPercent > 0 ? plan.bidPercent + "% (" + money.format(plan.bidValue) + ")" : "sem lance")
        ];

        if (plan.bidPercent > 0) {
            lines.push(
                "Origem do lance: " + getBidSourceLabel(plan),
                "Projeção mantendo o prazo: " + money.format(plan.reducedInstallment) + " por mês",
                "Projeção mantendo a parcela: cerca de " + plan.reducedTerm + " meses"
            );
            if (plan.embeddedValue > 0) {
                lines.push("Crédito estimado disponível após a parte embutida: " + money.format(plan.availableCredit));
            }
        }

        lines.push(
            "",
            "Entendo que esta é uma estimativa ilustrativa, sem garantia de contemplação, e que valores, limites e forma de abatimento dependem do grupo, do contrato e da administradora."
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

    momentButtons.forEach((button) => {
        button.addEventListener("click", () => selectMoment(button.dataset.moment, button));
    });

    bidButtons.forEach((button) => {
        button.addEventListener("click", () => selectBid(button.dataset.bidOption, button));
    });

    bidSourceButtons.forEach((button) => {
        button.addEventListener("click", () => selectBidSource(button.dataset.bidSource, button));
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
        renderValueSelector();
        if (state.bidOption === "custom") updateCustomBid();
        if (state.bidSource === "mixed") syncMixedControl();
    });

    customBidInput.addEventListener("input", updateCustomBid);

    embeddedRange.addEventListener("input", () => {
        state.embeddedPercent = Number(embeddedRange.value);
        syncMixedControl();
        renderSourceWarning();
    });

    valuesNext.addEventListener("click", () => {
        state.valueIndex = Number(valueRange.value);
        showStep(3);
    });

    resultButton.addEventListener("click", () => {
        if (resultButton.disabled) {
            qualificationError.hidden = false;
            return;
        }
        renderResult();
    });

    form.querySelectorAll("[data-back]").forEach((button) => {
        button.addEventListener("click", () => showStep(Number(button.dataset.back)));
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (resultPanel.hidden || !form.reportValidity()) return;
        emit("consortium_lead_whatsapp_intent");
        window.location.href = "https://wa.me/557731420005?text=" + encodeURIComponent(buildMessage());
    });

    restartButton.addEventListener("click", () => {
        form.reset();
        state.category = null;
        state.mode = "credit";
        state.valueIndex = 1;
        state.term = null;
        setPressed(categoryButtons, null);
        setPressed(modeButtons, modeButtons.find((item) => item.dataset.simulationMode === "credit"));
        categoryNext.disabled = true;
        categoryError.hidden = true;
        termOptions.innerHTML = "";
        resetStrategy();
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

    stickyCta?.addEventListener("click", () => emit("consortium_lead_sticky_cta"));

    if (stickyCta && "IntersectionObserver" in window) {
        const hero = document.querySelector(".lead-hero .hero-copy");
        const simulator = document.querySelector("#simulador");
        let heroVisible = true;
        let simulatorVisible = true;
        const updateSticky = () => {
            stickyCta.classList.toggle("is-visible", !heroVisible && !simulatorVisible);
        };

        const heroObserver = new IntersectionObserver(([entry]) => {
            heroVisible = entry.isIntersecting;
            updateSticky();
        }, { rootMargin: "-68px 0px 0px 0px", threshold: 0 });

        const simulatorObserver = new IntersectionObserver(([entry]) => {
            simulatorVisible = entry.isIntersecting;
            updateSticky();
        }, { threshold: 0.08 });

        if (hero) heroObserver.observe(hero);
        if (simulator) simulatorObserver.observe(simulator);
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
