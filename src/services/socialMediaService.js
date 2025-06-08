import supabase from "../lib/supabase";

export const socialMediaService = {
  /**
   * Get all connected social media accounts for a user
   */
  async getConnectedAccounts(userId) {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching connected accounts:", error);
      return [];
    }

    return data;
  },

  /**
   * Get a specific connected account by platform
   */
  async getAccountByPlatform(userId, platform) {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("platform", platform)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      console.error(`Error fetching ${platform} account:`, error);
      return null;
    }

    return data;
  },

  /**
   * Disconnect a social media account
   */
  async disconnectAccount(accountId) {
    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", accountId);

    if (error) {
      console.error("Error disconnecting account:", error);
      throw error;
    }

    return true;
  },

  /**
   * Get recent posts for a user
   */
  async getRecentPosts(userId) {
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .eq("user_id", userId)
      .order("schedule_at", { ascending: true })
      .limit(5);

    if (error) {
      console.error("Error fetching recent posts:", error);
      return [];
    }

    return data;
  },

  /**
   * Create a new scheduled post
   */
  async createScheduledPost(postData) {
    const { data, error } = await supabase
      .from("ads")
      .insert([postData])
      .select();

    if (error) {
      console.error("Error creating scheduled post:", error);
      throw error;
    }

    return data[0];
  },

  /**
   * Update a scheduled post
   */
  async updateScheduledPost(postId, updates) {
    const { data, error } = await supabase
      .from("ads")
      .update(updates)
      .eq("id", postId)
      .select();

    if (error) {
      console.error("Error updating scheduled post:", error);
      throw error;
    }

    return data[0];
  },

  /**
   * Delete a scheduled post
   */
  async deleteScheduledPost(postId) {
    const { error } = await supabase.from("ads").delete().eq("id", postId);

    if (error) {
      console.error("Error deleting scheduled post:", error);
      throw error;
    }

    return true;
  },

  /**
   * Get post logs for a user
   */
  async getPostLogs(userId) {
    const { data, error } = await supabase
      .from("logs")
      .select("*, ads(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching post logs:", error);
      return [];
    }

    return data;
  },

  /**
   * Get platform-specific metadata (like Facebook Pages, Instagram Business Accounts)
   */
  async getPlatformMetadata(userId, platform) {
    const account = await this.getAccountByPlatform(userId, platform);

    if (!account) return null;

    // Return platform-specific metadata
    switch (platform) {
      case "facebook":
        return {
          pageId: account.page_id,
          pageName: account.page_name,
        };
      case "instagram":
        return {
          instagramAccountId: account.instagram_account_id,
          instagramUsername: account.instagram_username,
        };
      case "twitter":
        return {
          username: account.username,
        };
      case "linkedin":
        return {
          profileId: account.profile_id,
          profileName: account.profile_name,
        };
      default:
        return null;
    }
  },

  /**
   * Get recent posts for a user
   */
  async getRecentPosts(userId) {
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_time", { ascending: true })
      .limit(5);

    if (error) {
      console.error("Error fetching recent posts:", error);
      return [];
    }

    return data;
  },
};

export default socialMediaService;
