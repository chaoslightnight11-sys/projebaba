import { StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stockItemSchema, stockMovementSchema } from "@/lib/validations/stock";
import type { z } from "zod";

type StockItemInput = z.infer<typeof stockItemSchema>;
type StockMovementInput = z.infer<typeof stockMovementSchema>;

export async function getStocks(organizationId: string) {
  return prisma.stockItem.findMany({
    where: { organizationId },
    include: {
      branch: { select: { name: true } },
      movements: { orderBy: { movedAt: "desc" }, take: 5 }
    },
    orderBy: [{ currentQuantity: "asc" }, { name: "asc" }]
  });
}

export async function createStockItem(organizationId: string, branchId: string, input: StockItemInput) {
  return prisma.stockItem.create({
    data: {
      name: input.name,
      category: input.category,
      currentQuantity: input.currentQuantity,
      minimumQuantity: input.minimumQuantity,
      unit: input.unit,
      supplier: input.supplier || null,
      purchasePrice: input.purchasePrice,
      organizationId,
      branchId
    }
  });
}

export async function createStockMovement(organizationId: string, branchId: string, input: StockMovementInput) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.stockItem.findFirst({ where: { id: input.itemId, organizationId } });
    if (!item) {
      throw new Error("Stok kalemi bulunamadi.");
    }

    const type = input.type as StockMovementType;
    const nextQuantity =
      type === StockMovementType.IN
        ? item.currentQuantity + input.quantity
        : type === StockMovementType.OUT
          ? Math.max(item.currentQuantity - input.quantity, 0)
          : input.quantity;

    await tx.stockItem.update({
      where: { id: item.id },
      data: { currentQuantity: nextQuantity }
    });

    return tx.stockMovement.create({
      data: {
        itemId: item.id,
        type,
        quantity: input.quantity,
        note: input.note || null,
        organizationId,
        branchId: item.branchId || branchId
      }
    });
  });
}
