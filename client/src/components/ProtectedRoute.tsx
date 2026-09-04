import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import biodinamicaIcon from "@/assets/brand/biodinamica-icon.png";

export function ProtectedRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <img
          src={biodinamicaIcon}
          alt=""
          className="h-10 w-10 animate-pulse rounded-lg opacity-70"
        />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
