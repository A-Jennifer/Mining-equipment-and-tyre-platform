const mongoose = require("mongoose");

const siteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    thresholdWarning: { type: Number, default: 70 }, // % wear for 'Monitor'
    thresholdCritical: { type: Number, default: 90 } // % wear for 'Replace Soon'
  },
  { timestamps: true }
);

module.exports = mongoose.model("Site", siteSchema);
