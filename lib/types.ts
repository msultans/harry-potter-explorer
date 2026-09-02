/**
 * Shared domain types for Harry Potter Explorer.
 * Character/Spell mirror the hp-api.onrender.com response shapes.
 */

export type HouseName = "Gryffindor" | "Slytherin" | "Hufflepuff" | "Ravenclaw";
export type HouseSlug = "gryffindor" | "slytherin" | "hufflepuff" | "ravenclaw";

export interface Wand {
  wood: string;
  core: string;
  length: number | null;
}

export interface Character {
  id: string;
  name: string;
  alternate_names: string[];
  species: string;
  gender: string;
  /** Empty string when the API has no house for this character. */
  house: HouseName | "";
  /** Format "DD-MM-YYYY" or null. */
  dateOfBirth: string | null;
  yearOfBirth: number | null;
  wizard: boolean;
  ancestry: string;
  eyeColour: string;
  hairColour: string;
  wand: Wand;
  patronus: string;
  hogwartsStudent: boolean;
  hogwartsStaff: boolean;
  actor: string;
  alternate_actors: string[];
  alive: boolean;
  /** Absolute image URL or empty string. */
  image: string;
}

export interface Spell {
  id: string;
  name: string;
  description: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CharacterQuery {
  q?: string;
  house?: HouseSlug | "";
  page?: number;
  pageSize?: number;
}

/** Minimal snapshot stored in localStorage for the favorites list. */
export interface FavoriteEntry {
  id: string;
  name: string;
  house: HouseName | "";
  image: string;
  patronus: string;
  addedAt: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
