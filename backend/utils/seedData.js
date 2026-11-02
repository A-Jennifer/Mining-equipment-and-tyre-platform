/**
 * Sample data for the demo / final submission.
 *
 * Uses real equipment models, real mining-tyre brands and sizes, and real
 * South Indian mining basins (Tamil Nadu, Telangana, Karnataka).
 *
 * This file only builds plain objects (no database calls) so it can be tested alone.
 */
const PASSWORD = "Mine@1234";

const sites = [
  { key: "neyveli", name: "Neyveli OCP", location: "Cuddalore, Tamil Nadu" },
  { key: "kothagudem", name: "Kothagudem OCP", location: "Bhadradri Kothagudem, Telangana" },
  { key: "donimalai", name: "Donimalai OCP", location: "Ballari, Karnataka" }
];

const users = [
  // Realistic South Indian demo accounts
  { key: "admin", name: "Meera Iyer", email: "admin@minetrack.demo", role: "admin" },
  { key: "mgr-neyveli", name: "K. Senthil Nathan", email: "manager.neyveli@minetrack.demo", role: "site_manager", site: "neyveli" },
  { key: "mgr-kothagudem", name: "Venkata Rao", email: "manager.kothagudem@minetrack.demo", role: "site_manager", site: "kothagudem" },
  { key: "mgr-donimalai", name: "Basavaraj Patil", email: "manager.donimalai@minetrack.demo", role: "site_manager", site: "donimalai" },
  { key: "tech-neyveli-1", name: "R. Karthik", email: "tech.neyveli1@minetrack.demo", role: "technician", site: "neyveli" },
  { key: "tech-neyveli-2", name: "M. Saravanan", email: "tech.neyveli2@minetrack.demo", role: "technician", site: "neyveli" },
  { key: "tech-kothagudem-1", name: "P. Srinivas", email: "tech.kothagudem1@minetrack.demo", role: "technician", site: "kothagudem" },
  { key: "tech-kothagudem-2", name: "T. Anjaneyulu", email: "tech.kothagudem2@minetrack.demo", role: "technician", site: "kothagudem" },
  { key: "tech-donimalai-1", name: "Manjunath Gowda", email: "tech.donimalai1@minetrack.demo", role: "technician", site: "donimalai" },
  { key: "tech-donimalai-2", name: "Mallikarjun Swamy", email: "tech.donimalai2@minetrack.demo", role: "technician", site: "donimalai" },
  // Original legacy demo accounts (password: password123)
  { key: "legacy-admin", name: "System Admin (Demo)", email: "admin@example.com", role: "admin", password: "password123" },
  { key: "legacy-mgr", name: "Site Manager (Demo)", email: "manager@example.com", role: "site_manager", site: "neyveli", password: "password123" },
  { key: "legacy-tech", name: "Technician (Demo)", email: "tech@example.com", role: "technician", site: "neyveli", password: "password123" }
];

// ---------------------------------------------------------------- equipment
const equipment = [
  { key: "HT-101", qr: "EQ-1001", site: "neyveli", model: "Caterpillar 793F", type: "Dump Truck", status: "Active", hours: 14820, purchased: 2019, spec: "793F" },
  { key: "HT-102", qr: "EQ-1002", site: "neyveli", model: "Caterpillar 793F", type: "Dump Truck", status: "Active", hours: 11260, purchased: 2021, spec: "793F" },
  { key: "WL-201", qr: "EQ-1003", site: "neyveli", model: "Caterpillar 980M", type: "Loader", status: "Active", hours: 9480, purchased: 2020, spec: "980M" },
  { key: "EX-301", qr: "EQ-1004", site: "neyveli", model: "Komatsu PC2000-8", type: "Excavator", status: "Under Repair", hours: 17300, purchased: 2018 },

  { key: "HT-111", qr: "EQ-2001", site: "kothagudem", model: "Komatsu HD785-7", type: "Dump Truck", status: "Active", hours: 16940, purchased: 2018, spec: "HD785-7" },
  { key: "HT-112", qr: "EQ-2002", site: "kothagudem", model: "Komatsu HD785-7", type: "Dump Truck", status: "Under Repair", hours: 13150, purchased: 2020, spec: "HD785-7" },
  { key: "WL-211", qr: "EQ-2003", site: "kothagudem", model: "Caterpillar 980M", type: "Loader", status: "Idle", hours: 7210, purchased: 2022, spec: "980M" },
  { key: "EX-311", qr: "EQ-2004", site: "kothagudem", model: "Hitachi EX1900-6", type: "Excavator", status: "Active", hours: 12700, purchased: 2019 },

  { key: "HT-121", qr: "EQ-3001", site: "donimalai", model: "Caterpillar 777G", type: "Dump Truck", status: "Active", hours: 18030, purchased: 2017, spec: "777G" },
  { key: "HT-122", qr: "EQ-3002", site: "donimalai", model: "Caterpillar 777G", type: "Dump Truck", status: "Active", hours: 9870, purchased: 2021, spec: "777G" },
  { key: "WL-221", qr: "EQ-3003", site: "donimalai", model: "Caterpillar 980M", type: "Loader", status: "Active", hours: 7640, purchased: 2022, spec: "980M" },
  { key: "EX-321", qr: "EQ-3004", site: "donimalai", model: "Komatsu PC2000-8", type: "Excavator", status: "Active", hours: 10420, purchased: 2020 }
];

