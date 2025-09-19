import { ROOM_ID_ENUM } from '@/constant';
import { getStrategy } from '@/strategy';
import { generatorRoleBody, intervalSleep } from '@/utils';

export const generatorRole = (room: Room) => {
  if (room.name !== ROOM_ID_ENUM.MainRoom) return;
  const strategy = getStrategy(room.controller?.level ?? 0);
  const creepCounter = room.memory?.creepsCount;
  if (!creepCounter) return;

  const roles = Object.keys(strategy.roleMonitor) as CustomRoleType[];
  for (const role of roles) {
    if (!strategy.roleMonitor[role]) continue;
    if (creepCounter[role] < strategy.roleMonitor[role].count) {
      intervalSleep(10, () => {
        const bodyArr = strategy.roleMonitor[role]?.body || [];
        const bodyCount: Record<string, number> = {};
        for (const part of bodyArr) {
          bodyCount[part] = (bodyCount[part] || 0) + 1;
        }
        console.log(
          `${role} 现有:${creepCounter[role]} 需要:${strategy.roleMonitor[role]?.count ?? 0} Body:${JSON.stringify(
            bodyCount
          )}`
        );
      });

      const spawn = Object.values(Game.spawns).find((spawn) => spawn.room.name === room.name && !spawn.spawning);
      if (spawn) {
        const resp = utils.roles[role]?.create(spawn, { body: strategy.roleMonitor[role].body });
        if (resp === OK) {
          creepCounter[role] += 1;
          room.memory.creepsCount = creepCounter;
        }
      }
      break;
    }
  }
};

export const generatorRoleAttacker = (room: Room) => {
  if (room.memory?.enemies?.length) {
    const enemy = Game.getObjectById(room.memory.enemies[0]) as AnyCreep | StructureInvaderCore;
    if (!enemy) return;
    const attackerName = `${room.name}-Attacker`;
    const attacker = Game.creeps[attackerName];
    if (attacker) {
      if (attacker.hits < 0.6 * attacker.hitsMax) attacker.heal(attacker);
      if (attacker.rangedAttack(enemy) === ERR_NOT_IN_RANGE) {
        attacker.moveTo(enemy);
      }
      if (attacker.attack(enemy) === ERR_NOT_IN_RANGE) {
        attacker.moveTo(enemy);
      }
    } else {
      const body = generatorRoleBody([
        { body: MOVE, count: 13 },
        { body: ATTACK, count: 10 },
        { body: RANGED_ATTACK, count: 10 },
        { body: HEAL, count: 6 },
      ]);

      const spawn = Object.values(Game.spawns).find((spawn) => spawn.room.name === room.name && !spawn.spawning);
      if (spawn) {
        const result = spawn.spawnCreep(body, attackerName);
        if (result === OK) console.log(`攻击者正在孵化: ${attackerName}`);
      }
    }
  }
};
