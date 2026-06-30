import { generatorRoleBody } from '@/utils';

// 临时脚本任务
export const tempScriptTask = () => {
  // 本房间自己的临时任务
  currentRoomTask();
  claimerTask();
  // powerBankTask();
  return;
};

const harvesterMiniBody = [CARRY, WORK, CARRY, CARRY, MOVE];
const claimerMiniBody = [CLAIM, CLAIM, MOVE, MOVE];
const currentRoomTask = () => {
  // 最小组 (采矿和升级)
  const minCreepGroup = [
    'Room2MinHarvester1',
    'Room2MinClaimer1',
    'Room2MinClaimer2',
    'Room2MinHarvester2',
    'Room2MinClaimer3',
  ];

  minCreepGroup.forEach((creepName) => {
    const creep = Game.creeps[creepName];
    if (creep) return;
    const spawn = Game.rooms['E11N14'].find(FIND_MY_SPAWNS, { filter: (s: StructureSpawn) => s && !s.spawning })[0];
    const spawn2 = Game.rooms['E13N15'].find(FIND_MY_SPAWNS, { filter: (s: StructureSpawn) => s && !s.spawning })[0];
    switch (creepName) {
      case 'Room2MinHarvester1': {
        if (!spawn) break;
        if (!Game.rooms['E11N14'].find(FIND_MY_CREEPS, { filter: (c) => c.memory.role === 'harvester' }).length) {
          spawn.spawnCreep(harvesterMiniBody, creepName, { memory: { role: 'harvester' } });
        }
        break;
      }
      case 'Room2MinHarvester2': {
        if (!spawn2) break;
        if (!Game.rooms['E13N15'].find(FIND_MY_CREEPS, { filter: (c) => c.memory.role === 'harvester' }).length) {
          spawn2.spawnCreep(harvesterMiniBody, creepName, { memory: { role: 'harvester' } });
        }
        break;
      }
      case 'Room2MinClaimer1': {
        if (!spawn) break;
        if (global.rooms?.['E11N14']?.taskMap) {
          const hasGenerateTask = Object.keys(global.rooms['E11N14'].taskMap).some((key) => key.startsWith('generate'));
          if (hasGenerateTask) break;
        }
        if (!Game.rooms['E11N14'].memory.creeps?.['claimer']) {
          spawn.spawnCreep(claimerMiniBody, creepName, { memory: { role: 'claimer' } });
        }
        break;
      }
      case 'Room2MinClaimer2': {
        if (!spawn) break;
        if (global.rooms?.['E11N14']?.taskMap) {
          const hasGenerateTask = Object.keys(global.rooms['E11N14'].taskMap).some((key) => key.startsWith('generate'));
          if (hasGenerateTask) break;
        }
        if (!Game.rooms['E11N14'].memory.creeps?.['claimer']) {
          spawn.spawnCreep(claimerMiniBody, creepName, { memory: { role: 'claimer' } });
        }
        break;
      }
      case 'Room2MinClaimer3': {
        if (!spawn2) break;
        if (global.rooms?.['E13N15']?.taskMap) {
          const hasGenerateTask = Object.keys(global.rooms['E13N15'].taskMap).some((key) => key.startsWith('generate'));
          if (hasGenerateTask) break;
        }

        spawn2.spawnCreep(claimerMiniBody, creepName, { memory: { role: 'claimer' } });
        break;
      }

      default:
        break;
    }
  });
};

const claimerTask = () => {
  runClaimerTask(Game.creeps['Room2MinClaimer1'], Game.rooms['E11N13']);
  runClaimerTask(Game.creeps['Room2MinClaimer2'], Game.rooms['E12N15']);
  runClaimerTask(Game.creeps['Room2MinClaimer3'], Game.rooms['E13N16']);
};

const runClaimerTask = (creep: Creep, room: Room) => {
  if (!creep || !room) return;
  const controller = room.controller;
  if (!controller) {
    creep.moveTo(Game.flags[room.name]);
  } else if (creep.reserveController(controller) === ERR_NOT_IN_RANGE) {
    creep.moveTo(controller);
  }
};

const powerBankTask = () => {
  const creep = Game.creeps['PowerBankAttack'];
  const creep1 = Game.creeps['PowerBankAttack2'];
  const creep2 = Game.creeps['PowerBankHealer'];
  const creep3 = Game.creeps['PowerBankHealer2'];
  if (!creep || !creep1 || !creep2 || !creep3) {
    const spawn = Game.rooms['E11N14'].find(FIND_MY_SPAWNS, { filter: (s: StructureSpawn) => s && !s.spawning })[0];
    if (global.rooms?.['E11N14']?.taskMap) {
      const hasGenerateTask = Object.keys(global.rooms['E11N14'].taskMap).some((key) => key.startsWith('generate'));
      if (!hasGenerateTask && spawn) {
        if (!creep) {
          spawn.spawnCreep(
            generatorRoleBody([
              { body: 'attack', count: 25 },
              { body: 'move', count: 25 },
            ]),
            'PowerBankAttack',
            { memory: { role: 'attacker' } }
          );
        } else if (!creep1) {
          spawn.spawnCreep(
            generatorRoleBody([
              { body: 'attack', count: 25 },
              { body: 'move', count: 25 },
            ]),
            'PowerBankAttack2',
            { memory: { role: 'attacker' } }
          );
        } else if (!creep2) {
          spawn.spawnCreep(
            generatorRoleBody([
              { body: 'heal', count: 32 },
              { body: 'move', count: 16 },
            ]),
            'PowerBankHealer',
            { memory: { role: 'attacker' } }
          );
        } else if (!creep3) {
          spawn.spawnCreep(
            generatorRoleBody([
              { body: 'heal', count: 32 },
              { body: 'move', count: 16 },
            ]),
            'PowerBankHealer2',
            { memory: { role: 'attacker' } }
          );
        }
      }
    }
  }

  const room = Game.rooms['E10N14'];
  const powerBank = room?.find(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_POWER_BANK })[0];
  if (!powerBank) {
    creep?.moveTo(Game.flags['E10N14']);
    creep1?.moveTo(Game.flags['E10N14']);
    creep2?.moveTo(Game.flags['E10N14']);
    creep3?.moveTo(Game.flags['E10N14']);
  }
  if (creep.attack(powerBank) === ERR_NOT_IN_RANGE) {
    creep?.moveTo(powerBank);
  }
  if (creep1.attack(powerBank) === ERR_NOT_IN_RANGE) {
    creep1?.moveTo(powerBank);
  }

  if (creep.hits < creep.hitsMax && creep2) {
    if (creep2.pos.isNearTo(creep)) creep2?.heal(creep);
    else creep2.moveTo(creep);
  }
  if (creep1.hits < creep1.hitsMax && creep3) {
    if (creep3.pos.isNearTo(creep1)) creep3.heal(creep1);
    else creep3.moveTo(creep1);
  }
};
