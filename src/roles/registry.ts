import { BaseCreep } from './BaseCreep';
import { HarvesterCreep } from './HarvesterCreep';
import { UpgraderCreep } from './UpgraderCreep';
import { BuilderCreep } from './BuilderCreep';

const instances: Record<string, BaseCreep> = {};

export function getCreepInstance(creep: Creep): BaseCreep {
  const name = creep.name;
  if (!instances[name]) {
    const role = creep.memory.role || 'harvester';
    switch (role) {
      case 'harvester': instances[name] = new HarvesterCreep(creep); break;
      case 'upgrader':  instances[name] = new UpgraderCreep(creep); break;
      case 'builder':   instances[name] = new BuilderCreep(creep); break;
      default:          instances[name] = new HarvesterCreep(creep); break;
    }
  }
  return instances[name];
}

export function cleanupInstances(): void {
  for (const name in instances) {
    if (!Game.creeps[name]) delete instances[name];
  }
}
