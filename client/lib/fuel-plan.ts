import { isSupabaseConfigured, selectRows } from "@/lib/supabase";

export const CER_FUEL_CSV = "https://docs.google.com/spreadsheets/d/1uWbVwsJ6mgUl9WxJz-zbxMaiCW-dG3DI_9gvKkEca18/export?format=csv&gid=1149576218";

export type FuelTiming = "overdue" | "today" | "coming3" | "planned";
export type FuelRegion = "CER" | "West" | "South" | "North";

export type FuelSite = {
  site: string;
  region: string;
  status: string;
  district: string;
  city: string;
  label: string;
  latitude: number;
  longitude: number;
  nextFuelingPlan: Date;
  lastFuelingDate?: Date;
  lastFuelingQuantity?: number;
  fuelLevel?: number;
  daysUntil: number;
  timing: FuelTiming;
};

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted;
    } else if (c === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = (rows.shift() || []).map(normalizeKey);
  return rows.map(values => Object.fromEntries(headers.map((header, i) => [header, (values[i] || "").trim()])));
}

const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const valueFrom = (row: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    const value = row[key] ?? row[normalizeKey(key)];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return "";
};
const numeric = (value: string) => {
  const number = Number(value.replace(/[% ,]/g, ""));
  return Number.isFinite(number) ? number : undefined;
};
const parseDate = (value: string) => {
  const text = value.trim();
  if (!text || text.startsWith("#") || /^(sec site|west|south)$/i.test(text)) return undefined;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? undefined : date;
};
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const daysFromToday = (date: Date) => Math.round((startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / 86400000);
const timingFor = (days: number): FuelTiming => days < 0 ? "overdue" : days === 0 ? "today" : days <= 3 ? "coming3" : "planned";

function normalizeSite(row: Record<string, unknown>): FuelSite | null {
  const site = valueFrom(row, "site", "siteid", "site_id", "sitename", "site_name");
  const region = valueFrom(row, "region", "area");
  const status = valueFrom(row, "cowstatus", "cow_status", "status").toUpperCase();
  const latitude = numeric(valueFrom(row, "latitude", "lat"));
  const longitude = numeric(valueFrom(row, "longitude", "lng", "lon"));
  const nextFuelingPlan = parseDate(valueFrom(row, "nextfuelingplan", "next_fueling_plan", "nextfuelingdate"));
  if (!site || latitude === undefined || longitude === undefined || !nextFuelingPlan || !["ON-AIR", "IN PROGRESS", "ACTIVE", "OPERATIONAL"].includes(status)) return null;
  const daysUntil = daysFromToday(nextFuelingPlan);
  return {
    site, region, status, latitude, longitude, nextFuelingPlan, daysUntil, timing: timingFor(daysUntil),
    district: valueFrom(row, "district"), city: valueFrom(row, "city"), label: valueFrom(row, "sitelabel", "site_label", "label"),
    lastFuelingDate: parseDate(valueFrom(row, "lastfuelingdate", "last_fueling_date")),
    lastFuelingQuantity: numeric(valueFrom(row, "lastfuelingquantity", "last_fueling_quantity", "quantity")),
    fuelLevel: numeric(valueFrom(row, "fuellevel", "fuel_level", "fuelpercentage", "fuel_percentage")),
  };
}

export function inFuelRegion(site: FuelSite, region: FuelRegion) {
  const value = site.region.trim().toUpperCase();
  const aliases: Record<FuelRegion, string[]> = { CER: ["CER", "CENTRAL", "EAST", "CR", "ER"], West: ["WEST", "WR"], South: ["SOUTH", "SR"], North: ["NORTH", "NR"] };
  return aliases[region].includes(value);
}

export async function fetchFuelPlan(): Promise<{ sites: FuelSite[]; source: "Supabase" | "Google Sheet" }> {
  if (isSupabaseConfigured) {
    try {
      const rows = await selectRows<Record<string, unknown>>("energy_dashboard", "select=*&limit=10000");
      const sites = rows.map(normalizeSite).filter((site): site is FuelSite => Boolean(site));
      if (sites.length) return { sites, source: "Supabase" };
    } catch { /* Use the authoritative fuel sheet until Supabase is populated. */ }
  }
  const response = await fetch(CER_FUEL_CSV);
  if (!response.ok) throw new Error("Unable to load the CER fuel plan.");
  const sites = parseCsv(await response.text()).map(normalizeSite).filter((site): site is FuelSite => Boolean(site));
  return { sites, source: "Google Sheet" };
}
