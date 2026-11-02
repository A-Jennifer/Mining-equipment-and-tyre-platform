/**
 * Data export utilities for Mining Equipment & Tyre Maintenance Management Platform.
 * Supports:
 *   1. CSV / Excel export (UTF-8 with BOM for automatic Excel delimiter & character set recognition)
 *   2. Formatted Printable PDF Report (Opens branded printable document ready for saving as PDF)
 */

/**
 * Clean & escape a single CSV field
 */
function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Export tabular data as a downloadable .csv file formatted for Microsoft Excel
 */
export function exportToCsv(filename, columns, rows) {
  // \uFEFF is UTF-8 Byte Order Mark (BOM) so Excel opens UTF-8 symbols and currencies properly
  const headerLine = columns.map((col) => escapeCsv(col.header)).join(",");
  const dataLines = rows.map((row) =>
    columns.map((col) => escapeCsv(col.accessor(row))).join(",")
  );

  const csvContent = "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a printable, professional PDF maintenance report window
 */
export function exportPdfReport({
  title = "Maintenance & Asset Report",
  subtitle = "Generated from STRATA Mine Fleet Management",
  siteName = "All Sites",
  stats = [],
  columns = [],
  rows = []
}) {
  const printWindow = window.open("", "_blank", "width=960,height=800");
  if (!printWindow) {
    alert("Please allow popups to generate the printable report.");
    return;
  }

  const now = new Date().toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short"
  });

  const statsHtml = stats
    .map(
      (s) => `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:12px 16px; flex:1; min-width:140px;">
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; font-weight:600;">${s.label}</div>
        <div style="font-size:22px; font-weight:700; color:#0f172a; margin-top:4px;">${s.value}</div>
        ${s.note ? `<div style="font-size:11px; color:#94a3b8; margin-top:2px;">${s.note}</div>` : ""}
      </div>
    `
    )
    .join("");

  const thHtml = columns
    .map(
      (col) =>
        `<th style="text-align:left; padding:10px 12px; background:#f1f5f9; border-bottom:2px solid #cbd5e1; font-size:12px; font-weight:600; color:#334155;">${col.header}</th>`
    )
    .join("");

  const trHtml = rows
    .map(
      (row, idx) => `
      <tr style="background:${idx % 2 === 0 ? "#ffffff" : "#f8fafc"}; border-bottom:1px solid #e2e8f0;">
        ${columns
          .map(
            (col) =>
              `<td style="padding:9px 12px; font-size:12px; color:#1e293b;">${col.accessor(row) || "—"}</td>`
          )
          .join("")}
      </tr>
    `
    )
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${siteName}</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; }
          .header-bar { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 20px; }
          .logo-text { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #0284c7; }
          .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-left: 8px; }
          .meta { font-size: 12px; color: #64748b; text-align: right; }
          .stats-grid { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background:#fffbeb; border:1px solid #fde68a; padding:10px 16px; border-radius:6px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:13px; color:#92400e;">Print or save this document as PDF using your browser's print dialog (Ctrl+P / Cmd+P).</span>
          <button onclick="window.print()" style="background:#0284c7; color:#fff; border:none; padding:8px 16px; border-radius:4px; font-weight:600; cursor:pointer;">Print / Save as PDF</button>
        </div>

        <div class="header-bar">
          <div>
            <div class="logo-text">STRATA MINING <span class="badge">${siteName}</span></div>
            <h1 style="font-size:18px; margin:6px 0 2px; font-weight:700;">${title}</h1>
            <div style="font-size:12px; color:#64748b;">${subtitle}</div>
          </div>
          <div class="meta">
            <div><strong>Generated:</strong> ${now}</div>
            <div><strong>Confidential:</strong> Internal Mining Operations</div>
          </div>
        </div>

        ${stats.length > 0 ? `<div class="stats-grid">${statsHtml}</div>` : ""}

        <table>
          <thead>
            <tr>${thHtml}</tr>
          </thead>
          <tbody>
            ${trHtml}
          </tbody>
        </table>

        <div class="footer">
          <span>MineTrack STRATA Tyre & Equipment Intelligence System</span>
          <span>Page 1 of 1 · Verified Operational Snapshot</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
