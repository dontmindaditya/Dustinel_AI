"use client";

import { Cpu, Bell, BarChart3, Eye } from "lucide-react";

const ROUTES = {
  LOGIN: "/login",
  ADMIN_DASHBOARD: "/admin/dashboard",
};

const features = [
  {
    icon: Cpu,
    title: "AI-Powered Vision",
    description:
      "Detects PPE compliance, fatigue indicators, and environmental hazards in milliseconds — without any manual input.",
    stat: "99.2%",
    statLabel: "Detection accuracy",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    description:
      "Critical risk events trigger push, SMS, and in-app notifications within 5 seconds — before incidents happen.",
    stat: "<5s",
    statLabel: "Alert delivery",
  },
  {
    icon: BarChart3,
    title: "Health Dashboard",
    description:
      "Monitor individual and site-wide health scores with real-time trend analysis and predictive risk insights.",
    stat: "10k+",
    statLabel: "Workers protected",
  },
];

const steps = [
  {
    num: "01",
    title: "Worker Check-In",
    desc: "Worker captures a face and environment photo via the mobile app at shift start.",
    icon: Eye,
  },
  {
    num: "02",
    title: "AI Analysis",
    desc: "Computer vision scans for PPE compliance, fatigue signs, and environmental hazards instantly.",
    icon: Cpu,
  },
  {
    num: "03",
    title: "Risk Scoring",
    desc: "An ML model calculates a 0–100 health score with the top contributing risk factors.",
    icon: BarChart3,
  },
  {
    num: "04",
    title: "Alerts & Action",
    desc: "High-risk scores trigger real-time alerts to the worker, supervisor, and safety team.",
    icon: Bell,
  },
];

const riskLevels = [
  { label: "LOW", range: "80–100", color: "#5a9e6f", bg: "rgba(90,158,111,0.1)", border: "rgba(90,158,111,0.25)", action: "No alert. Logged to the safety dashboard." },
  { label: "MEDIUM", range: "60–79", color: "#c9933a", bg: "rgba(201,147,58,0.1)", border: "rgba(201,147,58,0.25)", action: "In-app notification sent to the worker." },
  { label: "HIGH", range: "40–59", color: "#c96b3a", bg: "rgba(201,107,58,0.1)", border: "rgba(201,107,58,0.25)", action: "Push alert to worker + email to supervisor." },
  { label: "CRITICAL", range: "0–39", color: "#b84040", bg: "rgba(184,64,64,0.1)", border: "rgba(184,64,64,0.25)", action: "Immediate push + SMS + site access restriction." },
];

