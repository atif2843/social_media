"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "@/lib/supabase";
import useStore from "@/lib/store";
import { toast } from "sonner";

export default function SocialAccountCard({ platform, accountData, refreshAccounts }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [localConnected, setLocalConnected] = useState(!!accountData);
  const user = useStore((state) => state.user);

  useEffect(() => {
    // Check for connection success or error messages in URL parameters
    const urlPlatform = searchParams.get("platform");
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (urlPlatform && success === "true") {
      toast.success(
        `Successfully connected to ${getPlatformDisplayName(urlPlatform)}!`
      );
    } else if (urlPlatform && error) {
      toast.error(
        `Failed to connect to ${getPlatformDisplayName(urlPlatform)}: ${error}`
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

    if (!platform) {
      console.error("Platform is missing");
      toast.error("Platform configuration is missing");
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

      // Debug logs for request parameters
      console.log("Request parameters:", {
        platform,
        user_id: session.user.id,
        edgeFunctionUrl: process.env.NEXT_PUBLIC_EDGE_FUNCTION_URL,
      });

      // Ensure platform is correctly formatted
      const normalizedPlatform = platform.toLowerCase();
      // Build the Edge Function URL
      const baseUrl = `${process.env.NEXT_PUBLIC_EDGE_FUNCTION_URL}/oauth-handler/authorize`;
      const params = new URLSearchParams();
      params.append("platform", normalizedPlatform);
      params.append("user_id", session.user.id);

      const url = `${baseUrl}?${params.toString()}`;

      // Debug log for final request
      console.log("Making request to:", {
        url,
        headers: {
          Authorization:
            "Bearer " + session.access_token.substring(0, 10) + "...",
          "Content-Type": "application/json",
        },
      });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      // Debug log for response
      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        console.error("Auth request failed:", {
          status: response.status,
          statusText: response.statusText,
          data,
          requestUrl: url,
        });
        throw new Error(data.error || "Failed to get authorization URL");
      }

      if (data.url) {
        // Store the current URL to redirect back after auth
        sessionStorage.setItem("oauth_redirect_url", window.location.href);
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
      console.log('Disconnecting account:', accountData);
      
      // Make sure we have the account ID
      if (!accountData.id) {
        throw new Error('Account ID is missing');
      }
      
      // Import the socialMediaService
      const { socialMediaService } = await import('@/services/socialMediaService');
      
      // Use the service to disconnect the account
      await socialMediaService.disconnectAccount(accountData.id);
      
      toast.success(`Disconnected from ${getPlatformDisplayName(platform)}`);
      
      // Immediately update local state to show Connect button
      setLocalConnected(false);
      
      // Add a small delay to ensure the database operation has completed
      setTimeout(() => {
        // Refresh the accounts data if the refreshAccounts function is available
        if (typeof refreshAccounts === 'function') {
          console.log('Refreshing accounts data...');
          refreshAccounts();
        } else {
          // Fallback to reloading the page if refreshAccounts is not available
          console.log('Reloading page...');
          window.location.reload();
        }
      }, 500); // 500ms delay
    } catch (error) {
      console.error("Error disconnecting account:", error);
      toast.error("Failed to disconnect account. Please try again.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Update localConnected when accountData changes
  useEffect(() => {
    setLocalConnected(!!accountData);
  }, [accountData]);
  
  const isConnected = localConnected && !!accountData;

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
