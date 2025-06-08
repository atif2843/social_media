"use client";

import Image from "next/image";

const platformStyles = {
  Facebook: {
    container: "bg-[#f0f2f5] text-[#050505]",
    header: "bg-white border-b border-gray-200",
    content: "bg-white rounded-lg shadow",
    font: "font-sans",
  },
  Instagram: {
    container: "bg-white text-[#262626]",
    header: "border-b border-gray-200",
    content: "",
    font: "font-sans",
  },
  Twitter: {
    container: "bg-black text-white",
    header: "",
    content: "",
    font: "font-sans",
  },
  LinkedIn: {
    container: "bg-[#f3f2ef] text-[#000000]",
    header: "bg-white border-b border-gray-200",
    content: "bg-white rounded-lg shadow",
    font: "font-sans",
  },
};

export default function PostPreview({
  platform,
  content,
  mediaUrl,
  mediaType,
}) {
  const styles = platformStyles[platform] || platformStyles.Facebook;

  const renderMedia = () => {
    if (!mediaUrl) return null;

    if (mediaType === "image") {
      return (
        <div className="relative aspect-video max-h-[400px] overflow-hidden">
          <Image
            src={mediaUrl}
            alt="Post media"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
          />
        </div>
      );
    }

    if (mediaType === "video") {
      return (
        <video
          src={mediaUrl}
          controls
          className="w-full rounded-lg max-h-[400px]"
        />
      );
    }

    return null;
  };

  const formatContent = (text) => {
    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const mentionRegex = /@[a-zA-Z0-9_]+/g;

    return text.split("\n").map((line, i) => (
      <p key={i} className="mb-2">
        {line.split(" ").map((word, j) => {
          if (word.match(urlRegex)) {
            return (
              <a
                key={j}
                href={word}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {word}
              </a>
            );
          }
          if (word.match(hashtagRegex)) {
            return (
              <span key={j} className="text-blue-600">
                {word}{" "}
              </span>
            );
          }
          if (word.match(mentionRegex)) {
            return (
              <span key={j} className="text-blue-600">
                {word}{" "}
              </span>
            );
          }
          return word + " ";
        })}
      </p>
    ));
  };

  return (
    <div
      className={`w-full max-w-lg mx-auto rounded-lg overflow-hidden ${styles.container} ${styles.font}`}
    >
      <div className={`p-4 ${styles.header}`}>
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="ml-3">
            <div className="font-semibold">Page Name</div>
            <div className="text-sm text-gray-500">Just now</div>
          </div>
        </div>
      </div>
      <div className={`p-4 ${styles.content}`}>
        <div className="mb-4">{formatContent(content)}</div>
        {renderMedia()}
      </div>
    </div>
  );
}
