import extensionMain from './extension';
import { loadGuild } from './core/Guild';
import { roomMonitor } from './monitor/index';
import { getCreepInstance, cleanupInstances } from './roles/registry';
import { runSpawnManager } from './worker/spawnManager';
import { checkDeadCreeps, cleanupEvents, persistGuild } from './lifecycle/index';

function loop(): void {
  extensionMain();
  loadGuild();
  checkDeadCreeps();

  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    if (room.controller?.my) {
      roomMonitor(room);
    }
  }

  runSpawnManager();

  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.spawning) continue;
    getCreepInstance(creep).run();
  }

  cleanupInstances();
  cleanupEvents();
  persistGuild();
}

loop();
