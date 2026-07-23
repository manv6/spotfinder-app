import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

import MapOverlay, { MapStyle, Phase } from '../components/MapOverlay';
import OfflineRadar from '../components/OfflineRadar';
import { useUserLocation } from '../hooks/useUserLocation';
import { useIsOffline } from '../hooks/useIsOffline';
import { usePinpoint } from '../hooks/usePinpoint';
import { LatLng, bearingDegrees, distanceMeters } from '../geo';
import { colors } from '../theme';

const ARRIVED_M = 8;
const CLOSE = { latitudeDelta: 0.002, longitudeDelta: 0.002 };

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const { coords, accuracy, heading, status, precise } = useUserLocation();
  const offline = useIsOffline();
  const { pinpointing, bestAccuracy, pinpoint } = usePinpoint(coords, accuracy);

  const [savedSpot, setSavedSpot] = useState<LatLng | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [mapStyle, setMapStyle] = useState<MapStyle>('simple');

  const trail = useRef<LatLng[]>([]);
  useEffect(() => {
    if (!coords) return;
    trail.current.push(coords);
    if (trail.current.length > 6) trail.current.shift();
  }, [coords]);

  const didCenter = useRef(false);
  useEffect(() => {
    if (coords && !didCenter.current) {
      didCenter.current = true;
      mapRef.current?.animateToRegion({ ...coords, ...CLOSE }, 700);
    }
  }, [coords]);

  // Tilt the camera into a 3D perspective for the "3D" style.
  useEffect(() => {
    mapRef.current?.animateCamera({ pitch: mapStyle === '3d' ? 60 : 0 }, { duration: 500 });
  }, [mapStyle]);

  const locate = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
      mapRef.current?.animateToRegion({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, ...CLOSE }, 500);
    } catch {
      if (coords) mapRef.current?.animateToRegion({ ...coords, ...CLOSE }, 500);
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
    if (coords && savedSpot) {
      mapRef.current?.fitToCoordinates([coords, savedSpot], {
        edgePadding: { top: 140, right: 80, bottom: 380, left: 80 },
        animated: true,
      });
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
      {offline ? (
        <OfflineRadar coords={coords} savedSpot={savedSpot} heading={heading} />
      ) : (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          showsBuildings
          toolbarEnabled={false}
          userInterfaceStyle="dark"
          mapType={mapStyle === 'satellite' ? 'hybrid' : 'standard'}
          initialRegion={{ latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        >
          {coords && accuracy != null && accuracy > 0 && (
            <Circle
              center={coords}
              radius={accuracy}
              strokeColor="rgba(56,189,248,0.4)"
              fillColor="rgba(56,189,248,0.1)"
              strokeWidth={1}
            />
          )}
          {savedSpot && (
            <Marker coordinate={savedSpot} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
              <View style={styles.spotMarker}>
                <View style={styles.spotMarkerCore} />
              </View>
            </Marker>
          )}
          {phase === 'nav' && coords && savedSpot && (
            <Polyline coordinates={[coords, savedSpot]} strokeColor={colors.accent} strokeWidth={4} />
          )}
        </MapView>
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
  spotMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.greenSoft,
    borderWidth: 2,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotMarkerCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green },
});
