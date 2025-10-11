// Seed script (ignored during Vercel builds). Run locally with: pnpm tsx scripts/seed.ts
// We avoid importing Prisma types at build-time to keep Next/Turbopack happy.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import('@prisma/client').then(async (mod: any) => {
  const { PrismaClient, Role } = mod;
  const prisma = new PrismaClient();

  async function seedFacts() {
    const count = await prisma.fact.count();
    if (count >= 144) return;
    const data: Array<{ a: number; b: number; op: string }> = [];
    for (let a = 1; a <= 12; a += 1) {
      for (let b = 1; b <= 12; b += 1) {
        data.push({ a, b, op: '*' });
      }
    }
    await prisma.fact.createMany({ data, skipDuplicates: true });
  }

  async function seedUsers() {
    await prisma.user.upsert({
      where: { id: 'teacher-demo' },
      update: {},
      create: { id: 'teacher-demo', role: Role.TEACHER, displayName: 'Demo Teacher', orgId: 'demo-org' },
    });
    await prisma.user.upsert({
      where: { id: 'parent-demo' },
      update: {},
      create: { id: 'parent-demo', role: Role.PARENT, displayName: 'Demo Parent', orgId: 'demo-org' },
    });
    await prisma.user.upsert({
      where: { id: 'student-demo' },
      update: {},
      create: { id: 'student-demo', role: Role.STUDENT, displayName: 'Demo Student', orgId: 'demo-org', aiAllowed: false },
    });
  }

  const MAX_OFFSET_MINUTES = 6 * 60;

  function seededOffsetMinutes(userId: string, factId: string): number {
    const key = `${userId}:${factId}`;
    let hash = 0;
    for (let index = 0; index < key.length; index += 1) {
      hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
    }
    return hash % MAX_OFFSET_MINUTES;
  }

  function initialIntervalDays(offsetMinutes: number): number {
    return Math.max(0, offsetMinutes / (60 * 24));
  }

  function initialDueAt(offsetMinutes: number): Date {
    return new Date(Date.now() - offsetMinutes * 60 * 1000);
  }

  async function seedUserFacts(userId: string) {
    const facts = await prisma.fact.findMany({ select: { id: true } });
    const existing = await prisma.userFact.findMany({ where: { userId }, select: { factId: true } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingSet = new Set(existing.map((e: any) => e.factId));
    const missing = facts
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       .map((f: any) => f.id)
      .filter((id: string) => !existingSet.has(id))
      .map((factId: string) => {
        const offsetMinutes = seededOffsetMinutes(userId, factId);
        return {
          userId,
          factId,
          masteryLevel: 0,
          streak: 0,
          easiness: 2.5,
          intervalDays: initialIntervalDays(offsetMinutes),
          dueAt: initialDueAt(offsetMinutes),
        };
      });
    if (missing.length) await prisma.userFact.createMany({ data: missing });
  }

  async function main() {
    await seedFacts();
    await seedUsers();
    await seedUserFacts('student-demo');
    console.info('Seed completed.');
  }

  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}).catch(() => {
  // Prisma not available in this environment; skip seeding.
});
