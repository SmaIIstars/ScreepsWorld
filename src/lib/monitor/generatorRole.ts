import { generatorRoleBody } from '@/utils';

// export const generatorRole = (room: Room) => {
//   if (!room.controller?.my) return;
//   if (!room.find(FIND_MY_CREEPS, { filter: (c) => c.memory.role === 'harvester' }).length)
//     return minHarvesterCreepsInMainRoom(room);
//   const strategy = getStrategy(room.controller?.level ?? 0);
//   const creepCounter = global.rooms[room.name]?.creepsCount;
//   if (!creepCounter) return;

//   const roles = Object.keys(strategy.roleMonitor) as CustomRoleType[];
//   const spawn = Object.values(Game.spawns).find((spawn) => spawn.room.name === room.name && !spawn.spawning);
//   if (!spawn) return;
//   for (const role of roles) {
//     if (!strategy.roleMonitor[role]) continue;

//     if (role === 'miner' && strategy.roleMonitor[role].count - creepCounter[role] === 1) {
//       const mineral = Game.getObjectById<Mineral>(global.rooms[room.name].sources?.mineral?.[0] ?? '');
//       const executor = room.find(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_EXTRACTOR })?.[0];
//       if (!mineral || executor) continue;
//       if (mineral.ticksToRegeneration && mineral.ticksToRegeneration > 100) continue;
//     }

//     if (creepCounter[role] < strategy.roleMonitor[role].count) {
//       intervalSleep(10, () => {
//         const bodyArr = strategy.roleMonitor[role]?.body || [];
//         const bodyCount: Record<string, number> = {};
//         for (const part of bodyArr) {
//           bodyCount[part] = (bodyCount[part] || 0) + 1;
//         }
//         console.log(
//           `${role} 现有:${creepCounter[role]} 需要:${strategy.roleMonitor[role]?.count ?? 0} Body:${JSON.stringify(
//             bodyCount
//           )}`
//         );
//       });

//       const resp = utils.roles[role]?.create(spawn, { body: strategy.roleMonitor[role].body });
//       if (resp === OK) {
//         creepCounter[role] += 1;
//         global.rooms[room.name].creepsCount = creepCounter;
//       }
//     }
//   }
// };

export const generatorRoleAttacker = (room: Room) => {
  const roomMemory = global.rooms[room.name];
  if (roomMemory?.enemies?.length) {
    const enemy = Game.getObjectById(roomMemory.enemies[0]) as AnyCreep | StructureInvaderCore;
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
        { body: MOVE, count: 10 },
        { body: ATTACK, count: 10 },
        { body: RANGED_ATTACK, count: 10 },
      ]);

      const spawn = Object.values(Game.spawns).find((spawn) => spawn.room.name === room.name && !spawn.spawning);
      if (spawn) {
        const result = spawn.spawnCreep(body, attackerName);
        if (result === OK) console.log(`攻击者正在孵化: ${attackerName}`);
      }
    }
  }
};

// export const generatorRemoteResourceCreeps = (room: Room) => {
//   // 如果不是外矿
//   const flag = Game.flags[room.name];
//   if (flag?.memory.type !== 'sourceRoom' || flag?.memory?.status !== 'active') return;
//   const spawn = Object.values(Game.spawns).find((spawn) => !spawn.spawning);
//   if (!spawn) return;

//   const roomMemory = global.rooms[room.name];
//   const creepsOfRoom = roomMemory?.creeps;
//   const creepsOfFlag = flag.memory?.payload?.creeps;
//   if (!creepsOfFlag || !creepsOfRoom) return;

//   for (const role in creepsOfFlag) {
//     if (!isCustomRoleType(role)) continue;
//     if (!role.startsWith('remote')) continue;
//     if (creepsOfRoom[role].length >= creepsOfFlag[role]) continue;
//     // const bodyArr: BodyPartConstant[] = [];
//     // if (role === 'remoteMiner') {
//     //   bodyArr.push(
//     //     ...generatorRoleBody([
//     //       { body: WORK, count: 10 },
//     //       { body: CARRY, count: 2 },
//     //       { body: MOVE, count: 6 },
//     //     ])
//     //   );
//     // } else if (role === 'remoteClaimer') {
//     //   bodyArr.push(
//     //     ...generatorRoleBody([
//     //       { body: CLAIM, count: 2 },
//     //       { body: MOVE, count: 2 },
//     //     ])
//     //   );
//     // } else if (role === 'remoteHarvester') {
//     //   bodyArr.push(
//     //     ...generatorRoleBody([
//     //       { body: WORK, count: 2 },
//     //       { body: CARRY, count: 30 },
//     //       { body: MOVE, count: 16 },
//     //     ])
//     //   );
//     // }

//     // const resp = utils.roles[role as CustomRoleType]?.create(spawn, {
//     //   body: bodyArr,
//     //   memoryRoleOpts: { role: role as CustomRoleType, targetRoom: room.name },
//     // });

//     // if (resp === OK) {
//     //   roomMemory.creepsCount = Object.assign(creepCounter, { [role]: creepCounter[role as CustomRoleType]++ });
//     // }
//   }
// };

export const minHarvesterCreepsInMainRoom = (room: Room) => {
  const spawn = room.find<StructureSpawn>(FIND_MY_STRUCTURES, {
    filter: (s) => s.structureType === STRUCTURE_SPAWN && !s.spawning,
  })[0];
  if (!spawn) return;
  utils.roles['harvester']?.baseCreate(
    spawn,
    generatorRoleBody([
      { body: CARRY, count: 4 },
      { body: MOVE, count: 2 },
    ])
  );
};
