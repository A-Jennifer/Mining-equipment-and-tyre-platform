const mongoose = require("mongoose");

const genCode = () => "EQ-" + Math.random().toString(36).slice(2, 8).toUpperCase();

const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // asset tag, e.g. "HT-101"
    model: { type: String, trim: true }, // e.g. "Caterpillar 793F"
    type: {
      type: String,
      enum: ["Dump Truck", "Excavator", "Driller", "Loader", "Grader", "Other"],
      required: true
    },
    site: { type: mongoose.Schema.Types.ObjectId, ref: "Site", required: true },
    status: { type: String, enum: ["Active", "Under Repair", "Idle"], default: "Active" },
    purchaseDate: { type: Date },
    totalUsageHours: { type: Number, default: 0, min: 0 },
    qrCode: { type: String, unique: true, default: genCode }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Equipment", equipmentSchema);