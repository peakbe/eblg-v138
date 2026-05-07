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

window.addEventListener("DOMContentLoaded", () => {

    // *** CRITIQUE : initialisation de la carte ***
    initMap();

    // Chargements initiaux
    safeLoadMetar();
    safeLoadTaf();
    safeLoadFids();
    loadSonometers();   // ← indispensable pour afficher les sonomètres
    checkApiStatus();
    startLiveLogs();

    // Rafraîchissements périodiques
    setInterval(safeLoadMetar, 60_000);
    setInterval(safeLoadTaf, 5 * 60_000);
    setInterval(safeLoadFids, 60_000);
    setInterval(loadSonometers, 60_000);   // ← refresh sonomètres
    setInterval(checkApiStatus, 30_000);
});

