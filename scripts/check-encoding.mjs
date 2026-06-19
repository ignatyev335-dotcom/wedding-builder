import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const scanDirs = ["src", "prisma", "scripts"];
const ignoredFiles = new Set([
  path.normalize("scripts/check-encoding.mjs"),
  path.normalize("scripts/fix-mojibake.mjs"),
]);
const extensions = new Set([
  ".css",
  ".js",
  ".json",
  ".mjs",
  ".prisma",
  ".ts",
  ".tsx",
]);

const mojibakePatterns = [
  "Рџ",
  "Рќ",
  "Рћ",
  "РЎ",
  "Р ",
  "СЃ",
  "С‚",
  "СЊ",
  "СЋ",
  "СЏ",
  "вЂ",
  "�",
];

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") {
        continue;
      }

      files.push(...(await collectFiles(fullPath)));
      continue;
    }

    if (extensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = [];

for (const dir of scanDirs) {
  files.push(...(await collectFiles(path.join(root, dir))));
}

const hits = [];

for (const file of files) {
  if (ignoredFiles.has(path.normalize(path.relative(root, file)))) {
    continue;
  }

  const content = await readFile(file, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (mojibakePatterns.some((pattern) => line.includes(pattern))) {
      hits.push(`${path.relative(root, file)}:${index + 1}: ${line.trim().slice(0, 160)}`);
    }
  });
}

if (hits.length) {
  console.error("Found possible broken UTF-8 text:");
  console.error(hits.slice(0, 80).join("\n"));

  if (hits.length > 80) {
    console.error(`...and ${hits.length - 80} more`);
  }

  process.exit(1);
}

console.log("Encoding check passed.");
