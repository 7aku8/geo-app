
import { readFile } from 'node:fs/promises';

export interface City {
  name: string;
  countryName: string;
  population: number;
}

export type DataSource = 'remote' | 'local';

interface GeoNamesResponse {
  geonames?: City[];
  status?: { message: string; value: number };
}

const GEONAMES_URL = 'http://api.geonames.org/searchJSON';
const LOCAL_DATA = new URL('../data/cities.json', import.meta.url);

function parse(body: GeoNamesResponse): City[] {
  if (!Array.isArray(body.geonames)) {
    throw new Error(`GeoNames error: ${body.status?.message ?? 'unexpected response shape'}`);
  }
  return body.geonames.map(({ name, countryName, population }) => ({ name, countryName, population }));
}

async function loadRemote(username: string): Promise<City[]> {
  const url = new URL(GEONAMES_URL);
  url.search = new URLSearchParams({
    featureClass: 'P',
    maxRows: '50',
    orderby: 'population',
    username,
  }).toString();

  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`GeoNames HTTP ${res.status}`);
  return parse((await res.json()) as GeoNamesResponse);
}

async function loadLocal(): Promise<City[]> {
  return parse(JSON.parse(await readFile(LOCAL_DATA, 'utf8')) as GeoNamesResponse);
}

export async function loadCities(source: DataSource, username: string): Promise<City[]> {
  if (source === 'local') return loadLocal();
  try {
    return await loadRemote(username);
  } catch (err) {
    console.warn(`Remote load failed (${(err as Error).message}), falling back to local data`);
    return loadLocal();
  }
}

export function filterByLetter(cities: readonly City[], letter: string): City[] {
  const prefix = letter.toLowerCase();
  return cities.filter((city) => city.name.toLowerCase().startsWith(prefix));
}
