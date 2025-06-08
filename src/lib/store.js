"use client";
import { create } from "zustand";

// Create a basic store without persistence
const useStore = create((set) => ({
  user: null,
  loading: false,
  setUser: (user) => {
    console.log("Setting user:", user);
    // Update store
    set({ user });
    // Update session storage
    if (typeof window !== "undefined") {
      if (user) {
        sessionStorage.setItem("sb-auth-user", JSON.stringify(user));
      } else {
        sessionStorage.removeItem("sb-auth-user");
      }
    }
  },
  setLoading: (loading) => set({ loading }),
  resetStore: () => {
    // Clear store
    set({ user: null, loading: false });
    // Clear storage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("sb-auth-user");
      localStorage.removeItem("sb-auth-user");
      // Clear Supabase session
      sessionStorage.removeItem("supabase.auth.token");
      localStorage.removeItem("supabase.auth.token");
    }
  },
}));

export default useStore;
