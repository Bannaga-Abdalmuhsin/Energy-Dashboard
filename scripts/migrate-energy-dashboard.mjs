import { createHash } from "node:crypto";

const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
const configuredSheetUrl = String(process.env.ENERGY_DASHBOARD_CSV_URL || "https://docs.google.com/spreadsheets/d/e/2PACX-1vS0GkXnQMdKYZITuuMsAzeWDtGUqEJ3lWwqNdA67NewOsDOgqsZHKHECEEkea4nrukx4-DqxKmf62nC/pub?gid=1149576218&single=true&output=csv");
const dryRun = process.argv.includes("--dry-run");
if (!supabaseUrl && !dryRun) throw new Error("Missing SUPABASE_URL or VITE_SUPABASE_URL.");
if (!serviceRoleKey && !dryRun) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");

function parseCsv(text) {
  const rows=[]; let row=[]; let value=""; let quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'){
      if(quoted&&text[i+1]==='"'){value+='"';i++;} else quoted=!quoted;
    } else if(ch===','&&!quoted){row.push(value);value="";}
    else if((ch==='\n'||ch==='\r')&&!quoted){
      if(ch==='\r'&&text[i+1]==='\n')i++;
      row.push(value); if(row.some(v=>v!==""))rows.push(row); row=[];value="";
    } else value+=ch;
  }
  if(value||row.length){row.push(value);rows.push(row);}
  const headers=rows.shift()?.map(v=>v.trim())||[];
  return rows.map(cells=>Object.fromEntries(headers.map((h,i)=>[h,cells[i]??""])));
}

function normalizeSheetUrl(input) {
  const url = new URL(input);
  const gid = url.searchParams.get("gid") || "1149576218";
  const standard = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (standard && !url.pathname.includes("/d/e/")) {
    return `https://docs.google.com/spreadsheets/d/${standard[1]}/export?format=csv&gid=${encodeURIComponent(gid)}`;
  }
  const published = url.pathname.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (published) {
    return `https://docs.google.com/spreadsheets/d/e/${published[1]}/pub?output=csv&single=true&gid=${encodeURIComponent(gid)}`;
  }
  return input;
}
const clean=v=>{const s=String(v??"").trim();return !s||s==="#N/A"||s==="#VALUE!"||s==="Not Found"?null:s;};
const num=v=>{const s=clean(v);if(s===null)return null;const n=Number(String(s).replace(/,/g,"").replace(/\s*(LTR|L)\s*$/i,""));return Number.isFinite(n)?n:null;};
const pct=v=>{const s=clean(v);if(s===null)return null;const hasPct=String(s).includes("%");const n=Number(String(s).replace(/[% ,]/g,""));if(!Number.isFinite(n))return null;return hasPct?n:(Math.abs(n)<=1?n*100:n);};
const date=v=>{const s=clean(v);if(s===null)return null;const d=new Date(s);return Number.isNaN(d.getTime())?null:d.toISOString();};
const value=(row,...names)=>{for(const n of names)if(Object.hasOwn(row,n))return row[n];return "";};

