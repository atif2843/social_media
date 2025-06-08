"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import supabase from "@/lib/supabase";
import { socialMediaService } from "@/services/socialMediaService";
import PostPreview from "./PostPreview";

// Platform-specific media support
const platformMediaSupport = {
  Facebook: { image: true, video: true },
  Instagram: { image: true, video: true },
  Twitter: { image: true, video: true },
  LinkedIn: { image: true, video: false },
};

// Character limits for different platforms
const characterLimits = {
  Facebook: 5000,
  Instagram: 2200,
  Twitter: 280,
  LinkedIn: 3000,
};

export default function PostComposer() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("Facebook");
  const [scheduledTime, setScheduledTime] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState("");
  const [mediaPreview, setMediaPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hashtagGroups, setHashtagGroups] = useState([]);
  const [selectedHashtagGroup, setSelectedHashtagGroup] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Set default scheduled time to 1 hour from now
    const now = new Date();
    now.setHours(now.getHours() + 1);
    setScheduledTime(now.toISOString().slice(0, 16));
  }, []);

  useEffect(() => {
    // Load hashtag groups and templates
    const loadHashtagGroupsAndTemplates = async () => {
      try {
        // Load hashtag groups
        const { data: hashtagData, error: hashtagError } = await supabase
          .from("hashtag_groups")
          .select("*")
          .order("name");

        if (hashtagError) throw hashtagError;
        setHashtagGroups(hashtagData || []);

        // Load post templates
        const { data: templateData, error: templateError } = await supabase
          .from("post_templates")
          .select("*, hashtag_groups(*)");

        if (templateError) throw templateError;
        setTemplates(templateData || []);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadHashtagGroupsAndTemplates();
  }, []);

  const addHashtags = () => {
    if (!selectedHashtagGroup) return;

    const group = hashtagGroups.find((g) => g.id === selectedHashtagGroup);
    if (!group) return;

    const hashtags = group.hashtags.join(" ");
    setContent((prev) => {
      // Add a space before hashtags if content doesn't end with one
      const space = prev.endsWith(" ") ? "" : " ";
      return prev + space + hashtags;
    });
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const fileType = file.type.split("/")[0];
    if (fileType !== "image" && fileType !== "video") {
      setError("Invalid file type. Please upload an image or video.");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size too large. Maximum size is 10MB.");
      return;
    }

    // Check if the platform supports this media type
    if (!platformMediaSupport[platform][fileType]) {
      setError(`${platform} does not support ${fileType} uploads`);
      return;
    }

    setMediaFile(file);
    setMediaType(fileType);
    setMediaPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleClearMedia = () => {
    setMediaFile(null);
    setMediaType("");
    setMediaPreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate input
      if (!content.trim()) {
        throw new Error("Please enter some content for your post");
      }

      if (content.length > characterLimits[platform]) {
        throw new Error(`Content exceeds ${platform} character limit`);
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Handle media upload if present
      let mediaUrl = "";
      if (mediaFile) {
        const filePath = `${user.id}/${Date.now()}-${mediaFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(filePath, mediaFile);

        if (uploadError) {
          throw new Error(`Error uploading media: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("media").getPublicUrl(filePath);
        mediaUrl = publicUrl;
      }

      // Create post
      await socialMediaService.createScheduledPost({
        user_id: user.id,
        content,
        scheduled_time: new Date(scheduledTime).toISOString(),
        platform,
        status: "scheduled",
        media_url: mediaUrl,
        media_type: mediaType,
      });

      // Reset form
      setContent("");
      setPlatform("Facebook");
      handleClearMedia();

      toast.success("Post scheduled successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error scheduling post:", error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getCharacterCount = () => {
    const limit = characterLimits[platform] || 5000;
    return `${content.length}/${limit}`;
  };

  const applyTemplate = () => {
    if (!selectedTemplate) return;

    const template = templates.find((t) => t.id === selectedTemplate);
    if (!template) return;

    setContent(template.content);

    // If template has a hashtag group, add the hashtags
    if (template.hashtag_groups) {
      const hashtags = template.hashtag_groups.hashtags.join(" ");
      setContent((prev) => prev + (prev.endsWith(" ") ? "" : " ") + hashtags);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex-1 mr-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {Object.keys(platformMediaSupport).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template
            </label>
            <div className="flex space-x-2">
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={applyTemplate}
                disabled={!selectedTemplate}
                className={`px-4 py-2 rounded ${
                  selectedTemplate
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="4"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder={`Write your ${platform} post...`}
          />
          <div className="text-sm text-gray-500 mt-1 flex justify-between items-center">
            <span>{getCharacterCount()} characters</span>
            <div className="flex items-center space-x-2">
              <select
                value={selectedHashtagGroup}
                onChange={(e) => setSelectedHashtagGroup(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              >
                <option value="">Select hashtag group</option>
                {hashtagGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addHashtags}
                disabled={!selectedHashtagGroup}
                className={`
                  px-3 py-1 rounded text-sm
                  ${
                    selectedHashtagGroup
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }
                `}
              >
                Add Hashtags
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Media
          </label>
          <div className="space-y-2">
            {!mediaFile ? (
              <div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaUpload}
                  className="hidden"
                  id="media-upload"
                />
                <label
                  htmlFor="media-upload"
                  className="cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded inline-block"
                >
                  Choose File
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  {platformMediaSupport[platform].image &&
                  platformMediaSupport[platform].video
                    ? "Upload an image or video for your post"
                    : platformMediaSupport[platform].image
                    ? "Upload an image for your post"
                    : "Upload a video for your post"}
                </p>
              </div>
            ) : (
              <div className="relative">
                {mediaType === "image" ? (
                  <div className="relative w-full max-h-48">
                    <Image
                      src={mediaPreview}
                      alt="Preview"
                      className="rounded"
                      layout="responsive"
                      width={400}
                      height={300}
                      objectFit="contain"
                    />
                  </div>
                ) : (
                  <video
                    src={mediaPreview}
                    className="max-h-48 rounded"
                    controls
                  />
                )}
                <button
                  type="button"
                  onClick={handleClearMedia}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-lg hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Schedule Time
          </label>
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Post Preview</h2>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200"
          >
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
        </div>

        {showPreview && (
          <div className="mb-6">
            <PostPreview
              platform={platform}
              content={content}
              mediaUrl={mediaPreview}
              mediaType={mediaType}
            />
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`
              inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
              ${
                isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              }
            `}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Scheduling...
              </>
            ) : (
              "Schedule Post"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
