"use client";

import { Suspense } from "react";
import DashboardContent from "@/components/DashboardContent.new";
import { toast } from "sonner";

const LoadingFallback = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
