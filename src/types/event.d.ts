declare global {
  type EventStatus = 'pending' | 'claimed' | 'completed' | 'expired';

  interface Event {
    id: string;
    type: string;
    room: string;
    requiredTags: string[];
    requiredCapacities: Record<string, number>;
    priority: number;
    status: EventStatus;
    claimerId: string | null;
    claimedAt: number | null;
    minWorkers: number;
    maxWorkers: number;
    currentWorkers: number;
    data: Record<string, any>;
    allowFallback: boolean;
    createdAt: number;
    ttl: number;
    dedupKey: string;
  }
}

export {};
