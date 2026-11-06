/**
 * THE LAST SIGNAL: official cast definitions.
 * These are the visual source of truth (mirrored in series/the-last-signal/STORY_BIBLE.md).
 * Never redefine a character's look inside a chapter. Change it here, or not at all.
 */

export type CastMember = {
  id: string;
  name: string;
  size: number; // overall scale (teen = 1)
  headScale?: number;
  seed: number; // small per-character animation offset
  hair: 'ponytail' | 'messy' | 'curly' | 'braids' | 'bun' | 'short';
  top: 'raincoat' | 'bomber' | 'sweater' | 'hoodie' | 'uniform';
  glasses?: boolean;
  freckles?: boolean;
  headphones?: boolean;
  palette: {
    skin: string;
    skinShade: string;
    hair: string;
    brow?: string;
    eyes: string;
    top: string;
    topShade: string;
    inner?: string;
    accent: string;
    pants: string;
    shoes: string;
  };
};

/** NORA VANCE, 16. Protagonist. Auburn ponytail, freckles, mustard-yellow raincoat. */
export const NORA: CastMember = {
  id: 'nora',
  name: 'Nora Vance',
  size: 1,
  seed: 1,
  hair: 'ponytail',
  top: 'raincoat',
  freckles: true,
  palette: {
    skin: '#f0c4a0',
    skinShade: '#d39c7a',
    hair: '#a8472a',
    brow: '#7a301c',
    eyes: '#2b3a2a',
    top: '#e9b72f',
    topShade: '#c4931c',
    accent: '#3a7bd5',
    pants: '#2b3350',
    shoes: '#dfe1ea',
  },
};

/** THEO PARK, 17. Nora's best friend since age six. Messy black hair, round glasses, olive bomber. */
export const THEO: CastMember = {
  id: 'theo',
  name: 'Theo Park',
  size: 1.04,
  seed: 2,
  hair: 'messy',
  top: 'bomber',
  glasses: true,
  palette: {
    skin: '#e8c09a',
    skinShade: '#c99c76',
    hair: '#17141d',
    eyes: '#1a1420',
    top: '#4f6a3a',
    topShade: '#3b512b',
    inner: '#d9d4c7',
    accent: '#e0732c',
    pants: '#23262f',
    shoes: '#b8432f',
  },
};

/** MILO VANCE, 11. Nora's little brother. Curly brown hair, freckles, red-and-navy striped sweater. */
export const MILO: CastMember = {
  id: 'milo',
  name: 'Milo Vance',
  size: 0.74,
  headScale: 1.12,
  seed: 3,
  hair: 'curly',
  top: 'sweater',
  freckles: true,
  palette: {
    skin: '#f0c4a0',
    skinShade: '#d39c7a',
    hair: '#5b3a24',
    eyes: '#2b3a2a',
    top: '#2c3a66',
    topShade: '#1f2a4c',
    accent: '#c43d3d',
    pants: '#5a4a3a',
    shoes: '#e6e1d8',
  },
};

/** JULES OKAFOR, 16. Skeptic, Nora's former friend, the sheriff's daughter. Box braids, purple hoodie, headphones. (Appears from Ch.2) */
export const JULES: CastMember = {
  id: 'jules',
  name: 'Jules Okafor',
  size: 0.98,
  seed: 4,
  hair: 'braids',
  top: 'hoodie',
  headphones: true,
  palette: {
    skin: '#7a4a32',
    skinShade: '#5f3826',
    hair: '#141016',
    eyes: '#140e10',
    top: '#6b3fa0',
    topShade: '#52307c',
    accent: '#f2c94c',
    pants: '#1f2233',
    shoes: '#f2f2f2',
  },
};

/** SHERIFF DANA OKAFOR, 44. Jules's mother. Short hair, tan uniform, gold star. (Appears from Ch.3) */
export const DANA: CastMember = {
  id: 'dana',
  name: 'Sheriff Dana Okafor',
  size: 1.08,
  seed: 5,
  hair: 'short',
  top: 'uniform',
  palette: {
    skin: '#6e4230',
    skinShade: '#553222',
    hair: '#1a1416',
    eyes: '#140e10',
    top: '#b59a6a',
    topShade: '#8e774e',
    inner: '#e9e1cf',
    accent: '#e8c54a',
    pants: '#4a4234',
    shoes: '#1c1a18',
  },
};

/** ELIAS VANCE, 45 (missing 3 years). Nora and Milo's father, relay-tower engineer. Seen in photos / flashbacks. */
export const ELIAS: CastMember = {
  id: 'elias',
  name: 'Elias Vance',
  size: 1.1,
  seed: 6,
  hair: 'short',
  top: 'hoodie',
  glasses: false,
  palette: {
    skin: '#ecc19c',
    skinShade: '#cf9c78',
    hair: '#8a3e26',
    eyes: '#2b3a2a',
    top: '#3e4f6b',
    topShade: '#2f3c54',
    accent: '#e9b72f',
    pants: '#2a2a30',
    shoes: '#3a2a20',
  },
};

export const CAST = {NORA, THEO, MILO, JULES, DANA, ELIAS};
