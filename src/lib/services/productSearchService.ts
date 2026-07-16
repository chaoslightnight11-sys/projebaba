import { z } from "zod";
import { prisma } from "@/lib/prisma";

const responseSchema = z.object({
  offers: z.array(z.object({
    seller: z.string().min(1),
    unitPrice: z.coerce.number().positive(),
    shippingPrice: z.coerce.number().min(0).default(0),
    productUrl: z.string().url().refine((url) => url.startsWith("https://")),
    inStock: z.boolean().default(true)
  })).max(50)
});

export async function searchProductOffers(query: string) {
  const endpoint = process.env.PRODUCT_SEARCH_API_URL;
  const apiKey = process.env.PRODUCT_SEARCH_API_KEY;
  if (!endpoint || !apiKey || !endpoint.startsWith("https://")) throw new Error("Canlı ürün arama sağlayıcısı yapılandırılmamış.");
  const normalizedQuery = query.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (normalizedQuery.length < 2 || normalizedQuery.length > 200) throw new Error("Ürün arama metni geçersiz.");

  const url = new URL(endpoint);
  url.searchParams.set("q", normalizedQuery);
  const response = await fetch(url, { headers: { authorization: `Bearer ${apiKey}`, accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error("Ürün fiyatları sağlayıcıdan alınamadı.");
  const payload = responseSchema.parse(await response.json());
  return payload.offers
    .filter((offer) => offer.inStock)
    .sort((left, right) => left.unitPrice + left.shippingPrice - right.unitPrice - right.shippingPrice);
}

export async function refreshProductOffers(organizationId: string, itemId: string) {
  const item = await prisma.stockItem.findFirst({ where: { id: itemId, organizationId }, select: { id: true, name: true, branchId: true } });
  if (!item) throw new Error("Stok kalemi bulunamadı.");
  const offers = await searchProductOffers(item.name);
  const checkedAt = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.stockOffer.deleteMany({ where: { itemId: item.id, organizationId } });
    if (offers.length) await tx.stockOffer.createMany({ data: offers.map((offer) => ({ ...offer, checkedAt, itemId: item.id, organizationId, branchId: item.branchId })) });
  });
  return offers.length;
}
