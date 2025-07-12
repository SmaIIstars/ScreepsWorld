import { runLinks } from './utils/lib/link';
import { role2 } from './utils/lib/role2';
import { runTowers } from './utils/lib/tower';
import monitorMain from './utils/monitor';
import { tempScriptTask } from './utils/monitor/task';

const loop = () => {
  for (let roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    if (room.controller?.my) {
      monitorMain();

      for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        // 临时脚本任务
        if (tempScriptTask(creep)) {
          continue;
        }
        if (creep.memory.role) {
          role2[creep.memory.role]?.run(creep);
        }
      }

      runTowers(room);
      runLinks(room);
    }
  }
};

export { loop };
