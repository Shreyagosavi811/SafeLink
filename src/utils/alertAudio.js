import { AudioManager } from "./AudioManager";

export function playMediumBeep() {
    AudioManager.beep(550, 240);
}

export function playHighBeep() {
    AudioManager.beep(900, 300);
}

export function speak(text) {
    AudioManager.speak(text);
}

export function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
}
