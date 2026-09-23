"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Place = {
  name: string;
  position: [number, number];
  type?: string;
  day?: number;
};

type MapProps = {
  position: [number, number];
  destination: string;
  places?: Place[];
  selectedPlace?: Place | null;
};

const markerIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ChangeMapView({
  position,
}: {
  position: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, 13);
  }, [position, map]);

  return null;
}

function FocusSelectedPlace({
  selectedPlace,
}: {
  selectedPlace?: Place | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedPlace) return;

    map.flyTo(selectedPlace.position, 16, {
      duration: 1.2,
    });
  }, [selectedPlace, map]);

  return null;
}

function FitRoute({
  route,
}: {
  route: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (route.length < 2) return;

    const bounds = L.latLngBounds(route);

    map.fitBounds(bounds, {
      padding: [50, 50],
    });
  }, [route, map]);

  return null;
}

export default function Map({
  position,
  destination,
  places = [],
  selectedPlace = null,
}: MapProps) {
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  const [selectedDay, setSelectedDay] =
    useState<number | null>(null);

  const [route, setRoute] = useState<
    [number, number][]
  >([]);

  const [routeLoading, setRouteLoading] =
    useState(false);

  const [routeError, setRouteError] =
    useState("");

  useEffect(() => {
    if (!selectedPlace) return;

    const key = `${selectedPlace.day}-${selectedPlace.name}`;

    const timer = setTimeout(() => {
      markerRefs.current[key]?.openPopup();
    }, 1250);

    return () => clearTimeout(timer);
  }, [selectedPlace]);

  const days = Array.from(
    new Set(
      places
        .map((place) => place.day)
        .filter(
          (day): day is number =>
            typeof day === "number"
        )
    )
  ).sort((a, b) => a - b);

  const visiblePlaces =
    selectedDay === null
      ? places
      : places.filter(
          (place) => place.day === selectedDay
        );

  useEffect(() => {
    async function loadRoute() {
      if (selectedDay === null) {
        setRoute([]);
        setRouteError("");
        return;
      }

      const dayPlaces = places.filter(
        (place) => place.day === selectedDay
      );

      if (dayPlaces.length < 2) {
        setRoute([]);
        setRouteError(
          "Not enough stops were found to create a route."
        );
        return;
      }

      try {
        setRouteLoading(true);
        setRouteError("");
        setRoute([]);
        const coordinates = dayPlaces
          .map(
            (place) =>
              `${place.position[1]},${place.position[0]}`
          )
          .join(";");

        const response = await fetch(
          `https://router.project-osrm.org/route/v1/foot/${coordinates}?overview=full&geometries=geojson`
        );

        if (!response.ok) {
          throw new Error("Route request failed");
        }

        const data = await response.json();

        if (
          data.code !== "Ok" ||
          !data.routes ||
          data.routes.length === 0
        ) {
          throw new Error("No route found");
        }

        const routeCoordinates =
          data.routes[0].geometry.coordinates.map(
            (coordinate: [number, number]) =>
              [
                coordinate[1],
                coordinate[0],
              ] as [number, number]
          );

        setRoute(routeCoordinates);
      } catch (error) {
        console.error("Route error:", error);

        setRoute([]);
        setRouteError(
          "Could not create a route for this day."
        );
      } finally {
        setRouteLoading(false);
      }
    }

    loadRoute();
  }, [selectedDay, places]);

  return (
    <div>
      
      {places.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedDay(null)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              selectedDay === null
                ? "border-black bg-black text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
            }`}
          >
            All places
          </button>

          {days.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() =>
                setSelectedDay(day)
              }
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                selectedDay === day
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
              }`}
            >
              Day {day}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white">
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true}
          style={{
            height: "500px",
            width: "100%",
          }}
        >
          <ChangeMapView position={position} />

          <FocusSelectedPlace
            selectedPlace={selectedPlace}
          />

          <FitRoute route={route} />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          
          {selectedDay === null && (
            <Marker
              position={position}
              icon={markerIcon}
            >
              <Popup>
                <strong>{destination}</strong>
                <br />
                Trip destination
              </Popup>
            </Marker>
          )}

          
          {visiblePlaces.map((place, index) => {
            const key = `${place.day}-${place.name}`;

            return (
              <Marker
                key={`${key}-${index}`}
                position={place.position}
                icon={markerIcon}
                ref={(marker) => {
                  markerRefs.current[key] =
                    marker;
                }}
              >
                <Popup>
                  <strong>{place.name}</strong>

                  {place.day && (
                    <>
                      <br />
                      Day {place.day}
                    </>
                  )}

                  {place.type && (
                    <>
                      <br />
                      {place.type}
                    </>
                  )}
                </Popup>
              </Marker>
            );
          })}

          
          {route.length > 1 && (
            <Polyline
              positions={route}
              weight={5}
              opacity={0.8}
            />
          )}
        </MapContainer>
      </div>

      
      {routeLoading && (
        <p className="mt-3 text-center text-xs text-gray-400">
          Creating route for Day {selectedDay}...
        </p>
      )}

      {!routeLoading && routeError && (
        <p className="mt-3 text-center text-xs text-red-500">
          {routeError}
        </p>
      )}

      {!routeLoading &&
        !routeError &&
        selectedDay !== null &&
        route.length > 1 && (
          <p className="mt-3 text-center text-xs text-gray-400">
            Route for Day {selectedDay} ·{" "}
            {
              places.filter(
                (place) =>
                  place.day === selectedDay
              ).length
            }{" "}
            stops
          </p>
        )}
    </div>
  );
}