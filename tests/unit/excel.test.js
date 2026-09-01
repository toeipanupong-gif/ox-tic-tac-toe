import { describe, expect, it } from "vitest";
import { buildSpreadsheetXml } from "../../src/lib/excel.js";

describe("excel", () => {
  it("builds spreadsheet xml with headers and rows", () => {
    const xml = buildSpreadsheetXml(
      "Players",
      ["Player", "Email", "Score"],
      [["P***g", "p***@e***.com", 10]]
    );
    expect(xml).toContain('ss:Name="Players"');
    expect(xml).toContain("Player");
    expect(xml).toContain("p***@e***.com");
    expect(xml).toContain('ss:Type="Number">10</Data>');
  });
});
