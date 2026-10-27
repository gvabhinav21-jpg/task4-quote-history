import { refs } from "./dom.js";
import { escapeHTML, formatTime } from "./utils.js";

export function renderHistoryList(history, filter, onToggleFavorite) {
    refs.historyList.innerHTML = "";

    const filtered = filter === "all" ? history : history.filter((item) => item.is_favorite);

    if (filtered.length === 0) {
        const message =
            filter === "all" ? "No quotes generated yet." : "No favorite quotes saved yet.";
        refs.historyList.innerHTML = `
            <div class="empty-history">
                <p>${message}</p>
            </div>
        `;
        return;
    }

    filtered.forEach((item) => {
        const card = document.createElement("div");
        card.className = "history-item-card";

        card.innerHTML = `
            <p class="history-quote-text">\u201c${escapeHTML(item.quote)}\u201d</p>
            <div class="history-quote-footer">
                <span class="history-quote-author">\u2014 ${escapeHTML(item.author)}</span>
                <div class="history-right-meta">
                    <span class="history-quote-time">${formatTime(item.timestamp)}</span>
                    <button class="history-fav-toggle-btn ${item.is_favorite ? "active" : ""}" title="Favorite">
                        <i class="${item.is_favorite ? "fa-solid" : "fa-regular"} fa-star"></i>
                    </button>
                </div>
            </div>
        `;

        const favoriteToggle = card.querySelector(".history-fav-toggle-btn");
        favoriteToggle.addEventListener("click", async (event) => {
            event.stopPropagation();
            await onToggleFavorite(item.id, !item.is_favorite);
        });

        refs.historyList.appendChild(card);
    });
}
