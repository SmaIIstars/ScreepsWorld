declare global {
  type EventStatus = 'pending' | 'claimed' | 'completed' | 'expired';

  /** Per-resource quota map. Caller provides totals; Guild manages remainingQuota. */
  type QuotaMap = Record<string, number>;

  interface Event {
    id: string;
    type: string;
    room: string;
    targetId: string;
    publisherType: string;
    requiredTags: string[];
    requiredCapacities: Record<string, number>;
    priority: number;
    status: EventStatus;
    claimerIds: string[];
    claimedAt: number | null;
    completedAt: number | null;
    minWorkers: number;
    maxWorkers: number;
    currentWorkers: number;
    data: Record<string, any>;
    pos?: { x: number; y: number; roomName: string };
    allowFallback: boolean;
    createdAt: number;
    dedupKey: string;
  }
}

export {};
