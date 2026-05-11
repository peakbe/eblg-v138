// ======================================================
// METAR PRO+++ — Cockpit IFR EBLG
// ======================================================

import { ENDPOINTS } from "./config.js";
import { fetchJSON, updateStatusPanel } from "./helpers.js";
import {
    RUNWAYS,
    getRunwayFromWind,
    computeCrosswind,
    updateRunwayPanel
} from "./runways.js";
import { drawRunwayDirection } from "./map.js";
import { applyRunwayColoring } from "./sonometers.js";
applyRunwayColoring(active?.id ?? null);
import { drawNoiseCorridor } from "./map.js";

const IS_DEV = location.hostname.includes("localhost");
const log = (...a) => IS_DEV && console.log("[METAR]", ...a);
const logErr = (...a) => console.error("[METAR ERROR]", ...a);

// Chargement sécurisé
export async function safeLoadMetar() {
    try {
        await loadMetar();
        log("METAR chargé");
    } catch (err) {
        logErr("Erreur METAR :", err);
    }
}

// Chargement brut
export async function loadMetar() {
    const data = await fetchJSON(ENDPOINTS.metar);
    updateMetarUI(data);
    updateStatusPanel("METAR", data);
}

// Mise à jour UI + piste

// 1) Extraction vent
const windDir = data.wind_direction?.value ?? null;
const windSpeed = data.wind_speed?.value ?? null;

// 2) Détermination piste active
const active = getRunwayFromWind(windDir);
window._activeRunway = active?.id ?? null;

// 3) Mise à jour carte
drawRunwayDirection(active?.id ?? null);
drawNoiseCorridor(active?.id ?? null);

// 4) Couplage sonomètres
applyRunwayColoring(active?.id ?? null);

// 5) Calcul vent de travers / face
const { crosswind, headwind } = computeCrosswind(
    windDir,
    windSpeed,
    active?.heading ?? null
);

// 6) Mise à jour panneau piste
updateRunwayPanel(
    active?.id ?? "—",
    windDir,
    windSpeed,
    crosswind,
    headwind
);

export function updateMetarUI(data) {
    const el = document.getElementById("metar");
    if (!el) return;

    if (!data || !data.raw) {
        el.innerText = "METAR indisponible";
        window._activeRunway = null;
        updateRunwayIndicator(window._activeRunway);
        drawRunwayDirection(null);
        updateRunwayPanel("—", null, null, 0, 0);
        return;
        drawNoiseCorridor(active?.id ?? null);
    }

    el.innerText = data.raw;

     drawRunwayDirection(active?.id ?? null);
}

function updateRunwayIndicator(rwy) {
    const el = document.getElementById("rwy-indicator");
    if (!el) return;

    el.className = "rwy-box"; // reset

    if (!rwy) {
        el.textContent = "RWY --";
        el.classList.add("rwy-null");
        return;
    }

    el.textContent = `RWY ${rwy}`;

    if (rwy === "04") el.classList.add("rwy-04");
    else if (rwy === "22") el.classList.add("rwy-22");
    else el.classList.add("rwy-null");
}
