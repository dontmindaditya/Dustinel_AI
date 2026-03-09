import { motion } from "framer-motion";
import { ROUTES, fadeUp, stagger } from "@/lib/landingData";

export function Hero() {
  return (
    <section className="hero">
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

        <motion.div
          className="photo-stack"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: "easeOut", delay: 0.12 }}
        >
          <div className="pc pc-main">
            <img src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=640&q=80" alt="Workers with safety helmets on site" />
          </div>
          <div className="pc pc-b1">
            <img src="https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=400&q=80" alt="Industrial safety environment" />
          </div>
          <div className="pc pc-b2">
            <img src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&q=80" alt="Worker in protective gear" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}