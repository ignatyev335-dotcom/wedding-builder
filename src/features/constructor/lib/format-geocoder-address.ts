type AddressComponent = {
  kind?: string;
  name?: string;
};

const countryPattern = /^(Россия|Российская Федерация)$/i;
const regionPattern =
  /\b(область|край|республика|автономный округ|федеральный округ)\b/i;

function findComponent(
  components: AddressComponent[],
  kinds: string[],
) {
  return components.find(
    (component) =>
      component.kind &&
      kinds.includes(component.kind) &&
      component.name?.trim(),
  )?.name?.trim();
}

export function formatYandexAddress(
  components: AddressComponent[] | undefined,
  fallback: string,
) {
  if (!components?.length) {
    return cleanFallbackAddress(fallback);
  }

  const fallbackParts = splitCleanAddress(fallback);
  const city =
    findComponent(components, ["locality"]) ??
    fallbackParts.find(
      (part) =>
        !regionPattern.test(part) &&
        !/^(район|улица|ул\.|проспект|пр-т|дом|д\.)\b/i.test(part),
    ) ??
    findComponent(components, ["province"]);
  const district = findComponent(components, ["district", "area"]);
  const street = findComponent(components, ["street"]);
  const house = findComponent(components, ["house"]);
  const structuredParts = [city, district, street, house].filter(
    (part): part is string => Boolean(part),
  );

  return (
    [...new Set(structuredParts)].join(", ") ||
    cleanFallbackAddress(fallback)
  );
}

export function cleanFallbackAddress(address: string) {
  const parts = splitCleanAddress(address);
  const cityIndex = parts.findIndex((part) => !regionPattern.test(part));
  const startIndex = cityIndex >= 0 ? cityIndex : 0;

  return parts.slice(startIndex, startIndex + 4).join(", ");
}

function splitCleanAddress(address: string) {
  return address
    .split(",")
    .map((part) => part.trim())
    .filter(
      (part) =>
        part &&
        !/^\d{5,6}$/.test(part) &&
        !countryPattern.test(part),
    );
}
