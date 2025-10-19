import Attacker from './attacker';
import { BaseRole } from './base';
import Builder from './builder';
import Harvester from './harvester';
import Miner from './miner';
import RemoteHarvester from './remoteHarvester';
import RemoteMiner from './remoteMiner';
import Repairer from './repairer';
import Upgrader from './upgrader';
export type GlobalRolesType = Partial<Record<CustomRoleType, BaseRole>>;

export const roles: GlobalRolesType = {
  upgrader: Upgrader,
  miner: Miner,
  harvester: Harvester,
  builder: Builder,
  repairer: Repairer,
  attacker: Attacker,
  remoteHarvester: RemoteHarvester,
  remoteMiner: RemoteMiner,
};
