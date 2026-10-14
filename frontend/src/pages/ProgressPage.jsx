
import { useCallback, useEffect, useState } from "react";
import {
  Activity, CalendarDays, Check, Flame, Plus, Target,
  Trophy, Weight, RefreshCw, ArrowRight, Camera
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from "recharts";
import SectionHeading from "../components/SectionHeading.jsx";

const API = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : `Request failed (${response.status})`
    );
  }

  return data;
}

function formatDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
}

export default function ProgressPage({ navigate }) {
  const [data, setData] = useState(null);
  const [show, setShow] = useState(false);
  const [note, setNote] = useState("");
  const [weight, setWeight] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadProgress = useCallback(async () => {
    try {
      const result = await request("/api/progress");
      setData(result);
      setMessage("");
    } catch (error) {
      setMessage(
        `${error.message}. Save your fitness profile in Workout Plan first.`
      );
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const entries = data?.entries || [];

  const chartData = entries.map((entry) => ({
    day: formatDate(entry.created_at),
    weight: Number(entry.weight_kg),
  }));

  const add = async (event) => {
    event.preventDefault();

    if (!weight || Number(weight) <= 25) {
      setMessage("Enter a valid weight greater than 25 kg.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      await request("/api/progress", {
        method: "POST",
        body: JSON.stringify({
          weight_kg: Number(weight),
          note: note.trim(),
        }),
      });

      setNote("");
      setWeight("");
      setShow(false);
      await loadProgress();
      setMessage("Progress entry saved successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const firstWeight = entries.length
    ? Number(entries[0].weight_kg)
    : data?.starting_weight_kg;

  const latestWeight = data?.latest_weight_kg ?? firstWeight;

  const change = firstWeight != null && latestWeight != null
    ? Number(latestWeight) - Number(firstWeight)
    : null;

  return (
    <div className="page inner-page">
      <SectionHeading
        eyebrow="YOUR JOURNEY · PROGRESS"
        title="Little wins,"
        accent=" big change."
        description="Track your recorded weight, review progress entries, and keep notes about your fitness journey."
        action={
          <button className="chip" onClick={loadProgress}>
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      {message && <div className="notice" role="status">{message}</div>}

      <div className="stats-grid">
        {[
          [Target, "Saved entries", String(entries.length), "Recorded in your progress history"],
          [Activity, "Latest weight", latestWeight != null ? `${Number(latestWeight).toFixed(1)} kg` : "Not recorded", "Most recent saved value"],
          [Weight, "Weight change", change != null ? `${change > 0 ? "+" : ""}${change.toFixed(1)} kg` : "Not available", "First recorded entry to latest"],
          [Flame, "Tracking status", entries.length > 1 ? "In progress" : "Getting started", "Keep logging consistently"],
        ].map(([Icon, label, value, detail]) => (
          <section className="panel stat" key={label}>
            <span><Icon /></span>
            <small>{label}</small>
            <b>{value}</b>
            <em>{detail}</em>
          </section>
        ))}
      </div>

      <section className="panel chart-panel">
        <div className="panel-head">
          <div>
            <small className="eyebrow">RECORDED BODY METRICS</small>
            <h3>Weight trend</h3>
            <p>Only saved measurements are displayed.</p>
          </div>
          <span className="legend">● Weight</span>
        </div>

        {chartData.length > 0 ? (
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e9878d" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#e9878d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eee2db" strokeDasharray="4 5" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#8d8790", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={["dataMin - 1", "dataMax + 1"]}
                  tick={{ fill: "#8d8790", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="weight"
                  name="Weight (kg)"
                  stroke="#e9878d"
                  strokeWidth={3}
                  fill="url(#weightFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="panel-foot">
            No progress measurements yet. Add your first entry to start the chart.
          </div>
        )}
      </section>

      <section className="panel journal">
        <div className="panel-head">
          <div>
            <small className="eyebrow">YOUR JOURNAL</small>
            <h3>Progress entries</h3>
          </div>
          <button className="primary small" onClick={() => setShow(!show)}>
            <Plus size={15} /> Add entry
          </button>
        </div>

        {show && (
          <form className="journal-form" onSubmit={add}>
            <input
              type="number"
              step="0.1"
              min="25.1"
              max="350"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              placeholder="Current weight in kg"
              required
            />
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Note (e.g. completed today's workout)"
              maxLength={500}
            />
            <button className="primary small" type="submit" disabled={busy}>
              {busy ? "Saving..." : "Save entry"}
            </button>
          </form>
        )}

        {entries.length ? (
          entries.slice().reverse().map((entry) => (
            <div className="journal-entry" key={entry.id}>
              <small>{formatDate(entry.created_at)}</small>
              <span><Check /></span>
              <div>
                <b>{Number(entry.weight_kg).toFixed(1)} kg</b>
                <p>{entry.note || "Weight measurement recorded."}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="muted">No entries recorded yet. Add your first weight measurement.</p>
        )}
      </section>

      <div className="notice">
        <Trophy />
        <p>
          Your history currently tracks weight and notes. Workout completion
          statistics and body-scan comparisons require additional backend
          storage and endpoints; they are not inferred from weight alone.
        </p>
      </div>

      <div className="workflow-next">
        <div>
          <small className="eyebrow">KEEP YOUR BASELINE FRESH</small>
          <p>Run another body scan later to review updated visual estimates alongside your recorded measurements.</p>
        </div>
        <button type="button" className="primary" onClick={() => navigate?.("Body Scan")}>
          New Body Scan <Camera size={16} />
        </button>
      </div>
    </div>
  );
}
