// Mock tutor: keyword-matched concept answers plus guardrails. Static, so
// every reply is predictable and the refusal rules are inspectable.

import type { Signals } from "./trainer";

export type TutorMode = "learn" | "practice";

export interface TutorReply {
  kind: "answer" | "guardrail" | "unknown";
  text: string;
  followUp?: string; // Socratic nudge tied to the trainee's current dashboard
  rule?: string; // shown for guardrail replies
  lessonId?: string;
}

interface Topic {
  keywords: RegExp;
  answer: string;
  lessonId?: string;
  practiceNudge?: (s: Signals) => string | null;
}

const TOPICS: Topic[] = [
  {
    keywords: /\bcape\b|shiller|p\/?e|price.to.earnings|valuation/i,
    answer:
      "CAPE is the index price divided by the average of the last 10 years of inflation-adjusted earnings. The long-run U.S. average is around 17. A high CAPE has historically meant lower average returns over the next decade, but it's a poor short-term timing tool.",
    lessonId: "valuation",
    practiceNudge: (s) =>
      s.cape === null ? null : `Your dashboard shows a CAPE of ${s.cape.toFixed(1)}. How does that compare with 17, and over what horizon would that matter to you?`,
  },
  {
    keywords: /draw.?down|from peak|bear market|correction/i,
    answer:
      "A drawdown is how far the index is below its previous peak. A fall of 20% or more is commonly called a bear market, and 10–20% a correction. A drawdown describes what has happened; it doesn't tell you what comes next.",
    lessonId: "drawdown",
    practiceNudge: (s) =>
      `You're ${Math.round(-s.drawdown * 100)}% below the peak. Is your decision a response to the evidence or to that number?`,
  },
  {
    keywords: /yield curve|10y|2y|invert|treasury|spread/i,
    answer:
      "The yield curve here is the 10-year minus the 2-year Treasury yield. When it's negative (inverted), short-term rates are above long-term ones, which has come before several U.S. recessions, usually with a delay of many months, and with false alarms too.",
    lessonId: "economy",
    practiceNudge: (s) =>
      s.yieldCurve === null ? null : `The spread is ${s.yieldCurve.toFixed(2)} right now. Given how variable the lag is, how much weight do you want to give it?`,
  },
  {
    keywords: /unemploy|jobs?|labou?r|payroll|claims/i,
    answer:
      "Unemployment is a lagging indicator: it often keeps rising after stocks have bottomed. It's published with a delay, so the simulator shows last month's figure, the latest you'd actually have had.",
    lessonId: "economy",
    practiceNudge: (s) =>
      s.unemployment === null ? null : `The latest figure is ${s.unemployment.toFixed(1)}%. Is it rising or falling compared with your last checkpoint, and does your plan depend on that?`,
  },
  {
    keywords: /policy rate|fed funds|interest rate|central bank|\bfed\b|rate cut|rate hike/i,
    answer:
      "The policy rate is the overnight rate set by the central bank. Cuts are meant to support the economy; hikes to cool inflation. In the simulator it's also what your cash earns.",
    lessonId: "economy",
  },
  {
    keywords: /alloc|cash|how .*slider|stocks vs|percent in/i,
    answer:
      "Your allocation is the share of the portfolio in the index; the rest is cash earning the policy rate. At 70%, a 10% fall in the index costs you about 7%. Remember the asymmetry: after a 50% loss you need +100% to get back to even.",
    lessonId: "allocation",
  },
  {
    keywords: /recession|gdp|economy/i,
    answer:
      "A recession is a broad, sustained decline in economic activity. In the U.S. it's dated after the fact by the NBER, often many months later, so in real time you rarely know for sure whether you're in one.",
    lessonId: "economy",
  },
  {
    keywords: /loss aversion|capitulat|panic/i,
    answer:
      "Loss aversion: losses feel roughly twice as painful as equal gains feel good. After a big fall it can push you to sell to stop the pain (capitulation), even when your reasoning hasn't changed.",
    lessonId: "biases",
  },
  {
    keywords: /chas|fomo|momentum/i,
    answer:
      "Chasing means adding exposure because prices have risen recently, treating past returns as a forecast. The coach checks for it when you raise your allocation a lot after a strong 12 months.",
    lessonId: "biases",
  },
  {
    keywords: /overconfiden|confiden|calibrat|how sure/i,
    answer:
      "Calibration means your confidence matches your hit rate: when you say 70%, you're right about 70% of the time. The debrief compares your average confidence with how often your forecasts came true.",
    lessonId: "process",
  },
  {
    keywords: /status.?quo|do nothing|inertia/i,
    answer:
      "Status-quo bias is sticking with what you have by default because acting feels riskier. Holding can be a good decision, but it should be one you actively choose.",
    lessonId: "biases",
  },
  {
    keywords: /trigger|change my mind|pre.?commit|exit plan/i,
    answer:
      "A change-my-mind condition is a rule you set in advance: what you'll do if a specific, checkable thing happens. \"If unemployment passes 8%, I'll cut to 40%\" is measurable; \"when things calm down\" isn't.",
    lessonId: "process",
  },
  {
    keywords: /forecast|flat|within ?3|higher|lower/i,
    answer:
      "The forecast asks whether the index will be higher, about the same (within ±3%) or lower at the next checkpoint. It's scored separately from your allocation so you can track your calibration.",
    lessonId: "process",
  },
  {
    keywords: /process score|score|graded|debrief/i,
    answer:
      "The process score is fixed-rule scoring, not profit: reasoning that cites evidence (30%), measurable change-my-mind conditions (30%), engaging with the coach (20%) and calibration (20%). Outcome is shown separately.",
    lessonId: "process",
  },
  {
    keywords: /rebase|why .*100|index level|hidden|blind|dates/i,
    answer:
      "The index is rebased to 100 and dates are hidden so you can't recognise the period and lean on what you already know happened. You decide only with the information available at the time. Everything is revealed in the debrief.",
  },
  {
    keywords: /dividend|total return/i,
    answer:
      "The simulator uses price-only returns (dividends excluded) to keep things simple. Real-world returns include dividends, which historically added a meaningful share of long-run stock returns.",
  },
  {
    keywords: /diversif/i,
    answer:
      "Diversification means spreading money across assets whose returns don't move in lockstep, so one bad outcome hurts less. The simulator keeps it to two assets (an index and cash) so you can focus on judgment.",
    lessonId: "allocation",
  },
];

