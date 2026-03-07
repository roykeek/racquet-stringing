import { z } from "zod";

export const bookingSchema = z.object({
    clientName: z.string().min(2, "שם מלא חייב להכיל לפחות 2 תווים"),
    clientPhone: z.string()
        .regex(/^05\d{8}$/, "מספר טלפון לא תקין — יש להזין 10 ספרות (לדוגמה: 0501234567)"),
    manufacturerId: z.coerce.number().min(1, "יש לבחור יצרן"),
    modelId: z.coerce.number().optional().nullable(),
    customRacquetInfo: z.string().optional(),
    stringMain: z.string().optional(),
    stringCross: z.string().optional(),
    mainsTensionLbs: z.string()
        .optional()
        .refine(val => !val || (Number(val) >= 30 && Number(val) <= 70), {
            message: "המתיחה חייבת להיות בין 30 ל-70 Lbs",
        }),
    crossTensionLbs: z.string()
        .optional()
        .refine(val => !val || (Number(val) >= 30 && Number(val) <= 70), {
            message: "המתיחה חייבת להיות בין 30 ל-70 Lbs",
        }),
    racquetCount: z.coerce.number().min(1).default(1),
    urgency: z.enum(["Standard", "Express", "Immediate"]),
    dueDate: z.string().min(1, "יש לבחור תאריך מוערך"),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;

export const loginSchema = z.object({
    stringerId: z.coerce.number().min(1, "יש לבחור משתמש"),
    password: z.string().min(1, "יש להזין סיסמה"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
