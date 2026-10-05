// Copied from skyscribe-app/app/components/Omnibar/matcher.ts (ADR 0042
// there): the docs search uses the Omnibar's ranking so it behaves the same.
// Hand-rolled ranked substring matcher (ADR 0042 — no fuzzy-match
// dependency; CSP is strict and every real query the Omnibar needs to
// serve is a prefix or substring hit).

export const SCORE = {
  /** The candidate string starts with the term. */
  stringPrefix: 3,
  /** Some word within the candidate starts with the term. */
  wordPrefix: 2,
  /** The term appears somewhere in the candidate. */
  substring: 1,
} as const;

function scoreField(term: string, field: string): number {
  const f = field.toLowerCase();
  if (f.startsWith(term)) return SCORE.stringPrefix;
  if (f.split(/[\s/._-]+/).some((word) => word.startsWith(term))) {
    return SCORE.wordPrefix;
  }
  return f.includes(term) ? SCORE.substring : 0;
}

/**
 * Scores a query against a candidate's searchable fields.
 *
 * - Query is split on whitespace; **every** term must hit **some** field
 *   (AND). A single unmatched term disqualifies the row (returns null).
 * - The row's score is the weakest term's best-field score — so a row
 *   where every term is a strong prefix match outranks one where a term
 *   only matches as a loose substring.
 */
export function matchScore(
  query: string,
  fields: (string | undefined)[],
): number | null {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return null;

  const present = fields.filter((f): f is string => !!f);
  let weakest = Infinity;

  for (const term of terms) {
    let best = 0;
    for (const field of present) {
      best = Math.max(best, scoreField(term, field));
      if (best === SCORE.stringPrefix) break;
    }
    if (best === 0) return null;
    weakest = Math.min(weakest, best);
  }

  return weakest === Infinity ? null : weakest;
}
