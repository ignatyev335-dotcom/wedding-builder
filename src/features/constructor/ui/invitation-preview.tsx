"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Gift,
  ImagePlus,
  MapPin,
  Music2,
  Pause,
  Phone,
  Send,
  Shirt,
  Users,
  Volume2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type {
  PersonalizedGuest,
  CountdownStyleCode,
} from "@/entities/wedding/model";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";
import { RsvpQuestionnaire } from "@/features/constructor/ui/rsvp-questionnaire";
import { RsvpSuccessActions } from "@/features/constructor/ui/rsvp-success-actions";
import { weddingCopy } from "@/features/wedding/lib/wedding-copy";
import { getDefaultTrack } from "@/features/constructor/model/default-tracks";

const monthFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function InvitationPreview({
  personalizedGuest = null,
  previewMode,
}: {
  personalizedGuest?: PersonalizedGuest | null;
  previewMode?: "mobile" | "desktop";
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
    customMusicDataUrl,
    customMusicName,
    countdownTitle,
    countdownStyle,
    timelineEvents,
    colorPalette,
    dressMoodboard,
    faqItems,
    heroImageDesktop,
    heroImageMobile,
    coverPhoto,
    galleryPhotos,
    wishlistText,
    wishlistItems,
    giftPaymentLink,
    coordinatorName,
    coordinatorRole,
    coordinatorPhoto,
    coordinatorTelegram,
    coordinatorWhatsapp,
    coordinatorPhone,
    coordinatorMapLink,
    photoMask,
    cardStyle,
    noFlowersEnabled,
    noFlowersText,
    transferDescription,
    transferTime,
    transferMeetingPoint,
    invitationText,
    postWeddingMode,
    postWeddingPhotoUrl,
    postWeddingThankYouText,
    language,
    removeBranding,
  } = useWeddingStore();
  const t = weddingCopy[language];
  const selectedAudioSource = customMusicDataUrl ?? musicTrack;
  const selectedAudioName =
    customMusicName ?? getDefaultTrack(musicTrack)?.title ?? "Наша музыка";
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRsvpOpen, setIsRsvpOpen] = useState(Boolean(personalizedGuest));
  const [isRsvpSent, setIsRsvpSent] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }, [selectedAudioSource]);

  const playSelectedTrack = async () => {
    const audio = audioRef.current;
    if (!audio || !selectedAudioSource || isPlaying) {
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
    if (!audio || !selectedAudioSource) {
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

  return (
    <article
      className={`wedding-site-preview wedding-theme-${currentTheme.toLowerCase()} wedding-font-${fontCode.toLowerCase()} photo-mask-${photoMask.toLowerCase()} card-style-${cardStyle.toLowerCase()}`}
      onClick={playSelectedTrack}
    >
      {selectedAudioSource && (
        <>
          <audio ref={audioRef} src={selectedAudioSource} loop preload="none" />
          <button
            className={`floating-music-button ${isPlaying ? "is-playing" : ""}`}
            type="button"
            aria-label={isPlaying ? "Поставить музыку на паузу" : "Включить музыку"}
            title={selectedAudioName}
            onClick={togglePlayer}
          >
            {isPlaying ? <Pause size={16} /> : <Music2 size={16} />}
            <span>
              {isPlaying ? <Volume2 size={11} /> : selectedAudioName}
            </span>
          </button>
        </>
      )}

      <section
        className={`wedding-hero break-words hyphens-auto overflow-hidden ${
          heroImageDesktop || heroImageMobile || coverPhoto ? "has-cover" : ""
        }`}
      >
        {(heroImageDesktop || heroImageMobile || coverPhoto) && (
          <>
            {previewMode ? (
              <Image
                className="wedding-cover"
                src={
                  previewMode === "mobile"
                    ? heroImageMobile ?? heroImageDesktop ?? coverPhoto!
                    : heroImageDesktop ?? heroImageMobile ?? coverPhoto!
                }
                alt=""
                fill
                priority
                unoptimized
              />
            ) : (
              <>
                <Image
                  className="wedding-cover hidden md:block"
                  src={heroImageDesktop ?? heroImageMobile ?? coverPhoto!}
                  alt=""
                  fill
                  priority
                  unoptimized
                />
                <Image
                  className="wedding-cover block md:hidden"
                  src={heroImageMobile ?? heroImageDesktop ?? coverPhoto!}
                  alt=""
                  fill
                  priority
                  unoptimized
                />
              </>
            )}
            <div className="wedding-cover-overlay" />
          </>
        )}
        <span className="wedding-kicker">
          {postWeddingMode ? "Этот день останется с нами" : t.invitation}
        </span>
        <div className="boho-sun" aria-hidden="true" />
        <h1 className="wedding-couple-names">
          {partnerOneName}
          <i>&amp;</i>
          {partnerTwoName}
        </h1>
        <p>{postWeddingMode ? "Спасибо, что были с нами!" : formattedDate}</p>
        <span className="wedding-scroll-line" />
      </section>

      {!postWeddingMode && <section className="wedding-welcome">
        <span>{postWeddingMode ? "С любовью к вам" : t.dearGuests}</span>
        <h2>
          {postWeddingMode
            ? "Спасибо, что сделали этот день незабываемым"
            : t.welcome}
        </h2>
        <p>{invitationText}</p>
      </section>}

      {!postWeddingMode && galleryPhotos.length > 0 && (
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
          <p>{postWeddingThankYouText}</p>
          {postWeddingPhotoUrl ? (
            <a
              href={postWeddingPhotoUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
            >
              <ImagePlus size={19} />
              Скачать фотографии со свадьбы
              <ExternalLink size={13} />
            </a>
          ) : (
            <small>Ссылка на готовые фотографии скоро появится</small>
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
          <h2>{countdownTitle}</h2>
          <Countdown
            weddingDate={weddingDate}
            ceremonyTime={ceremonyTime}
            style={countdownStyle}
            language={language}
          />
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
          {dressMoodboard.length > 0 && (
            <div className="dress-moodboard">
              {dressMoodboard.map((photo, index) => (
                <figure key={`${photo.slice(-16)}-${index}`}>
                  <Image
                    src={photo}
                    alt={`Референс дресс-кода ${index + 1}`}
                    fill
                    unoptimized
                  />
                </figure>
              ))}
            </div>
          )}
        </section>
      )}

      {!postWeddingMode && moduleVisibility.MAP && (
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

      {!postWeddingMode && moduleVisibility.TRANSFER && (
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

      {!postWeddingMode && (wishlistText || wishlistItems.length > 0) && (
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
                  href={
                    item.type === "EXPERIENCE"
                      ? giftPaymentLink || "#"
                      : item.url || "#"
                  }
                  target={
                    (item.type === "EXPERIENCE" && giftPaymentLink) || item.url
                      ? "_blank"
                      : undefined
                  }
                  rel={
                    (item.type === "EXPERIENCE" && giftPaymentLink) || item.url
                      ? "noreferrer"
                      : undefined
                  }
                  onClick={(event) => event.stopPropagation()}
                >
                  <Gift size={15} />
                  <span>
                    {item.title || "Подарок"}
                    <small>
                      {item.type === "EXPERIENCE"
                        ? "Подарить впечатление"
                        : "Открыть подарок"}
                    </small>
                  </span>
                  <ExternalLink size={12} />
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      {!postWeddingMode && coordinatorName && (
        <section
          className="wedding-module wedding-coordinator"
          style={{ order: blockOrder.indexOf("COORDINATOR") }}
        >
          {coordinatorPhoto ? (
            <Image
              className="coordinator-avatar"
              src={coordinatorPhoto}
              alt={coordinatorName}
              width={112}
              height={112}
              unoptimized
            />
          ) : (
            <Users size={28} />
          )}
          <span>По всем вопросам</span>
          <h2>{coordinatorName}</h2>
          <p>{coordinatorRole || "Координатор свадьбы"}</p>
          <div className="coordinator-actions">
            {coordinatorTelegram && (
              <a
                href={coordinatorTelegram}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                <Send size={14} /> Telegram
              </a>
            )}
            {coordinatorWhatsapp && (
              <a
                href={coordinatorWhatsapp}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                <Phone size={14} /> WhatsApp
              </a>
            )}
            {coordinatorPhone && (
              <a
                href={`tel:${coordinatorPhone.replace(/[^\d+]/g, "")}`}
                onClick={(event) => event.stopPropagation()}
              >
                <Phone size={14} /> Позвонить
              </a>
            )}
            {coordinatorMapLink && (
              <a
                href={coordinatorMapLink}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                <MapPin size={14} /> Маршрут
              </a>
            )}
          </div>
        </section>
      )}

      {!postWeddingMode && faqItems.length > 0 && (
        <section
          className="wedding-module wedding-faq"
          style={{ order: blockOrder.indexOf("FAQ") }}
        >
          <span>Полезно знать</span>
          <h2>Частые вопросы</h2>
          <div className="faq-accordion">
            {faqItems.map((item) => (
              <details key={item.id}>
                <summary>
                  <span>{item.question || "Вопрос"}</span>
                  <ChevronDown size={16} />
                </summary>
                <p>{item.answer || "Ответ скоро появится."}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {!postWeddingMode && moduleVisibility.RSVP && (
        <section
          className="wedding-module wedding-rsvp"
          style={{ order: blockOrder.indexOf("RSVP") }}
        >
          <Users size={19} />
          <span>{t.survey}</span>
          <h2>{t.attendingQuestion}</h2>
          {!isRsvpOpen ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsRsvpOpen(true);
                setIsRsvpSent(false);
              }}
            >
              {t.confirm}
            </button>
          ) : isRsvpSent ? (
            <div className="rsvp-success">
              <strong>Ответ сохранен</strong>
              <p>Спасибо! Молодожены уже получили ваш ответ.</p>
              {personalizedGuest && (
                <RsvpSuccessActions magicToken={personalizedGuest.magicToken} />
              )}
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
            <RsvpQuestionnaire
              personalizedGuest={personalizedGuest}
              onComplete={() => setIsRsvpSent(true)}
            />
          )}
        </section>
      )}
      </div>
      {!removeBranding && (
        <footer className="vowly-signature">
          Создано на{" "}
          <Link href="/" onClick={(event) => event.stopPropagation()}>
            Vowly
          </Link>
        </footer>
      )}
    </article>
  );
}

function LoveStoryGallery({ photos }: { photos: string[] }) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const showPrevious = useCallback(() =>
    setLightboxIndex((index) =>
      index === null ? null : (index - 1 + photos.length) % photos.length,
    ), [photos.length]);
  const showNext = useCallback(() =>
    setLightboxIndex((index) =>
      index === null ? null : (index + 1) % photos.length,
    ), [photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex, showNext, showPrevious]);

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
            <button
              className="love-story-open"
              type="button"
              aria-label={`Открыть фотографию ${index + 1} на весь экран`}
              onClick={(event) => {
                event.stopPropagation();
                setLightboxIndex(index);
              }}
            >
              <Image
                src={photo}
                alt={`Love Story ${index + 1}`}
                width={560}
                height={700}
                unoptimized
              />
            </button>
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
      {lightboxIndex !== null &&
        createPortal(
          <div
            className="love-story-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Полноэкранная галерея Love Story"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              className="lightbox-close"
              type="button"
              aria-label="Закрыть галерею"
              onClick={() => setLightboxIndex(null)}
            >
              <X size={22} />
            </button>
            <button
              className="lightbox-previous"
              type="button"
              aria-label="Предыдущая фотография"
              onClick={(event) => {
                event.stopPropagation();
                showPrevious();
              }}
            >
              <ChevronLeft size={26} />
            </button>
            <div
              className="lightbox-stage"
              onClick={(event) => event.stopPropagation()}
              onTouchStart={(event) => {
                touchStartX.current = event.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                if (touchStartX.current === null) return;
                const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
                const delta = endX - touchStartX.current;
                touchStartX.current = null;
                if (Math.abs(delta) < 45) return;
                if (delta > 0) showPrevious();
                else showNext();
              }}
            >
              <Image
                key={`${lightboxIndex}-${photos[lightboxIndex]}`}
                src={photos[lightboxIndex]}
                alt={`Love Story ${lightboxIndex + 1}`}
                width={1600}
                height={1200}
                unoptimized
              />
              <span>{lightboxIndex + 1} / {photos.length}</span>
            </div>
            <button
              className="lightbox-next"
              type="button"
              aria-label="Следующая фотография"
              onClick={(event) => {
                event.stopPropagation();
                showNext();
              }}
            >
              <ChevronRight size={26} />
            </button>
          </div>,
          document.body,
        )}
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
  style,
  language,
}: {
  weddingDate: string;
  ceremonyTime: string;
  style: CountdownStyleCode;
  language: "RU" | "EN";
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
    <div className={`countdown-grid countdown-${style.toLowerCase()}`}>
      {[
        [weddingCopy[language].days, days],
        [weddingCopy[language].hours, hours],
        [weddingCopy[language].minutes, minutes],
        [weddingCopy[language].seconds, seconds],
      ].map(([label, value]) => (
        <div key={label}>
          <strong
            className={style === "FLIP" ? "countdown-flip-value" : undefined}
            key={`${label}-${value}`}
          >
            {String(value).padStart(2, "0")}
          </strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
