import { generatorRoleBody } from '@/utils';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    miner: {
      count: 0,
      body: generatorRoleBody([
        { body: WORK, count: 10 },
        { body: CARRY, count: 2 },
        { body: MOVE, count: 6 },
      ]),
    },
    attacker: {
      count: 0,
      body: generatorRoleBody([
        { body: ATTACK, count: 10 },
        { body: HEAL, count: 2 },
        { body: MOVE, count: 6 },
      ]),
    },
    remoteMiner: {
      count: 0,
      body: generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 2 },
        { body: MOVE, count: 4 },
      ]),
    },
    remoteHarvester: {
      count: 0,
      body: generatorRoleBody([
        { body: WORK, count: 2 },
        { body: CARRY, count: 16 },
        { body: MOVE, count: 9 },
      ]),
    },
    harvester: {
      count: 3,
      body: generatorRoleBody([
        { body: CARRY, count: 10 },
        { body: MOVE, count: 5 },
      ]),
    },
    repairer: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 5 },
        { body: CARRY, count: 10 },
        { body: MOVE, count: 5 },
      ]),
    },
    upgrader: {
      count: 4,
      body: generatorRoleBody([
        { body: WORK, count: 5 },
        { body: CARRY, count: 16 },
        { body: MOVE, count: 7 },
      ]),
    },
    builder: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 7 },
        { body: MOVE, count: 7 },
      ]),
    },
  },
};

export default strategy;
