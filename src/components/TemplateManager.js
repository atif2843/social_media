"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import supabase from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import useStore from "@/lib/store";

export default function TemplateManager() {
  const user = useStore((state) => state.user);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    content: "",
    hashtag_group_id: "",
  });
  const [hashtagGroups, setHashtagGroups] = useState([]);

  useEffect(() => {
    if (user) {
      loadTemplates();
      loadHashtagGroups();
    }
  }, [user]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("post_templates")
        .select(
          `
          *,
          hashtag_groups (
            id,
            name,
            hashtags
          )
        `
        )
        .order("name");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const createTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { error } = await supabase.from("post_templates").insert([
        {
          ...newTemplate,
          user_id: user.id,
          hashtag_group_id: newTemplate.hashtag_group_id || null,
        },
      ]);

      if (error) throw error;

      toast.success("Template created successfully");
      setNewTemplate({ name: "", content: "", hashtag_group_id: "" });
      loadTemplates();
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Failed to create template");
    }
  };

  const deleteTemplate = async (templateId) => {
    try {
      const { error } = await supabase
        .from("post_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;

      toast.success("Template deleted successfully");
      loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Please log in to manage templates.</p>
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
      <h1 className="text-2xl font-bold mb-6">Post Templates</h1>

      <Card className="p-6 mb-8">
        <form onSubmit={createTemplate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name
            </label>
            <Input
              type="text"
              value={newTemplate.name}
              onChange={(e) =>
                setNewTemplate((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Weekly Update"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <Textarea
              value={newTemplate.content}
              onChange={(e) =>
                setNewTemplate((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={4}
              placeholder="Write your template content..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hashtag Group (Optional)
            </label>
            <select
              value={newTemplate.hashtag_group_id}
              onChange={(e) =>
                setNewTemplate((prev) => ({
                  ...prev,
                  hashtag_group_id: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">None</option>
              {hashtagGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit">Create Template</Button>
        </form>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{template.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteTemplate(template.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
            <p className="text-gray-600 text-sm mb-2">{template.content}</p>
            {template.hashtag_groups && (
              <div className="text-sm text-gray-500">
                Hashtag Group: {template.hashtag_groups.name}
                <div className="mt-1 space-x-1">
                  {template.hashtag_groups.hashtags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
