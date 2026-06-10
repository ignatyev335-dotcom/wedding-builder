"use client";

import { Download, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";

type TicketGeneratorProps = {
  guestName: string;
  coupleNames: string;
  weddingDate: string;
  ceremonyTime?: string;
  venue?: string;
  invitationUrl: string;
};

export function TicketGenerator({
  guestName,
  coupleNames,
  weddingDate,
  ceremonyTime = "17:00",
  venue = "Место проведения свадьбы",
  invitationUrl,
}: TicketGeneratorProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const downloadPng = async () => {
    const ticket = ticketRef.current;
    if (!ticket) return;

    setIsExporting(true);

    try {
      const clone = ticket.cloneNode(true) as HTMLElement;
      clone.style.width = `${ticket.offsetWidth}px`;
      clone.style.height = `${ticket.offsetHeight}px`;

      const markup = new XMLSerializer().serializeToString(clone);
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg"
             width="${ticket.offsetWidth * 2}"
             height="${ticket.offsetHeight * 2}"
             viewBox="0 0 ${ticket.offsetWidth} ${ticket.offsetHeight}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">${markup}</div>
          </foreignObject>
        </svg>`;
      const image = new Image();
      const source = URL.createObjectURL(
        new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
      );

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Не удалось подготовить билет."));
        image.src = source;
      });

      const canvas = document.createElement("canvas");
      canvas.width = ticket.offsetWidth * 2;
      canvas.height = ticket.offsetHeight * 2;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas недоступен.");

      context.scale(2, 2);
      context.drawImage(image, 0, 0);
      URL.revokeObjectURL(source);

      const anchor = document.createElement("a");
      anchor.download = `wedding-ticket-${guestName.trim().replace(/\s+/g, "-")}.png`;
      anchor.href = canvas.toDataURL("image/png", 1);
      anchor.click();
    } finally {
      setIsExporting(false);
    }
  };

  const printPdf = () => {
    const ticket = ticketRef.current;
    if (!ticket) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html lang="ru">
        <head>
          <title>Свадебный билет</title>
          <style>
            body { margin: 0; display: grid; min-height: 100vh; place-items: center; }
            @page { size: A5 landscape; margin: 12mm; }
          </style>
        </head>
        <body>${ticket.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div
        ref={ticketRef}
        style={{
          width: "min(100%, 720px)",
          boxSizing: "border-box",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 28,
          alignItems: "center",
          padding: 32,
          border: "1px solid #94826d",
          outline: "6px double #d8cbb9",
          outlineOffset: "-14px",
          borderRadius: 24,
          color: "#302b26",
          background: "#fbf7ef",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div>
          <small style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}>
            Приглашение на свадьбу
          </small>
          <h2 style={{ margin: "14px 0 6px", fontSize: 36, fontWeight: 500 }}>
            {coupleNames}
          </h2>
          <p style={{ margin: "0 0 22px", fontSize: 17 }}>
            Дорогой(ая) {guestName}, этот билет создан специально для вас.
          </p>
          <div style={{ display: "grid", gap: 6, fontSize: 15 }}>
            <strong>{weddingDate} · {ceremonyTime}</strong>
            <span>{venue}</span>
          </div>
        </div>

        <div style={{ display: "grid", justifyItems: "center", gap: 8 }}>
          <div style={{ padding: 10, borderRadius: 14, background: "#fff" }}>
            <QRCodeSVG value={invitationUrl} size={128} level="H" />
          </div>
          <small>Ваш персональный QR</small>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button type="button" disabled={isExporting} onClick={() => void downloadPng()}>
          <Download size={16} />
          {isExporting ? "Готовим билет..." : "Скачать PNG"}
        </button>
        <button type="button" onClick={printPdf}>
          <Printer size={16} />
          Сохранить как PDF
        </button>
      </div>
    </section>
  );
}
