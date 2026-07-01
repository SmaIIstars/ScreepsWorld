// spawnManager.ts
// Consumes spawn_req events and spawns creeps at available spawns

import { EventBus } from '../core/EventBus';

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
    const roomEvents = EventBus._events[roomName];
    if (!roomEvents) { console.log('[' + Game.time + '] spawnManager: no events for ' + roomName); continue; }

    const spawnReqs = roomEvents.filter((e) => e.type === 'spawn_req' && e.status === 'pending');
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
        EventBus.complete(req.id);
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
          EventBus.complete(req.id);
        }
      }
    }
  }
}
