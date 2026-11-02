/**
 * Rule-based predictive logic for tyre condition.
 *
 * Compares current usage hours against the tyre's wear threshold and
 * returns a status the rest of the app (API + dashboard) can rely on.
 *
 *   < 70% of threshold    -> "Good"
 *   70% - 89% of threshold -> "Monitor"
 *   >= 90% of threshold    -> "Replace Soon"   (early warning, before the limit)
 *
 * Kept in plain JavaScript (no external ML library) so the project stays
 * within the MERN / JavaScript-only stack.
 */
function predictTyreStatus(usageHours, wearThresholdHours, warningLimit = 0.7, criticalLimit = 0.9) {
  if (!wearThresholdHours || wearThresholdHours <= 0) return "Good";

  const ratio = usageHours / wearThresholdHours;

  if (ratio >= criticalLimit) return "Replace Soon";
  if (ratio >= warningLimit) return "Monitor";
  return "Good";
}

module.exports = predictTyreStatus;