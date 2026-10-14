
import { useEffect, useState } from "react";
import {
  Check, Clock3, Dumbbell, Flame, RotateCcw,
  Target, Timer, Zap, UserRound, RefreshCw, ArrowRight
} from "lucide-react";
import SectionHeading from "../components/SectionHeading.jsx";

const API = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const initialProfile = {
  age: "25",
  height_cm: "170",
  weight_kg: "60",
  goal: "muscle_gain",
  activity_level: "beginner",
  equipment: "gym",
  diet_preference: "vegetarian",
};

const sampleRoutines = {
  Strength: [
    { name: "Dumbbell bench press", muscle: "Chest", sets: 3, reps: "10", duration: "8 min" },
    { name: "Lat pulldown", muscle: "Back", sets: 3, reps: "12", duration: "8 min" },
    { name: "Goblet squat", muscle: "Legs", sets: 3, reps: "12", duration: "10 min" },
    { name: "Shoulder press", muscle: "Shoulders", sets: 3, reps: "10", duration: "8 min" },
    { name: "Plank hold", muscle: "Core", sets: 3, reps: "40 seconds", duration: "5 min" },
  ],
  Mobility: [
    { name: "Cat-cow stretch", muscle: "Spine", sets: 2, reps: "10", duration: "4 min" },
    { name: "Hip flexor stretch", muscle: "Hips", sets: 2, reps: "30 sec per side", duration: "4 min" },
    { name: "Wall slides", muscle: "Shoulders", sets: 2, reps: "12", duration: "5 min" },
  ],
  Cardio: [
    { name: "Brisk walk", muscle: "Cardio", sets: 1, reps: "10 minutes", duration: "10 min" },
    { name: "Stationary bike", muscle: "Cardio", sets: 1, reps: "12 minutes", duration: "12 min" },
    { name: "Cooldown walk", muscle: "Recovery", sets: 1, reps: "5 minutes", duration: "5 min" },
  ],
};

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

