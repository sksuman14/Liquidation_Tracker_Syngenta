import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import RoleBasedDashboard from "./pages/RoleBasedDashboard";

import TA from "./pages/TA";
import TSM from "./pages/TSM";
import AM from "./pages/AM";
import ZM from "./pages/ZM";
import NSM from "./pages/NSM";
import CM from "./pages/CM";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["TA","TSM","AM","ZM","NSM","CM"]}><RoleBasedDashboard /></ProtectedRoute>} />

        <Route path="/ta" element={<ProtectedRoute allowedRoles={["TA"]}><TA /></ProtectedRoute>} />
        <Route path="/tsm" element={<ProtectedRoute allowedRoles={["TSM"]}><TSM /></ProtectedRoute>} />
        <Route path="/am" element={<ProtectedRoute allowedRoles={["AM"]}><AM /></ProtectedRoute>} />
        <Route path="/zm" element={<ProtectedRoute allowedRoles={["ZM"]}><ZM /></ProtectedRoute>} />
        <Route path="/nsm" element={<ProtectedRoute allowedRoles={["NSM"]}><NSM /></ProtectedRoute>} />
        <Route path="/cm" element={<ProtectedRoute allowedRoles={["CM"]}><CM /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
