import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Investments from './pages/Investments'
import InvestmentDetail from './pages/InvestmentDetail'
import Files from './pages/Files'
import Analysis from './pages/Analysis'
import LandAnalyzer from './pages/LandAnalyzer'
import Chat from './pages/Chat'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/investments" element={<Investments />} />
        <Route path="/investments/:id" element={<InvestmentDetail />} />
        <Route path="/files" element={<Files />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/land-analyzer" element={<LandAnalyzer />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Layout>
  )
}

export default App
