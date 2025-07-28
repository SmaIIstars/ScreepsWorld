import { BaseRole } from './base';
import Builder from './builder';
// import Claimer from './claimer';
import Harvester from './harvester';
import Miner from './miner';
// import Pioneer from './pioneer';
import Repairer from './repairer';
import Upgrader from './upgrader';

export type GlobalRolesType = Partial<Record<CustomRoleType, BaseRole>>;

export const roles: GlobalRolesType = {
  upgrader: Upgrader,
  miner: Miner,
  harvester: Harvester,
  builder: Builder,
  repairer: Repairer,
  // pioneer: Pioneer,
  // claimer: Claimer,
};
