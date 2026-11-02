/* ---------------------------------------------------------------------------
   Roles: ONE place that says who can see and do what.
   (The backend enforces the same rules on the server; this file only decides
   what the screen shows.)
--------------------------------------------------------------------------- */

export const ROLE_LABEL = {
  admin: "Administrator",
  site_manager: "Site Manager",
  technician: "Technician"
};

// first screen each role lands on
export const HOME = { admin: "Overview", site_manager: "Overview", technician: "My Tasks" };

// sidebar menu for each role
export const NAV = {
  admin: {
    workspace: ["Overview", "Equipment", "Tyres", "Maintenance", "Approvals", "Analytics", "Sites", "Users", "Audit Log"],
    tools: ["Mine Map", "QR Lookup", "Live Sensors", "Assistant"]
  },
  site_manager: {
    workspace: ["Overview", "Equipment", "Tyres", "Maintenance", "Approvals", "Analytics"],
    tools: ["Mine Map", "QR Lookup", "Live Sensors", "Assistant"]
  },
  technician: {
    workspace: ["My Tasks", "Equipment", "Tyres"],
    tools: ["Mine Map", "QR Lookup", "Live Sensors"]
  }
};

export const ROLE_HERO = {
  admin: {
    kicker: "SYSTEM ADMINISTRATION",
    title: "Run every site from one place.",
    text: "Manage people and sites, and keep an eye on the whole fleet across all mines."
  },
  site_manager: {
    kicker: "SITE OPERATIONS",
    title: "Keep your site moving.",
    text: "Review tyre requests, assign work to your technicians and watch your site's fleet."
  },
  technician: {
    kicker: "FIELD WORK",
    title: "Your jobs for today.",
    text: "See the work assigned to you, log readings and flag worn tyres."
  }
};

const PERMISSIONS = {
  addEquipment: ["admin", "site_manager"],
  addTyre: ["admin", "site_manager"],
  assignTask: ["admin", "site_manager"],
  reviewRequests: ["admin", "site_manager"],
  requestReplacement: ["technician"],
  seeCosts: ["admin", "site_manager"],
  deleteRecords: ["admin"],
  switchSites: ["admin"]
};

export const can = (role, action) => (PERMISSIONS[action] || []).includes(role);