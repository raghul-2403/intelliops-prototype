import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

function getTrackingState(lastSeenValue) {
  if (!lastSeenValue) {
    return {
      status: "NOT_STARTED",
      ageInMinutes: null,
    };
  }

  const lastSeenAt = new Date(lastSeenValue);
  const ageInMinutes = Math.floor(
    (Date.now() - lastSeenAt.getTime()) / 60000
  );

  if (ageInMinutes <= 2) {
    return {
      status: "LIVE",
      ageInMinutes,
    };
  }

  if (ageInMinutes <= 10) {
    return {
      status: "STALE",
      ageInMinutes,
    };
  }

  return {
    status: "OFFLINE",
    ageInMinutes,
  };
}

const origin = [13.0827, 80.2707]; // Chennai
const destination = [9.9252, 78.1198]; // Madurai

const driverIcon = L.divIcon({
  className: "driver-map-marker",
  html: `
    <div class="driver-map-marker-inner">
      🚚
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -22],
});

function FollowDriver({ driverPosition }) {
  const map = useMap();

  useEffect(() => {
    if (driverPosition) {
      map.flyTo(driverPosition, 9, {
        duration: 0.8,
      });
    }
  }, [driverPosition, map]);

  return null;
}

export default function LiveMap({ shipment }) {

  const { status: trackingStatus, ageInMinutes } =
  getTrackingState(shipment?.last_seen_at);

  const driverPosition =
    shipment?.current_latitude != null &&
    shipment?.current_longitude != null
      ? [
          Number(shipment.current_latitude),
          Number(shipment.current_longitude),
        ]
      : null;

  const routePoints = driverPosition
    ? [origin, driverPosition, destination]
    : [origin, destination];

  const initialCenter = driverPosition ?? [
    (origin[0] + destination[0]) / 2,
    (origin[1] + destination[1]) / 2,
  ];

  return (
    <section className="live-map-panel">
      <div className="live-map-heading">
        <div>
          <p className="eyebrow">LIVE ROUTE MONITORING</p>
          <h1>Driver live map</h1>
          <p>
            {driverPosition
              ? "The driver location is updated from shared GPS."
              : "Waiting for the driver to share GPS location."}
          </p>
        </div>

        <span className="live-map-status">
          <span />
          LIVE
        </span>
      </div>

      <div
  className={`map-tracking-status ${trackingStatus.toLowerCase()}`}
>
  <span />

  {trackingStatus === "LIVE" && "LIVE GPS"}

  {trackingStatus === "STALE" &&
    `STALE — last seen ${ageInMinutes} min ago`}

  {trackingStatus === "OFFLINE" &&
    `OFFLINE — last seen ${ageInMinutes} min ago`}

  {trackingStatus === "NOT_STARTED" && "WAITING FOR GPS"}
</div>
      
      {trackingStatus === "STALE" && (
  <div className="tracking-alert stale-alert">
    <strong>GPS update delayed</strong>
    <span>
      Showing the driver&apos;s last known location from{" "}
      {ageInMinutes} minutes ago.
    </span>
  </div>
)}

{trackingStatus === "OFFLINE" && (
  <div className="tracking-alert offline-alert">
    <strong>Driver may be offline</strong>
    <span>
      The phone may be switched off, out of network coverage, or GPS
      may be disabled. Contact the driver before taking action.
    </span>
  </div>
)}

      <div className="live-map-wrapper">
        <MapContainer
          center={initialCenter}
          zoom={8}
          scrollWheelZoom
          className="live-map"
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <Polyline
            positions={routePoints}
            pathOptions={{
              color: "#4f8cff",
              weight: 5,
              opacity: 0.85,
              dashArray: driverPosition ? undefined : "10 10",
            }}
          />

          <Marker position={origin}>
            <Popup>Starting point: Chennai</Popup>
          </Marker>

          <Marker position={destination}>
            <Popup>Destination: Madurai</Popup>
          </Marker>

          {driverPosition && (
            <>
              <Marker position={driverPosition} icon={driverIcon}>
                <Popup>
                  <strong>Driver location</strong>
                  <br />
                  {shipment.shipment_number}
                  <br />
                  Temperature:{" "}
                  {shipment.current_temperature ?? "--"}°C
                  <br />
                  Humidity:{" "}
                  {shipment.current_humidity ?? "--"}%
                </Popup>
              </Marker>

              <FollowDriver driverPosition={driverPosition} />
            </>
          )}
        </MapContainer>
      </div>

      <div className="live-map-details">
        <span>
          Shipment: <strong>{shipment?.shipment_number ?? "--"}</strong>
        </span>

        <span>
          Driver GPS:{" "}
          <strong>
            {driverPosition ? "Available" : "Waiting"}
          </strong>
        </span>

        <span>
          Temperature:{" "}
          <strong>
            {shipment?.current_temperature != null
              ? `${shipment.current_temperature}°C`
              : "--"}
          </strong>
        </span>

        <span>
          Humidity:{" "}
          <strong>
            {shipment?.current_humidity != null
              ? `${shipment.current_humidity}%`
              : "--"}
          </strong>
        </span>
      </div>
    </section>
  );
}