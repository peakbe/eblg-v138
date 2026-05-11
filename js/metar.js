// ======================================================
// METAR PRO+++ — Cockpit IFR EBLG
// ======================================================
// - Chargement sécurisé
// - Détection piste active (04/22)
// - Crosswind / headwind
// - Mise à jour UI + panneau piste
// - Direction de décollage/atterrissage (map.js)
// ======================================================

import { ENDPOINTS } from "./config.js";
import { fetchJSON, updateStatusPanel } from "./helpers.js";
import { 
    getRunwayFromWind,
    computeCrosswind,
    updateRunwayPanel
} from "./runways.js";

import { drawRunwayDirection } from "./map.js";

const IS_DEV = location.hostname.includes("localhost");
const log = (...a) => IS_DEV && console.log("[METAR]", ...a);
const logErr = (...a) => console.error("[METAR ERROR]", ...a);

// ------------------------------------------------------
// Chargement sécurisé
// ------------------------------------------------------
export async function safeLoadMetar() {
    try {
        await loadMetar();
        log("METAR chargé");
    } catch (err) {
        logErr("Erreur METAR :", err);
    }
}

// ------------------------------------------------------
// Chargement brut
// ------------------------------------------------------
export async function loadMetar() {
    const data = await fetchJSON(ENDPOINTS.metar);
    updateMetarUI(data);
    updateStatusPanel("METAR", data);
}

// ------------------------------------------------------
// Mise à jour UI + piste
// ------------------------------------------------------
export function updateMetarUI(data) {
    const el = document.getElementById("metar");
    if (!el) return;

    // Pas de METAR
    if (!data || !data.raw) {
        el.innerText = "METAR indisponible";
        window._activeRunway = null;
        drawRunwayDirection(null);
        updateRunwayPanel("—", null, null, null);
        return;
    }

    // Affichage brut
    el.innerText = data.raw;

    // Extraction vent
    const windDir = data.wind_direction?.value ?? null;
    const windSpeed = data.wind_speed?.value ?? null;

    // Détermination piste active (runways.js)
    const active = getRunwayFromWind(windDir);
    window._activeRunway = active; // ← variable globale cockpit IFR

    // Calcul crosswind / headwind
    const { crosswind, headwind } = computeCrosswind(
        windDir,
        windSpeed,
        active ? active.heading : null
    );

    // Mise à jour panneau piste
    updateRunwayPanel(
        active?.id ?? "—",
        windDir,
        windSpeed,
        crosswind,
        headwind
    );

    // Mise à jour direction piste sur la carte
    drawRunwayDirection(active?.id ?? null);
}
