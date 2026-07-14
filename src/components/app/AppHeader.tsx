import { useTranslation } from "react-i18next";
import logo from "@/assets/winfluence-logo.png.asset.json";
import icon from "@/assets/winfluence-icon.png.asset.json";
import { Bell, Settings as SettingsIcon, ChevronDown, User, Shield, LogOut } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";

type Props = { displayName: string; logoUrl?: string | null };

export function AppHeader({ displayName, logoUrl }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/signed-out", replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-3">
      <SidebarTrigger />
      <Link to="/" className="flex items-center">
        <img
          src={collapsed ? icon.url : logo.url}
          alt="Winfluence"
          className="h-7 w-auto object-contain"
        />
      </Link>
      <div className="flex-1" />
      <Button
        variant="ghost"
        size="icon"
        asChild
        aria-label={t("header.notifications")}
      >
        <Link to="/messages/notifications">
          <Bell className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        asChild
        aria-label={t("header.settings")}
      >
        <Link to="/settings">
          <SettingsIcon className="h-4 w-4" />
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 max-w-[220px]">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : null}
            <span className="truncate font-medium">{displayName}</span>
            <ChevronDown className="h-4 w-4 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex items-center gap-2">
              <User className="h-4 w-4" /> {t("header.profile")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> {t("header.security")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" /> {t("header.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
