import { z } from "zod";

export const transferSchema = z.object({
  fromAccountId: z.string().min(1, "Conta de origem obrigatória"),
  toAccountId: z.string().min(1, "Conta de destino obrigatória"),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  date: z.coerce.date(),
  description: z.string().max(500).optional(),
}).refine((data) => data.fromAccountId !== data.toAccountId, {
  message: "Conta de origem e destino devem ser diferentes",
  path: ["toAccountId"],
});

export type TransferInput = z.infer<typeof transferSchema>;
