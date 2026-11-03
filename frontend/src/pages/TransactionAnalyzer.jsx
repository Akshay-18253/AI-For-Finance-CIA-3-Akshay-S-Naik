import React, { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Cpu,
  Globe,
  HelpCircle,
  Info,
  RefreshCw,
  Save,
  Shield,
  ShieldAlert,
  Smartphone,
  Zap,
} from 'lucide-react'
import { predictTransaction, createTransaction } from '../services/api'
import { Card } from '../components/common/Card'
import { RiskBadge } from '../components/common/Badge'

const PRESETS = [
  {
    name: 'Normal Everyday Grocery',
    type: 'LOW',
    data: {
      transaction_amount: 45.25,
      transaction_type: 'Payment',
      merchant_category: 'Grocery',
      transaction_hour: 14,
      recent_transaction_count: 1,
      account_age_days: 520,
      location_distance: 3.4,
      new_device: false,
      international_transaction: false,
      previous_transaction_amount: 48.0,
    },
  },
  {
    name: 'Account Takeover (ATO) Spike',
    type: 'HIGH',
    data: {
      transaction_amount: 4200.0,
      transaction_type: 'Transfer',
      merchant_category: 'Retail',
      transaction_hour: 2,
      recent_transaction_count: 9,
      account_age_days: 15,
      location_distance: 650.0,
      new_device: true,
      international_transaction: false,
      previous_transaction_amount: 35.0,
    },
  },
  {
    name: 'Cross-Border Luxury Carding',
    type: 'HIGH',
    data: {
      transaction_amount: 3450.0,
      transaction_type: 'Payment',
      merchant_category: 'Electronics',
      transaction_hour: 21,
      recent_transaction_count: 6,
      account_age_days: 45,
      location_distance: 2400.0,
      new_device: true,
      international_transaction: true,
      previous_transaction_amount: 75.0,
    },
  },
  {
    name: 'Nocturnal Fresh Account Drain',
    type: 'HIGH',
    data: {
      transaction_amount: 2800.0,
      transaction_type: 'Withdrawal',
      merchant_category: 'Other',
      transaction_hour: 3,
      recent_transaction_count: 3,
      account_age_days: 8,
      location_distance: 85.0,
      new_device: true,
      international_transaction: false,
      previous_transaction_amount: 60.0,
    },
  },
  {
    name: 'Borderline Travel Booking',
    type: 'MEDIUM',
    data: {
      transaction_amount: 320.0,
      transaction_type: 'Payment',
      merchant_category: 'Travel',
      transaction_hour: 19,
      recent_transaction_count: 4,
      account_age_days: 95,
      location_distance: 75.0,
      new_device: true,
      international_transaction: false,
      previous_transaction_amount: 85.0,
    },
  },
]

