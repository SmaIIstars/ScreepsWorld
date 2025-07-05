import { BASE_ID_ENUM } from "../../constant";
import { querySourceAvailablePositions } from "../query";

export type AvailableSourceType =
  | Source
  | Resource<ResourceConstant>
  | Tombstone
  | Ruin;

export const resource = () => {
  checkResourceCongestion();
  getBaseStatus();
};

const availableSourcesTypes = [
  FIND_DROPPED_RESOURCES,
  FIND_SOURCES,
  FIND_TOMBSTONES,
  FIND_RUINS,
];

const checkResourceCongestion = () => {
  const sources: (Source | Resource<ResourceConstant> | Tombstone | Ruin)[] =
    [];

  for (const type of availableSourcesTypes) {
    sources.push(...Game.spawns[BASE_ID_ENUM.MainBase].room.find(type));
  }

  const resourceMemory: Record<string, ResourceMemory> = {};
  for (const source of sources) {
    const availablePositions = querySourceAvailablePositions(source);
    const creepsNearSource = source.pos.findInRange(FIND_MY_CREEPS, 1);

    resourceMemory[source.id] = {
      availablePositions,
      creepsNearSource,
      source,
    };

    const availableCount = availablePositions.length;
    const occupiedCount = creepsNearSource.length;
    const vacancyCount = availableCount - occupiedCount;

    let text = "";
    if (source instanceof Source) {
      text = `${source[RESOURCE_ENERGY]}-${vacancyCount}`;
    } else if (source instanceof Resource) {
      text = `${source.amount}-${vacancyCount}`;
    } else if (source instanceof Tombstone) {
      text = `${source.store[RESOURCE_ENERGY]}-${vacancyCount}`;
    } else if (source instanceof Ruin) {
      text = `${source.store[RESOURCE_ENERGY]}-${vacancyCount}`;
    }

    Game.spawns[BASE_ID_ENUM.MainBase].room.visual.text(
      text,
      source.pos.x,
      source.pos.y - 1,
      {
        font: 0.5,
        color: vacancyCount > 0 ? "#00ff00" : "#ff0000",
        stroke: "#000000",
        strokeWidth: 0.1,
      }
    );
  }

  Memory.resources = resourceMemory;
};

const getBaseStatus = (baseId: string = BASE_ID_ENUM.MainBase) => {
  const base = Game.spawns[baseId];

  if (base.spawning) {
    base.room.visual.text(`${base.spawning.name}`, base.pos.x, base.pos.y + 1, {
      font: 0.5,
      color: "#00ff00",
      stroke: "#000000",
      strokeWidth: 0.1,
    });
  }
};
