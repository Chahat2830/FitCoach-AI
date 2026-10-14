
import { useEffect, useState } from "react";
import {
  Apple, Check, Coffee, Droplets, Egg, Leaf, Plus,
  Salad, Sparkles, Utensils, RefreshCw, ArrowRight
} from "lucide-react";
import SectionHeading from "../components/SectionHeading.jsx";

const API = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const mealIcons = [Coffee, Salad, Apple, Egg];

async function request(path) {
  const response = await fetch(`${API}${path}`, { method: "POST" });
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

export default function DietPlanPage({ navigate }) {
  const [plan, setPlan] = useState(null);
  const [checked, setChecked] = useState([]);
  const [water, setWater] = useState(3);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadPlan = async () => {
    setBusy(true);
    setMessage("");

    try {
      const data = await request("/api/diet-plan");
      setPlan(data);
      setChecked([]);
    } catch (error) {
      setMessage(
        `${error.message}. If your fitness profile is not saved, open Workout Plan and save it first.`
      );
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const meals = plan?.meals || [];

  const toggle = (index) => {
    setChecked((previous) =>
      previous.includes(index)
        ? previous.filter((item) => item !== index)
        : [...previous, index]
    );
  };

  return (
    <div className="page inner-page">
      <SectionHeading
        eyebrow="DAILY FUEL · NUTRITION"
        title="Eat well,"
        accent=" feel ready."
        description="Meal suggestions based on your saved fitness goal and dietary preference."
        action={
          <button className="chip" onClick={loadPlan} disabled={busy}>
            <RefreshCw size={14} /> Refresh plan
          </button>
        }
      />

      <section className="diet-art-banner">
        <div><small className="eyebrow">NOURISH · RESTORE · REPEAT</small><h3>Good food, gentle progress.</h3><p>Build a routine that supports your training, hydration and recovery—one balanced choice at a time.</p></div>
        <img src="/images/diet.jfif" alt="Healthy nutrition inspiration" />
      </section>

      {message && <div className="notice" role="status">{message}</div>}

      {plan && (
        <>
          <div className="nutrition-overview">
            <section className="panel nutrition-box">
              <small className="eyebrow">CALORIE GUIDANCE</small>
              <h2>Daily energy</h2>
              <p>{plan.estimated_calorie_guidance || plan.calorie_guidance || "Personal calorie needs depend on individual factors."}</p>
              <p>
                Goal: <strong>{plan.goal?.replace(/_/g, " ")}</strong>
              </p>
            </section>

            <section className="panel nutrition-box macros">
              <div className="macro">
                <div>
                  <span>Protein target</span>
                  <b>
                    {plan.suggested_protein_grams_per_day != null
                      ? `${plan.suggested_protein_grams_per_day} g/day`
                      : (plan.protein_guidance || "Not available")}
                  </b>
                </div>
                <p>Suggested planning estimate</p>
              </div>
              <div className="macro">
                <div><span>Diet preference</span><b>{plan.diet_preference?.replace(/_/g, " ")}</b></div>
              </div>
            </section>

            <section className="panel nutrition-box water">
              <Droplets />
              <div>
                <small className="eyebrow">HYDRATION TRACKER</small>
                <h3>{water * 250} ml <small>/ 2,000 ml</small></h3>
                <p>Track glasses of water you drink.</p>
              </div>
              <div className="glasses">
                {Array.from({ length: 8 }, (_, index) => (
                  <button
                    key={index}
                    className={index < water ? "filled" : ""}
                    onClick={() => setWater(index + 1)}
                    aria-label={`Water glass ${index + 1}`}
                  >
                    <Droplets size={15} />
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="meal-heading">
            <div>
              <small className="eyebrow">YOUR PERSONALIZED SUGGESTIONS</small>
              <h2>Your meal guide</h2>
            </div>
            <span>{checked.length}/{meals.length} meals checked</span>
          </div>

          <div className="meal-list">
            {meals.map((meal, index) => {
              const Icon = mealIcons[index % mealIcons.length];

              return (
                <section
                  className={`panel meal ${checked.includes(index) ? "meal-done" : ""}`}
                  key={`${meal.meal}-${index}`}
                >
                  <div className="meal-time">
                    {["08:00 AM", "12:30 PM", "04:00 PM", "07:30 PM"][index] || ""}
                    <i />
                  </div>

                  <span className={`meal-icon ${["blue", "pink", "gold", "sage"][index % 4]}`}>
                    <Icon />
                  </span>

                  <div className="meal-copy">
                    <small className="eyebrow">{meal.meal}</small>
                    <h3>{meal.suggestion}</h3>
                    <p>{meal.reason || "Choose portions that suit your appetite and daily needs."}</p>
                    <div className="meal-tags">
                      {meal.calories != null && (
                        <span><Utensils /> {meal.calories} kcal</span>
                      )}
                      {meal.protein_g != null && (
                        <span><Leaf /> {meal.protein_g} g protein</span>
                      )}
                    </div>
                  </div>

                  <button
                    className={`meal-check ${checked.includes(index) ? "checked" : ""}`}
                    onClick={() => toggle(index)}
                    aria-label={`Mark ${meal.meal} complete`}
                  >
                    {checked.includes(index) ? <Check /> : <Plus />}
                  </button>
                </section>
              );
            })}
          </div>

          {plan.hydration && (
            <div className="notice"><Droplets /><p>{plan.hydration}</p></div>
          )}

          {(plan.notes || plan.caveats || []).map((note, index) => (
            <p className="muted" key={index}>{note}</p>
          ))}
        </>
      )}

      {!plan && busy && <div className="panel">Loading your diet plan...</div>}

      <div className="notice">
        <Sparkles />
        <p>
          Meal suggestions and protein guidance are estimates, not a
          clinical diet prescription. Calorie requirements depend on
          additional personal factors. Consider allergies, medical needs,
          and advice from a qualified dietitian.
        </p>
      </div>

      <div className="workflow-next">
        <div>
          <small className="eyebrow">NEXT STEP · YOUR JOURNEY</small>
          <p>Continue to record measurements and review your progress over time.</p>
        </div>
        <button type="button" className="primary" onClick={() => navigate?.("Progress")}>
          Continue to Progress <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
