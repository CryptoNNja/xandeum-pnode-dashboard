"use client";

import { motion } from "framer-motion";

export default function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-bg-app p-6">
      {/* Skeleton Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="h-20 bg-bg-card rounded-xl border border-border-app animate-pulse" />
      </div>

      {/* Skeleton KPI Cards */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="h-32 bg-bg-card rounded-xl border border-border-app overflow-hidden"
            >
              <div className="p-4 space-y-3">
                <div className="h-4 w-20 bg-gray-700 rounded animate-pulse" />
                <div className="h-8 w-16 bg-gray-600 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-700 rounded animate-pulse" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Skeleton Secondary Cards */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
              className="h-32 bg-bg-card rounded-xl border border-border-app overflow-hidden"
            >
              <div className="p-4 space-y-3">
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
                <div className="h-8 w-20 bg-gray-600 rounded animate-pulse" />
                <div className="h-3 w-32 bg-gray-700 rounded animate-pulse" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Skeleton Table */}
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className="bg-bg-card rounded-xl border border-border-app overflow-hidden"
        >
          {/* Table Header */}
          <div className="p-4 border-b border-border-app">
            <div className="flex items-center justify-between">
              <div className="h-6 w-40 bg-gray-700 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-10 w-10 bg-gray-700 rounded-lg animate-pulse" />
                <div className="h-10 w-10 bg-gray-700 rounded-lg animate-pulse" />
                <div className="h-10 w-10 bg-gray-700 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-border-app">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-gray-700 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-600 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="h-8 w-20 bg-gray-700 rounded-full animate-pulse" />
                  <div className="h-4 w-16 bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Loading indicator at bottom */}
      <div className="max-w-7xl mx-auto mt-8 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-bg-card border border-border-app rounded-full">
          <div className="w-5 h-5 border-2 border-accent-aqua border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-soft">Loading dashboard data...</span>
        </div>
      </div>
    </div>
  );
}
