// components/auth/ResetPasswordSkeleton.tsx
"use client";

import { motion } from "framer-motion";

function Bone({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-card ${className}`}
    />
  );
}

export default function ResetPasswordSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="relative z-10"
      aria-busy="true"
      aria-label="Loading reset password form"
    >
      {/* Icon badge */}
      <div className="mb-7 flex justify-center">
        <Bone className="h-15.5 w-15.5 rounded-2xl" />
      </div>

      {/* Title + subtitle */}
      <div className="mb-9 flex flex-col items-center gap-3">
        <Bone className="h-7 w-70 rounded-lg" />
        <div className="flex flex-col items-center gap-2">
          <Bone className="h-3.5 w-90 rounded" />
          <Bone className="h-3.5 w-56 rounded" />
        </div>
      </div>

      {/* Password field */}
      <div className="mb-5 flex flex-col gap-2">
        <Bone className="h-3 w-28 rounded" />
        <Bone className="h-13.5 w-full rounded-xl" />
      </div>

      {/* Confirm password field */}
      <div className="mb-8 flex flex-col gap-2">
        <Bone className="h-3 w-34 rounded" />
        <Bone className="h-13.5 w-full rounded-xl" />
      </div>

      {/* Submit button */}
      <Bone className="mb-8 h-13.5 w-full rounded-xl" />

      {/* Divider */}
      <div className="border-t border-edge pt-8 text-center">
        <Bone className="mx-auto h-3.5 w-24 rounded" />
      </div>
    </motion.div>
  );
}