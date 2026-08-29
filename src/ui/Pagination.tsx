interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  const canPrev = page > 1
  const canNext = page < totalPages

  if (totalPages <= 1) return null

  return (
    <div className="pagination">
      <button
        type="button"
        className="pagination__btn"
        disabled={!canPrev}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        ← Previous
      </button>

      <span className="pagination__info">
        Page {page} of {totalPages}
      </span>

      <button
        type="button"
        className="pagination__btn"
        disabled={!canNext}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        Next →
      </button>
    </div>
  )
}
