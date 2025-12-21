"use client";

import { X, Trophy } from "lucide-react";
import TopPerformersChart from "@/components/TopPerformersChart";

type LeaderboardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  nodes: any[];
  isLight: boolean;
};

export const LeaderboardModal = ({
  isOpen,
  onClose,
  nodes,
  isLight
}: LeaderboardModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 theme-transition"
      style={{ background: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl theme-transition"
        style={{
          background: isLight ? "#ffffff" : "#0F172A",
          borderColor: isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative px-8 py-6 border-b"
          style={{
            borderColor: isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)",
            background: isLight
              ? "linear-gradient(135deg, rgba(123, 63, 242, 0.03) 0%, rgba(20, 241, 149, 0.03) 100%)"
              : "linear-gradient(135deg, rgba(123, 63, 242, 0.08) 0%, rgba(20, 241, 149, 0.05) 100%)",
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-lg transition-colors"
            style={{
              background: isLight ? "rgba(15, 23, 42, 0.05)" : "rgba(255, 255, 255, 0.05)",
              color: isLight ? "#64748b" : "#94a3b8",
            }}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(123, 63, 242, 0.15)",
              }}
            >
              <Trophy className="w-6 h-6" style={{ color: "#7B3FF2" }} strokeWidth={2.3} />
            </div>
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}
              >
                Network Leaderboard
              </h2>
              <p
                className="text-sm"
                style={{ color: isLight ? "#64748b" : "#94a3b8" }}
              >
                Ranking of pNodes based on performance score, storage commitment, uptime duration, or reward credits
              </p>
            </div>
          </div>
        </div>

        {/* Content - Full TopPerformersChart with dropdown */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 150px)' }}>
          <TopPerformersChart nodes={nodes} hideHeader={true} />
        </div>
      </div>
    </div>
  );
};
