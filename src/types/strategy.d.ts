declare global {
  interface RoleConfig {
    type: string;
    body: BodyPartConstant[];
    tags: string[];
    minCapacities: Record<string, number>;
    target: number;
  }

  interface LevelConfig {
    level: number;
    roles: RoleConfig[];
  }
}

export {};
