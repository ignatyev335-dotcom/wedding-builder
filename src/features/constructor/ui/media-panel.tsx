"use client";

import {
  GripVertical,
  ImagePlus,
  Images,
  LoaderCircle,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { imageToDataUrl } from "@/features/constructor/lib/image-to-data-url";
import { persistSiteExtras } from "@/features/constructor/lib/persist-site-extras";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";

const GALLERY_LIMIT = 30;

const stockLooks = [
  {
    id: "sage",
    title: "Шалфей и молоко",
    desktop: svgPreset("#eef4ea", "#ccd8c6", "SAGE"),
    mobile: svgPreset("#eef4ea", "#dfe8db", "VOWLY"),
  },
  {
    id: "pearl",
    title: "Жемчужный свет",
    desktop: svgPreset("#f7f2ea", "#e3d8c8", "PEARL"),
    mobile: svgPreset("#fbf6ef", "#e9ddd0", "VOWLY"),
  },
  {
    id: "evening",
    title: "Вечернее золото",
    desktop: svgPreset("#1f1b18", "#8c744c", "GOLD"),
    mobile: svgPreset("#231f1b", "#b89a63", "VOWLY"),
  },
];

export function MediaPanel() {
  const {
    heroImageDesktop,
    heroImageMobile,
    galleryPhotos,
    setHeroImageDesktop,
    setHeroImageMobile,
    addGalleryPhotos,
    removeGalleryPhoto,
    reorderGalleryPhotos,
  } = useWeddingStore();
  const [useStock, setUseStock] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [draggedPhoto, setDraggedPhoto] = useState<number | null>(null);

  const save = async (action: () => void) => {
    setIsSaving(true);
    setError("");
    action();

    try {
      await persistSiteExtras();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Не удалось сохранить фотографии.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const uploadCover = async (
    file: File | undefined,
    target: "desktop" | "mobile",
  ) => {
    if (!file) return;
    const photo = await imageToDataUrl(file, target === "desktop" ? 1800 : 1100);
    await save(() =>
      target === "desktop"
        ? setHeroImageDesktop(photo)
        : setHeroImageMobile(photo),
    );
  };

  const uploadGallery = async (files: FileList | null) => {
    if (!files?.length) return;

    const available = Math.max(0, GALLERY_LIMIT - galleryPhotos.length);
    const photos = await Promise.all(
      Array.from(files)
        .slice(0, available)
        .map((file) => imageToDataUrl(file, 1200)),
    );
    await save(() => addGalleryPhotos(photos));
  };

  const dropPhoto = async (overIndex: number) => {
    if (draggedPhoto === null || draggedPhoto === overIndex) {
      setDraggedPhoto(null);
      return;
    }

    await save(() => reorderGalleryPhotos(draggedPhoto, overIndex));
    setDraggedPhoto(null);
  };

  const applyStockLook = async (look: (typeof stockLooks)[number]) => {
    await save(() => {
      setHeroImageDesktop(look.desktop);
      setHeroImageMobile(look.mobile);
    });
  };

  return (
    <>
      <header className="media-heading">
        <span>Медиа</span>
        <h2>Фото и визуальная основа</h2>
        <p>
          Загрузите свои обложки и Love Story или выберите лаконичную заготовку,
          если пока не хотите использовать личные фотографии.
        </p>
      </header>

      <section className="media-stock-toggle">
        <div>
          <strong>Не использовать свои фото</strong>
          <small>
            Скроем загрузку обложек и покажем готовые спокойные варианты.
          </small>
        </div>
        <button
          className={`switch ${useStock ? "is-on" : ""}`}
          type="button"
          role="switch"
          aria-checked={useStock}
          onClick={() => setUseStock((value) => !value)}
        >
          <i />
        </button>
      </section>

      {useStock ? (
        <section className="media-section">
          <div className="media-section-title">
            <Sparkles size={18} />
            <div>
              <strong>Галерея заготовок</strong>
              <small>
                Выберите настроение. Позже сюда можно подключить загрузку
                вариантов из админки.
              </small>
            </div>
          </div>
          <div className="stock-look-grid">
            {stockLooks.map((look) => (
              <button
                type="button"
                key={look.id}
                onClick={() => void applyStockLook(look)}
              >
                <Image src={look.mobile} alt={look.title} fill unoptimized />
                <span>{look.title}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="media-section">
            <div className="media-section-title">
              <ImagePlus size={18} />
              <div>
                <strong>Главные обложки</strong>
                <small>
                  Два кадра помогают сохранить композицию на компьютере и
                  телефоне.
                </small>
              </div>
            </div>
            <div className="hero-upload-grid">
              <HeroUpload
                image={heroImageDesktop}
                title="Для компьютера"
                hint="Горизонтальный кадр, рекомендуем 16:9"
                onRemove={() => void save(() => setHeroImageDesktop(null))}
                onUpload={(file) => void uploadCover(file, "desktop")}
              />
              <HeroUpload
                image={heroImageMobile}
                title="Для телефона"
                hint="Вертикальный кадр, рекомендуем 4:5"
                mobile
                onRemove={() => void save(() => setHeroImageMobile(null))}
                onUpload={(file) => void uploadCover(file, "mobile")}
              />
            </div>
          </section>

          <section className="media-section">
            <div className="media-section-title">
              <Images size={18} />
              <div>
                <strong>Галерея Love Story</strong>
                <small>
                  {galleryPhotos.length} из {GALLERY_LIMIT} · перетаскивайте
                  фото для изменения порядка
                </small>
              </div>
            </div>

            <label className="gallery-bulk-upload">
              <Upload size={17} />
              <span>
                <strong>Выбрать несколько фотографий</strong>
                <small>Можно загрузить всю серию одним действием</small>
              </span>
              <input
                type="file"
                multiple
                disabled={galleryPhotos.length >= GALLERY_LIMIT}
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => void uploadGallery(event.target.files)}
              />
            </label>

            <div className="gallery-upload-grid">
              {galleryPhotos.map((photo, index) => (
                <div
                  className={draggedPhoto === index ? "is-dragging" : ""}
                  draggable
                  key={`${photo.slice(-20)}-${index}`}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    setDraggedPhoto(index);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    void dropPhoto(index);
                  }}
                  onDragEnd={() => setDraggedPhoto(null)}
                >
                  <Image src={photo} alt={`Love Story ${index + 1}`} fill unoptimized />
                  <span className="gallery-drag-handle" aria-hidden="true">
                    <GripVertical size={13} />
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    aria-label={`Удалить фото ${index + 1}`}
                    onClick={() => void save(() => removeGalleryPhoto(index))}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {galleryPhotos.length < GALLERY_LIMIT && (
                <label className="gallery-add">
                  <ImagePlus size={19} />
                  <span>Добавить</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => void uploadGallery(event.target.files)}
                  />
                </label>
              )}
            </div>
          </section>
        </>
      )}

      {isSaving && (
        <p className="media-status">
          <LoaderCircle className="spin" size={14} /> Сохраняем...
        </p>
      )}
      {error && <p className="telegram-error">{error}</p>}
    </>
  );
}

function HeroUpload({
  image,
  title,
  hint,
  mobile = false,
  onUpload,
  onRemove,
}: {
  image: string | null;
  title: string;
  hint: string;
  mobile?: boolean;
  onUpload: (file?: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="hero-upload-card">
      <div>
        <strong>{title}</strong>
        <small>{hint}</small>
      </div>
      {image ? (
        <div className={`cover-upload-preview ${mobile ? "is-mobile" : ""}`}>
          <Image src={image} alt={title} fill unoptimized />
          <button type="button" onClick={onRemove}>
            <Trash2 size={15} /> Удалить
          </button>
        </div>
      ) : (
        <label className={`media-dropzone ${mobile ? "is-mobile" : ""}`}>
          <Upload size={21} />
          <strong>Загрузить фото</strong>
          <small>JPG, PNG или WebP</small>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => onUpload(event.target.files?.[0])}
          />
        </label>
      )}
    </div>
  );
}

function svgPreset(background: string, accent: string, label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600"><defs><radialGradient id="g" cx="30%" cy="15%" r="80%"><stop offset="0" stop-color="${accent}"/><stop offset="0.42" stop-color="${background}"/><stop offset="1" stop-color="#fffaf2"/></radialGradient></defs><rect width="1200" height="1600" fill="url(#g)"/><circle cx="970" cy="240" r="180" fill="${accent}" opacity=".18"/><circle cx="220" cy="1320" r="250" fill="#ffffff" opacity=".32"/><text x="600" y="820" fill="#2d2a26" font-family="Georgia" font-size="72" text-anchor="middle" letter-spacing="12">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
