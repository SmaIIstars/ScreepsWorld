import { gameMonitor, roomMonitor } from './lib/monitor';
import { runTaskSystem } from './lib/taskSystem';

const loop = () => {
  gameMonitor();
  // attackTarget('ATTACK-OP', '68b049771cef4970d754c547');

  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    roomMonitor(room);
    runTaskSystem(room);
  }
};

export { loop };
