"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "@/lib/supabase";
import useStore from "@/lib/store";
import { toast } from "react-hot-toast";

export default function SocialAccountCard({ platform, accountData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const user = useStore((state) => state.user);

  useEffect(() => {
    // Check for connection success or error messages in URL parameters
    const platform = searchParams.get("platform");
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (platform && success === "true") {
      toast.success(
        `Successfully connected to ${getPlatformDisplayName(platform)}!`
      );
    } else if (platform && error) {
      toast.error(
        `Failed to connect to ${getPlatformDisplayName(platform)}: ${error}`
      );
    }
  }, [searchParams]);

  const getPlatformDisplayName = (platformKey) => {
    const platformMap = {
      facebook: "Facebook",
      instagram: "Instagram",
      twitter: "Twitter",
      linkedin: "LinkedIn",
      google_ads: "Google Ads",
    };

    return platformMap[platformKey] || platformKey;
  };
  const handleConnect = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }

    try {
      // Get the current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        toast.error("Authentication error");
        return;
      }

      if (!session?.access_token) {
        console.error("No access token found");
        toast.error("Authentication required");
        return;
      }

      // Log session info (without sensitive data)
      console.log("Session check:", {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        user: session?.user?.email,
      }); // Get the base URL from environment variables
      const baseUrl = process.env.NEXT_PUBLIC_EDGE_FUNCTION_URL; // Make a request to get the authorization URL
      console.log("Making auth request with:", {
        baseUrl,
        platform,
        userId: user.id,
        hasAccessToken: !!session.access_token,
      });

      const response = await fetch(
        `${baseUrl}/oauth-handler/authorize?platform=${platform}&user_id=${user.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            "x-client-info": "@supabase/auth-helpers-nextjs",
          },
          credentials: "include",
          mode: "cors",
        }
      );
      const data = await response.json();

      if (!response.ok) {
        console.error("Auth request failed:", {
          status: response.status,
          statusText: response.statusText,
          data,
        });
        throw new Error(data.error || "Failed to get authorization URL");
      }

      if (data.url) {
        // Store the current URL to redirect back after auth
        sessionStorage.setItem("oauth_redirect_url", window.location.href);
        // Redirect to the authorization URL
        window.location.href = data.url;
      } else {
        throw new Error("No authorization URL returned");
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast.error(error.message || "Failed to initiate connection");
    }
  };

  const handleDisconnect = async () => {
    if (!accountData) return;

    setIsDisconnecting(true);
    try {
      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", accountData.id);

      if (error) throw error;

      toast.success(`Disconnected from ${getPlatformDisplayName(platform)}`);
      // Refresh the page to update the UI
      router.refresh();
    } catch (error) {
      console.error("Error disconnecting account:", error);
      toast.error("Failed to disconnect account. Please try again.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isConnected = !!accountData;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            {getPlatformDisplayName(platform)}
          </h3>
          <p className="text-gray-600">
            {isConnected
              ? `Connected as ${
                  accountData.username ||
                  accountData.profile_name ||
                  accountData.page_name ||
                  "User"
                }`
              : "Not connected"}
          </p>
        </div>

        <button
          onClick={isConnected ? handleDisconnect : handleConnect}
          disabled={isDisconnecting}
          className={`px-4 py-2 rounded-md ${
            isConnected
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {isDisconnecting
            ? "Disconnecting..."
            : isConnected
            ? "Disconnect"
            : "Connect"}
        </button>
      </div>
    </div>
  );
}
