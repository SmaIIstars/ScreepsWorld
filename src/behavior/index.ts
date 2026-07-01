import { harvestBehavior } from './harvest';
import { fillBehavior } from './fill';
import { upgradeBehavior } from './upgrade';
import buildBehavior from './build';
import { collectBehavior } from './collect';

export interface Behavior {
  type: string;
  execute: (creep: Creep, event: Event) => void;
  isComplete: (creep: Creep, event: Event) => boolean;
  validate: (creep: Creep, event: Event) => boolean;
}

const behaviors = new Map<string, Behavior>();

export function getBehavior(type: string): Behavior | undefined {
  return behaviors.get(type);
}

export function registerBehavior(behavior: Behavior): void {
  behaviors.set(behavior.type, behavior);
}

// Register all built-in behaviors
registerBehavior(harvestBehavior);
registerBehavior(fillBehavior);
registerBehavior(upgradeBehavior);
registerBehavior(buildBehavior);
registerBehavior(collectBehavior);
