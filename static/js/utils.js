export const GRADIENTS = [
    "linear-gradient(135deg, #05040a, #030712, #040d1a)",
    "linear-gradient(135deg, #0a0410, #03141a, #05050f)",
    "linear-gradient(135deg, #021217, #09031a, #030308)",
    "linear-gradient(135deg, #0f050b, #040a17, #02070f)",
    "linear-gradient(135deg, #080315, #14050a, #03040c)",
    "linear-gradient(135deg, #021510, #040c14, #040409)",
];

export function formatTime(timestampStr) {
    try {
        const date = new Date(timestampStr.replace(" ", "T") + "Z");
        if (isNaN(date.getTime())) return timestampStr;
        return date.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    } catch (error) {
        return timestampStr;
    }
}

export function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
