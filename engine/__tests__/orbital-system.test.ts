import { CelestialObject, TimelineEvent } from "../types/orbital-system";

describe("OrbitalSystem Timeline", () => {
  it("should correctly parse a celestial object with a timeline", () => {
    const earth: CelestialObject = {
      id: "earth",
      name: "Earth",
      classification: "planet",
      geometry_type: "terrestrial",
      properties: {
        mass: 1,
        radius: 6371,
        temperature: 60,
      },
      orbit: {
        parent: "sol-star",
        semi_major_axis: 1,
        eccentricity: 0.017,
        inclination: 0,
        orbital_period: 365,
      },
      timeline: [
        {
          date: "1961-04-12",
          title: "First Human Spaceflight",
          description: "Yuri Gagarin becomes the first human to journey into outer space, orbiting the Earth aboard the Vostok 1 spacecraft.",
        },
        {
          date: "1969-07-20",
          title: "First Moon Landing",
          description: "Apollo 11 lands on the Moon, with Neil Armstrong and Buzz Aldrin becoming the first humans to walk on its surface.",
        },
      ],
    };

    expect(earth).toBeDefined();
    expect(earth.timeline).toBeDefined();
    expect(earth.timeline?.length).toBe(2);

    const firstEvent = earth.timeline?.[0];
    expect(firstEvent?.date).toBe("1961-04-12");
    expect(firstEvent?.title).toBe("First Human Spaceflight");
    expect(firstEvent?.description).toBe("Yuri Gagarin becomes the first human to journey into outer space, orbiting the Earth aboard the Vostok 1 spacecraft.");
  });

  it("should handle a celestial object without a timeline", () => {
    const mars: CelestialObject = {
      id: "mars",
      name: "Mars",
      classification: "planet",
      geometry_type: "terrestrial",
      properties: {
        mass: 0.107,
        radius: 3389.5,
        temperature: 210,
      },
      orbit: {
        parent: "sol-star",
        semi_major_axis: 1.524,
        eccentricity: 0.093,
        inclination: 1.9,
        orbital_period: 687,
      },
    };

    expect(mars).toBeDefined();
    expect(mars.timeline).toBeUndefined();
  });
}); 