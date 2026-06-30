declare global {
  interface WorkerMeta {
    id: string;
    type: 'creep' | 'structure';
    room: string;
    tags: string[];
    capacities: Record<string, number>;
    currentEventId: string | null;
    rolePref: string;
    createdAt: number;
    spawnBody: BodyPartDefinition[];
  }

  interface WorkforceRow {
    role: string;
    target: number;
    actual: number;
    active: number;
  }
}

export {};
