"use client";

import {
  Check,
  Crown,
  Download,
  EyeOff,
  LockKeyhole,
  LoaderCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import type { PackageCode } from "@/entities/wedding/model";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";
import { persistSiteExtras } from "@/features/constructor/lib/persist-site-extras";
import { QrCodeCard } from "@/features/constructor/ui/qr-code-card";

const packages: Array<{
  code: PackageCode;
  title: string;
  price: number;
  description: string;
  features: string[];
  accent?: boolean;
}> = [
  {
    code: "BASIC",
    title: "Р‘Р°Р·РѕРІС‹Р№",
    price: 0,
    description: "РљСЂР°СЃРёРІРѕРµ РїСЂРёРіР»Р°С€РµРЅРёРµ РґР»СЏ РєР°РјРµСЂРЅРѕРіРѕ Р·Р°РїСѓСЃРєР°.",
    features: [
      "Р‘РµСЃРїР»Р°С‚РЅС‹Р№ СЃРІР°РґРµР±РЅС‹Р№ СЃР°Р№С‚",
      "РЎС‚Р°РЅРґР°СЂС‚РЅС‹Рµ СЃС‚РёР»Рё",
      "Р›РѕРіРѕС‚РёРї Vowly РІ С„СѓС‚РµСЂРµ",
    ],
  },
  {
    code: "INTERACTIVE",
    title: "РРЅС‚РµСЂР°РєС‚РёРІ",
    price: 1990,
    description: "РЎР°РјС‹Рµ РЅРµРѕР±С…РѕРґРёРјС‹Рµ С„СѓРЅРєС†РёРё РґР»СЏ СЂР°Р±РѕС‚С‹ СЃ РіРѕСЃС‚СЏРјРё.",
    features: [
      "Р’СЃС‘ РёР· Р‘Р°Р·РѕРІРѕРіРѕ",
      "Р‘РµР· Р»РѕРіРѕС‚РёРїР° Vowly",
      "РЈРјРЅС‹Р№ РѕРїСЂРѕСЃ РіРѕСЃС‚РµР№",
      "Р’С‹РіСЂСѓР·РєР° РѕС‚РІРµС‚РѕРІ РІ С‚Р°Р±Р»РёС†Сѓ",
    ],
    accent: true,
  },
  {
    code: "PREMIUM",
    title: "РџСЂРµРјРёСѓРј Р’Р°Р№Р»",
    price: 2990,
    description: "РџРѕР»РЅС‹Р№ РЅР°Р±РѕСЂ РґР»СЏ РїРµСЂСЃРѕРЅР°Р»СЊРЅРѕРіРѕ РїСЂРёРіР»Р°С€РµРЅРёСЏ.",
    features: [
      "Р’СЃС‘ РёР· РРЅС‚РµСЂР°РєС‚РёРІР°",
      "РџСЂРµРјРёСѓРј РјСѓР·С‹РєР° Suno",
      "РРјРµРЅРЅС‹Рµ СЃСЃС‹Р»РєРё РґР»СЏ РіРѕСЃС‚РµР№",
      "РРЅС‚РµРіСЂР°С†РёСЏ СЃ Telegram-Р±РѕС‚РѕРј",
    ],
  },
];

const currency = new Intl.NumberFormat("ru-RU");

export function PackagesPanel() {
  const {
    siteId,
    slug,
    isPremium,
    removeBranding,
    selectedPackage,
    telegramProfile,
    partnerOneName,
    partnerTwoName,
    weddingDate,
    heroImageDesktop,
    heroImageMobile,
    coverPhoto,
    isPrivate,
    pinCode,
    language,
    setSelectedPackage,
    setRemoveBranding,
    setPrivateSite,
    setPinCode,
    setLanguage,
  } = useWeddingStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [telegramError, setTelegramError] = useState("");
  const [cardError, setCardError] = useState("");
  const [brandingError, setBrandingError] = useState("");
  const [publishError, setPublishError] = useState("");
  const [publishSuccess, setPublishSuccess] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const selected = packages.find((item) => item.code === selectedPackage) ?? packages[0];

  const connectTelegram = async () => {
    setIsConnecting(true);
    setTelegramError("");
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

    if (!siteId || siteId === "quiz-draft") {
      setTelegramError("РЎРЅР°С‡Р°Р»Р° СЃРѕС…СЂР°РЅРёС‚Рµ СЃРІР°РґРµР±РЅС‹Р№ СЃР°Р№С‚.");
      setIsConnecting(false);
      return;
    }
    if (!botUsername) {
      setTelegramError("РЈРєР°Р¶РёС‚Рµ NEXT_PUBLIC_TELEGRAM_BOT_USERNAME РІ РЅР°СЃС‚СЂРѕР№РєР°С… РїСЂРѕРµРєС‚Р°.");
      setIsConnecting(false);
      return;
    }

    window.open(
      `https://t.me/${botUsername.replace(/^@/, "")}?start=site_${siteId}`,
      "_blank",
      "noopener,noreferrer",
    );
    setIsConnecting(false);
  };

  const saveSettings = () => {
    window.setTimeout(() => {
      void persistSiteExtras().catch(() => undefined);
    }, 0);
  };

  const copyPublishedUrl = async () => {
    if (!publishedUrl) return;

    try {
      await navigator.clipboard.writeText(publishedUrl);
      setPublishError("");
      setPublishSuccess("РЎСЃС‹Р»РєР° СЃРєРѕРїРёСЂРѕРІР°РЅР°. РњРѕР¶РЅРѕ СЃСЂР°Р·Сѓ РѕС‚РїСЂР°РІР»СЏС‚СЊ РіРѕСЃС‚СЏРј.");
    } catch {
      setPublishError("РќРµ РїРѕР»СѓС‡РёР»РѕСЃСЊ СЃРєРѕРїРёСЂРѕРІР°С‚СЊ СЃСЃС‹Р»РєСѓ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё. Р•С‘ РјРѕР¶РЅРѕ РѕС‚РєСЂС‹С‚СЊ Рё СЃРєРѕРїРёСЂРѕРІР°С‚СЊ РІСЂСѓС‡РЅСѓСЋ.");
    }
  };

  const publishSite = async () => {
    if (!siteId || siteId === "quiz-draft") {
      setPublishError("РЎРЅР°С‡Р°Р»Р° Р·Р°РІРµСЂС€РёС‚Рµ РєРІРёР· Рё СЃРѕС…СЂР°РЅРёС‚Рµ СЃР°Р№С‚, С‡С‚РѕР±С‹ РјС‹ РјРѕРіР»Рё РµРіРѕ РѕРїСѓР±Р»РёРєРѕРІР°С‚СЊ.");
      return;
    }

    setIsPublishing(true);
    setPublishError("");
    setPublishSuccess("");

    try {
      await persistSiteExtras();

      const response = await fetch(`/api/wedding-sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСѓР±Р»РёРєРѕРІР°С‚СЊ СЃР°Р№С‚.");
      }

      const nextUrl =
        slug && typeof window !== "undefined"
          ? `${window.location.origin}/wedding/${slug}`
          : "";

      setPublishedUrl(nextUrl);
      setPublishSuccess(
        selected.price === 0
          ? "РЎР°Р№С‚ РѕРїСѓР±Р»РёРєРѕРІР°РЅ. РњРѕР¶РЅРѕ РѕС‚РєСЂС‹С‚СЊ РµРіРѕ Рё РѕС‚РїСЂР°РІРёС‚СЊ СЃСЃС‹Р»РєСѓ РіРѕСЃС‚СЏРј."
          : "РЎР°Р№С‚ РѕРїСѓР±Р»РёРєРѕРІР°РЅ РІ С‚РµСЃС‚РѕРІРѕРј СЂРµР¶РёРјРµ. РЎР»РµРґСѓСЋС‰РёРј С€Р°РіРѕРј РјРѕР¶РЅРѕ РїРѕРґРєР»СЋС‡РёС‚СЊ РѕРїР»Р°С‚Сѓ Рё Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєСѓСЋ Р°РєС‚РёРІР°С†РёСЋ РІС‹Р±СЂР°РЅРЅРѕРіРѕ С‚Р°СЂРёС„Р°.",
      );
    } catch (error) {
      setPublishError(
        error instanceof Error
          ? error.message
          : "РќРµ СѓРґР°Р»РѕСЃСЊ РѕР¶РёРІРёС‚СЊ СЃР°Р№С‚. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р· С‡РµСЂРµР· РїР°СЂСѓ СЃРµРєСѓРЅРґ.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleBranding = async () => {
    if (!siteId || siteId === "quiz-draft" || !isPremium || isSavingBranding) return;

    const nextValue = !removeBranding;
    setIsSavingBranding(true);
    setBrandingError("");

    const response = await fetch(`/api/wedding-sites/${siteId}/branding`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeBranding: nextValue }),
    });
    const data = (await response.json()) as { error?: string };

    if (response.ok) setRemoveBranding(nextValue);
    else setBrandingError(data.error || "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РЅР°СЃС‚СЂРѕР№РєСѓ.");
    setIsSavingBranding(false);
  };

  const downloadSaveTheDate = async () => {
    const source = heroImageMobile ?? heroImageDesktop ?? coverPhoto;
    if (!source) {
      setCardError("РЎРЅР°С‡Р°Р»Р° Р·Р°РіСЂСѓР·РёС‚Рµ С„РѕС‚РѕРіСЂР°С„РёСЋ РѕР±Р»РѕР¶РєРё.");
      return;
    }

    setIsGeneratingCard(true);
    setCardError("");

    try {
      const image = await loadCanvasImage(source);
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const context = canvas.getContext("2d");

      if (!context) throw new Error("Canvas РЅРµРґРѕСЃС‚СѓРїРµРЅ.");

      const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.drawImage(
        image,
        (canvas.width - width) / 2,
        (canvas.height - height) / 2,
        width,
        height,
      );

      const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "rgba(16,18,15,.18)");
      gradient.addColorStop(0.55, "rgba(16,18,15,.08)");
      gradient.addColorStop(1, "rgba(16,18,15,.72)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.textAlign = "center";
      context.fillStyle = "#ffffff";
      context.font = "500 42px Georgia";
      context.fillText("РЎРћРҐР РђРќРРўР• Р­РўРЈ Р”РђРўРЈ", 540, 1030);
      context.font = "italic 92px Georgia";
      context.fillText(`${partnerOneName} & ${partnerTwoName}`, 540, 1145);
      context.font = "500 43px Arial";
      context.fillText(
        new Intl.DateTimeFormat("ru-RU", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }).format(new Date(`${weddingDate}T12:00:00`)),
        540,
        1235,
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.94),
      );
      if (!blob) throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ.");

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "save-the-date.jpg";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setCardError(
        error instanceof Error ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ РѕС‚РєСЂС‹С‚РєСѓ.",
      );
    } finally {
      setIsGeneratingCard(false);
    }
  };

  return (
    <>
      <header className="packages-heading">
        <span>Р’Р°С€ СЃР°Р№С‚ РїРѕС‡С‚Рё РіРѕС‚РѕРІ</span>
        <h2>РћР¶РёРІРёС‚Рµ РїСЂРёРіР»Р°С€РµРЅРёРµ</h2>
        <p>Р’С‹Р±РµСЂРёС‚Рµ СѓСЂРѕРІРµРЅСЊ Р·Р°Р±РѕС‚С‹, РєРѕС‚РѕСЂС‹Р№ РїРѕРґРѕР№РґРµС‚ РёРјРµРЅРЅРѕ РІР°С€РµР№ СЃРІР°РґСЊР±Рµ.</p>
      </header>

      <div className="package-grid">
        {packages.map((item) => {
          const isSelected = selectedPackage === item.code;

          return (
            <button
              key={item.code}
              className={`package-card ${item.accent ? "is-accent" : ""} ${
                isSelected ? "is-selected" : ""
              }`}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedPackage(item.code)}
            >
              <span className="package-choice">
                {isSelected && <Check size={14} />}
              </span>
              <span className="package-title">
                {item.code === "PREMIUM" ? <Crown size={17} /> : <Sparkles size={17} />}
                <strong>{item.title}</strong>
              </span>
              <span className="package-price">
                <b>{currency.format(item.price)}</b> в‚Ѕ
              </span>
              <small>{item.description}</small>
              <span className="package-features">
                {item.features.map((feature) => (
                  <i key={feature}>
                    <Check size={13} />
                    {feature}
                  </i>
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {selectedPackage === "PREMIUM" && (
        <section className="package-telegram">
          <span><Send size={18} /></span>
          <div>
            <strong>{telegramProfile?.name ?? "РЈРІРµРґРѕРјР»РµРЅРёСЏ Рѕ РіРѕСЃС‚СЏС… РІ Telegram"}</strong>
            <small>
              {telegramProfile
                ? "РђРєРєР°СѓРЅС‚ РїРѕРґРєР»СЋС‡РµРЅ"
                : "РџСЂРёРІСЏР¶РёС‚Рµ Р°РєРєР°СѓРЅС‚ РґР»СЏ СѓРІРµРґРѕРјР»РµРЅРёР№ РѕС‚ Р±РѕС‚Р°"}
            </small>
          </div>
          <button
            type="button"
            disabled={isConnecting || Boolean(telegramProfile)}
            onClick={connectTelegram}
          >
            {isConnecting ? (
              <LoaderCircle className="spin" size={15} />
            ) : telegramProfile ? (
              "РџРѕРґРєР»СЋС‡РµРЅРѕ"
            ) : (
              "Р’РѕР№С‚Рё С‡РµСЂРµР· Telegram"
            )}
          </button>
        </section>
      )}
      {telegramError && <p className="telegram-error">{telegramError}</p>}

      <QrCodeCard />

      <section className="premium-tools">
        <div className={`private-site-setting branding-setting ${!isPremium ? "is-locked" : ""}`}>
          <span>{isPremium ? <EyeOff size={18} /> : <LockKeyhole size={18} />}</span>
          <div>
            <strong>РЎРєСЂС‹С‚СЊ РїРѕРґРїРёСЃСЊ РїР»Р°С‚С„РѕСЂРјС‹</strong>
            <small>
              {isPremium
                ? "РќР° СЃР°Р№С‚Рµ РЅРµ Р±СѓРґРµС‚ СЃС‚СЂРѕРєРё В«РЎРѕР·РґР°РЅРѕ РЅР° VowlyВ»"
                : "Р”РѕСЃС‚СѓРїРЅРѕ С‚РѕР»СЊРєРѕ РїРѕСЃР»Рµ Р°РєС‚РёРІР°С†РёРё РїСЂРµРјРёР°Р»СЊРЅРѕРіРѕ С‚Р°СЂРёС„Р°"}
            </small>
          </div>
          <button
            className={`switch ${removeBranding ? "is-on" : ""}`}
            type="button"
            role="switch"
            aria-checked={removeBranding}
            disabled={!isPremium || isSavingBranding}
            onClick={() => void toggleBranding()}
          >
            <i />
          </button>
        </div>
        {brandingError && <p className="telegram-error">{brandingError}</p>}

        <div className="private-site-setting">
          <span><LockKeyhole size={18} /></span>
          <div>
            <strong>Р—Р°РєСЂС‹С‚Р°СЏ СЃРІР°РґСЊР±Р°</strong>
            <small>Р“РѕСЃС‚Рё СѓРІРёРґСЏС‚ СЃР°Р№С‚ С‚РѕР»СЊРєРѕ РїРѕСЃР»Рµ РІРІРѕРґР° PIN-РєРѕРґР°</small>
          </div>
          <button
            className={`switch ${isPrivate ? "is-on" : ""}`}
            type="button"
            role="switch"
            aria-checked={isPrivate}
            onClick={() => {
              setPrivateSite(!isPrivate);
              if (isPrivate) saveSettings();
            }}
          >
            <i />
          </button>
        </div>
        {isPrivate && (
          <label className="private-pin-field">
            <span>PIN-РєРѕРґ РёР· С‡РµС‚С‹СЂРµС… С†РёС„СЂ</span>
            <input
              inputMode="numeric"
              maxLength={4}
              value={pinCode}
              placeholder="2026"
              onChange={(event) =>
                setPinCode(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              onBlur={() => {
                if (pinCode.length === 4) saveSettings();
              }}
            />
          </label>
        )}

        <div className="language-setting">
          <div>
            <strong>РЇР·С‹Рє РїСЂРёРіР»Р°С€РµРЅРёСЏ</strong>
            <small>РЎРёСЃС‚РµРјРЅС‹Рµ РєРЅРѕРїРєРё, С„РѕСЂРјС‹ Рё С‚Р°Р№РјРµСЂ</small>
          </div>
          <div>
            {(["RU", "EN"] as const).map((code) => (
              <button
                className={language === code ? "is-selected" : ""}
                type="button"
                key={code}
                onClick={() => {
                  setLanguage(code);
                  saveSettings();
                }}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        <button
          className="save-date-download"
          type="button"
          disabled={isGeneratingCard}
          onClick={() => void downloadSaveTheDate()}
        >
          <Download size={17} />
          {isGeneratingCard ? "РЎРѕР·РґР°РµРј РѕС‚РєСЂС‹С‚РєСѓ..." : "РЎРєР°С‡Р°С‚СЊ Save the Date"}
        </button>
        {cardError && <p className="telegram-error">{cardError}</p>}
      </section>

      <section className="package-checkout">
  <div>
    <span>Выбран тариф</span>
    <strong>{selected.title}</strong>
    <b>{currency.format(selected.price)} ₽</b>
  </div>
  {selected.price === 0 ? (
    <button type="button" disabled={isPublishing} onClick={() => void publishSite()}>
      {isPublishing ? "Публикуем сайт..." : "Оживить сайт и отправить гостям"}
    </button>
  ) : (
    <button type="button" disabled={isPublishing} onClick={() => void publishSite()}>
      {isPublishing ? "Готовим публикацию..." : "Оживить сайт и отправить гостям"}
      <small>СБП</small>
    </button>
  )}
  {publishSuccess && <p className="publish-feedback is-success">{publishSuccess}</p>}
  {publishError && <p className="telegram-error">{publishError}</p>}
  {publishedUrl && (
    <div className="publish-result">
      <a href={publishedUrl} target="_blank" rel="noreferrer">
        {publishedUrl}
      </a>
      <div>
        <button type="button" onClick={() => void copyPublishedUrl()}>
          Скопировать ссылку
        </button>
        <a href={publishedUrl} target="_blank" rel="noreferrer">
          Открыть сайт
        </a>
      </div>
    </div>
  )}
  <p>
    Не переживайте, вы сможете вносить изменения даже после публикации,
    вплоть до самого дня свадьбы.
  </p>
</section>
    </>
  );
}

function loadCanvasImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РѕР±Р»РѕР¶РєСѓ."));
    image.src = source;
  });
}

