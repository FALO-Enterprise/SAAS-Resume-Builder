"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import type { FilterKey, TemplateCard } from "@/lib/types/resume.types";
import { filters, templates } from "@/lib/placeholder-data/templates.placeholder";
import { useAuth } from "@/context/AuthContext";

/* The six templates laid out on the mat, with the kind filter, the full-page
   preview and the two gates on "Use this template": signed-out visitors are
   asked to log in, and free-plan members are told which plan a paid template
   comes with.

   Both overlays are native <dialog> elements opened with showModal(), so the
   browser supplies the focus trap, Escape and the inert background. */

const FREE_TEMPLATE_ID = "minimal";

export default function TemplateRack() {
  const t = useTranslations("templatesPage");
  const tNotifications = useTranslations("notifications");
  const locale = useLocale();
  const resumeId = useSearchParams().get("resumeId")?.trim() || "";
  const { user, openLogin } = useAuth();
  const isFreeUser = user?.planName === "FREE" || !user?.planName;

  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [preview, setPreview] = useState<TemplateCard | null>(null);
  const [locked, setLocked] = useState<TemplateCard | null>(null);
  const previewRef = useRef<HTMLDialogElement>(null);
  const lockedRef = useRef<HTMLDialogElement>(null);

  const visible = useMemo(
    () =>
      activeFilter === "all"
        ? templates
        : templates.filter((template) => template.category === activeFilter),
    [activeFilter],
  );

  const linkFor = (templateId: string) =>
    resumeId
      ? `/${locale}/resume/preview?resumeId=${encodeURIComponent(resumeId)}&template=${templateId}`
      : `/${locale}/resume/preview?template=${templateId}`;

  const openPreview = (template: TemplateCard) => {
    setPreview(template);
    previewRef.current?.showModal();
  };

  const handleUse = (template: TemplateCard, event: React.MouseEvent) => {
    /* Signed out comes first: `isFreeUser` is also true without a user, and
       telling a logged-out Pro member to upgrade would be wrong. */
    if (!user) {
      event.preventDefault();
      previewRef.current?.close();
      toast.warning(
        tNotifications("loginRequired.template", {
          title: t(`templates.${template.id}.title`),
        }),
        {
          id: "login-required",
          action: { label: tNotifications("logIn"), onClick: openLogin },
        },
      );
      return;
    }

    if (isFreeUser && template.id !== FREE_TEMPLATE_ID) {
      event.preventDefault();
      /* One dialog at a time: the plan prompt takes over from the preview. */
      previewRef.current?.close();
      setLocked(template);
      lockedRef.current?.showModal();
    }
  };

  const planLabel = (templateId: string) =>
    t(templateId === FREE_TEMPLATE_ID ? "studio.plans.free" : "studio.plans.paid");

  const dialogBase =
    "lp m-auto max-h-[92dvh] w-[min(100%-1.5rem,72rem)] overflow-hidden bg-lp-paper p-0 text-lp-ink shadow-(--lp-shadow) backdrop:bg-[#1c1830]/75";

  return (
    <>
      {/* Kind filter */}
      <div
        role="group"
        aria-label={t("studio.filterLabel")}
        className="flex flex-wrap gap-1.5"
      >
        {filters.map((filter) => {
          const on = activeFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              aria-pressed={on}
              onClick={() => setActiveFilter(filter)}
              className={`min-h-11 cursor-pointer px-4 text-[15px] font-semibold transition-colors duration-200 ${
                on
                  ? "bg-lp-tag text-lp-on-tag"
                  : "bg-lp-card text-lp-ink hover:bg-lp-soft"
              }`}
            >
              {t(`filters.${filter}`)}
            </button>
          );
        })}
      </div>
      <div className="lp-ruler mt-3" aria-hidden />

      {/* The rack */}
      <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((template, index) => {
          const title = t(`templates.${template.id}.title`);
          return (
            <li
              key={template.id}
              className="flex flex-col overflow-hidden rounded-lg shadow-(--lp-shadow)"
            >
              <button
                type="button"
                onClick={() => openPreview(template)}
                aria-label={t("studio.previewOf", { name: title })}
                className="lp-sheet group block cursor-zoom-in overflow-hidden rounded-none! shadow-none!"
              >
                <Image
                  src={template.image}
                  alt=""
                  width={840}
                  height={1188}
                  priority={index < 3}
                  sizes="(min-width: 1024px) 400px, (min-width: 640px) 46vw, 92vw"
                  className="block h-auto w-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]"
                />
              </button>

              <div className="flex flex-1 flex-col bg-lp-card p-6 text-lp-ink">
                <h2 className="text-[24px] font-bold leading-tight tracking-[-0.03em] rtl:tracking-normal">
                  {title}
                </h2>
                <p className="mt-2 text-[15.5px] leading-[1.6] text-lp-ink2">
                  {t(`templates.${template.id}.description`)}
                </p>

                <dl className="mt-5 border-t border-lp-rule-strong">
                  <div className="flex items-baseline justify-between gap-4 border-b border-lp-rule py-2.5">
                    <dt className="lp-label text-lp-ink2">
                      {t("studio.madeFor")}
                    </dt>
                    <dd className="text-end text-[14.5px] font-semibold">
                      {t(`templates.${template.id}.field`)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-b border-lp-rule py-2.5">
                    <dt className="lp-label text-lp-ink2">
                      {t("studio.planLabel")}
                    </dt>
                    <dd className="text-end text-[14.5px] font-semibold">
                      {planLabel(template.id)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-6">
                  <Link
                    href={linkFor(template.id)}
                    onClick={(event) => handleUse(template, event)}
                    className="lp-tag lp-tag-sm"
                  >
                    {t("studio.use")}
                    <ArrowRight
                      size={16}
                      aria-hidden
                      className="shrink-0 rtl:-scale-x-100"
                    />
                  </Link>
                  <button
                    type="button"
                    onClick={() => openPreview(template)}
                    className="lp-link cursor-pointer bg-transparent py-2 text-[15px]"
                  >
                    {t("studio.preview")}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {visible.length === 0 && (
        <p className="mt-10 text-[17px] text-lp-ink">{t("studio.empty")}</p>
      )}

      {/* Full-page preview. The image is served as-is: routed through the
          optimiser at this size, the remote host timed out. */}
      <dialog
        ref={previewRef}
        aria-labelledby="template-preview-title"
        onClose={() => setPreview(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) previewRef.current?.close();
        }}
        className={dialogBase}
      >
        {preview && (
          <div className="flex max-h-[92dvh] flex-col lg:grid lg:grid-cols-[22rem_minmax(0,1fr)]">
            <div className="order-2 overflow-y-auto p-6 sm:p-8 lg:order-1">
              <h2
                id="template-preview-title"
                className="lp-display text-[34px]"
              >
                {t(`templates.${preview.id}.title`)}
              </h2>
              <p className="mt-4 text-[16px] leading-[1.6] text-lp-ink2">
                {t(`templates.${preview.id}.description`)}
              </p>
              <dl className="mt-6 border-t border-lp-rule-strong">
                <div className="flex items-baseline justify-between gap-4 border-b border-lp-rule py-2.5">
                  <dt className="lp-label text-lp-ink2">
                    {t("studio.madeFor")}
                  </dt>
                  <dd className="text-end text-[14.5px] font-semibold">
                    {t(`templates.${preview.id}.field`)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-b border-lp-rule py-2.5">
                  <dt className="lp-label text-lp-ink2">
                    {t("studio.planLabel")}
                  </dt>
                  <dd className="text-end text-[14.5px] font-semibold">
                    {planLabel(preview.id)}
                  </dd>
                </div>
              </dl>
              <Link
                href={linkFor(preview.id)}
                onClick={(event) => handleUse(preview, event)}
                className="lp-tag mt-7 w-full justify-between"
              >
                {t("studio.use")}
                <ArrowRight
                  size={18}
                  aria-hidden
                  className="shrink-0 rtl:-scale-x-100"
                />
              </Link>
            </div>

            <div className="lp-mat order-1 flex min-h-0 items-center justify-center p-5 sm:p-8 lg:order-2">
              <Image
                src={preview.image}
                alt={t("studio.imageAlt", {
                  name: t(`templates.${preview.id}.title`),
                })}
                width={1191}
                height={1684}
                unoptimized
                loading="eager"
                className="lp-sheet aspect-210/297 h-[38dvh] w-auto max-w-full object-contain lg:h-[min(82dvh,880px)]"
              />
            </div>

            <button
              type="button"
              onClick={() => previewRef.current?.close()}
              aria-label={t("studio.close")}
              className="absolute inset-e-3 top-3 flex size-11 cursor-pointer items-center justify-center bg-lp-tag text-lp-on-tag"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
        )}
      </dialog>

      {/* Which plan a paid template comes with */}
      <dialog
        ref={lockedRef}
        aria-labelledby="template-plan-title"
        onClose={() => setLocked(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) lockedRef.current?.close();
        }}
        className={`${dialogBase} w-[min(100%-1.5rem,30rem)]!`}
      >
        {locked && (
          <div className="p-7 sm:p-8">
            <h2 id="template-plan-title" className="lp-display text-[30px]">
              {t("studio.upgrade.title")}
            </h2>
            <p className="mt-4 text-[16.5px] leading-[1.6] text-lp-ink2">
              {t("studio.upgrade.body", {
                name: t(`templates.${locked.id}.title`),
              })}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                href={`/${locale}/pricing`}
                onClick={() => lockedRef.current?.close()}
                className="lp-tag"
              >
                {t("studio.upgrade.primary")}
                <ArrowRight
                  size={18}
                  aria-hidden
                  className="shrink-0 rtl:-scale-x-100"
                />
              </Link>
              <Link
                href={linkFor(FREE_TEMPLATE_ID)}
                onClick={() => lockedRef.current?.close()}
                className="lp-link text-[16px]"
              >
                {t("studio.upgrade.secondary")}
              </Link>
            </div>
            <button
              type="button"
              onClick={() => lockedRef.current?.close()}
              aria-label={t("studio.upgrade.close")}
              className="absolute inset-e-3 top-3 flex size-11 cursor-pointer items-center justify-center text-lp-ink hover:bg-lp-soft"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
