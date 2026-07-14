import { useTranslation } from "react-i18next";
import logo from "@/assets/winfluence-logo.png";
import icon from "@/assets/winfluence-icon.png";

import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Megaphone,
  Users,
  BarChart3,
  MessageSquare,
  Settings as SettingsIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";

type SubItem = { titleKey: string; to: string };
type Group = {
  titleKey: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
  items?: SubItem[];
};

const groups: Group[] = [
  { titleKey: "nav.home", icon: Home, to: "/" },
  {
    titleKey: "nav.campaigns",
    icon: Megaphone,
    items: [
      { titleKey: "nav.campaignsNew", to: "/campaigns/new" },
      { titleKey: "nav.campaignsDrafts", to: "/campaigns/drafts" },
      { titleKey: "nav.campaignsPublished", to: "/campaigns/published" },
      { titleKey: "nav.campaignsRunning", to: "/campaigns/running" },
      { titleKey: "nav.campaignsExpired", to: "/campaigns/expired" },
      { titleKey: "nav.campaignsCompleted", to: "/campaigns/completed" },
      { titleKey: "nav.campaignsArchive", to: "/campaigns/archive" },
    ],
  },
  {
    titleKey: "nav.influencers",
    icon: Users,
    items: [
      { titleKey: "nav.influencersSearch", to: "/influencers/search" },
      { titleKey: "nav.influencersCurrent", to: "/influencers/current" },
      { titleKey: "nav.influencersHired", to: "/influencers/hired" },
      { titleKey: "nav.influencersFavorites", to: "/influencers/favorites" },
    ],
  },
  {
    titleKey: "nav.analytics",
    icon: BarChart3,
    items: [
      { titleKey: "nav.analyticsCampaigns", to: "/analytics/campaigns" },
      { titleKey: "nav.analyticsInfluencers", to: "/analytics/influencers" },
    ],
  },
  {
    titleKey: "nav.messages",
    icon: MessageSquare,
    items: [
      { titleKey: "nav.messagesNotifications", to: "/messages/notifications" },
      { titleKey: "nav.messagesPersonal", to: "/messages/personal" },
      { titleKey: "nav.messagesSystem", to: "/messages/system" },
    ],
  },
  { titleKey: "nav.settings", icon: SettingsIcon, to: "/settings" },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname === to);
  const isGroupActive = (g: Group) =>
    g.items ? g.items.some((i) => pathname === i.to) : false;

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="h-14 px-4 flex items-center justify-start">
        <Link to="/" className="flex items-center justify-start">
          {collapsed ? (
            <img
              src={icon}
              alt="winfluence"
              className="h-8 w-8 object-contain rounded-sm"
            />
          ) : (
            <img
              src={logo}
              alt="winfluence"
              className="h-6 w-auto object-contain"
            />
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {groups.map((group) => {
                if (!group.items) {
                  return (
                    <SidebarMenuItem key={group.titleKey}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(group.to!)}
                        tooltip={t(group.titleKey)}
                      >
                        <Link to={group.to!} className="flex items-center gap-2">
                          <group.icon className="h-4 w-4" />
                          <span>{t(group.titleKey)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <Collapsible
                    key={group.titleKey}
                    defaultOpen={isGroupActive(group)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={t(group.titleKey)}>
                          <group.icon className="h-4 w-4" />
                          <span>{t(group.titleKey)}</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {group.items.map((item) => (
                            <SidebarMenuSubItem key={item.to}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive(item.to)}
                              >
                                <Link to={item.to}>{t(item.titleKey)}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
