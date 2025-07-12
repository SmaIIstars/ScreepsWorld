import { ROOM_ID_ENUM } from './constant';
import { tempScriptTask } from './lib/monitor/tempTask';
import { runLinks } from './utils/lib/link';
import { role2 } from './utils/lib/role2';
import { runTowers } from './utils/lib/tower';
import monitorMain from './utils/monitor';

const loop = () => {
  for (let roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    // 在Room2中，采用任务分配模式
    if (room.name === ROOM_ID_ENUM.MainRoom2) {
      tempScriptTask();
      // for (let name in Game.creeps) {
      //   let creep = Game.creeps[name];
      // }
      // 这个是room循环的continue,不能return
    } else {
      // 这部分是主房间逻辑，采用角色分配模式
      if (room.controller?.my) {
        monitorMain();

        const room1Creeps = Object.values(Game.creeps).filter((creep) => creep.room.name !== ROOM_ID_ENUM.MainRoom2);
        for (let creep of room1Creeps) {
          // 防止除了pioneer以外的角色跑出主房间
          if (creep.room.name !== ROOM_ID_ENUM.MainRoom && creep.memory.role !== 'pioneer') {
            if (Game.rooms[ROOM_ID_ENUM.MainRoom].controller?.pos) {
              creep.moveTo(Game.rooms[ROOM_ID_ENUM.MainRoom].controller?.pos);
            }
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
  }
};

export { loop };
