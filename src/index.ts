import { gameMonitor, roomMonitor } from './lib/monitor';
import { runTowers } from './lib/monitor/towner';
import { runTaskSystem } from './lib/taskSystem';
import { attackTarget } from './lib/utils/attackTask';
import { generatorRoleBody } from './utils';

const loop = () => {
  const attackers = Object.keys(Game.creeps).filter((c) => c.startsWith('ATTACK-OP'));

  let enemy = undefined;
  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];

    const roomMemory = global.rooms[roomName];
    const flagMemory = Game.flags[roomName]?.memory;

    if (!Game.creeps['ATTACK-OP']) {
      Game.spawns['Spawn5'].spawnCreep(
        generatorRoleBody([
          { body: ATTACK, count: 10 },
          { body: MOVE, count: 10 },
        ]),
        'ATTACK-OP',
        {
          memory: { role: 'attacker' },
        }
      );
    }
    if (!Game.creeps['ATTACK-OP1']) {
      Game.spawns['Spawn2'].spawnCreep(
        generatorRoleBody([
          { body: ATTACK, count: 10 },
          { body: RANGED_ATTACK, count: 10 },
          { body: MOVE, count: 10 },
        ]),
        'ATTACK-OP1',
        {
          memory: { role: 'attacker' },
        }
      );
    }
    if (!enemy && flagMemory?.type !== 'powerRoom') enemy = roomMemory?.enemies?.[0];

    roomMonitor(room);
    runTaskSystem(room);
    runTowers(room);
  }
  if (enemy) {
    for (const attacker of attackers) {
      attackTarget(attacker, enemy);
    }
  }
  gameMonitor();
};

export { loop };
