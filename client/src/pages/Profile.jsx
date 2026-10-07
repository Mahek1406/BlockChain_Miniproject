import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
  const { session } = useAuth();
  return <section><div className="page-intro"><div><p className="eyebrow accent">ACCOUNT</p><h2>Your profile.</h2></div></div><div className="panel profile-card"><div className="profile-avatar">{session.user.name[0]}</div><h3>{session.user.name}</h3><p className="muted">{session.user.email}</p><hr /><div className="profile-info"><span>Account role<strong>{session.user.role}</strong></span><span>Security<strong>JWT authenticated</strong></span><span>Data protection<strong>Blockchain enabled</strong></span></div></div></section>;
}
