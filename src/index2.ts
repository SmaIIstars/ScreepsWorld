// 任务驱动模式
import { TaskDrivenCreep } from './lib/roles/taskDrivenCreep';
import { runTaskSystem, taskSystem } from './lib/taskSystem';
import monitorMain from './utils/monitor';

// 创建任务驱动的creep管理器
const taskDrivenCreep = new TaskDrivenCreep(taskSystem['taskQueue']);

const loop = () => {
  for (let roomName in Game.rooms) {
    const room = Game.rooms[roomName];

    // 任务驱动模式主房间逻辑
    if (room.controller?.my) {
      // 监控
      monitorMain();
      // 任务系统入口
      runTaskSystem(room);

      // 任务驱动的creep逻辑
      for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        if (creep.room.name === room.name) {
          // 使用任务驱动系统
          taskDrivenCreep.run(creep);
        }
      }
    }
  }
};

export { loop };
