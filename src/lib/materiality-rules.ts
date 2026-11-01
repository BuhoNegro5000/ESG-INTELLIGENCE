/**
 * Double materiality decision rules.
 *
 * The two axes are independent by design. There is no blended ESG score and no
 * averaging that could hide a severe impact behind a low financial score.
 * This module is the single source of truth for the thresholds used by the
 * server (persistence) and the client (live preview in the IRO drawer).
 */

export const IMPACT_THRESHOLD = 3.2;
export const FINANCIAL_THRESHOLD = 3.2;
export const CRITICAL_THRESHOLD = 4.4;

export type MaterialityClass = 'both' | 'impact' | 'financial' | 'not';

/**
 * Classify an IRO from its two independent scores.
 * A topic is material on an axis when its score is greater than or equal to
 * that axis' threshold. The classification never combines the axes.
 */
export function materialityFrom(
  impact: number,
  financial: number,
  impactThreshold = IMPACT_THRESHOLD,
  financialThreshold = FINANCIAL_THRESHOLD,
): MaterialityClass {
  const materialImpact = impact >= impactThreshold;
  const materialFinancial = financial >= financialThreshold;
  if (materialImpact && materialFinancial) return 'both';
  if (materialImpact) return 'impact';
  if (materialFinancial) return 'financial';
  return 'not';
}

/**
 * Severity flag used to prioritise review. Being rights-related is a separate
 * prioritisation signal handled by the register; it is not folded into the
 * score, and it does not silently rewrite the stored critical flag.
 */
export function scoreIsCritical(
  impact: number,
  financial: number,
  threshold = CRITICAL_THRESHOLD,
): boolean {
  return impact >= threshold || financial >= threshold;
}
