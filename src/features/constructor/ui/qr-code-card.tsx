"use client";

import { Download, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";

import { useWeddingStore } from "@/features/constructor/model/wedding-store";

export function QrCodeCard() {
  const slug = useWeddingStore((state) => state.slug);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const siteUrl =
    typeof window === "undefined"
      ? `https://vowly.ru/wedding/${slug ?? "preview"}`
      : `${window.location.origin}/wedding/${slug ?? "preview"}`;

  const downloadPng = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const anchor = document.createElement("a");
    anchor.download = "vowly-save-the-date-qr.png";
    anchor.href = canvas.toDataURL("image/png", 1);
    anchor.click();
  };

  return (
    <section className="qr-card">
      <div className="qr-copy">
        <span><QrCode size={17} /> Save the Date</span>
        <strong>QR-код приглашения</strong>
        <p>Добавьте его на бумажную карточку, конверт или рассадку.</p>
        <small>{siteUrl}</small>
        <button type="button" onClick={downloadPng}>
          <Download size={15} /> Скачать для типографии
        </button>
      </div>
      <div className="qr-canvas">
        <QRCodeCanvas
          ref={canvasRef}
          value={siteUrl}
          size={1024}
          marginSize={4}
          level="H"
          bgColor="#ffffff"
          fgColor="#273028"
        />
      </div>
    </section>
  );
}
