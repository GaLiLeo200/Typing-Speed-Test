export class Telemetry {
    constructor() {
        this.reset();
    }

    reset() {
        this.startTime = null;
        this.endTime = null;
        this.keystrokes = [];
        this.totalKeystrokes = 0;
        this.uncorrectedErrors = 0;
        this.isRunning = false;
        // We use a Map (like a dictionary) to keep track of how many typos happen on each key.
        // This is a Hash Map data structure that allows fast lookups and updates.
        this.errorMap = new Map();
        
        this.history = [];
        this.errorEvents = [];
        this.modificationEvents = [];
    }

    start() {
        if (!this.isRunning) {
            this.startTime = performance.now();
            this.isRunning = true;
            
            // Record the user's typing speed (WPM) once every second to build the final progress chart.
            this.historyInterval = setInterval(() => {
                const metrics = this.getMetrics();
                this.history.push(metrics.netWpm);
            }, 1000);
        }
    }

    stop() {
        if (this.isRunning) {
            this.endTime = performance.now();
            this.isRunning = false;
            clearInterval(this.historyInterval);
            // Save the last recorded speed data point when the test finishes.
            const metrics = this.getMetrics();
            this.history.push(metrics.netWpm);
        }
    }

    recordKey(char, expectedChar, isCorrect) {
        if (!this.isRunning) this.start();
        
        const timestamp = performance.now();
        this.totalKeystrokes++;
        
        this.keystrokes.push({ char, expectedChar, timestamp, isCorrect });
        
        if (!isCorrect) {
            this.uncorrectedErrors++;
            
            // Find which character was supposed to be typed, and increment its mistake count by 1.
            // Using a Hash Map lookup allows us to do this instantly.
            const currentCount = this.errorMap.get(expectedChar) || 0;
            this.errorMap.set(expectedChar, currentCount + 1);
            
            const sec = Math.floor((timestamp - this.startTime) / 1000);
            this.errorEvents.push(sec);
        }
    }

    // Lower the active error count when the user successfully deletes/corrects a typo.
    fixError() {
        if (this.uncorrectedErrors > 0) {
            this.uncorrectedErrors--;
        }
        const timestamp = performance.now();
        const sec = Math.floor((timestamp - this.startTime) / 1000);
        this.modificationEvents.push(sec);
    }

    recordModification(wordResult) {
        if (wordResult) {
            this.fixError();
        }
    }

    getMetrics() {
        const currentTime = this.isRunning ? performance.now() : (this.endTime || performance.now());
        const timeElapsedMin = (currentTime - this.startTime) / 60000;
        
        if (timeElapsedMin === 0 || !this.startTime) {
            return { rawWpm: 0, netWpm: 0, accuracy: 0, time: 0 };
        }

        // Standard calculation: Every 5 keystrokes count as 1 word.
        const rawWpm = Math.max(0, Math.round((this.totalKeystrokes / 5) / timeElapsedMin));
        
        // Net speed subtracts uncorrected errors so accuracy is factored into the speed.
        const netWpm = Math.max(0, Math.round(((this.totalKeystrokes - this.uncorrectedErrors) / 5) / timeElapsedMin));
        
        const accuracy = this.totalKeystrokes > 0 
            ? Math.round(((this.totalKeystrokes - this.uncorrectedErrors) / this.totalKeystrokes) * 100) 
            : 100;

        return {
            rawWpm,
            netWpm,
            accuracy,
            timeElapsed: (currentTime - this.startTime) / 1000 // in seconds
        };
    }
}
