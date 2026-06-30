import { generatorRoleBody } from '@/utils';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    miner: {
      count: 2,
      body: generatorRoleBody([
        { body: WORK, count: 10 },
        { body: CARRY, count: 2 },
        { body: MOVE, count: 6 },
      ]),
    },
    harvester: {
      count: 3,
      body: generatorRoleBody([
        { body: CARRY, count: 20 },
        { body: MOVE, count: 10 },
      ]),
    },
    repairer: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 5 },
        { body: CARRY, count: 15 },
        { body: MOVE, count: 10 },
      ]),
    },
    upgrader: {
      count: 4,
      body: generatorRoleBody([
        { body: WORK, count: 5 },
        { body: CARRY, count: 20 },
        { body: MOVE, count: 13 },
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
        { body: WORK, count: 2 },
        { body: CARRY, count: 24 },
        { body: MOVE, count: 13 },
      ]),
    },
  },
};

export default strategy;
