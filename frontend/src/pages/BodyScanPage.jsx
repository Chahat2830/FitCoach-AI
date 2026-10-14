
import { useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  CloudUpload,
  ImagePlus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Activity,
  RefreshCw,
  ArrowRight,
  Save,
} from "lucide-react";
import SectionHeading from "../components/SectionHeading.jsx";
import { uploadBodyScan, generateRecommendations, getDashboardData } from "../services/api.js";

const views = [
  ["front", "Front view", "Face the camera with your whole body visible."],
  ["back", "Back view", "Stand straight with your back facing the camera."],
  ["side", "Side view", "Turn sideways; keep head, hips and feet in frame."],
];

export default function BodyScanPage({ navigate }) {
  const [images, setImages] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const refs = useRef({});

  const choose = (key, file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("Each image must be smaller than 10 MB.");
      return;
    }

    setImages((previous) => {
      if (previous[key]?.url) {
        URL.revokeObjectURL(previous[key].url);
      }

      return {
        ...previous,
        [key]: {
          file,
          url: URL.createObjectURL(file),
        },
      };
    });

    setAnalysis(null);
    setMessage("");
  };

  const removeImage = (key) => {
    setImages((previous) => {
      if (previous[key]?.url) {
        URL.revokeObjectURL(previous[key].url);
      }

      const updated = { ...previous };
      delete updated[key];
      return updated;
    });

    setAnalysis(null);
    setMessage("");
  };

  const uploadAndAnalyze = async () => {
    if (views.some(([key]) => !images[key]?.file)) {
      setMessage("Please add all three photos before continuing.");
      return;
    }

    setBusy(true);
    setMessage("");
    setAnalysis(null);

    try {
      await uploadBodyScan(images);
      setMessage("Photos uploaded. Running body analysis and generating recommendations...");

      try {
        const result = await generateRecommendations();
        setAnalysis(result.report || null);
        setMessage("Body scan analyzed and AI recommendations generated successfully. Open Workout Plan or Diet Plan to view them.");
      } catch (recommendationError) {
        // A body report is still useful when the profile has not been saved yet.
        const report = await getDashboardData();
        setAnalysis(report);
        const needsProfile = /profile/i.test(recommendationError.message);
        setMessage(needsProfile
          ? "Body scan report is ready. Save your fitness profile in Workout Plan, then return here to generate personalized AI recommendations."
          : `Body scan report is ready, but AI recommendations could not be generated: ${recommendationError.message}`);
      }
    } catch (error) {
      setMessage(
        `Error: ${error.message || "Unable to connect to the backend."}`
      );
    } finally {
      setBusy(false);
    }
  };

  const scoreEntries = analysis?.scores
    ? Object.entries(analysis.scores)
    : [];

  const formatLabel = (value) =>
    value.replace(/_/g, " ").replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );

  return (
    <div className="page inner-page">
      <SectionHeading
        eyebrow="AI VISION · BODY BASELINE"
        title="Your body,"
        accent=" understood."
        description="Upload clear photos from three angles to prepare your body profile and fitness insights."
      />

      <div className="notice">
        <ShieldCheck />
        <div>
          <b>Good lighting makes a better scan.</b>
          <p>
            Keep your full body visible and use a plain background.
            Your photos are sent to your configured backend.
          </p>
        </div>
      </div>

      <div className="scan-grid">
        {views.map(([key, title, hint], index) => (
          <section className="panel upload-card" key={key}>
            <div className="upload-head">
              <b>0{index + 1}</b>
              <div>
                <h3>{title}</h3>
                <p>{hint}</p>
              </div>
            </div>

            <input
              ref={(element) => {
                refs.current[key] = element;
              }}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(event) => {
                choose(key, event.target.files?.[0]);
                event.target.value = "";
              }}
            />

            {images[key] ? (
              <div className="preview">
                <img src={images[key].url} alt={`${title} preview`} />

                <span>
                  <CheckCircle2 size={15} /> Ready
                </span>

                <button
                  type="button"
                  onClick={() => removeImage(key)}
                  aria-label={`Remove ${title}`}
                >
                  <Trash2 size={15} />
                </button>

                <button
                  type="button"
                  className="replace"
                  onClick={() => refs.current[key]?.click()}
                >
                  <RotateCcw size={14} /> Replace
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="drop"
                onClick={() => refs.current[key]?.click()}
              >
                <ImagePlus size={33} />
                <b>Choose {key} photo</b>
                <small>PNG, JPG or WEBP · Max 10 MB</small>
                <span>
                  <CloudUpload size={15} /> Browse files
                </span>
              </button>
            )}
          </section>
        ))}
      </div>

      {message && (
        <div
          role="status"
          className={`message ${
            message.startsWith("Error:") ||
            message.startsWith("Please")
              ? "error"
              : ""
          }`}
        >
          {message}
        </div>
      )}

      <div className="submit-row">
        <span>
          <Camera />
          <b>
            Ready when you are
            <small>All three views are required.</small>
          </b>
        </span>

        <button
          type="button"
          className="primary"
          disabled={busy}
          onClick={uploadAndAnalyze}
        >
          {busy ? (
            <>
              <RefreshCw size={16} /> Processing...
            </>
          ) : (
            <>
              Upload & Analyze <CloudUpload size={16} />
            </>
          )}
        </button>

        {analysis && (
          <button
            type="button"
            className="primary workflow-save"
            onClick={() => navigate?.("Workout Plan")}
          >
            <Save size={16} /> Save & Continue to Workout <ArrowRight size={16} />
          </button>
        )}
      </div>

      {analysis && (
        <section className="panel info-panel">
          <Activity size={24} />

          <div>
            <small className="eyebrow">YOUR ANALYSIS RESULTS</small>
            <h3>Body Scan Report</h3>

            <p>
              Body type:{" "}
              <strong>{analysis.body_type || "Not available"}</strong>
            </p>

            <p>
              Overall score:{" "}
              <strong>
                {analysis.overall_score ?? "Not available"}
              </strong>
            </p>

            {scoreEntries.length > 0 && (
              <>
                <h4>Fitness scores</h4>
                <ul>
                  {scoreEntries.map(([key, value]) => (
                    <li key={key}>
                      <strong>{formatLabel(key)}:</strong>{" "}
                      {typeof value === "number"
                        ? value.toFixed(1)
                        : String(value)}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <h4>Strengths</h4>
            {analysis.strengths?.length ? (
              <ul>
                {analysis.strengths.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No strengths were returned by the backend.</p>
            )}

            <h4>Areas to improve</h4>
            {analysis.weaknesses?.length ? (
              <ul>
                {analysis.weaknesses.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No improvement areas were returned by the backend.</p>
            )}

            <p>
              <small>
                Results depend on image quality and the backend's
                analysis method; they are estimates, not medical advice.
              </small>
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
