export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

export function parsePageParams(searchParams, { defaultSize = DEFAULT_PAGE_SIZE } = {}) {
  const pageRaw = Number(searchParams.get("page") || 1);
  const sizeRaw = Number(searchParams.get("pageSize") || defaultSize);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.isFinite(sizeRaw) && sizeRaw > 0 ? Math.floor(sizeRaw) : defaultSize)
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function paginatedResult({ items, total, page, pageSize }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  return {
    items,
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}
