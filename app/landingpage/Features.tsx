import { motion } from "framer-motion";
import { features, fadeUp, stagger, sectionViewport } from "@/lib/landingData";

export function Features() {
  return (
    <div className="wrap">
      <div className="sec">
        <div className="sec-tag">What it does</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
          <h2 className="sec-h" style={{ marginBottom: 0 }}>
            Everything your<br />safety team needs
          </h2>
          <p className="sec-sub">
            Built on an enterprise AI stack — reliable, scalable, and privacy-compliant from the start.
          </p>
        </div>

        <motion.div
          className="feat-grid"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
        >
          {features.map(f => {
            const Ico = f.icon;
            return (
              <motion.div key={f.title} className="feat-cell" variants={fadeUp} transition={{ duration: 0.45 }}>
                <div className="feat-ico"><Ico size={20} /></div>
                <div className="feat-n">{f.stat}</div>
                <div className="feat-nl">{f.statLabel}</div>
                <div className="feat-t">{f.title}</div>
                <p className="feat-d">{f.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
