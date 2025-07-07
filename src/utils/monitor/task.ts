// Memory 只能存string, number, boolean, 简单的 object, array，null. 不能缓存 Function

import { BASE_ID_ENUM } from '@/constant';
import { generatorRoleBody } from '../lib/base/role';

const task = () => {
  minCreepGroup();
  miner();
  minerStore();
};

const minCreepGroup = () => {
  const creepsList: Array<{ name: string; role: CustomRoleType }> = [
    { name: 'Harvester-1', role: 'harvester' },
    { name: 'Upgrader-1', role: 'upgrader' },
    { name: 'Builder-1', role: 'builder' },
  ];

  for (const creep of creepsList) {
    const creepCreep = Game.creeps[creep.name];
    if (!creepCreep) {
      console.log('minCreepGroup', creep.name);

      Game.spawns[BASE_ID_ENUM.MainBase].spawnCreep(
        generatorRoleBody([
          { body: WORK, count: 2 },
          { body: CARRY, count: 1 },
          { body: MOVE, count: 1 },
        ]),
        creep.name,
        { memory: { role: creep.role, task: 'harvesting' } },
      );
    }
  }
};
const miner = () => {
  const minerList = [
    // { name: "Miner-1", pos: { x: 8, y: 44 } },
    {
      name: 'Miner-2',
      pos: { x: 9, y: 44 },
      targetSourceId: '5bbcaffd9099fc012e63b77c',
    },
    // { name: "Miner-3", pos: { x: 10, y: 44 } },
    {
      name: 'Miner-4',
      pos: { x: 4, y: 40 },
      targetSourceId: '5bbcaffd9099fc012e63b77b',
    },
  ];

  for (const miner of minerList) {
    const minerCreep = Game.creeps[miner.name];
    if (minerCreep) {
      minerCreep.moveTo(miner.pos.x, miner.pos.y);
    } else {
      const spawnResult = Game.spawns[BASE_ID_ENUM.MainBase].spawnCreep(
        generatorRoleBody([
          { body: WORK, count: 6 },
          { body: CARRY, count: 2 },
          { body: MOVE, count: 2 },
        ]),
        miner.name,
        {
          memory: {
            role: 'miner',
            task: 'harvesting',
            targetSourceId: miner.targetSourceId,
          },
        },
      );
      if (spawnResult === ERR_NOT_ENOUGH_ENERGY) {
        console.log(`Not enough energy to spawn ${miner.name}`);
      }
    }
  }
};

const minerStore = () => {
  const minerStoreList = [
    // { name: "MinerStore-1", pos: { x: 6, y: 40 } },
    { name: 'MinerStore-2', pos: { x: 5, y: 39 } },
    { name: 'MinerStore-3', pos: { x: 10, y: 43 } },
  ];

  for (const minerStore of minerStoreList) {
    const minerStoreCreep = Game.creeps[minerStore.name];
    if (minerStoreCreep) {
      minerStoreCreep.moveTo(minerStore.pos.x, minerStore.pos.y);
    } else {
      Game.spawns[BASE_ID_ENUM.MainBase].spawnCreep(
        generatorRoleBody([
          { body: CARRY, count: 15 },
          { body: MOVE, count: 1 },
        ]),
        minerStore.name,
        { memory: { role: 'minerStore' } },
      );
    }
  }
};

export { task };
