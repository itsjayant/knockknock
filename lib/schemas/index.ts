import { z } from "zod";

export const ringSchema = z.object({
    code: z.string().min(1).max(128),
    message: z.string().max(200).optional(),
});

export const createQrSchema = z.object({
    label: z.string().min(1).max(80),
});

export type RingPayload = z.infer<typeof ringSchema>;
export type CreateQrPayload = z.infer<typeof createQrSchema>;
