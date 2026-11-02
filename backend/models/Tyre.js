const mongoose = require("mongoose");
const predictTyreStatus = require("../utils/predictTyreStatus");

const genCode = () => "TY-" + Math.random().toString(36).slice(2, 8).toUpperCase();

const tyreSchema = new mongoose.Schema(
  {
    tyreCode: { type: String, unique: true, default: genCode },
    brand: { type: String, required: true, trim: true }, // e.g. "Bridgestone VSDL"
    size: { type: String, trim: true }, // e.g. "40.00R57"
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment", required: true },
    position: {
      type: String,
      enum: ["Front-Left", "Front-Right", "Rear-Left", "Rear-Right", "Rear-Left-Inner", "Rear-Right-Inner", "Other"],
      default: "Other"
    },
    installDate: { type: Date, default: Date.now },
    usageHours: { type: Number, default: 0, min: 0 },
    wearThresholdHours: { type: Number, default: 5000, min: 1 },
    status: {
      type: String,
      enum: ["Good", "Monitor", "Replace Soon", "Replaced"],
      default: "Good"
    },
    cost: { type: Number, default: 0, min: 0 },
    qrCode: { type: String, unique: true, default: genCode },

    // Technician -> Site Manager approval workflow
    replacementRequest: {
      status: { type: String, enum: ["None", "Pending", "Approved", "Rejected", "Completed"], default: "None" },
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      requestedAt: { type: Date },
      reason: { type: String, trim: true },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewedAt: { type: Date },
      reviewNote: { type: String, trim: true },
      task: { type: mongoose.Schema.Types.ObjectId, ref: "MaintenanceRecord" }
    }
  },
  { timestamps: true }
);

// Auto-calculate status whenever the tyre is saved (unless it was already replaced)
tyreSchema.pre("save", function (next) {
  if (this.status !== "Replaced") {
    this.status = predictTyreStatus(this.usageHours, this.wearThresholdHours);
  }
  next();
});

module.exports = mongoose.model("Tyre", tyreSchema);