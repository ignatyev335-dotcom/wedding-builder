import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.string().trim().min(3).max(200);

export async function GET(request: Request) {
  const query = querySchema.safeParse(new URL(request.url).searchParams.get("q"));

  if (!query.success) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = process.env.YANDEX_GEOCODER_API_KEY
      ? await getYandexSuggestions(query.data)
      : await getOpenStreetMapSuggestions(query.data);

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}

async function getYandexSuggestions(query: string) {
  const url = new URL("https://geocode-maps.yandex.ru/v1/");
  url.searchParams.set("apikey", process.env.YANDEX_GEOCODER_API_KEY!);
  url.searchParams.set("geocode", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("results", "6");
  url.searchParams.set("lang", "ru_RU");

  const response = await fetch(url, {
    next: { revalidate: 86_400 },
  });

  if (!response.ok) {
    throw new Error("Yandex geocoder request failed.");
  }

  const data = (await response.json()) as {
    response?: {
      GeoObjectCollection?: {
        featureMember?: Array<{
          GeoObject?: {
            metaDataProperty?: {
              GeocoderMetaData?: {
                text?: string;
                Address?: { formatted?: string };
              };
            };
            Point?: { pos?: string };
          };
        }>;
      };
    };
  };

  return (data.response?.GeoObjectCollection?.featureMember ?? [])
    .map(({ GeoObject }) => {
      const [longitude, latitude] = GeoObject?.Point?.pos
        ?.split(" ")
        .map(Number) ?? [Number.NaN, Number.NaN];
      const address =
        GeoObject?.metaDataProperty?.GeocoderMetaData?.Address?.formatted ??
        GeoObject?.metaDataProperty?.GeocoderMetaData?.text;

      return address && Number.isFinite(latitude) && Number.isFinite(longitude)
        ? { address, latitude, longitude, provider: "yandex" }
        : null;
    })
    .filter((item) => item !== null);
}

async function getOpenStreetMapSuggestions(query: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");
  url.searchParams.set("accept-language", "ru");

  const response = await fetch(url, {
    headers: { "User-Agent": "Vowly wedding builder/1.0" },
    next: { revalidate: 86_400 },
  });

  if (!response.ok) {
    throw new Error("Fallback geocoder request failed.");
  }

  const data = (await response.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;

  return data.map((item) => ({
    address: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    provider: "openstreetmap",
  }));
}
