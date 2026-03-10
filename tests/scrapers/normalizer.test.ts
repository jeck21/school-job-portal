import { describe, it, expect } from "vitest";
import { parseLocation, normalizeSchoolType } from "../../scripts/scrapers/lib/normalizer";

describe("parseLocation", () => {
  it('parses "Philadelphia, PA 19102" into city, state, zip', () => {
    const result = parseLocation("Philadelphia, PA 19102");
    expect(result).toEqual({
      city: "Philadelphia",
      state: "PA",
      zipCode: "19102",
    });
  });

  it('parses "Pittsburgh, PA" into city and state only', () => {
    const result = parseLocation("Pittsburgh, PA");
    expect(result).toEqual({
      city: "Pittsburgh",
      state: "PA",
      zipCode: undefined,
    });
  });

  it('parses address with street prefix "1600 Vine St. Philadelphia, PA 19102"', () => {
    const result = parseLocation("1600 Vine St. Philadelphia, PA 19102");
    expect(result).toEqual({
      city: "Philadelphia",
      state: "PA",
      zipCode: "19102",
    });
  });

  it("returns empty object for empty string", () => {
    const result = parseLocation("");
    expect(result).toEqual({});
  });

  it("returns empty object for unparseable input", () => {
    const result = parseLocation("somewhere unknown");
    expect(result).toEqual({});
  });
});

describe("normalizeSchoolType", () => {
  it('returns "charter" for charter schools', () => {
    expect(normalizeSchoolType("Springfield Charter Academy")).toBe("charter");
  });

  it('returns "iu" for intermediate units', () => {
    expect(normalizeSchoolType("Lancaster IU 13")).toBe("iu");
  });

  it("returns null for ambiguous names", () => {
    expect(normalizeSchoolType("Central Dauphin SD")).toBeNull();
  });

  it('returns "cyber" for cyber schools', () => {
    expect(normalizeSchoolType("PA Cyber Charter School")).toBe("cyber");
  });

  it('returns "iu" for full "Intermediate Unit" text', () => {
    expect(normalizeSchoolType("Bucks County Intermediate Unit")).toBe("iu");
  });
});
