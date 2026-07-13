import { WordManager } from './WordManager.js';
import { Telemetry } from './Telemetry.js';
import { UIController } from './UIController.js';

class App {
    constructor() {
        this.wordManager = new WordManager('words');
        this.telemetry = new Telemetry();
        this.ui = new UIController();
        
        this.input = document.getElementById('hidden-input');
        this.resultsRefreshBtn = document.getElementById('results-refresh-btn');
        this.refreshBtn = document.getElementById('refresh-btn');
        
        this.settingsBtn = document.getElementById('settings-btn');
        this.settingsModal = document.getElementById('settings-modal');
        this.closeSettingsBtn = document.getElementById('close-settings-btn');
        this.themeBtns = document.querySelectorAll('#theme-options button');
        
        this.customModal = document.getElementById('custom-text-modal');
        this.customInput = document.getElementById('custom-text-input');
        this.saveCustomBtn = document.getElementById('save-custom-btn');
        this.cancelCustomBtn = document.getElementById('cancel-custom-btn');
        
        // Store the active settings configurations (e.g., mode, duration, modifiers)
        this.config = {
            punctuation: false,
            numbers: false,
            mode: 'time', // 'time', 'words', 'custom'
            amount: 30,
            customText: "The quick brown fox jumps over the lazy dog."
        };
        
        this.timer = null;
        this.isRunning = false;
        
        this.bindEvents();
        this.reset();
    }

