// ======================================================
// SONOMETERS PRO++ — Cockpit IFR (compatible backend EBLG)
// ======================================================

import { ENDPOINTS } from "./config.js";
import { fetchJSON } from "./helpers.js";

const IS_DEV = location.hostname.includes("localhost");
const log = (...a) => IS_DEV && console.log("[SONO]", ...a);
const logErr = (...a) => console.error("[SONO ERROR]", ...a);

let sonoMarkers = null;
let sonoHeat = null;

// ------------------------------------------------------
// Chargement principal
// ------------------------------------------------------
export async function loadSonometers() {
    try {
        const data = await fetchJSON(ENDPOINTS.sonometers);

        if (!Array.isArray(data)) {
            logErr("Format sonomètres invalide :", data);
            return;
        }

        renderSonometers(data);
        renderSonoList(data);

        log("Sonomètres chargés :", data.length);
    } catch (err) {
        logErr("Erreur chargement sonomètres :", err);
    }
}

// ------------------------------------------------------
// Rendu carte
// ------------------------------------------------------
function renderSonometers(data) {
    if (!window.map) {
        logErr("Carte non initialisée");
        return;
    }

    // Nettoyage
    if (sonoMarkers) window.map.removeLayer(sonoMarkers);
    if (sonoHeat) window.map.removeLayer(sonoHeat);

    sonoMarkers = window.L.markerClusterGroup({
        disableClusteringAtZoom: 15,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false
    });

    const heatPoints = [];

    data.forEach(s => {
        const lat = s.lat || s.latitude;
        const lng = s.lng || s.longitude;

        if (!lat || !lng) return;

        const latlng = [lat, lng];

        const marker = window.L.circleMarker(latlng, {
            radius: 6,
            color: "#00e5ff",
            weight: 1,
            fillColor: "#00e5ff",
            fillOpacity: 0.7
        });

        marker.bindPopup(`
            <b>Sonomètre ${s.id}</b><br>
            Latitude : ${lat}<br>
            Longitude : ${lng}
        `);

        marker.on("click", () => updateDetailPanel(s));

        sonoMarkers.addLayer(marker);

        // Heatmap (intensité neutre)
        heatPoints.push([lat, lng, 0.4]);
    });

    sonoHeat = window.L.heatLayer(heatPoints, {
        radius: 25,
        blur: 18,
        maxZoom: 17
    });

    sonoMarkers.addTo(window.map);
    sonoHeat.addTo(window.map);
}

// ------------------------------------------------------
// Liste latérale
// ------------------------------------------------------
function renderSonoList(data) {
    const el = document.getElementById("sono-list");
    if (!el) return;

    el.innerHTML = "";

    data.forEach(s => {
        const row = document.createElement("div");
        row.className = "sono-row";

        row.innerHTML = `
            <span class="sono-name">${s.id}</span>
            <span class="sono-town">—</span>
            <span class="sono-level">—</span>
        `;

        row.addEventListener("click", () => {
            const lat = s.lat || s.latitude;
            const lng = s.lng || s.longitude;
            if (window.map && lat && lng) {
                window.map.setView([lat, lng], 15);
            }
            updateDetailPanel(s);
        });

        el.appendChild(row);
    });
}

// ------------------------------------------------------
// Détail panel
// ------------------------------------------------------
function updateDetailPanel(s) {
    const panel = document.getElementById("detail-panel");
    if (!panel) return;

    document.getElementById("detail-title").textContent = `Sonomètre ${s.id}`;
    document.getElementById("detail-address").textContent = "—";
    document.getElementById("detail-town").textContent = "—";
    document.getElementById("detail-status").textContent = "—";
    document.getElementById("detail-distance").textContent = "—";

    panel.classList.remove("hidden");
}
