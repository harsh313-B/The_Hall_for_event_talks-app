// JavaScript application logic for BigQuery Release Pulse

// State Management
let releaseNotes = [];
let activeFilter = 'all';
let searchQuery = '';

// DOM Elements
const notesContainer = document.getElementById('notesContainer');
const skeletonLoader = document.getElementById('skeletonLoader');
const emptyState = document.getElementById('emptyState');
const resultsCount = document.getElementById('resultsCount');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const filterChips = document.getElementById('filterChips');
const refreshBtnHeader = document.getElementById('refreshBtnHeader');
const refreshBtnHero = document.getElementById('refreshBtnHero');
const lastUpdatedBadge = document.getElementById('lastUpdatedBadge');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');

// Modal Elements
const tweetModal = document.getElementById('tweetModal');
const tweetUpdateType = document.getElementById('tweetUpdateType');
const tweetUpdateDate = document.getElementById('tweetUpdateDate');
const tweetUpdateContent = document.getElementById('tweetUpdateContent');
const tweetTextarea = document.getElementById('tweetTextarea');
const charCountLabel = document.getElementById('charCountLabel');
const progressCircle = document.getElementById('progressCircle');
const charCountWarning = document.getElementById('charCountWarning');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelTweetBtn = document.getElementById('cancelTweetBtn');
const submitTweetBtn = document.getElementById('submitTweetBtn');

// Progress Ring Configuration
const CIRCUMFERENCE = 2 * Math.PI * 14; // r=14 -> ~88px
progressCircle.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchNotes();
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    // Refresh buttons
    refreshBtnHeader.addEventListener('click', fetchNotes);
    refreshBtnHero.addEventListener('click', fetchNotes);
    
    // Search input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
        applyFiltersAndSearch();
    });
    
    // Clear search
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        applyFiltersAndSearch();
        searchInput.focus();
    });
    
    // Filter Chips
    filterChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        
        // Update active chip
        document.querySelectorAll('.chip').forEach(c => {
            c.classList.remove('active');
            c.setAttribute('aria-checked', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-checked', 'true');
        
        activeFilter = chip.dataset.filter;
        applyFiltersAndSearch();
    });
    
    // Reset filters empty state button
    resetFiltersBtn.addEventListener('click', resetSearchAndFilters);
    
    // Modal events
    closeModalBtn.addEventListener('click', closeTweetModal);
    cancelTweetBtn.addEventListener('click', closeTweetModal);
    tweetTextarea.addEventListener('input', updateCharCount);
    
    // Close modal on click outside card
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });
    
    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tweetModal.classList.contains('active')) {
            closeTweetModal();
        }
    });
}

// Reset Search & Filters
function resetSearchAndFilters() {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    
    document.querySelectorAll('.chip').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-checked', 'false');
    });
    const allChip = document.getElementById('filter-all');
    allChip.classList.add('active');
    allChip.setAttribute('aria-checked', 'true');
    activeFilter = 'all';
    
    applyFiltersAndSearch();
}

