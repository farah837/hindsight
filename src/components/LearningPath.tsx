"use client";

import { useState } from "react";
import { LESSONS, Lesson } from "@/lib/lessons";

export type Progress = Record<string, { correct: boolean }>;

interface Props {
  progress: Progress;
  onComplete: (id: string, correct: boolean) => void;
  lessonId: string | null;
  setLessonId: (id: string | null) => void;
  onPractice: () => void;
}

export default function LearningPath({ progress, onComplete, lessonId, setLessonId, onPractice }: Props) {
  const lesson = LESSONS.find((l) => l.id === lessonId);
  if (lesson) {
    const i = LESSONS.indexOf(lesson);
    return (
      <LessonView
        key={lesson.id}
        lesson={lesson}
        index={i}
        done={progress[lesson.id]}
        onComplete={(c) => onComplete(lesson.id, c)}
        onBack={() => setLessonId(null)}
        onNext={() => (i + 1 < LESSONS.length ? setLessonId(LESSONS[i + 1].id) : setLessonId(null))}
        isLast={i + 1 === LESSONS.length}
      />
    );
  }

  const completed = LESSONS.filter((l) => progress[l.id]).length;
  const next = LESSONS.find((l) => !progress[l.id]);

  return (
    <div>
      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Learning path</span>
      <h2 className="text-2xl font-bold mt-1">Learn the signals before you use them</h2>
      <p className="text-gray-600 mt-2 max-w-2xl">
        Six short lessons, about 20 minutes in total. Each one covers something you&apos;ll see in the simulator and ends with a check
        question: you commit to an answer and a reason before you see the explanation.
      </p>

      <div className="flex items-center gap-3 mt-5">
        <div className="flex-1 h-2 bg-blue-100 rounded-full">
          <div className="h-2 bg-blue-600 rounded-full transition-all" style={{ width: `${(completed / LESSONS.length) * 100}%` }} />
        </div>
        <span className="text-sm text-gray-600 tabular-nums">
          {completed}/{LESSONS.length}
        </span>
      </div>

      <ol className="mt-6 space-y-2">
        {LESSONS.map((l, i) => {
          const p = progress[l.id];
          return (
            <li key={l.id}>
              <button
                onClick={() => setLessonId(l.id)}
                className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 transition flex items-center gap-4"
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                    p ? "bg-blue-600 text-white" : next?.id === l.id ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {p ? "✓" : i + 1}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-medium">{l.title}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {l.minutes} min · used in: {l.usedIn}
                  </span>
                </span>
                {next?.id === l.id && <span className="text-xs text-blue-700 font-medium hidden sm:inline">Up next →</span>}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        {next ? (
          <button onClick={() => setLessonId(next.id)} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            {completed === 0 ? "Start lesson 1 →" : "Continue →"}
          </button>
        ) : null}
        <button
          onClick={onPractice}
          className={`px-6 py-3 rounded-lg font-medium ${next ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50" : "bg-blue-600 text-white hover:bg-blue-700"}`}
        >
          {next ? "Skip to practice" : "Go to practice →"}
        </button>
      </div>
    </div>
  );
}

function LessonView({
  lesson,
  index,
  done,
  onComplete,
  onBack,
  onNext,
  isLast,
}: {
  lesson: Lesson;
  index: number;
  done?: { correct: boolean };
  onComplete: (correct: boolean) => void;
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  const [why, setWhy] = useState("");
  const [checked, setChecked] = useState(false);
  const correct = choice === lesson.check.answer;

  function check() {
    setChecked(true);
    onComplete(correct);
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800">
        ← All lessons
      </button>
      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mt-4">
        Lesson {index + 1} · {lesson.minutes} min · used in: {lesson.usedIn}
      </p>
      <h2 className="text-2xl font-bold mt-1">{lesson.title}</h2>

      <div className="mt-5 space-y-3 text-gray-700 leading-relaxed max-w-2xl">
        {lesson.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <div className="bg-slate-800 text-slate-100 rounded-xl p-5 mt-6 max-w-2xl">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">From history: {lesson.example.title}</p>
        <p className="text-sm leading-relaxed">{lesson.example.text}</p>
      </div>

      <div className="bg-white border-2 border-blue-200 rounded-xl p-5 mt-6 max-w-2xl">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Check your understanding</p>
        <p className="font-medium mt-1.5">{lesson.check.question}</p>
        <div className="space-y-2 mt-3">
          {lesson.check.options.map((o, i) => {
            const state = !checked
              ? choice === i
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
              : i === lesson.check.answer
                ? "border-green-500 bg-green-50"
                : i === choice
                  ? "border-red-400 bg-red-50"
                  : "border-gray-200 opacity-60";
            return (
              <button key={o} disabled={checked} onClick={() => setChoice(i)} className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${state}`}>
                {o}
              </button>
            );
          })}
        </div>
        {!checked && (
          <>
            <label className="block text-sm font-semibold mt-4">Why did you pick it?</label>
            <input
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="One line in your own words"
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm mt-1.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={check}
              disabled={choice === null || why.trim().length < 10}
              className="mt-3 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
            >
              Check my answer
            </button>
          </>
        )}
        {checked && (
          <div className={`mt-4 rounded-lg p-3 text-sm ${correct ? "bg-green-50 text-green-900" : "bg-orange-50 text-orange-900"}`}>
            <p className="font-semibold">{correct ? "Right." : "Not quite."}</p>
            <p className="mt-1">{lesson.check.explanation}</p>
            <p className="mt-2 text-xs opacity-80">Your reason: &ldquo;{why}&rdquo;. Does it still hold up?</p>
          </div>
        )}
        {!checked && done && <p className="text-xs text-gray-400 mt-2">You&apos;ve completed this lesson before. Try it again.</p>}
      </div>

      {checked && (
        <button onClick={onNext} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
          {isLast ? "Finish the path →" : "Next lesson →"}
        </button>
      )}
    </div>
  );
}
