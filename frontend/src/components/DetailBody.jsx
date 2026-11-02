import { useState } from "react";
import { Check, Printer, Send, Trash2 } from "lucide-react";
import { Button, Input } from "./ui";
import { AssetQr, printLabel } from "./smart-features";
import TyreTimeline from "./TyreTimeline";
import { currency, fmtDate, tyreHealth } from "../lib/fleet";
import { can } from "../lib/roles";
import tyrePhoto from "../assets/mining-tyre.jpg";

function Detail({ label, value }) {
  return (
    <div>
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value}</div>
    </div>
  );
}

const requestTone = { Pending: "monitor", Approved: "good", Completed: "good", Rejected: "critical" };

/**
 * Record detail (equipment / tyre / work order).
 * What the person can DO here depends on their role:
 *   technician -> log hours, request replacement, finish their own job
 *   manager    -> log hours, finish jobs, review requests
 *   admin      -> everything, including delete
 */
export default function DetailBody({ detail, role, actions }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [asking, setAsking] = useState(false);

  async function run(fn) {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const deleteButton = can(role, "deleteRecords") && (
    <Button variant="danger" className="full mt-16" onClick={() => actions.remove(detail)}>
      <Trash2 size={15} /> Delete {detail.kind === "service" ? "record" : detail.kind}
    </Button>
  );

  /* ---------------- work order ---------------- */
  if (detail.kind === "service") {
    const open = detail.status !== "Completed";
    return (
      <div>
        <div className="detail-grid">
          <Detail label="Asset" value={detail.equipment} />
          <Detail label="Due date" value={fmtDate(detail.date, true)} />
          <Detail label="Status" value={detail.status} />
          <Detail label="Assigned to" value={detail.assignedTo} />
          <Detail label="Type" value={detail.category} />
          <Detail label="Site" value={detail.site} />
          {detail.note && <Detail label="Completion note" value={detail.note} />}
        </div>

        {open && (
          <div className="inline-action">
            <label className="field">
              Completion note (optional)
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was done?" />
            </label>
            <Button className="full mt-12" disabled={busy} onClick={() => run(() => actions.complete(detail, note))}>
              <Check size={16} /> Mark completed
            </Button>
          </div>
        )}
        {error && <p className="error-note">{error}</p>}
        {deleteButton}
      </div>
    );
  }

  /* ---------------- equipment / tyre ---------------- */
  const isTyre = detail.kind === "tyre";
  const h = isTyre ? tyreHealth(detail) : null;
  const req = isTyre ? detail.request : null;
  const canAsk = isTyre && can(role, "requestReplacement") && detail.status !== "Replaced" && ["None", "Rejected"].includes(req.status);

  return (
    <div>
      <img className="detail-image" src={isTyre ? tyrePhoto : detail.image} alt={isTyre ? "Mining tyre" : detail.type} />
      <div className="detail-grid">
        {!isTyre && (
          <>
            <Detail label="Model" value={detail.model} />
            <Detail label="Type" value={detail.type} />
            <Detail label="Usage hours" value={`${detail.hours.toLocaleString()} hrs`} />
            <Detail label="Status" value={detail.status} />
            <Detail label="Site" value={detail.site} />
          </>
        )}
        {isTyre && (
          <>
            <Detail label="Size" value={detail.size || "—"} />
            <Detail label="Mounted on" value={detail.equipment} />
            <Detail label="Position" value={detail.position} />
            <Detail label="Usage" value={`${detail.hours.toLocaleString()} / ${detail.threshold.toLocaleString()} hrs`} />
            <Detail label="Condition" value={detail.status} />
            <Detail label="Health score" value={`${h.score} / 100`} />
            <Detail label="Predicted replacement" value={h.daysLeft === 0 ? "Due now" : `In ~${h.daysLeft} days`} />
            <Detail label="Load / terrain" value={`${Math.round(h.load * 100)}% · ${h.terrain}`} />
            {detail.cost !== null && can(role, "seeCosts") && <Detail label="Purchase cost" value={currency(detail.cost)} />}
            <Detail label="Site" value={detail.site} />
          </>
        )}
      </div>

      {/* log latest reading: every role */}
      <form
        className="hours-form"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await actions.updateHours(detail, hours);
            setHours("");
          });
        }}
      >
        <label className="field">
          Log latest hour-meter reading
          <div className="row-gap mt-8">
            <Input type="number" min={detail.hours} step="1" required placeholder={`Currently ${detail.hours.toLocaleString()} hrs`} value={hours} onChange={(e) => setHours(e.target.value)} />
            <Button type="submit" disabled={busy}>Update</Button>
          </div>
        </label>
      </form>

      {/* tyre replacement request workflow */}
      {isTyre && (req.status !== "None" || canAsk || (can(role, "reviewRequests") && req.status === "Pending")) && (
        <div className="request-box">
          <div className="between">
            <div className="detail-label">Replacement request</div>
            {req.status !== "None" && <span className={`status ${requestTone[req.status] || "neutral"}`}>{req.status}</span>}
          </div>
          {req.status !== "None" && (
            <p className="request-reason">
              “{req.reason}” <span className="muted-small">— {req.by || "technician"}</span>
              {req.note && <><br /><span className="muted-small">Manager note: {req.note}</span></>}
            </p>
          )}

          {req.status === "Pending" && can(role, "reviewRequests") && (
            <Button variant="outline" className="full" onClick={() => actions.goTo("Approvals")}>Review in Approvals</Button>
          )}
          {req.status === "Pending" && !can(role, "reviewRequests") && <p className="muted-small">Waiting for your site manager to review.</p>}
          {req.status === "Approved" && <p className="muted-small">Approved. A replacement job has been assigned.</p>}

          {canAsk && !asking && (
            <Button variant="outline" className="full mt-12" onClick={() => setAsking(true)}>
              <Send size={14} /> Request replacement
            </Button>
          )}
          {canAsk && asking && (
            <div className="mt-12">
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why does this tyre need replacing?" />
              <Button className="full mt-8" disabled={busy || reason.trim().length < 3} onClick={() => run(async () => { await actions.requestReplacement(detail, reason); setAsking(false); setReason(""); })}>
                Send request to site manager
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tyre Lifecycle Timeline */}
      {isTyre && <TyreTimeline tyre={detail} />}

      {error && <p className="error-note">{error}</p>}

      <div className="qr-detail">
        <div id={`qr-${detail.id}`}><AssetQr id={detail.id} size={96} /></div>
        <div className="grow">
          <div className="detail-label">Asset QR code</div>
          <div className="detail-value">{detail.id}</div>
          <p className="muted-small mt-4">Print and attach to the asset for instant lookup.</p>
          <Button size="sm" variant="outline" className="mt-8" onClick={() => printLabel(detail.id, isTyre ? detail.brand : detail.name)}>
            <Printer size={13} /> Print label
          </Button>
        </div>
      </div>

      {deleteButton}
    </div>
  );
}