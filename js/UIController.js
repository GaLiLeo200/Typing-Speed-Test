export class UIController {
    constructor() {
        this.appContainer = document.getElementById('app');
        this.liveWpm = document.getElementById('live-wpm-display');
        this.timerDisplay = document.getElementById('timer-display');
        this.resultsScreen = document.getElementById('results');
        this.wordsWrapper = document.getElementById('words-wrapper');
        
        this.liveTimer = document.getElementById('live-timer');
        
        this.resultWpm = document.getElementById('result-wpm');
        this.resultAcc = document.getElementById('result-acc');
        this.chartCanvas = document.getElementById('results-chart');
        this.chartInstance = null;
        
        this.caret = document.createElement('div');
        this.caret.className = 'caret';
        this.wordsWrapper.appendChild(this.caret);
        
        this.isFocusMode = false;
        this.updateInterval = null;
    }

    enableFocusMode() {
        if (!this.isFocusMode) {
            this.appContainer.classList.add('typing-active');
            this.liveTimer.classList.remove('hidden');
            this.isFocusMode = true;
        }
    }

    disableFocusMode() {
        if (this.isFocusMode) {
            this.appContainer.classList.remove('typing-active');
            this.liveTimer.classList.add('hidden');
            this.isFocusMode = false;
        }
    }

    updateCaret(position, yOffset = null) {
        // Adjust the blinking cursor position relative to the screen.
        // We must factor in the vertical scroll offset (translateY) of the words container.
        if (yOffset === null) {
            const wordsContainer = document.getElementById('words');
            const transformMatrix = window.getComputedStyle(wordsContainer).transform;
            yOffset = 0;
            if (transformMatrix !== 'none') {
                yOffset = parseFloat(transformMatrix.split(',')[5]);
            }
        }

        this.caret.style.left = `${position.left}px`;
        this.caret.style.top = `${position.top + yOffset}px`;
        if (position.height) {
            this.caret.style.height = `${position.height}px`;
        }
    }

    startLiveStats(telemetry, onTick) {
        this.updateInterval = setInterval(() => {
            const metrics = telemetry.getMetrics();
            if (onTick) onTick(metrics);
        }, 500); // Refresh the speed display twice every second
    }

    stopLiveStats() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    showResults(metrics, telemetry) {
        this.disableFocusMode();
        this.stopLiveStats();
        
        this.resultWpm.textContent = `${metrics.netWpm} wpm`;
        this.resultAcc.textContent = `${metrics.accuracy}%`;
        
        this.renderChart(telemetry);
        
        this.resultsScreen.classList.remove('hidden');
    }

    renderChart(telemetry) {
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const history = telemetry.history;
        const labels = history.map((_, i) => i + 1);
        
        // Prepare error events for plotting on the chart
        const errorData = telemetry.errorEvents.map(sec => ({
            x: sec + 1,
            y: history[sec] || history[history.length - 1] || 0
        }));
        
        // Prepare backspace corrections for plotting on the chart
        const modData = telemetry.modificationEvents.map(sec => ({
            x: sec + 1,
            y: history[sec] || history[history.length - 1] || 0
        }));

        const ctx = this.chartCanvas.getContext('2d');
        
        // Read color variables from the CSS theme so the graph matches the page colors
        const rootStyles = getComputedStyle(document.body);
        const primaryColor = rootStyles.getPropertyValue('--caret-color').trim() || '#e2b714';
        const errorColor = rootStyles.getPropertyValue('--text-error').trim() || '#ca4754';
        const textColor = rootStyles.getPropertyValue('--text-color').trim() || '#646669';
        
        const hexToRgba = (hex, alpha) => {
            if (!hex) return `rgba(0,0,0,${alpha})`;
            if (hex.startsWith('transparent')) return `rgba(0,0,0,0)`;
            let r = 0, g = 0, b = 0;
            if (hex.length === 4) {
                r = parseInt(hex[1] + hex[1], 16);
                g = parseInt(hex[2] + hex[2], 16);
                b = parseInt(hex[3] + hex[3], 16);
            } else if (hex.length === 7) {
                r = parseInt(hex.substring(1, 3), 16);
                g = parseInt(hex.substring(3, 5), 16);
                b = parseInt(hex.substring(5, 7), 16);
            }
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        const primaryBg = hexToRgba(primaryColor, 0.2);
        const gridColor = hexToRgba(textColor, 0.1);

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'WPM',
                        data: history,
                        borderColor: primaryColor,
                        backgroundColor: primaryBg,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 0,
                        pointHitRadius: 10
                    },
                    {
                        label: 'Error',
                        data: errorData,
                        type: 'scatter',
                        backgroundColor: errorColor,
                        pointRadius: 4
                    },
                    {
                        label: 'Modifications',
                        data: modData,
                        type: 'scatter',
                        backgroundColor: textColor,
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { 
                            usePointStyle: true,
                            color: textColor
                        }
                    }
                }
            }
        });
    }

    hideResults() {
        this.resultsScreen.classList.add('hidden');
    }
}
