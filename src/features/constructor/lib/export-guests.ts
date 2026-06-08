import type { GuestResponse } from "@/entities/wedding/model";

const statusLabels = {
  PENDING: "Ждем ответа",
  ATTENDING: "Идет",
  NOT_ATTENDING: "Не идет",
} as const;

function csvCell(value: string | boolean) {
  const normalized = typeof value === "boolean" ? (value ? "Да" : "Нет") : value;
  return `"${normalized.replaceAll('"', '""')}"`;
}

export function exportGuestsToCsv(guests: GuestResponse[]) {
  const headers = ["Имя", "Статус", "Аллергии / еда", "Напитки", "Трансфер"];
  const rows = guests.map((guest) => [
    guest.name,
    statusLabels[guest.status],
    guest.dietaryRestrictions || "Нет",
    guest.drinks || "Не указано",
    guest.needsTransport,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(";"))
    .join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `vowly-guests-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
