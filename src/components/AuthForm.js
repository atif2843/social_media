"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import supabase from "@/lib/supabase";
import useStore from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AuthForm({ type = "login" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const setUser = useStore((state) => state.setUser);
  const resetStore = useStore((state) => state.resetStore);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clear any existing auth data properly
      await supabase.auth.signOut();
      resetStore();

      if (type === "login") {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (!data?.session?.user) {
          throw new Error("No session data received");
        }

        // Set user in store
        setUser(data.session.user);

        // Show success message
        toast.success("Successfully signed in!"); // Get return URL and redirect (check both parameter names)
        const redirectTo =
          searchParams.get("returnTo") || searchParams.get("returnUrl");
        const redirectPath = redirectTo
          ? decodeURIComponent(redirectTo)
          : "/dashboard";

        // Use a small timeout to ensure store is updated before redirect
        setTimeout(() => {
          console.log("Redirecting to:", redirectPath);
          window.location.href = redirectPath;
        }, 100);
      } else {
        // Handle signup
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;
        toast.success("Check your email to confirm your account!");
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
            {type === "login" ? "Signing in..." : "Creating account..."}
          </div>
        ) : type === "login" ? (
          "Sign In"
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  );
}
