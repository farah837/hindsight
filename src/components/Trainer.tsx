"use client";

import { useEffect, useMemo, useState } from "react";
import LearningPath, { Progress } from "./LearningPath";
import LineChart from "./LineChart";
import Tutor from "./Tutor";
import { Forecast, SCENARIOS, Scenario, rowIndex } from "@/lib/scenarios";
import {
  CoachPrompt,
  Decision,
  START_VALUE,
  Signals,
  coachPrompts,
  forecastOutcome,
  horizonEnd,
  scoreProcess,
  signalsAt,
  simulate,
} from "@/lib/trainer";

type Stage = "intro" | "learn" | "pick" | "brief" | "decide" | "coach" | "debrief";

const PROGRESS_KEY = "hindsight-progress";

const BLUE = "#2a78d6";
const ORANGE = "#eb6834";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const money = (v: number) => (Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(v >= 100_000 ? 0 : 1)}k` : `$${v.toFixed(0)}`);
const signedPct = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}%`;
const realLabel = (d: string) => `${MONTHS[Number(d.slice(5)) - 1]} ${d.slice(0, 4)}`;
const forecastLabel: Record<Forecast, string> = { higher: "Higher", flat: "About the same", lower: "Lower" };

interface Draft {
  allocation: number;
  forecast: Forecast | null;
  confidence: number;
  rationale: string;
  trigger: string;
}

const emptyDraft = (allocation: number): Draft => ({ allocation, forecast: null, confidence: 65, rationale: "", trigger: "" });

