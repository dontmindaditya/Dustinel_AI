import { motion } from "framer-motion";
import { ROUTES, fadeUp, stagger } from "@/lib/landingData";

export function Hero() {
  return (
    <section className="hero">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="hero-video-bg"
        src="/assets/main.mp4"
      />
      <div className="hero-overlay" />
      <div className="hero-in">
        <motion.div className="hero-left" initial="hidden" animate="visible" variants={stagger}>
          <motion.div className="eyebrow" variants={fadeUp} transition={{ duration: 0.45 }}>
            <span className="live-dot" />
            Worker health monitoring, in real time
          </motion.div>

          <motion.h1 className="hero-h1" variants={fadeUp} transition={{ duration: 0.55, delay: 0.05 }}>
            Keep your workers<br />
            <em>safe</em> — before<br />
            anything goes wrong
          </motion.h1>

          <motion.p className="hero-p" variants={fadeUp} transition={{ duration: 0.55, delay: 0.1 }}>
            A single phone camera. Computer vision that spots missing PPE, fatigue,
            and site hazards. Alerts sent in under five seconds.
          </motion.p>

          <motion.div className="hero-ctas" variants={fadeUp} transition={{ duration: 0.5, delay: 0.16 }}>
            <a href={ROUTES.WORKER_LOGIN} className="btn btn-md btn-solid">
              Worker check-in
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <a href={ROUTES.ADMIN_LOGIN} className="btn btn-md btn-border">
              Admin login
            </a>
          </motion.div>

          <motion.div className="hero-rule" variants={fadeUp} transition={{ duration: 0.55, delay: 0.2 }}>
            {[
              { n: "99.2%", l: "PPE detection" },
              { n: "<5s",   l: "Alert delivery" },
              { n: "Beta",  l: "In development" },
            ].map(s => (
              <div key={s.l}>
                <div className="st-n">{s.n}</div>
                <div className="st-l">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
