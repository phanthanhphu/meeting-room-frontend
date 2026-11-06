// Keep this palette identical to backend model/RoomColors.java.
// Medium, muted accents on pale backgrounds; text is always dark and legible.
export const ROOM_COLOR_OPTIONS = Object.freeze([
  '#426B91', '#477C76', '#76618E', '#946C4D',
  '#985D6A', '#5C7499', '#667C4D', '#806A9D',
  '#387C8B', '#9A7148', '#5D6EA7', '#427C64',
  '#9B6081', '#7A684B', '#56798C', '#87735A',
  '#9A6561', '#446FAD', '#6D846F', '#845B8B',
  '#A47A55', '#467F85', '#986E8F', '#6B7DA7',
  '#8D7747', '#6F7B96', '#98735F', '#587E78',
  '#8E657E', '#5973A0', '#7C825B', '#876E96'
]);
export const DEFAULT_ROOM_COLOR = '#64748B';
export const ROOM_TITLE_COLOR = '#18344D';
export const ROOM_META_COLOR = '#465D70';

export const isRoomColor = (value) => ROOM_COLOR_OPTIONS.includes(value);
export const roomAccent = (room) => isRoomColor(room?.color) ? room.color : DEFAULT_ROOM_COLOR;
export function roomTint(color, strength = 0.11) {
  const safe = isRoomColor(color) ? color : DEFAULT_ROOM_COLOR;
  const rgb = [1, 3, 5].map((start) => parseInt(safe.slice(start, start + 2), 16));
  const mix = (channel) => Math.round(255 * (1 - strength) + channel * strength);
  return `rgb(${rgb.map(mix).join(', ')})`;
}
