"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, User, Mail, Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || ""); // Email is displayed (read-only/disabled)
  const [preview, setPreview] = useState<string | null>(user?.avatar || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Build FormData for Multer on backend
      const formData = new FormData();
      formData.append("name", name);
      if (selectedFile) {
        formData.append("avatar", selectedFile);
      }

      // Grab the JWT saved at login (see LoginForm: localStorage.setItem("resumax_token", ...))
      const token = localStorage.getItem("resumax_token");

      const res = await fetch(`http://localhost:3001/api/users/${user?.id}`, {
        method: "PATCH", // or POST depending on your backend route
        body: formData,
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const errorBody = await res.text();
        console.error("Server responded:", res.status, errorBody);
        throw new Error(`Failed to update profile: ${res.status}`);
      }

      const updatedUser = await res.json();

      updateUser({
        ...user!,
        ...updatedUser,
      }); // Update user in context

      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-edge bg-elevated p-6 shadow-2xl z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-edge">
              <h3 className="text-lg font-semibold text-primary">
                Edit Profile
              </h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-secondary hover:bg-card-hover hover:text-primary transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Error banner */}
              {errorMsg && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {errorMsg}
                </div>
              )}

              {/* Avatar Upload Field */}
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="relative group h-24 w-24 rounded-full overflow-hidden border-2 border-edge bg-card flex items-center justify-center">
                  {preview ? (
                    <Image
                      src={preview}
                      alt="Profile preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-secondary" />
                  )}

                  {/* Overlay button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs gap-1 cursor-pointer"
                  >
                    <Camera size={18} />
                    <span>Change</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-secondary hover:text-primary flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload size={12} />
                  <span>Upload image</span>
                </button>
              </div>

              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-secondary">
                  Name
                </label>
                <div className="relative flex items-center">
                  <User size={16} className="absolute left-3 text-secondary" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-edge bg-card pl-9 pr-3 py-2 text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
              </div>

              {/* Email Input (Read-only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-secondary">
                  Email
                </label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3 text-secondary" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full rounded-lg border border-edge bg-card/50 pl-9 pr-3 py-2 text-sm text-secondary opacity-70 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-edge">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}