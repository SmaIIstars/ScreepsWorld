import { BASE_ID_ENUM } from "../../constant";
import { querySourceAvailablePositions } from "../query";

export const resource = () => {
  checkResourceCongestion();
  getBaseStatus();
};

const checkResourceCongestion = () => {
  const sources = Game.spawns[BASE_ID_ENUM.MainBase].room.find(FIND_SOURCES);

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

    source.room.visual.text(
      `${source.energy}-${vacancyCount}`,
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
