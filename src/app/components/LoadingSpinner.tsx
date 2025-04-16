"use client";

import React from "react";

type LoadingSpinnerProps = {
  message?: string;
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Generating your recipe..."
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-24 h-24">
        <div className="absolute top-0 left-0 w-full h-full border-8 border-gray-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-8 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
      <p className="mt-6 text-xl font-medium text-gray-700">{message}</p>
      <p className="mt-2 text-sm text-gray-500">This might take a moment...</p>
    </div>
  );
};

export default LoadingSpinner; 