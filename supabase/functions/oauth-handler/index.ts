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
  // Be more permissive with origins during development
  if (!origin || !allowedOrigins.includes(origin)) {
    origin = "*"; // Allow any origin for the callback
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*", // Allow all headers for the callback
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400", // Cache preflight for 24 hours
    Vary: "Origin", // Important for caching with multiple origins
  };
};

const handleError = (error: Error, origin: string, status = 400) => {
  console.error("Error details:", {
    message: error.message,
    stack: error.stack,
    status,
    origin,
  });

  // Ensure we always return a properly formatted error response
  return new Response(
    JSON.stringify({
      error: error.message,
      status,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        ...corsHeaders(origin),
        "Content-Type": "application/json",
      },
    }
  );
};

// Helper function to handle OAuth callbacks
const handleOAuthCallback = async (
  code: string,
  state: string,
  platform: string,
  config: EnvConfig,
  supabaseAdmin: any,
  origin: string
) => {
  // Retrieve stored state from database
  const { data: storedState, error: stateError } = await supabaseAdmin
    .from("oauth_states")
    .select("platform, user_id")
    .eq("state", state)
    .single();
  if (stateError || !storedState) {
    console.error(
      "State error:",
      JSON.stringify(
        {
          error: stateError,
          state,
          storedState,
          platform,
        },
        null,
        2
      )
    );
    return handleError(
      new Error(
        `Invalid OAuth state: ${stateError?.message || "No stored state found"}`
      ),
      origin
    );
  }
  // Ensure we have the complete callback URL
  const redirectUri = new URL(
    "/oauth-handler/callback",
    config.edgeFunctionUrl
  ).toString();
  console.log("Redirect URI:", redirectUri); // Debug log

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

  try {
    // For Facebook, fetch pages the user has access to
    if (platform === "facebook") {
      // Get user's Facebook pages
      const pagesUrl = new URL("https://graph.facebook.com/v18.0/me/accounts");
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
          return handleError(new Error("Failed to store access token"), origin);
        }
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
  } catch (error) {
    console.error("Error during OAuth callback:", error);
    return handleError(new Error("Failed to process OAuth callback"), origin);
  }
};

serve(async (req) => {
  const origin = req.headers.get("Origin") || allowedOrigins[0];
  const url = new URL(req.url);

  // Log incoming request details
  const requestDetails = {
    method: req.method,
    url: req.url,
    pathname: url.pathname,
    searchParams: Object.fromEntries(url.searchParams.entries()),
    headers: Object.fromEntries(req.headers.entries()),
  };
  console.log(
    "Incoming request details:",
    JSON.stringify(requestDetails, null, 2)
  );

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders(origin),
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    // Special handling for callback path
    if (url.pathname.endsWith("/callback")) {
      console.log("Processing OAuth callback...");
      const platform = url.searchParams.get("platform") || "facebook"; // Default to facebook for now
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (!code || !state) {
        console.error("Missing callback parameters:", { code, state });
        return handleError(
          new Error("Missing code or state parameter"),
          origin
        );
      }

      // Get configuration for callback
      let config: EnvConfig;
      try {
        config = getEnvConfig(platform);
      } catch (error) {
        console.error("Config error in callback:", error);
        return handleError(error as Error, origin);
      }

      // Initialize Supabase admin client for callback
      const supabaseAdmin = createClient(
        config.supabaseUrl,
        config.supabaseKey
      );
      return await handleOAuthCallback(
        code,
        state,
        platform,
        config,
        supabaseAdmin,
        origin
      );
    }

    // For non-callback paths, proceed with normal flow
    const platform = url.searchParams.get("platform");
    if (!platform) {
      return handleError(new Error("Platform parameter is required"), origin);
    }

    // Get and validate configuration
    let config: EnvConfig;
    try {
      config = getEnvConfig(platform);
    } catch (error) {
      return handleError(error as Error, origin);
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseKey);

    // For /authorize endpoint, require authentication
    if (url.pathname.endsWith("/authorize")) {
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

      // Create OAuth state
      const state = crypto.randomUUID();
      const { error: stateError } = await supabaseAdmin
        .from("oauth_states")
        .insert({
          state,
          user_id: userData.user.id,
          platform,
          created_at: new Date().toISOString(),
        });

      if (stateError) {
        console.error("State storage error:", stateError);
        return handleError(new Error("Failed to store OAuth state"), origin);
      }

      // Build OAuth URL
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

    return handleError(new Error("Invalid endpoint"), origin);
  } catch (error) {
    console.error("Unhandled error:", error);
    return handleError(error as Error, origin);
  }
});
