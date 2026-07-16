import assert from "node:assert/strict";
import test from "node:test";
import { searchProductOffers } from "../src/lib/services/productSearchService";

test("internet product offers are validated, filtered and sorted by delivered total", async () => {
  const previousUrl = process.env.PRODUCT_SEARCH_API_URL;
  const previousKey = process.env.PRODUCT_SEARCH_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.PRODUCT_SEARCH_API_URL = "https://search.example.test/products";
  process.env.PRODUCT_SEARCH_API_KEY = "test-product-search-key-123456789";
  let requestedUrl = "";
  let authorization = "";
  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input);
    authorization = String((init?.headers as Record<string, string>)?.authorization || "");
    return new Response(JSON.stringify({ offers: [
      { seller: "Pahalı", unitPrice: 100, shippingPrice: 20, productUrl: "https://shop.example/pahali", inStock: true },
      { seller: "Ucuz", unitPrice: 90, shippingPrice: 5, productUrl: "https://shop.example/ucuz", inStock: true },
      { seller: "Tükendi", unitPrice: 50, shippingPrice: 0, productUrl: "https://shop.example/tukendi", inStock: false }
    ] }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const offers = await searchProductOffers("  Anestezi   kartuşu  ");
    assert.equal(new URL(requestedUrl).searchParams.get("q"), "Anestezi kartuşu");
    assert.equal(authorization, "Bearer test-product-search-key-123456789");
    assert.deepEqual(offers.map((offer) => offer.seller), ["Ucuz", "Pahalı"]);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.PRODUCT_SEARCH_API_URL; else process.env.PRODUCT_SEARCH_API_URL = previousUrl;
    if (previousKey === undefined) delete process.env.PRODUCT_SEARCH_API_KEY; else process.env.PRODUCT_SEARCH_API_KEY = previousKey;
  }
});
