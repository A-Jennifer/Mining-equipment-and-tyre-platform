import { useState } from "react";
import api from "../api/axios";

// In a real deployment this field would be filled by a camera-based QR
// scanner (e.g. the html5-qrcode library). For this project, scanning is
// simulated by typing/pasting the code printed on the equipment/tyre's
// QR label, which keeps the demo simple and dependency-free.
export default function QRLookup() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [resultType, setResultType] = useState(null);
  const [error, setError] = useState("");

  const handleLookup = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    // Try equipment first, then tyre
    try {
      const res = await api.get(`/equipment/qr/${code}`);
      setResult(res.data);
      setResultType("Equipment");
      return;
    } catch (_) {
      // not found as equipment, try tyre next
    }

    try {
      const res = await api.get(`/tyres/qr/${code}`);
      setResult(res.data);
      setResultType("Tyre");
    } catch (err) {
      setError("No equipment or tyre found for this code.");
    }
  };

  return (
    <div className="page">
      <h2>QR Code Lookup</h2>
      <p>Scan or type the code printed on an equipment/tyre QR label to instantly view its record.</p>

      <form className="inline-form" onSubmit={handleLookup}>
        <input placeholder="Enter QR code, e.g. EQ-AB12CD" value={code} onChange={(e) => setCode(e.target.value)} required />
        <button type="submit">Lookup</button>
      </form>

      {error && <p className="error-text">{error}</p>}

      {result && resultType === "Equipment" && (
        <div className="lookup-result">
          <h3>Equipment: {result.name}</h3>
          <p>Type: {result.type}</p>
          <p>Site: {result.site?.name}</p>
          <p>Status: <span className={`badge status-${result.status.replace(/\s/g, "-")}`}>{result.status}</span></p>
          <p>Total Usage Hours: {result.totalUsageHours}</p>
        </div>
      )}

      {result && resultType === "Tyre" && (
        <div className="lookup-result">
          <h3>Tyre: {result.tyreCode}</h3>
          <p>Brand: {result.brand}</p>
          <p>Mounted On: {result.equipment?.name}</p>
          <p>Position: {result.position}</p>
          <p>Usage: {result.usageHours} / {result.wearThresholdHours} hrs</p>
          <p>Status: <span className={`badge status-${result.status.replace(/\s/g, "-")}`}>{result.status}</span></p>
        </div>
      )}
    </div>
  );
}
