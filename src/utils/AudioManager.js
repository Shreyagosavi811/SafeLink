// src/utils/AudioManager.js
class AudioManager {
    static ctx = null;
    static unlocked = false;

    static init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    static unlockAudioOnClick() {
        if (this.unlocked) return;

        const enable = () => {
            if (this.ctx && this.ctx.state === "suspended") {
                this.ctx.resume();
            }
            this.unlocked = true;
            document.removeEventListener("click", enable);
            document.removeEventListener("touchstart", enable);
        };

        document.addEventListener("click", enable);
        document.addEventListener("touchstart", enable);
    }

    // ----------------------------
    // * BEEP SOUND *
    // ----------------------------
    static beep(freq = 800, duration = 200, volume = 0.6) {
        if (!this.unlocked || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.value = freq;
        gain.gain.value = volume;

        osc.connect(gain).connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration / 1000);
    }

    // ----------------------------
    // * AI VOICE ALERT *
    // ----------------------------
    static speak(text) {
        if (!this.unlocked) return;

        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);

        utter.lang = "en-US";
        utter.pitch = 1;
        utter.rate = 0.9;

        window.speechSynthesis.speak(utter);
    }

    // ----------------------------
    // * Vibrate (mobile)
    // ----------------------------
    static vibrate(pattern) {
        if (navigator.vibrate) navigator.vibrate(pattern);
    }
}

// Initialize once
AudioManager.init();

// 🔥 THIS IS THE CORRECT EXPORT
export { AudioManager };
