import extensionMain from './extension';
import { loadGuild } from './core/Guild';
import { runStructureLifecycles } from './structures/index';
import { getCreepInstance, cleanupInstances } from './creeps/index';

import { checkDeadCreeps, cleanupEvents, persistGuild } from './lifecycle/index';
import { runRemoteLifecycle } from './structures/remote';

function loop(): void {
  extensionMain();
  loadGuild();
  checkDeadCreeps();

  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    if (room.controller?.my) {
      runStructureLifecycles(room);
    }
  }


  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.spawning) continue;
    getCreepInstance(creep).run();
  }

  cleanupInstances();
  runRemoteLifecycle();
  cleanupEvents();
  persistGuild();
}

loop();
