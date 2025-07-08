import { BaseRoleCreateParams } from '../base/BaseRole';
import Harvester from './harvester';

export type BaseRole2<T = Record<string, any>> = {
  run: (creep: Creep, opts?: T) => void;
  create: (params: BaseRoleCreateParams) => ScreepsReturnCode;
};

export const role2: Partial<Record<CustomRoleType, BaseRole2>> = {
  harvester: Harvester,
};
