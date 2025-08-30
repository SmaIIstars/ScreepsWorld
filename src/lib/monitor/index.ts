import { flagMonitor } from './flagMemory';
import { generatorRole } from './generatorRole';
import { linkMonitor } from './link';
import { roomMemory } from './roomMemory';
import { tempScriptTask } from './tempTask';

export const gameMonitor = () => {
  tempScriptTask();
  flagMonitor();

  generatePixel();
};

export const roomMonitor = (room: Room) => {
  roomMemory(room);
  generatorRole(room);
  linkMonitor(room);
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
