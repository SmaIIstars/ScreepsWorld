// spawnManager.ts
// Consumes spawn_req events and spawns creeps at available spawns

import { Guild } from '../core/Guild';

export function runSpawnManager(): void {
  console.log('[' + Game.time + '] spawnManager start, rooms=' + Object.keys(Game.rooms).length);

  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    const spawns = room
      .find(FIND_MY_STRUCTURES)
      .filter((s): s is StructureSpawn => s.structureType === STRUCTURE_SPAWN);
    console.log('[' + Game.time + '] spawnManager: found ' + spawns.length + ' spawns in ' + roomName);
    if (spawns.length === 0) continue;

    // Find spawn_req events for this room
    const spawnReqs = Guild.getPendingByType(roomName, 'spawn_req');
    if (spawnReqs.length === 0) continue;

    // Sort by priority desc
    spawnReqs.sort((a, b) => b.priority - a.priority);

    for (const req of spawnReqs) {
      const { role, body, count, tags, minCapacities } = req.data;
      if (!body || !role) continue;

      // Count how many of this role are already being spawned or exist
      const existing =
        Object.values(Game.creeps).filter((c: Creep) => {
          const mem = Memory.creeps[c.name];
          return mem?.role === role;
        }).length + spawns.filter((s) => s.spawning?.name?.includes(role)).length;

      if (existing >= count) {
        Guild.complete(req.id);
        continue;
      }

      // Find an available spawn
      const availableSpawn = spawns.find((s) => !s.spawning);
      if (!availableSpawn) break; // No spawns available

      // Generate unique name
      const creepName = role + '_' + Game.time + '_' + Math.floor(Math.random() * 1000);

      const result = availableSpawn.spawnCreep(body, creepName, {
        memory: { role },
      });

      if (result === OK) {
        // Check if we still need more after this one
        const stillNeeded = count - existing - 1;
        if (stillNeeded <= 0) {
          Guild.complete(req.id);
        }
      } else if (result === ERR_NOT_ENOUGH_ENERGY) {
        break; // No point trying other reqs, spawn lacks energy
      } else {
        console.log('[' + Game.time + '] spawnManager: spawn ' + role + ' failed (' + result + ')');
      }
    }
  }
}
