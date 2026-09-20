import "./global.css";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Login from "@/pages/Login"; import Overview from "@/pages/Overview"; import ModulePage from "@/pages/ModulePage"; import Reports from "@/pages/Reports"; import NotFound from "@/pages/NotFound";
const queryClient=new QueryClient();
function Protected({children}:{children:React.ReactNode}){const{user}=useAuth();const location=useLocation();return user?children:<Navigate to="/login" replace state={{from:location.pathname}}/>}
const guard=(node:React.ReactNode)=><Protected>{node}</Protected>;
function App(){return <QueryClientProvider client={queryClient}><AuthProvider><HashRouter><Sonner/><Routes><Route path="/login" element={<Login/>}/><Route path="/" element={guard(<Overview/>)}/><Route path="/energy" element={guard(<ModulePage module="energy"/>)}/><Route path="/emissions" element={guard(<ModulePage module="emissions"/>)}/><Route path="/fuel" element={guard(<ModulePage module="fuel"/>)}/><Route path="/sites" element={guard(<ModulePage module="sites"/>)}/><Route path="/reports" element={guard(<Reports/>)}/><Route path="/settings" element={guard(<ModulePage module="settings"/>)}/><Route path="*" element={<NotFound/>}/></Routes></HashRouter></AuthProvider></QueryClientProvider>}
const container=document.getElementById("root");if(container)createRoot(container).render(<App/>);
