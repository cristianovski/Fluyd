(() => {
    const calculate = ({
        credit,
        term,
        feePercent = 18,
        bidPercent = 0,
        embeddedPercent = 0
    }) => {
        const values = { credit, term, feePercent, bidPercent, embeddedPercent };
        Object.entries(values).forEach(([key, value]) => {
            if (!Number.isFinite(value)) throw new TypeError(key + " must be a finite number");
        });
        if (credit <= 0) throw new RangeError("credit must be greater than zero");
        if (!Number.isInteger(term) || term <= 0) throw new RangeError("term must be a positive integer");
        if (feePercent < 0) throw new RangeError("feePercent cannot be negative");
        if (bidPercent < 0 || bidPercent > 100) throw new RangeError("bidPercent must be between zero and one hundred");
        if (embeddedPercent < 0 || embeddedPercent > bidPercent) {
            throw new RangeError("embeddedPercent must be between zero and bidPercent");
        }

        const feeRate = feePercent / 100;
        const totalPlan = credit * (1 + feeRate);
        const initialInstallment = totalPlan / term;
        const bidValue = credit * bidPercent / 100;
        const embeddedValue = credit * embeddedPercent / 100;
        const remainingBalance = Math.max(0, totalPlan - bidValue);
        const reducedInstallment = remainingBalance / term;
        const reducedTerm = remainingBalance === 0
            ? 0
            : Math.ceil((remainingBalance / initialInstallment) - 1e-9);

        return Object.freeze({
            credit,
            term,
            feePercent,
            totalPlan,
            initialInstallment,
            bidPercent,
            bidValue,
            embeddedPercent,
            embeddedValue,
            availableCredit: Math.max(0, credit - embeddedValue),
            remainingBalance,
            reducedInstallment,
            installmentSaving: initialInstallment - reducedInstallment,
            reducedTerm,
            monthsSaved: term - reducedTerm
        });
    };

    const calculateReducedPlan = ({
        credit,
        term,
        feePercent = 18,
        commonFundPaymentPercent = 50,
        otherMonthlyCharges = 0
    }) => {
        const values = {
            credit,
            term,
            feePercent,
            commonFundPaymentPercent,
            otherMonthlyCharges
        };
        Object.entries(values).forEach(([key, value]) => {
            if (!Number.isFinite(value)) throw new TypeError(key + " must be a finite number");
        });
        if (credit <= 0) throw new RangeError("credit must be greater than zero");
        if (!Number.isInteger(term) || term <= 0) throw new RangeError("term must be a positive integer");
        if (feePercent < 0) throw new RangeError("feePercent cannot be negative");
        if (commonFundPaymentPercent < 0 || commonFundPaymentPercent > 100) {
            throw new RangeError("commonFundPaymentPercent must be between zero and one hundred");
        }
        if (otherMonthlyCharges < 0) throw new RangeError("otherMonthlyCharges cannot be negative");

        const commonFundInstallment = credit / term;
        const administrationFeeInstallment = credit * (feePercent / 100) / term;
        const standardInstallment = commonFundInstallment + administrationFeeInstallment + otherMonthlyCharges;
        const reducedCommonFundInstallment = commonFundInstallment * commonFundPaymentPercent / 100;
        const reducedInitialInstallment = reducedCommonFundInstallment + administrationFeeInstallment + otherMonthlyCharges;
        const deferredMonthlyAmount = commonFundInstallment - reducedCommonFundInstallment;
        const effectiveReductionPercent = standardInstallment === 0
            ? 0
            : (1 - reducedInitialInstallment / standardInstallment) * 100;

        return Object.freeze({
            credit,
            term,
            feePercent,
            commonFundPaymentPercent,
            otherMonthlyCharges,
            commonFundInstallment,
            administrationFeeInstallment,
            standardInstallment,
            reducedCommonFundInstallment,
            reducedInitialInstallment,
            deferredMonthlyAmount,
            effectiveReductionPercent
        });
    };

    window.GLID_CONSORTIUM_CALCULATOR = Object.freeze({ calculate, calculateReducedPlan });
})();
