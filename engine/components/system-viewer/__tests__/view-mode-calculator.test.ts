import { describe, it, expect } from 'vitest';
import { getViewModeScaling } from "../../../src/core/mode-system/view-modes";
import { ViewMode } from "../../../src/core/mode-system/types";

describe("View Mode Scaling", () => {
  describe("getViewModeScaling", () => {
    it("should return correct scaling values for realistic view", () => {
      const scaling = getViewModeScaling("realistic");
      
      expect(scaling).toBeDefined();
      expect(scaling.ORBITAL_SCALE).toBeGreaterThan(0);
      expect(scaling.STAR_SCALE).toBeGreaterThan(0);
      expect(scaling.PLANET_SCALE).toBeGreaterThan(0);
      expect(scaling.MOON_SCALE).toBeGreaterThan(0);
    });

    it("should return correct scaling values for navigational view", () => {
      const scaling = getViewModeScaling("navigational");
      
      expect(scaling).toBeDefined();
      expect(scaling.ORBITAL_SCALE).toBeGreaterThan(0);
      expect(scaling.STAR_SCALE).toBeGreaterThan(0);
      expect(scaling.PLANET_SCALE).toBeGreaterThan(0);
      expect(scaling.MOON_SCALE).toBeGreaterThan(0);
    });

    it("should return correct scaling values for profile view", () => {
      const scaling = getViewModeScaling("profile");
      
      expect(scaling).toBeDefined();
      expect(scaling.ORBITAL_SCALE).toBeGreaterThan(0);
      expect(scaling.STAR_SCALE).toBeGreaterThan(0);
      expect(scaling.PLANET_SCALE).toBeGreaterThan(0);
      expect(scaling.MOON_SCALE).toBeGreaterThan(0);
    });

    it("should maintain proper scale relationships", () => {
      const realisticScaling = getViewModeScaling("realistic");
      const navigationalScaling = getViewModeScaling("navigational");
      const profileScaling = getViewModeScaling("profile");

      // Verify scale relationships
      expect(navigationalScaling.STAR_SCALE).toBeGreaterThan(realisticScaling.STAR_SCALE);
      expect(profileScaling.STAR_SCALE).toBeGreaterThan(navigationalScaling.STAR_SCALE);
      
      expect(navigationalScaling.PLANET_SCALE).toBeGreaterThan(realisticScaling.PLANET_SCALE);
      expect(profileScaling.PLANET_SCALE).toBeGreaterThan(navigationalScaling.PLANET_SCALE);
    });

    it("should handle invalid view mode gracefully", () => {
      const scaling = getViewModeScaling("invalid" as ViewMode);
      
      // Should default to realistic scaling
      expect(scaling).toBeDefined();
      expect(scaling.ORBITAL_SCALE).toBeGreaterThan(0);
      expect(scaling.STAR_SCALE).toBeGreaterThan(0);
      expect(scaling.PLANET_SCALE).toBeGreaterThan(0);
      expect(scaling.MOON_SCALE).toBeGreaterThan(0);
    });
  });
}); 