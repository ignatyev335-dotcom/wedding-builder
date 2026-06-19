import { readFile, writeFile } from "node:fs/promises";

const decoder = new TextDecoder("utf-8", { fatal: false });
const cp1251Decoder = new TextDecoder("windows-1251");
const cp1251Reverse = new Map();

for (let byte = 0; byte <= 255; byte += 1) {
  cp1251Reverse.set(cp1251Decoder.decode(Uint8Array.from([byte])), byte);
}

const telltalePattern = /(?:Р[Ѐ-џA-Za-z]|С[Ѐ-џA-Za-z]|вЂ|В«|В»|В·|Р�|Р‘|Р”|Рџ|Рќ|РЎ)/;
const candidatePattern = /[А-Яа-яЁёЀ-џA-Za-z0-9№«»„“”.,:;!?()[\]\-–—/\s]{4,}/g;

function decodeCandidate(value) {
  const bytes = [];

  for (const char of value) {
    const byte = cp1251Reverse.get(char);
    if (byte === undefined) return value;
    bytes.push(byte);
  }

  const decoded = decoder.decode(Uint8Array.from(bytes));
  if (decoded.includes("�")) return value;
  return decoded;
}

function fixContent(content) {
  return content.replace(candidatePattern, (candidate) => {
    if (!telltalePattern.test(candidate)) return candidate;

    const decoded = decodeCandidate(candidate);
    const decodedCyrillicCount = (decoded.match(/[А-Яа-яЁё]/g) ?? []).length;
    const originalTelltaleCount = (candidate.match(/[РС][Ѐ-џ]/g) ?? []).length;

    return decodedCyrillicCount >= 2 && originalTelltaleCount >= 1
      ? decoded
      : candidate;
  });
}

const files = process.argv.slice(2);

if (!files.length) {
  console.error("Usage: node scripts/fix-mojibake.mjs <file...>");
  process.exit(1);
}

for (const file of files) {
  const content = await readFile(file, "utf8");
  const fixed = fixContent(content);
  if (fixed !== content) {
    await writeFile(file, fixed, "utf8");
    console.log(`fixed ${file}`);
  }
}
