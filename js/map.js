// ======================================================
// MAP PRO+++ — Cockpit IFR EBLG
// - Piste 04/22 + flèche
// - Corridor bruit aligné
// - Overlay vent (vecteur)
// - Overlay trajectoires DEP/ARR
// ======================================================

import { RUNWAYS } from "./runways.js";

let runwayLine = null;
let runwayArrow = null;
let runwayLabel = null;
let noiseCorridor = null;
let windVector = null;
let depTrack = null;
let arrTrack = null;

// ------------------------------------------------------
// INIT MAP
// ------------------------------------------------------
export function initMap() {
    const map = window.L.map("map", {
        center: [50.64, 5.45],
        zoom: 12,
        zoomControl: true
    });

    window.map = map;

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap"
    }).addTo(map);
}

// ======================================================
// RUNWAY DIRECTION
// ======================================================
export function drawRunwayDirection(runwayId) {
    if (!window.map) return;

    if (runwayLine) window.map.removeLayer(runwayLine);
    if (runwayArrow) window.map.removeLayer(runwayArrow);
    if (runwayLabel) window.map.removeLayer(runwayLabel);

    if (!runwayId || !RUNWAYS[runwayId]) return;

    const rw = RUNWAYS[runwayId];
    const start = rw.start;
    const end = rw.end;

    const color = runwayId === "04" ? "#00e676" : "#2979ff";
    const labelText = runwayId === "04" ? "RWY 04 → NE" : "RWY 22 → SW";

    runwayLine = window.L.polyline([start, end], {
        color,
        weight: 4,
        opacity: 0.9
    }).addTo(window.map);

    if (window.L.polylineDecorator) {
        runwayArrow = window.L.polylineDecorator(runwayLine, {
            patterns: [
                {
                    offset: "50%",
                    repeat: 0,
                    symbol: window.L.Symbol.arrowHead({
                        pixelSize: 18,
                        polygon: false,
                        pathOptions: { stroke: true, color }
                    })
                }
            ]
        }).addTo(window.map);
    }

    runwayLabel = window.L.marker(end, {
        icon: window.L.divIcon({
            className: "runway-label",
            html: `<div style="
                color:${color};
                font-size:14px;
                font-weight:600;
                text-shadow:0 0 4px black;
            ">${labelText}</div>`
        })
    }).addTo(window.map);
}

// ======================================================
// CORRIDOR BRUIT — aligné via vecteurs runways.js
// ======================================================
export function drawNoiseCorridor(runwayId) {
    if (!window.map) return;

    if (noiseCorridor) window.map.removeLayer(noiseCorridor);

    if (!runwayId || !RUNWAYS[runwayId]) return;

    const rwy22 = RUNWAYS["22"];
    const A = rwy22.start;
    const B = rwy22.end;

    const width = 800;

    function offsetPoint(lat, lng, dx, dy) {
        const R = 6378137;
        const newLat = lat + (dy / R) * (180 / Math.PI);
        const newLng = lng + (dx / (R * Math.cos(lat * Math.PI / 180))) * (180 / Math.PI);
        return [newLat, newLng];
    }

    const { left, right } = rwy22.normals;

    const A_left  = offsetPoint(A[0], A[1],  left.nx * width,  left.ny * width);
    const A_right = offsetPoint(A[0], A[1], right.nx * width, right.ny * width);
    const B_left  = offsetPoint(B[0], B[1],  left.nx * width,  left.ny * width);
    const B_right = offsetPoint(B[0], B[1], right.nx * width, right.ny * width);

    const color = runwayId === "04" ? "#00e676" : "#2979ff";

    noiseCorridor = window.L.polygon(
        [A_left, B_left, B_right, A_right],
        {
            color,
            weight: 2,
            opacity: 0.8,
            fillColor: color,
            fillOpacity: 0.15
        }
    ).addTo(window.map);
}

// ======================================================
// OVERLAY VENT — flèche + intensité
// ======================================================
export function drawWindVector(windDir, windSpeed) {
    if (!window.map) return;

    if (windVector) window.map.removeLayer(windVector);

    if (windDir == null || windSpeed == null) return;

    const center = [50.645, 5.45];

    const length = 0.02 * (windSpeed / 10);

    const rad = (windDir - 180) * Math.PI / 180;

    const end = [
        center[0] + Math.sin(rad) * length,
        center[1] + Math.cos(rad) * length
    ];

    windVector = window.L.polyline([center, end], {
        color: "#00e5ff",
        weight: 4,
        opacity: 0.9
    }).addTo(window.map);

    window.L.marker(end, {
        icon: window.L.divIcon({
            className: "wind-label",
            html: `<div style="
                color:#00e5ff;
                font-size:13px;
                font-weight:600;
                text-shadow:0 0 4px black;
            ">${windDir}° / ${windSpeed} kt</div>`
        })
    }).addTo(window.map);
}

