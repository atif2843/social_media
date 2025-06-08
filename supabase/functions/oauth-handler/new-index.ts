// OAuth handler for social media platforms
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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

  // Log request details for debugging
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
    // Get URL parameters
    const url = new URL(req.url);
    const platform = url.searchParams.get("platform");

    if (!platform) {
      return handleError(new Error("Platform parameter is required"), origin);
    }

    // Get Supabase configuration
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return handleError(new Error("Missing Supabase configuration"), origin);
    }

    // Get OAuth configuration
    const clientId = Deno.env.get(`${platform.toUpperCase()}_CLIENT_ID`);
    const clientSecret = Deno.env.get(
      `${platform.toUpperCase()}_CLIENT_SECRET`
    );
    const frontendUrl = Deno.env.get("FRONTEND_URL");
    const edgeFunctionUrl = Deno.env.get("EDGE_FUNCTION_URL");

    // Log environment status (without exposing sensitive values)
    console.log("Environment:", {
      hasSUPABASE_URL: !!supabaseUrl,
      hasSUPABASE_KEY: !!supabaseKey,
      hasFRONTEND_URL: !!frontendUrl,
      hasEDGE_FUNCTION_URL: !!edgeFunctionUrl,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      platform,
    });

    if (!clientId || !clientSecret) {
      return handleError(
        new Error(`${platform} OAuth credentials not configured`),
        origin
      );
    }

    if (!frontendUrl || !edgeFunctionUrl) {
      return handleError(new Error("Missing URL configuration"), origin);
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    console.log("Auth:", {
      hasAuthHeader: !!authHeader,
      headerType: typeof authHeader,
    });

    if (!authHeader) {
      return handleError(
        new Error("Missing authorization header"),
        origin,
        401
      );
    }

    // Validate access token
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    console.log("Auth validation:", {
      hasUser: !!user,
      hasError: !!authError,
      userId: user?.id,
    });

    if (authError || !user) {
      return handleError(new Error("Invalid authorization token"), origin, 401);
    }

    // Handle authorization request
    if (url.pathname.endsWith("/authorize")) {
      const state = crypto.randomUUID();
      const redirectUri = `${edgeFunctionUrl}/oauth-handler/callback`;

      // Store OAuth state
      const { error: stateError } = await supabase.from("oauth_states").insert([
        {
          state,
          user_id: user.id,
          platform,
          created_at: new Date().toISOString(),
        },
      ]);

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

      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("response_type", "code");

      if (platform === "facebook") {
        authUrl.searchParams.set(
          "scope",
          "pages_show_list,pages_read_engagement,pages_manage_posts"
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
    return handleError(error as Error, origin);
  }
});
