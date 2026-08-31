const test = require("node:test");
const assert = require("node:assert/strict");

global.window = {};
require("../assets/js/consortium-data.js");
require("../assets/js/consortium-calculator.js");

const SCENARIOS = window.GLID_CONSORTIUM_SCENARIOS;
const CALCULATOR = window.GLID_CONSORTIUM_CALCULATOR;

const closeTo = (actual, expected, tolerance = 1e-8) => {
    assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
};

test("plano padrão usa carta mais taxa administrativa de 18%", () => {
    const result = CALCULATOR.calculate({ credit: 100000, term: 100, feePercent: 18 });
    assert.equal(result.totalPlan, 118000);
    assert.equal(result.initialInstallment, 1180);
    assert.equal(result.availableCredit, 100000);
});

test("parcela inicial reduzida paga 50% do fundo comum e taxa integral", () => {
    const result = CALCULATOR.calculateReducedPlan({
        credit: 100000,
        term: 100,
        feePercent: 18,
        commonFundPaymentPercent: 50
    });
    assert.equal(result.commonFundInstallment, 1000);
    assert.equal(result.administrationFeeInstallment, 180);
    assert.equal(result.standardInstallment, 1180);
    assert.equal(result.reducedInitialInstallment, 680);
    assert.equal(result.deferredMonthlyAmount, 500);
    closeTo(result.effectiveReductionPercent, 42.3728813559322);
});

test("lance misto soma recursos próprios e parte embutida sem dupla dedução", () => {
    const credit = 100000;
    const ownBid = 40000;
    const embeddedPercent = 25;
    const embeddedValue = credit * embeddedPercent / 100;
    const totalBid = ownBid + embeddedValue;
    const result = CALCULATOR.calculate({
        credit,
        term: 100,
        feePercent: 18,
        bidPercent: totalBid / credit * 100,
        embeddedPercent
    });

    assert.equal(result.bidValue, 65000);
    assert.equal(result.embeddedValue, 25000);
    assert.equal(result.availableCredit, 75000);
    assert.equal(result.remainingBalance, 53000);
    assert.equal(result.reducedInstallment, 530);
    assert.equal(result.reducedTerm, 45);
});

test("lance somente com recursos próprios preserva a carta integral", () => {
    const result = CALCULATOR.calculate({
        credit: 50000,
        term: 100,
        feePercent: 18,
        bidPercent: 65,
        embeddedPercent: 0
    });
    assert.equal(result.bidValue, 32500);
    assert.equal(result.availableCredit, 50000);
    assert.equal(result.remainingBalance, 26500);
    assert.equal(result.reducedInstallment, 265);
    assert.equal(result.reducedTerm, 45);
});

test("parcela reduzida funciona nos limites e referências de auto, moto e imóvel", () => {
    const cases = [
        { credit: 25000, term: 60, standard: 491.6666666667, reduced: 283.3333333333 },
        { credit: 50000, term: 100, standard: 590, reduced: 340 },
        { credit: 255000, term: 120, standard: 2507.5, reduced: 1445 },
        { credit: 9000, term: 36, standard: 295, reduced: 170 },
        { credit: 15000, term: 60, standard: 295, reduced: 170 },
        { credit: 42500, term: 72, standard: 696.5277777778, reduced: 401.3888888889 },
        { credit: 65000, term: 120, standard: 639.1666666667, reduced: 368.3333333333 },
        { credit: 150000, term: 200, standard: 885, reduced: 510 },
        { credit: 710000, term: 240, standard: 3490.8333333333, reduced: 2011.6666666667 }
    ];

    cases.forEach(({ credit, term, standard, reduced }) => {
        const result = CALCULATOR.calculateReducedPlan({
            credit,
            term,
            feePercent: 18,
            commonFundPaymentPercent: 50
        });
        closeTo(result.standardInstallment, standard, 1e-7);
        closeTo(result.reducedInitialInstallment, reduced, 1e-7);
    });
});

test("partir da parcela arredonda a carta para baixo", () => {
    const examples = [
        { installment: 800, term: 100, rounding: 1000, expected: 67000 },
        { installment: 400, term: 60, rounding: 500, expected: 20000 },
        { installment: 1000, term: 200, rounding: 5000, expected: 165000 }
    ];

    examples.forEach(({ installment, term, rounding, expected }) => {
        const rawCredit = installment * term / 1.18;
        const credit = Math.floor(rawCredit / rounding) * rounding;
        assert.equal(credit, expected);
        const result = CALCULATOR.calculate({ credit, term, feePercent: 18 });
        assert.ok(result.initialInstallment <= installment);
    });
});

test("todas as combinações de orçamento e prazo ficam dentro do orçamento escolhido", () => {
    Object.values(SCENARIOS.categories).forEach((category) => {
        category.installments.forEach((installment) => {
            category.terms.forEach((term) => {
                const rawCredit = installment * term / 1.18;
                const credit = Math.floor(rawCredit / category.creditRounding) * category.creditRounding;
                const standard = CALCULATOR.calculate({ credit, term, feePercent: 18 });
                const reduced = CALCULATOR.calculateReducedPlan({
                    credit,
                    term,
                    feePercent: 18,
                    commonFundPaymentPercent: 50
                });
                assert.ok(credit > 0);
                assert.ok(standard.initialInstallment <= installment + 1e-8);
                assert.ok(reduced.reducedInitialInstallment < standard.initialInstallment);
            });
        });
    });
});

test("premissas publicadas mantêm teto embutido de 25% e lance total de 80%", () => {
    assert.equal(SCENARIOS.assumptions.embeddedReferenceMaxPercent, 25);
    assert.equal(SCENARIOS.assumptions.totalBidMaxPercent, 80);
    assert.equal(SCENARIOS.assumptions.reducedCommonFundPaymentPercent, 50);
});

test("calculador rejeita parte embutida maior que o lance total", () => {
    assert.throws(() => CALCULATOR.calculate({
        credit: 100000,
        term: 100,
        feePercent: 18,
        bidPercent: 20,
        embeddedPercent: 25
    }), /embeddedPercent/);
});

test("calculador rejeita entradas inválidas da parcela reduzida", () => {
    assert.throws(() => CALCULATOR.calculateReducedPlan({
        credit: 100000,
        term: 100,
        feePercent: 18,
        commonFundPaymentPercent: 101
    }), /commonFundPaymentPercent/);
    assert.throws(() => CALCULATOR.calculateReducedPlan({
        credit: 100000,
        term: 0,
        feePercent: 18,
        commonFundPaymentPercent: 50
    }), /term/);
});
