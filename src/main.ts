import extensionMain from './extension';
import { loadEventBus } from './core/EventBus';
import { roomMonitor } from './monitor/index';
import { runCreep } from './worker/runtime';
import { checkDeadCreeps, cleanupEvents, persistEventBus } from './lifecycle/index';

extensionMain();

export function loop(): void {
  loadEventBus();

  // Phase 1: Lifecycle
  checkDeadCreeps();

  // Phase 2: Monitor
  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    if (room.controller?.my) {
      roomMonitor(room);
    }
  }

  // Phase 3: Creep Runtime
  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.spawning) continue;
    runCreep(creep);
  }

  // Phase 4: Cleanup & Persist
  cleanupEvents();
  persistEventBus();
}
