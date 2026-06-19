import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getCurrentAdmin } from "@/lib/auth/admin-session";

const uploadDir = path.join(process.cwd(), "public", "uploads", "admin");

const allowedTypes = {
  audio: new Set([
    "",
    "audio/mpeg",
    "audio/mp3",
    "audio/mpeg3",
    "audio/x-mpeg",
    "audio/x-mpeg-3",
    "application/octet-stream",
  ]),
  font: new Set([
    "",
    "font/woff2",
    "font/woff",
    "font/ttf",
    "font/otf",
    "application/font-woff",
    "application/x-font-ttf",
    "application/vnd.ms-fontobject",
    "application/octet-stream",
  ]),
  image: new Set([
    "",
    "image/svg+xml",
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/octet-stream",
  ]),
} as const;

const allowedExtensions = {
  audio: new Set([".mp3"]),
  font: new Set([".woff2", ".woff", ".ttf", ".otf"]),
  image: new Set([".svg", ".png", ".jpg", ".jpeg", ".webp"]),
} as const;

const maxSize = {
  audio: 12 * 1024 * 1024,
  font: 3 * 1024 * 1024,
  image: 4 * 1024 * 1024,
} as const;

type UploadKind = keyof typeof allowedTypes;

export async function POST(request: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Доступ запрещен." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const kindValue = formData.get("kind");
  const kind = typeof kindValue === "string" ? kindValue : "";

  if (!(file instanceof File) || !isUploadKind(kind)) {
    return NextResponse.json(
      { error: "Передайте файл и корректный тип загрузки." },
      { status: 400 },
    );
  }

  if (file.size > maxSize[kind]) {
    return NextResponse.json(
      { error: `Файл слишком большой. Лимит: ${formatLimit(maxSize[kind])}.` },
      { status: 400 },
    );
  }

  if (!isAllowedFile(file, kind)) {
    return NextResponse.json(
      { error: unsupportedFormatMessage(kind) },
      { status: 400 },
    );
  }

  await mkdir(uploadDir, { recursive: true });

  const extension = safeExtension(file.name, kind);
  const filename = `${kind}-${Date.now()}-${randomUUID()}${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), bytes);

  return NextResponse.json({
    url: `/uploads/admin/${filename}`,
    name: file.name,
    size: file.size,
    type: file.type,
  });
}

function isUploadKind(value: string): value is UploadKind {
  return value === "audio" || value === "font" || value === "image";
}

function isAllowedFile(file: File, kind: UploadKind) {
  const mime = file.type.toLowerCase();
  const extension = path.extname(file.name).toLowerCase();
  return allowedTypes[kind].has(mime) || allowedExtensions[kind].has(extension);
}

function safeExtension(filename: string, kind: UploadKind) {
  const extension = path.extname(filename).toLowerCase();
  if (
    extension &&
    /^[a-z0-9.]+$/.test(extension) &&
    allowedExtensions[kind].has(extension)
  ) {
    return extension;
  }
  if (kind === "audio") return ".mp3";
  if (kind === "font") return ".woff2";
  return ".png";
}

function formatLimit(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} МБ`;
}

function unsupportedFormatMessage(kind: UploadKind) {
  if (kind === "audio") return "Загрузите MP3-файл.";
  if (kind === "font") return "Загрузите шрифт .woff2, .woff, .ttf или .otf.";
  return "Загрузите SVG, PNG, JPG или WebP.";
}
