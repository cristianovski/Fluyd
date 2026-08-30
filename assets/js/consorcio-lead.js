(() => {
    const SCENARIOS = window.GLID_CONSORTIUM_SCENARIOS;
    const form = document.querySelector("#lead-consortium-simulator");
    if (!SCENARIOS || !form) return;

    const categoryButtons = [...form.querySelectorAll("[data-category]")];
    const momentButtons = [...form.querySelectorAll("[data-moment]")];
    const bidButtons = [...form.querySelectorAll("[data-bid]")];
    const stepPanels = [...form.querySelectorAll("[data-step]")];
    const progressItems = [...document.querySelectorAll("[data-progress]")];
    const categoryNext = document.querySelector("#category-next");
    const valuesNext = document.querySelector("#values-next");
    const resultButton = document.querySelector("#lead-result-button");
    const creditRange = document.querySelector("#lead-credit-range");
    const creditOutput = document.querySelector("#lead-credit-output");
    const creditMin = document.querySelector("#lead-credit-min");
    const creditMax = document.querySelector("#lead-credit-max");
    const budgetRange = document.querySelector("#lead-budget-range");
    const budgetOutput = document.querySelector("#lead-budget-output");
    const budgetMin = document.querySelector("#lead-budget-min");
    const budgetMax = document.querySelector("#lead-budget-max");
    const urgencyWarning = document.querySelector("#lead-urgency-warning");
    const categoryError = document.querySelector("#category-error");
    const qualificationError = document.querySelector("#qualification-error");
    const resultPanel = document.querySelector("#lead-simulator-result");
    const resultTitle = document.querySelector("#result-title");
    const resultCategory = document.querySelector("#lead-result-category");
    const resultCredit = document.querySelector("#lead-result-credit");
    const resultTerm = document.querySelector("#lead-result-term");
    const resultInstallment = document.querySelector("#lead-result-installment");
    const resultBudget = document.querySelector("#lead-result-budget");
    const resultBid = document.querySelector("#lead-result-bid");
    const resultContext = document.querySelector("#lead-result-context");
    const tableReference = document.querySelector("#lead-table-reference");
    const restartButton = document.querySelector("#lead-restart-simulator");
    const heroTitle = document.querySelector("#hero-title");
    const heroDescription = document.querySelector("#hero-description");
    const stickyCta = document.querySelector("#lead-sticky-cta");
    const query = new URLSearchParams(window.location.search);

    const state = {
        category: null,
        optionIndex: 1,
        budgetIndex: 1,
        moment: null,
        bid: null
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

    const bidLabels = {
        nao: "Não neste momento",
        talvez: "Talvez mais adiante",
        "ate-10": "Até 10% do crédito",
        "acima-10": "Acima de 10% do crédito"
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
    const getOption = () => getCategory()?.options[state.optionIndex];
    const getBudget = () => getCategory()?.budgets[state.budgetIndex];

    const getBudgetFit = () => {
        const option = getOption();
        const budget = getBudget();
        if (!option || !budget) return "unknown";
        if (budget < option.payment[0]) return "below";
        if (budget <= option.payment[1]) return "aligned";
        return "above";
    };

    const emit = (eventName, extra = {}) => {
        if (!Array.isArray(window.dataLayer)) return;
        window.dataLayer.push({
            event: eventName,
            consortium_category: state.category || undefined,
            consortium_scenario: getOption()?.id,
            consortium_moment: state.moment || undefined,
            consortium_budget_fit: getBudgetFit(),
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
        window.requestAnimationFrame(() => target?.focus({ preventScroll: true }));
    };

    const renderValueSelectors = () => {
        const category = getCategory();
        if (!category) return;

        const lastOptionIndex = category.options.length - 1;
        const lastBudgetIndex = category.budgets.length - 1;
        state.optionIndex = Math.min(Math.max(state.optionIndex, 0), lastOptionIndex);
        state.budgetIndex = Math.min(Math.max(state.budgetIndex, 0), lastBudgetIndex);

        creditRange.min = "0";
        creditRange.max = String(lastOptionIndex);
        creditRange.value = String(state.optionIndex);
        creditOutput.textContent = money.format(getOption().credit);
        creditRange.setAttribute("aria-valuetext", money.format(getOption().credit));
        creditMin.textContent = money.format(category.options[0].credit);
        creditMax.textContent = money.format(category.options[lastOptionIndex].credit);

        budgetRange.min = "0";
        budgetRange.max = String(lastBudgetIndex);
        budgetRange.value = String(state.budgetIndex);
        budgetOutput.textContent = money.format(getBudget()) + " por mês";
        budgetRange.setAttribute("aria-valuetext", money.format(getBudget()) + " por mês");
        budgetMin.textContent = money.format(category.budgets[0]);
        budgetMax.textContent = money.format(category.budgets[lastBudgetIndex]);
    };

    const personalizeHero = (categoryKey) => {
        const copy = categoryCopy[categoryKey];
        if (!copy) return;
        heroTitle.textContent = copy.title;
        heroDescription.textContent = copy.description;
        document.title = copy.documentTitle;
    };

    const selectCategory = (categoryKey, button, track = true) => {
        if (!SCENARIOS.categories[categoryKey]) return;
        const firstTrackedSelection = !state.category && track;
        state.category = categoryKey;
        state.optionIndex = 1;
        state.budgetIndex = 1;
        setPressed(categoryButtons, button);
        categoryNext.disabled = false;
        categoryError.hidden = true;
        renderValueSelectors();
        personalizeHero(categoryKey);
        if (firstTrackedSelection) emit("consortium_lead_simulator_start");
        if (track) emit("consortium_lead_category_select");
    };

    const updateQualificationButton = () => {
        resultButton.disabled = !(state.moment && state.bid);
        if (state.moment && state.bid) qualificationError.hidden = true;
    };

    const selectMoment = (moment, button) => {
        state.moment = moment;
        setPressed(momentButtons, button);
        urgencyWarning.hidden = moment !== "urgente";
        updateQualificationButton();
        if (moment === "urgente") emit("consortium_lead_urgency_warning");
    };

    const selectBid = (bid, button) => {
        state.bid = bid;
        setPressed(bidButtons, button);
        updateQualificationButton();
    };

    const renderTableReference = () => {
        const referenceParts = SCENARIOS.tableReference.split("-").map(Number);
        const year = referenceParts[0];
        const month = referenceParts[1];
        if (!year || !month) return;
        const label = new Intl.DateTimeFormat("pt-BR", {
            month: "long",
            year: "numeric",
            timeZone: "UTC"
        }).format(new Date(Date.UTC(year, month - 1, 1)));
        tableReference.textContent = "Base de referência: " + label + ".";
    };

    const buildResultContext = () => {
        const budgetFit = getBudgetFit();
        const parts = [];

        if (state.moment === "urgente") {
            parts.push('<strong>Você indicou urgência.</strong> O consórcio não garante a compra em uma data determinada. <a href="/financiamentos/">Avalie também o financiamento.</a>');
        } else if (state.moment === "meses") {
            parts.push("Você indicou que consegue planejar nos próximos meses. Um consultor poderá avaliar os grupos disponíveis e explicar os cenários atuais.");
        } else {
            parts.push("Sua flexibilidade permite comparar diferentes combinações de crédito, prazo e parcela antes de decidir.");
        }

        if (budgetFit === "below") {
            parts.push("<strong>O orçamento indicado está abaixo da faixa estimada.</strong> A análise pode ajudar a recalibrar o crédito, o prazo ou a parcela.");
        } else if (budgetFit === "aligned") {
            parts.push("O orçamento indicado está dentro da faixa desta referência inicial.");
        } else if (budgetFit === "above") {
            parts.push("O orçamento indicado fica acima da faixa desta referência e pode permitir avaliar outras combinações.");
        }

        resultContext.classList.toggle("is-caution", state.moment === "urgente" || budgetFit === "below");
        resultContext.innerHTML = parts.join("<br>");
    };

    const renderResult = () => {
        const category = getCategory();
        const option = getOption();
        const budget = getBudget();
        if (!category || !option || !budget || !state.moment || !state.bid) return;

        resultCategory.textContent = category.label + " · " + momentLabels[state.moment];
        resultCredit.textContent = money.format(option.credit);
        resultTerm.textContent = option.term[0] + " a " + option.term[1] + " meses";
        resultInstallment.textContent = money.format(option.payment[0]) + " a " + money.format(option.payment[1]);
        resultBudget.textContent = money.format(budget) + " por mês";
        resultBid.textContent = bidLabels[state.bid];
        buildResultContext();
        renderTableReference();
        showStep(4);
        emit("consortium_lead_result_view");
        if (getBudgetFit() !== "below" && state.moment !== "urgente") {
            emit("consortium_lead_qualified_result");
        }
    };

    const buildMessage = () => {
        const category = getCategory();
        const option = getOption();
        const budget = getBudget();
        const data = new FormData(form);
        const lines = [
            "Olá! Fiz uma simulação de consórcio na landing page da GLID e quero receber uma análise das possibilidades atuais.",
            "",
            "Nome: " + data.get("nome"),
            "Cidade/UF: " + data.get("cidade"),
            "Melhor período: " + data.get("periodo"),
            "",
            "Categoria: " + category.label,
            "Crédito de referência: " + money.format(option.credit),
            "Prazo estimado: " + option.term[0] + " a " + option.term[1] + " meses",
            "Parcela estimada: " + money.format(option.payment[0]) + " a " + money.format(option.payment[1]) + " por mês",
            "Orçamento mensal indicado: " + money.format(budget),
            "Momento da compra: " + momentLabels[state.moment],
            "Intenção de lance: " + bidLabels[state.bid],
            "",
            "Entendo que esta é uma estimativa informativa e que contemplação, valores, prazos e disponibilidade não são garantidos."
        ];

        if (attribution) lines.push("", "Origem da visita: " + attribution);
        return lines.join("\n");
    };

    categoryButtons.forEach((button) => {
        button.addEventListener("click", () => selectCategory(button.dataset.category, button));
    });

    momentButtons.forEach((button) => {
        button.addEventListener("click", () => selectMoment(button.dataset.moment, button));
    });

    bidButtons.forEach((button) => {
        button.addEventListener("click", () => selectBid(button.dataset.bid, button));
    });

    categoryNext.addEventListener("click", () => {
        if (!state.category) {
            categoryError.hidden = false;
            return;
        }
        renderValueSelectors();
        showStep(2);
    });

    creditRange.addEventListener("input", () => {
        state.optionIndex = Number(creditRange.value);
        creditOutput.textContent = money.format(getOption().credit);
        creditRange.setAttribute("aria-valuetext", money.format(getOption().credit));
    });

    budgetRange.addEventListener("input", () => {
        state.budgetIndex = Number(budgetRange.value);
        budgetOutput.textContent = money.format(getBudget()) + " por mês";
        budgetRange.setAttribute("aria-valuetext", money.format(getBudget()) + " por mês");
    });

    valuesNext.addEventListener("click", () => {
        state.optionIndex = Number(creditRange.value);
        state.budgetIndex = Number(budgetRange.value);
        showStep(3);
    });

    resultButton.addEventListener("click", () => {
        if (!state.moment || !state.bid) {
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
        state.optionIndex = 1;
        state.budgetIndex = 1;
        state.moment = null;
        state.bid = null;
        setPressed(categoryButtons, null);
        setPressed(momentButtons, null);
        setPressed(bidButtons, null);
        categoryNext.disabled = true;
        resultButton.disabled = true;
        categoryError.hidden = true;
        qualificationError.hidden = true;
        urgencyWarning.hidden = true;
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
