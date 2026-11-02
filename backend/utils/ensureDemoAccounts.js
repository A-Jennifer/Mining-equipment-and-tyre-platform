const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Site = require("../models/Site");
const Equipment = require("../models/Equipment");
const MaintenanceRecord = require("../models/MaintenanceRecord");

/**
 * Ensures that both sets of demo accounts exist in the database with valid passwords,
 * sites, and sample tasks. Runs automatically on server startup.
 * The 3 core sites represent major South Indian mining basins (Tamil Nadu, Telangana, Karnataka).
 */
async function ensureDemoAccounts() {
  try {
    // Rename any legacy site names to the South Indian equivalents
    await Site.findOneAndUpdate({ name: /Jharia/i }, { name: "Neyveli OCP", location: "Cuddalore, Tamil Nadu" });
    await Site.findOneAndUpdate({ name: /Talcher/i }, { name: "Kothagudem OCP", location: "Bhadradri Kothagudem, Telangana" });
    await Site.findOneAndUpdate({ name: /Singrauli/i }, { name: "Donimalai OCP", location: "Ballari, Karnataka" });

    // 1. Ensure the 3 core South Indian sites exist
    const defaultSites = [
      { name: "Neyveli OCP", location: "Cuddalore, Tamil Nadu" },
      { name: "Kothagudem OCP", location: "Bhadradri Kothagudem, Telangana" },
      { name: "Donimalai OCP", location: "Ballari, Karnataka" }
    ];

    const siteMap = {};
    for (const s of defaultSites) {
      let site = await Site.findOne({ name: s.name });
      if (!site) {
        site = await Site.create(s);
      }
      siteMap[s.name] = site._id;
    }

    const neyveliId = siteMap["Neyveli OCP"];
    const kothagudemId = siteMap["Kothagudem OCP"];
    const donimalaiId = siteMap["Donimalai OCP"];

    // 2. Define all demo accounts to guarantee
    const accounts = [
      // Legacy demo accounts requested by reviewer
      {
        email: "admin@example.com",
        name: "System Admin (Demo)",
        password: "password123",
        role: "admin",
        site: undefined
      },
      {
        email: "manager@example.com",
        name: "Site Manager (Demo)",
        password: "password123",
        role: "site_manager",
        site: neyveliId
      },
      {
        email: "tech@example.com",
        name: "Technician (Demo)",
        password: "password123",
        role: "technician",
        site: neyveliId
      },
      // Realistic South Indian demo accounts
      {
        email: "admin@minetrack.demo",
        name: "Meera Iyer",
        password: "Mine@1234",
        role: "admin",
        site: undefined
      },
      {
        email: "manager.neyveli@minetrack.demo",
        name: "K. Senthil Nathan",
        password: "Mine@1234",
        role: "site_manager",
        site: neyveliId
      },
      {
        email: "tech.neyveli1@minetrack.demo",
        name: "R. Karthik",
        password: "Mine@1234",
        role: "technician",
        site: neyveliId
      },
      // Compatibility aliases in case previous emails are entered
      {
        email: "manager.jharia@minetrack.demo",
        name: "K. Senthil Nathan",
        password: "Mine@1234",
        role: "site_manager",
        site: neyveliId
      },
      {
        email: "tech.jharia1@minetrack.demo",
        name: "R. Karthik",
        password: "Mine@1234",
        role: "technician",
        site: neyveliId
      }
    ];

    const createdUsers = {};

    for (const acc of accounts) {
      let user = await User.findOne({ email: acc.email });
      if (!user) {
        user = await User.create({
          name: acc.name,
          email: acc.email,
          password: acc.password, // hashed automatically by User model pre-save
          role: acc.role,
          site: acc.site,
          isActive: true
        });
        console.log(`[Init] Created demo user: ${acc.email} (${acc.role})`);
      } else {
        let changed = false;
        if (user.isActive === false) {
          user.isActive = true;
          changed = true;
        }
        if (acc.site && (!user.site || String(user.site) !== String(acc.site))) {
          user.site = acc.site;
          changed = true;
        }
        if (changed) await user.save();
      }
      createdUsers[acc.email] = user;
    }

    // 3. Ensure sample tasks for tech@example.com and tech.neyveli1@minetrack.demo
    const techUsers = [createdUsers["tech@example.com"], createdUsers["tech.neyveli1@minetrack.demo"]].filter(Boolean);
    for (const tech of techUsers) {
      const taskCount = await MaintenanceRecord.countDocuments({ assignedTo: tech._id });
      if (taskCount === 0 && neyveliId) {
        const eq = await Equipment.findOne({ site: neyveliId }) || (await Equipment.findOne());
        if (eq) {
          const now = Date.now();
          const DAY = 24 * 60 * 60 * 1000;
          await MaintenanceRecord.create([
            {
              targetType: "Equipment",
              targetId: eq._id,
              category: "Service",
              description: `Pre-Shift Inspection & Pressure Check (${eq.name})`,
              serviceDate: new Date(now),
              nextDueDate: new Date(now + 2 * DAY),
              status: "Open",
              assignedTo: tech._id,
              cost: 4500
            },
            {
              targetType: "Equipment",
              targetId: eq._id,
              category: "Service",
              description: `Brake & Wheel Torque Inspection (${eq.name})`,
              serviceDate: new Date(now - 4 * DAY),
              nextDueDate: new Date(now - 1 * DAY), // due in past -> frontend computes status as Overdue!
              status: "Open",
              assignedTo: tech._id,
              cost: 15000
            },
            {
              targetType: "Equipment",
              targetId: eq._id,
              category: "Service",
              description: `Greasing & Wheel Hub Lubrication (${eq.name})`,
              serviceDate: new Date(now - 7 * DAY),
              nextDueDate: new Date(now - 3 * DAY),
              status: "Completed",
              assignedTo: tech._id,
              completedBy: tech._id,
              completedAt: new Date(now - 2 * DAY),
              note: "Completed routine wheel hub lubrication and bearing check. All clear.",
              cost: 4000
            }
          ]);
        }
      }
    }

    console.log("[Init] All South Indian demo accounts verified and ready.");
  } catch (err) {
    console.error("[Init] Error in ensureDemoAccounts:", err);
  }
}

module.exports = ensureDemoAccounts;
