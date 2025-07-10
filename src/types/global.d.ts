import { BaseRole2 } from '@/utils/lib/role2';
declare global {
  var utils: {
    role2: Record<string, BaseRole2>;
    ticksPerMove: (
      bodyArr: BodyPartConstant[],
      terrain: Exclude<Terrain, 'wall'> | 'road',
      carryLoad: boolean
    ) => {
      movePerTick: number;
      ticksPerMove: number;
      fatiguePerTick: number;
      fatigueRecover: number;
      moveCount: number;
      fatigueParts: number;
    };
  };
}

export {};
