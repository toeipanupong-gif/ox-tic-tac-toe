import { describe, expect, it } from "vitest";
import { buildSpreadsheetXml, buildXlsxBuffer } from "../../src/lib/excel.js";

describe("excel", () => {
  it("builds sheet xml with headers and rows", () => {
    const xml = buildSpreadsheetXml(
      "Players",
      ["Player", "Email", "Score"],
      [["P***g", "p***@e***.com", 10]]
    );
    expect(xml).toContain("inlineStr");
    expect(xml).toContain("Player");
    expect(xml).toContain("p***@e***.com");
    expect(xml).toContain("<v>10</v>");
  });

  it("builds a real xlsx zip starting with PK", () => {
    const buf = buildXlsxBuffer(
      "Players",
      ["Player", "Email", "Score"],
      [["P***g", "p***@e***.com", 10]]
    );
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf[0]).toBe(0x50); // P
    expect(buf[1]).toBe(0x4b); // K
    expect(buf.includes(Buffer.from("xl/worksheets/sheet1.xml"))).toBe(true);
  });
});
