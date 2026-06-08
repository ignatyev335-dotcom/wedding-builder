"use client";

import {
  CalendarDays,
  ExternalLink,
  Gift,
  ImagePlus,
  MapPin,
  Music2,
  Pause,
  Shirt,
  Users,
  Volume2,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import type { GuestStatus } from "@/entities/wedding/model";
import { imageToDataUrl } from "@/features/constructor/lib/image-to-data-url";
import { persistSiteExtras } from "@/features/constructor/lib/persist-site-extras";
import { tracks } from "@/features/constructor/model/tracks";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";

const monthFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function InvitationPreview() {
  const {
    partnerOneName,
    partnerTwoName,
    weddingDate,
    currentTheme,
    moduleVisibility,
    musicTrack,
    timelineEvents,
    colorPalette,
    coverPhoto,
    galleryPhotos,
    wishlistText,
    wishlistItems,
    invitationText,
    postWeddingMode,
    addGalleryPhotos,
    addGuest,
  } = useWeddingStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);
  const [isRsvpSent, setIsRsvpSent] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestStatus, setGuestStatus] = useState<GuestStatus>("ATTENDING");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [drinks, setDrinks] = useState("");
  const [needsTransport, setNeedsTransport] = useState(false);
  const selectedTrack = useMemo(
    () => tracks.find((track) => track.id === musicTrack) ?? null,
    [musicTrack],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }, [musicTrack]);

  const playSelectedTrack = async () => {
    const audio = audioRef.current;
    if (!audio || !selectedTrack || isPlaying) {
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const togglePlayer = async (event: React.MouseEvent) => {
    event.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !selectedTrack) {
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const formattedDate = weddingDate
    ? monthFormatter.format(new Date(`${weddingDate}T12:00:00.000Z`))
    : "Дата вашей свадьбы";

  const submitRsvp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!guestName.trim()) {
      return;
    }

    addGuest({
      name: guestName.trim(),
      status: guestStatus,
      dietaryRestrictions: dietaryRestrictions.trim(),
      drinks: drinks.trim(),
      needsTransport,
    });
    setIsRsvpSent(true);
    setGuestName("");
    setDietaryRestrictions("");
    setDrinks("");
    setNeedsTransport(false);
  };

  const uploadGuestPhotos = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const available = Math.max(0, 8 - galleryPhotos.length);
    const photos = await Promise.all(
      Array.from(files)
        .slice(0, available)
        .map((file) => imageToDataUrl(file, 1200)),
    );
    addGalleryPhotos(photos);
    await persistSiteExtras().catch(() => undefined);
  };

  return (
    <article
      className={`wedding-site-preview wedding-theme-${currentTheme.toLowerCase()}`}
      onClick={playSelectedTrack}
    >
      {selectedTrack && (
        <>
          <audio ref={audioRef} src={selectedTrack.url} loop preload="none" />
          <button
            className={`floating-music-button ${isPlaying ? "is-playing" : ""}`}
            type="button"
            aria-label={isPlaying ? "Поставить музыку на паузу" : "Включить музыку"}
            title={selectedTrack.title}
            onClick={togglePlayer}
          >
            {isPlaying ? <Pause size={16} /> : <Music2 size={16} />}
            <span>{isPlaying ? <Volume2 size={11} /> : selectedTrack.title}</span>
          </button>
        </>
      )}

      <section className={`wedding-hero ${coverPhoto ? "has-cover" : ""}`}>
        {coverPhoto && (
          <>
            <Image
              className="wedding-cover"
              src={coverPhoto}
              alt=""
              fill
              priority
              unoptimized
            />
            <div className="wedding-cover-overlay" />
          </>
        )}
        <span className="wedding-kicker">
          {postWeddingMode ? "Этот день останется с нами" : "Приглашение на свадьбу"}
        </span>
        <div className="boho-sun" aria-hidden="true" />
        <h1>
          {partnerOneName}
          <i>&amp;</i>
          {partnerTwoName}
        </h1>
        <p>{postWeddingMode ? "Спасибо, что были с нами!" : formattedDate}</p>
        <span className="wedding-scroll-line" />
      </section>

      <section className="wedding-welcome">
        <span>{postWeddingMode ? "С любовью к вам" : "Дорогие гости"}</span>
        <h2>
          {postWeddingMode
            ? "Спасибо, что сделали этот день незабываемым"
            : "Будем счастливы разделить этот день с вами"}
        </h2>
        <p>{postWeddingMode ? "Сохраним самые теплые моменты вместе." : invitationText}</p>
      </section>

      {galleryPhotos.length > 0 && (
        <section className="wedding-module wedding-gallery">
          <span>Love Story</span>
          <h2>Моменты нашей истории</h2>
          <div>
            {galleryPhotos.map((photo, index) => (
              <Image
                key={`${photo.slice(-20)}-${index}`}
                src={photo}
                alt={`Love Story ${index + 1}`}
                width={420}
                height={520}
                unoptimized
              />
            ))}
          </div>
        </section>
      )}

      {postWeddingMode && (
        <section className="wedding-module post-wedding-gallery">
          <ImagePlus size={19} />
          <span>Общие воспоминания</span>
          <h2>Добавьте фотографии с праздника</h2>
          <p>Пусть этот альбом соберет моменты, которые увидели именно вы.</p>
          {galleryPhotos.length < 8 ? (
            <label>
              <ImagePlus size={16} />
              Загрузить фотографии
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => void uploadGuestPhotos(event.target.files)}
              />
            </label>
          ) : (
            <small className="post-gallery-full">Альбом уже наполнен воспоминаниями</small>
          )}
        </section>
      )}

      {!postWeddingMode && moduleVisibility.TIMELINE && (
        <section className="wedding-module">
          <CalendarDays size={19} />
          <span>Программа дня</span>
          <h2>Все важные моменты рядом</h2>
          <div className="timeline-row">
            {timelineEvents.map((event) => (
              <div className="timeline-preview-event" key={event.id}>
                <time>{event.time}</time>
                <p>{event.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!postWeddingMode && moduleVisibility.DRESS_CODE && (
        <section className="wedding-module wedding-dress">
          <Shirt size={19} />
          <span>Пожелания по стилю</span>
          <h2>Натуральные и спокойные оттенки</h2>
          <div className="preview-palette">
            {colorPalette.map((color, index) => (
              <i key={`${color}-${index}`} style={{ backgroundColor: color }} />
            ))}
          </div>
        </section>
      )}

      {moduleVisibility.MAP && (
        <section className="wedding-module wedding-location">
          <MapPin size={19} />
          <span>Место</span>
          <h2>Усадьба «Лесная»</h2>
          <p>Московская область, 24 км от города</p>
          <button type="button">Открыть карту</button>
        </section>
      )}

      {moduleVisibility.TRANSFER && (
        <section className="wedding-module">
          <CalendarDays size={19} />
          <span>Трансфер</span>
          <h2>Мы поможем добраться до площадки</h2>
          <p>Отправление от центра города в 14:30.</p>
        </section>
      )}

      {(wishlistText || wishlistItems.length > 0) && (
        <section className="wedding-module wedding-wishlist">
          <Gift size={19} />
          <span>Подарки</span>
          <h2>Ваше присутствие — уже подарок</h2>
          <p>{wishlistText}</p>
          {wishlistItems.length > 0 && (
            <div>
              {wishlistItems.map((item) => (
                <a
                  key={item.id}
                  href={item.url || "#"}
                  target={item.url ? "_blank" : undefined}
                  rel={item.url ? "noreferrer" : undefined}
                  onClick={(event) => event.stopPropagation()}
                >
                  <Gift size={15} />
                  <span>{item.title || "Подарок"}</span>
                  <ExternalLink size={12} />
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      {!postWeddingMode && moduleVisibility.RSVP && (
        <section className="wedding-module wedding-rsvp">
          <Users size={19} />
          <span>Умный опрос гостей</span>
          <h2>Вы будете с нами?</h2>
          {!isRsvpOpen ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsRsvpOpen(true);
                setIsRsvpSent(false);
              }}
            >
              Подтвердить участие
            </button>
          ) : isRsvpSent ? (
            <div className="rsvp-success">
              <strong>Ответ сохранен</strong>
              <p>Он уже появился во вкладке «Гости».</p>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsRsvpSent(false);
                }}
              >
                Добавить еще гостя
              </button>
            </div>
          ) : (
            <form className="rsvp-form" onSubmit={submitRsvp} onClick={(event) => event.stopPropagation()}>
              <label>
                <span>Имя гостя</span>
                <input
                  required
                  value={guestName}
                  placeholder="Иван Петров"
                  onChange={(event) => setGuestName(event.target.value)}
                />
              </label>
              <div className="rsvp-status">
                <button
                  className={guestStatus === "ATTENDING" ? "is-selected" : ""}
                  type="button"
                  onClick={() => setGuestStatus("ATTENDING")}
                >
                  Я приду
                </button>
                <button
                  className={guestStatus === "NOT_ATTENDING" ? "is-selected" : ""}
                  type="button"
                  onClick={() => setGuestStatus("NOT_ATTENDING")}
                >
                  Не смогу
                </button>
              </div>
              <label>
                <span>Аллергии и питание</span>
                <input
                  value={dietaryRestrictions}
                  placeholder="Например, без лактозы"
                  onChange={(event) => setDietaryRestrictions(event.target.value)}
                />
              </label>
              <label>
                <span>Предпочтения по напиткам</span>
                <input
                  value={drinks}
                  placeholder="Вино, безалкогольные"
                  onChange={(event) => setDrinks(event.target.value)}
                />
              </label>
              <label className="rsvp-checkbox">
                <input
                  type="checkbox"
                  checked={needsTransport}
                  onChange={(event) => setNeedsTransport(event.target.checked)}
                />
                <span>Нужен трансфер</span>
              </label>
              <button type="submit">Отправить ответ</button>
            </form>
          )}
        </section>
      )}
    </article>
  );
}
