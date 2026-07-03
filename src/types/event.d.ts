declare global {
  type EventStatus = 'pending' | 'claimed' | 'completed' | 'expired';

  interface EventQuota {
    resourceType: ResourceConstant;
    amount: number;
  }

  interface Event {
    id: string;
    type: string;
    room: string;
    requiredTags: string[];
    requiredCapacities: Record<string, number>;
    priority: number;
    status: EventStatus;
    claimerId: string | null;
    claimerIds: string[];
    claimedAt: number | null;
    completedAt: number | null;
    minWorkers: number;
    maxWorkers: number;
    currentWorkers: number;
    data: Record<string, any>;
    allowFallback: boolean;
    createdAt: number;
    dedupKey: string;
  }
}

export {};
