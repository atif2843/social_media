// This Edge Function handles media processing for different platforms
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Sharp from "https://esm.sh/sharp@0.32.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  try {
    // Handle preflight CORS
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { mediaUrl, platform, mediaType } = await req.json();

    if (!mediaUrl || !platform || !mediaType) {
      throw new Error("Missing required parameters");
    }

    // Fetch the media file
    const response = await fetch(mediaUrl);
    const buffer = await response.arrayBuffer();

    let processedBuffer;
    let contentType;

    // Process based on platform requirements
    switch (platform) {
      case "Instagram":
        if (mediaType === "image") {
          processedBuffer = await Sharp(buffer)
            .resize(1080, 1080, { fit: "cover" })
            .jpeg({ quality: 80 })
            .toBuffer();
          contentType = "image/jpeg";
        } else if (mediaType === "video") {
          // Video processing would go here
          // For now, just pass through
          processedBuffer = buffer;
          contentType = "video/mp4";
        }
        break;

      case "Facebook":
        if (mediaType === "image") {
          processedBuffer = await Sharp(buffer)
            .resize(1200, null, { fit: "inside" })
            .jpeg({ quality: 85 })
            .toBuffer();
          contentType = "image/jpeg";
        } else if (mediaType === "video") {
          processedBuffer = buffer;
          contentType = "video/mp4";
        }
        break;

      case "Twitter":
        if (mediaType === "image") {
          processedBuffer = await Sharp(buffer)
            .resize(1200, 675, { fit: "cover" })
            .jpeg({ quality: 85 })
            .toBuffer();
          contentType = "image/jpeg";
        } else if (mediaType === "video") {
          processedBuffer = buffer;
          contentType = "video/mp4";
        }
        break;

      case "LinkedIn":
        if (mediaType === "image") {
          processedBuffer = await Sharp(buffer)
            .resize(1200, 627, { fit: "cover" })
            .jpeg({ quality: 85 })
            .toBuffer();
          contentType = "image/jpeg";
        } else if (mediaType === "video") {
          processedBuffer = buffer;
          contentType = "video/mp4";
        }
        break;

      default:
        throw new Error("Unsupported platform");
    }

    // Upload processed media back to storage
    const timestamp = new Date().getTime();
    const fileName = `processed_${timestamp}_${platform.toLowerCase()}.${
      mediaType === "image" ? "jpg" : "mp4"
    }`;
    const filePath = `processed/${fileName}`;

    const { data: uploadData, error: uploadError } =
      await supabaseClient.storage
        .from("media")
        .upload(filePath, processedBuffer, {
          contentType,
          cacheControl: "3600",
          upsert: false,
        });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL for processed media
    const {
      data: { publicUrl },
    } = supabaseClient.storage.from("media").getPublicUrl(filePath);

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        platform,
        mediaType,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in media-processor:", error);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
