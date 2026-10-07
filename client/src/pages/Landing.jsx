import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav"><div className="brand-mark"><span>◆</span> InsureChain</div><div className="landing-actions"><Link to="/login?role=POLICYHOLDER" className="btn btn-outline-light">Policyholder login</Link><Link to="/login?role=ADMIN" className="btn btn-primary">Admin login</Link></div></nav>
      <div className="hero">
        <div className="hero-copy"><p className="eyebrow accent">A CLEARER CLAIMS EXPERIENCE</p><h1>Insurance claims,<br /><em>with a paper trail.</em></h1><p className="hero-text">Buy Indian insurance products, submit claims, and verify every important step from one calm, secure workspace.</p><div className="hero-actions"><Link to="/register" className="btn btn-primary btn-lg">Create policyholder account <span>→</span></Link><Link to="/login?role=ADMIN" className="text-link">Admin workspace →</Link></div></div>
        <div className="hero-visual"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="shield">◆<small>SECURE</small></div><div className="floating-card card-one">✓ <span>Claim verified<br /><b>Blockchain confirmed</b></span></div><div className="floating-card card-two">⛓ <span>Immutable record<br /><b>Hash protected</b></span></div></div>
      </div>
      <div className="landing-stats"><span><b>100%</b> traceable actions</span><span><b>INR</b> Indian policy marketplace</span><span><b>24/7</b> record access</span></div>
    </div>
  );
}
