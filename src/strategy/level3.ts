import { generatorRoleBody } from '@/utils';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 1,
      body: generatorRoleBody([
        { body: CARRY, count: 10 },
        { body: MOVE, count: 5 },
      ]),
    },
    builder: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 5 },
      ]),
    },
    upgrader: {
      count: 3,
      body: generatorRoleBody([
        { body: WORK, count: 3 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 5 },
      ]),
    },
    repairer: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 4 },
        { body: CARRY, count: 5 },
        { body: MOVE, count: 3 },
      ]),
    },
    miner: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 2 },
        { body: MOVE, count: 2 },
      ]),
    },
    remoteMiner: {
      count: 0,
      body: generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 2 },
        { body: MOVE, count: 2 },
      ]),
    },
    remoteHarvester: {
      count: 0,
      body: generatorRoleBody([
        { body: WORK, count: 2 },
        { body: CARRY, count: 8 },
        { body: MOVE, count: 4 },
      ]),
    },
  },
};

export default strategy;
