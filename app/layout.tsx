import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResuMax — Trusted. Global. Effortless.",
  description: "Build world-class resumes & CVs that follow global standards.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
