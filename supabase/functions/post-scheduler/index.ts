import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get all scheduled ads that are due for posting
    const now = new Date();
    const { data: scheduledAds, error: fetchError } = await supabaseClient
      .from('ads')
      .select('*, accounts!inner(*)')
      .eq('status', 'scheduled')
      .lte('schedule_at', now.toISOString())
      .order('schedule_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching scheduled ads:', fetchError);
      return new Response(JSON.stringify({ error: 'Error fetching scheduled ads' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`Found ${scheduledAds?.length || 0} ads to process`);

    const results = [];

    // Process each scheduled ad
    for (const ad of scheduledAds || []) {
      try {
        // Check if we have a connected account for this platform
        if (!ad.accounts) {
          await logResult(supabaseClient, ad, 'failed', 'No connected account found');
          results.push({ id: ad.id, status: 'failed', message: 'No connected account found' });
          continue;
        }

        // Process based on platform type
        let postResult;
        if (ad.platform === 'google_ads') {
          postResult = await processGoogleAd(supabaseClient, ad);
        } else {
          // Handle social media posts (Facebook, Instagram, Twitter, LinkedIn)
          postResult = await processSocialMediaPost(supabaseClient, ad);
        }

        results.push(postResult);
      } catch (error) {
        console.error(`Error processing ad ${ad.id}:`, error);
        await logResult(supabaseClient, ad, 'failed', error.message || 'Unknown error');
        results.push({ id: ad.id, status: 'failed', message: error.message || 'Unknown error' });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in post-scheduler function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

/**
 * Process a social media post (Facebook, Instagram, Twitter, LinkedIn)
 */
async function processSocialMediaPost(supabaseClient, ad) {
  console.log(`Processing social media post for platform: ${ad.platform}, ad ID: ${ad.id}`);

  try {
    // In a real implementation, this would use the platform-specific APIs
    // For now, we'll simulate a successful post
    const postId = `post_${Math.random().toString(36).substring(2, 15)}`;
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update the ad status to published
    await supabaseClient
      .from('ads')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', ad.id);
    
    // Log the successful post
    await logResult(supabaseClient, ad, 'success', `Posted successfully with ID: ${postId}`);
    
    return { id: ad.id, status: 'published', message: `Posted successfully with ID: ${postId}` };
  } catch (error) {
    console.error(`Error posting to ${ad.platform}:`, error);
    
    // Update the ad status to failed
    await supabaseClient
      .from('ads')
      .update({ status: 'failed' })
      .eq('id', ad.id);
    
    // Log the failure
    await logResult(supabaseClient, ad, 'failed', error.message || 'Failed to post');
    
    return { id: ad.id, status: 'failed', message: error.message || 'Failed to post' };
  }
}

/**
 * Process a Google Ads campaign
 */
async function processGoogleAd(supabaseClient, ad) {
  console.log(`Processing Google Ads campaign, ad ID: ${ad.id}`);

  try {
    // In a real implementation, this would use the Google Ads API
    // For now, we'll simulate a successful campaign creation
    const campaignId = `campaign_${Math.random().toString(36).substring(2, 15)}`;
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check if this is linked to a Google Ads campaign
    if (ad.google_ads_campaign_id) {
      // Update the campaign status in our database
      await supabaseClient
        .from('google_ads_campaigns')
        .update({ status: 'active', external_campaign_id: campaignId })
        .eq('id', ad.google_ads_campaign_id);
    }
    
    // Update the ad status to published
    await supabaseClient
      .from('ads')
      .update({ 
        status: 'published', 
        published_at: new Date().toISOString(),
        external_id: campaignId
      })
      .eq('id', ad.id);
    
    // Log the successful campaign creation
    await logResult(
      supabaseClient, 
      ad, 
      'success', 
      `Google Ads campaign created successfully with ID: ${campaignId}`
    );
    
    return { 
      id: ad.id, 
      status: 'published', 
      message: `Google Ads campaign created successfully with ID: ${campaignId}` 
    };
  } catch (error) {
    console.error('Error creating Google Ads campaign:', error);
    
    // Update the ad status to failed
    await supabaseClient
      .from('ads')
      .update({ status: 'failed' })
      .eq('id', ad.id);
    
    // If this is linked to a Google Ads campaign, update its status too
    if (ad.google_ads_campaign_id) {
      await supabaseClient
        .from('google_ads_campaigns')
        .update({ status: 'failed' })
        .eq('id', ad.google_ads_campaign_id);
    }
    
    // Log the failure
    await logResult(supabaseClient, ad, 'failed', error.message || 'Failed to create Google Ads campaign');
    
    return { 
      id: ad.id, 
      status: 'failed', 
      message: error.message || 'Failed to create Google Ads campaign' 
    };
  }
}

/**
 * Log the result of a post attempt
 */
async function logResult(supabaseClient, ad, status, message) {
  try {
    await supabaseClient.from('logs').insert([
      {
        user_id: ad.user_id,
        ad_id: ad.id,
        platform: ad.platform,
        status,
        message,
      },
    ]);
  } catch (error) {
    console.error('Error logging result:', error);
  }
}