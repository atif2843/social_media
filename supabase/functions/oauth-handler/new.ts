// OAuth handler for social media platforms
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface EnvConfig {
  supabaseUrl: string;
  supabaseKey: string;
  frontendUrl: string;
  edgeFunctionUrl: string;
  clientId: string;
  clientSecret: string;
}

const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];

const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0],
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Credentials": "true",
});

const handleError = (error: Error | string, origin: string, status = 400) => {
  const message = error instanceof Error ? error.message : error;
  console.error("Error:", message);
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json",
    },
  });
};

const getEnvConfig = async (platform: string): Promise<EnvConfig> => {
  const config = {
    supabaseUrl: Deno.env.get("SUPABASE_URL"),
    supabaseKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    frontendUrl: Deno.env.get("FRONTEND_URL"),
    edgeFunctionUrl: Deno.env.get("EDGE_FUNCTION_URL"),
    clientId: Deno.env.get(`${platform.toUpperCase()}_CLIENT_ID`),
    clientSecret: Deno.env.get(`${platform.toUpperCase()}_CLIENT_SECRET`),
  };

  // Log environment check
  console.log("Environment check:", {
    platform,
    hasSUPABASE_URL: !!config.supabaseUrl,
    hasSUPABASE_KEY: !!config.supabaseKey,
    hasFRONTEND_URL: !!config.frontendUrl,
    hasEDGE_FUNCTION_URL: !!config.edgeFunctionUrl,
    hasClientId: !!config.clientId,
    hasClientSecret: !!config.clientSecret,
  });

  // Validate all required values exist
  const missingVars = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(", ")}`);
  }

  return config as EnvConfig;
};

const handleCallback = async (
  url: URL,
  origin: string,
  supabase: any
): Promise<Response> => {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  console.log("Callback parameters:", { code, state });

  if (!code || !state) {
    return handleError("Missing code or state parameter", origin);
  }

  // Get stored state
  const { data: storedState, error: stateError } = await supabase
    .from("oauth_states")
    .select("platform, user_id")
    .eq("state", state)
    .single();

  console.log("State lookup:", { storedState, error: stateError });

  if (stateError || !storedState) {
    return handleError("Invalid OAuth state", origin);
  }

  try {
    const config = await getEnvConfig(storedState.platform);
    const redirectUri = `${config.edgeFunctionUrl}/oauth-handler/callback`;

    // Exchange code for token
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

    console.log("Token exchange:", {
      success: !!tokenResponse.access_token,
      error: tokenResponse.error,
    });

    if (!tokenResponse.access_token) {
      throw new Error(
        tokenResponse.error?.message || "Failed to get access token"
      );
    }

    // Store the access token
    const { error: accountError } = await supabase.from("accounts").insert([
      {
        user_id: storedState.user_id,
        platform: storedState.platform,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || null,
        expires_at: tokenResponse.expires_in
          ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
          : null,
      },
    ]);

    if (accountError) {
      throw new Error("Failed to store access token");
    }

    // Clean up the used state
    await supabase.from("oauth_states").delete().eq("state", state);

    // Redirect back to frontend
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders(origin),
        Location: `${config.frontendUrl}/settings?platform=${storedState.platform}&success=true`,
      },
    });
  } catch (error) {
    return handleError(error, origin);
  }
};

const handleAuthorize = async (
  url: URL,
  origin: string,
  supabase: any,
  authHeader: string
): Promise<Response> => {
  const platform = url.searchParams.get("platform");
  const userId = url.searchParams.get("user_id");

  if (!platform || !userId) {
    return handleError("Missing platform or user_id parameter", origin);
  }

  try {
    // Validate auth token
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return handleError("Invalid authorization token", origin, 401);
    }

    const config = await getEnvConfig(platform);
    const redirectUri = `${config.edgeFunctionUrl}/oauth-handler/callback`;
    const state = crypto.randomUUID();

    // Store OAuth state
    const { error: stateError } = await supabase.from("oauth_states").insert([
      {
        state,
        user_id: userId,
        platform,
        created_at: new Date().toISOString(),
      },
    ]);

    if (stateError) {
      throw new Error("Failed to store OAuth state");
    }

    // Build OAuth URL
    const authUrl = new URL("https://www.facebook.com/v18.0/dialog/oauth");
    authUrl.searchParams.set("client_id", config.clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set(
      "scope",
      "pages_show_list,pages_read_engagement,pages_manage_posts"
    );

    return new Response(JSON.stringify({ url: authUrl.toString() }), {
      status: 200,
      headers: {
        ...corsHeaders(origin),
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleError(error, origin);
  }
};

serve(async (req) => {
  const origin = req.headers.get("Origin") || allowedOrigins[0];

  // Log request details
  console.log("Request:", {
    method: req.method,
    url: req.url,
    origin,
    headers: Object.fromEntries(req.headers.entries()),
  });

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop() || "";

    // Initialize Supabase client
    const config = await getEnvConfig(
      url.searchParams.get("platform") || "facebook"
    );
    const supabase = createClient(config.supabaseUrl, config.supabaseKey);

    console.log("Processing request:", {
      path,
      params: Object.fromEntries(url.searchParams),
    });

    if (path === "callback") {
      return handleCallback(url, origin, supabase);
    }

    if (path === "authorize") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return handleError("Missing authorization header", origin, 401);
      }
      return handleAuthorize(url, origin, supabase, authHeader);
    }

    return handleError("Invalid endpoint", origin);
  } catch (error) {
    return handleError(error, origin);
  }
});