export default function HomePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:       #0f0d0b;
          --surface:  #161410;
          --surface2: #1c1916;
          --border:   rgba(255,235,200,0.07);
          --border2:  rgba(255,235,200,0.13);
          --text:     #ede8e0;
          --muted:    #7a7068;
          --muted2:   #9e9488;
          --accent:   #c9933a;
          --accent-dim: rgba(201,147,58,0.15);
          --accent-glow: rgba(201,147,58,0.08);
          --ff-serif: 'Instrument Serif', Georgia, serif;
          --ff-sans:  'Geist', system-ui, sans-serif;
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--ff-sans);
          line-height: 1.6;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        a { text-decoration: none; color: inherit; }

        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 180px;
          pointer-events: none;
          z-index: 9999;
          mix-blend-mode: overlay;
          opacity: 0.35;
        }

        .hdr {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          border-bottom: 1px solid var(--border);
          background: rgba(15,13,11,0.82);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .hdr-in {
          max-width: 1160px;
          margin: 0 auto;
          padding: 0 28px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 9px;
          font-family: var(--ff-sans);
          font-weight: 600;
          font-size: 16px;
          letter-spacing: -0.01em;
          color: var(--text);
        }
        /* logo-mark removed — using logo.png */
        .nav { display: flex; align-items: center; gap: 4px; }
        .nav-link {
          padding: 7px 14px;
          border-radius: 7px;
          font-size: 13.5px;
          font-weight: 400;
          color: var(--muted2);
          transition: color 0.18s, background 0.18s;
        }
        .nav-link:hover { color: var(--text); background: var(--surface); }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.18s;
          text-decoration: none;
          font-family: var(--ff-sans);
        }
        .btn-sm { padding: 8px 16px; font-size: 13.5px; }
        .btn-md { padding: 13px 24px; font-size: 14.5px; }
        .btn-solid {
          background: var(--accent);
          color: #0f0d0b;
          border: 1px solid var(--accent);
          font-weight: 600;
        }
        .btn-solid:hover { background: #d9a34a; border-color: #d9a34a; }
        .btn-border {
          background: transparent;
          color: var(--text);
          border: 1px solid var(--border2);
        }
        .btn-border:hover { border-color: var(--accent); background: var(--accent-glow); color: var(--accent); }

        /* HERO */
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
        }
        .hero::after {
          content: '';
          position: absolute;
          top: -10%; left: 40%;
          width: 600px; height: 600px;
          background: radial-gradient(ellipse at center, rgba(201,147,58,0.05) 0%, transparent 65%);
          pointer-events: none;
        }
        .hero-in {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1160px;
          margin: 0 auto;
          padding: 120px 28px 80px;
          display: grid;
          grid-template-columns: 1fr 440px;
          gap: 56px;
          align-items: center;
        }
        /* left col: never overflow into right */
        .hero-left { min-width: 0; }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 12px;
          border-radius: 100px;
          border: 1px solid var(--border2);
          background: var(--surface);
          font-size: 11.5px;
          color: var(--muted2);
          letter-spacing: 0.03em;
          margin-bottom: 26px;
        }
        .live-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #5a9e6f;
          box-shadow: 0 0 6px rgba(90,158,111,0.7);
        }
        .hero-h1 {
          font-family: var(--ff-serif);
          font-size: clamp(40px, 4.5vw, 64px);
          font-weight: 400;
          line-height: 1.08;
          letter-spacing: -0.01em;
          color: var(--text);
          margin-bottom: 22px;
        }
        .hero-h1 em { font-style: italic; color: var(--accent); }
        .hero-p {
          font-size: 16px;
          color: var(--muted2);
          line-height: 1.72;
          max-width: 420px;
          margin-bottom: 36px;
          font-weight: 300;
        }
        .hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; }
        .hero-rule {
          margin-top: 52px;
          padding-top: 40px;
          border-top: 1px solid var(--border);
          display: flex;
          gap: 40px;
        }
        .st-n {
          font-family: var(--ff-serif);
          font-size: 28px;
          font-weight: 400;
          color: var(--text);
          line-height: 1;
          margin-bottom: 5px;
        }
        .st-l {
          font-size: 11px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.09em;
        }

        /* PHOTO STACK — fully self-contained in its 440px column */
        .photo-stack {
          position: relative;
          width: 440px;
          height: 460px;
          flex-shrink: 0;
          overflow: visible;
        }
        .pc {
          position: absolute;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--border2);
          box-shadow: 0 20px 56px rgba(0,0,0,0.6);
        }
        .pc img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* main card: top-right area, stays within column */
        .pc-main { width: 310px; height: 270px; top: 10px; right: 0; left: auto; }

        /* bottom-left card */
        .pc-b1 {
          width: 200px; height: 175px;
          bottom: 10px; left: 0;
          animation: bob1 7s ease-in-out infinite;
        }
        /* mid overlap card */
        .pc-b2 {
          width: 170px; height: 150px;
          top: 200px; left: 110px;
          animation: bob2 9s ease-in-out infinite;
          z-index: 3;
        }

        @keyframes bob1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes bob2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }

        .score-chip {
          position: absolute;
          bottom: 12px; left: 12px;
          display: flex;
          align-items: center;
          gap: 9px;
          background: rgba(15,13,11,0.9);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border2);
          border-radius: 9px;
          padding: 9px 13px;
          z-index: 4;
        }
        .score-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #5a9e6f;
          box-shadow: 0 0 8px rgba(90,158,111,0.65);
          flex-shrink: 0;
        }
        .sc-lbl { font-size: 10px; font-weight: 600; color: #5a9e6f; letter-spacing: 0.07em; text-transform: uppercase; }
        .sc-val { font-size: 11.5px; color: var(--muted2); margin-top: 1px; }

        /* STRIP */
        .strip { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .strip-row { max-width: 1160px; margin: 0 auto; display: grid; grid-template-columns: repeat(3,1fr); }
        .strip-cell { position: relative; height: 260px; overflow: hidden; }
        .strip-cell:not(:last-child) { border-right: 1px solid var(--border); }
        .strip-cell img {
          width:100%; height:100%; object-fit:cover; display:block;
          filter: brightness(0.48) saturate(0.6);
          transition: filter 0.45s, transform 0.45s;
        }
        .strip-cell:hover img { filter: brightness(0.7) saturate(0.85); transform: scale(1.04); }
        .strip-tag {
          position: absolute; bottom: 18px; left: 20px;
          font-size: 10.5px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.55);
        }

        /* SHARED SECTION */
        .wrap  { max-width: 1160px; margin: 0 auto; padding: 0 28px; }
        .sec   { padding: 96px 0; }
        .sec-tag {
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.11em; text-transform: uppercase;
          color: var(--accent); margin-bottom: 14px;
        }
        .sec-h {
          font-family: var(--ff-serif);
          font-size: clamp(28px, 3.5vw, 46px);
          font-weight: 400;
          letter-spacing: -0.01em;
          line-height: 1.1;
          margin-bottom: 14px;
          color: var(--text);
        }
        .sec-sub {
          font-size: 15px; color: var(--muted2);
          line-height: 1.7; font-weight: 300; max-width: 460px;
        }

        /* FEATURES */
        .feat-grid {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 1px; margin-top: 56px;
          background: var(--border); border-radius: 14px; overflow: hidden;
        }
        .feat-cell {
          background: var(--surface); padding: 36px 32px;
          transition: background 0.25s;
        }
        .feat-cell:hover { background: var(--surface2); }
        .feat-ico {
          width: 42px; height: 42px; border-radius: 10px;
          border: 1px solid var(--border2);
          display: grid; place-items: center;
          color: var(--accent); margin-bottom: 28px;
        }
        .feat-n  { font-family: var(--ff-serif); font-size: 40px; font-weight: 400; color: var(--text); line-height: 1; margin-bottom: 4px; }
        .feat-nl { font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 22px; }
        .feat-t  { font-size: 16px; font-weight: 500; margin-bottom: 10px; color: var(--text); letter-spacing: -0.01em; }
        .feat-d  { font-size: 13.5px; color: var(--muted2); line-height: 1.65; font-weight: 300; }

        /* STEPS */
        .alt-bg { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .steps-grid {
          display: grid; grid-template-columns: repeat(4,1fr);
          gap: 1px; margin-top: 52px;
          background: var(--border); border-radius: 14px; overflow: hidden;
        }
        .step-cell { background: var(--surface); padding: 36px 26px; transition: background 0.25s; }
        .step-cell:hover { background: var(--surface2); }
        .step-nn { font-family: var(--ff-serif); font-size: 44px; font-weight: 400; color: rgba(255,235,200,0.05); line-height: 1; margin-bottom: 18px; }
        .step-ic { color: var(--accent); margin-bottom: 14px; }
        .step-t  { font-size: 15px; font-weight: 500; margin-bottom: 10px; letter-spacing: -0.01em; }
        .step-d  { font-size: 13px; color: var(--muted2); line-height: 1.6; font-weight: 300; }

        /* RISK */
        .risk-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-top: 48px; }
        .risk-cell { border-radius: 12px; padding: 28px 24px; border: 1px solid; transition: transform 0.2s; }
        .risk-cell:hover { transform: translateY(-3px); }
        .risk-lbl { font-size: 10.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
        .risk-rng { font-family: var(--ff-serif); font-size: 30px; font-weight: 400; margin-bottom: 12px; line-height: 1; }
        .risk-act { font-size: 12.5px; color: var(--muted2); line-height: 1.55; font-weight: 300; }

        /* CTA */
        .cta-wrap { position: relative; overflow: hidden; }
        .cta-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.12) saturate(0.4); }
        .cta-fade { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(15,13,11,0.94) 0%, rgba(201,147,58,0.07) 100%); }
        .cta-in { position: relative; max-width: 1160px; margin: 0 auto; padding: 110px 28px; text-align: center; }
        .cta-h {
          font-family: var(--ff-serif);
          font-size: clamp(32px, 4.5vw, 58px);
          font-weight: 400;
          letter-spacing: -0.01em;
          line-height: 1.1;
          margin-bottom: 18px;
        }
        .cta-h em { font-style: italic; color: var(--accent); }
        .cta-p {
          font-size: 15.5px; color: var(--muted2); font-weight: 300;
          max-width: 400px; margin: 0 auto 40px; line-height: 1.7;
        }
        .cta-btns { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
        .checks { display: flex; justify-content: center; gap: 28px; margin-top: 34px; flex-wrap: wrap; }
        .check-it { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--muted); }
        .check-it span { color: #5a9e6f; }

        /* FOOTER */
        .ftr { border-top: 1px solid var(--border); padding: 28px; }
        .ftr-in { max-width: 1160px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .ftr-copy { font-size: 12px; color: var(--muted); }

        /* RESPONSIVE */
        @media (max-width: 960px) {
          .hero-in { grid-template-columns: 1fr; gap: 48px; }
          .photo-stack { width: 100%; height: 320px; }
          .pc-main { width: 260px; height: 220px; top: 10px; right: 0; left: auto; }
          .pc-b1 { width: 155px; height: 135px; bottom: 10px; left: 0; }
          .pc-b2 { width: 140px; height: 120px; top: 160px; left: 90px; }
          .feat-grid { grid-template-columns: 1fr; }
          .steps-grid { grid-template-columns: 1fr 1fr; }
          .risk-row { grid-template-columns: 1fr 1fr; }
          .strip-row { grid-template-columns: 1fr; }
          .strip-cell:not(:last-child) { border-right: none; border-bottom: 1px solid var(--border); }
        }
        @media (max-width: 560px) {
          .steps-grid { grid-template-columns: 1fr; }
          .risk-row { grid-template-columns: 1fr; }
          .ftr-in { flex-direction: column; align-items: flex-start; }
          .nav .nav-link { display: none; }
        }
      `}</style>

      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

        {/* HEADER */}
        <header className="hdr">
          <div className="hdr-in">
            <a href="/" className="logo">
              <img src="/logo.png" alt="" style={{ height: 32, width: "auto", display: "block", flexShrink: 0 }} />
              <span>Dustinel AI</span>
            </a>
            <nav className="nav">
              <a href="#how-it-works" className="nav-link">How it works</a>
              <a href="#risk-levels" className="nav-link">Risk scoring</a>
              <a href={ROUTES.LOGIN} className="nav-link">Log in</a>
              <a href={ROUTES.LOGIN} className="btn btn-sm btn-solid" style={{ marginLeft: 8 }}>
                Get started
              </a>
            </nav>
          </div>
        </header>

        {/* HERO */}
        <section className="hero">
          <div className="hero-in">
            <div className="hero-left">
              <div className="eyebrow">
                <span className="live-dot" />
                Worker health monitoring, in real time
              </div>

              <h1 className="hero-h1">
                Keep your workers<br />
                <em>safe</em> — before<br />
                anything goes wrong
              </h1>

              <p className="hero-p">
                A single phone camera. Computer vision that spots missing PPE, fatigue,
                and site hazards. Alerts sent in under five seconds.
              </p>

              <div className="hero-ctas">
                <a href={ROUTES.LOGIN} className="btn btn-md btn-solid">
                  Worker check-in
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
                <a href={ROUTES.ADMIN_DASHBOARD} className="btn btn-md btn-border">
                  Admin dashboard
                </a>
              </div>

              <div className="hero-rule">
                {[
                  { n: "99.2%", l: "PPE detection" },
                  { n: "<5s",   l: "Alert delivery" },
                  { n: "10k+",  l: "Workers protected" },
                ].map(s => (
                  <div key={s.l}>
                    <div className="st-n">{s.n}</div>
                    <div className="st-l">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo collage — sits fully in its 440px column */}
            <div className="photo-stack">
              <div className="pc pc-main">
                <img src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=640&q=80" alt="Workers with safety helmets on site" />
              </div>
              <div className="pc pc-b1">
                <img src="https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=400&q=80" alt="Industrial safety environment" />
              </div>
              <div className="pc pc-b2">
                <img src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&q=80" alt="Worker in protective gear" />
              </div>
            </div>
          </div>
        </section>

        {/* IMAGE STRIP */}
        <div className="strip">
          <div className="strip-row">
            {[
              { src: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80", tag: "PPE detection" },
              { src: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80", tag: "Environment monitoring" },
              { src: "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=800&q=80", tag: "Real-time alerts" },
            ].map(i => (
              <div key={i.tag} className="strip-cell">
                <img src={i.src} alt={i.tag} />
                <div className="strip-tag">{i.tag}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <div className="wrap">
          <div className="sec">
            <div className="sec-tag">What it does</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:24 }}>
              <h2 className="sec-h" style={{ marginBottom:0 }}>
                Everything your<br />safety team needs
              </h2>
              <p className="sec-sub">
                Built on an enterprise AI stack — reliable, scalable, and privacy-compliant from the start.
              </p>
            </div>
            <div className="feat-grid">
              {features.map(f => {
                const Ico = f.icon;
                return (
                  <div key={f.title} className="feat-cell">
                    <div className="feat-ico"><Ico size={20} /></div>
                    <div className="feat-n">{f.stat}</div>
                    <div className="feat-nl">{f.statLabel}</div>
                    <div className="feat-t">{f.title}</div>
                    <p className="feat-d">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div id="how-it-works" className="alt-bg">
          <div className="wrap">
            <div className="sec">
              <div className="sec-tag">Process</div>
              <h2 className="sec-h">From photo to insight<br />in under 8 seconds</h2>
              <p className="sec-sub">No wearables, no hardware. Just the camera that's already in everyone's pocket.</p>
              <div className="steps-grid">
                {steps.map(s => {
                  const Ico = s.icon;
                  return (
                    <div key={s.num} className="step-cell">
                      <div className="step-nn">{s.num}</div>
                      <div className="step-ic"><Ico size={22} /></div>
                      <div className="step-t">{s.title}</div>
                      <p className="step-d">{s.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RISK LEVELS */}
        <div id="risk-levels">
          <div className="wrap">
            <div className="sec">
              <div className="sec-tag">Risk scoring</div>
              <h2 className="sec-h">Four-tier classification</h2>
              <p className="sec-sub">Every check-in produces a 0–100 health score mapped to one of four response tiers.</p>
              <div className="risk-row">
                {riskLevels.map(r => (
                  <div key={r.label} className="risk-cell"
                    style={{ background: r.bg, borderColor: r.border }}>
                    <div className="risk-lbl" style={{ color: r.color }}>{r.label}</div>
                    <div className="risk-rng" style={{ color: r.color }}>{r.range}</div>
                    <p className="risk-act">{r.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <section className="cta-wrap">
          <img className="cta-img" src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1600&q=80" alt="" />
          <div className="cta-fade" />
          <div className="cta-in">
            <h2 className="cta-h">
              Protect your people<br /><em>before</em> it's too late
            </h2>
            <p className="cta-p">
              Start a check-in in minutes. No hardware required — just a phone and a camera.
            </p>
            <div className="cta-btns">
              <a href={ROUTES.LOGIN} className="btn btn-md btn-solid">
                Start worker check-in
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
              <a href={ROUTES.ADMIN_DASHBOARD} className="btn btn-md btn-border">
                View dashboard →
              </a>
            </div>
            <div className="checks">
              {["No setup cost", "GDPR compliant", "Mobile-first", "Works offline"].map(t => (
                <div key={t} className="check-it">
                  <span>✓</span> {t}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="ftr">
          <div className="ftr-in">
            <a href="/" className="logo">
              <img src="/logo.png" alt="" style={{ height: 28, width: "auto", display: "block", flexShrink: 0 }} />
              <span>Dustinel AI</span>
            </a>
            <p className="ftr-copy">Protecting workers, powered by AI</p>
            <p className="ftr-copy">© 2025 Dustinel</p>
          </div>
        </footer>

      </div>
    </>
  );
}