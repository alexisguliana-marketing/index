import { z } from "zod";

const email = z.string().trim().toLowerCase().email();
const password = z.string().min(8, "8 caractères minimum");

export const signUpSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email,
  password,
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email,
  password: z.string().min(1),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const requestPasswordResetSchema = z.object({
  email,
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const resetPasswordSchema = z.object({
  password,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
