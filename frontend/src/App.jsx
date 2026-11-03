import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { TransactionAnalyzer } from './pages/TransactionAnalyzer'
import { Transactions } from './pages/Transactions'
import { FraudAlerts } from './pages/FraudAlerts'
import { Analytics } from './pages/Analytics'
import { ModelPerformance } from './pages/ModelPerformance'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="analyzer" element={<TransactionAnalyzer />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="alerts" element={<FraudAlerts />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="model" element={<ModelPerformance />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
