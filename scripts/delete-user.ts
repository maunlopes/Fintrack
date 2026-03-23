import { prisma } from "../src/lib/prisma";

const email = process.argv[2];
if (!email) { console.error("Usage: tsx scripts/delete-user.ts <email>"); process.exit(1); }

await prisma.user.delete({ where: { email } });
console.log(`Deleted user: ${email}`);
await prisma.$disconnect();
