import { generatorRoleBody } from '@/utils';
import { StrategyType } from '.';

const strategy: StrategyType = {
  roleMonitor: {
    harvester: {
      count: 1,
      body: generatorRoleBody([
        { body: CARRY, count: 17 },
        { body: MOVE, count: 9 },
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
    builder: {
      count: 0,
      body: generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 7 },
        { body: MOVE, count: 7 },
      ]),
    },
    miner: {
      count: 2,
      body: generatorRoleBody([
        { body: WORK, count: 6 },
        { body: CARRY, count: 1 },
        { body: MOVE, count: 4 },
      ]),
    },
    upgrader: {
      count: 4,
      body: generatorRoleBody([
        { body: WORK, count: 4 },
        { body: CARRY, count: 12 },
        { body: MOVE, count: 4 },
      ]),
    },
    repairer: {
      count: 1,
      body: generatorRoleBody([
        { body: WORK, count: 1 },
        { body: CARRY, count: 15 },
        { body: MOVE, count: 4 },
      ]),
    },
  },
};

export default strategy;
