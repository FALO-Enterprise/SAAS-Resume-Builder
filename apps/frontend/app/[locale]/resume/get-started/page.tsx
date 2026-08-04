"use client";

import {
  type ChangeEvent,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileCheck2,
  FilePlus2,
  FileText,
  ScanText,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  WandSparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  useLocale,
  useTranslations,
} from "next-intl";

import Navbar from "@/components/ui/Navbar";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
] as const;

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const SCRATCH_FEATURE_KEYS = [
  "scratch.features.guided",
  "scratch.features.templates",
  "scratch.features.ai",
] as const;

const cardAnimation = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
};

export default function ResumeGetStartedPage() {
  const locale = useLocale();
  const t = useTranslations("resumeStart");

  const isRTL = locale === "ar";

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploadError, setUploadError] =
    useState<string | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadError(null);

    const lowerCaseFileName =
      file.name.toLowerCase();

    const hasAllowedExtension =
      ALLOWED_EXTENSIONS.some((extension) =>
        lowerCaseFileName.endsWith(extension),
      );

    const hasAllowedMimeType =
      ALLOWED_MIME_TYPES.some(
        (mimeType) => mimeType === file.type,
      );

    if (
      !hasAllowedExtension &&
      !hasAllowedMimeType
    ) {
      setSelectedFile(null);
      setUploadError(
        t("upload.invalidType"),
      );

      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setUploadError(
        t("upload.tooLarge"),
      );

      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <main className="relative min-h-dvh overflow-x-clip bg-base text-primary">
      <Navbar />

      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-linear-to-br from-base via-soft to-base" />

        <div className="absolute -inset-s-40 top-20 size-105 rounded-full bg-gold/10 blur-[140px]" />

        <div className="absolute -inset-e-40 bottom-10 size-105 rounded-full bg-azure/10 blur-[140px]" />

        <div className="absolute inset-s-1/2 top-[38%] size-72 -translate-x-1/2 rounded-full bg-vilot/5 blur-[120px]" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-dvh w-full max-w-330 flex-col justify-center px-4 pb-12 pt-32 sm:px-6 sm:pb-16 sm:pt-36 lg:px-8 lg:pb-20 lg:pt-40">
        {/* Heading */}
        <motion.div
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
          className="mx-auto mb-8 w-full max-w-3xl text-center sm:mb-10 lg:mb-12"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 sm:mb-5">
            <Sparkles
              size={14}
              className="shrink-0 text-gold"
            />

            <span className="text-xs font-black uppercase tracking-widest text-gold">
              {t("badge")}
            </span>
          </div>

          <h1 className="font-playfair text-[clamp(32px,5vw,58px)] font-black leading-[1.08] text-primary">
            {t("title")}{" "}
            <span className="text-gradient-gold">
              {t("titleHighlight")}
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-primary! opacity-75 sm:mt-5 sm:text-base sm:leading-8 lg:text-lg">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Choice cards */}
        <div className="grid grid-cols-1 items-stretch gap-5 sm:gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Create a new resume */}
          <motion.article
            variants={cardAnimation}
            initial="hidden"
            animate="visible"
            transition={{
              duration: 0.55,
              delay: 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="group relative h-full overflow-hidden rounded-3xl border border-gold/30 bg-elevated p-5 text-primary shadow-[0_22px_70px_var(--shadow-color)] transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 sm:p-7 lg:min-h-140 lg:p-8"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-linear-to-br from-gold/10 via-transparent to-transparent"
            />

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 shadow-[0_12px_35px_rgba(245,166,35,0.14)] sm:size-16">
                  <FilePlus2
                    size={29}
                    className="text-gold"
                  />
                </div>

                <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-gold">
                  {t("scratch.badge")}
                </span>
              </div>

              <div className="mt-7 sm:mt-8">
                <h2 className="font-playfair text-3xl font-black leading-tight text-primary">
                  {t("scratch.title")}
                </h2>

                <p className="mt-3 text-sm font-semibold leading-7 text-primary! opacity-75 sm:text-base">
                  {t("scratch.description")}
                </p>
              </div>

              <div className="mt-6 space-y-3 sm:mt-7">
                {SCRATCH_FEATURE_KEYS.map(
                  (featureKey) => (
                    <div
                      key={featureKey}
                      className="flex items-start gap-3"
                    >
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-green/10">
                        <Check
                          size={14}
                          className="text-green"
                        />
                      </span>

                      <span className="text-sm font-bold leading-6 text-primary">
                        {t(featureKey)}
                      </span>
                    </div>
                  ),
                )}
              </div>

              <div className="mt-auto pt-7 sm:pt-9">
                <Link
                  href={`/${locale}/templates?source=scratch`}
                  className="group/button flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gold px-4 text-center text-sm font-black text-ink! no-underline shadow-[0_14px_38px_rgba(245,166,35,0.24)] transition-all hover:scale-[1.01] hover:bg-gold-light hover:shadow-[0_18px_48px_rgba(245,166,35,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 sm:min-h-14 sm:px-5 sm:text-base"
                >
                  <WandSparkles
                    size={19}
                    className="shrink-0"
                  />

                  <span className="text-ink!">
                    {t("scratch.button")}
                  </span>

                  <ArrowRight
                    size={18}
                    className={`shrink-0 text-ink! transition-transform ${
                      isRTL
                        ? "rotate-180 group-hover/button:-translate-x-1"
                        : "group-hover/button:translate-x-1"
                    }`}
                  />
                </Link>
              </div>
            </div>
          </motion.article>

          {/* Upload an existing resume */}
          <motion.article
            variants={cardAnimation}
            initial="hidden"
            animate="visible"
            transition={{
              duration: 0.55,
              delay: 0.16,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="group relative h-full overflow-hidden rounded-3xl border border-azure-light/30 bg-elevated p-5 text-primary shadow-[0_22px_70px_var(--shadow-color)] transition-all duration-300 hover:-translate-y-1 hover:border-azure-light/60 sm:p-7 lg:min-h-140 lg:p-8"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-linear-to-br from-azure/10 via-transparent to-transparent"
            />

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-azure-light/35 bg-azure/10 shadow-[0_12px_35px_rgba(59,130,246,0.14)] sm:size-16">
                <UploadCloud
                  size={29}
                  className="text-azure-light"
                />
              </div>

              <div className="mt-7 sm:mt-8">
                <h2 className="font-playfair text-3xl font-black leading-tight text-primary">
                  {t("upload.title")}
                </h2>

                <p className="mt-3 text-sm font-semibold leading-7 text-primary! opacity-75 sm:text-base">
                  {t("upload.description")}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <UploadBenefit
                  icon={ShieldCheck}
                  text={t("trust.secure")}
                />

                <UploadBenefit
                  icon={FileCheck2}
                  text={t("trust.preserve")}
                />

                <UploadBenefit
                  icon={ScanText}
                  text={t("trust.fast")}
                />
              </div>

              <div className="mt-auto pt-7 sm:pt-9">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="sr-only"
                  aria-label={t("upload.button")}
                  aria-describedby="resume-upload-help"
                />

                {selectedFile ? (
                  <div className="rounded-2xl border border-green/30 bg-green/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-green/25 bg-green/10">
                        <FileText
                          size={21}
                          className="text-green"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black uppercase tracking-widest text-green!">
                          {t("upload.selected")}
                        </p>

                        <p className="mt-1 truncate text-sm font-black text-primary!">
                          {selectedFile.name}
                        </p>

                        <p className="mt-0.5 text-xs font-semibold leading-5 text-primary! opacity-75">
                          {formatFileSize(
                            selectedFile.size,
                          )}
                          {" · "}
                          {t("upload.ready")}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        aria-label={t(
                          "upload.remove",
                        )}
                        title={t("upload.remove")}
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-edge bg-card text-primary! opacity-75 transition-all hover:border-pink/40 hover:bg-pink/10 hover:text-pink! hover:opacity-100"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border border-azure bg-azure px-4 text-center text-sm font-black text-white! shadow-[0_14px_38px_rgba(29,78,216,0.28)] transition-all hover:scale-[1.01] hover:border-azure-light hover:bg-azure-light hover:shadow-[0_18px_48px_rgba(59,130,246,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure-light/50 sm:min-h-14 sm:px-5 sm:text-base"
                  >
                    <UploadCloud
                      size={19}
                      className="shrink-0 text-white!"
                    />

                    <span className="text-white!">
                      {t("upload.button")}
                    </span>
                  </button>
                )}

                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-azure-light/40 bg-azure/10 px-4 text-sm font-black text-azure-light! transition-colors hover:border-azure-light hover:bg-azure/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure-light/40"
                  >
                    <UploadCloud size={16} />

                    {t("upload.changeButton")}
                  </button>
                )}

                <p
                  id="resume-upload-help"
                  className="mt-3 text-center text-xs font-semibold leading-5 text-primary! opacity-65"
                >
                  {t("upload.accepted")}
                </p>

                {uploadError && (
                  <p
                    role="alert"
                    aria-live="assertive"
                    className="mt-3 rounded-xl border border-pink/30 bg-pink/10 px-3 py-2.5 text-center text-xs font-bold leading-5 text-pink!"
                  >
                    {uploadError}
                  </p>
                )}
              </div>
            </div>
          </motion.article>
        </div>
      </section>
    </main>
  );
}

type UploadBenefitProps = {
  icon: LucideIcon;
  text: string;
};

function UploadBenefit({
  icon: Icon,
  text,
}: UploadBenefitProps) {
  return (
    <div className="flex min-h-14 items-center gap-2.5 rounded-xl border border-edge bg-card px-3 py-3 sm:flex-col sm:justify-center sm:text-center lg:flex-row lg:justify-start lg:text-start xl:flex-col xl:justify-center xl:text-center">
      <Icon
        size={17}
        className="shrink-0 text-azure-light"
      />

      <span className="text-xs font-bold leading-5 text-primary opacity-75">
        {text}
      </span>
    </div>
  );
}

function formatFileSize(
  sizeInBytes: number,
): string {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(
      sizeInBytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    sizeInBytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}