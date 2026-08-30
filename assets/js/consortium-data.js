window.GLID_CONSORTIUM_SCENARIOS = Object.freeze({
    schemaVersion: 1,
    tableReference: "2026-09",
    reviewIntervalMonths: 6,
    categories: {
        automovel: {
            label: "Automóvel",
            budgets: [500, 800, 1200, 1800, 2500],
            options: [
                { id: "auto-35", credit: 35000, term: [95, 100], payment: [500, 550] },
                { id: "auto-50", credit: 50000, term: [95, 100], payment: [650, 750] },
                { id: "auto-70", credit: 70000, term: [95, 100], payment: [950, 1000] },
                { id: "auto-100", credit: 100000, term: [115, 120], payment: [1100, 1200] },
                { id: "auto-150", credit: 150000, term: [115, 120], payment: [1650, 1800] }
            ]
        },
        moto: {
            label: "Moto",
            budgets: [300, 400, 500, 600, 700],
            options: [
                { id: "moto-12", credit: 12000, term: [50, 60], payment: [300, 350] },
                { id: "moto-15", credit: 15000, term: [55, 65], payment: [350, 400] },
                { id: "moto-20", credit: 20000, term: [55, 65], payment: [450, 500] },
                { id: "moto-25", credit: 25000, term: [60, 65], payment: [550, 600] },
                { id: "moto-30", credit: 30000, term: [60, 65], payment: [650, 700] }
            ]
        },
        imovel: {
            label: "Imóvel",
            budgets: [650, 1000, 1300, 1900, 3500],
            options: [
                { id: "imovel-100", credit: 100000, term: [230, 240], payment: [600, 650] },
                { id: "imovel-150", credit: 150000, term: [230, 240], payment: [900, 1000] },
                { id: "imovel-200", credit: 200000, term: [230, 240], payment: [1200, 1300] },
                { id: "imovel-300", credit: 300000, term: [230, 240], payment: [1750, 1950] },
                { id: "imovel-500", credit: 500000, term: [195, 205], payment: [3450, 3750] }
            ]
        }
    }
});
