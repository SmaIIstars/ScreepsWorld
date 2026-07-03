import { BaseCreep } from './BaseCreep';
import { HarvesterCreep } from './harvester';
import { UpgraderCreep } from './upgrader';
import { BuilderCreep } from './builder';
import { MinerCreep } from './miner';
import { RemoteMinerCreep } from './remoteMiner';
import { RemoteHaulerCreep } from './remoteHauler';

const instances: Record<string, BaseCreep> = {};

export function getCreepInstance(creep: Creep): BaseCreep {
  const name = creep.name;
  if (!instances[name]) {
    const role = creep.memory.role || 'harvester';
    switch (role) {
      case 'harvester': instances[name] = new HarvesterCreep(creep); break;
      case 'upgrader':  instances[name] = new UpgraderCreep(creep); break;
      case 'builder':   instances[name] = new BuilderCreep(creep); break;
      case 'miner':       instances[name] = new MinerCreep(creep); break;
      case 'remoteMiner': instances[name] = new RemoteMinerCreep(creep); break;
      case 'remoteHauler': instances[name] = new RemoteHaulerCreep(creep); break;
      default:          instances[name] = new HarvesterCreep(creep); break;
    }
  } else {
    // Refresh Creep reference for the new tick (Screeps recreates Game.creeps each tick)
    instances[name].refreshCreep(creep);
  }
  return instances[name];
}

export function cleanupInstances(): void {
  for (const name in instances) {
    if (!Game.creeps[name]) delete instances[name];
  }
}