import { merge } from "lodash";
import { BASE_ID_ENUM } from "../../../constant";

type BaseRoleCreateParams = {
  baseId?: string;
  body: BodyPartConstant[];
  role: CustomRoleType;
  name?: string;
  opts?: Partial<SpawnOptions>;
};

export const baseRole = {
  getVisualStatus: (creep: Creep) => {
    const fatigue = creep.fatigue;
    const text = `${creep.memory.role} ${fatigue}`;

    return creep.room.visual.text(text, creep.pos.x, creep.pos.y - 1, {
      font: 0.5,
      color: "#00ff00",
      stroke: "#000000",
      strokeWidth: 0.1,
    });
  },

  create: (params: BaseRoleCreateParams) => {
    const { baseId = BASE_ID_ENUM.MainBase, body, name, role, opts } = params;
    const curName = name ?? `${role}-${Game.time}`;
    return Game.spawns?.[baseId]?.spawnCreep(
      body,
      curName,
      merge({ memory: { role } }, opts)
    );
  },
};
