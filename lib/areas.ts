// Research areas that organize the problem list (the prototype's "goals").
// Each problem lists one or more area ids in its `areas` column.

export type Area = {
  id: string;
  numeral: string;
  title: string;
  summary: string;
};

export const AREAS = [
  {
    id: "quantum-gravity",
    numeral: "I",
    title: "Quantum gravity",
    summary:
      "Reconcile general relativity with quantum theory: the microscopic structure of spacetime, the quantum description of black holes, and the ultraviolet completion of gravity.",
  },
  {
    id: "foundations",
    numeral: "II",
    title: "Foundations of quantum theory",
    summary:
      "Understand what quantum theory says about the world: measurement, nonclassicality, the emergence of classical behaviour, and the information-theoretic structure of the theory.",
  },
  {
    id: "quantum-field-theory",
    numeral: "III",
    title: "Quantum field theory and particle physics",
    summary:
      "Put quantum field theory on rigorous footing and explain the parameters of the Standard Model, from confinement and the mass gap to naturalness and the hierarchy of scales.",
  },
  {
    id: "cosmology",
    numeral: "IV",
    title: "Cosmology",
    summary:
      "Explain the initial conditions, contents and expansion history of the universe, including dark matter, dark energy and the value of the cosmological constant.",
  },
] as const satisfies readonly Area[];

export type AreaId = (typeof AREAS)[number]["id"];

export const AREA_IDS = AREAS.map((a) => a.id) as [AreaId, ...AreaId[]];

export function getArea(id: string): Area | undefined {
  return AREAS.find((a) => a.id === id);
}
