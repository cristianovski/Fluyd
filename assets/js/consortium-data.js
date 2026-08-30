window.GLID_CONSORTIUM_SCENARIOS = Object.freeze({
    schemaVersion: 2,
    tableReference: "2026-08",
    reviewIntervalMonths: 6,
    assumptions: {
        administrationFeePercent: 18,
        customBidMinPercent: 1,
        customBidMaxPercent: 80
    },
    categories: {
        automovel: {
            label: "Automóvel",
            credits: [25000, 35000, 50000, 70000, 100000, 150000, 255000],
            installments: [500, 800, 1200, 1800, 2500],
            terms: [60, 72, 84, 100, 120],
            defaultTerm: 100,
            defaultCreditIndex: 2,
            defaultInstallmentIndex: 1,
            creditRounding: 1000,
            budgets: [500, 800, 1200, 1800, 2500],
            options: [
                { id: "auto-35", credit: 35000, term: [95, 100], payment: [413, 435] },
                { id: "auto-50", credit: 50000, term: [95, 100], payment: [590, 621] },
                { id: "auto-70", credit: 70000, term: [95, 100], payment: [826, 869] },
                { id: "auto-100", credit: 100000, term: [115, 120], payment: [983, 1026] },
                { id: "auto-150", credit: 150000, term: [115, 120], payment: [1475, 1539] }
            ]
        },
        moto: {
            label: "Moto",
            credits: [9000, 12000, 15000, 20000, 25000, 30000, 42500],
            installments: [300, 400, 500, 600, 700],
            terms: [36, 48, 60, 72],
            defaultTerm: 60,
            defaultCreditIndex: 2,
            defaultInstallmentIndex: 1,
            creditRounding: 500,
            budgets: [300, 400, 500, 600, 700],
            options: [
                { id: "moto-12", credit: 12000, term: [50, 60], payment: [236, 283] },
                { id: "moto-15", credit: 15000, term: [55, 65], payment: [272, 322] },
                { id: "moto-20", credit: 20000, term: [55, 65], payment: [363, 429] },
                { id: "moto-25", credit: 25000, term: [60, 65], payment: [454, 492] },
                { id: "moto-30", credit: 30000, term: [60, 65], payment: [545, 590] }
            ]
        },
        imovel: {
            label: "Imóvel",
            credits: [65000, 100000, 150000, 200000, 300000, 500000, 710000],
            installments: [650, 1000, 1300, 1900, 3500],
            terms: [120, 150, 180, 200, 240],
            defaultTerm: 200,
            defaultCreditIndex: 2,
            defaultInstallmentIndex: 1,
            creditRounding: 5000,
            budgets: [650, 1000, 1300, 1900, 3500],
            options: [
                { id: "imovel-100", credit: 100000, term: [230, 240], payment: [492, 513] },
                { id: "imovel-150", credit: 150000, term: [230, 240], payment: [738, 770] },
                { id: "imovel-200", credit: 200000, term: [230, 240], payment: [983, 1026] },
                { id: "imovel-300", credit: 300000, term: [230, 240], payment: [1475, 1539] },
                { id: "imovel-500", credit: 500000, term: [195, 205], payment: [2878, 3026] }
            ]
        }
    }
});
