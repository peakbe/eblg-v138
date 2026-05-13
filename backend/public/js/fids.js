// ======================================================
// FIDS CARGO PRO+++ — Cockpit IFR EBLG
// - Logos compagnies cargo
// - Heures estimées automatiques
// - Détection retard automatique
// ======================================================

import { ENDPOINTS } from "./config.js";
import { fetchJSON, updateStatusPanel } from "./helpers.js";

const IS_DEV = location.hostname.includes("localhost");
const log = (...a) => IS_DEV && console.log("[FIDS]", ...a);
const logErr = (...a) => console.error("[FIDS ERROR]", ...a);

export async function safeLoadFids() {
    try {
        await loadFids();
    } catch (err) {
        logErr(err);
    }
}

export async function loadFids() {
    const data = await fetchJSON(ENDPOINTS.fids);
    updateFidsUI(data);
    updateStatusPanel("FIDS", data);
}

// ------------------------------------------------------
// Utils temps
// ------------------------------------------------------
function parseTimeToMinutes(t) {
    if (!t || t === "N/A") return null;
    const [h, m] = t.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
}

function minutesToHHMM(mins) {
    if (mins == null) return "N/A";
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getNowMinutes() {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
}

// Si time = "N/A", on génère une heure estimée dans les 3 prochaines heures
function computeEstimatedTime(rawTime, index) {
    const base = getNowMinutes();
    if (rawTime && rawTime !== "N/A") {
        const t = parseTimeToMinutes(rawTime);
        if (t != null) return t;
    }
    const offset = 20 + index * 10; // 20, 30, 40, ...
    return base + offset;
}

// Détection retard : si ETA/ETD < maintenant → "Delayed"
function detectDelay(estimatedMinutes) {
    const now = getNowMinutes();
    if (estimatedMinutes == null) return false;
    return estimatedMinutes < now;
}

// ------------------------------------------------------
// Logos & compagnies
// ------------------------------------------------------
const AIRLINE_META = [
    { prefix: "QTR", name: "Qatar Cargo", logo: "🟣", color: "#7b1fa2" },
    { prefix: "ETH", name: "Ethiopian Cargo", logo: "🟢", color: "#2e7d32" },
    { prefix: "FDX", name: "FedEx", logo: "🟪", color: "#6a1b9a" },
    { prefix: "UAE", name: "Emirates SkyCargo", logo: "🟥", color: "#b71c1c" },
    { prefix: "ICL", name: "Cargolux / CAL", logo: "🟥", color: "#c62828" },
    { prefix: "TAY", name: "ASL Airlines", logo: "🟦", color: "#1565c0" },
    { prefix: "ABD", name: "AirBridgeCargo", logo: "🔵", color: "#0d47a1" },
    { prefix: "CAO", name: "Air China Cargo", logo: "🔴", color: "#c62828" },
    { prefix: "AZG", name: "Silk Way / AZG", logo: "🔵", color: "#1e88e5" },
    { prefix: "ICE", name: "Icelandair Cargo", logo: "🟦", color: "#1565c0" },
    { prefix: "SVA", name: "Saudia Cargo", logo: "🟢", color: "#2e7d32" },
    { prefix: "ELY", name: "El Al Cargo", logo: "🔵", color: "#1e88e5" },
    { prefix: "GTI", name: "Atlas Air", logo: "🟡", color: "#f9a825" },
    { prefix: "MFX", name: "MNG / divers", logo: "⚪", color: "#546e7a" },
    { prefix: "ABB", name: "Divers cargo", logo: "⚪", color: "#546e7a" },
    { prefix: "LSI", name: "Divers cargo", logo: "⚪", color: "#546e7a" },
    { prefix: "NPT", name: "West Atlantic", logo: "🟦", color: "#1565c0" },
    { prefix: "SWN", name: "West Air / Swe", logo: "🟦", color: "#1565c0" }
];

function getAirlineMeta(flight) {
    if (!flight) return { name: "Cargo", logo: "✈️", color: "#90a4ae" };
    const prefix = flight.slice(0, 3).toUpperCase();
    const meta = AIRLINE_META.find(a => a.prefix === prefix);
    return meta || { name: "Cargo", logo: "✈️", color: "#90a4ae" };
}

// ------------------------------------------------------
// UI principale
// ------------------------------------------------------
export function updateFidsUI(data) {
    const arrEl = document.getElementById("fids-arrivals");
    const depEl = document.getElementById("fids-departures");
    if (!arrEl || !depEl) return;

    arrEl.innerHTML = `<div class="fids-section-title">Arrivées</div>`;
    depEl.innerHTML = `<div class="fids-section-title">Départs</div>`;

    if (!Array.isArray(data) || !data.length) {
        depEl.innerHTML += `<div class="fids-row">Aucun vol disponible</div>`;
        return;
    }

    // Backend actuel = uniquement départs cargo
    const departures = data.map((f, idx) => {
        const estMinutes = computeEstimatedTime(f.time, idx);
        const delayed = detectDelay(estMinutes);
        const airline = getAirlineMeta(f.flight);

        let status = f.status && f.status !== "N/A" ? f.status : "Scheduled";
        if (delayed) status = "Delayed";

        return {
            ...f,
            type: "departure",
            airline,
            estMinutes,
            estTime: minutesToHHMM(estMinutes),
            delayed,
            status
        };
    });

    // Tri par heure estimée
    departures.sort((a, b) => {
        const ta = a.estMinutes ?? 9999;
        const tb = b.estMinutes ?? 9999;
        return ta - tb;
    });

    const nextDepartures = departures.slice(0, 10);

    function render(list, container) {
        list.forEach(f => {
            const statusLower = (f.status || "").toLowerCase();

            let cssClass = "fids-unknown";
            if (statusLower.includes("on time") || statusLower.includes("scheduled")) cssClass = "fids-on-time";
            if (statusLower.includes("delay")) cssClass = "fids-delayed";
            if (statusLower.includes("cancel")) cssClass = "fids-cancelled";

            const row = document.createElement("div");
            row.className = `fids-row ${cssClass}`;

            const airlineColor = f.airline.color;
            const airlineLogo = f.airline.logo;

            row.innerHTML = `
                <span class="fids-logo" style="color:${airlineColor}">${airlineLogo}</span>
                <span class="fids-flight">${f.flight || "—"}</span>
                <span class="fids-airline" style="color:${airlineColor}">${f.airline.name}</span>
                <span class="fids-dest">${f.destination || "—"}</span>
                <span class="fids-time">
                    ${f.time && f.time !== "N/A" ? f.time : "—"}
                    <span class="fids-etd">ETD ${f.estTime}</span>
                </span>
                <span class="fids-status">${f.status}</span>
            `;

            if (cssClass === "fids-delayed") {
                row.style.animation = "boardingBlink 1.2s infinite alternate";
            }

            container.appendChild(row);
        });
    }

    // Arrivées : vide (cargo)
    render([], arrEl);

    // Départs cargo
    render(nextDepartures, depEl);

    log("FIDS mis à jour :", nextDepartures.length, "départs");
}
