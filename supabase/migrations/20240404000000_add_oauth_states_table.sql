-- Create oauth_states table for storing OAuth state parameters
CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);

-- Add additional fields to accounts table for platform-specific data
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_id TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS page_id TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS page_name TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS instagram_account_id TEXT;

-- Create table for Google Ads campaigns
CREATE TABLE IF NOT EXISTS google_ads_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  campaign_id TEXT,
  campaign_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  budget DECIMAL(10, 2) NOT NULL,
  budget_type TEXT NOT NULL DEFAULT 'daily',
  start_date DATE NOT NULL,
  end_date DATE,
  targeting JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for Google Ads ad groups
CREATE TABLE IF NOT EXISTS google_ads_ad_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES google_ads_campaigns(id) ON DELETE CASCADE,
  ad_group_id TEXT,
  ad_group_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for Google Ads ads
CREATE TABLE IF NOT EXISTS google_ads_ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_group_id UUID NOT NULL REFERENCES google_ads_ad_groups(id) ON DELETE CASCADE,
  ad_id TEXT,
  headline TEXT NOT NULL,
  description TEXT NOT NULL,
  final_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE google_ads_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_ad_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Google Ads campaigns" ON google_ads_campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Google Ads campaigns" ON google_ads_campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google Ads campaigns" ON google_ads_campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google Ads campaigns" ON google_ads_campaigns
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own Google Ads ad groups" ON google_ads_ad_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM google_ads_campaigns c
      WHERE c.id = google_ads_ad_groups.campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own Google Ads ad groups" ON google_ads_ad_groups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM google_ads_campaigns c
      WHERE c.id = google_ads_ad_groups.campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own Google Ads ad groups" ON google_ads_ad_groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM google_ads_campaigns c
      WHERE c.id = google_ads_ad_groups.campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own Google Ads ad groups" ON google_ads_ad_groups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM google_ads_campaigns c
      WHERE c.id = google_ads_ad_groups.campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own Google Ads ads" ON google_ads_ads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM google_ads_ad_groups g
      JOIN google_ads_campaigns c ON c.id = g.campaign_id
      WHERE g.id = google_ads_ads.ad_group_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own Google Ads ads" ON google_ads_ads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM google_ads_ad_groups g
      JOIN google_ads_campaigns c ON c.id = g.campaign_id
      WHERE g.id = google_ads_ads.ad_group_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own Google Ads ads" ON google_ads_ads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM google_ads_ad_groups g
      JOIN google_ads_campaigns c ON c.id = g.campaign_id
      WHERE g.id = google_ads_ads.ad_group_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own Google Ads ads" ON google_ads_ads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM google_ads_ad_groups g
      JOIN google_ads_campaigns c ON c.id = g.campaign_id
      WHERE g.id = google_ads_ads.ad_group_id AND c.user_id = auth.uid()
    )
  );