// ------------------------------------------------------------- tyre specs
const SIX = ["Front-Left", "Front-Right", "Rear-Left", "Rear-Left-Inner", "Rear-Right", "Rear-Right-Inner"];
const FOUR = ["Front-Left", "Front-Right", "Rear-Left", "Rear-Right"];

const TYRE_SPECS = {
  "793F": { size: "40.00R57", threshold: 5500, positions: SIX, brands: [{ brand: "Bridgestone VSDL", cost: 1850000 }, { brand: "Michelin XDR2", cost: 1920000 }] },
  "HD785-7": { size: "27.00R49", threshold: 5000, positions: SIX, brands: [{ brand: "Goodyear RL-5K", cost: 940000 }, { brand: "Michelin XDR2", cost: 985000 }] },
  "777G": { size: "27.00R49", threshold: 5000, positions: SIX, brands: [{ brand: "Bridgestone VSDL", cost: 960000 }, { brand: "Goodyear RL-5K", cost: 940000 }] },
  "980M": { size: "29.5R25", threshold: 3800, positions: FOUR, brands: [{ brand: "Michelin XLD D2", cost: 640000 }, { brand: "Goodyear RL-4B", cost: 585000 }] }
};

// Hand-picked tyres that drive the technician -> manager approval workflow.
const SPECIAL = {
  // worn tyres with no request yet (a technician can raise one)
  "WL-201|Front-Left": { ratio: 0.92 },
  "HT-111|Front-Left": { ratio: 0.91 },
  "HT-122|Rear-Right": { ratio: 0.94 },

  "HT-101|Front-Left": { ratio: 0.96, request: { status: "Pending", by: "tech-neyveli-1", daysAgo: 1, reason: "Cuts on the shoulder and tread down to the wear bars at the last inspection." } },
  "HT-102|Rear-Left": { ratio: 0.88, request: { status: "Rejected", by: "tech-neyveli-2", daysAgo: 9, reason: "Sidewall bruise noticed during the pre-shift check.", reviewedBy: "mgr-neyveli", note: "Bruise is superficial. Re-check after the next 300 hours." } },
  "HT-111|Rear-Right": { ratio: 0.93, request: { status: "Pending", by: "tech-kothagudem-1", daysAgo: 2, reason: "Uneven wear on the outer edge, running hot on the long haul." } },
  "HT-112|Front-Left": { ratio: 1.02, replaced: true, request: { status: "Completed", by: "tech-kothagudem-2", daysAgo: 12, reason: "Tread worn out, cord visible near the centre rib.", reviewedBy: "mgr-kothagudem", note: "Approved. Schedule it in the Sunday shutdown.", taskKey: "replace-HT-112" } },
  "HT-121|Front-Right": { ratio: 0.97, request: { status: "Approved", by: "tech-donimalai-1", daysAgo: 3, reason: "Deep cut near the bead area.", reviewedBy: "mgr-donimalai", note: "Approved. Replace before the next shift cycle.", taskKey: "replace-HT-121" } }
};

