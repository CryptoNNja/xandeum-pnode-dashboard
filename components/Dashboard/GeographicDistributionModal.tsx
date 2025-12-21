"use client"

import { X, MapPin, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";

type CountryData = {
  country: string;
  country_code: string;
  node_count: number;
  percentage: number;
};

type GeographicDistributionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  totalNodes: number;
  countriesCount: number;
  isLight: boolean;
};

export const GeographicDistributionModal = ({
  isOpen,
  onClose,
  totalNodes,
  countriesCount,
  isLight
}: GeographicDistributionModalProps) => {
  const [countryData, setCountryData] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'nodes' | 'country'>('nodes');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (isOpen) {
      fetchCountryDistribution();
    }
  }, [isOpen]);

  const fetchCountryDistribution = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/geographic-distribution');
      const data = await response.json();
      setCountryData(data.countries || []);
    } catch (error) {
      console.error('Failed to fetch country distribution:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedData = [...countryData].sort((a, b) => {
    if (sortBy === 'nodes') {
      return sortOrder === 'desc' 
        ? b.node_count - a.node_count 
        : a.node_count - b.node_count;
    } else {
      return sortOrder === 'desc'
        ? a.country.localeCompare(b.country)
        : b.country.localeCompare(a.country);
    }
  });

  const toggleSort = (column: 'nodes' | 'country') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder(column === 'nodes' ? 'desc' : 'asc');
    }
  };

  const avgNodesPerCountry = countriesCount > 0 ? (totalNodes / countriesCount).toFixed(2) : '0';
  
  // Calculate distribution score (0-100) based on how evenly distributed nodes are
  const calculateDistributionScore = () => {
    if (countryData.length === 0) return 0;
    const idealPercentage = 100 / countryData.length;
    const deviations = countryData.map(c => Math.abs(c.percentage - idealPercentage));
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / countryData.length;
    const score = Math.max(0, 100 - (avgDeviation * 2));
    return Math.round(score);
  };

  const distributionScore = calculateDistributionScore();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 theme-transition"
      style={{ background: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl theme-transition"
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
                background: "linear-gradient(135deg, #7B3FF2, #14F195)",
                opacity: 0.15,
              }}
            >
              <MapPin className="w-6 h-6" style={{ color: "#7B3FF2" }} />
            </div>
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}
              >
                Geographic Distribution
              </h2>
              <p
                className="text-sm"
                style={{ color: isLight ? "#64748b" : "#94a3b8" }}
              >
                Network decentralization details
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 px-8 py-6 border-b"
          style={{ borderColor: isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)" }}
        >
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
              Countries
            </p>
            <p className="text-2xl font-bold" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
              {countriesCount}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
              Total Nodes
            </p>
            <p className="text-2xl font-bold" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
              {totalNodes}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
              Avg/Country
            </p>
            <p className="text-2xl font-bold" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
              {avgNodesPerCountry}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
              Distribution
            </p>
            <p className="text-2xl font-bold" style={{ 
              color: distributionScore >= 70 ? "#10B981" : distributionScore >= 50 ? "#F59E0B" : "#EF4444" 
            }}>
              {distributionScore}%
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 320px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#7B3FF2" }}></div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 z-10"
                style={{ background: isLight ? "#f8fafc" : "#1e293b" }}
              >
                <tr>
                  <th className="text-left px-8 py-4 text-xs font-bold uppercase tracking-wider"
                    style={{ color: isLight ? "#64748b" : "#94a3b8" }}
                  >
                    Rank
                  </th>
                  <th 
                    className="text-left px-4 py-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-70 transition-opacity"
                    style={{ color: isLight ? "#64748b" : "#94a3b8" }}
                    onClick={() => toggleSort('country')}
                  >
                    <div className="flex items-center gap-2">
                      Country
                      {sortBy === 'country' && (
                        sortOrder === 'desc' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-right px-4 py-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-70 transition-opacity"
                    style={{ color: isLight ? "#64748b" : "#94a3b8" }}
                    onClick={() => toggleSort('nodes')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Nodes
                      {sortBy === 'nodes' && (
                        sortOrder === 'desc' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-wider"
                    style={{ color: isLight ? "#64748b" : "#94a3b8" }}
                  >
                    % of Network
                  </th>
                  <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider"
                    style={{ color: isLight ? "#64748b" : "#94a3b8" }}
                  >
                    Distribution
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((country, index) => {
                  // Calculate rank based on node count (always)
                  const rankByNodes = [...countryData]
                    .sort((a, b) => b.node_count - a.node_count)
                    .findIndex(c => c.country_code === country.country_code) + 1;
                  const isTopThree = rankByNodes <= 3;
                  
                  return (
                  <tr
                    key={country.country_code}
                    className="border-t transition-colors hover:bg-opacity-50"
                    style={{
                      borderColor: isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)",
                      background: isTopThree ? (isLight ? "rgba(123, 63, 242, 0.02)" : "rgba(123, 63, 242, 0.05)") : "transparent",
                    }}
                  >
                    <td className="px-8 py-4">
                      <span className="text-2xl">
                        {rankByNodes === 1 ? "🥇" : rankByNodes === 2 ? "🥈" : rankByNodes === 3 ? "🥉" : rankByNodes}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-medium" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
                        {country.country || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-semibold" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
                        {country.node_count}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-mono text-sm" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                        {country.percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="w-full h-2 rounded-full overflow-hidden" 
                        style={{ background: isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.08)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${country.percentage}%`,
                            background: "linear-gradient(90deg, #7B3FF2 0%, #14F195 100%)",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
