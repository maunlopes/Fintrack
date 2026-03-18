import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100),
  email: z.string().email("E-mail inválido").max(255),
  password: z
    .string()
    .min(8, "Senha deve ter ao menos 8 caracteres")
    .max(128)
    .regex(/[A-Z]/, "Deve ter ao menos 1 letra maiúscula")
    .regex(/[0-9]/, "Deve ter ao menos 1 número")
    .regex(/[^A-Za-z0-9]/, "Deve ter ao menos 1 caractere especial"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
