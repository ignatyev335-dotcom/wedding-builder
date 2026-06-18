export type LoginIdentity =
  | { kind: "email"; value: string; displayValue: string }
  | { kind: "phone"; value: string; displayValue: string };

export function parseLoginIdentity(rawValue: string): LoginIdentity | null {
  const value = rawValue.trim();

  if (!value) {
    return null;
  }

  if (value.includes("@")) {
    const email = value.toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? { kind: "email", value: email, displayValue: email }
      : null;
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("8")) {
    const phone = `+7${digits.slice(1)}`;
    return { kind: "phone", value: phone, displayValue: formatRussianPhone(phone) };
  }

  if (digits.length === 11 && digits.startsWith("7")) {
    const phone = `+${digits}`;
    return { kind: "phone", value: phone, displayValue: formatRussianPhone(phone) };
  }

  if (digits.length === 10 && digits.startsWith("9")) {
    const phone = `+7${digits}`;
    return { kind: "phone", value: phone, displayValue: formatRussianPhone(phone) };
  }

  return null;
}

export function formatRussianPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length !== 11 || !digits.startsWith("7")) {
    return phone;
  }

  return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

export function generateLoginCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
