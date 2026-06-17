"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { OptionalModule, QuizDraft, ThemeCode } from "@/entities/wedding/model";

type QuizStore = QuizDraft & {
  step: number;
  setNames: (partnerOneName: string, partnerTwoName: string) => void;
  setWeddingDate: (weddingDate: string) => void;
  setCeremonyTime: (ceremonyTime: string) => void;
  setTheme: (theme: ThemeCode) => void;
  setDesignThemeId: (designThemeId: string) => void;
  setMusicTrackId: (musicTrackId: string) => void;
  setInvitationTemplateId: (invitationTemplateId: string) => void;
  setAudioUrl: (audioUrl: string) => void;
  toggleModule: (module: OptionalModule) => void;
  setAcceptedTerms: (acceptedTerms: boolean) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
};

const initialState: QuizDraft & { step: number } = {
  step: 1,
  partnerOneName: "",
  partnerTwoName: "",
  weddingDate: "",
  ceremonyTime: "17:00",
  theme: "MINIMAL",
  templateStyle: "MINIMAL",
  designThemeId: "",
  musicTrackId: "",
  invitationTemplateId: "",
  audioUrl: "",
  modules: ["RSVP", "DRESS_CODE", "TIMELINE", "MAP", "COUNTDOWN"],
  acceptedTerms: false,
};

export const useQuizStore = create<QuizStore>()(
  persist(
    (set) => ({
      ...initialState,
      setNames: (partnerOneName, partnerTwoName) =>
        set({ partnerOneName, partnerTwoName }),
      setWeddingDate: (weddingDate) => set({ weddingDate }),
      setCeremonyTime: (ceremonyTime) => set({ ceremonyTime }),
      setTheme: (theme) => set({ theme, templateStyle: theme }),
      setDesignThemeId: (designThemeId) => set({ designThemeId }),
      setMusicTrackId: (musicTrackId) => set({ musicTrackId }),
      setInvitationTemplateId: (invitationTemplateId) =>
        set({ invitationTemplateId, templateStyle: invitationTemplateId || "MINIMAL" }),
      setAudioUrl: (audioUrl) => set({ audioUrl }),
      toggleModule: (module) =>
        set((state) => ({
          modules: state.modules.includes(module)
            ? state.modules.filter((item) => item !== module)
            : [...state.modules, module],
        })),
      setAcceptedTerms: (acceptedTerms) => set({ acceptedTerms }),
      next: () => set((state) => ({ step: Math.min(4, state.step + 1) })),
      back: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
      reset: () => set(initialState),
    }),
    {
      name: "wedding-builder-quiz",
    },
  ),
);
