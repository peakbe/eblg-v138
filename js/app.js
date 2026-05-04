// =========================
// APP.JS PRO+ (VERSION HARMONISÉE)
// =========================

import { initMap } from "./map.js";

import { safeLoadMetar } from "./metar.js";
import { safeLoadTaf } from "./taf.js";
import { safeLoadFids } from "./fids.js";

import { loadSonometers, toggleHeatmap } from "./sonometers.js";

import { checkApiStatus } from "./status.js";   // ✔ Harmonisé
import { loadLogs } from "./logs.js";           // ✔ Harmonisé
import { startLiveLogs } from "./logsLive.js";  // ✔ Harmonisé

// ============================
// INITIALISATION UNIQUE
// ============================

document.addEventListener("DOMContentLoaded", () => {
    console.log("[APP] Initialisation…");

    const map = initMap();
    if (!map) {
        console.error("[APP ERROR] La carte n'a pas pu être initialisée.");
        return;
    }
    window._map = map;

    console.log("[APP] Carte prête. Chargement des modules…");

    // Chargement des modules
    safeLoadMetar();
    safeLoadTaf();
    safeLoadFids();
    loadSonometers();

    // Monitoring
    checkApiStatus();   // ✔ Remplace updateStatusPanel()
    loadLogs();         // ✔ Remplace updateLogs()
    startLiveLogs();
});

// ============================
// SIDEBAR TOGGLE PRO+
// ============================

const sidebar = document.getElementById("sidebar");
const toggle = document.getElementById("sidebar-toggle");

toggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
});

// ============================
// HEATMAP BUTTON
// ============================

document.getElementById("toggle-heatmap").addEventListener("click", () => {
    toggleHeatmap(window._map);
});

