"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useStore from "@/lib/store";
import { LoadingPage } from "@/components/ui/loading";

export default function ClientRedirect() {
  const router = useRouter();
  const user = useStore((state) => state.user);

  useEffect(() => {
    // Simple redirect based on store state
    if (user) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router, user]);

  return <LoadingPage />;
}
