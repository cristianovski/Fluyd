const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "consorcio/index.html"), "utf8");

const metaContent = (attribute, value) => {
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const tag = html.match(new RegExp(`<meta[^>]+${attribute}="${escaped}"[^>]*>`, "i"))?.[0];
    return tag?.match(/content="([^"]*)"/i)?.[1];
};

test("a leadpage mantém a estratégia de campanha e a URL canônica", () => {
    assert.equal(metaContent("name", "robots"), "noindex, follow");
    assert.match(html, /<link rel="canonical" href="https:\/\/www\.glid\.com\.br\/consorcio\/">/);
    assert.equal(metaContent("property", "og:url"), "https://www.glid.com.br/consorcio/");
});

test("o compartilhamento usa um card social absoluto de 1200 por 630", () => {
    const imageUrl = "https://www.glid.com.br/assets/img/social/glid-consorcio-og-1200x630.png";
    assert.equal(metaContent("property", "og:image"), imageUrl);
    assert.equal(metaContent("property", "og:image:secure_url"), imageUrl);
    assert.equal(metaContent("property", "og:image:type"), "image/png");
    assert.equal(metaContent("property", "og:image:width"), "1200");
    assert.equal(metaContent("property", "og:image:height"), "630");
    assert.ok(metaContent("property", "og:image:alt"));
    assert.equal(metaContent("name", "twitter:card"), "summary_large_image");
    assert.equal(metaContent("name", "twitter:image"), imageUrl);
    assert.ok(metaContent("name", "twitter:image:alt"));

    const imagePath = path.join(root, "assets/img/social/glid-consorcio-og-1200x630.png");
    const image = fs.readFileSync(imagePath);
    assert.equal(image.toString("ascii", 1, 4), "PNG");
    assert.equal(image.readUInt32BE(16), 1200);
    assert.equal(image.readUInt32BE(20), 630);
    assert.ok(image.byteLength > 0);
    assert.ok(image.byteLength < 1024 * 1024);
});
