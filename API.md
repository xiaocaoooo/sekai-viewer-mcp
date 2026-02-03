# Project Sekai MCP Server API Documentation

This document outlines the tools and resources provided by the **Project Sekai MCP Server**. This server enables AI agents to query Project Sekai: Colorful Stage! game data, including master data (cards, music, characters), live game status (events, gacha), and asset URLs.

## Data Sources

The server aggregates data from the following public endpoints (as used by Sekai Viewer):

- **Master Data**: `https://sekai-world.github.io` (Static JSON database)
- **Live Data (Strapi)**: `https://strapi.sekai.best` (Dynamic events/news)
- **Assets**: `https://storage.sekai.best` (Images/Audio)

---

## Tools

The following tools are exposed to the AI model.

### 1. Card & Character Data

#### `search_cards`

Search for cards based on various criteria.

- **Inputs**:
  - `keyword` (string, optional): Search term for card name or character name.
  - `characterId` (number, optional): Filter by specific character ID.
  - `attribute` (string, optional): 'cool', 'cute', 'happy', 'mysterious', 'pure'.
  - `rarity` (number, optional): 1, 2, 3, or 4.
- **Returns**: List of cards with basic info (ID, name, character, attribute, rarity).

#### `get_card_info`

Get detailed statistics and information for a specific card.

- **Inputs**:
  - `cardId` (number): The unique ID of the card.
- **Returns**: Full card object including max stats, skill details, release date, and prefix.

#### `get_character_info`

Get profile information for a character.

- **Inputs**:
  - `characterId` (number): The unique ID of the character.
- **Returns**: Character profile (unit, birthday, height, voice actor, etc.).

### 2. Music Data

#### `search_music`

Search for music tracks.

- **Inputs**:
  - `keyword` (string, optional): Title or artist name.
  - `category` (string, optional): 'mv', 'original', 'cover'.
- **Returns**: List of music tracks with basic info.

#### `get_music_info`

Get detailed metadata for a music track.

- **Inputs**:
  - `musicId` (number): The unique ID of the song.
- **Returns**: Lyricist, composer, arranger, BPM, duration, and difficulty levels.

### 3. Events & News (Live Data)

#### `get_current_event`

Get information about the currently running event.

- **Inputs**: None.
- **Returns**: Event details (ID, title, period, banner URL, bonuses).

#### `get_events`

List past or upcoming events.

- **Inputs**:
  - `limit` (number, optional): Number of events to return (default 5).
  - `offset` (number, optional): Pagination offset.
- **Returns**: List of event summaries.

#### `get_announcements`

Fetch the latest game news and announcements.

- **Inputs**:
  - `limit` (number, optional): Number of announcements (default 5).
- **Returns**: List of news items with titles and dates.

### 4. Assets

#### `get_asset_url`

Generate the download/display URL for a specific game asset.

- **Inputs**:
  - `type` (string): 'card_normal', 'card_training', 'icon', 'music_jacket', 'music_short'.
  - `id` (number): The resource ID (cardId or musicId).
- **Returns**: The absolute URL to the asset on the storage server.

---

## Resources

The server provides the following direct resource lookups:

- `sekai://news`: Recent announcements in text format.
- `sekai://event/current`: Detailed JSON of the current event.
- `sekai://master/cards/{id}`: Direct access to raw card JSON data.
- `sekai://master/music/{id}`: Direct access to raw music JSON data.
