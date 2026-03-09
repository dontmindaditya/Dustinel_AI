import { motion } from "framer-motion";
import { steps, fadeUp, stagger, sectionViewport } from "@/lib/landingData";

export function HowItWorks() {
  return (
    <div id="how-it-works" className="alt-bg">
      <div className="wrap">
        <div className="sec">
          <div className="sec-tag">Process</div>
          <h2 className="sec-h">From photo to insight<br />in under 8 seconds</h2>
          <p className="sec-sub">No wearables, no hardware. Just the camera that's already in everyone's pocket.</p>

          <motion.div
            className="steps-grid"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={sectionViewport}
          >
            {steps.map(s => {
              const Ico = s.icon;
              return (
                <motion.div key={s.num} className="step-cell" variants={fadeUp} transition={{ duration: 0.45 }}>
                  <div className="step-nn">{s.num}</div>
                  <div className="step-ic"><Ico size={22} /></div>
                  <div className="step-t">{s.title}</div>
                  <p className="step-d">{s.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}