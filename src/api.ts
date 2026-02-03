import axios from 'axios';

// Base URLs
export const MASTER_DATA_BASE = 'https://sekai-world.github.io/sekai-master-db-diff';
export const STRAPI_BASE = 'https://strapi.sekai.best';
export const ASSET_BASE = 'https://storage.sekai.best/sekai-jp-assets';

// Types
export interface Card {
  id: number;
  characterId: number;
  rarity: number;
  attr: string;
  prefix: string;
  releaseAt: number;
  skillId: number;
  assetbundleName: string;
}

export interface GameCharacter {
  id: number;
  firstName: string; // e.g. "Miku"
  givenName: string; // e.g. "Hatsune"
  gender: string;
  height: number;
  unit: string;
}

export interface Music {
  id: number;
  title: string;
  pronunciation: string;
  lyricist: string;
  composer: string;
  arranger: string;
  categories: string[];
  publishedAt: number;
  assetbundleName?: string;
}

export interface Event {
  id: number;
  name: string;
  startAt: number;
  aggregateAt: number;
  eventType: string;
  assetbundleName: string;
}

// Master Data Cache
let cardsCache: Card[] | null = null;
let charactersCache: GameCharacter[] | null = null;
let musicCache: Music[] | null = null;
let eventsCache: Event[] | null = null;

// Helper to fetch JSON
async function fetchMasterJson<T>(filename: string): Promise<T> {
  const url = `${MASTER_DATA_BASE}/${filename}`;
  try {
    const response = await axios.get<T>(url);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch master data: ${filename}`, error);
    throw new Error(`Failed to fetch ${filename}`);
  }
}

// Data Accessors
export async function getCards(): Promise<Card[]> {
  if (!cardsCache) {
    cardsCache = await fetchMasterJson<Card[]>('cards.json');
  }
  return cardsCache;
}

export async function getGameCharacters(): Promise<GameCharacter[]> {
  if (!charactersCache) {
    charactersCache = await fetchMasterJson<GameCharacter[]>('gameCharacters.json');
  }
  return charactersCache;
}

export async function getMusics(): Promise<Music[]> {
  if (!musicCache) {
    musicCache = await fetchMasterJson<Music[]>('musics.json');
  }
  return musicCache;
}

export async function getEvents(): Promise<Event[]> {
  if (!eventsCache) {
    eventsCache = await fetchMasterJson<Event[]>('events.json');
  }
  return eventsCache;
}

// Strapi Accessors
export async function getAnnouncements(limit = 5) {
  try {
    const response = await axios.get(`${STRAPI_BASE}/announcements`, {
      params: { _limit: limit, _sort: 'published_at:DESC' },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch announcements', error);
    return [];
  }
}

// Asset URL Builder
export function getAssetUrl(type: string, _id: number | string, assetbundleName?: string): string {
  // Note: This logic assumes 'jp' server structure.
  switch (type) {
    case 'card_normal':
      // We need assetbundleName for cards, usually found in the card object.
      // This helper might need the caller to provide the assetBundleName.
      // For now, let's assume the caller has it.
      return `${ASSET_BASE}/character/member/${assetbundleName}/card_normal.webp`;
    case 'card_training':
      return `${ASSET_BASE}/character/member/${assetbundleName}/card_after_training.webp`;
    case 'icon':
      return `${ASSET_BASE}/thumbnail/chara/${assetbundleName}_normal.webp`;
    case 'music_jacket':
      // Music assetbundle is usually same as id or a specific string.
      // Usually music assetbundle name is just the name (e.g. "teot").
      // For simple ID based lookup without assetbundle, it is hard.
      // Let's assume assetbundleName is passed.
      return `${ASSET_BASE}/music/jacket/${assetbundleName}/${assetbundleName}.webp`;
    case 'music_short':
      return `${ASSET_BASE}/music/short/${assetbundleName}/${assetbundleName}_short.mp3`;
    default:
      return '';
  }
}