// Fetch Notes from API
async function fetchNotes() {
    // Set refreshing state
    setRefreshingState(true);
    
    try {
        const response = await fetch('/api/notes');
        const data = await response.json();
        
        if (data.success) {
            releaseNotes = data.notes;
            
            // Show toast if warning exists (e.g. using cache due to feed error)
            if (data.warning) {
                showToast(data.warning, 'warning');
            } else {
                showToast('Release notes synchronized successfully!', 'success');
            }
            
            // Update last updated timestamp
            const now = new Date();
            lastUpdatedBadge.textContent = `Synced: ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            
            // Render
            applyFiltersAndSearch();
        } else {
            showToast(`Error: ${data.error || 'Failed to fetch release notes'}`, 'error');
            setEmptyState(true);
        }
    } catch (error) {
        showToast(`Network error: ${error.message || 'Failed to reach server'}`, 'error');
        setEmptyState(true);
    } finally {
        setRefreshingState(false);
    }
}

// Set loading / refreshing state in UI
function setRefreshingState(isRefreshing) {
    if (isRefreshing) {
        refreshBtnHeader.querySelector('.icon-refresh').classList.add('spinning');
        refreshBtnHero.querySelector('.icon-refresh').classList.add('spinning');
        refreshBtnHeader.disabled = true;
        refreshBtnHero.disabled = true;
        
        // Show skeleton, hide feed
        skeletonLoader.style.display = 'grid';
        notesContainer.style.display = 'none';
        emptyState.style.display = 'none';
        resultsCount.textContent = 'Synchronizing with Google Cloud...';
    } else {
        refreshBtnHeader.querySelector('.icon-refresh').classList.remove('spinning');
        refreshBtnHero.querySelector('.icon-refresh').classList.remove('spinning');
        refreshBtnHeader.disabled = false;
        refreshBtnHero.disabled = false;
        
        skeletonLoader.style.display = 'none';
    }
}

// Filter and Search processor
function applyFiltersAndSearch() {
    let filteredEntries = [];
    let matchCount = 0;
    
    // Deep clone release notes structure to filter individual updates safely
    releaseNotes.forEach(entry => {
        const matchingUpdates = entry.updates.filter(update => {
            // Filter by type
            const matchesType = activeFilter === 'all' || update.type.toLowerCase() === activeFilter;
            
            // Filter by search query
            const matchesSearch = !searchQuery || 
                update.type.toLowerCase().includes(searchQuery) ||
                update.text.toLowerCase().includes(searchQuery) ||
                entry.date.toLowerCase().includes(searchQuery);
                
            return matchesType && matchesSearch;
        });
        
        if (matchingUpdates.length > 0) {
            filteredEntries.push({
                ...entry,
                updates: matchingUpdates
            });
            matchCount += matchingUpdates.length;
        }
    });
    
    // Update count label
    if (matchCount === 0) {
        resultsCount.textContent = 'No updates match your criteria';
        setEmptyState(true);
    } else {
        resultsCount.textContent = `Showing ${matchCount} updates across ${filteredEntries.length} release dates`;
        setEmptyState(false);
        renderNotes(filteredEntries);
    }
}

// Set empty state display
function setEmptyState(isEmpty) {
    if (isEmpty) {
        notesContainer.style.display = 'none';
        emptyState.style.display = 'flex';
    } else {
        notesContainer.style.display = 'grid';
        emptyState.style.display = 'none';
    }
}

// Render release notes into cards
function renderNotes(entries) {
    notesContainer.innerHTML = '';
    
    entries.forEach(entry => {
        // Create Date Group Container
        const dateGroup = document.createElement('div');
        dateGroup.className = 'date-group';
        
        // Date Header
        const dateHeader = document.createElement('h2');
        dateHeader.className = 'date-heading';
        dateHeader.textContent = entry.date;
        dateGroup.appendChild(dateHeader);
        
        // Updates under this date
        entry.updates.forEach(update => {
            const card = document.createElement('article');
            card.className = 'update-card';
            card.id = update.id;
            
            // Header: Badge & Date
            const header = document.createElement('header');
            header.className = 'card-header';
            
            const badgeType = update.type.toLowerCase();
            const badgeClass = `badge badge-${badgeType === 'feature' ? 'feature' : badgeType === 'issue' ? 'issue' : badgeType === 'changed' ? 'changed' : badgeType === 'deprecation' ? 'deprecation' : 'general'}`;
            
            const badge = document.createElement('span');
            badge.className = badgeClass;
            badge.textContent = update.type;
            
            const dateSpan = document.createElement('span');
            dateSpan.className = 'card-date';
            dateSpan.textContent = entry.date;
            
            header.appendChild(badge);
            header.appendChild(dateSpan);
            card.appendChild(header);
            
            // Body: Rich HTML content
            const body = document.createElement('div');
            body.className = 'card-body';
            body.innerHTML = update.html;
            card.appendChild(body);
            
            // Footer Action Buttons
            const actions = document.createElement('footer');
            actions.className = 'card-actions';
            
            // Copy text button
            const copyBtn = document.createElement('button');
            copyBtn.className = 'btn btn-secondary';
            copyBtn.title = 'Copy update text';
            copyBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy</span>
            `;
            copyBtn.addEventListener('click', () => {
                copyToClipboard(update.text, 'Update text copied to clipboard!');
            });
            
            // Share/Tweet button
            const tweetBtn = document.createElement('button');
            tweetBtn.className = 'btn btn-primary';
            tweetBtn.title = 'Tweet this update';
            tweetBtn.innerHTML = `
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>Tweet</span>
            `;
            tweetBtn.addEventListener('click', () => {
                openTweetComposer(update.type, entry.date, update.text, entry.link);
            });
            
            actions.appendChild(copyBtn);
            actions.appendChild(tweetBtn);
            card.appendChild(actions);
            
            dateGroup.appendChild(card);
        });
        
        notesContainer.appendChild(dateGroup);
    });
}