// Guardrails. Order matters: the first match wins.
const GUARDRAILS: { id: string; modes: TutorMode[]; pattern: RegExp; reply: string }[] = [
  {
    id: "Decision request",
    modes: ["learn", "practice"],
    pattern:
      /should i\b|what (allocation|percent|%)|how much (should|to put)|what would you do|recommend|best (move|allocation|choice)|good time to (buy|sell|invest)|buy or sell|tell me (what|the answer)|which option|what('s| is) the (right|correct) (answer|move|allocation)/i,
    reply:
      "That decision is yours. That's the whole point of the exercise, and I won't make it for you. I can explain any signal on the dashboard so you can make the call yourself. Which piece of evidence are you weighing up?",
  },
  {
    id: "Prediction request",
    modes: ["learn", "practice"],
    pattern:
      /will (the )?(market|index|it|stocks?|prices?) (go|rise|fall|drop|crash|recover|be|bounce)|what happens next|going to (go|rise|fall|crash|recover)|is (this|it) the bottom|has it bottomed|predict|next month|next checkpoint/i,
    reply:
      "I don't predict markets, and nobody can do it reliably over short horizons. In the simulator it would also hand you hindsight. Try framing it as odds: what evidence would make 'higher' more likely than 'lower' to you?",
  },
  {
    id: "Period identification",
    modes: ["practice"],
    pattern:
      /which (period|year|crisis|era)|what (year|period|date)|when is this|is this (19|20)\d\d|is this (the )?(gfc|covid|dot.?com|2008|financial crisis|crash)|real (dates?|name)|what index is this/i,
    reply:
      "I won't reveal the period. Knowing what happened next would replace your judgment with memory. You'll see the full reveal in the debrief. What do the signals on your dashboard tell you right now?",
  },
];

const SUGGESTIONS_LEARN = ["What is CAPE?", "What is an inverted yield curve?", "What is loss aversion?", "Why is unemployment lagging?"];
const SUGGESTIONS_PRACTICE = ["What does CAPE tell me?", "What is a drawdown?", "Should I sell now?", "Which year is this?"];

export function suggestions(mode: TutorMode) {
  return mode === "practice" ? SUGGESTIONS_PRACTICE : SUGGESTIONS_LEARN;
}

export function respond(question: string, mode: TutorMode, signals: Signals | null): TutorReply {
  for (const g of GUARDRAILS) {
    if (g.modes.includes(mode) && g.pattern.test(question)) {
      return { kind: "guardrail", text: g.reply, rule: g.id };
    }
  }
  const topic = TOPICS.find((t) => t.keywords.test(question));
  if (!topic) {
    return {
      kind: "unknown",
      text: "I'm a prototype tutor with a fixed set of topics, so I don't have a reliable answer to that and I won't guess. Try asking about CAPE, drawdowns, the yield curve, unemployment, rates, allocation, the biases the coach checks, or how scoring works.",
    };
  }
  const followUp = mode === "practice" && signals && topic.practiceNudge ? topic.practiceNudge(signals) ?? undefined : undefined;
  return { kind: "answer", text: topic.answer, followUp, lessonId: topic.lessonId };
}
