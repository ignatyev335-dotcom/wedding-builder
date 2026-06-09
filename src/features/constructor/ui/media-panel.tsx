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
    coverPhoto,
    galleryPhotos,
    setCoverPhoto,
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

  const uploadCover = async (file?: File) => {
    if (!file) return;
    const photo = await imageToDataUrl(file);
    await save(() => setCoverPhoto(photo));
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
        <p>Добавьте живую обложку и соберите Love Story, которую гости смогут листать одним движением.</p>
      </header>

      <section className="media-section">
        <div className="media-section-title">
          <ImagePlus size={18} />
          <div>
            <strong>Главная обложка</strong>
            <small>Вертикальная фотография выглядит лучше всего</small>
          </div>
        </div>
        {coverPhoto ? (
          <div className="cover-upload-preview">
            <Image src={coverPhoto} alt="Обложка приглашения" fill unoptimized />
            <button type="button" onClick={() => void save(() => setCoverPhoto(null))}>
              <Trash2 size={15} /> Удалить
            </button>
          </div>
        ) : (
          <label className="media-dropzone">
            <Upload size={21} />
            <strong>Загрузить обложку</strong>
            <small>JPG, PNG или WebP. Изображение будет оптимизировано.</small>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => void uploadCover(event.target.files?.[0])}
            />
          </label>
        )}
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
