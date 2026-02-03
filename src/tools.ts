import { z } from 'zod';
import {
  getCards,
  getGameCharacters,
  getMusics,
  getEvents,
  getAnnouncements,
  getAssetUrl,
} from './api.js';

// Tool Definitions

export const searchCardsTool = {
  name: 'search_cards',
  description: 'Search for Project Sekai cards by keyword, character, attribute, or rarity.',
  parameters: z.object({
    keyword: z.string().optional().describe('Search term for card name or character name'),
    characterId: z.number().optional().describe('Filter by specific character ID'),
    attribute: z.enum(['cool', 'cute', 'happy', 'mysterious', 'pure']).optional(),
    rarity: z.number().min(1).max(4).optional(),
  }),
  execute: async ({
    keyword,
    characterId,
    attribute,
    rarity,
  }: {
    keyword?: string;
    characterId?: number;
    attribute?: string;
    rarity?: number;
  }) => {
    const cards = await getCards();
    const characters = await getGameCharacters();

    const filtered = cards
      .filter((card) => {
        let match = true;
        if (characterId && card.characterId !== characterId) match = false;
        if (attribute && card.attr !== attribute) match = false;
        if (rarity && card.rarity !== rarity) match = false;

        if (keyword) {
          const char = characters.find((c) => c.id === card.characterId);
          const charName = char ? `${char.givenName} ${char.firstName}` : '';
          const prefix = card.prefix || '';
          const searchTarget = `${prefix} ${charName}`.toLowerCase();
          if (!searchTarget.includes(keyword.toLowerCase())) match = false;
        }

        return match;
      })
      .slice(0, 20)
      .map((card) => {
        // Limit to 20 results
        const char = characters.find((c) => c.id === card.characterId);
        return {
          id: card.id,
          prefix: card.prefix,
          character: char ? `${char.givenName} ${char.firstName}` : 'Unknown',
          rarity: card.rarity,
          attribute: card.attr,
        };
      });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(filtered, null, 2) }],
    };
  },
};

export const getCardInfoTool = {
  name: 'get_card_info',
  description: 'Get detailed information for a specific card by ID.',
  parameters: z.object({
    cardId: z.number().describe('The unique ID of the card'),
  }),
  execute: async ({ cardId }: { cardId: number }) => {
    const cards = await getCards();
    const card = cards.find((c) => c.id === cardId);
    if (!card) throw new Error(`Card ${cardId} not found`);

    const assetbundleName = card.assetbundleName;

    const result = {
      ...card,
      imageUrl: getAssetUrl('card_normal', card.id, assetbundleName),
      trainingImageUrl:
        card.rarity >= 3 ? getAssetUrl('card_training', card.id, assetbundleName) : null,
    };

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
};

export const getCharacterInfoTool = {
  name: 'get_character_info',
  description: 'Get profile information for a character.',
  parameters: z.object({
    characterId: z.number(),
  }),
  execute: async ({ characterId }: { characterId: number }) => {
    const chars = await getGameCharacters();
    const char = chars.find((c) => c.id === characterId);
    if (!char) throw new Error(`Character ${characterId} not found`);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(char, null, 2) }],
    };
  },
};

export const searchMusicTool = {
  name: 'search_music',
  description: 'Search for music tracks.',
  parameters: z.object({
    keyword: z.string().optional(),
    category: z.string().optional(),
  }),
  execute: async ({ keyword, category }: { keyword?: string; category?: string }) => {
    const musics = await getMusics();
    const filtered = musics
      .filter((m) => {
        if (category && !m.categories.includes(category)) return false;
        if (keyword) {
          const text = `${m.title} ${m.lyricist} ${m.composer}`.toLowerCase();
          if (!text.includes(keyword.toLowerCase())) return false;
        }
        return true;
      })
      .slice(0, 20);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(filtered, null, 2) }],
    };
  },
};

export const getMusicInfoTool = {
  name: 'get_music_info',
  description: 'Get detailed info for a song.',
  parameters: z.object({
    musicId: z.number(),
  }),
  execute: async ({ musicId }: { musicId: number }) => {
    const musics = await getMusics();
    const music = musics.find((m) => m.id === musicId);
    if (!music) throw new Error(`Music ${musicId} not found`);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(music, null, 2) }],
    };
  },
};

export const getCurrentEventTool = {
  name: 'get_current_event',
  description: 'Get the currently active event.',
  parameters: z.object({}),
  execute: async () => {
    const events = await getEvents();
    const now = Date.now();
    const current =
      events.find((e) => e.startAt <= now && e.aggregateAt >= now) || events[events.length - 1];

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(current, null, 2) }],
    };
  },
};

export const getEventsTool = {
  name: 'get_events',
  description: 'List events.',
  parameters: z.object({
    limit: z.number().optional().default(5),
    offset: z.number().optional().default(0),
  }),
  execute: async ({ limit, offset }: { limit: number; offset: number }) => {
    const events = await getEvents();
    const sorted = [...events].sort((a, b) => b.startAt - a.startAt);
    const result = sorted.slice(offset, offset + limit);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
};

export const getAnnouncementsTool = {
  name: 'get_announcements',
  description: 'Fetch news and announcements.',
  parameters: z.object({
    limit: z.number().optional().default(5),
  }),
  execute: async ({ limit }: { limit: number }) => {
    const result = await getAnnouncements(limit);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
};

export const getAssetUrlTool = {
  name: 'get_asset_url',
  description: 'Get the URL for a game asset.',
  parameters: z.object({
    type: z.enum(['card_normal', 'card_training', 'icon', 'music_jacket', 'music_short']),
    id: z.number(),
  }),
  execute: async ({ type, id }: { type: string; id: number }) => {
    let assetbundleName = '';

    if (type.startsWith('card') || type === 'icon') {
      const cards = await getCards();
      const card = cards.find((c) => c.id === id);
      if (card) assetbundleName = card.assetbundleName;
    } else if (type.startsWith('music')) {
      const musics = await getMusics();
      const music = musics.find((m) => m.id === id);
      if (music) assetbundleName = music.assetbundleName || '';
    }

    if (!assetbundleName) {
      throw new Error(`Could not resolve assetbundleName for ${type} id=${id}`);
    }

    const url = getAssetUrl(type, id, assetbundleName);
    return {
      content: [{ type: 'text' as const, text: url }],
    };
  },
};

// Export list
export const tools = [
  searchCardsTool,
  getCardInfoTool,
  getCharacterInfoTool,
  searchMusicTool,
  getMusicInfoTool,
  getCurrentEventTool,
  getEventsTool,
  getAnnouncementsTool,
  getAssetUrlTool,
];
