import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  Menu,
  LogOut,
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  GitMerge,
  FileBarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/auth/useAuth";

const navItems = [
  { to: "/",               label: "Dashboard",      icon: LayoutDashboard, end: true },
  { to: "/customers",      label: "Customers",       icon: Users },
  { to: "/transactions",   label: "Transactions",    icon: ArrowLeftRight },
  { to: "/reconciliation", label: "Reconciliation",  icon: GitMerge },
  { to: "/reports",        label: "Reports",         icon: FileBarChart },
];

function SidebarContent({ onNavClick }) {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link to="/" className="font-display font-semibold text-lg tracking-tight" onClick={onNavClick}>
          PRS Admin
        </Link>
      </div>
      <nav className="flex-1 py-6 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavClick}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-6 py-3.5 text-[17px] transition-all relative border-l-[3px] active:scale-95",
                  isActive
                    ? "text-primary font-semibold bg-secondary border-primary"
                    : "text-foreground hover:bg-secondary border-transparent"
                )
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start gap-3 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-95 px-4 h-11"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Sign out</span>
        </Button>
      </div>
    </div>
  );
}

export function AppLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex flex-col w-[240px] fixed top-0 bottom-0 left-0 border-r border-border bg-background z-20">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col md:pl-[240px] min-w-0">
        <header className="md:hidden flex items-center justify-between px-6 h-16 border-b border-border bg-background">
          <Link to="/" className="font-display font-semibold text-lg tracking-tight">
            PRS Admin
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={
              <Button variant="ghost" size="icon" className="active:scale-95">
                <Menu className="w-6 h-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            } />
            <SheetContent side="left" className="w-[280px] p-0 flex flex-col h-full border-r border-border">
              <SidebarContent onNavClick={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 py-6 md:px-8 md:py-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
