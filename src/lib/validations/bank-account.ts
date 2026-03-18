import { z } from "zod";
import { BankAccountType } from "@prisma/client";

export const bankAccountSchema = z.object({
  name: z.string().min(1, "Nome do banco obrigatório"),
  nickname: z.string().min(1, "Apelido obrigatório"),
  type: z.nativeEnum(BankAccountType),
  balance: z.coerce.number(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default("#075056"),
});

export type BankAccountInput = z.infer<typeof bankAccountSchema>;
