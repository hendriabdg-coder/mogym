import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Harus mengandung huruf besar')
    .regex(/[a-z]/, 'Harus mengandung huruf kecil')
    .regex(/\d/, 'Harus mengandung angka'),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type ApiSuccess<T> = { success: true; data: T; message?: string };
export type ApiError = { success: false; error: string; code: string; details?: unknown };
