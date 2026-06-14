import countriesJson from './countries.json';

export type CountryCode = {
  country_code: string;
  patterns?: string[];
  prefixes?: string[];
};

export type Country = {
  iso2: string;
  default_name: string;
  country_codes: CountryCode[];
  pFlags?: {hidden?: boolean};
};

/** All countries, sorted by name, hidden ones removed. */
export const COUNTRIES: Country[] = (countriesJson as Country[])
  .filter((c) => !c.pFlags?.hidden)
  .sort((a, b) => a.default_name.localeCompare(b.default_name));

/** Flag emoji from an ISO-3166 alpha-2 code (regional-indicator letters). */
export function flagEmoji(iso2: string): string {
  if(iso2 === 'FT') return '\u{1F3F4}‍☠️'; // 🏴‍☠️ Anonymous Numbers
  if(iso2.length !== 2) return '\u{1F3F3}️';
  const A = 0x1f1e6;
  return String.fromCodePoint(
    A + iso2.toUpperCase().charCodeAt(0) - 65,
    A + iso2.toUpperCase().charCodeAt(1) - 65
  );
}

/** Flatten to one row per (country, country_code) for the picker list. */
export type CountryRow = {
  country: Country;
  code: CountryCode;
  emoji: string;
};

export const COUNTRY_ROWS: CountryRow[] = COUNTRIES.flatMap((country) =>
  country.country_codes.map((code) => ({
    country,
    code,
    emoji: flagEmoji(country.iso2)
  }))
);

/** Search by name / iso2 / phone code / abbreviation, mirroring tweb's filterCountries. */
export function filterCountries(value: string): CountryRow[] {
  const v = value.toLowerCase().trim();
  if(!v) return COUNTRY_ROWS;
  return COUNTRY_ROWS.filter(({country, code}) => {
    const names = [country.default_name, country.iso2];
    const abbr = country.default_name
      .split(' ')
      .filter((w) => /\w/.test(w))
      .map((w) => w[0])
      .join('');
    if(abbr.length > 1) names.push(abbr);
    if(('+' + code.country_code).includes(v) || code.country_code.includes(v)) return true;
    return names.some((n) => n.toLowerCase().includes(v));
  });
}

/**
 * Choose a country by its leading digits. Picks the row whose country_code is the
 * longest prefix of the typed digits (so +1684 → American Samoa, not +1 USA).
 */
export function matchCountryByDigits(digits: string): CountryRow | undefined {
  let best: CountryRow | undefined;
  for(const row of COUNTRY_ROWS) {
    const cc = row.code.country_code;
    if(digits.startsWith(cc) && (!best || cc.length > best.code.country_code.length)) {
      best = row;
    }
  }
  return best;
}

/**
 * Format the national part of a number using the country's pattern (X = digit).
 * Returns e.g. "+355 12 345 6789" from digits after the country code.
 */
export function formatPhone(countryCode: string, nationalDigits: string, pattern?: string): string {
  if(!pattern) return '+' + countryCode + (nationalDigits ? ' ' + nationalDigits : '');
  let out = '';
  let di = 0;
  for(const ch of pattern) {
    if(ch === 'X') {
      if(di >= nationalDigits.length) break;
      out += nationalDigits[di++];
    } else if(di < nationalDigits.length) {
      out += ch;
    }
  }
  // any extra digits beyond the pattern just get appended
  if(di < nationalDigits.length) out += nationalDigits.slice(di);
  return '+' + countryCode + (out ? ' ' + out : '');
}
