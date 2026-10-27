function resetButton(button) {
    button.innerHTML = '<i class="fa-solid fa-volume-high"></i> Listen';
    button.classList.remove("active");
}

export function toggleSpeech(button, quote, author) {
    if (!("speechSynthesis" in window)) {
        alert("Your browser does not support audio speech synthesis.");
        return;
    }

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        resetButton(button);
        return;
    }

    const utterance = new SpeechSynthesisUtterance(`"${quote}" by ${author}`);
    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
        voices.find((voice) => voice.lang.includes("en-") && voice.name.includes("Natural")) ||
        voices.find((voice) => voice.lang.includes("en-")) ||
        voices[0];

    if (englishVoice) utterance.voice = englishVoice;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
        button.innerHTML = '<i class="fa-solid fa-volume-high fa-beat"></i> Reading...';
        button.classList.add("active");
    };

    utterance.onend = () => resetButton(button);
    utterance.onerror = () => resetButton(button);

    window.speechSynthesis.speak(utterance);
}
