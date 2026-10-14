import { useEffect, useState } from "react";
import { apiRequest } from "../services/api.js";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Camera, Check, Dumbbell, Flame, HeartPulse, Sparkles, Target, TrendingUp, Utensils, Weight } from "lucide-react";
import SectionHeading from "../components/SectionHeading.jsx";
const features=[["Body Scan","Body Analysis","Understand your current baseline with AI.",Camera,"blue"],["Workout Plan","Workout Plan","Training that adapts to your goals.",Dumbbell,"pink"],["Diet Plan","Nutrition Plan","Simple meals built around your routine.",Utensils,"sage"],["Progress","Track Progress","See consistency turn into momentum.",TrendingUp,"gold"]];
const exercises=[["Dumbbell bench press","Chest · 3 sets × 10 reps"],["Lat pulldown","Back · 3 sets × 12 reps"],["Goblet squat","Legs · 3 sets × 12 reps"],["Plank hold","Core · 3 × 40 seconds"]];
export default function HomePage({navigate}) {
 const [done,setDone]=useState([true,false,false,false]);
 const [stats,setStats]=useState({score:null,weight:null,entries:0});
 useEffect(()=> {
   let active=true;
   Promise.allSettled([apiRequest("/api/dashboard-data"),apiRequest("/api/progress")]).then(([reportResult,progressResult])=>{
     if(!active)return;
     const report=reportResult.status==="fulfilled"?reportResult.value:null;
     const progress=progressResult.status==="fulfilled"?progressResult.value:null;
     setStats({
       score: report?.overall_score ?? null,
       weight: progress?.latest_weight_kg ?? null,
       entries: progress?.entries?.length ?? 0
     });
   });
   return ()=>{active=false;};
 },[]);
 return <div className="page">
  <section className="hero"><div className="hero-copy"><span className="pill"><Sparkles size={15}/> YOUR PERSONAL AI COACH</span><h2>Build<br/>a <em>stronger</em> you.</h2><p>AI-powered body analysis, personalized workouts and nutrition plans — all in one place.</p><div className="actions"><button className="primary" onClick={()=>navigate("Body Scan")}>Start body scan <ArrowRight size={17}/></button><button className="secondary" onClick={()=>navigate("Workout Plan")}>▶ &nbsp; Explore your plan</button></div><div className="trust"><span><Sparkles/> <b>AI-powered<small>Body insights</small></b></span><span><Target/><b>Made for you<small>Personal plans</small></b></span><span><Activity/><b>Every day<small>Progress tracking</small></b></span></div></div>
  <div className="hero-art"><img className="hero-art-image" src="/images/Dreamy%20Sakura%20Mountain%20Sunrise.png" alt="Dreamy sakura mountain sunrise anime landscape"/><div className="sun"/><div className="mountains"/><div className="blossoms">✿　✧　✿</div><div className="quote">DISCIPLINE<br/>CREATES<br/><em>freedom.</em></div><div className="art-caption">● YOUR NEXT CHAPTER<small>Starts with one small step</small></div></div></section>
  <section className="inspiration-section">
   <div className="inspiration-heading"><div><small className="eyebrow">A LITTLE DAILY INSPIRATION</small><h3>Find your calm, then find your strength.</h3></div><p>Gentle moments for a balanced routine ✿</p></div>
   <div className="inspiration-grid">
    <article className="inspiration-card"><img src="/images/Serene%20Morning%20Yoga%20by%20the%20Lake.png" alt="Anime illustration of morning yoga by a lake"/><div><b>Serene Morning Yoga by the Lake</b><small>Start slowly. Breathe deeply.</small></div></article>
    <article className="inspiration-card"><img src="/images/Sunlit%20Cherry%20Blossom%20Stretch%20by%20the%20Lake.png" alt="Anime illustration of stretching beside cherry blossoms"/><div><b>Sunlit Cherry Blossom Stretch</b><small>A little mobility goes a long way.</small></div></article>
    <article className="inspiration-card"><img src="/images/Sunlit%20Sakura%20Terrace%20Yoga%20Glow.png" alt="Anime illustration of yoga on a sakura terrace"/><div><b>Sunlit Sakura Terrace Yoga Glow</b><small>Make room for mindful movement.</small></div></article>
    <article className="inspiration-card"><img src="/images/Sunrise%20Breakfast%20by%20the%20Mountain%20Lake.png" alt="Anime illustration of a peaceful breakfast beside a mountain lake"/><div><b>Sunrise Breakfast by the Mountain Lake</b><small>Fuel your day with intention.</small></div></article>
   </div>
  </section>
  <section className="features">{features.map(([page,title,desc,Icon,tone])=><motion.button key={page} className={`feature ${tone}`} onClick={()=>navigate(page)} whileHover={{y:-4}}><div className="feature-top"><span><Icon/></span><small>{page==="Body Scan"?"AI VISION":page==="Workout Plan"?"SMART TRAINING":page==="Diet Plan"?"DAILY FUEL":"YOUR JOURNEY"}</small></div><h3>{title}</h3><p>{desc}</p><b className="arrow">↗</b><i>✿</i></motion.button>)}</section>
  <div className="two-col"><section className="panel"><small className="eyebrow">YOUR MOMENTUM</small><h3>Your progress</h3><div className="progress-layout"><div className="ring"><b>{stats.score != null ? `${Math.round(stats.score)}%` : "—"}</b><small>Body score</small></div><div className="metrics"><Metric label="Latest weight" value={stats.weight != null ? `${Number(stats.weight).toFixed(1)} kg` : "Not recorded"} width={stats.weight != null ? "68%" : "0%"}/><Metric label="Progress entries" value={String(stats.entries)} width={stats.entries ? "78%" : "0%"}/><Metric label="Body analysis" value={stats.score != null ? "Available" : "Not scanned"} width={stats.score != null ? "62%" : "0%"}/></div></div><p className="muted">● You're building a habit that lasts.</p></section>
  <section className="panel"><div className="panel-head"><div><small className="eyebrow">TODAY'S SESSION</small><h3>Full-body strength</h3></div><span className="chip">♨ 45 min</span></div><div className="session-title"><Dumbbell/><span><b>Strength foundation</b><small>Intermediate · 4 exercises</small></span><strong>{done.filter(Boolean).length}/4</strong></div>{exercises.map(([name,meta],i)=><button className="exercise" key={name} onClick={()=>setDone(old=>old.map((v,j)=>i===j?!v:v))}><Dumbbell/><span><b>{name}</b><small>{meta}</small></span><i className={done[i]?"checked":""}>{done[i]?"✓":""}</i></button>)}<div className="panel-foot"><span>{4-done.filter(Boolean).length} exercises left</span><button className="link" onClick={()=>navigate("Workout Plan")}>View plan →</button></div></section></div>
  <div className="two-col lower"><section className="panel promo"><div><small className="eyebrow">YOUR STARTING POINT</small><h3>Know your body.<br/><em>Train with purpose.</em></h3><p>Use front, back and side photos to explore posture estimates and body metrics.</p><button className="primary" onClick={()=>navigate("Body Scan")}>Begin body scan →</button></div><div className="orbit">◎<small>POSE MAPPING · READY</small></div></section><section className="panel"><small className="eyebrow">FUEL YOUR PROGRESS</small><h3>Nutrition, simplified.</h3><p className="muted">A balanced day starts with a few good choices. Use this as a preview of a future personalized meal plan.</p><div className="nutrition-stats"><Nutrition label="Daily target" value="2,200" unit="kcal" w="68%"/><Nutrition label="Protein goal" value="130" unit="g" w="78%"/><Nutrition label="Water" value="2.2" unit="L" w="56%"/></div><button className="link" onClick={()=>navigate("Diet Plan")}>Explore nutrition →</button></section></div>
 </div>;
}
function Metric({label,value,width}){return <div className="metric"><div><span>{label}</span><b>{value}</b></div><div className="bar"><i style={{width}}/></div></div>}
function Nutrition({label,value,unit,w}){return <div className="nutri"><small>{label}</small><b>{value} <em>{unit}</em></b><div className="bar"><i style={{width:w}}/></div></div>}
