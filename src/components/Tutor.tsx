"use client";

import { useEffect, useRef, useState } from "react";
import { LESSONS } from "@/lib/lessons";
import type { Signals } from "@/lib/trainer";
import { TutorMode, TutorReply, respond, suggestions } from "@/lib/tutor";

interface Message {
  from: "you" | "tutor";
  text: string;
  reply?: TutorReply;
}

export default function Tutor({ mode, signals, onOpenLesson }: { mode: TutorMode; signals: Signals | null; onOpenLesson?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, thinking, open]);

  function ask(q: string) {
    const question = q.trim();
    if (!question || thinking) return;
    setMessages((m) => [...m, { from: "you", text: question }]);
    setInput("");
    setThinking(true);
    // Short pause so the mock feels conversational in a demo.
    setTimeout(() => {
      const reply = respond(question, mode, signals);
      setMessages((m) => [...m, { from: "tutor", text: reply.text, reply }]);
      setThinking(false);
    }, 600);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gray-900 text-white text-sm font-medium shadow-lg hover:bg-gray-800"
      >
        <span className="w-2 h-2 rounded-full bg-green-400" />
        Ask the tutor
      </button>
    );
  }

  return (
    <div className="fixed z-40 inset-x-2 bottom-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96 h-[70vh] sm:h-[32rem] bg-white border border-gray-200 rounded-2xl shadow-xl flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">Tutor</p>
          <p className="text-[11px] text-gray-500 leading-snug">
            {mode === "practice"
              ? "Practice mode: I explain concepts. I won't make your decision, predict the market or reveal the period."
              : "Ask about any concept. I explain; I don't give investment advice."}
          </p>
        </div>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-lg leading-none px-1" aria-label="Close tutor">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
        {messages.length === 0 && <p className="text-gray-500 text-xs">Not sure what a signal means? Ask. Try one of these:</p>}
        {messages.map((m, i) =>
          m.from === "you" ? (
            <div key={i} className="flex justify-end">
              <p className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-3 py-2 max-w-[85%]">{m.text}</p>
            </div>
          ) : (
            <div key={i} className="max-w-[90%]">
              {m.reply?.kind === "guardrail" && (
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 mb-1">Guardrail · {m.reply.rule}</p>
              )}
              <div className={`rounded-2xl rounded-bl-sm px-3 py-2 ${m.reply?.kind === "guardrail" ? "bg-amber-50 border border-amber-200 text-amber-900" : "bg-gray-100 text-gray-800"}`}>
                <p>{m.text}</p>
                {m.reply?.followUp && <p className="mt-2 pt-2 border-t border-gray-200 text-gray-700 italic">{m.reply.followUp}</p>}
              </div>
              {m.reply?.lessonId && onOpenLesson && mode === "learn" && (
                <button onClick={() => onOpenLesson(m.reply!.lessonId!)} className="text-[11px] text-blue-700 underline mt-1">
                  Open lesson: {LESSONS.find((l) => l.id === m.reply!.lessonId)?.title}
                </button>
              )}
            </div>
          ),
        )}
        {thinking && <p className="text-gray-400 text-xs">Tutor is typing…</p>}
        <div ref={endRef} />
      </div>

      <div className="px-3 pb-3">
        <div className="flex gap-1.5 flex-wrap mb-2">
          {suggestions(mode).map((s) => (
            <button key={s} onClick={() => ask(s)} className="text-[11px] px-2 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-gray-300">
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a concept…"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={!input.trim() || thinking} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40">
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
