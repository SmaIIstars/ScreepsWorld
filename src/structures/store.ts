// src/structures/store.ts
// Posts/cancels 'fill' demand for extension, tower, container, storage.

import { Guild } from '../core/Guild';
import { buildDedupKey } from '../core/Event';

const storeOf = (t: AnyStoreStructure) => t.store as Store<ResourceConstant, false>;

export function runStoreLifecycle(target: AnyStoreStructure): void {
  const store = storeOf(target);
  const used = store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;
  const free = store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;
  const isExtension = target.structureType === STRUCTURE_EXTENSION;

  // ── Fill: structure needs energy ──
  const fillKey = buildDedupKey('fill', target.room.name, target.id);
  if (free > 0) {
    Guild.post({
      type: 'fill',
      room: target.room.name,
      targetId: target.id,
      requiredTags: ['transport', 'move'],
      requiredCapacities: { carry: 50 },
      priority: isExtension ? 80 : 60,
      maxWorkers: 1,
      publisherType: target.structureType,
      data: { targetId: target.id, quota: { [RESOURCE_ENERGY]: free } },
    });
  } else {
    Guild.cancel(fillKey);
  }

  // ── Withdraw: storage/container offers energy to creeps (extensions are fill-only)
  if (!isExtension) {
    const withdrawKey = buildDedupKey('withdraw', target.room.name, target.id);
    if (used > 0) {
      Guild.post({
        type: 'withdraw',
        room: target.room.name,
        targetId: target.id,
        requiredTags: ['transport', 'move'],
        requiredCapacities: { carry: 50 },
        priority: 60,
        maxWorkers: 0,
        publisherType: target.structureType,
        data: { targetId: target.id, quota: { [RESOURCE_ENERGY]: used } },
      });
    } else {
      Guild.cancel(withdrawKey);
    }
  }
}
