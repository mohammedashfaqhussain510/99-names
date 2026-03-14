"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { names } from "@/data/names";
import AuthModal from "@/components/AuthModal";
import {
  Search,
  BookOpen,
  Brain,
  LogOut,
  User as UserIcon,
} from "lucide-react";

type Status = "unseen" | "learning" | "known";
type ProgressMap = Record<number, Status>;

export default function Home() {
  const { user, logout } = useAuth();
  const [progress, setProgress] = useState<ProgressMap>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("allah99_status");
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [mode, setMode] = useState<"browse" | "quiz">("browse");
  const [filter, setFilter] = useState<Status | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [quizQueue, setQuizQueue] = useState<number[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Sync with Firestore
  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
          setProgress(doc.data().progress || {});
        }
      });
      return () => unsub();
    }
  }, [user]);

  const saveProgress = async (newProgress: ProgressMap) => {
    setProgress(newProgress);
    if (user) {
      await setDoc(
        doc(db, "users", user.uid),
        { progress: newProgress },
        { merge: true },
      );
    } else {
      localStorage.setItem("allah99_status", JSON.stringify(newProgress));
    }
  };

  const markStatus = (index: number, status: Status) => {
    const newStatus = progress[index] === status ? "unseen" : status;
    const newProgress = { ...progress, [index]: newStatus };
    saveProgress(newProgress);
  };

  const stats = useMemo(() => {
    const counts = { known: 0, learning: 0, unseen: 0 };
    names.forEach((_, i) => {
      counts[progress[i] || "unseen"]++;
    });
    return counts;
  }, [progress]);

  const filteredNames = useMemo(() => {
    return names
      .map((n, i) => ({ n, i }))
      .filter(({ n, i }) => {
        const s = progress[i] || "unseen";
        const matchFilter = filter === "all" || s === filter;
        const q = searchQuery.toLowerCase();
        const matchSearch =
          !q ||
          n[0].includes(q) ||
          n[1].toLowerCase().includes(q) ||
          n[2].toLowerCase().includes(q) ||
          n[3].toLowerCase().includes(q);
        return matchFilter && matchSearch;
      });
  }, [progress, filter, searchQuery]);

  const startQuiz = () => {
    const queue = Array.from({ length: 99 }, (_, i) => i).sort(
      () => Math.random() - 0.5,
    );
    setQuizQueue(queue);
    setQIdx(0);
    setShowAnswer(false);
    setMode("quiz");
  };

  const markAndNext = (isKnown: boolean) => {
    const currentIdx = quizQueue[qIdx];
    markStatus(currentIdx, isKnown ? "known" : "learning");
    if (qIdx + 1 < quizQueue.length) {
      setQIdx(qIdx + 1);
      setShowAnswer(false);
    } else {
      setMode("browse");
    }
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="text-center py-10 px-4 bg-gradient-to-b from-[#1a1033] to-[#0d1117] border-b border-[#30363d] relative overflow-hidden">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 opacity-40 font-['Scheherazade_New'] text-lg text-[#a371f7]">
          بسم الله الرحمن الرحيم
        </div>
        <span className="block font-['Scheherazade_New'] text-4xl text-[#d2a8ff] mb-2 mt-4">
          أسماء الله الحسنى
        </span>
        <h1 className="text-2xl font-light tracking-[2px] text-[#e6edf3] mb-1 text-center">
          99 NAMES OF ALLAH
        </h1>
        <p className="text-[13px] text-[#8b949e] tracking-wider uppercase">
          Asma ul Husna — Memorise & Track Progress
        </p>

        <div className="absolute top-4 right-4 flex gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#8b949e] hidden sm:inline">
                {user.displayName || user.email}
              </span>
              <button
                onClick={() => logout()}
                className="p-2 text-[#8b949e] hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 text-sm text-[#a371f7] hover:text-[#d2a8ff] transition-colors bg-[#3d2b6b]/30 px-3 py-1.5 rounded-full border border-[#a371f7]/30"
            >
              <UserIcon size={16} />
              Login to Sync
            </button>
          )}
        </div>
      </header>

      {/* Controls */}
      <div className="sticky top-0 z-10 bg-[#161b22] border-b border-[#30363d] px-5 py-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#656d76]"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by name or meaning..."
            className="w-full bg-[#21262d] border border-[#30363d] rounded-md pl-10 pr-4 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-[#a371f7]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("browse")}
            className={`px-4 py-2 rounded-md text-sm transition-all flex items-center gap-2 border ${
              mode === "browse"
                ? "bg-[#3d2b6b] text-[#d2a8ff] border-[#a371f7]"
                : "bg-[#21262d] text-[#8b949e] border-[#30363d] hover:border-[#484f58]"
            }`}
          >
            <BookOpen size={16} />
            Browse
          </button>
          <button
            onClick={() => startQuiz()}
            className={`px-4 py-2 rounded-md text-sm transition-all flex items-center gap-2 border ${
              mode === "quiz"
                ? "bg-[#3d2b6b] text-[#d2a8ff] border-[#a371f7]"
                : "bg-[#21262d] text-[#8b949e] border-[#30363d] hover:border-[#484f58]"
            }`}
          >
            <Brain size={16} />
            Quiz Mode
          </button>
        </div>
      </div>

      {mode === "browse" ? (
        <div id="browse-area">
          <div className="bg-[#161b22] border-b border-[#30363d] px-5 py-3 flex gap-2 flex-wrap">
            {(["all", "learning", "known", "unseen"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[12px] px-3 py-1 rounded-full border transition-all capitalize ${
                  filter === f
                    ? "bg-[#3d2b6b] text-[#d2a8ff] border-[#a371f7]"
                    : "bg-transparent text-[#8b949e] border-[#30363d] hover:border-[#484f58]"
                }`}
              >
                {f} {f === "all" ? `(99)` : ""}
              </button>
            ))}
          </div>

          <div className="bg-[#161b22] px-5 py-3">
            <div className="h-[3px] bg-[#21262d] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#a371f7] to-[#d2a8ff] transition-all duration-500"
                style={{ width: `${(stats.known / 99) * 100}%` }}
              />
            </div>
            <div className="text-[11px] text-[#656d76] mt-2 text-right tracking-wider">
              {stats.known} of 99 memorised (
              {Math.round((stats.known / 99) * 100)}%)
            </div>
          </div>

          <div className="bg-[#161b22] border-b border-[#30363d] px-5 py-2 flex gap-4 text-[12px]">
            <div className="text-[#8b949e]">
              Known:{" "}
              <span className="text-[#7ee787] font-bold">{stats.known}</span>
            </div>
            <div className="text-[#8b949e]">
              Learning:{" "}
              <span className="text-[#f0b429] font-bold">{stats.learning}</span>
            </div>
            <div className="text-[#8b949e]">
              Not started:{" "}
              <span className="text-[#e6edf3] font-bold">{stats.unseen}</span>
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-[10px] p-5">
            {filteredNames.length > 0 ? (
              filteredNames.map(({ n, i }) => {
                const s = progress[i] || "unseen";
                return (
                  <div
                    key={i}
                    className={`bg-[#161b22] border rounded-xl p-4 transition-colors group ${
                      s === "known"
                        ? "border-[#1b5e30] bg-gradient-to-br from-[#161b22] to-[#0d2418]"
                        : s === "learning"
                          ? "border-[#5a3e00] bg-gradient-to-br from-[#161b22] to-[#1e1500]"
                          : "border-[#30363d] hover:border-[#484f58]"
                    }`}
                  >
                    <div
                      className={`text-[10px] font-bold w-[22px] h-[22px] rounded-full flex items-center justify-center mb-2 tracking-tighter ${
                        s === "known"
                          ? "bg-[#1b3a21] text-[#7ee787]"
                          : s === "learning"
                            ? "bg-[#3d2e0a] text-[#f0b429]"
                            : "bg-[#21262d] text-[#656d76]"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="font-['Scheherazade_New'] text-2xl text-right text-[#d2a8ff] mb-1 leading-[1.5]">
                      {n[0]}
                    </div>
                    <div className="text-[13px] font-bold text-[#e6edf3] mb-0.5 tracking-tight">
                      {n[1]}
                    </div>
                    <div className="text-[12px] text-[#8b949e] mb-0.5 leading-tight text-left">
                      {n[2]}
                    </div>
                    <div className="text-[12px] text-[#656d76] italic leading-tight text-left">
                      {n[3]}
                    </div>
                    <div className="flex gap-1.5 mt-3 pt-3 border-t border-[#30363d]/50">
                      <button
                        onClick={() => markStatus(i, "learning")}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                          s === "learning"
                            ? "bg-[#3d2e0a] text-[#f0b429] border-[#5a3e00]"
                            : "bg-[#21262d] text-[#8b949e] border-[#30363d] hover:border-[#484f58]"
                        }`}
                      >
                        Learning
                      </button>
                      <button
                        onClick={() => markStatus(i, "known")}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                          s === "known"
                            ? "bg-[#1b3a21] text-[#7ee787] border-[#1b5e30]"
                            : "bg-[#21262d] text-[#8b949e] border-[#30363d] hover:border-[#484f58]"
                        }`}
                      >
                        Known ✓
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-[#656d76] text-sm">
                No names found matching your criteria.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-5 min-h-[60vh]">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 max-w-[440px] w-full text-center">
            <div className="text-[12px] text-[#656d76] mb-6 tracking-widest uppercase">
              Name {qIdx + 1} of 99
            </div>
            <div className="font-['Scheherazade_New'] text-6xl text-[#d2a8ff] mb-8 leading-relaxed">
              {names[quizQueue[qIdx]][0]}
            </div>

            {!showAnswer ? (
              <button
                onClick={() => setShowAnswer(true)}
                className="px-6 py-2.5 rounded-md border border-[#30363d] bg-[#21262d] text-[#8b949e] text-[13px] hover:border-[#a371f7] hover:text-[#d2a8ff] transition-all"
              >
                Show Meaning
              </button>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="text-xl font-bold text-[#e6edf3] mb-1 tracking-tight">
                  {names[quizQueue[qIdx]][1]}
                </div>
                <div className="text-[14px] text-[#8b949e] mb-1">
                  {names[quizQueue[qIdx]][2]}
                </div>
                <div className="text-[13px] text-[#656d76] italic mb-6">
                  {names[quizQueue[qIdx]][3]}
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => markAndNext(false)}
                    className="px-4 py-2 rounded-md border border-[#5a3e00] bg-[#3d2e0a] text-[#f0b429] text-[13px] hover:bg-[#5a3e00] transition-all"
                  >
                    Still Learning
                  </button>
                  <button
                    onClick={() => markAndNext(true)}
                    className="px-4 py-2 rounded-md border border-[#1b5e30] bg-[#1b3a21] text-[#7ee787] text-[13px] hover:bg-[#1b5e30] transition-all"
                  >
                    I Know This ✓
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </main>
  );
}
// Force redeploy Sat Mar 14 23:39:04 IST 2026
