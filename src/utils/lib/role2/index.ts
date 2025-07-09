import { BaseRoleCreateParams } from '../base/BaseRole';
import Builder from './builder';
import Harvester from './harvester';
import Miner from './miner';
import Repairer from './repairer';
import Upgrader from './upgrader';

export type BaseRole2<T = Record<string, any>> = {
  run: (creep: Creep, opts?: T) => void;
  create: (params: BaseRoleCreateParams) => ScreepsReturnCode;
};

export const role2: Partial<Record<CustomRoleType, BaseRole2>> = {
  harvester: Harvester,
  builder: Builder,
  miner: Miner,
  upgrader: Upgrader,
  repairer: Repairer,
};