function normalize(row, sourceRow) {
  const site=clean(value(row,"Site"))?.toUpperCase();
  if(!site)return null;
  const raw_payload=row;
  return {
    site, source_row:sourceRow, source_index:num(value(row,"#")), vendor:clean(value(row,"Vendor")),
    area:clean(value(row,"Area")), district_name:clean(value(row,"districtName")), city_name:clean(value(row,"cityName")),
    power_source:clean(value(row,"PowerSource")), generator_capacity:clean(value(row,"GeneratorCapacity")), technology:clean(value(row,"Technology")),
    cow_status:clean(value(row,"COWStatus")), total_on_air_days:num(value(row,"TotalOn-airDays")), latitude:num(value(row,"lat")), longitude:num(value(row,"lng")),
    start_time:date(value(row,"StartTime")), source_as_of:date(value(row,"asOf")), span_days:num(value(row,"Span")), tank_capacity_l:num(value(row,"Tank Capacity")),
    power_demand_kw:num(value(row,"powerDemandKw")), average_diesel_liters_per_day:num(value(row,"AverageDieselLitersPerDay")), average_kw:num(value(row,"AverageKW")),
    co2_tons_per_day:num(value(row,"co2Tons")), current_average_liters_per_day:num(value(row,"CurrentAverageLiterPerDay")), current_average_kw:num(value(row,"CurrentAverageKW")),
    current_co2_tons:num(value(row,"CurrentCO2Tons")), fuel_tank_level_pct:pct(value(row,"fuelTankLevelPct")), generator_load_factor_pct:pct(value(row,"generatorLoadFactorPct")),
    accumulated_power_consumption:num(value(row,"AccumPowerConsumption")), accumulated_fuel_consumption:num(value(row,"AccumFuelConsumption")),
    accumulated_co2_emissions:num(value(row,"AccumCO2Emissions")), fuel_consumption:num(value(row,"Fuel Consumption")), last_fueling_date:date(value(row,"LastFuelingDate")),
    last_fueling_qty:num(value(row,"LastFuelingQTY")), before_qty:num(value(row,"Before QTY")), total_qty:num(value(row,"Total QTY")),
    fueling_span_days:num(value(row,"Span 2")), next_fueling_plan:clean(value(row,"NextFuelingPlan")), site_label:clean(value(row,"SiteLabel")),
    raw_payload, source_hash:createHash("sha256").update(JSON.stringify(raw_payload)).digest("hex"), imported_at:new Date().toISOString(),
  };
}

const sheetUrl=normalizeSheetUrl(configuredSheetUrl);
const response=await fetch(sheetUrl);
if(!response.ok)throw new Error(`Google Sheet download failed: ${response.status}`);
const csv=await response.text();
const sourceRows=parseCsv(csv);
const sourceHeaders=Object.keys(sourceRows[0]||{});
if(!sourceHeaders.includes("Site"))throw new Error(`The downloaded file is not the Energy Dashboard CSV. Headers received: ${sourceHeaders.slice(0,8).join(", ")||"none"}`);
const records=sourceRows.map((row,i)=>normalize(row,i+2)).filter(Boolean);
const unique=new Map(); for(const record of records)unique.set(record.site,record);
if(records.length===0)throw new Error("No Energy Dashboard site rows were found; migration stopped without changing Supabase.");
if(unique.size!==records.length)throw new Error(`Duplicate Site IDs found: ${records.length-unique.size}`);
console.log(`Validated ${records.length} rows and ${unique.size} unique sites.`);
if(dryRun)process.exit(0);

const headers={apikey:serviceRoleKey,Authorization:`Bearer ${serviceRoleKey}`,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"};
const items=[...unique.values()];
for(let i=0;i<items.length;i+=100){
  const batch=items.slice(i,i+100);
  const upload=await fetch(`${supabaseUrl}/rest/v1/energy_dashboard?on_conflict=site`,{method:"POST",headers,body:JSON.stringify(batch)});
  if(!upload.ok)throw new Error(`Supabase upsert failed (${upload.status}): ${await upload.text()}`);
  console.log(`Upserted ${Math.min(i+batch.length,items.length)}/${items.length}`);
}
const countResponse=await fetch(`${supabaseUrl}/rest/v1/energy_dashboard?select=site`,{headers:{apikey:serviceRoleKey,Authorization:`Bearer ${serviceRoleKey}`,Prefer:"count=exact"}});
if(!countResponse.ok)throw new Error(`Reconciliation query failed: ${await countResponse.text()}`);
const contentRange=countResponse.headers.get("content-range")||"";
const targetCount=Number(contentRange.split("/")[1]);
if(Number.isFinite(targetCount)&&targetCount<items.length)throw new Error(`Reconciliation failed: source ${items.length}, target ${targetCount}`);
console.log(`Migration complete. Source rows: ${items.length}; Supabase rows: ${targetCount}.`);
