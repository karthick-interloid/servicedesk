export type Timezone = {
  id: string;
  /** UTC offset, e.g. "+05:30". */
  offset: string;
  label: string;
  cities: string;
};

/**
 * Transcribed verbatim from `Update design.dc.html` → `const TIMEZONES`, in source order.
 * Seed data for the select and its hint line; replace with a real zone list when
 * provisioning exists.
 */
export const TIMEZONES: Timezone[] = [
  {
    id: "pst",
    offset: "-08:00",
    label: "(GMT-08:00) Pacific Time",
    cities: "Los Angeles · Vancouver",
  },
  { id: "mst", offset: "-07:00", label: "(GMT-07:00) Mountain Time", cities: "Denver · Phoenix" },
  {
    id: "cst",
    offset: "-06:00",
    label: "(GMT-06:00) Central Time",
    cities: "Chicago · Mexico City",
  },
  { id: "est", offset: "-05:00", label: "(GMT-05:00) Eastern Time", cities: "New York · Toronto" },
  {
    id: "brt",
    offset: "-03:00",
    label: "(GMT-03:00) Brasília Time",
    cities: "São Paulo · Buenos Aires",
  },
  {
    id: "utc",
    offset: "+00:00",
    label: "(GMT+00:00) Coordinated Universal Time",
    cities: "Reykjavík · Accra",
  },
  {
    id: "bst",
    offset: "+01:00",
    label: "(GMT+01:00) British Summer Time",
    cities: "London · Dublin · Lisbon",
  },
  {
    id: "cet",
    offset: "+02:00",
    label: "(GMT+02:00) Central European Summer",
    cities: "Berlin · Paris · Madrid",
  },
  {
    id: "eet",
    offset: "+03:00",
    label: "(GMT+03:00) Eastern European · Moscow",
    cities: "Athens · Moscow · Nairobi",
  },
  {
    id: "gst",
    offset: "+04:00",
    label: "(GMT+04:00) Gulf Standard Time",
    cities: "Dubai · Muscat",
  },
  {
    id: "ist",
    offset: "+05:30",
    label: "(GMT+05:30) India Standard Time",
    cities: "Mumbai · Bengaluru · Chennai",
  },
  {
    id: "ict",
    offset: "+07:00",
    label: "(GMT+07:00) Indochina Time",
    cities: "Bangkok · Jakarta · Hanoi",
  },
  {
    id: "sgt",
    offset: "+08:00",
    label: "(GMT+08:00) Singapore · China Standard",
    cities: "Singapore · Shanghai · Perth",
  },
  {
    id: "jst",
    offset: "+09:00",
    label: "(GMT+09:00) Japan Standard Time",
    cities: "Tokyo · Seoul",
  },
  {
    id: "aet",
    offset: "+10:00",
    label: "(GMT+10:00) Australian Eastern",
    cities: "Sydney · Melbourne · Brisbane",
  },
  {
    id: "nzt",
    offset: "+12:00",
    label: "(GMT+12:00) New Zealand Standard",
    cities: "Auckland · Wellington",
  },
];

/** The design seeds `tz: "ist"`. */
export const DEFAULT_TIMEZONE_ID = "ist";

/** The design's `tzHint`: `"UTC " + z.off + " · " + z.cities`. */
export function timezoneHint(id: string): string {
  const zone = TIMEZONES.find((z) => z.id === id) ?? TIMEZONES[10]!;
  return `UTC ${zone.offset} · ${zone.cities}`;
}
