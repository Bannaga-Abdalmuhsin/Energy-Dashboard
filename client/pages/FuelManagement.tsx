import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, Fuel, RefreshCw } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { fetchFuelPlan, FuelRegion, inFuelRegion } from "@/lib/fuel-plan";

const regions: FuelRegion[] = ["CER", "West", "South", "North"];
const dateText = (date?: Date) => date ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date) : "—";

export default function FuelManagement() {
  const [region, setRegion] = useState<FuelRegion>("CER");
  const query = useQuery({ queryKey: ["fuel-plan"], queryFn: fetchFuelPlan, refetchInterval: 600000 });
  const sites = useMemo(() => (query.data?.sites || []).filter(site => inFuelRegion(site, region)).sort((a, b) => a.daysUntil - b.daysUntil), [query.data, region]);
  const overdue = sites.filter(site => site.timing === "overdue").length;
  const today = sites.filter(site => site.timing === "today").length;
  const upcoming = sites.filter(site => site.daysUntil > 0 && site.daysUntil <= 15).length;

  return <Layout title="Fuel Management" description="Live fueling schedule from the CER fuel plan">
    <section className="fuel-toolbar">
      <div className="fuel-regions" aria-label="Fuel plan region">{regions.map(item => <button className={region === item ? "active" : ""} onClick={() => setRegion(item)} key={item}>{item}</button>)}</div>
      <div className="fuel-source"><span className="live-dot"/> {query.data?.source || "Loading source"}<button aria-label="Refresh fuel data" onClick={() => query.refetch()}><RefreshCw size={15}/></button></div>
    </section>
    {query.isError ? <div className="fuel-error"><AlertTriangle size={18}/> Fuel data could not be loaded. Check the sheet sharing settings and try again.</div> : <>
      <section className="fuel-kpis">
        <article><Fuel/><div><strong>{query.isLoading ? "—" : sites.length}</strong><span>Fueling sites</span></div></article>
        <article className="danger"><AlertTriangle/><div><strong>{query.isLoading ? "—" : overdue}</strong><span>Overdue</span></div></article>
        <article className="warning"><CalendarClock/><div><strong>{query.isLoading ? "—" : today}</strong><span>Due today</span></div></article>
        <article><CalendarClock/><div><strong>{query.isLoading ? "—" : upcoming}</strong><span>Next 15 days</span></div></article>
      </section>
      <section className="fuel-table-card">
        <div className="fuel-table-head"><div><h2>{region} fueling plan</h2><p>{sites.length} operational sites with valid coordinates and fueling dates</p></div><span>Auto-refreshes every 10 minutes</span></div>
        <div className="fuel-table-wrap"><table className="fuel-table"><thead><tr><th>Site</th><th>Location</th><th>Next fueling</th><th>Schedule</th><th>Last fueling</th><th>Quantity</th></tr></thead><tbody>
          {sites.map(site => <tr key={`${site.site}-${site.nextFuelingPlan.toISOString()}`}><td><strong>{site.site}</strong><small>{site.label || site.status}</small></td><td>{[site.city, site.district].filter(Boolean).join(", ") || site.region}</td><td>{dateText(site.nextFuelingPlan)}</td><td><span className={`fuel-badge ${site.timing}`}>{site.daysUntil < 0 ? `${Math.abs(site.daysUntil)}d overdue` : site.daysUntil === 0 ? "Today" : `In ${site.daysUntil}d`}</span></td><td>{dateText(site.lastFuelingDate)}</td><td>{site.lastFuelingQuantity === undefined ? "—" : `${site.lastFuelingQuantity.toLocaleString()} L`}</td></tr>)}
          {!query.isLoading && !sites.length && <tr><td colSpan={6} className="fuel-empty">No valid fueling records for this region.</td></tr>}
        </tbody></table></div>
      </section>
    </>}
  </Layout>;
}
