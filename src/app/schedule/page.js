"use client";

import dynamic from "next/dynamic";

const PostComposer = dynamic(() => import("@/components/PostComposer"), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 rounded w-full"></div>
      <div className="h-32 bg-gray-200 rounded w-full"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
  ),
});

export default function SchedulePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Schedule a Post</h1>
      <PostComposer />
    </div>
  );
}
