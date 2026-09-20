import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
export default function Header({ onMenu }: { onMenu?: () => void }) {
  const { user, logout } = useAuth(); const [open, setOpen] = useState(false);
  return <header className="app-header"><button className="mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu/></button><div className="page-heading"><span>Operations center</span><strong>Energy &amp; Sustainability</strong></div><div className="header-actions"><label className="global-search"><Search/><input placeholder="Search site ID or city"/></label><button className="icon-button" aria-label="Notifications"><Bell/><i/></button><div className="profile-wrap"><button className="profile-button" onClick={()=>setOpen(!open)}><span className="avatar">{user?.name?.slice(0,2).toUpperCase() || "OP"}</span><span><strong>{user?.name || "Operator"}</strong><small>{user?.role || "viewer"}</small></span><ChevronDown/></button>{open && <div className="profile-menu"><button onClick={logout}>Sign out</button></div>}</div></div></header>;
}
