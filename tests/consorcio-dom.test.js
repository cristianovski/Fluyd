const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "consorcio/index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "assets/js/consorcio-lead.js"), "utf8");

test("todos os IDs consultados diretamente pelo simulador existem no HTML", () => {
    const ids = [...script.matchAll(/querySelector\("#([A-Za-z0-9_-]+)"\)/g)].map((match) => match[1]);
    const missing = [...new Set(ids)].filter((id) => !html.includes(`id="${id}"`));
    assert.deepEqual(missing, []);
});

test("a página não possui IDs duplicados", () => {
    const ids = [...html.matchAll(/\sid="([A-Za-z0-9_-]+)"/g)].map((match) => match[1]);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    assert.deepEqual([...new Set(duplicates)], []);
});

test("o lance embutido não aparece como modalidade isolada", () => {
    assert.equal(html.includes('data-bid-source="embedded"'), false);
    assert.equal(html.includes("data-bid-option"), false);
    assert.equal(html.includes("30%</strong>"), false);
    assert.equal(html.includes("40%</strong>"), false);
    assert.equal(html.includes("50%</strong>"), false);
    assert.match(html, /Complementar com parte da carta/);
    assert.match(html, /O embutido não aparece como lance isolado/);
});

test("a parcela reduzida informa o valor inicial e não promete valor posterior", () => {
    assert.match(html, /Parcela inicial reduzida estimada/);
    assert.match(html, /Depois da contemplação/);
    assert.match(html, /A confirmar/);
    assert.match(html, /Não é desconto/);
    assert.match(html, /id="faq-parcela-reduzida"/);
});

test("a combinação oculta a projeção posterior por regra de código", () => {
    assert.match(script, /bidImpact\.hidden = !bidPlan\.valid \|\| state\.reducedPlan/);
    assert.match(script, /combinationNote\.hidden = !bidPlan\.valid \|\| !state\.reducedPlan/);
});

test("a etapa três trata somente do momento", () => {
    assert.match(html, /data-progress="3"><span><\/span>Momento/);
    assert.match(html, /<h3 tabindex="-1">Qual é o seu momento\?<\/h3>/);
});
