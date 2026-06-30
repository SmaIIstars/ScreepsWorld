import { harvestEnergyBehavior } from './harvestEnergy';
import { fillSpawnBehavior } from './fillSpawn';
import { upgradeControllerBehavior } from './upgradeController';

export interface Behavior {
  type: string;
  execute: (creep: Creep, event: Event) => void;
  isComplete: (creep: Creep, event: Event) => boolean;
  validate: (event: Event) => boolean;
}

const behaviors = new Map<string, Behavior>();

export function getBehavior(type: string): Behavior | undefined {
  return behaviors.get(type);
}

export function registerBehavior(behavior: Behavior): void {
  behaviors.set(behavior.type, behavior);
}

// Register all built-in behaviors
registerBehavior(harvestEnergyBehavior);
registerBehavior(fillSpawnBehavior);
registerBehavior(upgradeControllerBehavior);
