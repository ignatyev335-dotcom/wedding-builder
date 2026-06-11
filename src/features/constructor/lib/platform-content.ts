import type { PlatformContentConfig } from "@/entities/wedding/model";

export const defaultPlatformContent: PlatformContentConfig = {
  greetingEnabled: true,
  timelineEnabled: true,
  dressCodeEnabled: true,
  mapEnabled: true,
  rsvpEnabled: true,
  primaryButtonText: "Отправить ответ",
  footerText: "Создано на Vowly",
  errorText: "Что-то пошло не так. Попробуйте ещё раз.",
};
