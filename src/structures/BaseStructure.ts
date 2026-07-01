// src/structures/BaseStructure.ts
import { Guild, DemandData } from '../core/Guild';
import { buildDedupKey } from '../core/Event';

export abstract class BaseStructure<T extends { room: Room | undefined; id: Id<any> }> {
  protected obj: T;
  protected room: Room;

  constructor(obj: T) {
    this.obj = obj;
    this.room = obj.room!;
  }

  abstract runLifecycle(): void;

  protected post(demand: DemandData): void {
    Guild.post(demand);
  }

  protected cancel(type: string): void {
    Guild.cancel(buildDedupKey(type, this.room.name, this.obj.id));
  }
}
