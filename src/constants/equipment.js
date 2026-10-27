import { EQUIPMENT_STATUS } from './statuses.js';

export const EQUIPMENT_CATEGORIES = Object.freeze([
  { value: 'DISPLAY', label: 'Displays & projectors' },
  { value: 'VIDEO', label: 'Video conferencing' },
  { value: 'AUDIO', label: 'Audio equipment' },
  { value: 'PRESENTATION', label: 'Presentation tools' },
  { value: 'CONNECTIVITY', label: 'Connectivity' },
  { value: 'OTHER', label: 'Other equipment' }
]);
export const EQUIPMENT_FORM_DEFAULTS = Object.freeze({
  code: '', name: '', category: 'DISPLAY', description: '', status: EQUIPMENT_STATUS.ACTIVE
});
export const EQUIPMENT_CODE_SETTINGS = Object.freeze({ prefix: 'EQ_', randomBytes: 16 });
export const EQUIPMENT_STATUS_COLORS = Object.freeze({
  ACTIVE: { color: '#047857', bgcolor: '#ECFDF5', borderColor: '#A7F3D0' },
  MAINTENANCE: { color: '#92400E', bgcolor: '#FFFBEB', borderColor: '#FDE68A' },
  INACTIVE: { color: '#64748B', bgcolor: '#F1F5F9', borderColor: '#CBD5E1' }
});
