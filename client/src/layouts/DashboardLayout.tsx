import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { ChartLine, ListBullets, SignOut } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoLight from "@/assets/brand/logo-biodinamica.png";
import logoDark from "@/assets/brand/logo-biodinamica-branca.png";

const navItems = [
  { to: "/", label: "Visao geral", icon: ChartLine, end: true },
  { to: "/assinaturas", label: "Assinaturas", icon: ListBullets, end: false },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-card px-4 py-6 md:flex">
        <div className="px-2">
          <img src={logoLight} alt="Biodinamica" className="h-10 w-auto dark:hidden" />
          <img src={logoDark} alt="Biodinamica" className="hidden h-10 w-auto dark:block" />
          <p className="mt-1 px-0.5 text-xs text-muted-foreground">
            Controle de gastos - TI
          </p>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-lg bg-primary shadow-[0_4px_14px_-4px_rgba(77,89,13,0.5)]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <item.icon
                  weight="bold"
                  className={cn("relative z-10 size-4 transition-colors", isActive && "text-primary-foreground")}
                />
                <span className={cn("relative z-10 transition-colors", isActive && "text-primary-foreground")}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <div className="flex items-center justify-between px-1">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">
                {user?.role === "admin_ti" ? "Admin TI" : "Diretoria"}
              </p>
            </div>
            <ThemeToggle />
          </div>
          <Button variant="ghost" className="justify-start gap-2 text-muted-foreground" onClick={() => logout()}>
            <SignOut weight="bold" className="size-4" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <img src={logoLight} alt="Biodinamica" className="h-8 w-auto dark:hidden" />
          <img src={logoDark} alt="Biodinamica" className="hidden h-8 w-auto dark:block" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => logout()} aria-label="Sair">
              <SignOut weight="bold" className="size-4" />
            </Button>
          </div>
        </header>

        <nav className="flex gap-1 border-b border-border bg-card px-3 py-2 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )
              }
            >
              <item.icon weight="bold" className="size-3.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
