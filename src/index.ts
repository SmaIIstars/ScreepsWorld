import { ROOM_ID_ENUM } from './constant';
import { gameMonitor, roomMonitor } from './lib/monitor';
import { runTowers } from './lib/monitor/towner';
import { runTaskSystem } from './lib/taskSystem';
import { attackTarget } from './lib/utils/attackTask';
import { generatorRoleBody } from './utils';

const loop = () => {
  const attackers = Object.keys(Game.creeps).filter((c) => c.startsWith('ATTACK-OP'));

  let flag = false;

  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    let enemy = undefined;

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
      enemy = room.memory.enemies[0];
    }

    if (enemy) {
      for (const attacker of attackers) {
        attackTarget(attacker, enemy);
      }
    }

    const flag1 = roomMonitor(room);
    if (room.name === ROOM_ID_ENUM.MainRoom) {
      flag = flag1;
    }
    runTaskSystem(room);
    runTowers(room);
  }
  gameMonitor(flag);
};

export { loop };
