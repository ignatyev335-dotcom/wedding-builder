"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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

import type {
  GuestResponse,
  GuestStatus,
  PersonalizedGuest,
} from "@/entities/wedding/model";
import { tracks } from "@/features/constructor/model/tracks";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";

const monthFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function InvitationPreview({
  personalizedGuest = null,
}: {
  personalizedGuest?: PersonalizedGuest | null;
}) {
  const {
    partnerOneName,
    partnerTwoName,
    weddingDate,
    ceremonyTime,
    venueName,
    venueAddress,
    mapLatitude,
    mapLongitude,
    currentTheme,
    fontCode,
    blockOrder,
    moduleVisibility,
    musicTrack,
    timelineEvents,
    colorPalette,
    coverPhoto,
    galleryPhotos,
    wishlistText,
    wishlistItems,
    noFlowersEnabled,
    noFlowersText,
    transferDescription,
    transferTime,
    transferMeetingPoint,
    invitationText,
    postWeddingMode,
    postWeddingPhotoUrl,
    addGuest,
    updateGuest,
  } = useWeddingStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRsvpOpen, setIsRsvpOpen] = useState(Boolean(personalizedGuest));
  const [isRsvpSent, setIsRsvpSent] = useState(false);
  const [guestName, setGuestName] = useState(personalizedGuest?.name ?? "");
  const [guestStatus, setGuestStatus] = useState<GuestStatus>("ACCEPTED");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [foodPreference, setFoodPreference] = useState("Мясо");
  const [allergies, setAllergies] = useState("");
  const [drinks, setDrinks] = useState("");
  const [needsTransport, setNeedsTransport] = useState(false);
  const [isRsvpSaving, setIsRsvpSaving] = useState(false);
  const [rsvpError, setRsvpError] = useState("");
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
      foodPreference,
      allergies: allergies.trim(),
      drinks: drinks.trim(),
      needsTransport,
    });
    setIsRsvpSent(true);
    setGuestName("");
    setDietaryRestrictions("");
    setFoodPreference("Мясо");
    setAllergies("");
    setDrinks("");
    setNeedsTransport(false);
  };

  const submitPersonalizedRsvp = async (status: "ACCEPTED" | "DECLINED") => {
    if (!personalizedGuest) {
      return;
    }

    setIsRsvpSaving(true);
    setRsvpError("");

    try {
      const response = await fetch(
        `/api/guests/${encodeURIComponent(personalizedGuest.magicToken)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            dietaryRestrictions,
            foodPreference,
            allergies,
            drinks,
            needsTransport,
          }),
        },
      );
      const data = (await response.json()) as {
        guest?: GuestResponse;
        error?: string;
      };

      if (!response.ok || !data.guest) {
        throw new Error(data.error || "Не удалось сохранить ответ.");
      }

      updateGuest(data.guest);
      setGuestStatus(status);
      setIsRsvpSent(true);
    } catch (requestError) {
      setRsvpError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось сохранить ответ.",
      );
    } finally {
      setIsRsvpSaving(false);
    }
  };

  return (
    <article
      className={`wedding-site-preview wedding-theme-${currentTheme.toLowerCase()} wedding-font-${fontCode.toLowerCase()}`}
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
          <LoveStoryGallery photos={galleryPhotos} />
        </section>
      )}

      <div className="wedding-sortable-blocks">
      {postWeddingMode && (
        <section className="wedding-module post-wedding-thanks">
          <ImagePlus size={19} />
          <span>Спасибо, что были рядом</span>
          <h2>Этот день стал особенным благодаря вам</h2>
          <p>
            Поделитесь фотографиями и видео, которые сохранили самые теплые
            моменты нашего праздника.
          </p>
          {postWeddingPhotoUrl ? (
            <a
              href={postWeddingPhotoUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
            >
              <ImagePlus size={16} />
              Поделиться своими фото
              <ExternalLink size={13} />
            </a>
          ) : (
            <small>Молодожены скоро добавят ссылку для фотографий</small>
          )}
        </section>
      )}

      {!postWeddingMode && moduleVisibility.COUNTDOWN && (
        <section
          className="wedding-module wedding-countdown"
          style={{ order: blockOrder.indexOf("COUNTDOWN") }}
        >
          <CalendarDays size={19} />
          <span>До нашей встречи</span>
          <h2>Считаем мгновения вместе</h2>
          <Countdown weddingDate={weddingDate} ceremonyTime={ceremonyTime} />
        </section>
      )}

      {!postWeddingMode && moduleVisibility.TIMELINE && (
        <section
          className="wedding-module"
          style={{ order: blockOrder.indexOf("TIMELINE") }}
        >
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
        <section
          className="wedding-module wedding-dress"
          style={{ order: blockOrder.indexOf("DRESS_CODE") }}
        >
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
        <section
          className="wedding-module wedding-location"
          style={{ order: blockOrder.indexOf("MAP") }}
        >
          <MapPin size={19} />
          <span>Место проведения</span>
          <h2>{venueName || "До встречи на празднике"}</h2>
          <p>{venueAddress || "Укажите адрес площадки в конструкторе"}</p>
          {venueAddress && (
            <InteractiveYandexMap
              address={venueAddress}
              latitude={mapLatitude}
              longitude={mapLongitude}
            />
          )}
        </section>
      )}

      {moduleVisibility.TRANSFER && (
        <section
          className="wedding-module"
          style={{ order: blockOrder.indexOf("TRANSFER") }}
        >
          <CalendarDays size={19} />
          <span>Забота о дороге</span>
          <h2>Мы поможем добраться до площадки</h2>
          <p>{transferDescription}</p>
          <div className="transfer-details">
            <span>
              <strong>{transferTime}</strong>
              <small>время сбора</small>
            </span>
            <span>
              <strong>{transferMeetingPoint}</strong>
              <small>место сбора</small>
            </span>
          </div>
        </section>
      )}

      {(wishlistText || wishlistItems.length > 0) && (
        <section
          className="wedding-module wedding-wishlist"
          style={{ order: blockOrder.indexOf("WISHLIST") }}
        >
          <Gift size={19} />
          <span>Подарки</span>
          <h2>Ваше присутствие — уже подарок</h2>
          <p>{wishlistText}</p>
          {noFlowersEnabled && (
            <blockquote className="no-flowers-note">
              <span>Без цветов</span>
              <p>{noFlowersText}</p>
            </blockquote>
          )}
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
        <section
          className="wedding-module wedding-rsvp"
          style={{ order: blockOrder.indexOf("RSVP") }}
        >
          <Users size={19} />
          <span>Умный опрос гостей</span>
          <h2>Вы будете с нами?</h2>
          {personalizedGuest && !isRsvpSent ? (
            <div className="rsvp-form" onClick={(event) => event.stopPropagation()}>
              <p className="personal-rsvp-copy">
                Дорогой(ая) {personalizedGuest.name}, мы очень ждем тебя!
                Сможешь разделить этот день с нами?
              </p>
              <label>
                <span>Предпочтение в еде</span>
                <select
                  value={foodPreference}
                  onChange={(event) => setFoodPreference(event.target.value)}
                >
                  <option value="Мясо">Мясо</option>
                  <option value="Рыба">Рыба</option>
                  <option value="Веган">Веган</option>
                </select>
              </label>
              <label>
                <span>Аллергии</span>
                <input
                  value={allergies}
                  placeholder="Например, орехи или лактоза"
                  onChange={(event) => setAllergies(event.target.value)}
                />
              </label>
              <label>
                <span>Предпочтения по напиткам</span>
                <input
                  value={drinks}
                  placeholder="Вино, безалкогольные напитки"
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
              <div className="personal-rsvp-actions">
                <button
                  type="button"
                  disabled={isRsvpSaving}
                  onClick={() => void submitPersonalizedRsvp("ACCEPTED")}
                >
                  Да, буду
                </button>
                <button
                  type="button"
                  disabled={isRsvpSaving}
                  onClick={() => void submitPersonalizedRsvp("DECLINED")}
                >
                  К сожалению, не смогу
                </button>
              </div>
              {rsvpError && <p className="rsvp-error">{rsvpError}</p>}
            </div>
          ) : !isRsvpOpen ? (
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
                  className={guestStatus === "ACCEPTED" ? "is-selected" : ""}
                  type="button"
                  onClick={() => setGuestStatus("ACCEPTED")}
                >
                  Я приду
                </button>
                <button
                  className={guestStatus === "DECLINED" ? "is-selected" : ""}
                  type="button"
                  onClick={() => setGuestStatus("DECLINED")}
                >
                  Не смогу
                </button>
              </div>
              <label>
                <span>Предпочтение в еде</span>
                <select
                  value={foodPreference}
                  onChange={(event) => setFoodPreference(event.target.value)}
                >
                  <option value="Мясо">Мясо</option>
                  <option value="Рыба">Рыба</option>
                  <option value="Веган">Веган</option>
                </select>
              </label>
              <label>
                <span>Аллергии</span>
                <input
                  value={allergies}
                  placeholder="Например, орехи или лактоза"
                  onChange={(event) => setAllergies(event.target.value)}
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
      </div>
    </article>
  );
}

function LoveStoryGallery({ photos }: { photos: string[] }) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activePhoto, setActivePhoto] = useState(0);

  const scrollToPhoto = (index: number) => {
    const carousel = carouselRef.current;
    const slide = carousel?.children.item(index) as HTMLElement | null;

    if (!carousel || !slide) {
      return;
    }

    carousel.scrollTo({
      left: slide.offsetLeft,
      behavior: "smooth",
    });
  };

  const updateActivePhoto = () => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const center = carousel.scrollLeft + carousel.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    Array.from(carousel.children).forEach((child, index) => {
      const slide = child as HTMLElement;
      const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
      const distance = Math.abs(center - slideCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActivePhoto(closestIndex);
  };

  return (
    <div className="love-story-carousel">
      <div
        className="love-story-track"
        ref={carouselRef}
        onScroll={updateActivePhoto}
      >
        {photos.map((photo, index) => (
          <figure key={`${photo.slice(-20)}-${index}`}>
            <Image
              src={photo}
              alt={`Love Story ${index + 1}`}
              width={560}
              height={700}
              unoptimized
            />
          </figure>
        ))}
      </div>
      <div className="love-story-controls">
        <button
          type="button"
          aria-label="Предыдущая фотография"
          disabled={activePhoto === 0}
          onClick={(event) => {
            event.stopPropagation();
            scrollToPhoto(Math.max(0, activePhoto - 1));
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <span>
          {activePhoto + 1} / {photos.length}
        </span>
        <button
          type="button"
          aria-label="Следующая фотография"
          disabled={activePhoto === photos.length - 1}
          onClick={(event) => {
            event.stopPropagation();
            scrollToPhoto(Math.min(photos.length - 1, activePhoto + 1));
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function InteractiveYandexMap({
  address,
  latitude,
  longitude,
}: {
  address: string;
  latitude: number | null;
  longitude: number | null;
}) {
  const hasCoordinates = latitude !== null && longitude !== null;
  const mapSource = hasCoordinates
    ? `https://yandex.ru/map-widget/v1/?ll=${longitude}%2C${latitude}&z=16&pt=${longitude},${latitude},pm2rdm`
    : `https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(address)}&z=15`;
  const routeUrl = hasCoordinates
    ? `https://yandex.ru/maps/?rtext=~${latitude},${longitude}&rtt=auto`
    : `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;

  return (
    <div className="wedding-map">
      <iframe
        src={mapSource}
        title={`Карта: ${address}`}
        loading="lazy"
        allowFullScreen
      />
      <a
        href={routeUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
      >
        <MapPin size={15} />
        Построить маршрут
        <ExternalLink size={13} />
      </a>
    </div>
  );
}

function Countdown({
  weddingDate,
  ceremonyTime,
}: {
  weddingDate: string;
  ceremonyTime: string;
}) {
  const target = useMemo(
    () => new Date(`${weddingDate}T${ceremonyTime || "00:00"}:00`).getTime(),
    [ceremonyTime, weddingDate],
  );
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, target - Date.now()),
  );

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, target - Date.now()));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [target]);

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining / 3_600_000) % 24);
  const minutes = Math.floor((remaining / 60_000) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);

  return (
    <div className="countdown-grid">
      {[
        ["Дней", days],
        ["Часов", hours],
        ["Минут", minutes],
        ["Секунд", seconds],
      ].map(([label, value]) => (
        <div key={label}>
          <strong>{String(value).padStart(2, "0")}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
