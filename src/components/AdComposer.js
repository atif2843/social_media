"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import supabase from "@/lib/supabase";
import socialMediaService from "@/services/socialMediaService";

// Platform icons
const PlatformIcon = ({ platform }) => {
  switch (platform) {
    case "Facebook":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
          className="text-blue-600"
        >
          <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z" />
        </svg>
      );
    case "Instagram":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
          className="text-pink-600"
        >
          <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z" />
        </svg>
      );
    case "Twitter":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
          className="text-blue-400"
        >
          <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z" />
        </svg>
      );
    case "LinkedIn":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
          className="text-blue-700"
        >
          <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
        </svg>
      );
    case "Google Ads":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
          className="text-yellow-500"
        >
          <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12.435 12.435 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A19.626 19.626 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a19.587 19.587 0 0 0 1.349-.476l.019-.007.004-.002h.001" />
        </svg>
      );
    default:
      return null;
  }
};

export default function AdComposer() {
  const [content, setContent] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [platform, setPlatform] = useState("Facebook");
  const [user, setUser] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const router = useRouter();

  // Character limits by platform
  const characterLimits = {
    Facebook: 5000,
    Instagram: 2200,
    Twitter: 280,
    LinkedIn: 3000,
    "Google Ads": 300,
  };

  // Media support by platform
  const platformMediaSupport = {
    Facebook: { image: true, video: true },
    Instagram: { image: true, video: true },
    Twitter: { image: true, video: true },
    LinkedIn: { image: true, video: true },
    "Google Ads": { image: true, video: false },
  };

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        try {
          const accounts = await socialMediaService.getConnectedAccounts(
            user.id
          );
          setConnectedAccounts(accounts);
        } catch (error) {
          console.error("Error fetching connected accounts:", error);
        }
      }
    };

    getUser();

    // Set default scheduled time to 1 hour from now
    const now = new Date();
    now.setHours(now.getHours() + 1);
    setScheduledTime(now.toISOString().slice(0, 16));
  }, []);

  // Handle file change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is an image or video
    const fileType = file.type.split("/")[0];
    if (fileType !== "image" && fileType !== "video") {
      setError("File must be an image or video");
      return;
    }

    // Check if selected platform supports this media type
    if (!platformMediaSupport[platform][fileType]) {
      setError(`${platform} does not support ${fileType} uploads`);
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setMediaFile(file);
    setMediaPreview(previewUrl);
    setMediaType(fileType);
    setError(null);
  };

  // Clear selected media
  const handleClearMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!content.trim()) {
        throw new Error("Content cannot be empty");
      }

      if (!scheduledTime) {
        throw new Error("Scheduled time is required");
      }

      // Check if the platform is connected
      const isConnected = connectedAccounts.some(
        (account) => account.platform === platform
      );
      if (!isConnected) {
        throw new Error(
          `You don't have a connected ${platform} account. Please connect it in the settings.`
        );
      }

      let mediaUrl = null;

      // Upload media file if present
      if (mediaFile) {
        const fileExt = mediaFile.name.split(".").pop();
        const fileName = `${Math.random()
          .toString(36)
          .substring(2, 15)}.${fileExt}`;
        const filePath = `${user.id}/${platform.toLowerCase()}/${fileName}`;

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from("media")
          .upload(filePath, mediaFile);

        if (uploadError) {
          throw new Error(`Error uploading media: ${uploadError.message}`);
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("media").getPublicUrl(filePath);

        mediaUrl = publicUrl;
      }

      // Create scheduled post
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

      // Set scheduled time to 1 hour from now
      const now = new Date();
      now.setHours(now.getHours() + 1);
      setScheduledTime(now.toISOString().slice(0, 16));

      // Show success message
      alert("Post scheduled successfully!");

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error scheduling post:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlatformChange = (e) => {
    const selectedPlatform = e.target.value;
    setPlatform(selectedPlatform);

    // If Google Ads is selected, redirect to the Google Ads creation page
    if (selectedPlatform === "Google Ads") {
      router.push("/ads/create");
    }

    // Clear media if new platform doesn't support the current media type
    if (mediaType && !platformMediaSupport[selectedPlatform][mediaType]) {
      handleClearMedia();
      setError(`${selectedPlatform} does not support ${mediaType} uploads`);
    }
  };

  const getCharacterCount = () => {
    const limit = characterLimits[platform] || 5000;
    const count = content.length;
    const percentage = Math.min((count / limit) * 100, 100);

    return {
      count,
      limit,
      percentage,
      isNearLimit: percentage >= 80,
      isOverLimit: percentage >= 100,
    };
  };

  const charCount = getCharacterCount();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Create New Post</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="platform"
          >
            Platform
          </label>
          <div className="relative">
            <select
              id="platform"
              value={platform}
              onChange={handlePlatformChange}
              className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 pl-10 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Twitter">Twitter</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Google Ads">Google Ads</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <PlatformIcon platform={platform} />
            </div>
          </div>
        </div>

        {/* Media Upload Section */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Media Upload{" "}
            {platformMediaSupport[platform].image &&
            platformMediaSupport[platform].video
              ? "(Images & Videos)"
              : platformMediaSupport[platform].image
              ? "(Images Only)"
              : platformMediaSupport[platform].video
              ? "(Videos Only)"
              : "(Not Supported)"}
          </label>

          {(platformMediaSupport[platform].image ||
            platformMediaSupport[platform].video) && (
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
              {!mediaPreview ? (
                <div>
                  <input
                    type="file"
                    id="media-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    accept={`${
                      platformMediaSupport[platform].image ? "image/*," : ""
                    }${platformMediaSupport[platform].video ? "video/*" : ""}`}
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
                  {" "}
                  {mediaType === "image" ? (
                    <Image
                      src={mediaPreview}
                      alt="Preview"
                      width={256}
                      height={256}
                      className="max-h-64 mx-auto rounded-md object-contain"
                    />
                  ) : (
                    <video
                      src={mediaPreview}
                      controls
                      className="max-h-64 mx-auto rounded-md"
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleClearMedia}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
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
          )}
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="content"
          >
            Content
          </label>
          <div className="relative">
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`block w-full bg-white border ${
                charCount.isOverLimit
                  ? "border-red-500"
                  : charCount.isNearLimit
                  ? "border-yellow-500"
                  : "border-gray-300"
              } rounded py-3 px-4 mb-1 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[150px]`}
              placeholder={`What's on your mind? (${charCount.limit} characters max)`}
            />
            <div
              className={`text-xs text-right ${
                charCount.isOverLimit
                  ? "text-red-500 font-bold"
                  : charCount.isNearLimit
                  ? "text-yellow-600"
                  : "text-gray-500"
              }`}
            >
              {charCount.count} / {charCount.limit} characters
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className={`h-1.5 rounded-full ${
                  charCount.isOverLimit
                    ? "bg-red-500"
                    : charCount.isNearLimit
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${charCount.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="scheduledTime"
          >
            Schedule Time
          </label>
          <input
            id="scheduledTime"
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="block w-full bg-white border border-gray-300 rounded py-2 px-4 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isLoading || charCount.isOverLimit}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline flex items-center ${
              isLoading || charCount.isOverLimit
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
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
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Schedule Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
