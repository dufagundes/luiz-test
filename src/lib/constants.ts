export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 900; // 30 seconds

// Scene boundaries (frames), locked to the narration timeline
export const SCENES = {
  s1: {from: 0, to: 105}, // Hook: the phone lights up
  s2: {from: 105, to: 228}, // Maya reads the message
  s3: {from: 228, to: 393}, // Three knocks + the voice
  s4: {from: 393, to: 513}, // Running to the window, Mom outside
  s5: {from: 513, to: 631}, // The handle turns, new message
  s6: {from: 631, to: 780}, // The door flies open: the real Mom
  s7: {from: 780, to: 900}, // The reveal at the window + title
} as const;

export const COLORS = {
  night: '#0b1020',
  wall: '#1a2238',
  wallDark: '#121a2c',
  floor: '#151b2c',
  floorLine: '#1d2540',
  wood: '#2a2236',
  woodLight: '#3a3048',
  moon: '#cfe3ff',
  phone: '#7fd4ff',
  warm: '#ffb866',
  danger: '#ff3b4e',
  skin: '#e7b892',
  skinShade: '#c99372',
  hair: '#1b1626',
  hoodie: '#2f9c95',
  hoodieShade: '#237670',
  pants: '#2b3350',
  momSkin: '#dfae88',
  momHair: '#5a3a2c',
  robe: '#b5657b',
  robeShade: '#8e4b5f',
};