// Copy to Clipboard Utility
function copyToClipboard(text, successMessage) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMessage, 'success');
        }).catch(err => {
            showToast('Failed to copy text automatically.', 'error');
        });
    } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed'; // Avoid scrolling
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showToast(successMessage, 'success');
        } catch (err) {
            showToast('Failed to copy text.', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// Custom Toast System
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Status Icon
    let icon = '';
    if (type === 'success') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-green)"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-red)"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else if (type === 'warning') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-deprecation-text)"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    }
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            ${icon}
            <span style="font-size: 0.9rem; font-weight: 500;">${message}</span>
        </div>
        <button class="toast-close" aria-label="Close toast">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    
    // Close on click close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
        setTimeout(() => toast.remove(), 300);
    });
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// Tweet Composer Mechanics
function openTweetComposer(type, date, text, link) {
    // Determine Emoji
    const emojiMap = {
        'feature': '🚀',
        'issue': '⚠️',
        'changed': '🔄',
        'deprecation': '🛑',
        'general': '📢'
    };
    const emoji = emojiMap[type.toLowerCase()] || '📢';
    
    // Format UI Preview
    tweetUpdateType.className = `badge badge-${type.toLowerCase()}`;
    tweetUpdateType.textContent = type;
    tweetUpdateDate.textContent = date;
    
    // Truncate preview text
    const displayPreview = text.length > 200 ? text.substring(0, 197) + "..." : text;
    tweetUpdateContent.textContent = displayPreview;
    
    // Calculate and generate initial Tweet text
    const tweetText = generateTweetText(type, date, text, link, emoji);
    tweetTextarea.value = tweetText;
    
    // Display Modal
    tweetModal.style.display = 'flex';
    // Small delay to trigger CSS transition
    setTimeout(() => {
        tweetModal.classList.add('active');
        tweetTextarea.focus();
        updateCharCount();
    }, 10);
    
    // Setup Submission Click (Removes old listeners)
    const newSubmitBtn = submitTweetBtn.cloneNode(true);
    submitTweetBtn.parentNode.replaceChild(newSubmitBtn, submitTweetBtn);
    
    newSubmitBtn.addEventListener('click', () => {
        const textToTweet = tweetTextarea.value;
        const charCount = getTwitterCharCount(textToTweet);
        
        if (charCount > 280) {
            showToast('Cannot tweet: Text exceeds 280 characters limit.', 'error');
            return;
        }
        
        const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToTweet)}`;
        window.open(twitterIntentUrl, '_blank', 'noopener,noreferrer');
        closeTweetModal();
        showToast('Redirected to X/Twitter web intent!', 'success');
    });
}

// Close Modal
function closeTweetModal() {
    tweetModal.classList.remove('active');
    setTimeout(() => {
        tweetModal.style.display = 'none';
    }, 250);
}

// Character Limit Math
// Twitter handles URLs as exactly 23 characters
function getTwitterCharCount(text) {
    // Match URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    
    let length = text.replace(urlRegex, '').length;
    // Every url counts as 23 characters
    length += urls.length * 23;
    
    return length;
}

// Calculate pre-truncated text for tweet
function generateTweetText(type, date, text, link, emoji) {
    const header = `${emoji} BigQuery ${type} (${date}):\n\n`;
    const hashtags = `\n\n#BigQuery #GoogleCloud`;
    
    // 23 characters for Twitter URL mapping
    const dummyUrlLen = 23;
    const urlTextLen = `\nRead more: `.length + dummyUrlLen;
    
    const maxDescLen = 280 - header.length - hashtags.length - urlTextLen;
    
    let description = text.replace(/\s+/g, ' ').trim();
    if (description.length > maxDescLen) {
        description = description.substring(0, maxDescLen - 3) + "...";
    }
    
    return `${header}${description}\n\nRead more: ${link}${hashtags}`;
}

// Dynamic Character counter and SVG Progress updater
function updateCharCount() {
    const text = tweetTextarea.value;
    const count = getTwitterCharCount(text);
    const remaining = 280 - count;
    
    charCountLabel.textContent = remaining;
    
    // Disable submit if character count is over 280 or empty
    const submitBtn = document.querySelector('#tweetModal .btn-primary');
    if (count > 280 || count === 0) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
    } else {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    }
    
    // Handle Warning Text
    if (count > 280) {
        charCountWarning.style.display = 'block';
        charCountLabel.style.color = 'var(--accent-red)';
    } else {
        charCountWarning.style.display = 'none';
        charCountLabel.style.color = 'var(--text-secondary)';
    }
    
    // Progress Circle animation
    const percentage = Math.min(100, (count / 280) * 100);
    const offset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;
    progressCircle.style.strokeDashoffset = offset;
    
    // Circle Color adjustment
    if (count > 280) {
        progressCircle.style.stroke = 'var(--accent-red)';
    } else if (remaining <= 20) {
        progressCircle.style.stroke = 'var(--color-deprecation-text)'; // Yellow warning
    } else {
        progressCircle.style.stroke = 'var(--accent-blue)';
    }
}
