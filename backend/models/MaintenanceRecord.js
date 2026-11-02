const mongoose = require("mongoose");

// A maintenance record is a work order: created by a manager, assigned to a technician.
const maintenanceRecordSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ["Equipment", "Tyre"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "targetType" },
    category: { type: String, enum: ["Service", "Tyre replacement"], default: "Service" },
    description: { type: String, required: true, trim: true },
    serviceDate: { type: Date, default: Date.now }, // when the work order was logged
    nextDueDate: { type: Date }, // when the work is due
    status: { type: String, enum: ["Open", "Completed"], default: "Open" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completedAt: { type: Date },
    note: { type: String, trim: true },
    cost: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("MaintenanceRecord", maintenanceRecordSchema);