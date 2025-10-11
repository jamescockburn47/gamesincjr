import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFacts() {
  const count = await prisma.fact.count();
  if (count >= 144) {
    return;
  }

  const data: Array<{ a: number; b: number; op: string }> = [];
  for (let a = 1; a <= 12; a += 1) {
    for (let b = 1; b <= 12; b += 1) {
      data.push({ a, b, op: '*' });
    }
  }

  await prisma.fact.createMany({
    data,
    skipDuplicates: true,
  });
}

async function seedUsers() {
  await prisma.user.upsert({
    where: { id: 'teacher-demo' },
    update: {},
    create: {
      id: 'teacher-demo',
      role: Role.TEACHER,
      displayName: 'Demo Teacher',
      orgId: 'demo-org',
    },
  });

  await prisma.user.upsert({
    where: { id: 'parent-demo' },
    update: {},
    create: {
      id: 'parent-demo',
      role: Role.PARENT,
      displayName: 'Demo Parent',
      orgId: 'demo-org',
    },
  });

  await prisma.user.upsert({
    where: { id: 'student-demo' },
    update: {},
    create: {
      id: 'student-demo',
      role: Role.STUDENT,
      displayName: 'Demo Student',
      orgId: 'demo-org',
      aiAllowed: false,
    },
  });
}

async function seedUserFacts(userId: string) {
  const facts = await prisma.fact.findMany({ select: { id: true } });
  const existing = await prisma.userFact.findMany({
    where: { userId },
    select: { factId: true },
  });

  const existingSet = new Set(existing.map((entry) => entry.factId));
  const missing = facts
    .map((fact) => fact.id)
    .filter((id) => !existingSet.has(id))
    .map((factId) => ({
      userId,
      factId,
      masteryLevel: 0,
      streak: 0,
      easiness: 2.5,
      intervalDays: 0,
      dueAt: new Date(),
    }));

  if (missing.length) {
    await prisma.userFact.createMany({ data: missing });
  }
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
