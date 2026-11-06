// Fresh, accessible room accent palette. Keep this list in sync with backend/model/RoomColors.java.
// Each accent is at least 3:1 against white. Cards use pastel tints with dark text.
export const ROOM_COLOR_OPTIONS = Object.freeze([
  '#2D79C7', '#168F91', '#8058CF', '#CE7147',
  '#C55487', '#369968', '#247DA8', '#BD831E',
  '#566CDA', '#B461A7', '#3699B4', '#837B36',
  '#B65F56', '#3977AD', '#5E8E55', '#A77643',
  '#7167C0', '#2E9284', '#AF5E93', '#B67538',
  '#4C87B2', '#6F915A', '#AE6577', '#426BB5',
  '#B1882E', '#2A8996', '#986BB5', '#C35F69',
  '#5985AD', '#8B8A46', '#B36D8C', '#567DB4'
]);
export const ROOM_COLOR_NAMES = Object.freeze({
  '#2D79C7': 'Ocean Blue',
  '#168F91': 'Fresh Teal',
  '#8058CF': 'Soft Violet',
  '#CE7147': 'Warm Coral',
  '#C55487': 'Rose Pink',
  '#369968': 'Leaf Green',
  '#247DA8': 'Sea Blue',
  '#BD831E': 'Golden Amber',
  '#566CDA': 'Clear Indigo',
  '#B461A7': 'Orchid',
  '#3699B4': 'Sky Cyan',
  '#837B36': 'Olive',
  '#B65F56': 'Terracotta',
  '#3977AD': 'Steel Blue',
  '#5E8E55': 'Garden Green',
  '#A77643': 'Caramel',
  '#7167C0': 'Lavender',
  '#2E9284': 'Jade',
  '#AF5E93': 'Raspberry',
  '#B67538': 'Copper',
  '#4C87B2': 'Azure',
  '#6F915A': 'Sage Green',
  '#AE6577': 'Dusty Rose',
  '#426BB5': 'Cobalt Blue',
  '#B1882E': 'Ochre',
  '#2A8996': 'Lagoon',
  '#986BB5': 'Lilac',
  '#C35F69': 'Coral Rose',
  '#5985AD': 'Denim Blue',
  '#8B8A46': 'Meadow Olive',
  '#B36D8C': 'Berry',
  '#567DB4': 'Iris Blue'
});
export const DEFAULT_ROOM_COLOR = '#2D79C7';
export const ROOM_TITLE_COLOR = '#142C49';
export const ROOM_META_COLOR = '#52657C';

export const isRoomColor = (value) => ROOM_COLOR_OPTIONS.includes(value);
export const isStoredHexColor = (value) => typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
// Only a genuinely missing/invalid color uses a fallback. The fallback is stable
// for each room's identity, rather than applying the same first color to everyone.
const stableRoomIndex = (identity) => {
  let hash = 2166136261;
  for (const char of String(identity || '')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % ROOM_COLOR_OPTIONS.length;
};
export const roomAccent = (room) => isStoredHexColor(room?.color)
  ? room.color.toUpperCase()
  : ROOM_COLOR_OPTIONS[stableRoomIndex(room?.id || room?.code || room?.name)];
export function roomTint(color, strength = 0.10) {
  const safe = isStoredHexColor(color) ? color : DEFAULT_ROOM_COLOR;
  const rgb = [1, 3, 5].map((start) => parseInt(safe.slice(start, start + 2), 16));
  const mix = (channel) => Math.round(255 * (1 - strength) + channel * strength);
  return `rgb(${rgb.map(mix).join(', ')})`;
}
