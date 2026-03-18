import { z } from "zod";
import { RecurrenceFrequency, PaymentStatus } from "@prisma/client";

export const incomeSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  amount: z.coerce.number().positive("Valor deve ser maior que 0"),
  receiveDate: z.coerce.date(),
  categoryId: z.string().min(1, "Categoria obrigatória"),
  bankAccountId: z.string().min(1, "Conta bancária obrigatória"),
  status: z.nativeEnum(PaymentStatus).default("PENDING"),
  isRecurring: z.boolean().default(false),
  recurrenceFrequency: z.nativeEnum(RecurrenceFrequency).optional(),
  recurrenceStart: z.coerce.date().optional(),
  recurrenceEnd: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export type IncomeInput = z.infer<typeof incomeSchema>;
