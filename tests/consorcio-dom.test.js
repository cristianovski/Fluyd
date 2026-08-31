const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "consorcio/index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "assets/js/consorcio-lead.js"), "utf8");
const leadStyles = fs.readFileSync(path.join(root, "assets/css/consorcio-lead.css"), "utf8");

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

test("a parcela reduzida é escolhida na etapa de valores", () => {
    assert.match(html, /data-payment-plan="standard"/);
    assert.match(html, /data-payment-plan="reduced"/);
    assert.match(html, /id="lead-standard-option-value"/);
    assert.match(html, /id="lead-reduced-option-value"/);
    assert.match(html, /Depois da contemplação:<\/b> valor a confirmar/);
    assert.match(html, /Não é desconto/);
    assert.match(html, /id="faq-parcela-reduzida"/);
    assert.match(script, /const selectPaymentPlan =/);
    assert.match(script, /state\.reducedPlan = paymentPlan === "reduced"/);
});

test("o resultado reflete a escolha e oferece somente o lance como opção adicional", () => {
    assert.equal(html.includes('id="lead-reduced-strategy"'), false);
    assert.match(html, /Veja a estimativa do seu plano/);
    assert.match(html, /Quer montar um lance\?/);
    assert.match(html, /id="lead-result-after-reduced"/);
    assert.match(html, /id="lead-result-reduced-note"/);
    assert.match(script, /resultAfterReduced\.hidden = !state\.reducedPlan/);
    assert.match(script, /resultReducedNote\.hidden = !state\.reducedPlan/);
});

test("a combinação oculta a projeção posterior por regra de código", () => {
    assert.match(script, /bidImpact\.hidden = !bidPlan\.valid \|\| state\.reducedPlan/);
    assert.match(script, /combinationNote\.hidden = !bidPlan\.valid \|\| !state\.reducedPlan/);
});

test("a etapa três trata somente do momento", () => {
    assert.match(html, /data-progress="3"><span><\/span>Momento/);
    assert.match(html, /<h3 tabindex="-1">Qual é o seu momento\?<\/h3>/);
});

test("o CTA móvel deixa de aparecer quando o rodapé entra na tela", () => {
    assert.match(script, /const footer = document\.querySelector\("\.lead-footer"\)/);
    assert.match(script, /let footerVisible = false/);
    assert.match(script, /!heroVisible && !simulatorVisible && !footerVisible/);
    assert.match(script, /const footerObserver = new IntersectionObserver/);
    assert.match(script, /footerObserver\.observe\(footer\)/);
    assert.match(leadStyles, /\.lead-sticky-cta\.is-visible\s*\{[\s\S]*?display:\s*flex/);
});
