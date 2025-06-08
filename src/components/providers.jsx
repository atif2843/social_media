"use client";

import { Suspense, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { LoadingPage } from "./ui/loading";
import supabase from "@/lib/supabase";
import useStore from "@/lib/store";

export default function Providers({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const setUser = useStore((state) => state.setUser);
  const user = useStore((state) => state.user);
  const setLoading = useStore((state) => state.setLoading);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log("Initializing auth...");
      try {
        setLoading(true);

        // First check for existing user in session storage
        let existingUser = null;
        try {
          const storedUser = sessionStorage.getItem("sb-auth-user");
          if (storedUser) {
            existingUser = JSON.parse(storedUser);
          }
        } catch (e) {
          console.error("Error reading stored user:", e);
        } // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }

        console.log(
          "Current session:",
          session,
          "Existing user:",
          existingUser
        );

        if (!mounted) return;

        // If we have a valid session, use it
        if (session?.user) {
          console.log("Valid session found, setting user");
          setUser(session.user);
        }
        // If we have a stored user but no session, try to refresh the session
        else if (existingUser) {
          console.log("Stored user found but no session, attempting refresh");
          try {
            const {
              data: { session: refreshedSession },
              error: refreshError,
            } = await supabase.auth.refreshSession();

            if (refreshError) {
              console.error("Session refresh failed:", refreshError);
              throw refreshError;
            }

            if (refreshedSession?.user) {
              console.log("Session refreshed successfully");
              setUser(refreshedSession.user);
            } else {
              console.log(
                "Session refresh returned no user, clearing stored data"
              );
              setUser(null);
              sessionStorage.removeItem("sb-auth-user");
              router.replace("/login");
            }
          } catch (refreshError) {
            console.error("Failed to refresh session:", refreshError);
            setUser(null);
            sessionStorage.removeItem("sb-auth-user");
            router.replace("/login");
          }

          if (["/login", "/signup"].includes(pathname)) {
            // Get return URL from query params
            const params = new URLSearchParams(window.location.search);
            const redirectTo =
              params.get("returnTo") || params.get("returnUrl") || "/dashboard";

            // Use router for client-side navigation
            console.log("Redirecting to:", redirectTo);
            router.replace(decodeURIComponent(redirectTo));
          }
        } else {
          console.log("No valid session found");
          setUser(null);

          // If we're not on a public route, redirect to login
          const publicRoutes = ["/", "/login", "/signup"];
          if (
            !publicRoutes.includes(pathname) &&
            !pathname.startsWith("/auth/")
          ) {
            const redirectUrl = new URL("/login", window.location.origin);
            redirectUrl.searchParams.set("returnTo", pathname);
            console.log("Redirecting to login with returnTo:", pathname);
            router.replace(redirectUrl.toString());
          }
        }

        // Set up auth state listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;

          console.log("Auth state change:", event, session);

          switch (event) {
            case "SIGNED_IN":
              if (session?.user) {
                console.log("Sign in detected, setting user");
                setUser(session.user);
              }
              break;

            case "SIGNED_OUT":
              console.log("Sign out detected, clearing user");
              setUser(null);
              sessionStorage.removeItem("sb-auth-user");
              router.replace("/login");
              break;

            case "TOKEN_REFRESHED":
              if (session?.user) {
                console.log("Token refreshed, updating user");
                setUser(session.user);
              }
              break;
          }
        });

        return () => {
          mounted = false;
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setUser(null);
          sessionStorage.removeItem("sb-auth-user");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, [pathname, router, setLoading, setUser]);

  return (
    <>
      <Suspense fallback={<LoadingPage />}>{children}</Suspense>
      <Toaster position="top-right" />
    </>
  );
}
