export const DEFAULT_TRACKS = [
  {
    id: "tender-piano",
    title: "Нежное пианино",
    category: "Элегантная классика",
    src: "/music/tender-piano.mp3",
  },
  {
    id: "cinematic-vows",
    title: "Кинематографичные клятвы",
    category: "Атмосферный саундтрек",
    src: "/music/cinematic-vows.mp3",
  },
  {
    id: "acoustic-morning",
    title: "Акустическое утро",
    category: "Романтическая акустика",
    src: "/music/acoustic-morning.mp3",
  },
  {
    id: "soft-jazz-evening",
    title: "Мягкий джазовый вечер",
    category: "Легкий джаз",
    src: "/music/soft-jazz-evening.mp3",
  },
] as const;

export function getDefaultTrack(src: string | null) {
  return DEFAULT_TRACKS.find((track) => track.src === src) ?? null;
}
