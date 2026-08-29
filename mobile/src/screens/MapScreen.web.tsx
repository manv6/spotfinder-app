import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as Location from 'expo-location';

import MapOverlay, { MapStyle, Phase } from '../components/MapOverlay';
import OfflineRadar from '../components/OfflineRadar';
import { useUserLocation } from '../hooks/useUserLocation';
import { useIsOffline } from '../hooks/useIsOffline';
import { usePinpoint } from '../hooks/usePinpoint';
import { LatLng, bearingDegrees, distanceMeters } from '../geo';
import { colors } from '../theme';

const ARRIVED_M = 8;
const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

/** A keyless raster style (dark basemap / satellite imagery). */
function rasterStyle(tiles: string[], attribution: string): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: { base: { type: 'raster', tiles, tileSize: 256, attribution } },
    layers: [{ id: 'base', type: 'raster', source: 'base' }],
  };
}

const DARK = rasterStyle(['a', 'b', 'c'].map((s) => `https://${s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`), '© OpenStreetMap © CARTO');
const SATELLITE = rasterStyle(['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], 'Tiles © Esri');
// Web 3D = the reliably-rendering dark raster base + camera tilt. Keyless VECTOR building
// tiles don't render under Expo's Metro web bundler; the iOS app uses Apple Maps' real 3D.
const STYLES: Record<MapStyle, maplibregl.StyleSpecification> = { simple: DARK, satellite: SATELLITE, '3d': DARK };

function lineFC(a: LatLng, b: LatLng): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [a.longitude, a.latitude],
            [b.longitude, b.latitude],
          ],
        },
      },
    ],
  };
}

/** A geodesic circle polygon (for the GPS accuracy ring). */
function circleFC(center: LatLng, radiusM: number): GeoJSON.FeatureCollection {
  const R = 6371000;
  const lat = (center.latitude * Math.PI) / 180;
  const lng = (center.longitude * Math.PI) / 180;
  const d = radiusM / R;
  const pts: number[][] = [];
  for (let i = 0; i <= 64; i++) {
    const brng = (i / 64) * 2 * Math.PI;
    const lat2 = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(brng));
    const lng2 = lng + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat), Math.cos(d) - Math.sin(lat) * Math.sin(lat2));
    pts.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }
  return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [pts] } }] };
}

function makeDot(html: string): HTMLDivElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el.firstElementChild as HTMLDivElement;
}
const USER_HTML =
  '<div style="width:18px;height:18px;border-radius:50%;background:#38bdf8;border:3px solid #fff;box-shadow:0 0 0 5px rgba(56,189,248,0.25)"></div>';
const SPOT_HTML =
  '<div style="width:22px;height:22px;border-radius:50%;background:rgba(74,222,128,0.2);border:2px solid #4ade80;display:flex;align-items:center;justify-content:center">' +
  '<div style="width:9px;height:9px;border-radius:50%;background:#4ade80"></div></div>';

