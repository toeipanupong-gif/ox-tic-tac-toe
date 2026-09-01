/** สร้าง SpreadsheetML (.xls) ที่ Excel / LibreOffice เปิดได้ โดยไม่ต้องพึ่ง library */

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cellXml(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

export function buildSpreadsheetXml(sheetName, headers, rows) {
  const safeName = escapeXml(sheetName || "Sheet1").slice(0, 31) || "Sheet1";
  const headerRow = `<Row>${headers.map((h) => cellXml(h)).join("")}</Row>`;
  const dataRows = rows
    .map((row) => `<Row>${row.map((cell) => cellXml(cell)).join("")}</Row>`)
    .join("\n");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${safeName}">
  <Table>
${headerRow}
${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function excelDownloadResponse(filename, sheetName, headers, rows) {
  const xml = buildSpreadsheetXml(sheetName, headers, rows);
  const safeFile = String(filename || "export.xls").replace(/[^\w.\-]+/g, "_");
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFile}"`,
      "Cache-Control": "no-store",
    },
  });
}
