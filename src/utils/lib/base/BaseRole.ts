export type BaseRoleType = {
  role: CustomRoleType;
  task: CustomTaskType;
};

export type BaseRoleCreateParams = {
  baseId?: string;
  name?: string;
  body: BodyPartConstant[];
  memoryRoleOpts: BaseRoleType;
};

export abstract class BaseRole {
  protected role: CustomRoleType;
  abstract task: CustomTaskType;

  constructor(role: CustomRoleType) {
    this.role = role;
  }

  abstract create(params: BaseRoleCreateParams): ScreepsReturnCode;
  abstract run(creep: Creep): void;
  abstract roleTask(creep: Creep): void;
}
