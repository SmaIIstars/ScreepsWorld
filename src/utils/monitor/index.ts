import { ROOM_ID_ENUM } from '@/constant';
import { memory } from './memory';
import { statusMain } from './status';
import { task } from './task';

const monitorMain = () => {
  statusMain();
  memory();
  task();

  // 如果有敌人
  const enemyCreeps = Game.rooms[ROOM_ID_ENUM.MainRoom].find(FIND_HOSTILE_CREEPS);
  if (enemyCreeps.length > 0) {
    console.log('有敌人', enemyCreeps);
  }
};

export default monitorMain;
