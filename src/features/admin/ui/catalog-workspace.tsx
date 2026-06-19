"use client";

import {
  Database,
  FileType2,
  ImagePlus,
  Music2,
  Palette,
  Type,
} from "lucide-react";
import { useState } from "react";

import type {
  AudioTrackOption,
  CustomFontOption,
  DesignThemeOption,
  InvitationTemplateOption,
  MediaAssetOption,
} from "@/entities/wedding/model";
import { ContentCatalogPanel } from "@/features/admin/ui/content-catalog-panel";
import { DesignThemePanel } from "@/features/admin/ui/design-theme-panel";
import { FontManagerPanel } from "@/features/admin/ui/font-manager-panel";
import { MediaManagerPanel } from "@/features/admin/ui/media-manager-panel";

type CatalogTab = "templates" | "music" | "fonts" | "themes" | "media";

const catalogTabs: Array<{
  id: CatalogTab;
  label: string;
  helper: string;
  icon: typeof Type;
}> = [
  {
    id: "templates",
    label: "Тексты",
    helper: "Тон приглашений",
    icon: Type,
  },
  {
    id: "music",
    label: "Музыка",
    helper: "MP3-библиотека",
    icon: Music2,
  },
  {
    id: "fonts",
    label: "Шрифты",
    helper: "Файлы и ссылки",
    icon: FileType2,
  },
  {
    id: "themes",
    label: "Темы",
    helper: "Цвета и стиль",
    icon: Palette,
  },
  {
    id: "media",
    label: "Медиа",
    helper: "Обложки и элементы",
    icon: ImagePlus,
  },
];

export function CatalogWorkspace({
  tracks,
  templates,
  designThemes,
  customFonts,
  mediaAssets,
}: {
  tracks: AudioTrackOption[];
  templates: InvitationTemplateOption[];
  designThemes: DesignThemeOption[];
  customFonts: CustomFontOption[];
  mediaAssets: MediaAssetOption[];
}) {
  const [activeTab, setActiveTab] = useState<CatalogTab>("templates");

  return (
    <section className="catalog-workspace">
      <aside className="catalog-workspace-nav" aria-label="Разделы каталога">
        <div className="catalog-workspace-summary">
          <Database size={18} />
          <span>Каталог</span>
          <strong>{tracks.length + templates.length + designThemes.length + customFonts.length + mediaAssets.length}</strong>
        </div>
        {catalogTabs.map(({ id, label, helper, icon: Icon }) => (
          <button
            className={activeTab === id ? "is-active" : ""}
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} />
            <span>
              <strong>{label}</strong>
              <small>{helper}</small>
            </span>
          </button>
        ))}
      </aside>

      <div className="catalog-workspace-panel">
        {activeTab === "templates" && (
          <ContentCatalogPanel
            mode="templates"
            initialTracks={tracks}
            initialTemplates={templates}
          />
        )}
        {activeTab === "music" && (
          <ContentCatalogPanel
            mode="tracks"
            initialTracks={tracks}
            initialTemplates={templates}
          />
        )}
        {activeTab === "fonts" && <FontManagerPanel initialFonts={customFonts} />}
        {activeTab === "themes" && (
          <DesignThemePanel
            initialThemes={designThemes}
            customFonts={customFonts}
          />
        )}
        {activeTab === "media" && <MediaManagerPanel initialAssets={mediaAssets} />}
      </div>
    </section>
  );
}
