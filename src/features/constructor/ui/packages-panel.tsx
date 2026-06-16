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
    title: "�������",
    price: 0,
    description: "�������� ��������� ���� ��� �������� �������.",
    features: [
      "���������� ����������",
      "������� ������� �����",
      "������� ��������� � ������",
    ],
  },
  {
    code: "INTERACTIVE",
    title: "����������",
    price: 1990,
    description: "������� ��� ������ � ������� � ��������.",
    features: [
      "�� �� ��������",
      "��� ������� ���������",
      "����� ����� ������",
      "�������� ������� � �������",
    ],
    accent: true,
  },
  {
    code: "PREMIUM",
    title: "�������",
    price: 2990,
    description: "������ ����� ��� ������������ �����������.",
    features: [
      "�� �� �����������",
      "�������-�����",
      "������� ������ ��� ������",
      "���������� � Telegram-�����",
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
      setTelegramError("������� ��������� ��������� ����.");
      setIsConnecting(false);
      return;
    }
    if (!botUsername) {
      setTelegramError("������� NEXT_PUBLIC_TELEGRAM_BOT_USERNAME � ���������� �������.");
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
      setPublishSuccess("������ �����������. ����� ����� ���������� ������.");
    } catch {
      setPublishError("�� ���������� ����������� ������ �������������. �� ����� ������� � ����������� �������.");
    }
  };

  const publishSite = async () => {
    if (!siteId || siteId === "quiz-draft") {
      setPublishError("������� ��������� ���� � ��������� ����, ����� �� ����� ��� ������������.");
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
        throw new Error(payload.error || "�� ������� ������������ ����.");
      }

      const nextUrl =
        slug && typeof window !== "undefined"
          ? `${window.location.origin}/wedding/${slug}`
          : "";

      setPublishedUrl(nextUrl);
      setPublishSuccess(
        selected.price === 0
          ? "���� �����������. ����� ������� ��� � ��������� ������ ������."
          : "���� ����������� � �������� ������. ��������� ����� ����� ���������� ������ � �������������� ��������� ���������� ������.",
      );
    } catch (error) {
      setPublishError(
        error instanceof Error
          ? error.message
          : "�� ������� ������� ����. ���������� ��� ��� ����� ���� ������.",
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
    else setBrandingError(data.error || "�� ������� ��������� ���������.");
    setIsSavingBranding(false);
  };

  const downloadSaveTheDate = async () => {
    const source = heroImageMobile ?? heroImageDesktop ?? coverPhoto;
    if (!source) {
      setCardError("������� ��������� ���������� �������.");
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

      if (!context) throw new Error("Canvas ����������.");

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
      context.fillText("��������� ��� ����", 540, 1030);
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
      if (!blob) throw new Error("�� ������� ������� �����������.");

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "save-the-date.jpg";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setCardError(
        error instanceof Error ? error.message : "�� ������� ������� ��������.",
      );
    } finally {
      setIsGeneratingCard(false);
    }
  };

  return (
    <>
      <header className="packages-heading">
        <span>��� ���� ����� �����</span>
        <h2>������� �����������</h2>
        <p>�������� ����� � ����������� ����, ����� ��������� ������ ������.</p>
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
                <b>{currency.format(item.price)}</b> ₽
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
            <strong>{telegramProfile?.name ?? "����������� � ������ � Telegram"}</strong>
            <small>
              {telegramProfile
                ? "Аккаунт подключен"
                : "��������� ������� ��� ����������� �� ����"}
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
              "Подключено"
            ) : (
              "����� ����� Telegram"
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
            <strong>������ ������� ���������</strong>
            <small>
              {isPremium
                ? "�� ����� �� ����� ������ �������� �� Vowly�"
                : "�������� ������ ����� ��������� ������������ ������"}
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
            <strong>�������� �������</strong>
            <small>����� ������ ���� ������ ����� ����� PIN-����</small>
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
            <span>PIN-��� �� ������� ����</span>
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
            <strong>���� �����������</strong>
            <small>��������� ������, ����� � ������</small>
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
          {isGeneratingCard ? "������� ��������..." : "������� Save the Date"}
        </button>
        {cardError && <p className="telegram-error">{cardError}</p>}
      </section>

      <section className="package-checkout">
  <div>
    <span>������ �����</span>
    <strong>{selected.title}</strong>
    <b>{currency.format(selected.price)} ₽</b>
  </div>
  {selected.price === 0 ? (
    <button type="button" disabled={isPublishing} onClick={() => void publishSite()}>
      {isPublishing ? "��������� ����..." : "������� ���� � ��������� ������"}
    </button>
  ) : (
    <button type="button" disabled={isPublishing} onClick={() => void publishSite()}>
      {isPublishing ? "������� ����������..." : "������� ���� � ��������� ������"}
      <small>���</small>
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
          ����������� ������
        </button>
        <a href={publishedUrl} target="_blank" rel="noreferrer">
          ������� ����
        </a>
      </div>
    </div>
  )}
  <p>
    �� �����������, �� ������� ������� ��������� ���� ����� ����������,
    ������ �� ������ ��� �������.
  </p>
</section>
    </>
  );
}

function loadCanvasImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("�� ������� ��������� �������."));
    image.src = source;
  });
}

