import { type Behavior } from './index';

export const upgradeBehavior: Behavior = {
  type: 'upgrade',

  validate(creep: Creep, event: Event): boolean {
    if (creep.store[RESOURCE_ENERGY] === 0) return false;
    const controller = Game.getObjectById<StructureController>(event.data.targetId);
    if (!controller) return false;
    return controller.my;
  },

  execute(creep: Creep, event: Event): void {
    if (creep.store[RESOURCE_ENERGY] === 0) return;

    const controller = Game.getObjectById<StructureController>(event.data.targetId);
    if (!controller) return;

    const result = creep.upgradeController(controller);
    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(controller, { reusePath: 50, visualizePathStyle: { stroke: '#00ff00' } });
    }
  },

  isComplete(creep: Creep, event: Event): boolean {
    const controller = Game.getObjectById<StructureController>(event.data.targetId);
    return !controller || !controller.my;
  },
};
