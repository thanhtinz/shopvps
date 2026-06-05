import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@shopvps.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@shopvps.com",
      password: adminPassword,
      role: "SUPER_ADMIN",
      emailVerified: new Date(),
      affiliateCode: "ADMIN001",
    },
  });
  console.log("✅ Admin created:", admin.email);

  // Bank account
  await prisma.bankAccount.upsert({
    where: { id: "bank-primary" },
    update: {},
    create: {
      id: "bank-primary",
      bankName: "MB Bank",
      bankCode: "MB",
      accountNumber: "0123456789",
      accountName: "CONG TY SHOPVPS",
      isActive: true,
      isPrimary: true,
    },
  });

  // Deposit bonuses
  await prisma.depositBonus.createMany({
    data: [
      { minAmount: 100000, maxAmount: 499999, bonusPercent: 5 },
      { minAmount: 500000, maxAmount: 999999, bonusPercent: 10 },
      { minAmount: 1000000, bonusPercent: 15 },
    ],
    skipDuplicates: true,
  });

  // VPS Providers
  const vultr = await prisma.vpsProvider.upsert({
    where: { slug: "vultr" },
    update: {},
    create: {
      name: "Vultr",
      slug: "vultr",
      isActive: true,
    },
  });

  const hetzner = await prisma.vpsProvider.upsert({
    where: { slug: "hetzner" },
    update: {},
    create: {
      name: "Hetzner Cloud",
      slug: "hetzner",
      isActive: true,
    },
  });

  // VPS Packages
  await prisma.vpsPackage.createMany({
    data: [
      {
        providerId: vultr.id,
        name: "Cloud Compute 1",
        slug: "vc2-1c-1gb",
        cpu: 1, ram: 1, storage: 25, bandwidth: 1000,
        priceMonthly: 99000,
        priceYearly: 990000,
        isActive: true, sortOrder: 1,
      },
      {
        providerId: vultr.id,
        name: "Cloud Compute 2",
        slug: "vc2-1c-2gb",
        cpu: 1, ram: 2, storage: 55, bandwidth: 2000,
        priceMonthly: 179000,
        priceYearly: 1790000,
        isActive: true, sortOrder: 2,
      },
      {
        providerId: hetzner.id,
        name: "CX11",
        slug: "cx11",
        cpu: 1, ram: 2, storage: 20, bandwidth: 20000,
        priceMonthly: 89000,
        priceYearly: 890000,
        isActive: true, sortOrder: 1,
      },
    ],
    skipDuplicates: true,
  });

  // System settings
  const settings = [
    { key: "app_name", value: "ShopVPS" },
    { key: "app_url", value: "https://shopvps.com" },
    { key: "affiliate_rate", value: "10" },
    { key: "maintenance_mode", value: "false" },
    { key: "demo_mode", value: "false" },
    { key: "recaptcha_enabled", value: "false" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // Service statuses for status page
  await prisma.serviceStatus.createMany({
    data: [
      { name: "API Gateway", slug: "api-gateway", sortOrder: 1 },
      { name: "VPS Management", slug: "vps-management", sortOrder: 2 },
      { name: "Hosting Panel", slug: "hosting-panel", sortOrder: 3 },
      { name: "Billing & Payment", slug: "billing", sortOrder: 4 },
      { name: "Support System", slug: "support", sortOrder: 5 },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
