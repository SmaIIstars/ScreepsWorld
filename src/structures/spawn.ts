// src/structures/spawn.ts
// Handles energy demand and creep spawning.

import { BaseStructure } from './BaseStructure';
import { Guild } from '../core/Guild';

export class SpawnLifecycle extends BaseStructure<StructureSpawn> {
  runLifecycle(): void {
    // ── Energy demand ──
    const store = this.obj.store as Store<ResourceConstant, false>;
    if (store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
      const deficit = store.getCapacity(RESOURCE_ENERGY) - store[RESOURCE_ENERGY];
      const spawnBlocked = this.obj.spawning && store[RESOURCE_ENERGY] < 200;
      const priority = spawnBlocked ? 95 : Math.min(60 + Math.floor(deficit / 50) * 5, 90);
      this.post({
        type: 'fill',
        room: this.room.name,
        targetId: this.obj.id,
        requiredTags: ['transport', 'move'],
        requiredCapacities: { carry: 50 },
        priority,
        data: { targetId: this.obj.id },
      });
    } else {
      this.cancel('fill');
    }

    // ── Spawning ──
    if (this.obj.spawning) return;

    const spawnReqs = Guild.getPendingByType(this.room.name, 'spawn_req');
    if (spawnReqs.length === 0) return;

    spawnReqs.sort((a, b) => b.priority - a.priority);

    for (const req of spawnReqs) {
      const { role, body, count } = req.data;
      if (!body || !role) continue;

      const existing =
        Object.values(Game.creeps).filter((c: Creep) => {
          const mem = Memory.creeps[c.name];
          return mem?.role === role;
        }).length +
        // Count spawning creeps in this room
        this.room.find(FIND_MY_SPAWNS).filter((s) => s.spawning?.name?.includes(role)).length;

      if (existing >= count) {
        Guild.complete(req.id);
        continue;
      }

      const creepName = role + '_' + Game.time + '_' + Math.floor(Math.random() * 1000);
      const result = this.obj.spawnCreep(body, creepName, { memory: { role } });

      if (result === OK) {
        const stillNeeded = count - existing - 1;
        if (stillNeeded <= 0) Guild.complete(req.id);
      } else if (result === ERR_NOT_ENOUGH_ENERGY) {
        break;
      } else {
        console.log('[' + Game.time + '] spawn: ' + role + ' failed (' + result + ')');
      }
    }
  }
}
