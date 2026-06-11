"use client";

import * as React from "react";
import { LocateFixed, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export type LatLng = { lat: number; lng: number };

type Props = {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
  /** Map labels (passed from the i18n-aware parent). */
  labels: {
    instructions: string;
    useMyLocation: string;
    locating: string;
    selected: string;
    geoError: string;
    geoDenied: string;
    geoUnavailable: string;
    geoTimeout: string;
    geoInsecure: string;
  };
};

// Kuwait City — sensible default center.
const DEFAULT_CENTER: LatLng = { lat: 29.3759, lng: 47.9774 };
const LEAFLET_CSS =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const LEAFLET_JS =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";

// Minimal typing for the slice of the Leaflet API we touch.
type LeafletMarker = { setLatLng: (ll: LatLng) => void; getLatLng: () => LatLng };
type LeafletMap = {
  setView: (center: [number, number], zoom: number) => LeafletMap;
  on: (evt: string, cb: (e: { latlng: LatLng }) => void) => void;
  remove: () => void;
};
type LeafletNS = {
  map: (el: HTMLElement, opts?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, opts?: Record<string, unknown>) => { addTo: (m: LeafletMap) => void };
  marker: (ll: LatLng, opts?: Record<string, unknown>) => {
    addTo: (m: LeafletMap) => LeafletMarker;
    on: (evt: string, cb: () => void) => void;
  };
  divIcon: (opts: Record<string, unknown>) => unknown;
};

declare global {
  interface Window {
    L?: LeafletNS;
  }
}

let leafletPromise: Promise<LeafletNS> | null = null;

function loadLeaflet(): Promise<LeafletNS> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise<LeafletNS>((resolve, reject) => {
    // CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    // JS
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${LEAFLET_JS}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L!));
      existing.addEventListener("error", reject);
      if (window.L) resolve(window.L);
      return;
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => (window.L ? resolve(window.L) : reject(new Error("Leaflet failed")));
    script.onerror = () => reject(new Error("Leaflet failed to load"));
    document.body.appendChild(script);
  });
  return leafletPromise;
}

export function LocationPicker({ value, onChange, labels }: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<LeafletMap | null>(null);
  const markerRef = React.useRef<LeafletMarker | null>(null);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  const [ready, setReady] = React.useState(false);
  const [locating, setLocating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Initialise the map once.
  React.useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const start = value ?? DEFAULT_CENTER;
        const map = L.map(containerRef.current, {
          center: [start.lat, start.lng],
          zoom: value ? 16 : 11,
        } as Record<string, unknown>);
        map.setView([start.lat, start.lng], value ? 16 : 11);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);

        const pinIcon = L.divIcon({
          className: "",
          html: `<div style="font-size:28px;line-height:1;transform:translate(-50%,-100%)">📍</div>`,
          iconSize: [1, 1],
        });

        function place(ll: LatLng) {
          if (markerRef.current) {
            markerRef.current.setLatLng(ll);
          } else {
            const m = L.marker(ll, {
              draggable: true,
              icon: pinIcon,
            } as Record<string, unknown>);
            const added = m.addTo(map);
            m.on("dragend", () => {
              const p = added.getLatLng();
              onChangeRef.current({ lat: p.lat, lng: p.lng });
            });
            markerRef.current = added;
          }
          onChangeRef.current(ll);
        }

        map.on("click", (e) => place({ lat: e.latlng.lat, lng: e.latlng.lng }));
        if (value) place(value);

        mapRef.current = map;
        setReady(true);
      })
      .catch(() => setError(labels.geoError));

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError(labels.geoUnavailable);
      return;
    }
    // Geolocation only works on https:// or localhost.
    if (
      typeof window !== "undefined" &&
      !window.isSecureContext &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setError(labels.geoInsecure);
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const map = mapRef.current;
        if (map) {
          map.setView([ll.lat, ll.lng], 16);
          // Re-use the click path to drop/move the marker.
          if (markerRef.current) markerRef.current.setLatLng(ll);
        }
        onChangeRef.current(ll);
        // Ensure a marker exists even before any click.
        if (!markerRef.current && window.L && map) {
          const L = window.L;
          const icon = L.divIcon({
            className: "",
            html: `<div style="font-size:28px;line-height:1;transform:translate(-50%,-100%)">📍</div>`,
            iconSize: [1, 1],
          });
          const m = L.marker(ll, {
            draggable: true,
            icon,
          } as Record<string, unknown>);
          const added = m.addTo(map);
          m.on("dragend", () => {
            const p = added.getLatLng();
            onChangeRef.current({ lat: p.lat, lng: p.lng });
          });
          markerRef.current = added;
        }
        setLocating(false);
      },
      (err) => {
        // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        if (err.code === 1) setError(labels.geoDenied);
        else if (err.code === 3) setError(labels.geoTimeout);
        else if (err.code === 2) setError(labels.geoUnavailable);
        else setError(labels.geoError);
        setLocating(false);
      },
      // High accuracy needs GPS; desktops locate via Wi-Fi/IP, so keep it off
      // for a faster, more reliable fix and allow a cached position.
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 text-primary" />
          {labels.instructions}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={useMyLocation}
          disabled={locating}
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LocateFixed className="size-4" />
          )}
          {locating ? labels.locating : labels.useMyLocation}
        </Button>
      </div>
      <div
        ref={containerRef}
        className="h-56 w-full overflow-hidden rounded-xl border border-border bg-muted"
        style={{ minHeight: "14rem" }}
      />
      {!ready && !error ? (
        <p className="text-xs text-muted-foreground">…</p>
      ) : null}
      {value ? (
        <p className="text-xs text-primary">
          {labels.selected}: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