    bindEvents() {
        // Keep the hidden input focused so keystrokes are always captured, unless interacting with modals
        document.addEventListener('click', (e) => {
            if (e.target.closest('.modal')) return;
            
            if (this.ui.resultsScreen.classList.contains('hidden')) {
                 this.input.focus();
            }
        });

        this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        if(this.resultsRefreshBtn) this.resultsRefreshBtn.addEventListener('click', () => this.reset());
        this.refreshBtn.addEventListener('click', () => this.reset());
        
        this.settingsBtn.addEventListener('click', () => {
            this.settingsModal.classList.remove('hidden');
        });

        this.closeSettingsBtn.addEventListener('click', () => {
            this.settingsModal.classList.add('hidden');
            this.input.focus();
        });

        // Toggle punctuation or numbers on/off
        const modBtns = document.querySelectorAll('#modifier-options button');
        modBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mod = e.target.dataset.mod;
                this.config[mod] = !this.config[mod];
                e.target.classList.toggle('active', this.config[mod]);
                this.wordManager.setConfig(this.config);
                this.reset();
            });
        });

        // Handle switching between Time, Word count, and Custom text modes
        const modeBtns = document.querySelectorAll('#mode-options button');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const newMode = e.target.dataset.mode;
                
                if (newMode === 'custom') {
                    this.customInput.value = this.config.customText;
                    this.customModal.classList.remove('hidden');
                    return; // Stop and wait for the user to save their custom text
                }
                
                modeBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.config.mode = newMode;
                
                // Apply a standard limit (seconds or word count) based on the chosen mode
                this.config.amount = this.config.mode === 'time' ? 30 : 50;
                this.renderAmountOptions();
                this.reset();
            });
        });
        
        this.saveCustomBtn.addEventListener('click', () => {
            const text = this.customInput.value.trim();
            if (text) {
                this.config.customText = text;
                this.config.mode = 'custom';
                
                modeBtns.forEach(b => b.classList.remove('active'));
                document.querySelector('[data-mode="custom"]').classList.add('active');
                
                this.customModal.classList.add('hidden');
                this.renderAmountOptions();
                this.reset();
            }
        });
        
        this.cancelCustomBtn.addEventListener('click', () => {
            this.customModal.classList.add('hidden');
        });

        this.renderAmountOptions();

        this.themeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.themeBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const theme = e.target.dataset.theme;
                if (theme === 'default') {
                    document.body.removeAttribute('data-theme');
                } else {
                    document.body.setAttribute('data-theme', theme);
                }
            });
        });
        
        // Allow the user to press Tab to quickly restart the test
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.reset();
            }
            if (e.key === 'Escape') {
                // Future enhancement: Add Escape menu functionality
                this.reset();
            }
        });
    }

    renderAmountOptions() {
        const amountContainer = document.getElementById('amount-options');
        amountContainer.innerHTML = '';
        
        if (this.config.mode === 'custom') return; // Hide standard amount limits when typing a custom paragraph
        
        const options = this.config.mode === 'time' ? [15, 30, 60, 120] : [10, 25, 50, 100];
        
        options.forEach(val => {
            const btn = document.createElement('button');
            btn.textContent = val;
            if (val === this.config.amount) btn.classList.add('active');
            
            btn.addEventListener('click', (e) => {
                amountContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.config.amount = val;
                this.reset();
            });
            
            amountContainer.appendChild(btn);
        });
    }

    reset() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.isRunning = false;
        
        this.wordManager.setConfig(this.config); // Load new words matching the updated settings
        this.telemetry.reset();
        
        this.ui.hideResults();
        this.ui.disableFocusMode();
        this.ui.stopLiveStats();
        
        if (this.config.mode === 'time') {
            this.ui.liveTimer.textContent = this.config.amount;
        } else if (this.config.mode === 'words') {
            this.ui.liveTimer.textContent = `0/${this.config.amount}`;
        } else {
            this.ui.liveTimer.textContent = `0/${this.wordManager.wordElements.length}`;
        }
        
        this.input.value = '';
        this.input.focus();

        // Reset the visual blinking caret immediately to the start of the first word
        setTimeout(() => {
            this.ui.updateCaret(this.wordManager.getCaretPosition(), this.wordManager.yOffset);
        }, 0);
    }

    startTest() {
        this.isRunning = true;
        this.ui.enableFocusMode();
        this.telemetry.start();
        
        this.ui.startLiveStats(this.telemetry, (metrics) => {
            if (this.config.mode === 'time') {
                const timeRemaining = Math.max(0, this.config.amount - Math.floor(metrics.timeElapsed));
                this.ui.liveTimer.textContent = timeRemaining;
            } else if (this.config.mode === 'words') {
                this.ui.liveTimer.textContent = `${this.wordManager.activeWordIndex}/${this.config.amount}`;
            } else {
                this.ui.liveTimer.textContent = `${this.wordManager.activeWordIndex}/${this.wordManager.wordElements.length}`;
            }
        });
        
        if (this.config.mode === 'time') {
            this.timer = setTimeout(() => this.endTest(), this.config.amount * 1000);
        }
    }

    endTest() {
        this.isRunning = false;
        this.telemetry.stop();
        const metrics = this.telemetry.getMetrics();
        this.ui.showResults(metrics, this.telemetry);
        this.input.blur();
    }

    handleKeyDown(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            this.reset();
            return;
        }
        
        if (!this.isRunning && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            this.startTest();
        }

        if (e.key === 'Backspace') {
            const wordResult = this.wordManager.handleBackspace();
            this.telemetry.recordModification(wordResult);
        } else if (e.key === ' ' || e.key === 'Enter') {
            const result = this.wordManager.handleInput(' ');
            if (result && !result.ignored) {
                this.telemetry.recordKey(' ', result.expected, result.isCorrect);
            }
            
            // Stop the test if the user finishes the requested number of words
            if (this.config.mode === 'words' && this.wordManager.activeWordIndex >= this.config.amount) {
                this.endTest();
            } else if (this.config.mode === 'custom' && this.wordManager.activeWordIndex >= this.wordManager.wordElements.length) {
                this.endTest();
            }
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const result = this.wordManager.handleInput(e.key);
            if (!result.ignored) {
                this.telemetry.recordKey(e.key, result.expected, result.isCorrect);
            }
        }

        // Move the visual blinking caret immediately after the letters change on page
        setTimeout(() => {
            this.ui.updateCaret(this.wordManager.getCaretPosition(), this.wordManager.yOffset);
        }, 0);
    }
}

// Launch the application as soon as the page loads
window.addEventListener('DOMContentLoaded', () => {
    new App();
});
