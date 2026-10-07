import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Layout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = session?.user.role === "ADMIN";
  const links = isAdmin
    ? [
        ["Dashboard", "/dashboard"],
        ["All Policies", "/policies"],
        ["All Claims", "/claims"],
        ["Pending Claims", "/claims?status=PENDING"],
        ["Create Policy", "/admin/policies/new"]
        ,["Publish Product", "/admin/products/new"],
        ["Purchase Ledger", "/admin/purchases"]
      ]
    : [
        ["Dashboard", "/dashboard"],
        ["My Policies", "/policies"],
        ["Buy a Policy", "/policy-catalog"],
        ["Submit Claim", "/claims/new"],
        ["My Claims", "/claims"],
        ["Payment History", "/payments"],
        ["Notifications", "/notifications"],
        ["Blockchain Verification", "/verification"]
      ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><span>◆</span> InsureChain</div>
        <p className="sidebar-label">{isAdmin ? "Operations" : "Policyholder portal"}</p>
        <nav className="side-nav">
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span>{label === "Dashboard" ? "⌂" : label === "Submit Claim" ? "+" : "◈"}</span>{label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/profile" className="nav-item"><span>◎</span>Profile</NavLink>
          <button className="nav-item signout" onClick={() => { logout(); navigate("/login"); }}><span>↪</span>Sign out</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">SECURE CLAIM MANAGEMENT</p>
            <h1>{isAdmin ? "Operations workspace" : `Welcome back, ${session?.user.name?.split(" ")[0]}`}</h1>
          </div>
          <div className="user-pill"><span className="avatar">{session?.user.name?.[0]}</span><span>{session?.user.name}</span><small>{session?.user.role}</small></div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
