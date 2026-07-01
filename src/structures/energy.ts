// src/structures/energy.ts
// Posts/cancels 'fill' demand for a single energy structure.
// Called per structure from structures/index.ts (cached).

import { Guild } from '../core/Guild';
import { buildDedupKey } from '../core/Event';

const storeOf = (t: AnyStoreStructure) => t.store as Store<ResourceConstant, false>;

export function runEnergyLifecycle(target: AnyStoreStructure): void {
  const dedupKey = buildDedupKey('fill', target.room.name, target.id);
  const store = storeOf(target);

  if (store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    const ratio = store[RESOURCE_ENERGY] / store.getCapacity(RESOURCE_ENERGY);
    const priority =
      target.structureType === STRUCTURE_SPAWN  ? 90 + Math.floor((1 - ratio) * 10) :
      target.structureType === STRUCTURE_TOWER  ? 85 + Math.floor((1 - ratio) * 10) :
                                                  70 + Math.floor((1 - ratio) * 10);

    Guild.post({
      type: 'fill',
      room: target.room.name,
      targetId: target.id,
      requiredTags: ['transport', 'move'],
      requiredCapacities: { carry: 50 },
      priority,
      maxWorkers: 1,
      data: { targetId: target.id },
    });
  } else {
    Guild.cancel(dedupKey);
  }
}
