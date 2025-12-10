/**
 * eternity.js - Like/Dislike System for Patcher Dev's Portfolio
 * 
 * WEBHOOK SETUP:
 * 1. Create a Discord webhook or use webhook.site
 * 2. Copy your webhook URL
 * 3. Replace the WEBHOOK_URL below with your actual URL
 * 
 * Discord Webhook Example: "https://discord.com/api/webhooks/123456789/abcdefghijklmnopqrstuvwxyz"
 * Webhook.site Example: "https://webhook.site/your-unique-id"
 */

// ============ CONFIGURATION ============
// REPLACE THIS WITH YOUR ACTUAL WEBHOOK URL
const WEBHOOK_URL = "https://webhook.site/bd193bfe-77d8-4a9f-ab97-009f680a3006";
// =======================================

// Storage keys
const STORAGE_KEY = 'patcherdev_reactions';
const USER_REACTION_KEY = 'patcherdev_user_reaction';

class ReactionSystem {
    constructor() {
        this.likes = 0;
        this.dislikes = 0;
        this.userReaction = null; // 'like', 'dislike', or null
        
        this.likeBtn = document.getElementById('like-btn');
        this.dislikeBtn = document.getElementById('dislike-btn');
        this.likeCount = document.getElementById('like-count');
        this.dislikeCount = document.getElementById('dislike-count');
        
        this.init();
    }
    
    init() {
        this.loadFromStorage();
        this.updateDisplay();
        this.setupEventListeners();
        this.sendInitialStats();
    }
    
    loadFromStorage() {
        // Load total counts
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.likes = data.likes || 0;
                this.dislikes = data.dislikes || 0;
            } catch (e) {
                console.error('Error loading reaction data:', e);
            }
        }
        
        // Load user's personal reaction
        const userReaction = localStorage.getItem(USER_REACTION_KEY);
        this.userReaction = userReaction;
    }
    
    saveToStorage() {
        const data = {
            likes: this.likes,
            dislikes: this.dislikes,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    
    updateDisplay() {
        this.likeCount.textContent = this.likes;
        this.dislikeCount.textContent = this.dislikes;
        
        // Update button states
        this.likeBtn.classList.remove('active');
        this.dislikeBtn.classList.remove('active');
        
        if (this.userReaction === 'like') {
            this.likeBtn.classList.add('active');
        } else if (this.userReaction === 'dislike') {
            this.dislikeBtn.classList.add('active');
        }
    }
    
    setupEventListeners() {
        this.likeBtn.addEventListener('click', () => this.handleLike());
        this.dislikeBtn.addEventListener('click', () => this.handleDislike());
        
        // Add click animations
        [this.likeBtn, this.dislikeBtn].forEach(btn => {
            btn.addEventListener('click', function() {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
            });
        });
    }
    
    handleLike() {
        if (this.userReaction === 'like') {
            // Remove like
            this.likes--;
            this.userReaction = null;
            localStorage.removeItem(USER_REACTION_KEY);
            this.sendReactionUpdate('removed_like');
        } else {
            // If user previously disliked, remove it first
            if (this.userReaction === 'dislike') {
                this.dislikes--;
            }
            
            // Add like
            this.likes++;
            this.userReaction = 'like';
            localStorage.setItem(USER_REACTION_KEY, 'like');
            this.sendReactionUpdate('liked');
        }
        
        this.saveToStorage();
        this.updateDisplay();
    }
    
    handleDislike() {
        if (this.userReaction === 'dislike') {
            // Remove dislike
            this.dislikes--;
            this.userReaction = null;
            localStorage.removeItem(USER_REACTION_KEY);
            this.sendReactionUpdate('removed_dislike');
        } else {
            // If user previously liked, remove it first
            if (this.userReaction === 'like') {
                this.likes--;
            }
            
            // Add dislike
            this.dislikes++;
            this.userReaction = 'dislike';
            localStorage.setItem(USER_REACTION_KEY, 'dislike');
            this.sendReactionUpdate('disliked');
        }
        
        this.saveToStorage();
        this.updateDisplay();
    }
    
    async sendReactionUpdate(action) {
        // Skip if webhook is not configured
        if (!WEBHOOK_URL || WEBHOOK_URL.includes('YOUR_WEBHOOK')) {
            console.log('Webhook not configured. Action:', action);
            return;
        }
        
        const data = {
            action: action,
            likes: this.likes,
            dislikes: this.dislikes,
            total: this.likes + this.dislikes,
            timestamp: new Date().toISOString(),
            page: window.location.href,
            userAgent: navigator.userAgent,
            userReaction: this.userReaction
        };
        
        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                console.error('Failed to send reaction to webhook');
            }
        } catch (error) {
            console.error('Error sending reaction:', error);
        }
    }
    
    async sendInitialStats() {
        // Skip if webhook is not configured
        if (!WEBHOOK_URL || WEBHOOK_URL.includes('YOUR_WEBHOOK')) {
            return;
        }
        
        // Send initial stats if this is the first visit in a while
        const lastStatsSend = localStorage.getItem('last_stats_send');
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        if (!lastStatsSend || new Date(lastStatsSend) < oneHourAgo) {
            const data = {
                action: 'stats_snapshot',
                likes: this.likes,
                dislikes: this.dislikes,
                total: this.likes + this.dislikes,
                timestamp: now.toISOString(),
                page: window.location.href
            };
            
            try {
                await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                localStorage.setItem('last_stats_send', now.toISOString());
            } catch (error) {
                console.error('Error sending stats snapshot:', error);
            }
        }
    }
    
    // Public method to get current stats
    getStats() {
        return {
            likes: this.likes,
            dislikes: this.dislikes,
            total: this.likes + this.dislikes,
            userReaction: this.userReaction
        };
    }
}

// Initialize the reaction system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize reaction system
    window.reactionSystem = new ReactionSystem();
    
    // Debug info (remove in production)
    console.log('Reaction system initialized');
    console.log('Webhook URL configured:', WEBHOOK_URL && !WEBHOOK_URL.includes('YOUR_WEBHOOK'));
    
    // Optional: Expose a function to manually send stats
    window.sendReactionStats = () => {
        if (window.reactionSystem) {
            window.reactionSystem.sendReactionUpdate('manual_update');
            alert('Stats sent to webhook!');
        }
    };
});

// Utility functions
function resetReactions() {
    if (confirm('Reset all reactions? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(USER_REACTION_KEY);
        localStorage.removeItem('last_stats_send');
        location.reload();
    }
}

function showReactionStats() {
    if (window.reactionSystem) {
        const stats = window.reactionSystem.getStats();
        alert(`Current Stats:\n👍 Likes: ${stats.likes}\n👎 Dislikes: ${stats.dislikes}\nTotal: ${stats.total}\nYour Vote: ${stats.userReaction || 'None'}`);
    }
}

// Make functions available globally
window.resetReactions = resetReactions;
window.showReactionStats = showReactionStats;
