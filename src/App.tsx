
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./utils/errorBoundary";
import { UserRole } from "./types";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/company/Dashboard";
import CompanyEmployees from "./pages/company/Employees";
import Appointments from "./pages/company/Appointments";
import Settings from "./pages/company/Settings";
import AdminDashboard from "./pages/admin/Dashboard";
import Companies from "./pages/admin/Companies";
import CompanyDetails from "./pages/admin/CompanyDetails";
import AdminAppointments from "./pages/admin/Appointments";
import AdminEmployees from "./pages/admin/Employees";
import ExamTypes from "./pages/admin/ExamTypes";
import AdminSettings from "./pages/admin/Settings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AdminNotifications from "./pages/admin/Notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

// Create a client with production-ready configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  // Remove development-only logs
  useEffect(() => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log("NovaAgenda system initialized");
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />

              <Route
                path="/company"
                element={<ProtectedRoute roles={[UserRole.COMPANY]} />}
              >
                <Route element={<MainLayout />}>
                  <Route path="" element={<Navigate to="/company/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="employees" element={<CompanyEmployees />} />
                  <Route path="appointments" element={<Appointments />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>

              <Route
                path="/admin"
                element={<ProtectedRoute roles={[UserRole.ADMIN]} />}
              >
                <Route element={<MainLayout />}>
                  <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="companies" element={<Companies />} />
                  <Route path="companies/:id" element={<CompanyDetails />} />
                  <Route path="appointments" element={<AdminAppointments />} />
                  <Route path="employees" element={<AdminEmployees />} />
                  <Route path="exam-types" element={<ExamTypes />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="notifications" element={<AdminNotifications />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            <Toaster />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
