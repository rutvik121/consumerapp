import type { Mineral } from '@/domain';

/** Minor minerals commonly handled in Maharashtra construction operations. */
export const minerals: Mineral[] = [
  { id: 'min-sand', name: 'River Sand', code: 'SND', category: 'SAND', defaultUnit: 'MT' },
  { id: 'min-grit', name: 'Crushed Stone Grit 20mm', code: 'GRT20', category: 'STONE_AGGREGATE', defaultUnit: 'MT' },
  { id: 'min-murum', name: 'Murum', code: 'MRM', category: 'MURUM', defaultUnit: 'MT' },
  { id: 'min-gravel', name: 'Gravel (Khadi)', code: 'GRV', category: 'GRAVEL', defaultUnit: 'MT' },
  { id: 'min-trap', name: 'Black Trap Metal', code: 'BTM', category: 'BLACK_TRAP', defaultUnit: 'MT' },
];
