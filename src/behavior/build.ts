// build.ts
import { Behavior } from './index';

const buildBehavior: Behavior = {
  type: 'build',

  validate(creep: Creep, event: Event): boolean {
    if (creep.store[RESOURCE_ENERGY] === 0) return false;
    const site = Game.getObjectById(event.data.targetId) as ConstructionSite | null;
    return site !== null;
  },

  execute(creep: Creep, event: Event): void {
    if (creep.store[RESOURCE_ENERGY] === 0) return;
    const site = Game.getObjectById(event.data.targetId) as ConstructionSite | null;
    if (!site) return;
    if (creep.build(site) === ERR_NOT_IN_RANGE) {
      creep.moveTo(site, { reusePath: 20 });
    }
  },

  isComplete(creep: Creep, event: Event): boolean {
    const site = Game.getObjectById(event.data.targetId) as ConstructionSite | null;
    return !site;
  },
};

export default buildBehavior;
