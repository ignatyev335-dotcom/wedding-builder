import { z } from "zod";

import { optionalModules, themeCodes } from "@/entities/wedding/model";

export const quizSchema = z.object({
  partnerOneName: z.string().trim().min(2, "Введите имя жениха").max(60),
  partnerTwoName: z.string().trim().min(2, "Введите имя невесты").max(60),
  weddingDate: z
    .string()
    .min(1, "Выберите дату свадьбы")
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      "Некорректная дата",
    ),
  ceremonyTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Укажите точное время начала"),
  theme: z.enum(themeCodes),
  templateStyle: z.string().trim().min(1).max(100),
  designThemeId: z.string().trim().max(100).default(""),
  musicTrackId: z.string().trim().max(100).default(""),
  invitationTemplateId: z.string().trim().max(100).default(""),
  audioUrl: z.string().trim().max(2000).default(""),
  modules: z.array(z.enum(optionalModules)).max(optionalModules.length),
  acceptedTerms: z.literal(true, {
    error:
      "Необходимо принять условия обработки персональных данных",
  }),
});

export type QuizPayload = z.infer<typeof quizSchema>;
