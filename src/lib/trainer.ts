import { Forecast, Scenario, rowIndex } from "./scenarios";

export const START_VALUE = 100_000;
// Forecasts within ±3% count as "about the same".
const FLAT_BAND = 0.03;

export interface Decision {
  allocation: number; // % in the index, rest in cash earning the policy rate
  forecast: Forecast;
  confidence: number; // 50–95
  rationale: string;
  trigger: string; // "what would change my mind"
  reply: string; // answer to the coach's question
  revisedFrom: number | null; // allocation before the coach challenge, if changed
  coachRules: string[];
}

export interface Signals {
  index: number;
  drawdown: number; // fraction below running peak, ≤ 0
  return12m: number | null;
  sinceLast: number | null;
  cape: number | null;
  unemployment: number | null;
  fedFunds: number | null;
  yieldCurve: number | null;
}

export function signalsAt(s: Scenario, cp: number): Signals {
  const k = rowIndex(s, s.checkpoints[cp].date);
  const rows = s.rows;
  const peak = Math.max(...rows.slice(0, k + 1).map((r) => r.index));
  const r = rows[k];
  const prevK = cp > 0 ? rowIndex(s, s.checkpoints[cp - 1].date) : null;
  return {
    index: r.index,
    drawdown: r.index / peak - 1,
    return12m: k >= 12 ? r.index / rows[k - 12].index - 1 : null,
    sinceLast: prevK === null ? null : r.index / rows[prevK].index - 1,
    cape: r.cape,
    unemployment: r.unemployment,
    fedFunds: r.fedFunds,
    yieldCurve: r.yieldCurve,
  };
}

/** Row index at which checkpoint cp's forecast resolves. */
export function horizonEnd(s: Scenario, cp: number) {
  const k = rowIndex(s, s.checkpoints[cp].date);
  if (cp + 1 < s.checkpoints.length) return rowIndex(s, s.checkpoints[cp + 1].date);
  return Math.min(k + 6, s.rows.length - 1);
}

export function forecastOutcome(s: Scenario, cp: number): Forecast {
  const k = rowIndex(s, s.checkpoints[cp].date);
  const change = s.rows[horizonEnd(s, cp)].index / s.rows[k].index - 1;
  if (change > FLAT_BAND) return "higher";
  if (change < -FLAT_BAND) return "lower";
  return "flat";
}

/**
 * Portfolio value from the first checkpoint to `untilRow`, with each
 * checkpoint's allocation held until the next one. Cash earns the policy rate.
 */
export function simulate(s: Scenario, allocations: number[], untilRow = s.rows.length - 1) {
  const start = rowIndex(s, s.checkpoints[0].date);
  const cpRows = s.checkpoints.map((c) => rowIndex(s, c.date));
  const path: { row: number; value: number }[] = [{ row: start, value: START_VALUE }];
  let value = START_VALUE;
  for (let t = start; t < untilRow; t++) {
    let cp = 0;
    while (cp + 1 < cpRows.length && cpRows[cp + 1] <= t) cp++;
    const w = (allocations[Math.min(cp, allocations.length - 1)] ?? s.startAllocation) / 100;
    const cash = (s.rows[t].fedFunds ?? 0) / 1200;
    value *= w * (s.rows[t + 1].index / s.rows[t].index) + (1 - w) * (1 + cash);
    path.push({ row: t + 1, value });
  }
  return path;
}

// ---------------------------------------------------------------------------
// Coach: deterministic rules. Each one fires on observable data and asks a
// question. None of them recommends an allocation.

