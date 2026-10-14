import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Camera, CalendarDays, HeartPulse, TrendingUp, Users, Menu, X, Search, Bell, ChevronDown, LogOut, Settings } from "lucide-react";
import HomePage from "./pages/HomePage.jsx";
import BodyScanPage from "./pages/BodyScanPage.jsx";
import WorkoutPlanPage from "./pages/WorkoutPlanPage.jsx";
import DietPlanPage from "./pages/DietPlanPage.jsx";
import ProgressPage from "./pages/ProgressPage.jsx";
import CommunityPage from "./pages/CommunityPage.jsx";
import "./App.css";

const pages = [
  ["Home", Home, HomePage], ["Body Scan", Camera, BodyScanPage],
  ["Workout Plan", CalendarDays, WorkoutPlanPage], ["Diet Plan", HeartPulse, DietPlanPage],
  ["Progress", TrendingUp, ProgressPage], ["Community", Users, CommunityPage]
];
export default function App() {
  const [active, setActive] = useState("Home");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const Page = pages.find(p => p[0] === active)?.[2] || HomePage;
  const go = name => { setActive(name); setOpen(false); window.scrollTo({top:0,behavior:"smooth"}); };
  return <div className="shell">
    {open && <button className="overlay" onClick={() => setOpen(false)} aria-label="Close menu" />}
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <button className="brand" onClick={() => go("Home")}><span className="brand-icon"><img src="/dumbbell-logo.svg" alt="" /></span><span>FITCOACH<small>AI FITNESS PARTNER</small></span><X className="close-menu" onClick={e => {e.stopPropagation();setOpen(false)}} size={18}/></button>
      <div className="nav-label">YOUR SPACE</div>
      <nav>{pages.map(([name, Icon]) => <button key={name} className={`nav-item ${active===name?"active":""}`} onClick={() => go(name)}><Icon size={18}/>{name}</button>)}</nav>
      <div className="reminder"><small>TODAY'S REMINDER</small><h3>Small steps.<br/><em>Stronger you.</em></h3><p>“Progress is built one day at a time.”</p><div className="flowers">✿　山　✿</div></div>
      <div className="nav-bottom"><button className="nav-item" onClick={() => go("Progress")}><Settings size={18}/>Settings</button><button className="nav-item" onClick={() => alert("This is a local prototype.")}><LogOut size={18}/>Log out</button></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="hamburger" onClick={() => setOpen(true)} aria-label="Open menu"><Menu/></button><div className="crumb">Workspace <span>/</span> <b>{active}</b></div>
        <div className="top-actions"><label className="search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search workouts, exercises, nutrition..."/></label><button className="round-btn" onClick={() => alert("You're all caught up!")}><Bell size={18}/><i/></button><button className="profile"><span>ち</span><small>Welcome back,<b>Chahat</b></small><ChevronDown size={15}/></button></div>
      </header>
      <AnimatePresence mode="wait"><motion.div key={active} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} transition={{duration:.2}}><Page navigate={go} searchQuery={search}/></motion.div></AnimatePresence>
      <footer><b>FITCOACH ✿</b><span>Small steps, stronger you.</span><span>Made for your next chapter</span></footer>
    </main>
  </div>;
}
