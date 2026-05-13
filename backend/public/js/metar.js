// ======================================================
// METAR.JS — EBLG Tower Glass PRO+++
// ======================================================

import { drawApproachCorridor, drawDepartureCorridor } from "./map.js";

const METAR_URL = "/api/metar";

let lastMetar = null;
let lastRunway = null;

// -----------------------------
// Init
// -----------------------------
export function initMetar() {
    loadMetar();
    setInterval(loadMetar, 5 * 60 * 1000);
}

// -----------------------------
// Fetch METAR
// -----------------------------
async function loadMetar() {
    try {
        const r = await fetch(METAR_URL);
        if (!r.ok) throw new Error("HTTP " + r.status);

        let metar;

        // Support JSON ou texte
        const contentType = r.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            const json = await r.json();
            metar = json.metar || json.raw || "";
        } else {
            metar = await r.text();
        }

        if (!metar) return;

        lastMetar = metar;
        updateMetarUI(metar);

        const activeRunway = detectActiveRunway(metar);
        lastRunway = activeRunway;

        updateRunwayUI(activeRunway);

        // Corridors (uniquement si map initialisée)
        if (window.map) {
            drawApproachCorridor(activeRunway);
            drawDepartureCorridor(activeRunway);
        }

    } catch (e) {
        console.error("[METAR] Erreur chargement", e);
    }
}

// -----------------------------
// UI METAR
// -----------------------------
function updateMetarUI(metar) {
    const el = document.getElementById("metar");
    if (el) el.textContent = metar;
}

// -----------------------------
// Détection piste active
// -----------------------------
function detectActiveRunway(metar) {
    const m = metar.match(/ (\d{3})(\d{2})KT/);
    if (!m) return null;

    const windDir = parseInt(m[1], 10);

    const rwy04 = 40;
    const rwy22 = 220;

    const diff04 = angleDiff(windDir, rwy04);
    const diff22 = angleDiff(windDir, rwy22);

    return diff04 < diff22 ? "04" : "22";
}

function angleDiff(a, b) {
    let d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
}

// -----------------------------
// UI RWY
// -----------------------------
function updateRunwayUI(rwy) {
    const box = document.getElementById("rwy-indicator");
    const panel = document.getElementById("runway-active");

    if (!rwy) {
        if (box) box.textContent = "RWY --";
        if (panel) panel.textContent = "Piste active : --";
        return;
    }

    if (box) box.textContent = `RWY ${rwy}`;
    if (panel) panel.textContent = `Piste active : RWY ${rwy}`;
}
