async function request(url, options, errorMessage) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(errorMessage);
    }
    return response.json();
}

export function fetchRandomQuote() {
    return request("/api/quote/random", {}, "Failed to fetch quote");
}

export function fetchHistory() {
    return request("/api/quotes/history", {}, "Failed to fetch history");
}

export function toggleFavorite(id, isFavorite) {
    return request(
        `/api/quotes/history/${id}`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_favorite: isFavorite }),
        },
        "Failed to update favorite status"
    );
}

export function clearHistory() {
    return request("/api/quotes/history", { method: "DELETE" }, "Failed to clear history");
}
