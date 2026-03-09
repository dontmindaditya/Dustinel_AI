import { ROUTES } from "@/lib/landingData";

export function Header() {
  return (
    <header className="hdr">
      <div className="hdr-in">
        <a href="/" className="logo">
          <img src="/logo.png" alt="" style={{ height: 32, width: "auto", display: "block", flexShrink: 0 }} />
          <span>Dustinel AI</span>
        </a>
        <nav className="nav">
          <a href="#how-it-works" className="nav-link">How it works</a>
          <a href="#risk-levels"  className="nav-link">Risk scoring</a>
          <a href="#research"     className="nav-link">Research</a>
          <a href={ROUTES.LOGIN}  className="nav-link">Log in</a>
          <a href={ROUTES.LOGIN}  className="btn btn-sm btn-solid" style={{ marginLeft: 8 }}>
            Get started
          </a>
        </nav>
      </div>
    </header>
  );
}