"use client";

export function ImageStrip() {
  return (
    <div className="why-section">
      <div className="why-container">
        <div className="why-content">
          <h2 className="why-title">
            Why Dustinel AI?
          </h2>

          <p className="why-stat">
            Every <span className="highlight">15 seconds</span>, a worker somewhere in the world dies because of unsafe working conditions.
          </p>

          <p className="why-stat">
            More than <span className="highlight">2.9 million workers</span> lose their lives every year, and <span className="highlight">hundreds of millions</span> suffer injuries that could often be prevented.
          </p>

          <p className="why-stat">
            Most safety systems react <span className="highlight-accent">after accidents happen</span>.
          </p>

          <p className="why-mission">
            <span className="highlight-accent">Dustinel AI exists to prevent them before they do.</span>
          </p>

          <p className="why-desc">
            By using AI to analyze workers and their environments in real time, Dustinel AI detects risks early — helping organizations protect their people and ensure workers return home safely every day.
          </p>
        </div>

        <div className="why-images">
          <img src="/assets/worker.png" alt="Worker" className="why-img" />
          <img src="/assets/damage.png" alt="Damage" className="why-img" />
        </div>
      </div>
    </div>
  );
}
