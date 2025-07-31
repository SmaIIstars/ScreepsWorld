import { generatorRoleBody } from '@/utils';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    miner: {
      count: 2,
      body: generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 1 },
        { body: MOVE, count: 4 },
      ]),
    },
    harvester: {
      count: 2,
      body: generatorRoleBody([
        { body: CARRY, count: 10 },
        { body: MOVE, count: 5 },
      ]),
    },
    repairer: {
      count: 2,
      body: generatorRoleBody([
        { body: WORK, count: 5 },
        { body: CARRY, count: 10 },
        { body: MOVE, count: 5 },
      ]),
    },
    upgrader: {
      count: 3,
      body: generatorRoleBody([
        { body: WORK, count: 8 },
        { body: CARRY, count: 10 },
        { body: MOVE, count: 9 },
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
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 1 },
        { body: MOVE, count: 4 },
      ]),
    },
    remoteHarvester: {
      count: 0,
      body: generatorRoleBody([
        { body: CARRY, count: 6 },
        { body: MOVE, count: 3 },
      ]),
    },
    // pioneer: {
    //   count: 0,
    //   body: generatorRoleBody([
    //     { body: WORK, count: 6 },
    //     { body: CARRY, count: 7 },
    //     { body: MOVE, count: 7 },
    //   ]),
    // },
  },
};

export default strategy;
