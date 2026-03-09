import { Cpu, Bell, BarChart3, Eye } from "lucide-react";

export const ROUTES = {
  LOGIN:           "/auth/login",
  ADMIN_DASHBOARD: "/admin/dashboard",
};

export const features = [
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
    stat: "Beta",
    statLabel: "In development",
  },
];

export const steps = [
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

export const riskLevels = [
  {
    label: "LOW",
    range: "80–100",
    color: "#5a9e6f",
    bg: "rgba(90,158,111,0.1)",
    border: "rgba(90,158,111,0.25)",
    action: "No alert. Logged to the safety dashboard.",
  },
  {
    label: "MEDIUM",
    range: "60–79",
    color: "#c9933a",
    bg: "rgba(201,147,58,0.1)",
    border: "rgba(201,147,58,0.25)",
    action: "In-app notification sent to the worker.",
  },
  {
    label: "HIGH",
    range: "40–59",
    color: "#c96b3a",
    bg: "rgba(201,107,58,0.1)",
    border: "rgba(201,107,58,0.25)",
    action: "Push alert to worker + email to supervisor.",
  },
  {
    label: "CRITICAL",
    range: "0–39",
    color: "#b84040",
    bg: "rgba(184,64,64,0.1)",
    border: "rgba(184,64,64,0.25)",
    action: "Immediate push + SMS + site access restriction.",
  },
];

export const papers = [
  {
    num: "01",
    title: "Fatigue Monitoring Using Wearables and AI",
    subtitle: "Trends, Challenges, and Future Opportunities",
    authors: "Kakhi, Jagatheesaperumal, Khosravi et al.",
    venue: "arXiv (cs.HC) · Submitted to Elsevier",
    date: "December 2024",
    usedIn: "Multi-modal fatigue scoring engine",
    usedInDetail:
      "Multi-modal fusion — combining shift schedule, health trend, chronic conditions, and visual signals into a single weighted fatigue score inside ml.service.ts.",
    tag: "FATIGUE DETECTION",
    tagColor: "#7a9ec9",
    tagBg: "rgba(122,158,201,0.12)",
    tagBorder: "rgba(122,158,201,0.25)",
    links: [
      { label: "Read Paper", icon: "read",   href: "https://arxiv.org/abs/2412.16847" },
      { label: "PDF",        icon: "pdf",    href: "https://arxiv.org/pdf/2412.16847" },
      { label: "PubMed",     icon: "pubmed", href: "https://pubmed.ncbi.nlm.nih.gov/40580618/" },
    ],
  },
  {
    num: "02",
    title: "SH17: A Dataset for Human Safety and PPE Detection",
    subtitle: "In Manufacturing Industry",
    authors: "Ahmad & Rahimi · University of Windsor",
    venue: "Journal of Safety Science and Resilience · KeAi / Elsevier",
    date: "July 2024",
    usedIn: "Hybrid vision provider architecture",
    usedInDetail:
      "Exposed the gap in general-purpose vision models. We built a pluggable hybrid vision architecture (VISION_PROVIDER=hybrid) ready for domain-specific industrial deployment.",
    tag: "PPE DETECTION",
    tagColor: "#9ec97a",
    tagBg: "rgba(158,201,122,0.12)",
    tagBorder: "rgba(158,201,122,0.25)",
    links: [
      { label: "Read Paper", icon: "read",    href: "https://arxiv.org/abs/2407.04590" },
      { label: "PDF",        icon: "pdf",     href: "https://arxiv.org/pdf/2407.04590" },
      { label: "Journal",    icon: "journal", href: "https://www.sciencedirect.com/science/article/pii/S266644962400077X" },
      { label: "Dataset",    icon: "dataset", href: "https://github.com/ahmadmughees/SH17dataset" },
    ],
  },
  {
    num: "03",
    title: "Occupational Risk Prediction for Miners",
    subtitle: "Based on Stacking Health Data Fusion",
    authors: "Zhang, Yang, Yang, Huang et al.",
    venue: "Applied Sciences · MDPI · Vol. 15, Issue 6",
    date: "March 2025",
    usedIn: "Stacking ensemble risk scorer",
    usedInDetail:
      "Directly implemented as computeStackedScore() — 6 weak classifiers combined by a weighted meta-learner. Every check-in response includes scoringMethod: \"stacking-ensemble-v1.0\".",
    tag: "RISK SCORING",
    tagColor: "#c9933a",
    tagBg: "rgba(201,147,58,0.12)",
    tagBorder: "rgba(201,147,58,0.25)",
    links: [
      { label: "Read Paper", icon: "read", href: "https://www.mdpi.com/2076-3417/15/6/3129" },
      { label: "PDF",        icon: "pdf",  href: "https://www.mdpi.com/2076-3417/15/6/3129/pdf" },
    ],
  },
  {
    num: "04",
    title: "Deep Learning for Visible Dust Detection",
    subtitle: "Prevention Measures on Construction Sites",
    authors: "Developments in the Built Environment",
    venue: "Developments in the Built Environment · Elsevier",
    date: "October 2023",
    usedIn: "Image clarity dust escalation heuristic",
    usedInDetail:
      "Image clarity degrades in dusty environments — using Azure Vision's caption confidence as a clarity proxy. When confidence drops below threshold, analyzeEnvironmentImage() escalates the dustLevel automatically.",
    tag: "ENVIRONMENT",
    tagColor: "#c97a9e",
    tagBg: "rgba(201,122,158,0.12)",
    tagBorder: "rgba(201,122,158,0.25)",
    links: [
      { label: "Read Paper", icon: "read", href: "https://www.sciencedirect.com/science/article/pii/S2666165923001278" },
    ],
  },
];

// ─── Framer Motion variants ───────────────────────────────────────────────────

export const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const stagger = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

export const sectionViewport = { once: true, amount: 0.2 };