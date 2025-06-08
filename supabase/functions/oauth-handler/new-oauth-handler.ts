/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Types
interface EnvConfig {
  supabaseUrl: string;
  supabaseKey: string;
  frontendUrl: string;
  edgeFunctionUrl: string;
  clientId: string;
  clientSecret: string;
}

interface OAuthState {
  state: string;
  user_id: string;
  platform: string;
  created_at: string;
}

// Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  // Add production URLs here when deployed
];

// Environment variable validation
const validateConfig = (config: Partial<EnvConfig>): EnvConfig => {
  const missingVars = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(", ")}`);
  }

  return config as EnvConfig;
};

const getEnvConfig = (platform: string): EnvConfig => {
  return validateConfig({
    supabaseUrl: Deno.env.get("SUPABASE_URL"),
    supabaseKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    frontendUrl: Deno.env.get("FRONTEND_URL"),
    edgeFunctionUrl: Deno.env.get("EDGE_FUNCTION_URL"),
    clientId: Deno.env.get(`${platform.toUpperCase()}_CLIENT_ID`),
    clientSecret: Deno.env.get(`${platform.toUpperCase()}_CLIENT_SECRET`),
  });
};

const corsHeaders = (origin: string) => {
  if (!origin || !allowedOrigins.includes(origin)) {
    origin = allowedOrigins[0];
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin", // Important for caching with multiple origins
  };
};

const handleError = (error: Error, origin: string, status = 400) => {
  console.error("Error:", error.message);
  return new Response(JSON.stringify({ error: error.message }), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json",
    },
  });
};

serve(async (req) => {
  const origin = req.headers.get("Origin") || allowedOrigins[0];
  const url = new URL(req.url);

  // Log incoming request details
  console.log("Incoming request:", {
    method: req.method,
    url: req.url,
    searchParams: Object.fromEntries(url.searchParams.entries()),
    headers: Object.fromEntries(req.headers.entries()),
  });

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders(origin),
    });
  }

  try {
    // Get and validate platform parameter
    const platform = url.searchParams.get("platform");
    console.log("Platform parameter:", platform);

    if (!platform) {
      console.error("Missing platform parameter");
      return handleError(new Error("Platform parameter is required"), origin);
    }

    // Get and validate configuration
    let config: EnvConfig;
    try {
      config = getEnvConfig(platform);
      console.log("Configuration loaded for platform:", platform);
    } catch (error) {
      console.error("Configuration error:", error);
      return handleError(error as Error, origin);
    }

    // Initialize Supabase admin client (with service role key)
    const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseKey);

    // Check if this is a callback URL
    const isCallback = url.pathname.endsWith("/callback");

    // Only require authentication for non-callback requests
    let user = null;
    if (!isCallback) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return handleError(new Error("Authentication required"), origin, 401);
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: authError } =
        await supabaseAdmin.auth.getUser(token);

      if (authError || !userData?.user) {
        return handleError(
          new Error("Invalid authentication token"),
          origin,
          401
        );
      }

      user = userData.user;
    }

    // Handle authorization request
    if (url.pathname.endsWith("/authorize")) {
      if (!user) {
        return handleError(new Error("Authentication required"), origin, 401);
      }

      const state = crypto.randomUUID();

      // Store OAuth state
      const { error: stateError } = await supabaseAdmin
        .from("oauth_states")
        .insert({
          state,
          user_id: user.id,
          platform,
          created_at: new Date().toISOString(),
        });

      if (stateError) {
        console.error("State storage error:", stateError);
        return handleError(new Error("Failed to store OAuth state"), origin);
      }

      // Build OAuth URL based on platform
      const authUrl = new URL(
        platform === "facebook"
          ? "https://www.facebook.com/v18.0/dialog/oauth"
          : ""
      );

      authUrl.searchParams.set("client_id", config.clientId);
      authUrl.searchParams.set(
        "redirect_uri",
        `${config.edgeFunctionUrl}/oauth-handler/callback`
      );
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("response_type", "code");

      if (platform === "facebook") {
        authUrl.searchParams.set(
          "scope",
          "pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata"
        );
      }

      return new Response(JSON.stringify({ url: authUrl.toString() }), {
        status: 200,
        headers: {
          ...corsHeaders(origin),
          "Content-Type": "application/json",
        },
      });
    }

    // Handle callback from OAuth provider
    if (isCallback) {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (!code || !state) {
        return handleError(
          new Error("Missing code or state parameter"),
          origin
        );
      }

      // Retrieve stored state from database
      const { data: storedState, error: stateError } = await supabaseAdmin
        .from("oauth_states")
        .select("platform, user_id")
        .eq("state", state)
        .single();

      if (stateError || !storedState) {
        console.error("State error:", stateError);
        return handleError(new Error("Invalid OAuth state"), origin);
      }

      const platform = storedState.platform;
      const redirectUri = `${config.edgeFunctionUrl}/oauth-handler/callback`;

      // Exchange code for access token
      const tokenUrl = new URL(
        "https://graph.facebook.com/v18.0/oauth/access_token"
      );
      tokenUrl.searchParams.set("client_id", config.clientId);
      tokenUrl.searchParams.set("client_secret", config.clientSecret);
      tokenUrl.searchParams.set("code", code);
      tokenUrl.searchParams.set("redirect_uri", redirectUri);

      const tokenResponse = await fetch(tokenUrl.toString()).then((res) =>
        res.json()
      );

      if (!tokenResponse.access_token) {
        console.error("Token response:", tokenResponse);
        return handleError(new Error("Failed to get access token"), origin);
      }

      // For Facebook, fetch pages the user has access to
      if (platform === "facebook") {
        try {
          // Get user's Facebook pages
          const pagesUrl = new URL(
            "https://graph.facebook.com/v18.0/me/accounts"
          );
          pagesUrl.searchParams.set("access_token", tokenResponse.access_token);

          const pagesResponse = await fetch(pagesUrl.toString()).then((res) =>
            res.json()
          );

          if (pagesResponse.data && pagesResponse.data.length > 0) {
            // Use the first page for now
            const page = pagesResponse.data[0];

            // Store the access token and page information
            const { error: accountError } = await supabaseAdmin
              .from("accounts")
              .insert([
                {
                  user_id: storedState.user_id,
                  platform: storedState.platform,
                  access_token: tokenResponse.access_token,
                  refresh_token: tokenResponse.refresh_token || null,
                  expires_at: tokenResponse.expires_in
                    ? new Date(
                        Date.now() + tokenResponse.expires_in * 1000
                      ).toISOString()
                    : null,
                  page_id: page.id,
                  page_name: page.name,
                  username: page.name, // Use page name as username for display
                },
              ]);

            if (accountError) {
              return handleError(
                new Error("Failed to store access token and page info"),
                origin
              );
            }
          } else {
            // No pages found, just store the access token
            const { error: accountError } = await supabaseAdmin
              .from("accounts")
              .insert([
                {
                  user_id: storedState.user_id,
                  platform: storedState.platform,
                  access_token: tokenResponse.access_token,
                  refresh_token: tokenResponse.refresh_token || null,
                  expires_at: tokenResponse.expires_in
                    ? new Date(
                        Date.now() + tokenResponse.expires_in * 1000
                      ).toISOString()
                    : null,
                },
              ]);

            if (accountError) {
              return handleError(
                new Error("Failed to store access token"),
                origin
              );
            }
          }
        } catch (error) {
          console.error("Error fetching Facebook pages:", error);
          return handleError(
            new Error("Failed to fetch Facebook pages"),
            origin
          );
        }
      } else {
        // For other platforms, just store the access token
        const { error: accountError } = await supabaseAdmin
          .from("accounts")
          .insert([
            {
              user_id: storedState.user_id,
              platform: storedState.platform,
              access_token: tokenResponse.access_token,
              refresh_token: tokenResponse.refresh_token || null,
              expires_at: tokenResponse.expires_in
                ? new Date(
                    Date.now() + tokenResponse.expires_in * 1000
                  ).toISOString()
                : null,
            },
          ]);

        if (accountError) {
          return handleError(new Error("Failed to store access token"), origin);
        }
      }

      // Clean up the used state
      await supabaseAdmin.from("oauth_states").delete().eq("state", state);

      // Redirect back to the frontend
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders(origin),
          Location: `${config.frontendUrl}/settings?platform=${storedState.platform}&success=true`,
        },
      });
    }

    return handleError(new Error("Invalid endpoint"), origin);
  } catch (error) {
    return handleError(error as Error, origin);
  }
});
