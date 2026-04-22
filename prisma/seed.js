const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // Create some users
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice' },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { email: 'bob@example.com', name: 'Bob' },
  });

  // Create some products
  for (let i = 1; i <= 50; i++) {
    await prisma.product.create({
      data: {
        name: `Product ${i}`,
        description: `Description for product ${i}`,
        price: Math.floor(Math.random() * 100) + 10,
        category: i % 2 === 0 ? 'Electronics' : 'Groceries',
        stock: Math.floor(Math.random() * 100),
        imageUrl: `https://via.placeholder.com/150?text=Product+${i}`,
      },
    });
  }

  // Create some orders
  await prisma.order.createMany({
    data: [
      { userId: user1.id, total: 150.50, status: 'DELIVERED' },
      { userId: user2.id, total: 200.00, status: 'PENDING' },
    ],
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
