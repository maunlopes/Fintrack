import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.pluggyAccount.findMany({
    select: { id: true, name: true, subtype: true, pluggyItemId: true },
  });
  console.log(JSON.stringify(accounts, null, 2));
}

main().finally(() => prisma.$disconnect());
