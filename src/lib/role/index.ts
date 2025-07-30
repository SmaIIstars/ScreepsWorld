import { BaseRole } from './base';
import Builder from './builder';
import Harvester from './harvester';
import Miner from './miner';
import Repairer from './repairer';
import Upgrader from './upgrader';
// import RemoteHarvester from './remoteHarvester';
// import RemoteHauler from './remoteHauler';

export type GlobalRolesType = Partial<Record<CustomRoleType, BaseRole>>;

export const roles: GlobalRolesType = {
  upgrader: Upgrader,
  miner: Miner,
  harvester: Harvester,
  builder: Builder,
  repairer: Repairer,
  // remoteHarvester: RemoteHarvester,
  // remoteHauler: RemoteHauler,
};
