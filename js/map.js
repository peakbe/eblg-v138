// public/js/map.js

import { RUNWAYS, drawRunway, drawCorridor } from "./runways.js";

export function initMap() {
    if (!window.L) {
        console.error("[MAP] Leaflet non chargé");
        return;
    }

    const mapEl = document.getElementById("map");
    if (!mapEl) {
        console.error("[MAP] #map introuvable");
        return;
    }

    const map = window.L.map("map", {
        center: [50.645, 5.46],
        zoom: 12,
        zoomControl: true
    });

    // *** CRITIQUE ***
    window._map = map;
    
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap"
    }).addTo(map);

    // Couches globales pour les pistes
    window.runwayLayer = window.L.layerGroup().addTo(map);
    window.corridorLayer = window.L.layerGroup().addTo(map);

    // Piste par défaut
    drawRunway("22", window.runwayLayer);
    drawCorridor("22", window.corridorLayer);
}
