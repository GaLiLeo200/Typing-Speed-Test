import { WORDS } from './words.js';

export class WordManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.config = { punctuation: false, numbers: false };
        this.reset();
    }

    setConfig(config) {
        this.config = config;
        this.reset(); 
    }

    reset() {
        this.container.innerHTML = '';
        this.container.style.transform = 'translateY(0px)';
        
        // 2D Grid Layout 
        
        this.wordElements = [];
        
        // Double Pointers
        // We use two numbers like coordinates to track our typing position:
        // one pointer for which word we are on, and another for the letter inside that word.
        this.activeWordIndex = 0;
        this.activeLetterIndex = 0;
        
        this.lineHeight = 0;
        this.currentLineTop = 0;
        this.yOffset = 0;
        
        if (this.config.mode === 'custom' && this.config.customText) {
            const words = this.config.customText.trim().split(/\s+/);
            words.forEach(w => this.appendWord(w));
        } else {
            this.generateWords(50);
        }
        
        this.setActiveLetter();
        this.setActiveWord();
        this.updateLineHeight();
    }

    generateWords(count) {
        for (let i = 0; i < count; i++) {
            const wordStr = this.getRandomWord();
            this.appendWord(wordStr);
        }
    }

    getRandomWord() {
        if (this.config.numbers && Math.random() < 0.2) {
            return Math.floor(Math.random() * 10000).toString();
        }
        
        let word = WORDS[Math.floor(Math.random() * WORDS.length)];
        
        if (this.config.punctuation && Math.random() < 0.3) {
            const puncs = [",", ".", "?", "!", ";", ":", '""', "()", "-"];
            const p = puncs[Math.floor(Math.random() * puncs.length)];
            if (p === '""') word = `"${word}"`;
            else if (p === "()") word = `(${word})`;
            else if (p === "-") word = `${word}-`;
            else word = word + p;
            
           
            if (Math.random() < 0.2) {
                word = word.charAt(0).toUpperCase() + word.slice(1);
            }
        }
        return word;
    }

    appendWord(wordText) {
        const wordEl = document.createElement('div');
        wordEl.className = 'word';
        
        for (let i = 0; i < wordText.length; i++) {
            const letterEl = document.createElement('span');
            letterEl.className = 'letter';
            letterEl.textContent = wordText[i];
            wordEl.appendChild(letterEl);
        }
        
        this.container.appendChild(wordEl);
        this.wordElements.push(wordEl);
    }

    updateLineHeight() {
        if (this.wordElements.length > 0) {
            // Measure how tall a word is on screen so we know when to scroll
            const word = this.wordElements[0];
            this.lineHeight = word.getBoundingClientRect().height + parseInt(window.getComputedStyle(this.container).gap || 8);
            this.currentLineTop = word.offsetTop;
        }
    }

    // Double Pointers
    // Instantly find the active letter on the screen by using our row and column pointers.
    getActiveLetter() {
        const wordEl = this.wordElements[this.activeWordIndex]; // Select row
        if (!wordEl) return null;
        
        const letters = wordEl.querySelectorAll('.letter'); // Select column list
        if (this.activeLetterIndex < letters.length) {
            return letters[this.activeLetterIndex]; // Retrieve cell coordinate
        }
        return null; // Tells the app that the user finished the word and should press space
    }

    handleInput(char) {
        const wordEl = this.wordElements[this.activeWordIndex];
        const letters = wordEl.querySelectorAll('.letter');
        
        // Process spacebar input
        if (char === ' ') {
            if (this.activeLetterIndex > 0) {
                const isCorrect = this.activeLetterIndex >= letters.length;
                // Step forward to the next word
                this.checkWordError(wordEl);
                this.activeWordIndex++;
                this.activeLetterIndex = 0;
                this.setActiveWord();
                this.checkScroll();
                
                // Add more random words to the screen if we're running out of words
                if (this.config.mode !== 'custom' && this.activeWordIndex > this.wordElements.length - 20) {
                    this.generateWords(20);
                }
                return { expected: ' ', isCorrect: isCorrect };
            }
            return { expected: '', isCorrect: false, ignored: true };
        }

        // Process normal letter typing
        if (this.activeLetterIndex < letters.length) {
            const letterEl = letters[this.activeLetterIndex];
            const expectedChar = letterEl.textContent;
            const isCorrect = char === expectedChar;
            
            letterEl.classList.add(isCorrect ? 'correct' : 'incorrect');
            this.activeLetterIndex++;
            return { expected: expectedChar, isCorrect };
        } else {
            // Don't allow typing more letters than the word actually has
            return { expected: '', isCorrect: false, ignored: true };
        }
    }

    handleBackspace(ctrlKey = false) {
        const wordEl = this.wordElements[this.activeWordIndex];
        const letters = wordEl.querySelectorAll('.letter');
        
        if (this.activeLetterIndex > 0) {
            if (ctrlKey) {
                Array.from(letters).forEach(l => {
                    if (l.classList.contains('extra')) {
                        l.remove();
                    } else {
                        l.className = 'letter';
                    }
                });
                this.activeLetterIndex = 0;
            } else {
                // Stack Pop / Undo
                // Backspacing works like popping an item off a stack to undo a keystroke.
                this.activeLetterIndex--;
                
                if (this.activeLetterIndex < letters.length) {
                    const letterEl = letters[this.activeLetterIndex];
                    if (letterEl.classList.contains('extra')) {
                        // Stack Pop: Remove extra typed characters from the page
                        letterEl.remove();
                    } else {
                        // Stack Pop: Revert the status of the letter to untyped
                        letterEl.className = 'letter'; // Reset
                    }
                }
            }
            return true; // We went back
        } else if (this.activeWordIndex > 0) {
            // Move back to the previous word if the user made mistakes on it
            const prevWordEl = this.wordElements[this.activeWordIndex - 1];
            if (prevWordEl.classList.contains('error')) {
                this.activeWordIndex--;
                
                let typedCount = 0;
                const prevLetters = prevWordEl.querySelectorAll('.letter');
                for (let i = prevLetters.length - 1; i >= 0; i--) {
                    const cl = prevLetters[i].classList;
                    if (cl.contains('correct') || cl.contains('incorrect') || cl.contains('extra')) {
                        typedCount = i + 1;
                        break;
                    }
                }
                this.activeLetterIndex = typedCount;
                
                prevWordEl.classList.remove('error');
                this.setActiveWord();
                this.checkScroll();
                
                if (ctrlKey && this.activeLetterIndex > 0) {
                    this.handleBackspace(true);
                }
                
                return true;
            }
        }
        return false;
    }

    checkWordError(wordEl) {
        const letters = wordEl.querySelectorAll('.letter');
        let hasError = false;
        letters.forEach(l => {
            if (l.classList.contains('incorrect') || !l.classList.contains('correct')) {
                hasError = true;
            }
        });
        if (hasError) {
         
            wordEl.classList.add('error');
        }
    }

    checkScroll() {
        const activeWordEl = this.wordElements[this.activeWordIndex];
        if (!activeWordEl) return;
        if (activeWordEl.offsetTop > this.currentLineTop) {
            // Shift the word container upwards when the user advances to a new line
            this.yOffset -= this.lineHeight;
            this.container.style.transform = `translateY(${this.yOffset}px)`;
            this.currentLineTop = activeWordEl.offsetTop;
        } else if (activeWordEl.offsetTop < this.currentLineTop) {
            // Shift the word container downwards when the user moves back to a previous line
            this.yOffset += this.lineHeight;
            this.container.style.transform = `translateY(${this.yOffset}px)`;
            this.currentLineTop = activeWordEl.offsetTop;
        }
    }

    setActiveLetter() {
        // Remove the active styling indicator from the previous letter
        document.querySelectorAll('.letter.active').forEach(el => el.classList.remove('active'));
        
        const letter = this.getActiveLetter();
        if (letter) {
            letter.classList.add('active');
        }
    }

    setActiveWord() {
        document.querySelectorAll('.word.active-word').forEach(el => el.classList.remove('active-word'));
        const wordEl = this.wordElements[this.activeWordIndex];
        if (wordEl) {
            wordEl.classList.add('active-word');
        }
    }

    getCaretPosition() {
        const wordEl = this.wordElements[this.activeWordIndex];
        if (!wordEl) return { left: 0, top: 0, height: 0 };

        const letters = wordEl.querySelectorAll('.letter');
        
        if (letters.length === 0) {
             return { left: wordEl.offsetLeft, top: wordEl.offsetTop, height: 30 };
        }

        if (this.activeLetterIndex < letters.length) {
            const letterEl = letters[this.activeLetterIndex];
            return { 
                left: letterEl.offsetLeft, 
                top: letterEl.offsetTop,
                height: letterEl.offsetHeight
            };
        } else {
            const lastLetter = letters[letters.length - 1];
            return { 
                left: lastLetter.offsetLeft + lastLetter.offsetWidth, 
                top: lastLetter.offsetTop,
                height: lastLetter.offsetHeight
            };
        }
    }
}
