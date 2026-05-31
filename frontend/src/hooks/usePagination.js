import { useEffect, useMemo, useState } from "react";

/**
 * Client-side pagination for array data.
 * Pass `resetKey` (e.g. filter string) to jump back to page 1 when filters change.
 */
export function usePagination(items, { perPage: initialPerPage = 10, resetKey } = {}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);
  const list = Array.isArray(items) ? items : [];
  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage) || 1);
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    if (totalItems === 0) return [];
    const start = (safePage - 1) * perPage;
    return list.slice(start, start + perPage);
  }, [list, safePage, perPage, totalItems]);

  const rowOffset = (safePage - 1) * perPage;

  return {
    page: safePage,
    setPage,
    perPage,
    setPerPage,
    totalPages,
    totalItems,
    paginatedItems,
    rowOffset,
  };
}
