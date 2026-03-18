import { z } from "zod";
import { ExpenseType, PaymentStatus } from "@prisma/client";

export const expenseSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  amount: z.coerce.number().positive("Valor deve ser maior que 0"),
  dueDate: z.coerce.date(),
  categoryId: z.string().min(1, "Categoria obrigatória"),
  type: z.nativeEnum(ExpenseType),
  status: z.nativeEnum(PaymentStatus).default("PENDING"),
  isRecurring: z.boolean().default(false),
  recurrenceStart: z.coerce.date().optional(),
  recurrenceEnd: z.coerce.date().optional(),
  totalInstallments: z.coerce.number().int().min(2).max(60).optional(),
  bankAccountId: z.string().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
