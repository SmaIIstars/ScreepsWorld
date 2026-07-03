// src/structures/container.ts
// Posts 'harvest' when container has energy, 'fill' when it has free capacity.

import { Guild } from '../core/Guild';
import { buildDedupKey } from '../core/Event';

export function runContainerLifecycle(target: StructureContainer): void {
  const store = target.store;
  const energy = store[RESOURCE_ENERGY] ?? 0;
  const freeCap = store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;

  // ── Withdraw: if container has energy, let creep take ──
  const withdrawKey = buildDedupKey('withdraw', target.room.name, target.id);
  if (energy > 0) {
    Guild.post({
      type: 'withdraw',
      room: target.room.name,
      targetId: target.id,
      requiredTags: ['transport', 'move'],
      requiredCapacities: { carry: 50 },
      priority: 70,
      maxWorkers: 3,
      quota: { resourceType: RESOURCE_ENERGY, amount: energy },
      data: { targetId: target.id },
    });
  } else {
    Guild.cancel(withdrawKey);
  }

  // ── Fill: if container has free capacity, let creep deposit ──
  // const fillKey = buildDedupKey('fill', target.room.name, target.id);
  // if (freeCap > 0) {
  //   Guild.post({
  //     type: 'fill',
  //     room: target.room.name,
  //     targetId: target.id,
  //     requiredTags: ['transport', 'move'],
  //     requiredCapacities: { carry: 50 },
  //     priority: 55,
  //     maxWorkers: 1,
  //     quota: { resourceType: RESOURCE_ENERGY, amount: freeCap },
  //     data: { targetId: target.id },
  //   });
  // } else {
  //   Guild.cancel(fillKey);
  // }
}
