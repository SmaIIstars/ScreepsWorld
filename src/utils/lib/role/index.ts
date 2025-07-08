import Repairer from './repairer';
import Upgrader from './upgrader';

export type BaseRole<T = Record<string, any>> = {
  run: (creep: Creep, opts?: T) => void;
  create: (
    baseId?: string,
    spawnCreepParams?: Partial<{
      body: BodyPartConstant[];
      name: string;
      opts?: SpawnOptions;
    }>
  ) => ScreepsReturnCode;
};

export const role: Partial<Record<CustomRoleType, BaseRole>> = {
  // builder: Builder,
  upgrader: Upgrader,
  // miner: Miner,
  // minerStore: MinerStore,
  repairer: Repairer,
};
