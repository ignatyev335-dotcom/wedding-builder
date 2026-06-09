"use client";

import {
  GripVertical,
  ImagePlus,
  Images,
  LoaderCircle,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { imageToDataUrl } from "@/features/constructor/lib/image-to-data-url";
import { persistSiteExtras } from "@/features/constructor/lib/persist-site-extras";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";

const GALLERY_LIMIT = 30;

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

  return (
    <>
      <header className="media-heading">
        <span>Медиа</span>
        <h2>Ваши фотографии</h2>
        <p>Подготовьте отдельные обложки для большого экрана и телефона, затем соберите Love Story.</p>
      </header>

      <section className="media-section">
        <div className="media-section-title">
          <ImagePlus size={18} />
          <div>
            <strong>Главные обложки</strong>
            <small>Два кадра помогут сохранить композицию на любом экране</small>
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
              {galleryPhotos.length} из {GALLERY_LIMIT} · перетаскивайте для изменения порядка
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
