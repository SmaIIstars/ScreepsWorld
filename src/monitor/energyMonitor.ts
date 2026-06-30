import { EventBus } from '../core/EventBus';

export function energyMonitor(room: Room): void {
  // Check Spawn energy
  const spawns = room.find(FIND_MY_SPAWNS);
  for (const spawn of spawns) {
    if (spawn.energy < spawn.energyCapacity) {
      const deficit = spawn.energyCapacity - spawn.energy;
      const spawnBlocked = spawn.spawning && spawn.energy < 200;
      const priority = spawnBlocked ? 95 : Math.min(60 + Math.floor(deficit / 50) * 5, 90);

      EventBus.publish({
        type: 'fill_spawn',
        room: room.name,
        targetId: spawn.id,
        requiredTags: ['transport', 'move'],
        requiredCapacities: { carry: 50 },
        priority,
        ttl: 3,
        data: { targetId: spawn.id },
      });
    }
  }

  // Check Sources
  const sources = room.find(FIND_SOURCES);
  for (const source of sources) {
    if (source.energy > 0) {
      EventBus.publish({
        type: 'harvest_energy',
        room: room.name,
        targetId: source.id,
        requiredTags: ['harvest', 'move'],
        requiredCapacities: { harvest: 1 },
        priority: 80,
        ttl: 5,
        maxWorkers: 3,
        data: { targetId: source.id },
      });
    }
  }
}
