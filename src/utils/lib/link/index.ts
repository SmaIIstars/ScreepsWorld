import { LINK_ID_ENUM } from '@/constant';

const SourceLinkIds: string[] = [LINK_ID_ENUM.SourceLink];

class LinkManager {
  link: StructureLink;

  constructor(link: StructureLink) {
    this.link = link;
  }

  run(): void {
    // 3%的损耗
    if (this.canSend(1) && SourceLinkIds.includes(this.link.id)) {
      // 从SourceLink发送能量到ControllerLink
      const controllerLink = Game.getObjectById<StructureLink>(LINK_ID_ENUM.ControllerLink);

      if (controllerLink && controllerLink.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        this.send(controllerLink);
      }
    }
  }

  /**
   * 判断Link是否有足够能量发送
   * @param amount 需要的能量数量，默认200
   */
  canSend(amount: number = 200): boolean {
    return this.link.cooldown === 0 && this.link.store[RESOURCE_ENERGY] >= amount;
  }

  /**
   * 发送能量到目标Link
   * @param target 目标Link
   * @param amount 发送的能量数量，默认全部
   * @returns OK 或错误码
   */
  send(target: StructureLink, amount?: number): ScreepsReturnCode {
    if (this.link.cooldown > 0) return ERR_TIRED;
    const canSendAmount = amount
      ? Math.min(amount, this.link.store[RESOURCE_ENERGY])
      : this.link.store[RESOURCE_ENERGY];
    return this.link.transferEnergy(target, canSendAmount);
  }

  /**
   * Link当前能量
   */
  get energy(): number {
    return this.link.store[RESOURCE_ENERGY];
  }

  /**
   * Link最大能量
   */
  get energyCapacity(): number {
    return this.link.store.getCapacity(RESOURCE_ENERGY) || 800;
  }

  /**
   * Link是否满能量
   */
  get isFull(): boolean {
    return this.energy >= this.energyCapacity;
  }

  /**
   * Link是否空
   */
  get isEmpty(): boolean {
    return this.energy === 0;
  }
}

/**
 * 运行所有Link
 */
export const runLinks = (room: Room): void => {
  const links = room.find(FIND_MY_STRUCTURES, {
    filter: (structure): structure is StructureLink => structure.structureType === STRUCTURE_LINK,
  });

  links.forEach((link) => {
    const linkManager = new LinkManager(link);
    linkManager.run();
  });
};