export default function Trainer() {
  const [stage, setStage] = useState<Stage>("intro");
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]);
  const [cp, setCp] = useState(0);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft(70));
  const [prompts, setPrompts] = useState<CoachPrompt[]>([]);
  const [reply, setReply] = useState("");
  const [revised, setRevised] = useState(70);
  const [progress, setProgress] = useState<Progress>({});
  const [lessonId, setLessonId] = useState<string | null>(null);

  // Lesson progress is a per-viewer convenience; the app works without it.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROGRESS_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
      if (saved) setProgress(JSON.parse(saved));
    } catch {}
  }, []);

  function completeLesson(id: string, correct: boolean) {
    const next = { ...progress, [id]: { correct } };
    setProgress(next);
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    } catch {}
  }

  function go(s: Stage) {
    setStage(s);
    window.scrollTo({ top: 0 });
  }

  function openLesson(id: string | null) {
    setLessonId(id);
    setStage("learn");
    window.scrollTo({ top: 0 });
  }

  const prevAllocation = decisions.length ? decisions[decisions.length - 1].allocation : scenario.startAllocation;
  const sig = useMemo(() => signalsAt(scenario, cp), [scenario, cp]);

  function start(s: Scenario) {
    setScenario(s);
    setCp(0);
    setDecisions([]);
    setDraft(emptyDraft(s.startAllocation));
    setStage("brief");
  }

  function submitDecision() {
    const p = coachPrompts(sig, prevAllocation, { ...draft, forecast: draft.forecast! });
    setPrompts(p);
    setReply("");
    setRevised(draft.allocation);
    setStage("coach");
    window.scrollTo({ top: 0 });
  }

  function lockIn(skip: boolean) {
    const d: Decision = {
      allocation: revised,
      forecast: draft.forecast!,
      confidence: draft.confidence,
      rationale: draft.rationale,
      trigger: draft.trigger,
      reply: skip ? "" : reply,
      revisedFrom: revised !== draft.allocation ? draft.allocation : null,
      coachRules: prompts.map((p) => p.id),
    };
    const next = [...decisions, d];
    setDecisions(next);
    if (cp + 1 < scenario.checkpoints.length) {
      setCp(cp + 1);
      setDraft(emptyDraft(revised));
      setStage("decide");
    } else {
      setStage("debrief");
    }
    window.scrollTo({ top: 0 });
  }

  function fillDemo() {
    const demo = scenario.demo?.[cp];
    if (!demo) return;
    setDraft({
      allocation: demo.allocation,
      forecast: demo.forecast,
      confidence: demo.confidence,
      rationale: demo.rationale,
      trigger: demo.trigger,
    });
  }

  const totalSteps = scenario.checkpoints.length;

  return (
    <div className="min-h-screen bg-stone-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button onClick={() => go("intro")} className="text-left">
              <h1 className="text-xl font-bold">Hindsight</h1>
              <p className="text-xs text-gray-500 hidden sm:block">An investment judgment trainer. The AI coaches; you decide.</p>
            </button>
            <nav className="flex gap-1 text-sm">
              <button
                onClick={() => openLesson(null)}
                className={`px-3 py-1.5 rounded-lg ${stage === "learn" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
              >
                Learn
              </button>
              <button
                onClick={() => go("pick")}
                className={`px-3 py-1.5 rounded-lg ${["pick", "brief", "decide", "coach", "debrief"].includes(stage) ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
              >
                Practice
              </button>
            </nav>
          </div>
          {(stage === "decide" || stage === "coach") && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="hidden sm:inline">{scenario.codename}</span>
              {scenario.checkpoints.map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < cp || (i === cp && stage === "coach") ? "bg-blue-600" : i === cp ? "bg-blue-300" : "bg-gray-200"}`}
                />
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {stage === "intro" && <Intro onLearn={() => openLesson(null)} onPractice={() => go("pick")} />}

        {stage === "learn" && (
          <LearningPath progress={progress} onComplete={completeLesson} lessonId={lessonId} setLessonId={openLesson} onPractice={() => go("pick")} />
        )}

        {stage === "pick" && (
          <div>
            <StepTag>Choose a market period</StepTag>
            <h2 className="text-2xl font-bold mt-1">Pick a scenario</h2>
            <p className="text-gray-600 mt-2 max-w-2xl">
              Each scenario replays a real period of market history using real data. Dates and index levels are hidden so you
              can&apos;t lean on hindsight. You&apos;ll find out which period it was at the end.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => start(s)}
                  className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{s.codename}</span>
                    {s.demo && <span className="text-[10px] uppercase tracking-wide text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Demo path</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{s.teaser}</p>
                  <p className="text-xs text-gray-400 mt-3">
                    {s.checkpoints.length} decisions · {s.assetLabel.toLowerCase()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === "brief" && (
          <div>
            <StepTag>{scenario.codename} · Briefing</StepTag>
            <h2 className="text-2xl font-bold mt-1">You manage $100,000</h2>
            <p className="text-gray-600 mt-2 max-w-2xl">{scenario.teaser}</p>
            <div className="grid sm:grid-cols-3 gap-3 mt-6">
              <Fact title="Starting position" body={`${scenario.startAllocation}% in the index, ${100 - scenario.startAllocation}% in cash. Cash earns the policy rate.`} />
              <Fact title={`${totalSteps} decisions`} body="At each checkpoint you set your allocation, forecast the next stretch, and say what would change your mind." />
              <Fact title="Then the coach pushes back" body="It never tells you what to do. It asks the question you're avoiding and shows exactly why it's asking." />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 mt-6">
              <p className="text-sm font-semibold mb-3">{scenario.assetLabel}: history so far (rebased to 100)</p>
              <IndexChart scenario={scenario} upTo={rowIndex(scenario, scenario.checkpoints[0].date)} decisions={[]} />
            </div>
            <button onClick={() => setStage("decide")} className="mt-6 w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
              Go to decision 1 →
            </button>
          </div>
        )}

        {stage === "decide" && (
          <DecideView
            scenario={scenario}
            cp={cp}
            sig={sig}
            decisions={decisions}
            draft={draft}
            setDraft={setDraft}
            prevAllocation={prevAllocation}
            onSubmit={submitDecision}
            onDemo={scenario.demo ? fillDemo : undefined}
          />
        )}

        {stage === "coach" && (
          <div>
            <StepTag>
              Decision {cp + 1} of {totalSteps} · Coach challenge
            </StepTag>
            <h2 className="text-2xl font-bold mt-1">Before you lock it in</h2>
            <p className="text-gray-600 mt-2">
              You chose <strong>{draft.allocation}% in the index</strong> (was {prevAllocation}%) and forecast it will be{" "}
              <strong>{forecastLabel[draft.forecast!].toLowerCase()}</strong> at the next checkpoint, {draft.confidence}% sure.
            </p>

            <div className="space-y-3 mt-6">
              {prompts.map((p) => (
                <div key={p.id} className="bg-white border-2 border-blue-200 rounded-xl p-5">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">{p.name}</p>
                  <p className="font-medium mt-1.5">{p.question}</p>
                  <details className="mt-3 text-xs text-gray-500">
                    <summary className="cursor-pointer select-none hover:text-gray-700">Why is the coach asking this?</summary>
                    <p className="mt-1.5">{p.why}</p>
                  </details>
                </div>
              ))}
            </div>

            <label className="block text-sm font-semibold mt-6 mb-2">Your answer</label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Think it through. The coach won't answer for you."
              className="w-full border border-gray-200 bg-white rounded-xl p-4 text-sm min-h-28 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
            {scenario.demo?.[cp] && (
              <button onClick={() => setReply(scenario.demo![cp].reply)} className="text-xs text-gray-400 underline hover:text-gray-600 mt-1">
                use demo answer
              </button>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-4 mt-4">
              <AllocationSlider value={revised} onChange={setRevised} label="Want to adjust your allocation after thinking about it?" />
              {revised !== draft.allocation && (
                <p className="text-xs text-blue-700 mt-2">
                  Revised from {draft.allocation}% to {revised}%. Changing your mind for a reason is part of the skill.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => lockIn(false)}
                disabled={reply.trim().length < 15 && revised === draft.allocation}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40"
              >
                Lock in and move forward in time →
              </button>
              <button onClick={() => lockIn(true)} className="sm:w-48 py-3 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Skip the question
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Skipping is allowed, and it shows up in your debrief.</p>
          </div>
        )}

        {stage === "debrief" && <Debrief scenario={scenario} decisions={decisions} onRestart={() => go("pick")} />}
      </main>

      <Tutor
        mode={stage === "decide" || stage === "coach" || stage === "brief" ? "practice" : "learn"}
        signals={stage === "decide" || stage === "coach" ? sig : null}
        onOpenLesson={openLesson}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function StepTag({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{children}</span>;
}

function Fact({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-sm text-gray-600 mt-1">{body}</p>
    </div>
  );
}

function Intro({ onLearn, onPractice }: { onLearn: () => void; onPractice: () => void }) {
  return (
    <div>
      <h2 className="text-3xl sm:text-4xl font-bold max-w-2xl leading-tight">
        Most AI investing tools tell you what to buy. This one won&apos;t.
      </h2>
      <p className="text-gray-600 mt-4 max-w-2xl">
        Hindsight puts you inside real market history, without the dates, and makes you decide. Then an AI coach
        challenges your reasoning, never your conclusion. Your judgment is what gets trained.
      </p>
      <div className="grid sm:grid-cols-2 gap-4 mt-8">
        <Principle n="00" title="Learn, then practise" body="A short learning path covers every signal and bias in the simulator. A tutor answers concept questions at any time." />
        <Principle n="01" title="You think first" body="Every checkpoint needs your allocation, a forecast, your confidence and your reasoning before the coach says anything." />
        <Principle n="02" title="Real history, blind" body="Real index and macro data from public sources, with dates and levels hidden so memory and hindsight can't do the work." />
        <Principle n="03" title="A coach you can audit" body="Every question comes from a visible rule tied to the data. It never recommends a trade, and every number links to its source." />
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6 text-sm text-amber-900 max-w-2xl">
        <strong>The AI&apos;s rules:</strong> the coach and the tutor never recommend a position, never predict the market and never
        reveal which period you&apos;re in. You&apos;re graded on your <em>process</em>, not your luck.
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <button onClick={onLearn} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
          Start the learning path →
        </button>
        <button onClick={onPractice} className="px-6 py-3 border border-gray-200 bg-white rounded-lg font-medium text-gray-700 hover:bg-gray-50">
          Jump to practice
        </button>
      </div>
    </div>
  );
}

function Principle({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-xs font-mono text-blue-600">{n}</p>
      <p className="font-semibold mt-1">{title}</p>
      <p className="text-sm text-gray-600 mt-1.5">{body}</p>
    </div>
  );
}

function IndexChart({ scenario, upTo, decisions, reveal = false }: { scenario: Scenario; upTo: number; decisions: Decision[]; reveal?: boolean }) {
  const rows = scenario.rows;
  const labels = rows.map((r, i) => (reveal ? realLabel(r.date) : `M${i}`));
  const values = rows.map((r, i) => (i <= upTo ? r.index : null));
  const markers = scenario.checkpoints
    .map((c, i) => ({ at: rowIndex(scenario, c.date), label: `D${i + 1}${decisions[i] ? ` · ${decisions[i].allocation}%` : ""}` }))
    .filter((m) => m.at <= upTo);
  return (
    <LineChart
      series={[{ name: scenario.assetLabel, color: BLUE, values: reveal ? values : values.slice(0, upTo + 1) }]}
      xLabels={reveal ? labels : labels.slice(0, upTo + 1)}
      markers={markers}
      format={(v) => v.toFixed(0)}
    />
  );
}

function AllocationSlider({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-semibold">{label}</label>
        <span className="text-sm tabular-nums">
          <strong className="text-blue-700">{value}%</strong> index · {100 - value}% cash
        </span>
      </div>
      <input type="range" min={0} max={100} step={10} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full mt-2 accent-blue-600" />
    </div>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3" title={hint}>
      <p className="text-[11px] text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-semibold tabular-nums mt-0.5">{value}</p>
      <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{hint}</p>
    </div>
  );
}

function DecideView({
  scenario,
  cp,
  sig,
  decisions,
  draft,
  setDraft,
  prevAllocation,
  onSubmit,
  onDemo,
}: {
  scenario: Scenario;
  cp: number;
  sig: Signals;
  decisions: Decision[];
  draft: Draft;
  setDraft: (d: Draft) => void;
  prevAllocation: number;
  onSubmit: () => void;
  onDemo?: () => void;
}) {
  const k = rowIndex(scenario, scenario.checkpoints[cp].date);
  const horizon = horizonEnd(scenario, cp) - k;
  const allocations = decisions.map((d) => d.allocation);
  const value = simulate(scenario, allocations, k).at(-1)!.value;
  const prev = cp > 0 ? decisions[cp - 1] : null;
  const prevOutcome = cp > 0 ? forecastOutcome(scenario, cp - 1) : null;
  const ready = draft.forecast !== null && draft.rationale.trim().length >= 30 && draft.trigger.trim().length >= 10;
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });

  return (
    <div>
      <StepTag>
        Decision {cp + 1} of {scenario.checkpoints.length} · Month {k}
      </StepTag>
      <h2 className="text-2xl font-bold mt-1">What do you do now?</h2>

      {prev && prevOutcome && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">Index since last decision</p>
            <p className="font-semibold tabular-nums">{signedPct(sig.sinceLast!)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Your portfolio</p>
            <p className="font-semibold tabular-nums">{money(value)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">You forecast</p>
            <p className="font-semibold">
              {forecastLabel[prev.forecast]} ({prev.confidence}%)
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">It was</p>
            <p className={`font-semibold ${prev.forecast === prevOutcome ? "text-green-700" : "text-red-700"}`}>
              {forecastLabel[prevOutcome]} {prev.forecast === prevOutcome ? "✓" : "✗"}
            </p>
          </div>
          <p className="col-span-2 sm:col-span-4 text-xs text-gray-500 border-t border-gray-100 pt-2">
            Your trigger last time: <em>&ldquo;{prev.trigger}&rdquo;</em>. Has it been met?
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 mt-4">
        <p className="text-sm font-semibold mb-3">{scenario.assetLabel} (rebased to 100, dates hidden)</p>
        <IndexChart scenario={scenario} upTo={k} decisions={decisions} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4">
        <Tile label="From peak" value={signedPct(sig.drawdown)} hint="Fall from the highest point so far" />
        <Tile label="12 months" value={sig.return12m === null ? "n/a" : signedPct(sig.return12m)} hint="Index change over the past year" />
        <Tile label="CAPE" value={sig.cape?.toFixed(1) ?? "n/a"} hint={`${scenario.capeLabel}: price ÷ 10-yr avg earnings. Long-run avg ≈ 17`} />
        <Tile label="Unemployment" value={sig.unemployment ? `${sig.unemployment.toFixed(1)}%` : "n/a"} hint="Latest published (last month)" />
        <Tile label="Policy rate" value={sig.fedFunds !== null ? `${sig.fedFunds.toFixed(2)}%` : "n/a"} hint="What your cash earns" />
        <Tile label="10y − 2y" value={sig.yieldCurve !== null ? `${sig.yieldCurve.toFixed(2)}` : "n/a"} hint="Below 0 = inverted curve" />
      </div>

      <div className="bg-slate-800 text-slate-100 rounded-xl p-5 mt-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">What you know right now</p>
        <ul className="space-y-1.5 text-sm">
          {scenario.checkpoints[cp].context.map((c) => (
            <li key={c} className="flex gap-2">
              <span className="text-slate-500">▸</span>
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mt-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Your decision</p>
          {onDemo && (
            <button onClick={onDemo} className="text-xs text-gray-400 underline hover:text-gray-600">
              fill demo entry
            </button>
          )}
        </div>
        <AllocationSlider value={draft.allocation} onChange={(v) => set({ allocation: v })} label={`Allocation (currently ${prevAllocation}%)`} />

        <div>
          <p className="text-sm font-semibold">
            At the next checkpoint ({horizon} months from now), the index will be…
          </p>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {(["lower", "flat", "higher"] as Forecast[]).map((f) => (
              <button
                key={f}
                onClick={() => set({ forecast: f })}
                className={`py-2 rounded-lg border text-sm ${draft.forecast === f ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300"}`}
              >
                {forecastLabel[f]}
                {f === "flat" && <span className="block text-[10px] text-gray-400">within ±3%</span>}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <label className="text-sm text-gray-600 whitespace-nowrap">How sure?</label>
            <input type="range" min={35} max={95} step={5} value={draft.confidence} onChange={(e) => set({ confidence: Number(e.target.value) })} className="flex-1 accent-blue-600" />
            <span className="text-sm font-semibold tabular-nums w-10 text-right">{draft.confidence}%</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">Why? What on the dashboard supports this?</label>
          <textarea
            value={draft.rationale}
            onChange={(e) => set({ rationale: e.target.value })}
            placeholder="Your reasoning, in your words."
            className="w-full border border-gray-200 rounded-lg p-3 text-sm min-h-24 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="text-sm font-semibold">What would change your mind?</label>
          <input
            value={draft.trigger}
            onChange={(e) => set({ trigger: e.target.value })}
            placeholder="e.g. If unemployment goes above 7%, I'll cut to 40%."
            className="w-full border border-gray-200 rounded-lg p-3 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
          />
        </div>

        <button onClick={onSubmit} disabled={!ready} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40">
          Submit to the coach →
        </button>
        {!ready && <p className="text-xs text-gray-400 text-center -mt-4">Pick a forecast, write at least 30 characters of reasoning and a change-my-mind condition.</p>}
      </div>
    </div>
  );
}

function Debrief({ scenario, decisions, onRestart }: { scenario: Scenario; decisions: Decision[]; onRestart: () => void }) {
  const allocations = decisions.map((d) => d.allocation);
  const you = simulate(scenario, allocations);
  const baseline = simulate(scenario, [scenario.startAllocation]);
  const startRow = you[0].row;
  const labels = scenario.rows.slice(startRow).map((r) => realLabel(r.date));
  const score = scoreProcess(scenario, decisions);
  const youEnd = you.at(-1)!.value;
  const baseEnd = baseline.at(-1)!.value;
  const goodProcess = score.total >= 65;
  const goodOutcome = youEnd >= baseEnd;
  const fired = decisions.flatMap((d, i) => d.coachRules.filter((r) => r !== "pre-mortem").map((r) => ({ rule: r, cp: i })));

  const verdict = goodProcess
    ? goodOutcome
      ? { title: "Good process, good outcome", body: "You earned this one. Make sure you can explain why it worked, not just that it did." }
      : { title: "Good process, unlucky outcome", body: "Your reasoning was sound and you still lagged. That happens. Keep the process; one result doesn't prove much." }
    : goodOutcome
      ? { title: "Weak process, lucky outcome", body: "This is the dangerous quadrant. The result rewarded habits that will hurt you next time." }
      : { title: "Weak process, poor outcome", body: "Focus on the process gaps below. That's what you can control next time." };

  const reflections = [
    "Using only what you knew at each checkpoint (not what happened next), which decision would you change, and why?",
    score.calibrationGap > 10
      ? `Your average confidence was ${score.avgConfidence}% but your forecasts were right ${score.hitRate}% of the time. What made you feel more certain than the evidence allowed?`
      : "Your confidence roughly matched your accuracy. Which signal turned out to be most useful to you?",
    ...(fired.some((f) => f.rule === "capitulation")
      ? ["You sold heavily after a big fall. Did you get back in when your own trigger was met, or did the trigger keep moving?"]
      : []),
    ...(fired.some((f) => f.rule === "vague-trigger")
      ? ["At least one of your change-my-mind conditions wasn't measurable. How would you write it now?"]
      : []),
  ];

  return (
    <div>
      <StepTag>Debrief · the reveal</StepTag>
      <h2 className="text-3xl font-bold mt-1">{scenario.reveal.title}</h2>
      <p className="text-gray-500 text-sm mt-1">{scenario.reveal.asset}</p>
      <p className="text-gray-700 mt-3 max-w-2xl">{scenario.reveal.summary}</p>

      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 mt-6">
        <p className="text-sm font-semibold mb-3">The full period, with your decisions</p>
        <IndexChart scenario={scenario} upTo={scenario.rows.length - 1} decisions={decisions} reveal />
      </div>

      <div className="grid gap-4 mt-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Outcome</p>
          <p className="text-sm text-gray-600 mt-1">
            You ended with <strong className="text-gray-900">{money(youEnd)}</strong>. Holding {scenario.startAllocation}% throughout would have
            ended with <strong className="text-gray-900">{money(baseEnd)}</strong>.
          </p>
          <div className="mt-3">
            <LineChart
              height={220}
              series={[
                { name: "Your decisions", color: BLUE, values: you.map((p) => p.value) },
                { name: `Held ${scenario.startAllocation}%`, color: ORANGE, values: baseline.map((p) => p.value) },
              ]}
              xLabels={labels}
              format={money}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Process score</p>
          <p className="text-4xl font-bold mt-1 tabular-nums">
            {score.total}
            <span className="text-base text-gray-400 font-normal">/100</span>
          </p>
          <div className="space-y-2.5 mt-4">
            <Meter label="Reasoning cites evidence" value={score.evidence} weight="30%" />
            <Meter label="Change-my-mind conditions are measurable" value={score.triggers} weight="30%" />
            <Meter label="Engaged with the coach (answered or revised)" value={score.engagement} weight="20%" />
            <Meter label={`Calibration: ${score.avgConfidence}% confident, ${score.hitRate}% correct`} value={Math.max(0, 100 - Math.abs(score.calibrationGap) * 2)} weight="20%" />
          </div>
          <p className="text-[11px] text-gray-400 mt-3">Scored by fixed rules, not by whether you made money.</p>
        </div>
      </div>

      <div className={`rounded-xl p-5 mt-4 border ${goodProcess ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
        <p className="font-semibold">{verdict.title}</p>
        <p className="text-sm text-gray-700 mt-1">{verdict.body}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mt-4">
        <p className="font-semibold mb-3">Your decision journal</p>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="py-2 px-1 font-medium">When</th>
                <th className="py-2 px-1 font-medium">Allocation</th>
                <th className="py-2 px-1 font-medium">Forecast</th>
                <th className="py-2 px-1 font-medium">Actual</th>
                <th className="py-2 px-1 font-medium">Your reasoning</th>
                <th className="py-2 px-1 font-medium">Coach flags</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((d, i) => {
                const actual = forecastOutcome(scenario, i);
                return (
                  <tr key={i} className="border-b border-gray-50 align-top">
                    <td className="py-2 px-1 whitespace-nowrap">{realLabel(scenario.checkpoints[i].date)}</td>
                    <td className="py-2 px-1 tabular-nums whitespace-nowrap">
                      {d.allocation}%{d.revisedFrom !== null && <span className="text-xs text-blue-700"> (was {d.revisedFrom})</span>}
                    </td>
                    <td className="py-2 px-1 whitespace-nowrap">
                      {forecastLabel[d.forecast]} · {d.confidence}%
                    </td>
                    <td className={`py-2 px-1 whitespace-nowrap ${actual === d.forecast ? "text-green-700" : "text-red-700"}`}>{forecastLabel[actual]}</td>
                    <td className="py-2 px-1 text-gray-600">{d.rationale}</td>
                    <td className="py-2 px-1 text-xs text-gray-500">{d.coachRules.join(", ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-600 text-white rounded-xl p-5 mt-4">
        <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-2">Questions to reflect on (no answers given)</p>
        <ul className="space-y-2 text-sm">
          {reflections.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="text-blue-200">?</span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mt-4 text-sm">
        <p className="font-semibold mb-2">What actually happened</p>
        <ul className="space-y-1 text-gray-600 list-disc pl-5">
          {scenario.reveal.facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="font-semibold mt-4 mb-2">Data sources</p>
        <ul className="space-y-1 text-gray-600">
          {scenario.sources.map((s) => (
            <li key={s.url + s.label}>
              <a href={s.url} target="_blank" rel="noreferrer" className="underline hover:text-gray-900">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-400 mt-3">
          Returns are price-only (dividends excluded); cash earns the effective federal funds rate. Unemployment is shown with a one-month
          publication lag so you only saw data that was public at the time.
        </p>
      </div>

      <button onClick={onRestart} className="mt-6 w-full py-3 border border-gray-200 bg-white rounded-lg font-medium hover:bg-gray-50">
        Train on another period →
      </button>
      <p className="text-center text-xs text-gray-400 mt-3">Started at {money(START_VALUE)}. This is a training simulation, not investment advice.</p>
    </div>
  );
}

function Meter({ label, value, weight }: { label: string; value: number; weight: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="tabular-nums text-gray-900 font-medium">
          {value}
          <span className="text-gray-400 font-normal"> · {weight}</span>
        </span>
      </div>
      <div className="h-1.5 bg-blue-100 rounded-full mt-1">
        <div className="h-1.5 bg-blue-600 rounded-full" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
