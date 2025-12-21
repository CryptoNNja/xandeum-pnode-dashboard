"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/hooks/useTheme";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const { theme, mounted } = useTheme();
  const isLight = mounted ? theme === "light" : false;
  const [pageSizeMenuOpen, setPageSizeMenuOpen] = useState(false);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={clsx(
        "flex items-center justify-between px-6 py-4 border-t transition-colors",
        isLight ? "border-black/10 bg-black/5" : "border-border-app bg-bg-bg2"
      )}
    >
      {/* Left: Items info */}
      <div className="flex items-center gap-4">
        <p className="text-sm text-text-soft">
          Showing <span className="font-semibold text-text-main">{startItem}</span> to{" "}
          <span className="font-semibold text-text-main">{endItem}</span> of{" "}
          <span className="font-semibold text-text-main">{totalItems}</span> nodes
        </p>

        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-soft uppercase tracking-wider font-bold">
            Per page:
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setPageSizeMenuOpen((prev) => !prev)}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold cursor-pointer transition-colors",
                isLight
                  ? "bg-white border-black/20 text-black hover:border-black/40"
                  : "bg-bg-card border-border-app text-text-main hover:border-accent-aqua/50"
              )}
            >
              <span>{pageSize}</span>
              <ChevronDown className={clsx("w-4 h-4 transition-transform", pageSizeMenuOpen ? "rotate-180" : "rotate-0")} />
            </button>
            {pageSizeMenuOpen && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setPageSizeMenuOpen(false)}
                />
                {/* Dropdown menu */}
                <div className="absolute left-0 bottom-full mb-2 w-24 rounded-xl border border-border-app bg-bg-card/95 backdrop-blur-md shadow-2xl z-50 overflow-hidden">
                  {[25, 50, 100].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        onPageSizeChange(size);
                        setPageSizeMenuOpen(false);
                      }}
                      className={clsx(
                        "w-full px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between",
                        pageSize === size
                          ? "text-accent-aqua bg-accent-aqua/10"
                          : "text-text-main hover:bg-bg-bg2"
                      )}
                    >
                      <span>{size}</span>
                      {pageSize === size && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Page navigation */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={clsx(
            "p-2 rounded-lg border transition-all duration-200",
            currentPage === 1
              ? "opacity-30 cursor-not-allowed"
              : isLight
              ? "border-black/20 hover:bg-black/5 hover:border-black/40"
              : "border-border-app hover:bg-bg-card hover:border-accent-aqua/50"
          )}
        >
          <ChevronLeft className="w-4 h-4 text-text-main" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, idx) => {
            if (page === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-text-soft">
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={clsx(
                  "min-w-[36px] h-9 px-3 rounded-lg text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-accent-aqua text-white shadow-lg shadow-accent-aqua/30"
                    : isLight
                    ? "text-black/70 hover:bg-black/5 border border-black/10"
                    : "text-text-soft hover:bg-bg-card hover:text-text-main border border-border-app"
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={clsx(
            "p-2 rounded-lg border transition-all duration-200",
            currentPage === totalPages
              ? "opacity-30 cursor-not-allowed"
              : isLight
              ? "border-black/20 hover:bg-black/5 hover:border-black/40"
              : "border-border-app hover:bg-bg-card hover:border-accent-aqua/50"
          )}
        >
          <ChevronRight className="w-4 h-4 text-text-main" />
        </button>
      </div>
    </div>
  );
};
