import type { Analysis, ComparisonRow } from "./types";
export function compareAnalyses(analyses: Analysis[]): {
  rows: ComparisonRow[];
  versionsDiffer: boolean;
} {
  const base = analyses[0]?.valueUsd;
  return {
    rows: analyses.map((analysis) => {
      const absoluteDifferenceUsd = analysis.valueUsd - base;
      const percentage =
        base === 0 ? NaN : (absoluteDifferenceUsd / base) * 100;
      return {
        analysis,
        absoluteDifferenceUsd,
        percentageDifference: Number.isFinite(percentage) ? percentage : null,
      };
    }),
    versionsDiffer: new Set(analyses.map((a) => a.modelVersion)).size > 1,
  };
}
