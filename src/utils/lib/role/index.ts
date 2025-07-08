import Builder from './builder';
import Miner from './miner';
import MinerStore from './miner/store';
import Repairer from './repairer';
import Upgrader from './upgrader';

export const role: Partial<Record<CustomRoleType, BaseRole>> = {
  builder: Builder,
  upgrader: Upgrader,
  miner: Miner,
  minerStore: MinerStore,
  repairer: Repairer,
};
