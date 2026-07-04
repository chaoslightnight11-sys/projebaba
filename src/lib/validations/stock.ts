import { z } from "zod";

export const stockItemSchema = z.object({
  name: z.string().min(2, "Urun adi gerekli."),
  category: z.string().min(2, "Kategori gerekli."),
  currentQuantity: z.coerce.number().int().min(0),
  minimumQuantity: z.coerce.number().int().min(0),
  unit: z.string().min(1, "Birim gerekli."),
  supplier: z.string().optional().or(z.literal("")),
  purchasePrice: z.coerce.number().min(0)
});

export const stockMovementSchema = z.object({
  itemId: z.string().min(1),
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  quantity: z.coerce.number().int().positive(),
  note: z.string().optional().or(z.literal(""))
});
