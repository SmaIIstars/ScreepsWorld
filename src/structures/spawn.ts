// src/structures/spawn.ts
// Handles creep spawning only. Energy demand is handled by energy.ts.

import { BaseStructure } from './BaseStructure';
import { Guild } from '../core/Guild';

export class SpawnLifecycle extends BaseStructure<StructureSpawn> {
  runLifecycle(): void {
    if (this.obj.spawning) return; // Busy

    const spawnReqs = Guild.getPendingByType(this.room.name, 'spawn_req');
    if (spawnReqs.length === 0) return;

    spawnReqs.sort((a, b) => b.priority - a.priority);

    for (const req of spawnReqs) {
      const { role, body, count } = req.data;
      if (!body || !role) continue;

      // Count existing + spawning creeps of this role
      const spawns = this.room
        .find(FIND_MY_STRUCTURES)
        .filter((s): s is StructureSpawn => s.structureType === STRUCTURE_SPAWN);
      const existing =
        Object.values(Game.creeps).filter((c: Creep) => {
          const mem = Memory.creeps[c.name];
          return mem?.role === role;
        }).length + spawns.filter((s) => s.spawning?.name?.includes(role)).length;

      if (existing >= count) {
        Guild.complete(req.id);
        continue;
      }

      const creepName = role + '_' + Game.time + '_' + Math.floor(Math.random() * 1000);
      const result = this.obj.spawnCreep(body, creepName, { memory: { role } });

      if (result === OK) {
        const stillNeeded = count - existing - 1;
        if (stillNeeded <= 0) {
          Guild.complete(req.id);
        }
      } else if (result === ERR_NOT_ENOUGH_ENERGY) {
        break;
      } else {
        console.log('[' + Game.time + '] spawn: ' + role + ' failed (' + result + ')');
      }
    }
  }
}
