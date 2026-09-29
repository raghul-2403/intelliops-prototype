import { useEffect, useState } from "react";
import LoginPage from "./LoginPage";
import DriverDashboard from "./DriverDashboard";
import { supabase } from "./lib/supabase";
import LiveMap from "./LiveMap";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  Send,
  Thermometer,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./index.css";

const drivers = [
  {
    id: "driver-1",
    name: "Raghul",
    initials: "RJ",
    vehicle: "TN 09 AB 4521",
    type: "Long-haul reefer",
    phone: "+919159708095",
    location: "11 km from Melur junction",
  },
  {
    id: "driver-2",
    name: "Nithin Adhithya",
    initials: "NA",
    vehicle: "TN 58 CD 1187",
    type: "Refrigerated van",
    phone: "+919363498553",
    location: "Near Tirumangalam bypass",
  },
  {
    id: "driver-3",
    name: "Prakash",
    initials: "P",
    vehicle: "TN 37 EF 7620",
    type: "Cold-chain carrier",
    phone: "+916381920030",
    location: "8 km from Sivaganga road",
  },
  {
    id: "driver-4",
    name: "Nithish Barath",
    initials: "NB",
    vehicle: "TN 45 GH 3098",
    type: "District distribution van",
    phone: "+919843759696",
    location: "Madurai district checkpoint",
  },
  {
    id: "driver-5",
    name: "Sabarish Krishnan",
    initials: "SK",
    vehicle: "TN 63 JK 8842",
    type: "Last-mile vaccine carrier",
    phone: "+918807087857",
    location: "Near district store entrance",
  },
];

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDriverForDate(date) {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return drivers[0];
  }

  const referenceDate = new Date("2026-09-27T00:00:00");

  const daysDifference = Math.floor(
    (parsedDate - referenceDate) /
      (1000 * 60 * 60 * 24)
  );

  const driverIndex =
    ((daysDifference % drivers.length) + drivers.length) %
    drivers.length;

  return drivers[driverIndex];
}

const historyData = {
  "2026-09-27": {
    label: "Today",
    normal: 196,
    attention: 4,
    leadTime: "2h 10m",
    children: 380,
    health: "94%",
    incident: "CN-24018 — Chennai → Madurai",
    incidentDetails: "9.2°C and rising · Stationary for 40 minutes",
  },
  "2026-09-26": {
    label: "Yesterday",
    normal: 198,
    attention: 2,
    leadTime: "3h 25m",
    children: 120,
    health: "97%",
    incident: "CN-24011 — Salem → Erode",
    incidentDetails: "Handover dwell exceeded normal route pattern",
  },
  "2026-09-25": {
    label: "25 September",
    normal: 199,
    attention: 1,
    leadTime: "4h 05m",
    children: 60,
    health: "99%",
    incident: "CN-23998 — Chennai → Tiruchirappalli",
    incidentDetails: "Logger reported intermittent connectivity",
  },
};

function getHistoryForDate(date) {
  if (historyData[date]) {
    return historyData[date];
  }

  const selected = new Date(`${date}T00:00:00`);
  const today = new Date("2026-09-27T00:00:00");
  const daysAgo = Math.max(
    0,
    Math.floor((today - selected) / (1000 * 60 * 60 * 24))
  );

  const normal = Math.max(170, 196 - (daysAgo % 20));
  const attention = 1 + (daysAgo % 5);
  const leadTimeHours = 2 + (daysAgo % 4);
  const leadTimeMinutes = 10 + ((daysAgo * 13) % 50);
  const children = 60 + ((daysAgo * 80) % 420);
  const health = Math.max(82, 100 - attention * 2);

  return {
    label: formatDateLabel(date),
    normal,
    attention,
    leadTime: `${leadTimeHours}h ${leadTimeMinutes}m`,
    children,
    health: `${health}%`,
    incident: `Historical review — ${formatDateLabel(date)}`,
    incidentDetails:
      daysAgo === 0
        ? "Current live monitoring is active."
        : `Archived network data generated for ${formatDateLabel(date)}.`,
  };
}

function formatDateLabel(date) {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Selected date";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const temperatureData = [
  { time: "10:20", temperature: 5.8 },
  { time: "10:40", temperature: 6.2 },
  { time: "11:00", temperature: 7.1 },
  { time: "11:20", temperature: 8.3 },
  { time: "11:40", temperature: 9.2 },
];

