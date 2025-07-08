import { role } from './utils/lib/role';
import { role2 } from './utils/lib/role2';
import { runTowers } from './utils/lib/tower';
import monitorMain from './utils/monitor';

const loop = () => {
  for (let roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    if (room.controller?.my) {
      monitorMain();
      for (let name in Game.creeps) {
        let creep = Game.creeps[name];

        if (creep.memory.role == 'harvester') {
          role2.harvester?.run(creep);
        }
        if (creep.memory.role == 'builder') {
          role2.builder?.run(creep);
        }
        if (creep.memory.role == 'miner') {
          role2.miner?.run(creep);
        }

        if (creep.memory.role) {
          role[creep.memory.role]?.run(creep);
        }
      }

      runTowers(room);
    }
  }
};

export { loop };
