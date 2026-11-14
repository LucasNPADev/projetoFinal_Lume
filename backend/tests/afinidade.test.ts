import { buscarAfinidadeArea, normalizarAreaAfinidade } from "../src/utils/afinidade";

describe("Afinidade Utility", () => {
  it("normalizes accent, case, punctuation, and repeated whitespace", () => {
    expect(
      normalizarAreaAfinidade("  Negócios  &   Finanças "),
    ).toBe(normalizarAreaAfinidade("negocios e financas"));
  });

  it("returns the affinity percentage for equivalent area labels", () => {
    expect(
      buscarAfinidadeArea(
        [{ area: "Saúde / Bem-estar", percentual: 25 }],
        "saude bem estar",
      ),
    ).toBe(25);
  });

  it("matches quiz categories to the career areas used in the catalog", () => {
    const equivalencias = [
      ["Ciências Jurídicas / Humanas", "Direito"],
      ["Comunicação e Artes", "Comunicação"],
      ["Negócios e Gestão", "Negócios"],
    ];

    for (const [tema, area] of equivalencias) {
      expect(
        buscarAfinidadeArea([{ area: tema, percentual: 42 }], area),
      ).toBe(42);
    }
  });

  it("adds legacy percentages grouped under equivalent labels", () => {
    expect(
      buscarAfinidadeArea(
        [
          { area: "Negócios", percentual: 20 },
          { area: "NEGOCIOS!", percentual: 30 },
        ],
        "negocios",
      ),
    ).toBe(50);
  });

  it("returns null when the career area has no quiz affinity category", () => {
    expect(
      buscarAfinidadeArea([{ area: "Saúde", percentual: 100 }], "Direito"),
    ).toBeNull();
  });
});
