import { flagMonitor } from './flagMemory';
import { generatorRemoteResourceCreeps, generatorRole, generatorRoleAttacker } from './generatorRole';
import { linkMonitor } from './link';
import { observerMonitor } from './observer';
import { roomMemory } from './roomMemory';
import { tempScriptTask } from './tempTask';

export const gameMonitor = (baseRoleFlag = true) => {
  tempScriptTask(baseRoleFlag);
  flagMonitor();
  generatePixel();
};

export const roomMonitor = (room: Room) => {
  roomMemory(room);
  observerMonitor(room);
  const hasBaseRole = generatorRole(room);
  linkMonitor(room);
  generatorRoleAttacker(room);
  generatorRemoteResourceCreeps(room);
  return hasBaseRole;
};

// pixel
const generatePixel = () => {
  if (Game.cpu.bucket >= 10000) {
    const result = Game.cpu.generatePixel();

    if (result === OK) {
      console.log('生成 1 pixel', result);
    } else {
      console.log('生成 pixel 失败', result);
    }
  }
};
