import {
    clearHistory,
    fetchHistory as fetchHistoryApi,
    fetchRandomQuote,
    toggleFavorite,
} from "./api.js";
import { refs } from "./dom.js";
import { renderHistoryList } from "./history.js";
import { toggleSpeech } from "./speech.js";
import { GRADIENTS } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
    let currentQuoteId = null;
    let currentQuote = "The only way to do great work is to love what you do.";
    let currentAuthor = "Steve Jobs";
    let isCurrentFavorite = false;

    let historyData = [];
    let drawerTabFilter = "all";

    refs.toggleHistoryBtn.addEventListener("click", openDrawer);
    refs.closeHistoryBtn.addEventListener("click", closeDrawer);
    refs.historyOverlay.addEventListener("click", closeDrawer);

    function openDrawer() {
        refs.historyDrawer.classList.add("active");
        refs.historyOverlay.classList.add("active");
        loadHistory();
    }

    function closeDrawer() {
        refs.historyDrawer.classList.remove("active");
        refs.historyOverlay.classList.remove("active");
    }

    refs.tabAllHistory.addEventListener("click", () => {
        refs.tabAllHistory.classList.add("active");
        refs.tabFavHistory.classList.remove("active");
        drawerTabFilter = "all";
        renderDrawer();
    });

    refs.tabFavHistory.addEventListener("click", () => {
        refs.tabFavHistory.classList.add("active");
        refs.tabAllHistory.classList.remove("active");
        drawerTabFilter = "favorites";
        renderDrawer();
    });

    function renderDrawer() {
        renderHistoryList(historyData, drawerTabFilter, toggleFavoriteStatus);
    }

    async function loadHistory() {
        try {
            historyData = await fetchHistoryApi();
            refs.historyCount.textContent = historyData.length;
            renderDrawer();
        } catch (error) {
            console.error("Error fetching history:", error);
            refs.historyList.innerHTML =
                '<p class="empty-history" style="color: #ef4444;">Failed to load logs.</p>';
        }
    }

    async function toggleFavoriteStatus(id, isFavorite) {
        try {
            const updated = await toggleFavorite(id, isFavorite);
            historyData = historyData.map((item) => (item.id === id ? updated : item));

            if (id === currentQuoteId) {
                isCurrentFavorite = updated.is_favorite;
                updateMainFavBtn();
            }

            renderDrawer();
        } catch (error) {
            console.error("Error toggling favorite:", error);
            alert("Failed to update favorite.");
        }
    }

    function updateMainFavBtn() {
        const icon = refs.favoriteBtn.querySelector("i");
        if (isCurrentFavorite) {
            refs.favoriteBtn.classList.add("active");
            icon.className = "fa-solid fa-star";
            refs.favBtnLabel.textContent = "Favorited";
        } else {
            refs.favoriteBtn.classList.remove("active");
            icon.className = "fa-regular fa-star";
            refs.favBtnLabel.textContent = "Favorite";
        }
    }

    refs.favoriteBtn.addEventListener("click", async () => {
        if (currentQuoteId) {
            await toggleFavoriteStatus(currentQuoteId, !isCurrentFavorite);
        }
    });

    refs.readBtn.addEventListener("click", () => {
        toggleSpeech(refs.readBtn, currentQuote, currentAuthor);
    });

    async function generateNewQuote() {
        refs.generateBtn.disabled = true;
        const icon = refs.generateBtn.querySelector("i");
        icon.className = "fa-solid fa-spinner fa-spin";

        refs.quoteText.style.opacity = "0";
        refs.quoteText.style.transform = "translateY(15px)";
        refs.quoteAuthor.style.opacity = "0";

        const randomGradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
        refs.bgSweep.style.background = randomGradient;

        try {
            const data = await fetchRandomQuote();

            setTimeout(() => {
                currentQuoteId = data.id;
                currentQuote = data.quote;
                currentAuthor = data.author;
                isCurrentFavorite = data.is_favorite;

                refs.quoteText.textContent = currentQuote;
                refs.quoteAuthor.textContent = `\u2014 ${currentAuthor}`;

                updateMainFavBtn();

                refs.quoteText.style.opacity = "1";
                refs.quoteText.style.transform = "translateY(0)";
                refs.quoteAuthor.style.opacity = "0.85";

                fetchHistoryCount();
            }, 300);
        } catch (error) {
            console.error("Error generating quote:", error);
            refs.quoteText.style.opacity = "1";
            refs.quoteText.style.transform = "translateY(0)";
            refs.quoteAuthor.style.opacity = "0.85";
        } finally {
            setTimeout(() => {
                refs.generateBtn.disabled = false;
                icon.className = "fa-solid fa-wand-magic-sparkles";
            }, 300);
        }
    }

    async function fetchHistoryCount() {
        try {
            const history = await fetchHistoryApi();
            refs.historyCount.textContent = history.length;
        } catch (error) {
            console.error(error);
        }
    }

    refs.copyBtn.addEventListener("click", async () => {
        const fullText = `"${currentQuote}" \u2014 ${currentAuthor}`;

        try {
            await navigator.clipboard.writeText(fullText);

            refs.copyText.textContent = "Copied!";
            const icon = refs.copyBtn.querySelector("i");
            icon.className = "fa-solid fa-check";
            icon.style.color = "#4ade80";

            setTimeout(() => {
                refs.copyText.textContent = "Copy";
                icon.className = "fa-regular fa-copy";
                icon.style.color = "";
            }, 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    });

    refs.clearHistoryBtn.addEventListener("click", async () => {
        if (confirm("Are you sure you want to clear your inspiration logs?")) {
            try {
                await clearHistory();

                refs.historyList.innerHTML = `
                    <div class="empty-history">
                        <p>No quotes in history yet.</p>
                    </div>
                `;
                refs.historyCount.textContent = "0";

                isCurrentFavorite = false;
                updateMainFavBtn();

                alert("History logs cleared.");
            } catch (error) {
                console.error(error);
            }
        }
    });

    generateNewQuote();

    if ("speechSynthesis" in window) {
        window.speechSynthesis.getVoices();
    }
});
