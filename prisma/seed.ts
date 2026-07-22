/**
 * Database seed — idempotent. Run with `npm run db:seed`.
 *
 * Creates the minimum needed to log in and exercise v1:
 *  - one ADMIN and one HR user (credentials from env or dev defaults)
 *  - the single CompanyProfile row
 *  - baseline Departments / Designations
 *  - Pakistan FY2024-2025 salaried tax slabs (illustrative; editable in Settings)
 *
 * Imported with explicit .ts paths + relative specifiers so it runs under tsx.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const rupees = (r: number) => r * 100; // rupees -> paisa (minor units)

async function main() {
  // --- Users -----------------------------------------------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@techmanion.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";
  const hrEmail = process.env.SEED_HR_EMAIL ?? "hr@techmanion.local";
  const hrPassword = process.env.SEED_HR_PASSWORD ?? "hr1234";

  const [adminHash, hrHash] = await Promise.all([
    bcrypt.hash(adminPassword, 12),
    bcrypt.hash(hrPassword, 12),
  ]);

  await db.user.upsert({
    where: { email: adminEmail },
    update: { name: "Portal Admin", role: "ADMIN", isActive: true, passwordHash: adminHash },
    create: { email: adminEmail, name: "Portal Admin", role: "ADMIN", passwordHash: adminHash },
  });
  await db.user.upsert({
    where: { email: hrEmail },
    update: { name: "HR Manager", role: "HR", isActive: true, passwordHash: hrHash },
    create: { email: hrEmail, name: "HR Manager", role: "HR", passwordHash: hrHash },
  });

  // --- Company profile (single row) -----------------------------------------
  if ((await db.companyProfile.count()) === 0) {
    await db.companyProfile.create({
      data: { name: "Techmanion", defaultCurrency: "PKR", logoText: "Techmanion" },
    });
  }

  // --- Departments / Designations -------------------------------------------
  const departments = ["Engineering", "Design", "Quality Assurance", "Human Resources", "Management"];
  const designations = [
    "Software Engineer",
    "Senior Software Engineer",
    "Team Lead",
    "QA Engineer",
    "UI/UX Designer",
    "HR Manager",
  ];
  await Promise.all(
    departments.map((name) =>
      db.department.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );
  await Promise.all(
    designations.map((name) =>
      db.designation.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  // --- Pakistan FY2024-2025 salaried tax slabs (annual, PKR) -----------------
  const fiscalYear = "2024-2025";
  const slabs = [
    { lowerBound: rupees(0), upperBound: rupees(600_000), fixedAmount: rupees(0), ratePctOverLower: 0 },
    { lowerBound: rupees(600_000), upperBound: rupees(1_200_000), fixedAmount: rupees(0), ratePctOverLower: 5 },
    { lowerBound: rupees(1_200_000), upperBound: rupees(2_200_000), fixedAmount: rupees(30_000), ratePctOverLower: 15 },
    { lowerBound: rupees(2_200_000), upperBound: rupees(3_200_000), fixedAmount: rupees(180_000), ratePctOverLower: 25 },
    { lowerBound: rupees(3_200_000), upperBound: rupees(4_100_000), fixedAmount: rupees(430_000), ratePctOverLower: 30 },
    { lowerBound: rupees(4_100_000), upperBound: null, fixedAmount: rupees(700_000), ratePctOverLower: 35 },
  ];
  // Rebuild this fiscal year's slabs so re-seeding stays consistent.
  await db.taxSlab.deleteMany({ where: { fiscalYear } });
  await db.taxSlab.createMany({ data: slabs.map((s) => ({ fiscalYear, ...s })) });

  console.log("Seed complete.");
  console.log(`  Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`  HR:    ${hrEmail} / ${hrPassword}`);
  console.log(`  ${departments.length} departments, ${designations.length} designations, ${slabs.length} tax slabs (${fiscalYear}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
