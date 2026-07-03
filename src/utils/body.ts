export function createBody(parts: Record<string, number>): BodyPartConstant[] {
  const body: BodyPartConstant[] = [];
  for (const [part, count] of Object.entries(parts)) {
    for (let i = 0; i < count; i++) {
      body.push(part as BodyPartConstant);
    }
  }
  return body;
}
