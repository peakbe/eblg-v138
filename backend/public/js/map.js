// ======================================================
// MAP.JS — EBLG Cockpit IFR PRO+++
// ======================================================

import { ENDPOINTS } from "./config.js";
import { fetchJSON } from "./helpers.js";

export let map = null;

// Couches
const adsbLayer = L.layerGroup();
const adsbTracksLayer = L.layerGroup();
const adsbLabelsLayer = L.layerGroup();
let adsbHeatmap = null;

let approachCorridorLayer = L.layerGroup();
let departureCorridorLayer = L.layerGroup();
let noiseZoneLayer = L.layerGroup();
let glidePathLayer = L.layerGroup();

const adsbTracks = new Map();

let adsbFilter = {
    minAlt: 0,
    maxAlt: 45000,
    minSpd: 0,
    maxSpd: 600,
    types: "all"
};

// ======================================================
// INIT MAP
// ======================================================
export function initMap() {

    map = L.map("map", {
        center: [50.645, 5.46],
        zoom: 12,
        preferCanvas: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
    }).addTo(map);

    // Couches ADS-B
    adsbLayer.addTo(map);
    adsbTracksLayer.addTo(map);
    adsbLabelsLayer.addTo(map);

    // Heatmap ADS-B
    adsbHeatmap = L.heatLayer([], {
        radius: 25,
        blur: 15,
        maxZoom: 14
    }).addTo(map);

    console.log("[MAP] Carte initialisée");
}

// ======================================================
// UPDATE ADS-B (Airlabs)
// ======================================================
export async function updateADSB() {
    try {
        const url = ENDPOINTS.adsb;
        const json = await fetchJSON(url);

        if (!json || !json.ac) return;

        const heatPoints = [];

        json.ac.forEach(ac => {
            if (!ac.lat || !ac.lon) return;

            // Heatmap
            heatPoints.push([ac.lat, ac.lon, 0.7]);

            // (tracks, labels, icons…)
        });

        // Heatmap OK
        if (adsbHeatmap) {
            adsbHeatmap.setLatLngs(heatPoints);
        }

    } catch (e) {
        console.error("[ADSB] Erreur chargement", e);
    }
}

// ======================================================
// RESET MAP VIEW
// ======================================================
export function resetMapView() {
    if (!map) return;
    map.setView([50.645, 5.46], 12);
}

// ======================================================
// HEATMAP ON/OFF
// ======================================================
export function toggleNoiseHeatmap(state) {
    if (!adsbHeatmap) return;

    if (state) {
        adsbHeatmap.addTo(map);
    } else {
        map.removeLayer(adsbHeatmap);
    }
}
