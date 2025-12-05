
import { Room } from './types';

export const OPENING_HOUR = 9; // 09:00
export const CLOSING_HOUR = 21; // 21:00

// Generate valid start times (09:00, 10:00, ... 20:00)
// Last possible booking start is 20:00 for 1 hour
export const VALID_START_TIMES = Array.from(
  { length: CLOSING_HOUR - OPENING_HOUR }, 
  (_, i) => {
    const hour = OPENING_HOUR + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  }
);

// Generate 23 rooms
// Rooms 21, 22, 23 are Meeting Rooms (Toplantı Odası)
export const ROOMS: Room[] = Array.from({ length: 23 }, (_, i) => {
  const id = i + 1;
  const isMeetingRoom = id >= 21;
  
  return {
    id: id,
    name: isMeetingRoom ? `Toplantı Odası ${id}` : `Çalışma Odası ${id}`,
    capacity: isMeetingRoom ? 10 : 4,
    features: isMeetingRoom 
      ? ['Projeksiyon', 'Geniş Masa', 'Beyaz Tahta', 'Wi-Fi'] 
      : ['Beyaz Tahta', 'Priz', 'Wi-Fi'],
    isMeetingRoom: isMeetingRoom
  };
});

export const APP_NAME = "ETÜ Kütüphane";

// Modern, vibrant flat colors for avatars
export const AVATAR_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#84CC16', // Lime
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#D946EF', // Fuchsia
  '#F43F5E', // Rose
  '#64748B', // Slate
  '#78716C', // Stone
  '#14B8A6', // Teal
  '#6366F1', // Indigo
];
