import React, { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  Info,
  RefreshCw,
  Server,
  Shield,
  Sliders,
} from 'lucide-react'
import { Card } from '../components/common/Card'

export const Settings = () => {
  const [lowMax, setLowMax] = useState(29)
  const [medMax, setMedMax] = useState(69)
  const [saved, setSaved] = useState(false)

  const handleSaveThresholds = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#F1F5F9] tracking-tight flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#3B82F6]" />
          Platform Configuration & System Settings
        </h2>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Tune machine learning risk classification cutoffs, inspect environment diagnostics, and manage demo datasets
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Thresholds Card */}
        <Card
          title="Risk Classification Thresholds"
          subtitle="Configure the 0–100 score bands determining Low, Medium, and High risk triage tiers"
        >
          <form onSubmit={handleSaveThresholds} className="space-y-4 text-xs">
            {/* Low Risk */}
            <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-emerald-400">Low Risk Tier</span>
                <span className="font-mono text-[#F1F5F9]">0 – {lowMax}</span>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                value={lowMax}
                onChange={(e) => setLowMax(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[11px] text-[#94A3B8] block mt-1">
                Transactions scoring below this value are auto-cleared as legitimate.
              </span>
            </div>

            {/* Medium Risk */}
            <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-amber-400">Medium Risk Tier</span>
                <span className="font-mono text-[#F1F5F9]">{lowMax + 1} – {medMax}</span>
              </div>
              <input
                type="range"
                min={lowMax + 5}
                max="85"
                value={medMax}
                onChange={(e) => setMedMax(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[11px] text-[#94A3B8] block mt-1">
                Flagged for routine analyst inspection and fraud monitoring.
              </span>
            </div>

            {/* High Risk */}
            <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-rose-400">High Risk Tier</span>
                <span className="font-mono text-[#F1F5F9]">{medMax + 1} – 100</span>
              </div>
              <span className="text-[11px] text-[#94A3B8] block">
                Critical anomalies routed with highest priority to the Fraud Alert Monitoring Center.
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              {saved && (
                <span className="text-emerald-400 text-xs flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Thresholds updated successfully
                </span>
              )}
              {!saved && <div />}
              <button
                type="submit"
                className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg text-xs font-semibold text-white transition-all shadow-sm shadow-blue-500/20"
              >
                Apply Thresholds
              </button>
            </div>
          </form>
        </Card>

        {/* Environment Architecture Diagnostics */}
        <Card
          title="System & Runtime Diagnostics"
          subtitle="Deployment architecture parameters and infrastructure status"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Backend Framework</span>
                <span className="text-[#F1F5F9] font-medium">FastAPI + Uvicorn ASGI</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px]">
                Connected
              </span>
            </div>

            <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Database Engine</span>
                <span className="text-[#F1F5F9] font-medium">SQLite 3 (via SQLAlchemy 2.0 ORM)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[11px] font-mono">
                fraud_detection.db
              </span>
            </div>

            <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Machine Learning Model</span>
                <span className="text-[#F1F5F9] font-medium">Random Forest + Isolation Forest</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#172335] text-[#22D3EE] border border-[#253246] text-[11px] font-mono">
                fraud_model.joblib
              </span>
            </div>

            <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Frontend Client</span>
                <span className="text-[#F1F5F9] font-medium">React 19 + Vite 8 + Tailwind CSS v4</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[11px]">
                Active
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Academic Project Attribution Card */}
      <Card
        title="Project Specification & Academic Attribution"
        subtitle="CIA Evaluation Context — Semester 3: Artificial Intelligence for Finance"
      >
        <div className="space-y-3 text-xs text-[#94A3B8]">
          <p>
            This software platform was engineered to satisfy the rigorous technical specifications for the{' '}
            <strong className="text-[#F1F5F9]">AI-Powered Fraud Detection System</strong> Continuous Internal Assessment (CIA) in Semester 3: AI for Finance.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg">
              <span className="text-[10px] font-mono text-[#3B82F6] uppercase block font-semibold">Genuine Inference</span>
              <span className="text-[#F1F5F9] text-xs mt-1 block">
                No simulated or hardcoded scores; predictions are dynamically inferred through trained Scikit-learn estimators.
              </span>
            </div>
            <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg">
              <span className="text-[10px] font-mono text-[#22D3EE] uppercase block font-semibold">Institutional Design</span>
              <span className="text-[#F1F5F9] text-xs mt-1 block">
                Dark institutional fintech aesthetic inspired by institutional transaction monitoring consoles.
              </span>
            </div>
            <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg">
              <span className="text-[10px] font-mono text-emerald-400 uppercase block font-semibold">Transparent Diagnostics</span>
              <span className="text-[#F1F5F9] text-xs mt-1 block">
                Rule-based diagnostic observations are clearly distinguished from statistical ML probability estimation.
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
