import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function AuthPage({ register = false }) {
  const { login, register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", password: "", accountType: searchParams.get("role") === "ADMIN" ? "ADMIN" : "POLICYHOLDER" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError("");
    if (register && form.name.trim().length < 2) return setError("Enter your full name (at least 2 characters).");
    if (!form.email.trim()) return setError("Email address is required.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    try { register ? await createAccount(form) : await login({ email: form.email, password: form.password, accountType: form.accountType }); navigate("/dashboard"); }
    catch (err) { setError(err.response?.data?.message || "Unable to complete request"); }
    finally { setBusy(false); }
  }
  return <div className="auth-page"><div className="auth-panel"><Link to="/" className="brand-mark"><span>◆</span> InsureChain</Link><div className="auth-content"><p className="eyebrow accent">{register ? "JOIN INSURECHAIN" : "SECURE SIGN IN"}</p><h1>{register ? "Create your account." : "Welcome back."}</h1><p className="muted">{register ? "Keep your coverage and claim history in one place." : "Access your secure claim workspace."}</p>{error && <div className="alert alert-danger">{error}</div>}<form onSubmit={submit}>{!register && <fieldset className="role-picker"><legend>Sign in as</legend><div className="choice-buttons"><button type="button" className={form.accountType === "POLICYHOLDER" ? "choice-button active" : "choice-button"} onClick={() => setForm({ ...form, accountType: "POLICYHOLDER" })}>Policyholder</button><button type="button" className={form.accountType === "ADMIN" ? "choice-button active" : "choice-button"} onClick={() => setForm({ ...form, accountType: "ADMIN" })}>Administrator</button></div><small>{form.accountType === "ADMIN" ? "Use the administrator credentials configured in server/.env." : "Use your registered policyholder account."}</small></fieldset>}{register && <label>Full name<input required minLength="2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>}<label>Email address<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label><label>Password<input type="password" required minLength="8" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label><button disabled={busy} className="btn btn-primary w-100">{busy ? "Please wait..." : register ? "Create account" : form.accountType === "ADMIN" ? "Admin sign in" : "Sign in"} <span>→</span></button></form><p className="auth-switch">{register ? "Already have an account?" : "New to InsureChain?"} <Link to={register ? "/login" : "/register"}>{register ? "Sign in" : "Create an account"}</Link></p></div></div><div className="auth-art"><div className="auth-quote">“<br /><span>Good records make<br /><em>good decisions.</em></span></div><div className="auth-chain">YOUR CLAIM HISTORY<br /><b>● — ● — ● — ●</b><br />PRIVATE &amp; TRACEABLE</div></div></div>;
}