const recoveryOptions = [
  {
    id: "DIVERT_REICE",
    name: "Divert + re-ice",
    cost: "₹18,500",
    eta: "3h 05m",
    risk: "Low",
    facilities: 14,
    recommended: true,
  },
  {
    id: "QUARANTINE",
    name: "Quarantine consignment",
    cost: "₹42,000",
    eta: "Unavailable",
    risk: "Very low",
    facilities: 0,
    recommended: false,
  },
  {
    id: "REALLOCATE_BUFFER",
    name: "Reallocate buffer stock",
    cost: "₹31,000",
    eta: "5h 20m",
    risk: "Medium",
    facilities: 9,
    recommended: false,
  },
];

const driverIdByLocalId = {
  "driver-1":
    "98f6ab92-f576-4204-9147-0ffe3568119f",

  "driver-2":
    "ef947363-3375-4bbd-ae22-4493659589ef",

  "driver-3":
    "565c5093-e106-4989-a74f-a57de561615d",

  "driver-4":
    "75157a54-8579-49d3-a3a8-07e69b0bd8b2",

  "driver-5":
    "df138093-7f4b-4861-8980-e3d8c924e53a",
};

const shipmentByDriver = {
  "98f6ab92-f576-4204-9147-0ffe3568119f":
    "a93bf90d-825e-469c-9df0-9c4ca28b91b7",

  "ef947363-3375-4bbd-ae22-4493659589ef":
    "efbd4c6f-d20b-4252-872f-5631a9a25d8c",

  "565c5093-e106-4989-a74f-a57de561615d":
    "3f744479-f440-4b8c-b1d1-fce5b6948b8d",

  "75157a54-8579-49d3-a3a8-07e69b0bd8b2":
    "aca45fe1-5dfb-41bd-8911-651ae5748e1e",

  "df138093-7f4b-4861-8980-e3d8c924e53a":
    "87b68c3b-c876-49a9-927b-c8e29578ff9d",
};

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [screen, setScreen] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(() => {
  const savedMode = localStorage.getItem("intelliops-theme");
     if (savedMode === "light") return false;
     return true;
    });
  const [selectedOption, setSelectedOption] = useState(null);
  const [approved, setApproved] = useState(false);
  const [driverContacted, setDriverContacted] = useState(false);
  const [driverAlertSent, setDriverAlertSent] = useState(false);
  const todayDate = getTodayDate();

  const [selectedDate, setSelectedDate] =
  useState(todayDate);

  const [draftDate, setDraftDate] =
  useState(todayDate);

  const [simulationStarted, setSimulationStarted] = useState(false);
  const [agentMessages, setAgentMessages] = useState([]);
  const [acknowledgementMessage, setAcknowledgementMessage] =
  useState(null);
  const [isEnteringApp, setIsEnteringApp] = useState(false);
  const [sharedShipment, setSharedShipment] = useState(null);
  const [meeraWeather, setMeeraWeather] = useState(null);
  const [mapShipment, setMapShipment] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
  if (profile?.role !== "coordinator") {
    return undefined;
  }

  let active = true;

  async function loadMapShipment() {
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .not("location_shared_at", "is", null)
      .order("location_shared_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(1);

    if (error) {
      console.error("Map shipment loading failed:", error);
      return;
    }

    if (active) {
      setMapShipment(data?.[0] ?? null);
    }
  }

  loadMapShipment();

  const channel = supabase
    .channel("live-map-shipment-updates")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "shipments",
      },
      (payload) => {
        const updatedShipment = payload.new;

        if (
          updatedShipment.current_latitude == null ||
          updatedShipment.current_longitude == null
        ) {
          return;
        }

        console.log("Live map received shipment update:", updatedShipment);

        setMapShipment(updatedShipment);
      }
    )
    .subscribe((status, error) => {
      console.log("Live map Realtime status:", status);

      if (error) {
        console.error("Live map Realtime error:", error);
      }
    });

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}, [profile?.role]);
    
    useEffect(() => {
    async function loadSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession);

      if (currentSession?.user) {
       const {
              data: currentProfile,
              error: profileError,
              } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", currentSession.user.id)
              .single();

              setProfile(currentProfile);
      }

      setAuthLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
  const channel = supabase
    .channel("coordinator-recovery-updates")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "recovery_instructions",
      },
      (payload) => {
        if (payload.new.status === "ACKNOWLEDGED") {
          setAcknowledgementMessage(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  useEffect(() => {
  if (profile?.role !== "coordinator") {
    return undefined;
  }

  async function loadDriverWeather() {
    const { data, error } = await supabase
      .from("shipments")
      .select(`
        id,
        shipment_number,
        driver_id,
        current_latitude,
        current_longitude,
        location_accuracy,
        location_shared_at,
        current_temperature,
        current_humidity,
        weather_updated_at
      `)
      .not("current_temperature", "is", null)
      .not("current_humidity", "is", null)
      .order("location_shared_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(1);

    if (error) {
      console.error("Meera weather query failed:", error);
      return;
    }

    const latestShipment = data?.[0] ?? null;

    console.log("Meera weather row:", latestShipment);

    setSharedShipment(latestShipment);

    if (latestShipment) {
      setMeeraWeather({
        temperature: latestShipment.current_temperature,
        humidity: latestShipment.current_humidity,
      });
    } else {
      setMeeraWeather(null);
    }
  }

  loadDriverWeather();

  const channel = supabase
    .channel("meera-driver-weather")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "shipments",
      },
      (payload) => {
        const updatedShipment = payload.new;

        if (
          updatedShipment.current_temperature == null ||
          updatedShipment.current_humidity == null
        ) {
          return;
        }

        console.log("Meera received weather update:", updatedShipment);

        setSharedShipment(updatedShipment);
        setMeeraWeather({
          temperature: updatedShipment.current_temperature,
          humidity: updatedShipment.current_humidity,
        });
      }
    )
    .subscribe((status) => {
      console.log("Meera weather realtime status:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, [profile?.role]);

  async function approveRecovery() {
  if (!selectedOption) {
    return;
  }

  const assignedDriver = getDriverForDate(selectedDate);

  const activeDriverId =
    driverIdByLocalId[assignedDriver.id];

  const shipmentId =
    shipmentByDriver[activeDriverId];

  if (!activeDriverId || !shipmentId) {
    alert("No driver or shipment is assigned for this date.");
    return;
  }

  const selectedRecovery = recoveryOptions.find(
    (option) => option.id === selectedOption
  );

  if (!selectedRecovery) {
    return;
  }

  const instruction =
    selectedRecovery.id === "DIVERT_REICE"
      ? "Divert to the nearest cold-storage facility and re-ice the shipment."
      : selectedRecovery.name;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    alert("Please sign in before approving recovery.");
    return;
  }

  const { error } = await supabase
    .from("recovery_instructions")
    .insert({
      driver_id: activeDriverId,
      shipment_id: shipmentId,
      instruction,
      status: "SENT",
      created_by: user.id,
    });

  if (error) {
    console.error("SUPABASE INSERT ERROR", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    alert(
      `Supabase error\n\n` +
        `Code: ${error.code ?? "none"}\n` +
        `Message: ${error.message ?? "none"}\n` +
        `Details: ${error.details ?? "none"}\n` +
        `Hint: ${error.hint ?? "none"}`
    );

    return;
  }

  setApproved(true);
}

  function resetDemo() {
  const todayDate = getTodayDate();

  setScreen("dashboard");
  setSelectedOption(null);
  setApproved(false);
  setDriverContacted(false);
  setDriverAlertSent(false);
  setSelectedDate(todayDate);
  setDraftDate(todayDate);
  setSimulationStarted(false);
  setAgentMessages([]);
}

  function applyDate() {
  if (draftDate) {
    setSelectedDate(draftDate);
    setDriverContacted(false);
    setDriverAlertSent(false);
  }
}

  function simulateDisruption() {
    setScreen("dashboard");
    setSimulationStarted(true);
    setAgentMessages([]);

    const messages = [
      "Event Mesh received temperature event from CN-24018.",
      "Sensing Agent classified the excursion as HIGH.",
      "Scenario Agent calculated 2h 10m until breach.",
      "Inventory Agent found 14 affected facilities and 380 children at risk.",
      "Logistics Agent simulated 3 recovery options.",
      "Compliance Agent blocked automatic product disposition.",
      "Human approval requested from Meera Raghavan.",
    ];

    messages.forEach((message, index) => {
      setTimeout(() => {
        setAgentMessages((currentMessages) => [
          ...currentMessages,
          message,
        ]);
      }, (index + 1) * 700);
    });
  }
    
  async function handleLogout() {
  await supabase.auth.signOut({ scope: "local" });
  setSession(null);
  setProfile(null);
  setScreen("dashboard");
}

    if (authLoading) {
    return <div className="loading-screen">Loading...</div>;
  }
    if (!session || !profile || isEnteringApp) {
  return (
    <LoginPage
      isEnteringApp={isEnteringApp}
      onLogin={(loggedInProfile) => {
        setIsEnteringApp(true);

        setTimeout(() => {
          setProfile(loggedInProfile);
          setIsEnteringApp(false);
        }, 900);
      }}
    />
  );
}

  if (profile.role === "driver") {
    return (
      <DriverDashboard
        profile={profile}
        onLogout={handleLogout}
      />
    );
  }

  return (
  <div
    className={`app ${
      darkMode ? "dark-mode" : "light-mode"
    } ${isEnteringApp ? "app-entering" : "app-visible"}`}
  >
    <button
      type="button"
      className="menu-toggle"
      onClick={() => setMenuOpen((current) => !current)}
      aria-label="Open navigation menu"
    >
      <span />
      <span />
      <span />
    </button>

    {menuOpen && (
      <div className="app-menu">
        <button
          type="button"
          onClick={() => {
            setScreen("dashboard");
            setMenuOpen(false);
          }}
        >
          Dashboard
        </button>

        <button
          type="button"
          onClick={() => {
            setScreen("map");
            setMenuOpen(false);
          }}
        >
          Live map
        </button>
      </div>
    )}

    <header className="topbar">
        <div>
          <div className="brand">SAP IntelliOps</div>
          <div className="subtitle">Cold Chain Guardian</div>
        </div>

        <div className="header-actions">
         <span className="live-dot">● LIVE</span>

        <button
          className="theme-button"
               onClick={() => {
               setDarkMode((currentMode) => {
               const nextMode = !currentMode;

              localStorage.setItem(
              "intelliops-theme",
               nextMode ? "dark" : "light"
              );

               return nextMode;
              });
             }}
          aria-label="Toggle dark mode"
        >
          {darkMode ? "☀ Light" : "☾ Dark"}
        </button>

      <button className="reset-button" onClick={resetDemo}>
          <RotateCcw size={16} />
          Reset
      </button>
          <button
              className="logout-button"
              onClick={handleLogout}
    >
      Sign out
    </button>
      </div>
      </header>

      <main className="container">
        {acknowledgementMessage && (
          <div className="success-banner">
            <CheckCircle size={24} />
            <div>
            <strong>Driver acknowledged the recovery instruction</strong>
            <p>
            The driver has received and acknowledged the approved action.
            </p>
      </div>
    </div>
)}
        {screen === "dashboard" && (
  <ScreenTransition screenKey="dashboard">
    <Dashboard
       onOpenIncident={() => setScreen("incident")}
       onOpenWatch={() => setScreen("history")}
       onSimulate={simulateDisruption}
       simulationStarted={simulationStarted}
       agentMessages={agentMessages}
       selectedDate={selectedDate}
      draftDate={draftDate}
      setDraftDate={setDraftDate}
      applyDate={applyDate}
      sharedShipment={sharedShipment}
      meeraWeather={meeraWeather}
    />
  </ScreenTransition>
)}

        {screen === "history" && (
  <ScreenTransition screenKey="history">
    <History
      selectedDate={selectedDate}
      draftDate={draftDate}
      setDraftDate={setDraftDate}
      applyDate={applyDate}
      onBack={() => setScreen("dashboard")}
    />
  </ScreenTransition>
)}

        {screen === "incident" && (
  <ScreenTransition screenKey="incident">
    <Incident
      selectedDate={selectedDate}
      onBack={() => setScreen("dashboard")}
      onOpenRecovery={() => setScreen("recovery")}
      driverContacted={driverContacted}
      setDriverContacted={setDriverContacted}
      driverAlertSent={driverAlertSent}
      setDriverAlertSent={setDriverAlertSent}
    />
  </ScreenTransition>
)}

        {screen === "map" && (
  <ScreenTransition screenKey="map">
    <div className="map-screen">
      <button
        type="button"
        className="back-button"
        onClick={() => setScreen("dashboard")}
      >
        ← Back to cockpit
      </button>

      <LiveMap shipment={mapShipment} />
    </div>
  </ScreenTransition>
)}

        {screen === "recovery" && (
  <ScreenTransition screenKey="recovery">
    <Recovery
      selectedOption={selectedOption}
      setSelectedOption={setSelectedOption}
      approved={approved}
      onBack={() => setScreen("incident")}
      onApprove={approveRecovery}
      onEvidence={() => setScreen("evidence")}
    />
  </ScreenTransition>
)}

        {screen === "evidence" && (
  <ScreenTransition screenKey="evidence">
    <Evidence
      selectedOption={selectedOption}
      onBack={() => setScreen("dashboard")}
    />
  </ScreenTransition>
)}

        
      </main>
    </div>
  );
}

function ScreenTransition({ children, screenKey }) {
  return (
    <div
      key={screenKey}
      className="screen-transition"
    >
      {children}
    </div>
  );
}

function Dashboard({
  onOpenIncident,
  onOpenWatch,
  onSimulate,
  simulationStarted,
  agentMessages,
  selectedDate,
  draftDate,
  setDraftDate,
  applyDate,
  sharedShipment,
  meeraWeather,
}) {
  const selectedHistory = getHistoryForDate(selectedDate);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">OPERATIONS COCKPIT</p>
          <h1>Good afternoon, Meera</h1>
          <p className="muted">
            Viewing cold-chain activity for{" "}
            {selectedHistory.label.toLowerCase()}.
          </p>
        </div>

        <div className="heading-actions">
  <div className="date-picker-group">
    <label className="date-label" htmlFor="dashboard-date">
      View date
    </label>

  <div className="date-controls">
    <input
      id="dashboard-date"
      className="date-input"
      type="date"
      value={draftDate}
      min="2020-01-01"
      max="2030-12-31"
      onChange={(event) => setDraftDate(event.target.value)}
      onKeyDown={(event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyDate();
    }
  }}
/>

    <button className="apply-date-button" onClick={applyDate}>
      Apply
    </button>
  </div>
</div>

          <button className="simulate-button" onClick={onSimulate}>
            <span className="pulse-dot"></span>
            {simulationStarted
              ? "Event simulated"
              : "Simulate temperature event"}
          </button>
        </div>
      </div>

      <section className="stats-grid">
        <StatCard
          icon={<Package />}
          value={selectedHistory.normal}
          label="Normal consignments"
          color="green"
        />
        <StatCard
          icon={<AlertTriangle />}
          value={selectedHistory.attention}
          label="Need attention"
          color="red"
        />
        <StatCard
          icon={<Clock />}
          value={selectedHistory.leadTime}
          label="Warning lead time"
          color="blue"
        />
        <StatCard
          icon={<Users />}
          value={selectedHistory.children}
          label="Children at risk"
          color="orange"
        />
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">ACTION QUEUE</p>
              <h2>Consignments needing attention</h2>
            </div>
            <span className="badge red-badge">
              {selectedHistory.attention} ACTIVE
            </span>
          </div>

          <div className="alert-row urgent">
            <div className="alert-icon">
              <AlertTriangle size={22} />
            </div>

            <div className="alert-content">
              <div className="alert-title">{selectedHistory.incident}</div>
              <div className="alert-details">
                {selectedHistory.incidentDetails}
              </div>
              <div className="alert-meta">
                <span>Time to breach: {selectedHistory.leadTime}</span>
                <span>{selectedHistory.attention} active alerts</span>
              </div>
            </div>

            <button className="primary-button" onClick={onOpenIncident}>
              Investigate
            </button>
          </div>

          <button className="alert-row warning watch-row" onClick={onOpenWatch}>
            <div className="alert-icon">
              <Clock size={22} />
            </div>

            <div className="alert-content">
              <div className="alert-title">
                CN-24011 — Salem → Erode
              </div>
              <div className="alert-details">
                Handover dwell exceeds normal route pattern
              </div>
              <div className="alert-meta">
                <span>Watch status</span>
              </div>
            </div>

            <span className="status-label">WATCH →</span>
          </button>
        </div>

        <div className="panel network-panel">
          <p className="eyebrow">NETWORK STATUS</p>
          <h2>Cold-chain health</h2>
          <div className="health-score">{selectedHistory.health}</div>
          <div className="health-bar">
            <div
              className="health-fill"
              style={{ width: selectedHistory.health }}
            ></div>
          </div>
          <p className="muted">
            {selectedHistory.normal} active consignments are within expected
            conditions.
          </p>

          <div className="network-items">
            <div>
              <span className="green-dot"></span>
              Sensors online
              <strong>198/200</strong>
            </div>
            <div>
              <span className="green-dot"></span>
              Routes reporting
              <strong>42/44</strong>
            </div>
            <div>
              <span className="orange-dot"></span>
              Silent stalls
              <strong>2</strong>
            </div>
          </div>
        </div>
      </section>

          <section className="content-grid">
        <article className="panel network-panel meera-weather-card">
          <div className="panel-title">
            <div>
              <p className="eyebrow">EXTERNAL WEATHER</p>
              <h2>Local conditions</h2>
            </div>

            <span className="meera-weather-symbol">☼</span>
          </div>

          {meeraWeather?.temperature !== null &&
          meeraWeather?.temperature !== undefined ? (
            <div className="meera-weather-reading">
              <strong>{meeraWeather.temperature}°C</strong>
              <span>Humidity {meeraWeather.humidity}%</span>

              <small>
                Based on the driver&apos;s shared GPS location
              </small>

              {sharedShipment?.location_shared_at && (
                <small>
                  Updated{" "}
                  {new Date(
                    sharedShipment.location_shared_at
                  ).toLocaleTimeString()}
                </small>
              )}
            </div>
          ) : (
            <div className="meera-weather-empty">
              <p>Waiting for driver location</p>
              <span>
                Weather will appear after the driver shares GPS location.
              </span>
            </div>
          )}
        </article>
      </section>

      {simulationStarted && <AgentActivity messages={agentMessages} />}
    </>
  );
}

function AgentActivity({ messages }) {
  return (
    <section className="panel agent-activity">
      <div className="panel-title">
        <div>
          <p className="eyebrow">AGENT ORCHESTRATION</p>
          <h2>Live agent activity</h2>
        </div>

        <span className="processing-status">
          <span className="processing-dot"></span>
          {messages.length < 7 ? "AGENTS PROCESSING" : "DECISION READY"}
        </span>
      </div>

      <div className="activity-list">
        {messages.map((message, index) => (
          <div className="activity-item" key={`${message}-${index}`}>
            <div className="activity-number">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="activity-line"></div>
            <div className="activity-message">
              <strong>{message}</strong>
              <span>Agent workflow step completed</span>
            </div>
            <span className="activity-check">✓</span>
          </div>
        ))}
      </div>

      {messages.length === 7 && (
        <div className="decision-ready">
          <strong>Decision ready:</strong>
          <span>
            Divert and re-ice is recommended. Human approval is required before
            execution.
          </span>
        </div>
      )}
    </section>
  );
}

function History({
  selectedDate,
  draftDate,
  setDraftDate,
  applyDate,
  onBack,
}) {
  const data = getHistoryForDate(selectedDate);

  return (
    <>
      <button className="back-button" onClick={onBack}>
        ← Back to cockpit
      </button>

      <div className="page-heading">
        <div>
          <p className="eyebrow">HISTORICAL OPERATIONS</p>
          <h1>Cold-chain history</h1>
          <p className="muted">
            Review previous network conditions and recorded incidents.
          </p>
        </div>

        <div className="date-picker-group">
  <label className="date-label" htmlFor="history-date">
    Select date
  </label>

  <div className="date-controls">
    <input
      id="history-date"
      className="date-input"
      type="date"
      value={draftDate}
      min="2020-01-01"
      max="2030-12-31"
      onChange={(event) => setDraftDate(event.target.value)}
      onKeyDown={(event) => {
      if (event.key === "Enter") {
          event.preventDefault();
          applyDate();
      }
  }}
/>

    <button className="apply-date-button" onClick={applyDate}>
      Apply
    </button>
  </div>
</div>
      </div>
      


      <section className="history-summary panel">
        <div>
          <p className="eyebrow">SELECTED DATE</p>
          <h2>{data.label}</h2>
          <p className="muted">Network health: {data.health}</p>
        </div>

        <div className="history-health">
          <CheckCircle size={26} />
          <strong>{data.health}</strong>
          <span>cold-chain health</span>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          icon={<Package />}
          value={data.normal}
          label="Normal consignments"
          color="green"
        />
        <StatCard
          icon={<AlertTriangle />}
          value={data.attention}
          label="Need attention"
          color="red"
        />
        <StatCard
          icon={<Clock />}
          value={data.leadTime}
          label="Warning lead time"
          color="blue"
        />
        <StatCard
          icon={<Users />}
          value={data.children}
          label="Children at risk"
          color="orange"
        />
      </section>

      <section className="panel history-incident">
        <p className="eyebrow">RECORDED INCIDENT</p>
        <h2>{data.incident}</h2>
        <p className="muted">{data.incidentDetails}</p>
        <button className="primary-button" onClick={onBack}>
          Return to current cockpit
        </button>
      </section>
    </>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Incident({
  selectedDate,
  onBack,
  onOpenRecovery,
  driverContacted,
  setDriverContacted,
  driverAlertSent,
  setDriverAlertSent,
}) {
  const driver = getDriverForDate(selectedDate);
    
  function sendWhatsAppAlert() {
    const message =
      "URGENT COLD-CHAIN ALERT: Consignment CN-24018 is at 9.2°C and rising. Please stop safely, check the reefer, and proceed to the nearest re-icing point.Please Contact the coordinator immediately.";

    const whatsappUrl = `https://wa.me/${driver.phone.replace(
      /[^0-9]/g,
      ""
    )}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
    setDriverAlertSent(true);
  }
  
  return (
    <>
      <button className="back-button" onClick={onBack}>
        ← Back to cockpit
      </button>

      <div className="page-heading">
        <div>
          <p className="eyebrow red-text">URGENT INCIDENT</p>
          <h1>CN-24018 — Chennai to Madurai</h1>
          <p className="muted">
              Incident INC-2026-0418 · 12,000 doses · DTP / Hep-B vaccine
          </p>
          <p className="muted">
              Assigned driver: {driver.name} · {driver.vehicle}
          </p>
        </div>
        <span className="badge red-badge large-badge">
          ACTION REQUIRED
        </span>
      </div>

      <section className="incident-kpis">
        <IncidentKpi
          icon={<Thermometer />}
          title="Current temperature"
          value="9.2°C"
          note="Limit: 8°C"
          critical
        />
        <IncidentKpi
          icon={<Clock />}
          title="Time to breach"
          value="2h 10m"
          note="Point of no return: 13:51"
        />
        <IncidentKpi
          icon={<Users />}
          title="Impact"
          value="380 children"
          note="14 facilities · 3 sessions"
        />
      </section>

      <section className="content-grid">
        <div className="panel chart-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">SENSING AGENT</p>
              <h2>Temperature trend</h2>
            </div>
            <span className="badge red-badge">RISING</span>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={temperatureData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8e0e8" />
                <XAxis dataKey="time" stroke="#718092" />
                <YAxis domain={[0, 12]} stroke="#718092" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#d9343a"
                  strokeWidth={4}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-note">
            <AlertTriangle size={18} />
            Temperature crossed 8°C at 11:20 and continues to rise.
          </div>
        </div>

        <div className="panel">
          <p className="eyebrow">AGENT FINDINGS</p>
          <h2>What happened?</h2>
          <Finding
            number="01"
            title="Sensing"
            text="Reefer temperature reached 9.2°C and is rising."
          />
          <Finding
            number="02"
            title="Scenario"
            text="Cumulative exposure will cross the batch limit in 2h 10m."
          />
          <Finding
            number="03"
            title="Inventory"
            text="14 downstream facilities and 3 sessions are affected."
          />
          <Finding
            number="04"
            title="Logistics"
            text="Three recovery options have been simulated."
          />
          <div className="human-gate">
            <strong>Human approval required</strong>
            <span>Product disposition is never automated.</span>
          </div>
        </div>
      </section>

      <section className="route-panel panel">
        <p className="eyebrow">LIVE ROUTE</p>
        <div className="route">
          <RouteStop label="Chennai State Store" completed />
          <div className="route-line completed-line"></div>
          <RouteStop label="Long-haul reefer" active />
          <div className="route-line"></div>
          <RouteStop label="Madurai District Store" />
          <div className="route-line"></div>
          <RouteStop label="14 clinics" />
        </div>
      </section>

      <section className="driver-contact-card panel">
  <div className="driver-contact-header">
    <div>
      <p className="eyebrow">URGENT FIELD ACTION</p>
      <h2>Contact vehicle driver</h2>
      <p className="muted">
        Ask the driver to stop safely, verify the reefer, and proceed to the
        nearest re-icing point.
      </p>
    </div>

    <div className="driver-status">
      <span className="green-dot"></span>
      Driver on route
    </div>
  </div>

  <div className="driver-details">
    <div className="driver-avatar">{driver.initials}</div>

    <div className="driver-info">
      <strong>{driver.name}</strong>
      <span>
        Vehicle {driver.vehicle} · {driver.type}
      </span>
      <span>Last location: {driver.location}</span>
    </div>

    <div className="driver-actions">
  <a
    className="call-driver-button"
    href={`tel:${driver.phone}`}
    onClick={() => setDriverContacted(true)}
  >
    <Phone size={17} />
    {driverContacted
      ? "Call placed"
      : `Call ${driver.name.split(" ")[0]}`}
  </a>

  <button
    className="send-alert-button"
    onClick={sendWhatsAppAlert}
  >
    <Send size={17} />
    {driverAlertSent ? "WhatsApp opened" : "Send WhatsApp alert"}
  </button>
</div>
</div>

  {(driverContacted || driverAlertSent) && (
    <div className="driver-action-result">
      <CheckCircle size={18} />
      <span>
        {driverContacted && driverAlertSent
          ? "Driver contacted and urgent instruction sent."
          : driverContacted
          ? "Call action recorded. Driver contact attempt started."
          : "Urgent instruction sent to the driver."}
      </span>
    </div>
  )}
</section>

      <button className="large-primary-button" onClick={onOpenRecovery}>
        Open recovery simulator →
      </button>
    </>
  );
}

function IncidentKpi({ icon, title, value, note, critical }) {
  return (
    <div className={`incident-kpi ${critical ? "critical-kpi" : ""}`}>
      {icon}
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
      <small>{note}</small>
    </div>
  );
}

function Finding({ number, title, text }) {
  return (
    <div className="finding">
      <div className="finding-number">{number}</div>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

function RouteStop({ label, completed, active }) {
  return (
    <div className="route-stop">
      <div
        className={`route-circle ${completed ? "completed" : ""} ${
          active ? "active" : ""
        }`}
      >
        {completed ? "✓" : active ? "!" : "○"}
      </div>
      <span>{label}</span>
    </div>
  );
}

function Recovery({
  selectedOption,
  setSelectedOption,
  approved,
  onBack,
  onApprove,
  onEvidence,
}) {
  return (
    <>
      <button className="back-button" onClick={onBack}>
        ← Back to incident
      </button>

      <div className="page-heading">
        <div>
          <p className="eyebrow">LOGISTICS AGENT</p>
          <h1>Recovery simulator</h1>
          <p className="muted">Choose the safest action for CN-24018.</p>
        </div>
        <span className="badge blue-badge">3 OPTIONS SIMULATED</span>
      </div>

      <div className="recommendation-banner">
        <CheckCircle size={24} />
        <div>
          <strong>Recommended: Divert + re-ice</strong>
          <p>
            Protects all 14 facilities and keeps the consignment within the
            recovery window.
          </p>
        </div>
      </div>

      <section className="recovery-grid">
        {recoveryOptions.map((option) => (
          <div
            key={option.id}
            className={`recovery-card ${
              selectedOption === option.id ? "selected" : ""
            }`}
            onClick={() => setSelectedOption(option.id)}
          >
            {option.recommended && (
              <span className="recommended-label">RECOMMENDED</span>
            )}
            <h2>{option.name}</h2>
            <div className="option-risk">{option.risk} risk</div>

            <div className="option-details">
              <div>
                <span>Estimated cost</span>
                <strong>{option.cost}</strong>
              </div>
              <div>
                <span>New ETA</span>
                <strong>{option.eta}</strong>
              </div>
              <div>
                <span>Facilities protected</span>
                <strong>{option.facilities}</strong>
              </div>
            </div>

            <button
              className={
                selectedOption === option.id
                  ? "selected-button"
                  : "secondary-button"
              }
              onClick={(event) => {
                event.stopPropagation();
                setSelectedOption(option.id);
              }}
            >
              {selectedOption === option.id ? "Selected" : "Select option"}
            </button>
          </div>
        ))}
      </section>

      <section className="approval-section panel">
        <div>
          <p className="eyebrow">HUMAN GATE</p>
          <h2>Approval required</h2>
          <p className="muted">
            Meera Raghavan must approve the recovery action. Product
            disposition cannot be automated.
          </p>
        </div>

        {!approved ? (
          <button
            className="large-primary-button"
            disabled={!selectedOption}
            onClick={onApprove}
          >
            {selectedOption ? "Approve recovery" : "Select an option first"}
          </button>
        ) : (
          <div className="approved-box">
            <CheckCircle size={24} />
            <div>
              <strong>Recovery approved at 11:58</strong>
              <span>Transporter instructed. Evidence pack started.</span>
            </div>
            <button className="primary-button" onClick={onEvidence}>
              View evidence
            </button>
          </div>
        )}
      </section>
    </>
  );
}

function Evidence({ selectedOption, onBack }) {
  return (
    <>
      <button className="back-button" onClick={onBack}>
        ← Back to cockpit
      </button>

      <div className="page-heading">
        <div>
          <p className="eyebrow">EVIDENCE PACK</p>
          <h1>Incident successfully recovered</h1>
          <p className="muted">Complete audit trail for CN-24018.</p>
        </div>
        <span className="badge green-badge">RECOVERY APPROVED</span>
      </div>

      <div className="success-banner">
        <CheckCircle size={30} />
        <div>
          <strong>Nothing visible happened — that is success.</strong>
          <p>
            The shipment was diverted before the breach became irreversible.
          </p>
        </div>
      </div>

      <section className="content-grid">
        <div className="panel">
          <p className="eyebrow">AUDIT TIMELINE</p>
          <h2>What happened?</h2>
          <TimelineItem
            time="11:40"
            text="Sensing agent detected 9.2°C and a stationary vehicle."
          />
          <TimelineItem
            time="11:41"
            text="Scenario agent calculated 2h 10m until breach."
          />
          <TimelineItem
            time="11:41"
            text="Inventory agent identified 14 facilities and 3 sessions."
          />
          <TimelineItem
            time="11:42"
            text="Logistics agent simulated three recovery options."
          />
          <TimelineItem
            time="11:58"
            text={`Meera approved ${
              selectedOption || "diversion and re-icing"
            }.`}
            final
          />
        </div>

        <div className="panel">
          <p className="eyebrow">ROUTE MEMORY</p>
          <h2>Learning signal</h2>
          <div className="learning-card">
            <MapPin size={24} />
            <p>
              Similar unscheduled stops occurred 3 times on this route during
              the last 30 days.
            </p>
          </div>
          <p className="muted">
            Suggested follow-up: review scheduled-stop controls with the
            transporter.
          </p>
        </div>
      </section>
    </>
  );
}

function TimelineItem({ time, text, final }) {
  return (
    <div className={`timeline-item ${final ? "final-timeline" : ""}`}>
      <div className="timeline-time">{time}</div>
      <div className="timeline-marker">{final ? "✓" : "•"}</div>
      <p>{text}</p>
    </div>
  );
}

export default App;