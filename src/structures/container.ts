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
      publisherType: 'container',
      data: { targetId: target.id, quota: { [RESOURCE_ENERGY]: energy } },
    });
  } else {
    Guild.cancel(withdrawKey);
  }

  // ── Repair: if damaged, request repair ──
  const repairKey = buildDedupKey('repair', target.room.name, target.id);
  if (target.hits < target.hitsMax * 0.5) {
    Guild.post({
      type: 'repair',
      room: target.room.name,
      targetId: target.id,
      requiredTags: ['work', 'move'],
      requiredCapacities: { work: 1, carry: 50 },
      priority: 45,
      maxWorkers: 1,
      publisherType: 'container',
      data: { targetId: target.id },
    });
  } else {
    Guild.cancel(repairKey);
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
