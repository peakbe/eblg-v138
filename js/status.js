// ======================================================
// STATUS.JS — v150 Cockpit IFR
// Monitoring METAR / TAF / FIDS / SONO
// Compatible Render Free Tier (cold start 6–12 sec)
// ======================================================

import { ENDPOINTS } from "./config.js";

const IS_DEV = location.hostname.includes("localhost");
const log = (...a) => IS_DEV && console.log("[STATUS]", ...a);
const logErr = (...a) => console.error("[STATUS ERROR]", ...a);

// ======================================================
// PUBLIC — appelé depuis app.js
// ======================================================
export async function checkApiStatus() {
    log("Vérification statut API…");

    const results = {
        METAR: await ping("METAR", ENDPOINTS.metar),
        TAF: await ping("TAF", ENDPOINTS.taf),
        FIDS: await ping("FIDS", ENDPOINTS.fids),
        SONO: await ping("SONO", ENDPOINTS.sonometers)
    };

    updateStatusPanel(results);
}

// ======================================================
// PING PRO+ — timeout 12 sec (Render Free Tier)
// ======================================================
async function ping(name, url) {
    const controller = new AbortController();

    // Render Free Tier cold start = 6–12 sec
    const timeout = setTimeout(() => controller.abort(), 12000);

    const t0 = performance.now();

    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        const dt = Math.round(performance.now() - t0);

        if (!res.ok) {
            logErr(`${name} → DOWN (${dt} ms)`);
            return "DOWN";
        }

        log(`${name} → OK (${dt} ms)`);
        return "OK";

    } catch (err) {
        clearTimeout(timeout);
        logErr(`${name} → DOWN (timeout / erreur)`);
        return "DOWN";
    }
}

// ======================================================
// UI — Mise à jour du panneau statut API
// ======================================================
function updateStatusPanel(results) {
    const el = document.getElementById("api-status");
    if (!el) return;

    el.innerHTML = `
        <div class="status-row">
            <span>METAR</span>
            <span class="status-dot ${color(results.METAR)}"></span>
        </div>
        <div class="status-row">
            <span>TAF</span>
            <span class="status-dot ${color(results.TAF)}"></span>
        </div>
        <div class="status-row">
            <span>FIDS</span>
            <span class="status-dot ${color(results.FIDS)}"></span>
        </div>
        <div class="status-row">
            <span>Sonomètres</span>
            <span class="status-dot ${color(results.SONO)}"></span>
        </div>
    `;
}

// ======================================================
// Couleurs ATC
// ======================================================
function color(state) {
    switch (state) {
        case "OK": return "green";
        case "DOWN": return "red";
        default: return "orange";
    }
}
