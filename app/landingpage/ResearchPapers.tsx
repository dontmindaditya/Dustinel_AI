import { motion } from "framer-motion";
import { FileText, Download, Database, ExternalLink } from "lucide-react";
import { papers, fadeUp, stagger, sectionViewport } from "@/lib/landingData";

export function ResearchPapers() {
  return (
    <div id="research" className="research-bg">
      <div className="wrap">
        <div className="sec">
          {/* Header */}
          <div className="research-header">
            <div>
              <div className="sec-tag">Research foundation</div>
              <h2 className="sec-h" style={{ marginBottom: 10 }}>
                Built on peer-reviewed<br />science
              </h2>
              <p className="sec-sub">
                Every module in Dustinel is grounded in published research.
                Four papers. Four systems. All production.
              </p>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 18px",
              border: "1px solid var(--border2)",
              borderRadius: 10,
              background: "var(--bg)",
              flexShrink: 0,
              alignSelf: "flex-end",
            }}>
              <FileText size={14} color="var(--accent)" />
              <span style={{ fontSize: 12, color: "var(--muted2)", fontWeight: 300 }}>
                4 papers · 3 journals · 2024–2025
              </span>
            </div>
          </div>

          {/* Papers grid */}
          <motion.div
            className="papers-grid"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={sectionViewport}
          >
            {papers.map(p => (
              <motion.div key={p.num} className="paper-card" variants={fadeUp} transition={{ duration: 0.48 }}>
                <div className="paper-top">
                  <div className="paper-num">{p.num}</div>
                  <div className="paper-tag" style={{ color: p.tagColor, background: p.tagBg, borderColor: p.tagBorder }}>
                    {p.tag}
                  </div>
                </div>

                <div className="paper-title">{p.title}</div>
                <div className="paper-subtitle">{p.subtitle}</div>

                <div className="paper-meta">
                  <div className="paper-authors">{p.authors}</div>
                  <div className="paper-venue">{p.venue}</div>
                  <div className="paper-date">{p.date}</div>
                </div>

                <div className="paper-divider" />

                <div className="paper-used-label">Used in Dustinel</div>
                <div className="paper-used-in">{p.usedIn}</div>
                <p className="paper-used-detail">{p.usedInDetail}</p>

                <div className="paper-links">
                  {p.links.map(l => (
                    <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="paper-link">
                      {l.icon === "pdf"     && <Download    size={11} />}
                      {l.icon === "dataset" && <Database    size={11} />}
                      {(l.icon === "read" || l.icon === "journal" || l.icon === "pubmed") && <ExternalLink size={11} />}
                      {l.label}
                    </a>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Footer note */}
          <div className="research-note">
            <div className="research-note-icon">
              <FileText size={15} />
            </div>
            <p className="research-note-text">
              <strong>Open access commitment.</strong> All four papers are published under open access licenses (CC BY 4.0, CC BY-NC-SA 4.0, or MDPI Open Access).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}