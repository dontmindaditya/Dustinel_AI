"use client"
const STRIP_IMAGES = [
  { src: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80", tag: "PPE detection" },
  { src: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80", tag: "Environment monitoring" },
  { src: "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=800&q=80", tag: "Real-time alerts" },
];

export function ImageStrip() {
  return (
    <div className="strip">
      <div className="strip-row">
        {STRIP_IMAGES.map(i => (
          <div key={i.tag} className="strip-cell">
            <img src={i.src} alt={i.tag} />
            <div className="strip-tag">{i.tag}</div>
          </div>
        ))}
      </div>
    </div>
  );
}