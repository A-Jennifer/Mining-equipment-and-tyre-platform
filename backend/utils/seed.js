/**
 * Run with: npm run seed
 * Wipes the database and fills it with realistic sample data
 * (3 mine sites, 10 users, 12 machines, 48 tyres, 14 work orders).
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Site = require("../models/Site");
const Equipment = require("../models/Equipment");
const Tyre = require("../models/Tyre");
const MaintenanceRecord = require("../models/MaintenanceRecord");
const data = require("./seedData");

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n) => new Date(Date.now() + n * DAY); // dates are relative so "Overdue" / "Upcoming" stay correct

async function seed() {
  await connectDB();

  await Promise.all([
    User.deleteMany(),
    Site.deleteMany(),
    Equipment.deleteMany(),
    Tyre.deleteMany(),
    MaintenanceRecord.deleteMany()
  ]);

  // ---- sites
  const siteId = {};
  for (const s of data.sites) {
    siteId[s.key] = (await Site.create({ name: s.name, location: s.location }))._id;
  }

  // ---- users (the password is hashed by the model)
  const userId = {};
  for (const u of data.users) {
    const doc = await User.create({
      name: u.name,
      email: u.email,
      password: u.password || data.PASSWORD,
      role: u.role,
      site: u.site ? siteId[u.site] : undefined
    });
    userId[u.key] = doc._id;
  }

  // ---- equipment
  const equipmentId = {};
  for (const e of data.equipment) {
    const doc = await Equipment.create({
      name: e.key,
      model: e.model,
      type: e.type,
      site: siteId[e.site],
      status: e.status,
      totalUsageHours: e.hours,
      purchaseDate: new Date(e.purchased, 3, 1),
      qrCode: e.qr
    });
    equipmentId[e.key] = doc._id;
  }

  // ---- tyres (status is calculated by the model's pre-save hook, except "Replaced")
  const tyreDoc = {};
  for (const t of data.tyres) {
    const doc = await Tyre.create({
      tyreCode: t.code,
      qrCode: t.code,
      brand: t.brand,
      size: t.size,
      equipment: equipmentId[t.eq],
      position: t.position,
      usageHours: t.usageHours,
      wearThresholdHours: t.threshold,
      cost: t.cost,
      installDate: daysFromNow(-t.installDaysAgo),
      status: t.replaced ? "Replaced" : undefined
    });
    tyreDoc[`${t.eq}|${t.position}`] = doc;
  }

  // ---- work orders
  const taskId = {};
  for (const t of data.tasks) {
    const isTyre = Boolean(t.target.tyre);
    const done = t.completedDaysAgo !== undefined;
    const doc = await MaintenanceRecord.create({
      targetType: isTyre ? "Tyre" : "Equipment",
      targetId: isTyre ? tyreDoc[t.target.tyre]._id : equipmentId[t.target.equipment],
      category: t.category,
      description: t.title,
      serviceDate: daysFromNow(t.dueDays - 10),
      nextDueDate: daysFromNow(t.dueDays),
      status: done ? "Completed" : "Open",
      assignedTo: userId[t.to],
      createdBy: userId[t.by],
      completedBy: done ? userId[t.to] : undefined,
      completedAt: done ? daysFromNow(-t.completedDaysAgo) : undefined,
      note: t.note,
      cost: t.cost
    });
    taskId[t.key] = doc._id;
  }

  // ---- technician -> manager replacement requests
  for (const t of data.tyres) {
    if (!t.request) continue;
    const r = t.request;
    const doc = tyreDoc[`${t.eq}|${t.position}`];
    doc.set("replacementRequest", {
      status: r.status,
      requestedBy: userId[r.by],
      requestedAt: daysFromNow(-r.daysAgo),
      reason: r.reason,
      reviewedBy: r.reviewedBy ? userId[r.reviewedBy] : undefined,
      reviewedAt: r.reviewedBy ? daysFromNow(-(r.daysAgo - 1)) : undefined,
      reviewNote: r.note,
      task: r.taskKey ? taskId[r.taskKey] : undefined
    });
    await doc.save();
  }

  console.log("Sample data created:");
  console.log(`  ${data.sites.length} sites, ${data.users.length} users, ${data.equipment.length} machines, ${data.tyres.length} tyres, ${data.tasks.length} work orders`);
  console.log("");
  console.log(`Demo logins (password for all: ${data.PASSWORD})`);
  console.log("  admin@minetrack.demo             Administrator");
  console.log("  manager.neyveli@minetrack.demo   Site Manager (Neyveli OCP, Tamil Nadu)");
  console.log("  tech.neyveli1@minetrack.demo     Technician   (Neyveli OCP, Tamil Nadu)");

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});