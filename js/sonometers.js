// ======================================================
// SONOMETERS PRO++++ — Cockpit IFR EBLG
// ======================================================

import { ENDPOINTS } from "./config.js";
import { fetchJSON } from "./helpers.js";

const IS_DEV = location.hostname.includes("localhost");
const log = (...a) => IS_DEV && console.log("[SONO]", ...a);
const logErr = (...a) => console.error("[SONO ERROR]", ...a);

// Référence piste EBLG (seuil 22)
const REF_LAT = 50.637;
const REF_LNG = 5.443;

let sonoMarkers = null;
let sonoHeat = null;
let sonoDataCache = [];
let markerById = new Map();
let rowById = new Map();

let currentSort = "distance";
let currentTownFilter = "all";

// ======================================================
// COUPLAGE PISTE ACTIVE → SONOMÈTRES (rouge/vert)
// ======================================================

const RWY_SECTORS = {
    "22": {
        green: ["F002","F003","F004","F005","F006","F007","F008","F009","F010","F011","F012","F013","F016"],
        red:   ["F001","F014","F015","F017"]
    },
    "04": {
        green: ["F002","F003","F007","F008","F009","F011","F013","F014","F015"],
        red:   ["F004","F005","F006","F010","F012","F016","F001","F017"]
    }
};

export function applyRunwayColoring(activeRunway) {
    if (!activeRunway || !RWY_SECTORS[activeRunway]) return;

    const greenSet = new Set(RWY_SECTORS[activeRunway].green);
    const redSet   = new Set(RWY_SECTORS[activeRunway].red);

    markerById.forEach((marker, id) => {
        let color = "#00e5ff";

        if (greenSet.has(id)) color = "#00e676";
        if (redSet.has(id))   color = "#f44336";

        marker.setIcon(window.L.divIcon({
            className: "sono-icon",
            html: `<div style="
                width:10px;
                height:10px;
                border-radius:50%;
                background:${color};
                box-shadow:0 0 6px ${color};
            "></div>`,
            iconSize: [10, 10]
        }));
    });

    rowById.forEach((row, id) => {
        row.style.color =
            greenSet.has(id) ? "#00e676" :
            redSet.has(id)   ? "#f44336" :
                               "#00e5ff";
    });
}

// ------------------------------------------------------
// Utils
// ------------------------------------------------------
function getLat(s) { return s.lat ?? s.latitude ?? null; }
function getLng(s) { return s.lng ?? s.lon ?? s.longitude ?? null; }
function getLevel(s) { return typeof s.level === "number" ? s.level : null; }

function getTown(s) {
    if (s.town) return s.town;
    if (s.commune) return s.commune;
    if (s.city) return s.city;
    if (s.address) {
        const parts = s.address.split(",");
        if (parts.length >= 2) return parts[1].trim();
    }
    return "—";
}

function getStatus(s) { return s.status || "Actif"; }

// Haversine
function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Couleur ATC selon niveau sonore
function levelColor(level) {
    if (level == null) return "#00e5ff";
    if (level < 45) return "#00e676";
    if (level < 55) return "#ffeb3b";
    if (level < 65) return "#ff9800";
    return "#f44336";
}

function levelIntensity(level) {
    if (level == null) return 0.3;
    const min = 40, max = 80;
    const clamped = Math.max(min, Math.min(max, level));
    return (clamped - min) / (max - min) * 0.8 + 0.2;
}

function sonoIcon(level) {
    const color = levelColor(level);
    return window.L.divIcon({
        className: "sono-icon",
        html: `<div style="
            width:10px;
            height:10px;
            border-radius:50%;
            background:${color};
            box-shadow:0 0 6px ${color};
        "></div>`,
        iconSize: [10, 10]
    });
}

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

        sonoDataCache = data.map(s => {
            const lat = getLat(s);
            const lng = getLng(s);
            const dist = (lat && lng)
                ? distanceKm(lat, lng, REF_LAT, REF_LNG)
                : null;
            return { ...s, _distanceKm: dist };
        });

        initSonoControls(sonoDataCache);
        renderSonometers(sonoDataCache);
        updateSonoListView();

        log("Sonomètres chargés :", sonoDataCache.length);
    } catch (err) {
        logErr("Erreur chargement sonomètres :", err);
    }
}

// ------------------------------------------------------
// Contrôles (tri + filtre)
// ------------------------------------------------------
function initSonoControls(data) {
    const sortEl = document.getElementById("sono-sort");
    const filterEl = document.getElementById("sono-filter-town");
    if (!sortEl || !filterEl) return;

    const towns = new Set();
    data.forEach(s => {
        const t = getTown(s);
        if (t && t !== "—") towns.add(t);
    });

    filterEl.innerHTML = `<option value="all">Commune: Toutes</option>`;
    Array.from(towns).sort().forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        filterEl.appendChild(opt);
    });

    sortEl.onchange = () => {
        currentSort = sortEl.value;
        updateSonoListView();
    };

    filterEl.onchange = () => {
        currentTownFilter = filterEl.value;
        updateSonoListView();
    };
}

function updateSonoListView() {
    let list = [...sonoDataCache];

    if (currentTownFilter !== "all") {
        list = list.filter(s => getTown(s) === currentTownFilter);
    }

    list.sort((a, b) => {
        if (currentSort === "id") {
            return String(a.id).localeCompare(String(b.id));
        }
        if (currentSort === "address") {
            return String(a.address || "").localeCompare(String(b.address || ""));
        }
        const da = a._distanceKm ?? Infinity;
        const db = b._distanceKm ?? Infinity;
        return da - db;
    });

    renderSonoList(list);
}

// ------------------------------------------------------
// Rendu carte
// ------------------------------------------------------
function renderSonometers(data) {
    if (!window.map) {
        logErr("Carte non initialisée");
        return;
    }

    if (sonoMarkers) window.map.removeLayer(sonoMarkers);
    if (sonoHeat) window.map.removeLayer(sonoHeat);

    sonoMarkers = window.L.markerClusterGroup({
        disableClusteringAtZoom: 15,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false
    });

    const heatPoints = [];
    markerById.clear();

    data.forEach(s => {
        const lat = getLat(s);
        const lng = getLng(s);
        if (!lat || !lng) return;

        const level = getLevel(s);
        const
