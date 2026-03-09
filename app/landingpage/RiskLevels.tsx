import { motion } from "framer-motion";
import { riskLevels, fadeUp, stagger, sectionViewport } from "@/lib/landingData";

export function RiskLevels() {
  return (
    <div id="risk-levels">
      <div className="wrap">
        <div className="sec">
          <div className="sec-tag">Risk scoring</div>
          <h2 className="sec-h">Four-tier classification</h2>
          <p className="sec-sub">Every check-in produces a 0–100 health score mapped to one of four response tiers.</p>

          <motion.div
            className="risk-row"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={sectionViewport}
          >
            {riskLevels.map(r => (
              <motion.div
                key={r.label}
                className="risk-cell"
                variants={fadeUp}
                transition={{ duration: 0.42 }}
                style={{ background: r.bg, borderColor: r.border }}
              >
                <div className="risk-lbl" style={{ color: r.color }}>{r.label}</div>
                <div className="risk-rng" style={{ color: r.color }}>{r.range}</div>
                <p className="risk-act">{r.action}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