export const TransactionAnalyzer = () => {
  const [formData, setFormData] = useState({
    transaction_amount: 150.0,
    transaction_type: 'Payment',
    merchant_category: 'Retail',
    transaction_hour: 12,
    recent_transaction_count: 2,
    account_age_days: 180,
    location_distance: 5.0,
    new_device: false,
    international_transaction: false,
    previous_transaction_amount: 120.0,
  })

  const [persistToLedger, setPersistToLedger] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)

  const validate = () => {
    const errs = {}
    if (isNaN(formData.transaction_amount) || formData.transaction_amount <= 0) {
      errs.transaction_amount = 'Amount must be greater than $0.00'
    }
    if (isNaN(formData.previous_transaction_amount) || formData.previous_transaction_amount < 0) {
      errs.previous_transaction_amount = 'Previous amount cannot be negative'
    }
    if (isNaN(formData.location_distance) || formData.location_distance < 0) {
      errs.location_distance = 'Distance cannot be negative'
    }
    if (isNaN(formData.recent_transaction_count) || formData.recent_transaction_count < 0) {
      errs.recent_transaction_count = 'Velocity count cannot be negative'
    }
    if (isNaN(formData.account_age_days) || formData.account_age_days < 0) {
      errs.account_age_days = 'Account age cannot be negative'
    }
    if (formData.transaction_hour < 0 || formData.transaction_hour > 23) {
      errs.transaction_hour = 'Hour must be between 0 and 23'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const handleApplyPreset = (preset) => {
    setFormData(preset.data)
    setErrors({})
    setResult(null)
  }

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setAnalyzing(true)
    setApiError(null)

    try {
      const payload = {
        ...formData,
        transaction_amount: parseFloat(formData.transaction_amount),
        previous_transaction_amount: parseFloat(formData.previous_transaction_amount),
        location_distance: parseFloat(formData.location_distance),
        recent_transaction_count: parseInt(formData.recent_transaction_count, 10),
        account_age_days: parseInt(formData.account_age_days, 10),
        transaction_hour: parseInt(formData.transaction_hour, 10),
      }

      let res
      if (persistToLedger) {
        // Run prediction and commit to SQLite ledger
        res = await createTransaction(payload)
      } else {
        // Dry-run inference only
        res = await predictTransaction(payload)
      }

      setResult(res)
    } catch (err) {
      console.error('Inference error:', err)
      setApiError(err.response?.data?.detail || err.message || 'Inference engine failed')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#F1F5F9] tracking-tight">
          AI Transaction Risk Analyzer
        </h2>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Execute real-time machine-learning scoring on incoming financial parameters
        </p>
      </div>

      {/* QUICK PRESET BUTTONS */}
      <div className="p-4 bg-[#121B29] border border-[#253246] rounded-xl">
        <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-2 font-mono">
          Demonstration Attack Vectors & Scenarios:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#172335] hover:bg-[#1E2D44] border border-[#253246] hover:border-[#3B82F6] text-[#F1F5F9] transition-all"
            >
              <Zap className="w-3 h-3 text-[#3B82F6]" />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE: FORM & RESULTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7">
          <Card
            title="Transaction Parameters"
            subtitle="Fill in transaction telemetry for real-time model evaluation"
          >
            <form onSubmit={handleAnalyze} className="space-y-4">
              {/* Row 1: Amount & Previous Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                    Transaction Amount ($) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.transaction_amount}
                    onChange={(e) => handleInputChange('transaction_amount', e.target.value)}
                    className={`w-full bg-[#0E1520] border rounded-lg px-3 py-2 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6] ${
                      errors.transaction_amount ? 'border-rose-500' : 'border-[#253246]'
                    }`}
                  />
                  {errors.transaction_amount && (
                    <span className="text-[11px] text-rose-400 mt-0.5 block">{errors.transaction_amount}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                    Previous Avg Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.previous_transaction_amount}
                    onChange={(e) => handleInputChange('previous_transaction_amount', e.target.value)}
                    className="w-full bg-[#0E1520] border border-[#253246] rounded-lg px-3 py-2 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>

              {/* Row 2: Type & Merchant Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                    Transaction Channel / Type
                  </label>
                  <select
                    value={formData.transaction_type}
                    onChange={(e) => handleInputChange('transaction_type', e.target.value)}
                    className="w-full bg-[#0E1520] border border-[#253246] rounded-lg px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]"
                  >
                    <option value="Payment">Payment</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Withdrawal">Withdrawal</option>
                    <option value="Deposit">Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                    Merchant Category
                  </label>
                  <select
                    value={formData.merchant_category}
                    onChange={(e) => handleInputChange('merchant_category', e.target.value)}
                    className="w-full bg-[#0E1520] border border-[#253246] rounded-lg px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]"
                  >
                    <option value="Retail">Retail</option>
                    <option value="Grocery">Grocery</option>
                    <option value="Travel">Travel</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Online Services">Online Services</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Hour & Recent Transaction Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                    Transaction Hour (0 - 23)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.transaction_hour}
                    onChange={(e) => handleInputChange('transaction_hour', e.target.value)}
                    className="w-full bg-[#0E1520] border border-[#253246] rounded-lg px-3 py-2 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                    Velocity (Recent Txns in 24h)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.recent_transaction_count}
                    onChange={(e) => handleInputChange('recent_transaction_count', e.target.value)}
                    className="w-full bg-[#0E1520] border border-[#253246] rounded-lg px-3 py-2 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>

              {/* Row 4: Account Age & Distance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                    Account Age (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.account_age_days}
                    onChange={(e) => handleInputChange('account_age_days', e.target.value)}
                    className="w-full bg-[#0E1520] border border-[#253246] rounded-lg px-3 py-2 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                    Distance from Baseline (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.location_distance}
                    onChange={(e) => handleInputChange('location_distance', e.target.value)}
                    className="w-full bg-[#0E1520] border border-[#253246] rounded-lg px-3 py-2 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>

              {/* Row 5: Flags (New Device, International) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[#0E1520] border border-[#253246] cursor-pointer hover:border-[#3B82F6] transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.new_device}
                    onChange={(e) => handleInputChange('new_device', e.target.checked)}
                    className="w-4 h-4 rounded bg-[#172335] border-[#253246] text-[#3B82F6] focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-medium text-[#F1F5F9] flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-[#3B82F6]" />
                      Unrecognized Device
                    </span>
                    <span className="text-[10px] text-[#94A3B8] block">First time transacting from this terminal</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[#0E1520] border border-[#253246] cursor-pointer hover:border-[#3B82F6] transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.international_transaction}
                    onChange={(e) => handleInputChange('international_transaction', e.target.checked)}
                    className="w-4 h-4 rounded bg-[#172335] border-[#253246] text-[#3B82F6] focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-medium text-[#F1F5F9] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#22D3EE]" />
                      International Transaction
                    </span>
                    <span className="text-[10px] text-[#94A3B8] block">Cross-border foreign exchange route</span>
                  </div>
                </label>
              </div>

              {/* Persistence Checkbox */}
              <div className="pt-2 flex items-center justify-between border-t border-[#1F2B3E]">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#94A3B8]">
                  <input
                    type="checkbox"
                    checked={persistToLedger}
                    onChange={(e) => setPersistToLedger(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#172335] border-[#253246] text-[#3B82F6] focus:ring-0"
                  />
                  <span className="flex items-center gap-1">
                    <Save className="w-3.5 h-3.5" />
                    Record in live transaction history database
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={analyzing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-xs font-semibold text-white transition-all shadow-sm shadow-blue-500/20"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Evaluating Features...
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      Analyze Transaction
                    </>
                  )}
                </button>
              </div>

              {apiError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}
            </form>
          </Card>
        </div>

        {/* Inference Results Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            title="Inference Assessment"
            subtitle="Probability estimation and model diagnostics"
          >
            {result ? (
              <div className="space-y-5">
                {/* Identifier & Category Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-[#1F2B3E]">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#94A3B8] block">
                      Transaction Ref
                    </span>
                    <span className="font-mono text-sm font-bold text-[#F1F5F9]">
                      {result.transaction_id}
                    </span>
                  </div>
                  <RiskBadge category={result.risk_category} />
                </div>

                {/* Risk Score Radial / Progress Meter */}
                <div className="p-4 rounded-xl bg-[#0E1520] border border-[#253246] text-center">
                  <span className="text-xs text-[#94A3B8] font-mono uppercase tracking-wider block mb-1">
                    Computed Fraud Risk Score
                  </span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span
                      className={`text-5xl font-extrabold font-mono tracking-tight ${
                        result.risk_score >= 70 ? 'text-rose-400' :
                        result.risk_score >= 30 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {result.risk_score}
                    </span>
                    <span className="text-base text-[#64748B] font-mono">/100</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#172335] h-2.5 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full transition-all duration-700 ${
                        result.risk_score >= 70 ? 'bg-rose-500' :
                        result.risk_score >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${result.risk_score}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-[#64748B] mt-1 font-mono">
                    <span>0 (Low)</span>
                    <span>30 (Medium)</span>
                    <span>70 (High)</span>
                    <span>100</span>
                  </div>
                </div>

                {/* Key Metric Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg">
                    <span className="text-[#94A3B8] block text-[10px] uppercase font-mono">
                      Fraud Probability
                    </span>
                    <span className="text-sm font-mono font-bold text-[#F1F5F9] mt-0.5 block">
                      {(result.fraud_probability * 100).toFixed(2)}%
                    </span>
                  </div>

                  <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg">
                    <span className="text-[#94A3B8] block text-[10px] uppercase font-mono">
                      Model Identifier
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#22D3EE] mt-0.5 block truncate">
                      RF v{result.model_version || '1.0.0'}
                    </span>
                  </div>
                </div>

                {/* Supplementary Rule-Based Observations */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#F1F5F9] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Heuristic Diagnostic Cues
                    </span>
                    <span className="text-[10px] text-[#64748B]">Independent Rules</span>
                  </div>

                  {result.suspicious_indicators && result.suspicious_indicators.length > 0 ? (
                    <ul className="space-y-1.5">
                      {result.suspicious_indicators.map((ind, i) => (
                        <li
                          key={i}
                          className="text-xs p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-start gap-2"
                        >
                          <span className="text-amber-400 mt-0.5 font-bold">•</span>
                          <span>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>No suspicious heuristic flags triggered across monitored attributes.</span>
                    </div>
                  )}
                </div>

                {/* Notice per Specification */}
                <div className="p-2.5 bg-[#0E1520] border border-[#1F2B3E] rounded-lg text-[10px] text-[#94A3B8] flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-[#3B82F6] shrink-0 mt-0.5" />
                  <span>
                    Model predictions are probabilistic assessments. Heuristic observations provide transparency for human investigators and are distinct from individual feature attribution.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-[#94A3B8] border border-dashed border-[#253246] rounded-xl bg-[#0E1520]/50">
                <Cpu className="w-10 h-10 text-[#3B82F6]/60 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-[#F1F5F9] mb-1">
                  Ready for Real-Time Inference
                </h4>
                <p className="text-xs text-[#94A3B8] max-w-xs mx-auto">
                  Populate parameters manually or click one of the preset scenarios above, then click Analyze.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
