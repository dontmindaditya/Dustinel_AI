export function Footer() {
  return (
    <footer className="ftr">
      <div className="ftr-in">
        <a href="/" className="logo">
          <img src="/logo.png" alt="" style={{ height: 28, width: "auto", display: "block", flexShrink: 0 }} />
          <span>Dustinel AI</span>
        </a>
        <p className="ftr-copy">Protecting workers, powered by AI</p>
        <p className="ftr-copy">© 2026 Dustinel</p>
      </div>
    </footer>
  );
}