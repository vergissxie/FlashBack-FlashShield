import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "sonner"

import { FlashBackLanding } from "@/components/landing/FlashBackLanding"
import { Dashboard } from "@/dashboard/Dashboard"
import { FlashShieldLive } from "@/integrations/flashshield/FlashShieldLive"

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors closeButton duration={4500} />
      <Routes>
        <Route path="/" element={<FlashBackLanding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/live" element={<FlashShieldLive />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
