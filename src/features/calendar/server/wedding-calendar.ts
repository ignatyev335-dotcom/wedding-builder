type WeddingCalendarEvent = {
  title: string;
  date: Date;
  time: string;
  address: string;
  url: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatLocalDate(date: Date, time: string) {
  const [hours = 17, minutes = 0] = time.split(":").map(Number);
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    "T",
    pad(hours),
    pad(minutes),
    "00",
  ].join("");
}

function escapeIcs(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

export function buildWeddingIcs(event: WeddingCalendarEvent) {
  const start = formatLocalDate(event.date, event.time || "17:00");
  const endDate = new Date(event.date);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  const end = formatLocalDate(endDate, "00:00");
  const now = new Date()
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(/\.\d{3}Z$/, "Z");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vowly//Wedding Invitation//RU",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@vowly.ru`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(`Свадебное приглашение: ${event.url}`)}`,
    `LOCATION:${escapeIcs(event.address)}`,
    `URL:${event.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function buildGoogleCalendarUrl(event: WeddingCalendarEvent) {
  const start = formatLocalDate(event.date, event.time || "17:00");
  const endDate = new Date(event.date);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  const end = formatLocalDate(endDate, "00:00");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: `Свадебное приглашение: ${event.url}`,
    location: event.address,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
