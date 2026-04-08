/**
 * seed_db.js — Macho ya Mwananchi
 * Wipes and re-seeds the Project collection with all 14 OAG-verified projects.
 *
 * Run: node seed_db.js
 */

import dotenv from 'dotenv';
import connectDB, { disconnectDB } from './db.js';
import Project from './models/Project.js';
import { projects, globalStats } from './data/seed.js';

dotenv.config();

const formatKsh = (n) => `Ksh ${(n / 1_000_000).toFixed(1)}M`;

const seed = async () => {
  await connectDB();

  console.log('\n🌱 Seeding Macho ya Mwananchi database...\n');

  // Wipe existing project data
  const deleted = await Project.deleteMany({});
  console.log(`   🗑️  Cleared ${deleted.deletedCount} existing projects`);

  // Insert all 14 projects
  const inserted = await Project.insertMany(projects);
  console.log(`   ✅ Inserted ${inserted.length} projects\n`);

  // Print summary by communityStatus
  const statusGroups = inserted.reduce((acc, p) => {
    acc[p.communityStatus] = (acc[p.communityStatus] || 0) + 1;
    return acc;
  }, {});

  console.log('   Project status breakdown:');
  Object.entries(statusGroups)
    .sort(([, a], [, b]) => b - a)
    .forEach(([status, count]) => {
      const icon = {
        'GHOST PROJECT': '👻',
        'STALLED':       '⚠️ ',
        'DISPUTED':      '🟡',
        'ABANDONED':     '🔴',
        'MISALLOCATED':  '💸',
      }[status] || '•';
      console.log(`     ${icon} ${status}: ${count}`);
    });

  // Print total allocated
  const totalAllocated = inserted.reduce((sum, p) => sum + p.allocated, 0);
  console.log(`\n   💰 Total allocated across all projects: ${formatKsh(totalAllocated)}`);
  console.log(`   🚨 Active EACC payroll investigation: ${formatKsh(globalStats.payrollFraud)}`);
  console.log(`   👥 Ghost employees identified: ${globalStats.ghostEmployees.toLocaleString()}`);
  console.log(`   🏥 Health facilities shut: ${globalStats.healthFacilitiesShut}\n`);

  console.log('✅ Database seeded successfully.\n');

  await disconnectDB();
};

seed().catch((err) => {
  console.error(`\n❌ Seed failed: ${err.message}`);
  process.exit(1);
});
