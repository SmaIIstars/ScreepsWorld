import { gameMonitor, roomMonitor } from './lib/monitor';
import { runTaskSystem } from './lib/taskSystem';
import { attackTarget } from './lib/utils/attackTask';
import { generatorRoleBody } from './utils';

const loop = () => {
  const attackers = Object.keys(Game.creeps).filter((c) => c.startsWith('ATTACK-OP'));

  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];

    if (room.memory.enemies?.length) {
      if (!attackers.length) {
        Game.spawns['Spawn1'].spawnCreep(
          generatorRoleBody([
            { body: ATTACK, count: 10 },
            { body: RANGED_ATTACK, count: 10 },
            { body: MOVE, count: 10 },
          ]),
          'ATTACK-OP'
        );
        Game.spawns['Spawn2'].spawnCreep(
          generatorRoleBody([
            { body: ATTACK, count: 10 },
            { body: RANGED_ATTACK, count: 10 },
            { body: MOVE, count: 10 },
          ]),
          'ATTACK-OP1'
        );
      }

      for (const attacker of attackers) {
        attackTarget(attacker, room.memory.enemies[0]);
      }
    } else {
      for (const attacker of attackers) {
        attackTarget(attacker, '5c8805bccc71565241f3688d');
      }
    }
    roomMonitor(room);
    runTaskSystem(room);
  }
  gameMonitor();
};

export { loop };
