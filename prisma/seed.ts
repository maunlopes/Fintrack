import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, CategoryType } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const defaultCategories = [
  // DESPESAS
  { name: "Alimentação", type: CategoryType.EXPENSE, icon: "utensils", color: "#FF5B04" },
  { name: "Transporte", type: CategoryType.EXPENSE, icon: "car", color: "#075056" },
  { name: "Moradia", type: CategoryType.EXPENSE, icon: "home", color: "#16232A" },
  { name: "Saúde", type: CategoryType.EXPENSE, icon: "heart-pulse", color: "#EF4444" },
  { name: "Educação", type: CategoryType.EXPENSE, icon: "graduation-cap", color: "#3B82F6" },
  { name: "Lazer", type: CategoryType.EXPENSE, icon: "gamepad-2", color: "#8B5CF6" },
  { name: "Compras", type: CategoryType.EXPENSE, icon: "shopping-bag", color: "#F59E0B" },
  { name: "Financiamento", type: CategoryType.EXPENSE, icon: "landmark", color: "#075056" },
  { name: "Serviços/Assinaturas", type: CategoryType.EXPENSE, icon: "wifi", color: "#0D8A93" },
  { name: "Impostos", type: CategoryType.EXPENSE, icon: "receipt", color: "#B91C1C" },
  { name: "Outros (Despesas)", type: CategoryType.EXPENSE, icon: "circle", color: "#8A9AA3" },
  // RECEITAS
  { name: "Salário", type: CategoryType.INCOME, icon: "briefcase", color: "#10B981" },
  { name: "Freelance", type: CategoryType.INCOME, icon: "laptop", color: "#34D399" },
  { name: "Investimentos", type: CategoryType.INCOME, icon: "trending-up", color: "#075056" },
  { name: "Aluguel Recebido", type: CategoryType.INCOME, icon: "building", color: "#059669" },
  { name: "Outros (Receitas)", type: CategoryType.INCOME, icon: "circle", color: "#8A9AA3" },
];

async function main() {
  console.log("Seeding default categories...");
  let created = 0;
  for (const cat of defaultCategories) {
    const exists = await prisma.category.findFirst({
      where: { userId: null, name: cat.name, type: cat.type },
    });
    if (!exists) {
      await prisma.category.create({
        data: { ...cat, userId: null, isDefault: true },
      });
      created++;
    }
  }
  console.log(`Seeded ${created} default categories (${defaultCategories.length - created} already existed).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
