import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  image: z.string().url("URL inválida").optional().or(z.literal("")),
});

const passwordRule = z
  .string()
  .min(8, "Senha deve ter ao menos 8 caracteres")
  .regex(/[A-Z]/, "Deve ter ao menos 1 letra maiúscula")
  .regex(/[0-9]/, "Deve ter ao menos 1 número")
  .regex(/[^A-Za-z0-9]/, "Deve ter ao menos 1 caractere especial");

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual obrigatória"),
    newPassword: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type ProfileInput = z.infer<typeof profileSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
