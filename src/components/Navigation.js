"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import supabase from "@/lib/supabase";
import useStore from "@/lib/store";
import { Card } from "@/components/ui/card.tsx";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Calendar,
  Hash,
  FileText,
  Megaphone,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  User,
  Search,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useStore((state) => state.user);
  const loading = useStore((state) => state.loading);
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh(); // Ensure server-side session is updated
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Schedule",
      href: "/schedule",
      icon: Calendar,
    },
    {
      name: "Hashtags",
      href: "/hashtags",
      icon: Hash,
    },
    {
      name: "Templates",
      href: "/templates",
      icon: FileText,
    },
    {
      name: "Ads",
      href: "/ads",
      icon: Megaphone,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  const NavigationContent = () => (
    <nav className="flex-1 space-y-1 py-4">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-4 py-3 text-sm font-medium transition-colors relative",
              isActive
                ? "text-blue-600 bg-blue-50/50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
              isCollapsed ? "justify-center" : "space-x-3"
            )}
            onClick={() => setIsOpen(false)}
          >
            <Icon
              className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive
                  ? "text-blue-600"
                  : "text-gray-400 group-hover:text-gray-500"
              )}
            />
            {!isCollapsed && <span>{item.name}</span>}
            {isActive && (
              <div className="absolute inset-y-0 left-0 w-1 bg-blue-600 rounded-r-md" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  const Header = () => (
    <div className="fixed top-0 right-0 left-0 lg:left-[var(--sidebar-width)] h-16 bg-white border-b z-40 transition-all duration-300">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex-1 flex items-center gap-4">
          <div className="relative w-full max-w-md hidden md:flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-10 pl-10 pr-4 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <Bell className="h-5 w-5" />
          </Button>
          <UserDropdown />
        </div>
      </div>
    </div>
  );

  const UserDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 w-10 rounded-full">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-700 font-medium">
              {user?.email?.[0].toUpperCase()}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.email}</p>
            <p className="text-xs leading-none text-gray-500">Free plan</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 hover:!text-red-700 hover:!bg-red-50"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const UserSection = () => (
    <div className={cn("p-4 border-t", isCollapsed && "flex justify-center")}>
      <Button
        variant="ghost"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "w-full flex items-center justify-between hover:bg-gray-100",
          isCollapsed && "justify-center p-2"
        )}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-700 font-medium">
                {user?.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                {user?.email}
              </span>
            </div>
          </div>
        )}
        <ChevronLeft
          className={cn(
            "h-5 w-5 text-gray-400 transition-transform",
            isCollapsed && "transform rotate-180"
          )}
        />
      </Button>
    </div>
  );

  const FooterLinks = () => (
    <div className={cn("border-t py-4 px-4", isCollapsed ? "text-center" : "")}>
      <div
        className={cn(
          "flex gap-2 text-sm text-gray-500",
          isCollapsed ? "flex-col items-center" : "items-center"
        )}
      >
        <Link href="/privacy" className="hover:text-gray-900">
          Privacy Policy
        </Link>
        {!isCollapsed && <span>•</span>}
        <Link href="/terms" className="hover:text-gray-900">
          Terms
        </Link>
      </div>
    </div>
  );

  // Don't show navigation on public routes
  if (
    !user ||
    loading ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/auth/")
  ) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        :root {
          --sidebar-width: ${isCollapsed ? "80px" : "256px"};
        }
      `}</style>

      <Header />

      {/* Mobile Navigation Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-[300px] p-0">
          <div className="flex h-full flex-col">
            <div className="p-4 border-b">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2"
                onClick={() => setIsOpen(false)}
              >
                <div className="bg-blue-500 text-white p-2 rounded-md w-8 h-8 flex items-center justify-center">
                  <span className="font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-bold text-gray-800">
                  Social Media
                </span>
              </Link>
            </div>
            <NavigationContent />
            <UserSection />
            <FooterLinks />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] border-r bg-white z-50 hidden lg:block transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          <div
            className={cn(
              "h-16 flex items-center border-b px-4",
              isCollapsed ? "justify-center" : "px-6"
            )}
          >
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center",
                isCollapsed ? "justify-center" : "space-x-2"
              )}
            >
              <div className="bg-blue-500 text-white p-2 rounded-md w-8 h-8 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-lg">S</span>
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold text-gray-800">
                  Social Media
                </span>
              )}
            </Link>
          </div>
          <NavigationContent />
          <UserSection />
          <FooterLinks />
        </div>
      </aside>
    </>
  );
}
