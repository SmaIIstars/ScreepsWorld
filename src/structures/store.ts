// src/structures/store.ts
// Posts/cancels 'fill' demand for extension, tower, container, storage.

import { Guild } from '../core/Guild';
import { buildDedupKey } from '../core/Event';

const storeOf = (t: AnyStoreStructure) => t.store as Store<ResourceConstant, false>;

export function runStoreLifecycle(target: AnyStoreStructure): void {
  const dedupKey = buildDedupKey('fill', target.room.name, target.id);
  const store = storeOf(target);

  if (store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    Guild.post({
      type: 'fill',
      room: target.room.name,
      targetId: target.id,
      requiredTags: ['transport', 'move'],
      requiredCapacities: { carry: 50 },
      priority: 60,
      maxWorkers: 1,
      quota: { resourceType: RESOURCE_ENERGY, amount: store.getFreeCapacity(RESOURCE_ENERGY) },
      data: { targetId: target.id },
    });
  } else {
    Guild.cancel(dedupKey);
  }
}
