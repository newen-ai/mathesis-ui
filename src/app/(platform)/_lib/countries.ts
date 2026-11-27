/**
 * Countries for the nationality select: the 193 UN member states plus Palestine, the Holy See,
 * Kosovo and Taiwan, as ISO 3166-1 alpha-2 codes. The profile stores the code; labels come from
 * Intl.DisplayNames in the UI language, so the list follows the user's language.
 */
export const COUNTRY_CODES = [
  "AF", "AL", "DZ", "AD", "AO", "AG", "AR", "AM", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY",
  "BE", "BZ", "BJ", "BT", "BO", "BA", "BW", "BR", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA",
  "CF", "TD", "CL", "CN", "CO", "KM", "CG", "CD", "CR", "CI", "HR", "CU", "CY", "CZ", "DK", "DJ",
  "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FJ", "FI", "FR", "GA", "GM", "GE",
  "DE", "GH", "GR", "GD", "GT", "GN", "GW", "GY", "HT", "HN", "HU", "IS", "IN", "ID", "IR", "IQ",
  "IE", "IL", "IT", "JM", "JP", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB",
  "LS", "LR", "LY", "LI", "LT", "LU", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MR", "MU", "MX",
  "FM", "MD", "MC", "MN", "ME", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NZ", "NI", "NE", "NG",
  "MK", "NO", "OM", "PK", "PW", "PA", "PG", "PY", "PE", "PH", "PL", "PT", "QA", "RO", "RU", "RW",
  "KN", "LC", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "SO",
  "ZA", "SS", "ES", "LK", "SD", "SR", "SE", "CH", "SY", "TJ", "TZ", "TH", "TL", "TG", "TO", "TT",
  "TN", "TR", "TM", "TV", "UG", "UA", "AE", "GB", "US", "UY", "UZ", "VU", "VE", "VN", "YE", "ZM",
  "ZW", "PS", "VA", "XK", "TW",
] as const;

const COUNTRY_CODE_SET = new Set<string>(COUNTRY_CODES);

/** Intl names that read oddly as a nationality choice. */
const LABEL_OVERRIDES: Record<string, Record<string, string>> = {
  es: { CI: "Costa de Marfil", PS: "Palestina" },
  en: { PS: "Palestine" },
};

export type CountryOption = { code: string; label: string };

function baseLanguage(locale: string) {
  return (locale || "es").split("-")[0].toLowerCase();
}

const optionsCache = new Map<string, CountryOption[]>();

/** Countries sorted alphabetically in the given UI language. */
export function getCountryOptions(locale: string): CountryOption[] {
  const language = baseLanguage(locale);
  const cached = optionsCache.get(language);
  if (cached) return cached;

  const displayNames = new Intl.DisplayNames([language], { type: "region" });
  const overrides = LABEL_OVERRIDES[language] ?? {};
  const options = COUNTRY_CODES.map((code) => ({
    code,
    label: overrides[code] ?? displayNames.of(code) ?? code,
  })).sort((a, b) => a.label.localeCompare(b.label, language, { sensitivity: "base" }));

  optionsCache.set(language, options);
  return options;
}

/** Lowercase, accent-free form used to compare country names and type-ahead searches. */
export const normalizeCountrySearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .trim()
    .toLowerCase();

let nameToCode: Map<string, string> | null = null;

/**
 * Maps a stored nationality to a country code. Accepts a code ("AR") or, for values typed before
 * the select existed, a country name in Spanish or English ("argentina", "Mexico"). Returns null
 * when the value is something else (for example a demonym), so the caller can keep it as is.
 */
export function resolveCountryCode(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (COUNTRY_CODE_SET.has(trimmed.toUpperCase())) return trimmed.toUpperCase();

  if (!nameToCode) {
    nameToCode = new Map();
    for (const language of ["es", "en"]) {
      for (const option of getCountryOptions(language)) {
        nameToCode.set(normalizeCountrySearch(option.label), option.code);
      }
      const displayNames = new Intl.DisplayNames([language], { type: "region" });
      for (const code of COUNTRY_CODES) {
        const intlName = displayNames.of(code);
        if (intlName) nameToCode.set(normalizeCountrySearch(intlName), code);
      }
    }
  }

  return nameToCode.get(normalizeCountrySearch(trimmed)) ?? null;
}
