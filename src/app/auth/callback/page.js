"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "@/lib/supabase";
import useStore from "@/lib/store";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useStore((state) => state.setUser);
  const setLoading = useStore((state) => state.setLoading);
  const resetStore = useStore((state) => state.resetStore);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setLoading(true);

        // Clear any existing auth data first
        resetStore();
        window.localStorage.removeItem("auth-storage");
        window.sessionStorage.removeItem("auth-storage");
        window.localStorage.removeItem("supabase.auth.token");
        window.sessionStorage.removeItem("supabase.auth.token");

        const code = searchParams.get("code");

        if (!code) {
          throw new Error("No code provided");
        }

        // Exchange the auth code for a session
        const { data, error: signInError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (signInError) throw signInError;

        if (data?.user) {
          setUser(data.user);

          // Get and decode the returnTo parameter
          const returnTo = searchParams.get("returnTo");
          const redirectPath = returnTo
            ? decodeURIComponent(returnTo)
            : "/dashboard";

          toast.success("Successfully signed in!");

          // Force a clean redirect
          window.location.href = redirectPath;
        } else {
          throw new Error("No user data received");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        toast.error(error.message);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [router, searchParams, setUser, setLoading, resetStore]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      <span className="ml-3">Completing sign in...</span>
    </div>
  );
}
