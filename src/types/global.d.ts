import { BaseRole2 } from '@/utils/lib/role2';
declare global {
  var utils: {
    role2: Record<string, BaseRole2>;
    ticksPerMove: (body: BodyPartConstant[]) => number;
  };
}

export {};
