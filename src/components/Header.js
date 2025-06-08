"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu, User } from "lucide-react";
import useStore from "@/lib/store";
import supabase from "@/lib/supabase";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Header({ onMenuClick }) {
  const router = useRouter();
  const user = useStore((state) => state.user);

  const handleSignOut = async () => {
    try {
      // Clear any stored data first
      window.localStorage.removeItem("auth-storage");
      window.sessionStorage.removeItem("auth-storage");
      window.localStorage.removeItem("supabase.auth.token");
      window.sessionStorage.removeItem("supabase.auth.token");

      // Then sign out from Supabase
      await supabase.auth.signOut();

      // Force a clean reload to the login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="h-16 fixed right-0 top-0 left-0 lg:left-[256px] border-b bg-white z-40">
      <div className="h-full px-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-8 h-8 aspect-square"
            >
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>{user?.email}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
