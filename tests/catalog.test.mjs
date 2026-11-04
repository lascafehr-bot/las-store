// Offline tests for the hidden 1 SAR test item. Run with:  npm run test:catalog
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const outdir = mkdtempSync(join(tmpdir(), "las-catalog-test-"));
await build({
  entryPoints: { products: join(root, "lib/products.ts"), store: join(root, "functions/_lib/store.ts") },
  bundle: true,
  platform: "node",
  format: "esm",
  outdir,
  logLevel: "error",
});
const load = (n) => import(pathToFileURL(join(outdir, `${n}.js`)).href);
const [products, store] = await Promise.all([load("products"), load("store")]);

test("the 1 SAR test item can be bought but is listed nowhere", () => {
  assert.ok(products.getAllProductSlugs().includes("test-1-sar"), "has its own page");
  assert.ok(products.getProductBySlug("test-1-sar"));
  for (const cat of ["coffee", "merch", "bundles"]) {
    assert.ok(!products.getProductsByCategory(cat).some((p) => p.slug === "test-1-sar"), cat);
  }
  assert.ok(!products.getFeaturedProducts().some((p) => p.slug === "test-1-sar"));
});

test("the server prices it at exactly 1 SAR, whatever the browser says", () => {
  const priced = store.priceItems([{ slug: "test-1-sar", quantity: 1, price: 999 }]);
  assert.equal(priced.total, 1);
});
