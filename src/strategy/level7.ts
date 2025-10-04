import { generatorRoleBody } from '@/utils';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    miner: {
      count: 3,
      body: generatorRoleBody([
        { body: WORK, count: 15 },
        { body: CARRY, count: 1 },
        { body: MOVE, count: 4 },
      ]),
    },
    harvester: {
      count: 3,
      body: generatorRoleBody([
        { body: CARRY, count: 32 },
        { body: MOVE, count: 16 },
      ]),
    },
    repairer: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 10 },
        { body: CARRY, count: 30 },
        { body: MOVE, count: 10 },
      ]),
    },
    upgrader: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 1 },
        { body: CARRY, count: 20 },
        { body: MOVE, count: 7 },
      ]),
    },
    builder: {
      count: 0,
      body: generatorRoleBody([
        { body: WORK, count: 10 },
        { body: CARRY, count: 20 },
        { body: MOVE, count: 15 },
      ]),
    },
    remoteMiner: {
      count: 0,
      body: generatorRoleBody([
        { body: WORK, count: 10 },
        { body: CARRY, count: 2 },
        { body: MOVE, count: 6 },
      ]),
    },
    remoteHarvester: {
      count: 0,
      body: generatorRoleBody([
        { body: CARRY, count: 6 },
        { body: MOVE, count: 3 },
      ]),
    },
  },
};

export default strategy;
