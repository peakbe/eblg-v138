// Fallback FIDS cargo réaliste

export function generateDynamicFids() {
    const now = new Date();
    const baseHour = now.getHours();
    const baseMin = now.getMinutes();

    const destinations = [
        "LEJ", "CGN", "SVO", "IST", "DOH",
        "CVG", "ADD", "TLV", "DXB", "BUD"
    ];

    const statuses = [
        "Scheduled",
        "Loading",
        "Boarding",
        "Departed",
        "Delayed"
    ];

    const flights = [];

    for (let i = 0; i < 8; i++) {
        const h = (baseHour + i) % 24;
        const m = (baseMin + i * 7) % 60;

        flights.push({
            flight: generateFlightNumber(),
            destination: destinations[i % destinations.length],
            time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
            status: statuses[(baseHour + i) % statuses.length],
            fallback: true
        });
    }

    return flights;
}

function generateFlightNumber() {
    const prefixes = ["QY", "3V", "RU", "TK", "QR", "ET", "X7", "K4"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return prefix + num;
}