// ======================================================
// TRAJECTOIRES DEP / ARR — courbes réalistes
// ======================================================
export function drawTracks(runwayId) {
    if (!window.map) return;

    if (depTrack) window.map.removeLayer(depTrack);
    if (arrTrack) window.map.removeLayer(arrTrack);

    if (!runwayId || !RUNWAYS[runwayId]) return;

    const rw = RUNWAYS[runwayId];
    const A = rw.start;
    const B = rw.end;

    const dx = B[1] - A[1];
    const dy = B[0] - A[0];

    const dep = [
        A,
        [A[0] + dy * 0.02, A[1] - dx * 0.02],
        [A[0] + dy * 0.05, A[1] - dx * 0.05]
    ];

    const arr = [
        [B[0] - dy * 0.05, B[1] + dx * 0.05],
        [B[0] - dy * 0.02, B[1] + dx * 0.02],
        B
    ];

    depTrack = window.L.polyline(dep, {
        color: "#00e676",
        weight: 3,
        opacity: 0.9,
        dashArray: "6,4"
    }).addTo(window.map);

    arrTrack = window.L.polyline(arr, {
        color: "#ff9100",
        weight: 3,
        opacity: 0.9,
        dashArray: "6,4"
    }).addTo(window.map);
}
// ======================================================
// RADAR ADS‑B PRO+++
// ======================================================

let adsbLayer = null;
const ghostTracks = new Map(); // callsign → [{lat, lon, ts}, ...]
const GHOST_MAX_POINTS = 20;
const GHOST_MAX_AGE_MS = 60_000; // 1 minute

export async function updateADSB() {
    if (!window.map) return;

    if (adsbLayer) {
        window.map.removeLayer(adsbLayer);
        adsbLayer = null;
    }

    const url = "https://opensky-network.org/api/states/all";

    let data;
    try {
        const res = await fetch(url);
        data = await res.json();
    } catch (e) {
        console.error("[ADSB] Erreur chargement", e);
        return;
    }

    if (!data?.states) return;

    adsbLayer = window.L.layerGroup().addTo(window.map);

    const now = Date.now();

    data.states.forEach(s => {
        const callsign = (s[1] || "").trim();
        const lat = s[6];
        const lon = s[5];
        const alt = Math.round(s[13] || 0);
        const speed = Math.round((s[9] || 0) * 1.94384);
        const vr = s[11] || 0;

        if (!lat || !lon || !callsign) return;

        // phase
        let color = "#00e5ff";
        if (vr < -300) color = "#ff9100";
        if (vr > 300) color = "#00e676";

        // marker
        const marker = window.L.circleMarker([lat, lon], {
            radius: 6,
            color,
            fillColor: color,
            fillOpacity: 0.9
        }).addTo(adsbLayer);

        marker.bindTooltip(`
            <b>${callsign}</b><br>
            Alt : ${alt} ft<br>
            Vitesse : ${speed} kt<br>
            V/S : ${vr} ft/min
        `);

        // --- GHOST TRACKS ---
        const key = callsign;

        if (!ghostTracks.has(key)) {
            ghostTracks.set(key, []);
        }

        const track = ghostTracks.get(key);
        track.push({ lat, lon, ts: now });

        // purge ancien
        while (track.length > GHOST_MAX_POINTS) track.shift();
        while (track.length && now - track[0].ts > GHOST_MAX_AGE_MS) track.shift();

        if (track.length >= 2) {
            const coords = track.map(p => [p.lat, p.lon]);
            window.L.polyline(coords, {
                color,
                weight: 2,
                opacity: 0.4,
                dashArray: "4,4"
            }).addTo(adsbLayer);
        }
    });
}

// Rafraîchissement automatique
setInterval(updateADSB, 8000);


// ======================================================
// HEATMAP BRUIT DYNAMIQUE PRO+++
// ======================================================

let noiseHeatmap = null;

export function updateNoiseHeatmap(sonos) {
    if (!window.map) return;
    if (!Array.isArray(sonos)) return;

    if (noiseHeatmap) {
        window.map.removeLayer(noiseHeatmap);
        noiseHeatmap = null;
    }

    // Format Leaflet.heat : [lat, lon, intensity]
    const points = sonos.map(s => {
        const lvl = s.level || 40; // fallback
        const intensity = Math.min(1, Math.max(0, (lvl - 40) / 30));
        return [s.lat, s.lon, intensity];
    });

    noiseHeatmap = window.L.heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 14,
        gradient: {
            0.0: "#00e676",
            0.4: "#ffee58",
            0.7: "#ff9100",
            1.0: "#ff1744"
        }
    }).addTo(window.map);
}

// ======================================================
// RESET MAP VIEW PRO+++
// ======================================================

export function resetMapView() {
    if (!window.map) return;

    window.map.setView([50.64, 5.45], 12, {
        animate: true,
        duration: 0.6
    });
}

// ======================================================
// TOGGLE HEATMAP BRUIT PRO+++
// ======================================================

let noiseHeatmapVisible = true;

export function toggleNoiseHeatmap(enabled) {
    noiseHeatmapVisible = enabled;

    if (!window.map) return;

    if (!noiseHeatmapVisible) {
        if (noiseHeatmap) {
            window.map.removeLayer(noiseHeatmap);
        }
        return;
    }

    // Réafficher la heatmap si elle existe déjà
    if (noiseHeatmap) {
        noiseHeatmap.addTo(window.map);
    }
}
