document.addEventListener('DOMContentLoaded', () => {
    // Buttons
    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const copyText = document.getElementById('copy-text');
    const toggleHistoryBtn = document.getElementById('toggle-history-btn');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    // Containers & Layout
    const quoteCard = document.getElementById('quote-card');
    const quoteText = document.getElementById('quote-text');
    const quoteAuthor = document.getElementById('quote-author');
    const historyDrawer = document.getElementById('history-drawer');
    const historyOverlay = document.getElementById('history-overlay');
    const historyList = document.getElementById('history-list');
    const historyCount = document.getElementById('history-count');

    let currentQuote = "The only way to do great work is to love what you do.";
    let currentAuthor = "Steve Jobs";

    // Drawer Toggle Logic
    toggleHistoryBtn.addEventListener('click', openDrawer);
    closeHistoryBtn.addEventListener('click', closeDrawer);
    historyOverlay.addEventListener('click', closeDrawer);

    function openDrawer() {
        historyDrawer.classList.add('active');
        historyOverlay.classList.add('active');
        fetchHistory(); // Refresh history whenever it opens
    }

    function closeDrawer() {
        historyDrawer.classList.remove('active');
        historyOverlay.classList.remove('active');
    }

    // Fetch and display quote history list
    async function fetchHistory() {
        try {
            const response = await fetch('/api/quotes/history');
            if (!response.ok) throw new Error('Failed to fetch history');

            const history = await response.json();
            
            // Update history badge count
            historyCount.textContent = history.length;

            renderHistoryList(history);
        } catch (error) {
            console.error('Error fetching history:', error);
            historyList.innerHTML = '<p class="empty-history" style="color: #ef4444;">Failed to load logs.</p>';
        }
    }

    // Render history items in drawer
    function renderHistoryList(history) {
        historyList.innerHTML = '';

        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <p>No quotes in history yet.</p>
                </div>
            `;
            return;
        }

        history.forEach(item => {
            const card = document.createElement('div');
            card.className = 'history-item-card';

            card.innerHTML = `
                <p class="history-quote-text">“${escapeHTML(item.quote)}”</p>
                <div class="history-quote-footer">
                    <span class="history-quote-author">— ${escapeHTML(item.author)}</span>
                    <span class="history-quote-time">${formatTime(item.timestamp)}</span>
                </div>
            `;

            historyList.appendChild(card);
        });
    }

    // Format SQLite timestamp to readable relative/absolute time
    function formatTime(timestampStr) {
        try {
            // Convert to date. SQLite timestamp is usually 'YYYY-MM-DD HH:MM:SS'
            const date = new Date(timestampStr.replace(' ', 'T') + 'Z');
            if (isNaN(date.getTime())) return timestampStr;
            
            return date.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return timestampStr;
        }
    }

    // Fetch random quote
    async function generateNewQuote() {
        generateBtn.disabled = true;
        const icon = generateBtn.querySelector('i');
        icon.className = 'fa-solid fa-spinner fa-spin';

        // Fade out animation
        quoteText.style.opacity = '0';
        quoteText.style.transform = 'translateY(15px)';
        quoteAuthor.style.opacity = '0';

        try {
            const response = await fetch('/api/quote/random');
            if (!response.ok) throw new Error('Failed to fetch quote');

            const data = await response.json();
            
            // Set timeout to let fade-out finish before changing text
            setTimeout(() => {
                currentQuote = data.quote;
                currentAuthor = data.author;

                quoteText.textContent = currentQuote;
                quoteAuthor.textContent = `— ${currentAuthor}`;

                // Fade back in
                quoteText.style.opacity = '1';
                quoteText.style.transform = 'translateY(0)';
                quoteAuthor.style.opacity = '0.85';
                
                // Refresh count badge in header
                fetchHistoryCount();
            }, 300);

        } catch (error) {
            console.error('Error generating quote:', error);
            alert('Failed to fetch a new quote. Check your internet connection.');
            // Revert opacity on fail
            quoteText.style.opacity = '1';
            quoteText.style.transform = 'translateY(0)';
            quoteAuthor.style.opacity = '0.85';
        } finally {
            // Restore button state after animation delay
            setTimeout(() => {
                generateBtn.disabled = false;
                icon.className = 'fa-solid fa-wand-magic-sparkles';
            }, 300);
        }
    }

    // Fetch count only for the badge
    async function fetchHistoryCount() {
        try {
            const response = await fetch('/api/quotes/history');
            if (response.ok) {
                const history = await response.json();
                historyCount.textContent = history.length;
            }
        } catch (e) {
            console.error(e);
        }
    }

    // Copy current quote to clipboard
    copyBtn.addEventListener('click', async () => {
        const fullText = `"${currentQuote}" — ${currentAuthor}`;
        
        try {
            await navigator.clipboard.writeText(fullText);
            
            // Copy feedback state
            copyText.textContent = "Copied!";
            const icon = copyBtn.querySelector('i');
            icon.className = "fa-solid fa-check";
            icon.style.color = "#4ade80";

            setTimeout(() => {
                copyText.textContent = "Copy";
                icon.className = "fa-regular fa-copy";
                icon.style.color = "";
            }, 2000);

        } catch (err) {
            console.error('Failed to copy text:', err);
            alert('Could not copy quote to clipboard.');
        }
    });

    // Clear Quote History
    clearHistoryBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear your entire inspiration history?')) {
            try {
                const response = await fetch('/api/quotes/history', {
                    method: 'DELETE'
                });

                if (!response.ok) throw new Error('Failed to clear history');

                // Clear UI
                historyList.innerHTML = `
                    <div class="empty-history">
                        <p>No quotes in history yet.</p>
                    </div>
                `;
                historyCount.textContent = '0';
                alert('History cleared successfully.');
            } catch (error) {
                console.error('Error clearing history:', error);
                alert('Failed to clear history. Please try again.');
            }
        }
    });

    // Generate handler
    generateBtn.addEventListener('click', generateNewQuote);

    // Escape HTML strings helper
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Initial load setup
    fetchHistoryCount();
});
