document.addEventListener('DOMContentLoaded', () => {
    // Buttons
    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const copyText = document.getElementById('copy-text');
    const favoriteBtn = document.getElementById('favorite-btn');
    const readBtn = document.getElementById('read-btn');
    
    // Drawer buttons & tabs
    const toggleHistoryBtn = document.getElementById('toggle-history-btn');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const tabAllHistory = document.getElementById('tab-all-history');
    const tabFavHistory = document.getElementById('tab-fav-history');

    // Layout
    const quoteText = document.getElementById('quote-text');
    const quoteAuthor = document.getElementById('quote-author');
    const historyDrawer = document.getElementById('history-drawer');
    const historyOverlay = document.getElementById('history-overlay');
    const historyList = document.getElementById('history-list');
    const historyCount = document.getElementById('history-count');
    const bgSweep = document.getElementById('bg-sweep');

    let currentQuoteId = null;
    let currentQuote = "The only way to do great work is to love what you do.";
    let currentAuthor = "Steve Jobs";
    let isCurrentFavorite = false;
    
    let historyData = [];
    let drawerTabFilter = 'all'; // 'all' or 'favorites'

    // Zen Background Sweeps List
    const gradients = [
        'linear-gradient(135deg, #05040a, #030712, #040d1a)',
        'linear-gradient(135deg, #0a0410, #03141a, #05050f)',
        'linear-gradient(135deg, #021217, #09031a, #030308)',
        'linear-gradient(135deg, #0f050b, #040a17, #02070f)',
        'linear-gradient(135deg, #080315, #14050a, #03040c)',
        'linear-gradient(135deg, #021510, #040c14, #040409)'
    ];

    // Drawer Toggles
    toggleHistoryBtn.addEventListener('click', openDrawer);
    closeHistoryBtn.addEventListener('click', closeDrawer);
    historyOverlay.addEventListener('click', closeDrawer);

    function openDrawer() {
        historyDrawer.classList.add('active');
        historyOverlay.classList.add('active');
        fetchHistory();
    }

    function closeDrawer() {
        historyDrawer.classList.remove('active');
        historyOverlay.classList.remove('active');
    }

    // Drawer Tabs Filters
    tabAllHistory.addEventListener('click', () => {
        tabAllHistory.classList.add('active');
        tabFavHistory.classList.remove('active');
        drawerTabFilter = 'all';
        renderHistoryList(historyData);
    });

    tabFavHistory.addEventListener('click', () => {
        tabFavHistory.classList.add('active');
        tabAllHistory.classList.remove('active');
        drawerTabFilter = 'favorites';
        renderHistoryList(historyData);
    });

    // Fetch history logs
    async function fetchHistory() {
        try {
            const response = await fetch('/api/quotes/history');
            if (!response.ok) throw new Error('Failed to fetch history');

            historyData = await response.json();
            historyCount.textContent = historyData.length;
            renderHistoryList(historyData);
        } catch (error) {
            console.error('Error fetching history:', error);
            historyList.innerHTML = '<p class="empty-history" style="color: #ef4444;">Failed to load logs.</p>';
        }
    }

    // Render history items in drawer
    function renderHistoryList(history) {
        historyList.innerHTML = '';
        
        const filtered = drawerTabFilter === 'all'
            ? history
            : history.filter(item => item.is_favorite);

        if (filtered.length === 0) {
            const msg = drawerTabFilter === 'all' 
                ? 'No quotes generated yet.' 
                : 'No favorite quotes saved yet.';
            historyList.innerHTML = `
                <div class="empty-history">
                    <p>${msg}</p>
                </div>
            `;
            return;
        }

        filtered.forEach(item => {
            const card = document.createElement('div');
            card.className = 'history-item-card';

            card.innerHTML = `
                <p class="history-quote-text">“${escapeHTML(item.quote)}”</p>
                <div class="history-quote-footer">
                    <span class="history-quote-author">— ${escapeHTML(item.author)}</span>
                    <div class="history-right-meta">
                        <span class="history-quote-time">${formatTime(item.timestamp)}</span>
                        <button class="history-fav-toggle-btn ${item.is_favorite ? 'active' : ''}" title="Favorite">
                            <i class="${item.is_favorite ? 'fa-solid' : 'fa-regular'} fa-star"></i>
                        </button>
                    </div>
                </div>
            `;

            // Inline Favorite toggle button in drawer
            const favToggle = card.querySelector('.history-fav-toggle-btn');
            favToggle.addEventListener('click', async (e) => {
                e.stopPropagation();
                await toggleFavoriteStatus(item.id, !item.is_favorite);
            });

            historyList.appendChild(card);
        });
    }

    // Toggle Favorite Action
    async function toggleFavoriteStatus(id, isFav) {
        try {
            const response = await fetch(`/api/quotes/history/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_favorite: isFav })
            });

            if (!response.ok) throw new Error('Failed to update favorite status');
            const updated = await response.json();

            // Update local state list
            historyData = historyData.map(item => item.id === id ? updated : item);
            
            // If the updated quote is currently shown on the main display, update main display star
            if (id === currentQuoteId) {
                isCurrentFavorite = updated.is_favorite;
                updateMainFavBtn();
            }

            renderHistoryList(historyData);
        } catch (error) {
            console.error('Error toggling favorite:', error);
            alert('Failed to update favorite.');
        }
    }

    // Update main display card Favorite button state
    function updateMainFavBtn() {
        if (isCurrentFavorite) {
            favoriteBtn.classList.add('active');
            favoriteBtn.querySelector('i').className = 'fa-solid fa-star';
            document.getElementById('fav-btn-label').textContent = 'Favorited';
        } else {
            favoriteBtn.classList.remove('active');
            favoriteBtn.querySelector('i').className = 'fa-regular fa-star';
            document.getElementById('fav-btn-label').textContent = 'Favorite';
        }
    }

    // Favorite Button click handler
    favoriteBtn.addEventListener('click', async () => {
        if (currentQuoteId) {
            await toggleFavoriteStatus(currentQuoteId, !isCurrentFavorite);
        }
    });

    // Text to Speech (TTS) Audio Reader
    readBtn.addEventListener('click', () => {
        if ('speechSynthesis' in window) {
            // Cancel any current speaking
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
                readBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Listen';
                readBtn.classList.remove('active');
                return;
            }

            const textToSpeak = `"${currentQuote}" by ${currentAuthor}`;
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            
            // Attempt to find a clean English voice
            const voices = window.speechSynthesis.getVoices();
            const englishVoice = voices.find(v => v.lang.includes('en-') && v.name.includes('Natural')) || 
                                 voices.find(v => v.lang.includes('en-')) || 
                                 voices[0];
            
            if (englishVoice) utterance.voice = englishVoice;
            utterance.rate = 0.9;  // Speak slightly slower for calm zen feel
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Update UI during speech
            utterance.onstart = () => {
                readBtn.innerHTML = '<i class="fa-solid fa-volume-high fa-beat"></i> Reading...';
                readBtn.classList.add('active');
            };

            utterance.onend = () => {
                readBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Listen';
                readBtn.classList.remove('active');
            };

            utterance.onerror = () => {
                readBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Listen';
                readBtn.classList.remove('active');
            };

            window.speechSynthesis.speak(utterance);
        } else {
            alert('Your browser does not support audio speech synthesis.');
        }
    });

    // Fetch random quote
    async function generateNewQuote() {
        generateBtn.disabled = true;
        const icon = generateBtn.querySelector('i');
        icon.className = 'fa-solid fa-spinner fa-spin';

        // Animate fade out
        quoteText.style.opacity = '0';
        quoteText.style.transform = 'translateY(15px)';
        quoteAuthor.style.opacity = '0';

        // Trigger dynamic color sweep transition
        const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
        bgSweep.style.background = randomGradient;

        try {
            const response = await fetch('/api/quote/random');
            if (!response.ok) throw new Error('Failed to fetch quote');

            const data = await response.json();
            
            setTimeout(() => {
                currentQuoteId = data.id;
                currentQuote = data.quote;
                currentAuthor = data.author;
                isCurrentFavorite = data.is_favorite;

                quoteText.textContent = currentQuote;
                quoteAuthor.textContent = `— ${currentAuthor}`;

                // Update Favorite button
                updateMainFavBtn();

                // Fade back in
                quoteText.style.opacity = '1';
                quoteText.style.transform = 'translateY(0)';
                quoteAuthor.style.opacity = '0.85';
                
                fetchHistoryCount();
            }, 300);

        } catch (error) {
            console.error('Error generating quote:', error);
            quoteText.style.opacity = '1';
            quoteText.style.transform = 'translateY(0)';
            quoteAuthor.style.opacity = '0.85';
        } finally {
            setTimeout(() => {
                generateBtn.disabled = false;
                icon.className = 'fa-solid fa-wand-magic-sparkles';
            }, 300);
        }
    }

    // Fetch count badge
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
            console.error('Failed to copy:', err);
        }
    });

    // Clear Quote History
    clearHistoryBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear your inspiration logs?')) {
            try {
                const response = await fetch('/api/quotes/history', {
                    method: 'DELETE'
                });

                if (!response.ok) throw new Error('Failed to clear history');

                historyList.innerHTML = `
                    <div class="empty-history">
                        <p>No quotes in history yet.</p>
                    </div>
                `;
                historyCount.textContent = '0';
                
                // Reset main quote favorite flag
                isCurrentFavorite = false;
                updateMainFavBtn();
                
                alert('History logs cleared.');
            } catch (error) {
                console.error(e);
            }
        }
    });

    // Convert SQL timestamp string to local time format
    function formatTime(timestampStr) {
        try {
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

    // Helper to escape HTML characters
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Init
    generateNewQuote();
    
    // Trigger window speech synthesis voice list fetch (needed on Chrome/Safari initialization)
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
    }
});
