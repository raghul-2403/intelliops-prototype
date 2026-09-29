import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  Package,
  Phone,
  Thermometer,
  Truck,
  UserRound,
} from "lucide-react";
import { supabase } from "./lib/supabase";

export default function DriverDashboard({ profile, onLogout }) {
  const [shipment, setShipment] = useState(null);
  const [recoveryAlert, setRecoveryAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [locationStatus, setLocationStatus] = useState("Not shared");
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [coordinator, setCoordinator] = useState(null);

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return undefined;
    }

    async function loadDriverData() {
      const { data: shipmentRows, error: shipmentError } = await supabase
       .from("shipments")
       .select("*")
       .eq("driver_id", profile.id)
       .limit(1);

    if (shipmentError) {
      console.error("Shipment loading failed:", shipmentError);
    }

    const shipmentData = shipmentRows?.[0] ?? null;

    console.log("Profile ID used:", profile.id);
    console.log("Shipment rows returned:", shipmentRows);
    console.log("Shipment selected:", shipmentData);
      

      const { data: coordinatorData, error: coordinatorError } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("role", "coordinator")
        .limit(1)
        .maybeSingle();

      if (coordinatorError) {
        console.error("Coordinator loading failed:", coordinatorError);
      }

      const { data: alertData, error: alertError } = await supabase
        .from("recovery_instructions")
        .select("*")
        .eq("driver_id", profile.id)
        .in("status", ["SENT", "ACKNOWLEDGED", "IN_PROGRESS"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (alertError) {
        console.error("Recovery alert loading failed:", alertError);
      }

      setShipment(shipmentData);
      setCoordinator(coordinatorData);
      setRecoveryAlert(alertData);
      setLoading(false);
    }

    loadDriverData();

    const channel = supabase
      .channel(`driver-alerts-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recovery_instructions",
          filter: `driver_id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setRecoveryAlert(null);
          } else {
            setRecoveryAlert(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  async function acknowledgeRecovery() {
    if (!recoveryAlert?.id) return;

    const { data, error } = await supabase
      .from("recovery_instructions")
      .update({
        status: "ACKNOWLEDGED",
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", recoveryAlert.id)
      .select()
      .single();

    if (error) {
      console.error("Could not acknowledge recovery:", error);
      return;
    }

    setRecoveryAlert(data);
  }

  function shareLocation() {
    setShowLocationConfirm(true);
  }

  function confirmShareLocation() {
    setShowLocationConfirm(false);

    if (!navigator.geolocation) {
      setLocationStatus("GPS unavailable");
      return;
    }

    setLocationStatus("Finding location...");

    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      }
    );
  }

  async function handleLocationSuccess(position) {
  const nextLocation = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: Math.round(position.coords.accuracy),
  };

  setLocation(nextLocation);

  if (!shipment?.id) {
    console.error("Shipment ID is missing:", shipment);
    setLocationStatus("Shipment not found");
    return;
  }

  try {
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${nextLocation.latitude}&longitude=${nextLocation.longitude}&current=temperature_2m,relative_humidity_2m&timezone=auto`
    );

    if (!weatherResponse.ok) {
      throw new Error(
        `Weather request failed with status ${weatherResponse.status}`
      );
    }

    const weatherData = await weatherResponse.json();

    const nextWeather = {
      temperature: weatherData.current.temperature_2m,
      humidity: weatherData.current.relative_humidity_2m,
    };

    setWeather(nextWeather);

    const sharedAt = new Date().toISOString();

    const updatePayload = {
      current_latitude: nextLocation.latitude,
      current_longitude: nextLocation.longitude,
      location_accuracy: nextLocation.accuracy,
      location_shared_at: sharedAt,
      current_temperature: nextWeather.temperature,
      current_humidity: nextWeather.humidity,
      weather_updated_at: sharedAt,
      tracking_status: "LIVE",
      last_seen_at: sharedAt,
      last_seen_status: "GPS_CONNECTED",
};

    console.log("Updating shipment:", shipment.id);
    console.log("Update payload:", updatePayload);

    const { data: updatedShipment, error } = await supabase
      .from("shipments")
      .update(updatePayload)
      .eq("id", shipment.id)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase shipment update failed:", error);
      setLocationStatus(`Save failed: ${error.message}`);
      return;
    }

    console.log("Shipment updated successfully:", updatedShipment);

    setShipment(updatedShipment);
    setLocationStatus("Location shared just now");
  } catch (error) {
    console.error("GPS/weather save failed:", error);
    setWeather(null);
    setLocationStatus("Could not share location");
  }
}

  function handleLocationError(error) {
    console.error("Location loading failed:", error);

    if (error.code === error.PERMISSION_DENIED) {
      setLocationStatus("Location permission denied");
    } else if (error.code === error.TIMEOUT) {
      setLocationStatus("GPS request timed out");
    } else {
      setLocationStatus("Could not get location");
    }
  }

  function openWhatsApp() {
    if (!coordinator?.phone) {
      alert("Coordinator phone number is not available.");
      return;
    }

    const phone = coordinator.phone.replace(/[^0-9]/g, "");
    const message =
      `Hello ${coordinator.full_name}, this is ` +
      `${profile?.full_name ?? "the driver"}. ` +
      `I am contacting you about shipment ` +
      `${shipment?.shipment_number ?? ""}.`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  if (!profile?.id) {
    return (
      <main className="driver-loading">
        Driver profile is not available.
      </main>
    );
  }

  if (loading) {
    return <div className="driver-loading">Loading driver workspace...</div>;
  }

  const isCritical = shipment?.status === "ACTION_REQUIRED";

  return (
    <main className="driver-shell">
      {showLocationConfirm && (
        <div
          className="location-modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowLocationConfirm(false);
            }
          }}
        >
          <section
            className="location-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-modal-title"
          >
            <div className="location-modal-icon">
              <MapPin size={26} />
            </div>

            <h2 id="location-modal-title">Share your current location?</h2>

            <p>
              Your location will be shared using GPS with the coordinator so the
              shipment route can be monitored.
            </p>

            <div className="location-modal-actions">
              <button
                type="button"
                className="location-cancel-button"
                onClick={() => setShowLocationConfirm(false)}
              >
                No
              </button>

              <button
                type="button"
                className="location-confirm-button"
                onClick={confirmShareLocation}
              >
                Continue
              </button>
            </div>
          </section>
        </div>
      )}

      <header className="driver-topbar">
        <div className="driver-brand">
          <div className="driver-brand-mark">IO</div>
          <div>
            <p>SAP INTELLIOPS</p>
            <span>Driver operations cockpit</span>
          </div>
        </div>

        <div className="driver-top-actions">
          <span className="online-pill">
            <span />
            ONLINE
          </span>

          <button type="button" className="driver-signout" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      <section className="driver-content">
        <div className="driver-welcome">
          <div>
            <p className="driver-kicker">GOOD MORNING</p>
            <h1>{profile.full_name}</h1>
            <p>Your assigned vehicle and live instructions appear here.</p>
          </div>

          <div className="driver-identity">
            <UserRound size={18} />
            <span>{profile.vehicle_number}</span>
          </div>
        </div>

        {isCritical && (
          <section className="driver-incident-banner">
            <div className="incident-icon">
              <AlertTriangle size={25} />
            </div>

            <div>
              <p className="driver-kicker">ACTION REQUIRED</p>
              <h2>Cold-chain excursion detected</h2>
              <p>Follow the recovery instruction and keep the container closed.</p>
            </div>

            <span className="risk-tag">HIGH RISK</span>
          </section>
        )}

        <section className="driver-stat-grid">
          <article className="driver-stat-card temperature-stat">
            <div className="stat-icon">
              <Thermometer size={20} />
            </div>
            <span>Shipment temperature</span>
            <strong>{shipment?.temperature ?? "--"}°C</strong>
            <small>{isCritical ? "Above safe range" : "Within safe range"}</small>
          </article>

          <article className="driver-stat-card">
            <div className="stat-icon blue">
              <Package size={20} />
            </div>
            <span>Consignment</span>
            <strong>{shipment?.shipment_number ?? "--"}</strong>
            <small>{shipment?.status ?? "No status"}</small>
          </article>

          <article className="driver-stat-card">
            <div className="stat-icon green">
              <Truck size={20} />
            </div>
            <span>Vehicle</span>
            <strong>{profile.vehicle_number}</strong>
            <small>Reefer connected</small>
          </article>

          <article className="driver-stat-card">
            <div className="stat-icon purple">
              <Clock3 size={20} />
            </div>
            <span>Recovery window</span>
            <strong>2h 10m</strong>
            <small>Time remaining</small>
          </article>
        </section>

        <section className="driver-main-grid">
          <article className="driver-panel route-panel">
            <div className="panel-heading">
              <div>
                <p className="driver-kicker">ASSIGNED ROUTE</p>
                <h2>Current journey</h2>
              </div>
              <Navigation size={21} />
            </div>

            <div className="driver-route-line">
              <div className="route-stop">
                <span className="route-dot origin" />
                <div>
                  <small>ORIGIN</small>
                  <strong>{shipment?.origin ?? "Madurai"}</strong>
                </div>
              </div>

              <div className="route-connector">
                <span />
                <small>ACTIVE ROUTE</small>
              </div>

              <div className="route-stop">
                <span className="route-dot destination" />
                <div>
                  <small>DESTINATION</small>
                  <strong>{shipment?.destination ?? "Chennai"}</strong>
                </div>
              </div>
            </div>

            <div className="location-row">
              <MapPin size={17} />
              <span>{profile.vehicle_number}</span>
              <strong>{locationStatus}</strong>
            </div>

            <button
              type="button"
              className="location-button"
              onClick={shareLocation}
            >
              <MapPin size={17} />
              Share current location
            </button>

            {location && (
              <p className="coordinate-text">
                GPS accuracy: {location.accuracy}m
              </p>
            )}
          </article>

          <article className="driver-panel weather-panel">
            <div className="panel-heading">
              <div>
                <p className="driver-kicker">EXTERNAL WEATHER</p>
                <h2>Local conditions</h2>
              </div>
              <span className="weather-symbol">☼</span>
            </div>

            {weather ? (
              <div className="weather-reading">
                <strong>{weather.temperature}°C</strong>
                <span>Humidity {weather.humidity}%</span>
                <small>Based on your shared GPS location</small>
              </div>
            ) : (
              <div className="weather-empty">
                <p>Location required</p>
                <span>Share your location to load local weather.</span>
              </div>
            )}
          </article>
        </section>

        <section className="recovery-section">
          <div className="section-heading">
            <div>
              <p className="driver-kicker">COORDINATOR INSTRUCTIONS</p>
              <h2>Recovery actions</h2>
            </div>
            <span className="secure-label">Human approved workflow</span>
          </div>

          {recoveryAlert ? (
            <article className="recovery-card">
              <div className="recovery-card-icon">
                <AlertTriangle size={24} />
              </div>

              <div className="recovery-card-content">
                <p className="driver-kicker">NEW INSTRUCTION</p>
                <h3>{recoveryAlert.instruction}</h3>
                <p>
                  Status:{" "}
                  <span className="instruction-status">
                    {recoveryAlert.status}
                  </span>
                </p>

                {recoveryAlert.status === "SENT" && (
                  <button
                    type="button"
                    className="acknowledge-button"
                    onClick={acknowledgeRecovery}
                  >
                    <CheckCircle2 size={18} />
                    Acknowledge instruction
                  </button>
                )}
              </div>

              <div className="recovery-time">
                <Clock3 size={16} />
                <span>Just now</span>
              </div>
            </article>
          ) : (
            <article className="no-instruction-card">
              <CheckCircle2 size={22} />
              <div>
                <h3>No new recovery instruction</h3>
                <p>
                  You are clear to continue. New coordinator actions will appear
                  here.
                </p>
              </div>
            </article>
          )}
        </section>

        <section className="driver-bottom-grid">
          <article className="safety-card">
            <div className="safety-icon">✓</div>
            <div>
              <p className="driver-kicker">DRIVER SAFETY</p>
              <h3>Stop safely before inspecting the reefer.</h3>
              <p>Never interact with equipment while the vehicle is moving.</p>
            </div>
          </article>

          <article className="contact-card">
            <div>
              <p className="driver-kicker">NEED HELP?</p>
              <h3>Contact your coordinator</h3>
              <p>Meera Raghavan is monitoring this shipment.</p>
            </div>

            <button
              type="button"
              className="contact-button"
              onClick={openWhatsApp}
            >
              <Phone size={17} />
              WhatsApp Meera
            </button>
          </article>
        </section>
      </section>
    </main>
  );
}
