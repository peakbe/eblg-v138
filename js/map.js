// =========================
// MAP MODULE PRO+
// =========================

import { drawRunway, drawCorridor } from "./runways.js";

let map = null;

export function initMap() {
    try {
        const container = document.getElementById("map");
        if (!container) {
            throw new Error("Map container #map introuvable dans le DOM.");
        }

        if (map !== null) {
            console.warn("[MAP] initMap() ignoré : carte déjà initialisée.");
            return map;
        }

        map = L.map("map", {
            zoomControl: true,
            preferCanvas: true
        }).setView([50.646, 5.463], 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap"
        }).addTo(map);

        window.runwayLayer = L.layerGroup().addTo(map);
        window.corridorLayer = L.layerGroup().addTo(map);

        drawRunway("22", window.runwayLayer);
        drawCorridor("22", window.corridorLayer);

        console.log("[MAP] Carte initialisée avec succès.");
        return map;

    } catch (err) {
        console.error("[MAP ERROR] Erreur initMap :", err);
        return null;
    }
}

export function getMap() {
    return map;
}
