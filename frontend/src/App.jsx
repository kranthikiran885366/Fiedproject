import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./components/home";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import Register from "./components/auth/Register";
import Profile from "./components/Profile";
import LiveAttendanceCapture from "./components/LiveAttendanceCapture";
import AttendanceReport from "./components/AttendanceReport";
import ManualAttendance from "./components/ManualAttendance";
import CCTVView from "./components/CCTVView";
import QRNFCScan from "./components/QRNFCScan";
import NLPAssistant from "./components/NLPAssistant";
import PredictiveAnalytics from "./components/PredictiveAnalytics";
import SentimentFeedback from "./components/SentimentFeedback";
import Notifications from "./components/Notifications";
import Reports from "./components/Reports";

function App() {
  return (
    <Router>
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register" element={<Navigate to="/dashboard" replace />} />
          <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/live-attendance" element={<LiveAttendanceCapture />} />
          <Route path="/attendance-report" element={<AttendanceReport />} />
          <Route path="/manual-attendance" element={<ManualAttendance />} />
          <Route path="/cctv-view" element={<CCTVView />} />
          <Route path="/qrnfc-scan" element={<QRNFCScan />} />
          <Route path="/nlp-assistant" element={<NLPAssistant />} />
          <Route path="/predictive-analytics" element={<PredictiveAnalytics />} />
          <Route path="/sentiment-feedback" element={<SentimentFeedback />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
