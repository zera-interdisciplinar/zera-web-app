import { z } from 'zod'

/** `TokenResponse` of `POST /auth/login` and `POST /auth/refresh`. */
export const tokenResponseSchema = z.object({
  userId: z.string().min(1),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenType: z.string().min(1),
  expiresIn: z.number().int().positive(),
})
export type TokenResponse = z.infer<typeof tokenResponseSchema>

/**
 * `UserOutput` of `GET /users/{id}`. `role` and `status` stay free-form on purpose:
 * the gate (BR-01/BR-02) decides what to do with a value this client does not know.
 */
export const userOutputSchema = z.object({
  userId: z.string().min(1),
  name: z.string(),
  email: z.string(),
  role: z.string().min(1),
  status: z.string().min(1),
  unitId: z.string().min(1).nullish(),
})
export type UserOutput = z.infer<typeof userOutputSchema>
