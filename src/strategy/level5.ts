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
      count: 1,
      body: generatorRoleBody([
        { body: CARRY, count: 20 },
        { body: MOVE, count: 10 },
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
    pioneer: {
      count: 0,
      body: generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 7 },
        { body: MOVE, count: 7 },
      ]),
    },
  },
};

export default strategy;
