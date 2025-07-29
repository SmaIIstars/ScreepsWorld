import { gameMonitor, roomMonitor } from './lib/monitor';
import { runTaskSystem } from './lib/taskSystem';

const loop = () => {
  gameMonitor();

  for (let roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    roomMonitor(room);
    runTaskSystem(room);
  }
};

export { loop };
