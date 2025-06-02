
import React, { useEffect, useRef, useMemo } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  roles: UserRole[];
}

export const ProtectedRoute = ({ roles }: ProtectedRouteProps) => {
  const { user, loading, lastAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();
  const hasRefreshed = useRef(false);

  // Optimize role checking with memoization
  const hasValidRole = useMemo(() => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user?.role, roles]);

  const shouldRefresh = useMemo(() => {
    return user && !hasRefreshed.current;
  }, [user?.id]);

  // Handle user refresh on mount
  useEffect(() => {
    if (shouldRefresh) {
      hasRefreshed.current = true;
      refreshUser().catch(() => {
        // Silently handle refresh errors - user will be redirected to login if needed
      });
    }
    
    return () => {
      hasRefreshed.current = false;
    };
  }, [shouldRefresh, refreshUser]);

  // Handle session expiration check
  useEffect(() => {
    if (!lastAuthenticated) return;
    
    const fourHours = 4 * 60 * 60 * 1000;
    const isExpired = Date.now() - lastAuthenticated > fourHours;
    
    if (isExpired) {
      navigate("/login", { replace: true });
    }
  }, [lastAuthenticated, navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authorization check
  if (!hasValidRole) {
    const redirectPath = user.role === UserRole.ADMIN ? "/admin/dashboard" : "/company/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};
