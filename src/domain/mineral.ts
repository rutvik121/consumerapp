import type { ID, MineralUnit } from './common';

/** Minor mineral categories relevant to Maharashtra operations. */
export type MineralCategory =
  | 'SAND'
  | 'GRAVEL'
  | 'MURUM'
  | 'STONE_AGGREGATE'
  | 'BLACK_TRAP'
  | 'OTHER';

export interface Mineral {
  id: ID;
  name: string;
  code: string;
  category: MineralCategory;
  defaultUnit: MineralUnit;
}
