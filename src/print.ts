import { BASE_ID_ENUM } from './constant';

const printMain = () => {
  const constructionSite = Game.spawns[BASE_ID_ENUM.MainBase].room
    .find(FIND_MY_CONSTRUCTION_SITES)
    .filter((c) => c.progress < c.progressTotal);
};

export default printMain;
