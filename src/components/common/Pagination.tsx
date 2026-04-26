"use client";

import { useCallback, useState } from "react";

export type PageInfo = {
  cursor?: string | null;
  totalCount?: number;
};

type PaginationProps = {
  pageInfo: PageInfo;
  limit?: number;
  onCursorChange: (cursor: string | null) => void;
  className?: string;
};

function getPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  if (current <= 4)
    return [1, 2, 3, 4, 5, "...", total];

  if (current >= total - 3)
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];

  return [1, "...", current - 1, current, current + 1, "...", total];
}

export default function Pagination({
  pageInfo,
  limit = 10,
  onCursorChange,
  className,
}: PaginationProps) {
  // cursorHistory[i] is the cursor needed to reach page i+1.
  // cursorHistory[0] is always null (page 1 needs no cursor).
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [currentPage, setCurrentPage] = useState(1);

  const totalCount = pageInfo.totalCount ?? 0;
  const totalPages = limit > 0 ? Math.ceil(totalCount / limit) : 1;
  const hasPrev = currentPage > 1;
  // pageInfo.cursor is null/undefined when there are no more pages
  const hasNext = !!pageInfo.cursor && currentPage < totalPages;

  const navigate = useCallback(
    (page: number, cursor: string | null) => {
      setCurrentPage(page);
      onCursorChange(cursor);
    },
    [onCursorChange]
  );

  const handleNext = useCallback(() => {
    if (!hasNext || !pageInfo.cursor) return;
    const nextPage = currentPage + 1;
    // Save this cursor so we can return to this page later
    setCursorHistory((prev) => {
      const next = [...prev];
      next[nextPage - 1] = pageInfo.cursor!;
      return next;
    });
    navigate(nextPage, pageInfo.cursor);
  }, [hasNext, pageInfo.cursor, currentPage, navigate]);

  const handlePrev = useCallback(() => {
    if (!hasPrev) return;
    const prevPage = currentPage - 1;
    navigate(prevPage, cursorHistory[prevPage - 1] ?? null);
  }, [hasPrev, currentPage, cursorHistory, navigate]);

  const handlePage = useCallback(
    (page: number) => {
      if (page === currentPage || cursorHistory[page - 1] === undefined) return;
      navigate(page, cursorHistory[page - 1] ?? null);
    },
    [currentPage, cursorHistory, navigate]
  );

  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalCount);
  const pages = getPageRange(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-col items-center gap-4 sm:flex-row sm:justify-between ${className ?? ""}`}
    >
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Showing{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {start}–{end}
        </span>{" "}
        of{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {totalCount}
        </span>{" "}
        results
      </p>

      <div className="flex items-center gap-1">
        <PageButton
          onClick={handlePrev}
          disabled={!hasPrev}
          aria-label="Previous page"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </PageButton>

        {pages.map((page, i) =>
          page === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="flex h-9 w-9 items-center justify-center text-sm text-zinc-400"
            >
              …
            </span>
          ) : (
            <PageButton
              key={page}
              onClick={() => handlePage(page)}
              active={page === currentPage}
              disabled={page !== currentPage && cursorHistory[page - 1] === undefined}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </PageButton>
          )
        )}

        <PageButton
          onClick={handleNext}
          disabled={!hasNext}
          aria-label="Next page"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </PageButton>
      </div>
    </nav>
  );
}

type PageButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

function PageButton({ active, disabled, className, children, ...props }: PageButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={[
        "flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors",
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
        disabled && !active
          ? "cursor-not-allowed opacity-40"
          : "cursor-pointer",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}
