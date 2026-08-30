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

    window.GLID_CONSORTIUM_CALCULATOR = Object.freeze({ calculate });
})();
