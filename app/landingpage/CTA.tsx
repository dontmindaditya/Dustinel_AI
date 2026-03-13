import { motion } from "framer-motion";
import { ROUTES, fadeUp, stagger, sectionViewport } from "@/lib/landingData";

export function CTA() {
  return (
    <section className="cta-wrap">
      <img
        className="cta-img"
        src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1600&q=80"
        alt=""
      />
      <div className="cta-fade" />
      <motion.div
        className="cta-in"
        initial="hidden"
        whileInView="visible"
        viewport={sectionViewport}
        variants={stagger}
      >
        <motion.h2 className="cta-h" variants={fadeUp} transition={{ duration: 0.5 }}>
          Protect your people<br /><em>before</em> it&apos;s too late
        </motion.h2>
        <motion.p className="cta-p" variants={fadeUp} transition={{ duration: 0.5 }}>
          Start a check-in in minutes. No hardware required, just a phone and a camera.
        </motion.p>
        <motion.div className="cta-btns" variants={fadeUp} transition={{ duration: 0.45 }}>
          <a href={ROUTES.WORKER_LOGIN} className="btn btn-md btn-solid">
            Start worker check-in
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
          <a href={ROUTES.ADMIN_LOGIN} className="btn btn-md btn-border">
            Admin login
          </a>
        </motion.div>
        <motion.div className="checks" variants={fadeUp} transition={{ duration: 0.45 }}>
          {["No setup cost", "GDPR compliant", "Mobile-first", "Works offline"].map((t) => (
            <div key={t} className="check-it">
              <span>+</span> {t}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
