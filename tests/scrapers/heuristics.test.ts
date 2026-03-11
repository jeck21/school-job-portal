import { describe, it, expect } from "vitest";
import { checkClosedHeuristics } from "../../scripts/scrapers/freshness/heuristics";

describe("checkClosedHeuristics", () => {
  describe("closed patterns", () => {
    it("detects 'This position has been filled'", () => {
      expect(checkClosedHeuristics("This position has been filled")).toBe(
        "closed"
      );
    });

    it("detects 'No longer accepting applications'", () => {
      expect(
        checkClosedHeuristics("No longer accepting applications")
      ).toBe("closed");
    });

    it("detects 'Posting closed'", () => {
      expect(checkClosedHeuristics("Posting closed")).toBe("closed");
    });

    it("detects 'This job has expired'", () => {
      expect(checkClosedHeuristics("This job has expired")).toBe("closed");
    });

    it("detects 'Application deadline has passed'", () => {
      expect(
        checkClosedHeuristics("Application deadline has passed")
      ).toBe("closed");
    });

    it("detects closed pattern embedded in longer text", () => {
      const text =
        "Thank you for your interest. This position has been filled as of January 15.";
      expect(checkClosedHeuristics(text)).toBe("closed");
    });
  });

  describe("active patterns", () => {
    it("detects 'Apply now for this exciting opportunity'", () => {
      expect(
        checkClosedHeuristics("Apply now for this exciting opportunity")
      ).toBe("active");
    });

    it("detects 'Submit your application today'", () => {
      expect(
        checkClosedHeuristics("Submit your application today")
      ).toBe("active");
    });

    it("detects 'Accepting applications until December'", () => {
      expect(
        checkClosedHeuristics("Accepting applications until December")
      ).toBe("active");
    });
  });

  describe("ambiguous cases", () => {
    it("returns ambiguous for generic job description text", () => {
      expect(
        checkClosedHeuristics("Some generic job description text")
      ).toBe("ambiguous");
    });

    it("returns ambiguous for empty string", () => {
      expect(checkClosedHeuristics("")).toBe("ambiguous");
    });
  });

  describe("priority: closed takes precedence over active", () => {
    it("returns closed when both closed and active patterns present", () => {
      const text =
        "This position has been filled. Apply now for other opportunities.";
      expect(checkClosedHeuristics(text)).toBe("closed");
    });
  });
});
