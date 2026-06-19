import { getSystemSettingValue } from "@/lib/system-settings";

export async function getRuntimeSetting(key: string) {
  return (await getSystemSettingValue(key)) ?? process.env[key] ?? null;
}

export async function getRuntimeSettings<T extends string>(keys: T[]) {
  const entries = await Promise.all(
    keys.map(async (key) => [key, await getRuntimeSetting(key)] as const),
  );
  return Object.fromEntries(entries) as Record<T, string | null>;
}

export function settingRequiresServerRestart(key: string) {
  return key.startsWith("AUTH_") || key === "NEXTAUTH_SECRET" || key === "AUTH_SECRET";
}