export default function WorkoutPlanPage({ navigate }) {
  const [type, setType] = useState("Strength");
  const [done, setDone] = useState({});
  const [filter, setFilter] = useState("All");
  const [profile, setProfile] = useState(initialProfile);
  const [showProfile, setShowProfile] = useState(false);
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadPlan = async () => {
    setBusy(true);
    setMessage("");
    try {
      const data = await request("/api/workout-plan", { method: "POST" });
      setPlan(data);
      setDone({});
    } catch (error) {
      setMessage(error.message);
      if (error.message.toLowerCase().includes("profile")) {
        setShowProfile(true);
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const saved = await request("/api/fitness-profile");
        if (cancelled) return;

        setProfile({
          age: String(saved.age),
          height_cm: String(saved.height_cm),
          weight_kg: String(saved.weight_kg),
          goal: saved.goal,
          activity_level: saved.activity_level,
          equipment: saved.equipment,
          diet_preference: saved.diet_preference,
        });

        const data = await request("/api/workout-plan", { method: "POST" });
        if (!cancelled) setPlan(data);
      } catch (error) {
        if (!cancelled) {
          setMessage(error.message);
          setShowProfile(true);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const saveProfileAndLoad = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const payload = {
        ...profile,
        age: Number(profile.age),
        height_cm: Number(profile.height_cm),
        weight_kg: Number(profile.weight_kg),
      };

      await request("/api/fitness-profile", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await request("/api/workout-plan", { method: "POST" });
      setPlan(data);
      setShowProfile(false);
      setDone({});
      setMessage("Profile saved and workout plan generated.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const exercises = plan?.exercises?.length
    ? plan.exercises.map((item) => ({
        name: item.name,
        muscle: item.muscle || (Array.isArray(item.target_muscles) ? item.target_muscles.join(", ") : item.target_muscles) || item.target || "Full body",
        sets: item.sets,
        reps: item.reps,
        duration: item.duration || (item.rest_seconds ? `${item.rest_seconds}s rest` : "As needed"),
      }))
    : sampleRoutines[type];

  const groups = ["All", ...new Set(exercises.map((item) => item.muscle))];
  const visibleExercises = exercises
    .map((exercise, index) => ({ exercise, index }))
    .filter(({ exercise }) => filter === "All" || exercise.muscle === filter);

  const completed = exercises.filter((_, index) => done[index]).length;
  const title = type === "Strength"
    ? "Full-body strength"
    : type === "Mobility"
      ? "Gentle mobility flow"
      : "Cardio & conditioning";

  return (
    <div className="page inner-page">
      <SectionHeading
        eyebrow="SMART TRAINING"
        title="Make every rep"
        accent=" count."
        description="Your training plan, based on your saved fitness goal and available equipment."
        action={
          <button className="chip" onClick={loadPlan} disabled={busy}>
            <RefreshCw size={14} /> Refresh plan
          </button>
        }
      />

      {message && <div className="notice" role="status">{message}</div>}

      <section className="panel plan-panel">
        <div className="panel-head">
          <div>
            <small className="eyebrow">FITNESS PROFILE</small>
            <h3>Your goals and preferences</h3>
          </div>
          <button className="link" onClick={() => setShowProfile(!showProfile)}>
            <UserRound size={15} /> {showProfile ? "Hide form" : "Edit profile"}
          </button>
        </div>

        {showProfile && (
          <form className="journal-form" onSubmit={saveProfileAndLoad}>
            <label>Age
              <input type="number" min="18" max="100" required value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })} />
            </label>
            <label>Height (cm)
              <input type="number" min="101" max="250" required value={profile.height_cm}
                onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })} />
            </label>
            <label>Weight (kg)
              <input type="number" min="26" max="350" step="0.1" required value={profile.weight_kg}
                onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value })} />
            </label>
            <label>Goal
              <select value={profile.goal}
                onChange={(e) => setProfile({ ...profile, goal: e.target.value })}>
                <option value="muscle_gain">Build muscle</option>
                <option value="fat_loss">Fat loss</option>
                <option value="maintenance">Maintain weight</option>
                <option value="fitness">General fitness</option>
              </select>
            </label>
            <label>Activity level
              <select value={profile.activity_level}
                onChange={(e) => setProfile({ ...profile, activity_level: e.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
              </select>
            </label>
            <label>Equipment
              <select value={profile.equipment}
                onChange={(e) => setProfile({ ...profile, equipment: e.target.value })}>
                <option value="gym">Gym</option>
                <option value="home">Home equipment</option>
                <option value="bodyweight">Bodyweight only</option>
              </select>
            </label>
            <label>Diet preference
              <select value={profile.diet_preference}
                onChange={(e) => setProfile({ ...profile, diet_preference: e.target.value })}>
                <option value="vegetarian">Vegetarian</option>
                <option value="eggetarian">Eggetarian</option>
                <option value="vegan">Vegan</option>
                <option value="non_vegetarian">Non-vegetarian</option>
              </select>
            </label>
            <button className="primary small" type="submit" disabled={busy}>
              {busy ? "Saving..." : "Save profile & generate plan"}
            </button>
          </form>
        )}
      </section>

      <section className="panel workout-hero">
        <div className="dumbbell-art"><img className="section-art-image" src="/images/pose.jfif" alt="Fitness pose illustration" /></div>
        <div>
          <small className="eyebrow">YOUR WORKOUT</small>
          <h2>{plan?.focus || title}</h2>
          <p>{plan?.guidance || plan?.summary || "Choose a routine and complete exercises at a comfortable pace."}</p>
          <div className="tags">
            <span><Dumbbell /> {exercises.length} exercises</span>
            <span><Flame /> Progressive training</span>
            <span><Target /> {plan?.days_per_week || 3} days/week</span>
          </div>
        </div>
        <div className="completion-ring">
          <b>{Math.round(completed / exercises.length * 100)}%</b>
          <small>Complete</small>
        </div>
      </section>

      <div className="tabs">
        {Object.keys(sampleRoutines).map((routine) => (
          <button
            className={routine === type ? "selected" : ""}
            key={routine}
            onClick={() => { setType(routine); setFilter("All"); setDone({}); }}
          >
            {routine}
          </button>
        ))}
      </div>

      <section className="panel plan-panel">
        <div className="panel-head">
          <div>
            <small className="eyebrow">YOUR EXERCISES</small>
            <h3>Session checklist</h3>
          </div>
          <button className="link" onClick={() => setDone({})}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <div className="filters">
          {groups.map((group) => (
            <button key={group} className={filter === group ? "active" : ""}
              onClick={() => setFilter(group)}>{group}</button>
          ))}
        </div>

        {visibleExercises.map(({ exercise, index }) => (
          <button
            className={`plan-row ${done[index] ? "done" : ""}`}
            key={`${exercise.name}-${index}`}
            onClick={() => setDone((previous) => ({ ...previous, [index]: !previous[index] }))}
          >
            <span className="exercise-icon"><Dumbbell /></span>
            <span className="exercise-name">
              <b>{exercise.name}</b>
              <small>{exercise.muscle} · Personalized plan</small>
            </span>
            <span className="prescription">
              {exercise.sets} sets × {exercise.reps} reps
              <small><Timer /> {exercise.duration}</small>
            </span>
            <span className="check">{done[index] && <Check size={15} />}</span>
          </button>
        ))}

        <div className="panel-foot">
          <span>{completed} of {exercises.length} complete</span>
          <div className="bar"><i style={{ width: `${completed / exercises.length * 100}%` }} /></div>
        </div>
      </section>

      {(plan?.schedule || plan?.weekly_schedule) && (
        <section className="panel plan-panel">
          <div className="panel-head">
            <div><small className="eyebrow">WEEKLY ROUTINE</small><h3>Your schedule</h3></div>
            <Clock3 />
          </div>
          {(plan.schedule || plan.weekly_schedule).map((day) => (
            <div className="journal-entry" key={day.day}>
              <span><Check size={15} /></span>
              <div><b>{day.day}</b><p>{day.activity}</p></div>
            </div>
          ))}
        </section>
      )}

      <div className="notice"><Zap /><p>Start with a comfortable load, focus on technique, and stop if you feel pain. These are general exercise suggestions, not medical advice.</p></div>

      <div className="workflow-next">
        <div>
          <small className="eyebrow">NEXT STEP · NUTRITION</small>
          <p>Your workout plan is ready. Continue to your personalized meal guide.</p>
        </div>
        <button type="button" className="primary" onClick={() => navigate?.("Diet Plan")}>
          Continue to Diet Plan <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