// small deterministic random generator so the sample data is the same every run
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildTyres() {
  const rand = mulberry32(2026);
  const tyres = [];
  let counter = 4001;

  equipment.filter((e) => e.spec).forEach((eq) => {
    const spec = TYRE_SPECS[eq.spec];
    spec.positions.forEach((position, i) => {
      const special = SPECIAL[`${eq.key}|${position}`];
      const option = spec.brands[(i + eq.hours) % spec.brands.length];
      const ratio = special ? special.ratio : 0.12 + rand() * 0.8; // 12% .. 92% worn
      const usageHours = Math.round((spec.threshold * ratio) / 10) * 10;
      tyres.push({
        code: `TY-${counter++}`,
        eq: eq.key,
        position,
        brand: option.brand,
        size: spec.size,
        cost: option.cost,
        threshold: spec.threshold,
        usageHours,
        installDaysAgo: Math.round(usageHours / 17), // ~17 running hours per day
        replaced: Boolean(special && special.replaced),
        request: (special && special.request) || null
      });
    });
  });
  return tyres;
}

const tyres = buildTyres();
const tyreCode = (eq, position) => tyres.find((t) => t.eq === eq && t.position === position).code;

// ------------------------------------------------------------ work orders
// dueDays: negative = already past due. completedDaysAgo only for finished jobs.
const tasks = [
  // Neyveli OCP (Tamil Nadu)
  { key: "t1", target: { equipment: "HT-101" }, title: "Engine oil & filter service", by: "mgr-neyveli", to: "tech-neyveli-1", dueDays: 6, cost: 38000 },
  { key: "t2", target: { equipment: "HT-102" }, title: "Brake inspection", by: "mgr-neyveli", to: "tech-neyveli-2", dueDays: -3, cost: 15000 },
  { key: "t3", target: { equipment: "EX-301" }, title: "Hydraulic system inspection", by: "mgr-neyveli", to: "tech-neyveli-1", dueDays: 11, cost: 22500 },
  { key: "t4", target: { equipment: "WL-201" }, title: "Tyre rotation & pressure check", by: "mgr-neyveli", to: "tech-neyveli-2", dueDays: 2, cost: 6500 },
  { key: "t5", target: { equipment: "HT-101" }, title: "Greasing & lubrication", by: "mgr-neyveli", to: "tech-neyveli-1", dueDays: -6, completedDaysAgo: 5, note: "All grease points serviced, no leaks found.", cost: 4000 },
  { key: "t6", target: { equipment: "HT-102" }, title: "Coolant system flush", by: "mgr-neyveli", to: "tech-neyveli-2", dueDays: -17, completedDaysAgo: 18, note: "Coolant replaced, hoses checked.", cost: 12500 },

  // Kothagudem OCP (Telangana)
  { key: "t7", target: { equipment: "HT-111" }, title: "Brake inspection", by: "mgr-kothagudem", to: "tech-kothagudem-1", dueDays: 4, cost: 15000 },
  { key: "t8", target: { equipment: "HT-112" }, title: "Transmission oil sample", by: "mgr-kothagudem", to: "tech-kothagudem-2", dueDays: -5, cost: 9000 },
  { key: "t9", target: { equipment: "EX-311" }, title: "Greasing & lubrication", by: "mgr-kothagudem", to: "tech-kothagudem-1", dueDays: -10, completedDaysAgo: 9, note: "Boom and stick pins greased.", cost: 4500 },
  { key: "replace-HT-112", target: { tyre: "HT-112|Front-Left" }, category: "Tyre replacement", by: "mgr-kothagudem", to: "tech-kothagudem-2", dueDays: -7, completedDaysAgo: 6, note: "New Goodyear RL-5K fitted, wheel nuts torqued and rechecked.", cost: 18000 },

  // Donimalai OCP (Karnataka)
  { key: "replace-HT-121", target: { tyre: "HT-121|Front-Right" }, category: "Tyre replacement", by: "mgr-donimalai", to: "tech-donimalai-1", dueDays: 2, cost: 18000 },
  { key: "t10", target: { equipment: "HT-122" }, title: "Engine oil & filter service", by: "mgr-donimalai", to: "tech-donimalai-2", dueDays: 9, cost: 38000 },
  { key: "t11", target: { equipment: "EX-321" }, title: "Swing bearing inspection", by: "mgr-donimalai", to: "tech-donimalai-2", dueDays: -2, cost: 18000 },
  { key: "t12", target: { equipment: "HT-121" }, title: "Tyre pressure & tread inspection", by: "mgr-donimalai", to: "tech-donimalai-2", dueDays: -5, completedDaysAgo: 4, note: "Front-right tyre has a deep cut, request raised.", cost: 3000 }
].map((t) => ({
  ...t,
  category: t.category || "Service",
  title: t.title || `Replace tyre ${tyreCode(...t.target.tyre.split("|"))}`
}));

module.exports = { PASSWORD, sites, users, equipment, tyres, tasks };