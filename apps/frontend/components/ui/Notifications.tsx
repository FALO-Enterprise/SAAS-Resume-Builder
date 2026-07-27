"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function RouteNotification() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const message = params.get("message");

    if (message === "login-required") {
      toast.warning("Please log in to access your dashboard.");

      router.replace("/", {
        scroll: false,
      });
    }
  }, [params, router]);

  return null;
}