import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Seed default onboarding steps
  const existingSteps = await prisma.onboardingStep.count();
  if (existingSteps === 0) {
    await prisma.onboardingStep.createMany({
      data: [
        {
          order: 0,
          title: "Bem-vindo ao PQGASTEI?!",
          description: "Seu controle financeiro completo em um só lugar. Vamos te mostrar como começar em poucos passos.",
        },
        {
          order: 1,
          title: "Cadastre suas contas",
          description: "Comece adicionando suas contas bancárias. O saldo é atualizado automaticamente conforme você registra movimentações.",
        },
        {
          order: 2,
          title: "Registre receitas e despesas",
          description: "Lance tudo que você recebe e paga. Suportamos despesas fixas, parceladas, recorrentes e cartões de crédito.",
        },
        {
          order: 3,
          title: "Acompanhe no Dashboard",
          description: "Veja seu patrimônio, saldo, investimentos e resultado do mês em tempo real. Navegue entre meses para comparar períodos.",
        },
        {
          order: 4,
          title: "Tudo pronto!",
          description: "Explore à vontade. Você pode rever este guia a qualquer momento nas Configurações.",
        },
      ],
    });
    console.log("✅ Onboarding steps criados");
  } else {
    console.log("ℹ️ Onboarding steps já existem, pulando");
  }

  // 2. Seed default system settings
  const settings = [
    { key: "onboarding_enabled", value: "true" },
    { key: "brand_tagline", value: "Gestão financeira pessoal" },
  ];
  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      create: s,
      update: {},
    });
  }
  console.log("✅ System settings criados");

  // 3. Promote admin user by email
  const adminEmail = process.argv[2];
  if (adminEmail) {
    const user = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
      console.log(`✅ Usuário ${adminEmail} promovido a ADMIN`);
    } else {
      console.log(`⚠️ Usuário ${adminEmail} não encontrado`);
    }
  } else {
    console.log("ℹ️ Para promover um admin, passe o email: npx tsx prisma/seed-admin.ts email@exemplo.com");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
