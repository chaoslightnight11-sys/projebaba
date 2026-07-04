import { z } from "zod";

export const idSchema = z.string().min(1);

export const paginationSchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25)
});
