import monitorMain from './lib/monitor';
import { runTaskSystem } from './lib/taskSystem';

const loop = () => {
  for (let roomName in Game.rooms) {
    const room = Game.rooms[roomName];

    runTaskSystem(room);
    monitorMain(room);
  }
};

export { loop };
