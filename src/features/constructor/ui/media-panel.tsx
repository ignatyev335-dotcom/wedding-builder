"use client";

import { ImagePlus, Images, LoaderCircle, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { imageToDataUrl } from "@/features/constructor/lib/image-to-data-url";
import { persistSiteExtras } from "@/features/constructor/lib/persist-site-extras";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";

export function MediaPanel() {
  const {
    coverPhoto,
    galleryPhotos,
    setCoverPhoto,
    addGalleryPhotos,
    removeGalleryPhoto,
  } = useWeddingStore();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (action: () => void) => {
    setIsSaving(true);
    setError("");
    action();

    try {
      await persistSiteExtras();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Не удалось сохранить фото.",
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
    const available = Math.max(0, 8 - galleryPhotos.length);
    const photos = await Promise.all(
      Array.from(files).slice(0, available).map((file) => imageToDataUrl(file, 1200)),
    );
    await save(() => addGalleryPhotos(photos));
  };

  return (
    <>
      <header className="media-heading">
        <span>Медиа</span>
        <h2>Ваши фотографии</h2>
        <p>Добавьте живую обложку и небольшую Love Story для гостей.</p>
      </header>

      <section className="media-section">
        <div className="media-section-title">
          <ImagePlus size={18} />
          <div><strong>Главная обложка</strong><small>Вертикальное фото выглядит лучше всего</small></div>
        </div>
        {coverPhoto ? (
          <div className="cover-upload-preview">
            <Image src={coverPhoto} alt="Обложка приглашения" fill unoptimized />
            <button type="button" onClick={() => save(() => setCoverPhoto(null))}>
              <Trash2 size={15} /> Удалить
            </button>
          </div>
        ) : (
          <label className="media-dropzone">
            <Upload size={21} />
            <strong>Загрузить обложку</strong>
            <small>JPG, PNG · изображение будет оптимизировано</small>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => uploadCover(event.target.files?.[0])}
            />
          </label>
        )}
      </section>

      <section className="media-section">
        <div className="media-section-title">
          <Images size={18} />
          <div><strong>Галерея Love Story</strong><small>До 8 фотографий</small></div>
        </div>
        <div className="gallery-upload-grid">
          {galleryPhotos.map((photo, index) => (
            <div key={`${photo.slice(-20)}-${index}`}>
              <Image src={photo} alt={`Love Story ${index + 1}`} fill unoptimized />
              <button
                type="button"
                aria-label={`Удалить фото ${index + 1}`}
                onClick={() => save(() => removeGalleryPhoto(index))}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {galleryPhotos.length < 8 && (
            <label className="gallery-add">
              <ImagePlus size={19} />
              <span>Добавить</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => uploadGallery(event.target.files)}
              />
            </label>
          )}
        </div>
      </section>

      {isSaving && <p className="media-status"><LoaderCircle className="spin" size={14} /> Сохраняем...</p>}
      {error && <p className="telegram-error">{error}</p>}
    </>
  );
}
