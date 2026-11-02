const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema(
  {
    actor: { type: String, required: true },       // user's name
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: { type: String },
    action: { type: String, required: true },       // e.g. "Request raised"
    detail: { type: String },                       // e.g. tyre code / job title
    entity: { type: String },                       // "tyre" | "maintenance" | "user" | "equipment"
    entityId: { type: mongoose.Schema.Types.ObjectId },
    site: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditSchema);
