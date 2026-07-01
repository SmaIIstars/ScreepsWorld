import extensionMain from './extension';
import { loadEventBus } from './core/EventBus';
import { roomMonitor } from './monitor/index';
import { getCreepInstance, cleanupInstances } from './roles/registry';
import { runSpawnManager } from './worker/spawnManager';
import { checkDeadCreeps, cleanupEvents, persistEventBus } from './lifecycle/index';

extensionMain();

export function loop(): void {
  try {
    loadEventBus();
    checkDeadCreeps();

    for (const roomName in Game.rooms) {
      try {
        const room = Game.rooms[roomName];
        if (room.controller?.my) {
          roomMonitor(room);
        }
      } catch (e: any) {
        console.log('[' + Game.time + '] monitor error: ' + (e.message || e));
      }
    }

    try { runSpawnManager(); } catch (e: any) {
      console.log('[' + Game.time + '] spawn error: ' + (e.message || e));
    }

    for (const name in Game.creeps) {
      try {
        const creep = Game.creeps[name];
        if (creep.spawning) continue;
        getCreepInstance(creep).run();
      } catch (e: any) {
        console.log('[' + Game.time + '] creep ' + name + ' error: ' + (e.message || e));
      }
    }

    cleanupInstances();
    cleanupEvents();
    persistEventBus();
  } catch (e: any) {
    console.log('[' + Game.time + '] loop error: ' + (e.message || e));
  }
}