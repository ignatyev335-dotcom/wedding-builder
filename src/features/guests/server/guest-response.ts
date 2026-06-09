import {
  alcoholPreferenceCodes,
  type AlcoholPreferenceCode,
  coupleAttendanceCodes,
  type CoupleAttendanceCode,
  guestTagCodes,
  type GuestTagCode,
  type GuestResponse,
  type GuestStatus,
  type TransportPreferenceCode,
} from "@/entities/wedding/model";

type GuestRecord = {
  id: string;
  name: string;
  phone: string;
  status: GuestStatus;
  magicToken: string | null;
  dietaryRestrictions: string | null;
  foodPreference: string | null;
  partnerFoodPreference: string | null;
  allergies: string | null;
  partnerAllergies: string | null;
  alcoholPreferences: string;
  needsTransport: boolean;
  transportPreference: TransportPreferenceCode | null;
  hasPlusOne: boolean;
  plusOneName: string | null;
  musicRequest: string | null;
  isCouple: boolean;
  partnerName: string | null;
  attendanceChoice: string | null;
  tags: string;
  customAnswers: string;
  respondedAt: Date | null;
  createdAt: Date;
};

export function toGuestResponse(
  guest: GuestRecord,
  slug: string,
  origin: string,
): GuestResponse {
  let alcoholPreferences: AlcoholPreferenceCode[] = [];

  try {
    const parsed = JSON.parse(guest.alcoholPreferences) as string[];
    alcoholPreferences = parsed.filter(
      (value): value is AlcoholPreferenceCode =>
        alcoholPreferenceCodes.includes(value as AlcoholPreferenceCode),
    );
  } catch {
    alcoholPreferences = [];
  }

  const drinks = alcoholPreferences.join(", ");
  let tags: GuestTagCode[] = [];
  let customAnswers: Record<string, string> = {};

  try {
    const parsed = JSON.parse(guest.tags) as string[];
    tags = parsed.filter((value): value is GuestTagCode =>
      guestTagCodes.includes(value as GuestTagCode),
    );
  } catch {
    tags = [];
  }

  try {
    const parsed = JSON.parse(guest.customAnswers) as Record<string, unknown>;
    customAnswers = Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    customAnswers = {};
  }

  return {
    id: guest.id,
    name: guest.name,
    phone: guest.phone,
    status: guest.status,
    magicToken: guest.magicToken,
    invitationUrl: guest.magicToken
      ? `${origin}/wedding/${encodeURIComponent(slug)}?guest=${encodeURIComponent(guest.magicToken)}`
      : null,
    dietaryRestrictions: guest.dietaryRestrictions ?? "",
    foodPreference: guest.foodPreference ?? "",
    partnerFoodPreference: guest.partnerFoodPreference ?? "",
    allergies: guest.allergies ?? "",
    partnerAllergies: guest.partnerAllergies ?? "",
    drinks,
    alcoholPreferences,
    needsTransport: guest.needsTransport,
    transportPreference:
      guest.transportPreference ?? (guest.needsTransport ? "TRANSFER" : null),
    hasPlusOne: guest.hasPlusOne,
    plusOneName: guest.plusOneName ?? "",
    musicRequest: guest.musicRequest ?? "",
    isCouple: guest.isCouple,
    partnerName: guest.partnerName ?? "",
    attendanceChoice: coupleAttendanceCodes.includes(
      guest.attendanceChoice as CoupleAttendanceCode,
    )
      ? (guest.attendanceChoice as CoupleAttendanceCode)
      : null,
    tags,
    customAnswers,
    respondedAt: (guest.respondedAt ?? guest.createdAt).toISOString(),
  };
}

export function getRequestOrigin(request: Request) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    new URL(request.url).origin
  );
}
