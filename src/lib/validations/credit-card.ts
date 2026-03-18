import { z } from "zod";
import { CardBrand } from "@prisma/client";

export const creditCardSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(50),
  brand: z.nativeEnum(CardBrand),
  lastFourDigits: z
    .string()
    .regex(/^\d{4}$/, "Deve ter exatamente 4 dígitos")
    .optional()
    .or(z.literal("")),
  creditLimit: z.coerce.number().positive("Limite deve ser maior que 0"),
  closingDay: z.coerce.number().int().min(1).max(31),
  dueDay: z.coerce.number().int().min(1).max(31),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default("#FF5B04"),
  bankAccountId: z.string().optional().or(z.literal("")),
});

export const cardTransactionSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória").max(255),
  totalAmount: z.coerce.number().positive("Valor deve ser maior que 0"),
  purchaseDate: z.coerce.date(),
  categoryId: z.string().min(1, "Categoria obrigatória"),
  isInstallment: z.boolean().default(false),
  totalInstallments: z.coerce.number().int().min(2).max(48).optional(),
  isRecurring: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

export type CreditCardInput = z.infer<typeof creditCardSchema>;
export type CardTransactionInput = z.infer<typeof cardTransactionSchema>;
