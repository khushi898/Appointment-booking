// Helpers shared by every paginated list endpoint.

// page 1 -> skip 0, page 2 -> skip `limit`, ...
function getSkip(page, limit) {
  return (page - 1) * limit;
}

// Metadata the frontend needs to draw "Page 2 of 5" and next/prev buttons.
function buildPagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// Escapes characters that have special meaning in a regex, so user search
// text like "a.*" is matched literally and can't build an expensive pattern.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { getSkip, buildPagination, escapeRegex };
