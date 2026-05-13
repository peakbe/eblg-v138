// ======================================================
// METAR.JS — EBLG Tower Glass
// ======================================================

import { drawApproachCorridor, drawDepartureCorridor } from "./map.js";

const METAR_URL = "/api/metar"; // adapte si besoin

let lastMetar = null;

// -----------------------------
// Init
// -----------------------------
export function initMetar() {
    fetchMetar();
    setInterval(fetchMetar, 5 * 60 * 1000); // toutes les 5 min
}

// -----------------------------
// Fetch METAR
// -----------------------------
async function fetchMetar() {
    try {
        const r = await fetch(METAR_URL);
        if (!r.ok) throw new Error("HTTP " + r.status);

        const data = await r.text(); // ou .json() selon ton backend
        const metar = typeof data === "string" ? data : (data.metar || "");

        if (!metar) return;

        lastMetar = metar;
        updateMetarUI(metar);

        const activeRunway = detectActiveRunway(metar);
        updateRunwayUI(activeRunway);

        drawApproachCorridor(activeRunway);
        drawDepartureCorridor(activeRunway);

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
    // Exemple METAR : EBLG 121320Z 23012KT ...
    const m = metar.match(/ (\d{3})(\d{2})KT/);
    if (!m) return null;

    const windDir = parseInt(m[1], 10); // en degrés

    const rwy04 = 40;
    const rwy22 = 220;

    const diff04 = angleDiff(windDir, rwy04);
    const diff22 = angleDiff(windDir, rwy22);

    // On prend la piste la plus alignée avec le vent (vent de face)
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
