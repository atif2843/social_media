"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "@/lib/supabase";
import useStore from "@/lib/store";
import { toast } from "sonner";

export default function SocialAccountCard({
  platform,
  accountData,
  refreshAccounts,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [localConnected, setLocalConnected] = useState(!!accountData);
  const [isLoading, setIsLoading] = useState(false);
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
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to connect a social media account');
        return;
      }

      console.log('Connecting platform:', platform);
      console.log('User ID:', session.user.id);
      console.log('Access token available:', !!session.access_token);

      // Construct URL with parameters
      const url = new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/oauth-handler/authorize`);
      const params = new URLSearchParams();
      params.append("platform", platform);
      params.append("user_id", session.user.id);
      url.search = params.toString();

      console.log('Request URL:', url.toString());
      console.log('Using access token for authorization');

      // Make the request to get the authorization URL
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      // Debug log for response
      console.log("Response status:", response.status);
      console.log("Response status text:", response.statusText);

      // Try to parse the response as JSON
      let data;
      const responseText = await response.text();
      console.log("Raw response:", responseText);
      
      try {
        data = JSON.parse(responseText);
        console.log("Parsed response data:", data);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        throw new Error(`Invalid response format: ${responseText}`);
      }

      if (!response.ok) {
        console.error("Auth request failed:", {
          status: response.status,
          statusText: response.statusText,
          data,
          requestUrl: url.toString(),
        });
        throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
      }

      if (data.url) {
        // Store the current URL to redirect back after auth
        sessionStorage.setItem("oauth_redirect_url", window.location.href);
        console.log("Redirecting to OAuth URL:", data.url);
        window.location.href = data.url;
      } else {
        throw new Error("No authorization URL returned");
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast.error(error.message || "Failed to initiate connection");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!accountData) return;

    setIsDisconnecting(true);
    try {
      console.log("Disconnecting account:", accountData);

      // Make sure we have the account ID
      if (!accountData.id) {
        throw new Error("Account ID is missing");
      }

      // Import the socialMediaService
      const { socialMediaService } = await import(
        "@/services/socialMediaService"
      );

      // Use the service to disconnect the account
      await socialMediaService.disconnectAccount(accountData.id);

      toast.success(`Disconnected from ${getPlatformDisplayName(platform)}`);

      // Immediately update local state to show Connect button
      setLocalConnected(false);

      // Add a small delay to ensure the database operation has completed
      setTimeout(() => {
        // Refresh the accounts data if the refreshAccounts function is available
        if (typeof refreshAccounts === "function") {
          console.log("Refreshing accounts data...");
          refreshAccounts();
        } else {
          // Fallback to reloading the page if refreshAccounts is not available
          console.log("Reloading page...");
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
          disabled={isDisconnecting || isLoading}
          className={`px-4 py-2 rounded-md ${
            isConnected
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {isDisconnecting
            ? "Disconnecting..."
            : isLoading
            ? "Connecting..."
            : isConnected
            ? "Disconnect"
            : "Connect"}
        </button>
      </div>
    </div>
  );
}