export default function MapScreen() {
  const { coords, accuracy, heading, status, precise } = useUserLocation();
  const offline = useIsOffline();
  const { pinpointing, bestAccuracy, pinpoint } = usePinpoint(coords, accuracy);
  const [savedSpot, setSavedSpot] = useState<LatLng | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [mapStyle, setMapStyle] = useState<MapStyle>('simple');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const spotMarker = useRef<maplibregl.Marker | null>(null);
  const styleReady = useRef(false);
  const didCenter = useRef(false);
  const firstStyleRun = useRef(true);

  const trail = useRef<LatLng[]>([]);
  useEffect(() => {
    if (!coords) return;
    trail.current.push(coords);
    if (trail.current.length > 6) trail.current.shift();
  }, [coords]);

  // ── Init the map once ──
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLES.simple,
      center: [-122.4194, 37.7749],
      zoom: 12,
    });
    mapRef.current = map;
    map.on('load', () => {
      styleReady.current = true;
      addDataLayers(map);
      pushData();
    });
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Adds the accuracy-ring + nav-line sources/layers (idempotent; re-run after setStyle).
  const addDataLayers = (map: maplibregl.Map) => {
    if (!map.getSource('acc')) map.addSource('acc', { type: 'geojson', data: EMPTY });
    if (!map.getLayer('acc-fill'))
      map.addLayer({ id: 'acc-fill', type: 'fill', source: 'acc', paint: { 'fill-color': colors.accent, 'fill-opacity': 0.1 } });
    if (!map.getLayer('acc-line'))
      map.addLayer({ id: 'acc-line', type: 'line', source: 'acc', paint: { 'line-color': colors.accent, 'line-opacity': 0.4, 'line-width': 1 } });
    if (!map.getSource('nav')) map.addSource('nav', { type: 'geojson', data: EMPTY });
    if (!map.getLayer('nav-line'))
      map.addLayer({ id: 'nav-line', type: 'line', source: 'nav', layout: { 'line-cap': 'round' }, paint: { 'line-color': colors.accent, 'line-width': 4, 'line-dasharray': [1.5, 1] } });
  };

  const pushData = () => {
    const map = mapRef.current;
    if (!map || !styleReady.current) return;
    (map.getSource('acc') as maplibregl.GeoJSONSource | undefined)?.setData(coords && accuracy ? circleFC(coords, accuracy) : EMPTY);
    (map.getSource('nav') as maplibregl.GeoJSONSource | undefined)?.setData(phase === 'nav' && coords && savedSpot ? lineFC(coords, savedSpot) : EMPTY);
  };

  // Keep sources in sync with state.
  useEffect(pushData, [coords, accuracy, savedSpot, phase]);

  // User + saved markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !coords) return;
    if (!userMarker.current) userMarker.current = new maplibregl.Marker({ element: makeDot(USER_HTML) }).setLngLat([coords.longitude, coords.latitude]).addTo(map);
    else userMarker.current.setLngLat([coords.longitude, coords.latitude]);
  }, [coords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (savedSpot) {
      if (!spotMarker.current) spotMarker.current = new maplibregl.Marker({ element: makeDot(SPOT_HTML) }).setLngLat([savedSpot.longitude, savedSpot.latitude]).addTo(map);
      else spotMarker.current.setLngLat([savedSpot.longitude, savedSpot.latitude]);
    } else if (spotMarker.current) {
      spotMarker.current.remove();
      spotMarker.current = null;
    }
  }, [savedSpot]);

  // Center closely on the first fix.
  useEffect(() => {
    if (coords && !didCenter.current && mapRef.current) {
      didCenter.current = true;
      mapRef.current.easeTo({ center: [coords.longitude, coords.latitude], zoom: 18, duration: 800 });
    }
  }, [coords]);

  // React to map-style changes. Only reload tiles when the base changes (simple ↔ 3d
  // share the dark base — we just tilt the camera).
  const currentBase = useRef<'dark' | 'esri'>('dark');
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (firstStyleRun.current) {
      firstStyleRun.current = false;
      return; // initial 'simple' already applied by init
    }
    const pitch = mapStyle === '3d' ? 60 : 0;
    const base = mapStyle === 'satellite' ? 'esri' : 'dark';
    if (base !== currentBase.current) {
      currentBase.current = base;
      styleReady.current = false;
      map.setStyle(STYLES[mapStyle]);
      map.once('style.load', () => {
        styleReady.current = true;
        addDataLayers(map);
        pushData();
        map.easeTo({ pitch, duration: 500 });
      });
    } else {
      map.easeTo({ pitch, duration: 500 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle]);

  // ── Actions ──
  const locate = async () => {
    const map = mapRef.current;
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
      map?.easeTo({ center: [loc.coords.longitude, loc.coords.latitude], zoom: 18, duration: 600 });
    } catch {
      if (coords) map?.easeTo({ center: [coords.longitude, coords.latitude], zoom: 18, duration: 600 });
    }
  };
  const markSpot = async () => {
    if (!coords) return;
    const spot = await pinpoint();
    setSavedSpot(spot ?? coords);
    setPhase('saved');
  };
  const clearSpot = () => {
    setSavedSpot(null);
    setPhase('idle');
  };
  const startNav = () => {
    setPhase('nav');
    const map = mapRef.current;
    if (map && coords && savedSpot) {
      map.fitBounds(
        [
          [coords.longitude, coords.latitude],
          [savedSpot.longitude, savedSpot.latitude],
        ],
        { padding: { top: 120, bottom: 360, left: 80, right: 80 }, duration: 700 },
      );
    }
  };

  const nav = useMemo(() => {
    if (!coords || !savedSpot) return null;
    const dist = distanceMeters(coords, savedSpot);
    const brng = bearingDegrees(coords, savedSpot);
    let arrowAngle = brng;
    let hint = 'walk a few steps to get your heading';
    if (heading != null) {
      arrowAngle = brng - heading;
      hint = 'follow the arrow';
    } else {
      const t = trail.current;
      if (t.length >= 1 && distanceMeters(t[0], coords) > 3) {
        arrowAngle = brng - bearingDegrees(t[0], coords);
        hint = 'follow the arrow';
      }
    }
    return { dist, arrowAngle, hint, arrived: dist < ARRIVED_M };
  }, [coords, savedSpot, heading]);

  const ribbon = useMemo((): { color: string; text: string; blink: boolean } => {
    if (status === 'denied') return { color: colors.red, text: 'Location permission denied', blink: false };
    if (!coords) return { color: colors.accent, text: 'Locating you…', blink: true };
    if (phase === 'nav' && nav) return { color: colors.orange, text: `${nav.dist.toFixed(0)} m to your spot`, blink: true };
    const a = accuracy ?? 999;
    return { color: a < 10 ? colors.green : colors.accent, text: `GPS accuracy ±${a < 10 ? a.toFixed(1) : Math.round(a)} m`, blink: false };
  }, [status, coords, phase, nav, accuracy]);

  return (
    <View style={styles.screen}>
      {/* MapLibre renders into this div; the RN-web overlay sits above it. */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
      {/* When offline, cover the (kept-alive) map with the network-free radar. */}
      {offline && (
        <View style={styles.offlineCover}>
          <OfflineRadar coords={coords} savedSpot={savedSpot} heading={heading} />
        </View>
      )}
      <MapOverlay
        ribbon={ribbon}
        phase={phase}
        nav={nav}
        hasCoords={!!coords}
        offline={offline}
        precise={precise}
        pinpointing={pinpointing}
        pinpointAccuracy={bestAccuracy}
        mapStyle={mapStyle}
        onSetStyle={setMapStyle}
        onMark={markSpot}
        onNavigate={startNav}
        onClear={clearSpot}
        onStop={() => setPhase('saved')}
        onLocate={locate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  offlineCover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg },
});
