import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const googleAdsService = {
  /**
   * Get the connected Google Ads account for the current user
   */
  async getConnectedAccount(userId) {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'google_ads')
      .single();
    
    if (error) {
      console.error('Error fetching Google Ads account:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Get all campaigns for the current user
   */
  async getCampaigns(userId) {
    const { data, error } = await supabase
      .from('google_ads_campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
    
    return data;
  },
  
  /**
   * Get a specific campaign by ID
   */
  async getCampaign(campaignId) {
    const { data, error } = await supabase
      .from('google_ads_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    if (error) {
      console.error('Error fetching campaign:', error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Create a new Google Ads campaign
   */
  async createCampaign(campaignData) {
    const { data, error } = await supabase
      .from('google_ads_campaigns')
      .insert([campaignData])
      .select();
    
    if (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
    
    return data[0];
  },
  
  /**
   * Update an existing Google Ads campaign
   */
  async updateCampaign(campaignId, updates) {
    const { data, error } = await supabase
      .from('google_ads_campaigns')
      .update(updates)
      .eq('id', campaignId)
      .select();
    
    if (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
    
    return data[0];
  },
  
  /**
   * Delete a Google Ads campaign
   */
  async deleteCampaign(campaignId) {
    const { error } = await supabase
      .from('google_ads_campaigns')
      .delete()
      .eq('id', campaignId);
    
    if (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
    
    return true;
  },
  
  /**
   * Get ad groups for a specific campaign
   */
  async getAdGroups(campaignId) {
    const { data, error } = await supabase
      .from('google_ads_ad_groups')
      .select('*')
      .eq('campaign_id', campaignId);
    
    if (error) {
      console.error('Error fetching ad groups:', error);
      return [];
    }
    
    return data;
  },
  
  /**
   * Create a new ad group
   */
  async createAdGroup(adGroupData) {
    const { data, error } = await supabase
      .from('google_ads_ad_groups')
      .insert([adGroupData])
      .select();
    
    if (error) {
      console.error('Error creating ad group:', error);
      throw error;
    }
    
    return data[0];
  },
  
  /**
   * Get ads for a specific ad group
   */
  async getAds(adGroupId) {
    const { data, error } = await supabase
      .from('google_ads_ads')
      .select('*')
      .eq('ad_group_id', adGroupId);
    
    if (error) {
      console.error('Error fetching ads:', error);
      return [];
    }
    
    return data;
  },
  
  /**
   * Create a new ad
   */
  async createAd(adData) {
    const { data, error } = await supabase
      .from('google_ads_ads')
      .insert([adData])
      .select();
    
    if (error) {
      console.error('Error creating ad:', error);
      throw error;
    }
    
    return data[0];
  }
};

export default googleAdsService;