export interface CoachPrompt {
  id: string;
  name: string;
  question: string;
  why: string;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const EVIDENCE = /cape|valuation|unemploy|job|rate|central bank|fed|yield|curve|drawdown|peak|earnings|inflation|\d/i;

export function hasEvidence(text: string) {
  return EVIDENCE.test(text);
}

export function isMeasurable(trigger: string) {
  return /\d/.test(trigger);
}

export function coachPrompts(
  sig: Signals,
  prevAllocation: number,
  d: Pick<Decision, "allocation" | "confidence" | "rationale" | "trigger" | "forecast">,
): CoachPrompt[] {
  const delta = d.allocation - prevAllocation;
  const out: CoachPrompt[] = [];

  if (delta <= -30 && sig.drawdown <= -0.2) {
    out.push({
      id: "capitulation",
      name: "Capitulation check",
      question: `You're cutting equity by ${-delta} points after a ${pct(-sig.drawdown)} fall. If you were holding cash today, would you choose to buy ${d.allocation}% at these prices, or ${prevAllocation}%? What exactly will get you back in?`,
      why: `Rule: allocation cut ≥ 30 pts while the index is ≥ 20% below its peak (now ${pct(sig.drawdown)}). Loss aversion pushes people to sell after losses have already happened.`,
    });
  }
  if (delta >= 20 && sig.return12m !== null && sig.return12m >= 0.2) {
    out.push({
      id: "chasing",
      name: "Chasing check",
      question: `The index is up ${pct(sig.return12m)} in 12 months and you're adding ${delta} points. Is that based on what the asset is worth, or on how it has moved? What does the valuation number tell you?`,
      why: `Rule: allocation raised ≥ 20 pts after a ≥ 20% 12-month gain (${pct(sig.return12m)}). Recent returns are a weak guide to future returns.`,
    });
  }
  if (delta >= 20 && sig.drawdown <= -0.2) {
    out.push({
      id: "falling-knife",
      name: "Sizing check",
      question: `You're adding ${delta} points while the index is ${pct(-sig.drawdown)} below its peak. If it falls another 30% from here, what would you do, and would you be able to stick to it?`,
      why: `Rule: allocation raised ≥ 20 pts during a drawdown of ≥ 20%. Buying cheaper can be sound; the question is whether the position survives being early.`,
    });
  }
  if (Math.abs(delta) < 10 && Math.abs(sig.sinceLast ?? 0) >= 0.2) {
    out.push({
      id: "status-quo",
      name: "Status-quo check",
      question: `The index moved ${pct(sig.sinceLast!)} since your last decision and you're barely changing anything. Is holding an active choice here, or a default? What would make you act?`,
      why: `Rule: allocation change < 10 pts after a ≥ 20% move since the last checkpoint. Not acting is also a decision.`,
    });
  }
  if (d.confidence >= 85) {
    out.push({
      id: "overconfidence",
      name: "Overconfidence check",
      question: `You're ${d.confidence}% sure the index will be ${d.forecast === "flat" ? "about the same" : d.forecast} at the next checkpoint. What is the strongest argument for the opposite, and what would the data show if you were wrong?`,
      why: `Rule: confidence ≥ 85%. Short-horizon market forecasts are rarely right this often, even for professionals.`,
    });
  }
  if (!hasEvidence(d.rationale)) {
    out.push({
      id: "evidence",
      name: "Evidence check",
      question: "Your reasoning doesn't refer to anything on the dashboard. Which number, such as valuation, unemployment, rates or drawdown, does this decision depend on?",
      why: "Rule: rationale mentions no signal or number. Decisions tied to evidence are easier to review and learn from.",
    });
  }
  if (!isMeasurable(d.trigger)) {
    out.push({
      id: "vague-trigger",
      name: "Vague-trigger check",
      question: `"${d.trigger.trim() || "(nothing written)"}": how will you know when that has happened? Name a number you could check on the dashboard.`,
      why: "Rule: the 'what would change my mind' condition has no measurable threshold. A vague exit plan usually becomes an emotional one.",
    });
  }
  if (out.length === 0) {
    out.push({
      id: "pre-mortem",
      name: "Pre-mortem",
      question: "Imagine it's the next checkpoint and this decision turned out badly. What is the most likely reason?",
      why: "Rule: no bias flags fired, so the coach asks for a pre-mortem. Picturing failure in advance surfaces risks you've under-weighted.",
    });
  }
  // Two questions at most, so the challenge stays focused.
  return out.slice(0, 2);
}

// ---------------------------------------------------------------------------
// Debrief scoring: process first, outcome second.

export interface ProcessScore {
  evidence: number;
  triggers: number;
  engagement: number;
  hitRate: number;
  avgConfidence: number;
  calibrationGap: number; // avg confidence minus hit rate, in points
  total: number;
  label: "strong" | "developing" | "needs_work";
}

export function scoreProcess(s: Scenario, decisions: Decision[]): ProcessScore {
  const n = decisions.length;
  const share = (f: (d: Decision, i: number) => boolean) =>
    Math.round((decisions.filter(f).length / n) * 100);
  const evidence = share((d) => hasEvidence(d.rationale));
  const triggers = share((d) => isMeasurable(d.trigger));
  const engagement = share((d) => d.revisedFrom !== null || d.reply.trim().length >= 15);
  const hitRate = share((d, i) => d.forecast === forecastOutcome(s, i));
  const avgConfidence = Math.round(decisions.reduce((a, d) => a + d.confidence, 0) / n);
  const calibrationGap = avgConfidence - hitRate;
  const calibration = Math.max(0, 100 - Math.abs(calibrationGap) * 2);
  const total = Math.round(evidence * 0.3 + triggers * 0.3 + engagement * 0.2 + calibration * 0.2);
  return {
    evidence,
    triggers,
    engagement,
    hitRate,
    avgConfidence,
    calibrationGap,
    total,
    label: total >= 75 ? "strong" : total >= 50 ? "developing" : "needs_work",
  };
}
