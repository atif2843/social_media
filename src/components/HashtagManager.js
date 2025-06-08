"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import supabase from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useStore from "@/lib/store";

export default function HashtagManager() {
  const user = useStore((state) => state.user);
  const [hashtagGroups, setHashtagGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newHashtags, setNewHashtags] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHashtagGroups();
    }
  }, [user]);

  const loadHashtagGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("hashtag_groups")
        .select("*")
        .order("name");

      if (error) throw error;
      setHashtagGroups(data || []);
    } catch (error) {
      console.error("Error loading hashtag groups:", error);
      toast.error("Failed to load hashtag groups");
    } finally {
      setLoading(false);
    }
  };

  const createHashtagGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newHashtags.trim()) {
      toast.error("Please enter both group name and hashtags");
      return;
    }

    try {
      const hashtags = newHashtags
        .split(/[,\s]+/)
        .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
        .filter(Boolean);

      const { error } = await supabase.from("hashtag_groups").insert([
        {
          name: newGroupName.trim(),
          hashtags: hashtags,
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      toast.success("Hashtag group created successfully");
      setNewGroupName("");
      setNewHashtags("");
      loadHashtagGroups();
    } catch (error) {
      console.error("Error creating hashtag group:", error);
      toast.error("Failed to create hashtag group");
    }
  };

  const deleteHashtagGroup = async (groupId) => {
    try {
      const { error } = await supabase
        .from("hashtag_groups")
        .delete()
        .eq("id", groupId);

      if (error) throw error;

      toast.success("Hashtag group deleted successfully");
      loadHashtagGroups();
    } catch (error) {
      console.error("Error deleting hashtag group:", error);
      toast.error("Failed to delete hashtag group");
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Please log in to manage hashtag groups.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Hashtag Manager</h1>

      <Card className="p-6 mb-8">
        <form onSubmit={createHashtagGroup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <Input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g., Tech Events"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hashtags
            </label>
            <Input
              type="text"
              value={newHashtags}
              onChange={(e) => setNewHashtags(e.target.value)}
              placeholder="#tech #events #startup (separated by spaces or commas)"
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter hashtags separated by spaces or commas. The # symbol will be
              added automatically if missing.
            </p>
          </div>

          <Button type="submit">Create Hashtag Group</Button>
        </form>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {hashtagGroups.map((group) => (
          <Card key={group.id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{group.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteHashtagGroup(group.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
            <div className="space-x-2">
              {group.hashtags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
