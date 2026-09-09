"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  Send,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { sendSupportMessage } from "@/lib/api/support";
import { getErrorMessage } from "@/lib/api/errors";
import type { HelpTopic } from "@/lib/types/help.types";

type FieldName = "name" | "email" | "topic" | "message";
type Errors = Partial<Record<FieldName, string>>;

const MIN_MESSAGE_LENGTH = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm({ supportEmail }: { supportEmail: string }) {
  const t = useTranslations("help.contact");
  const locale = useLocale();
  const { user } = useAuth();

  const topics = t.raw("topics") as HelpTopic[];

  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
    website: "", // honeypot
  });
  // Only fields the user has already left get validated as they go — flagging
  // a field they have not finished reads as accusatory.
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Signed-in users should not retype what we already know.
  const [prefilled, setPrefilled] = useState(false);
  if (!prefilled && user && (user.name || user.email)) {
    setPrefilled(true);
    setForm((f) => ({
      ...f,
      name: f.name || user.name || "",
      email: f.email || user.email || "",
    }));
  }

  const errors = useMemo<Errors>(() => {
    const e: Errors = {};
    if (!form.name.trim()) e.name = t("errors.name");
    if (!form.email.trim()) e.email = t("errors.email");
    else if (!EMAIL_PATTERN.test(form.email.trim()))
      e.email = t("errors.emailInvalid");
    if (!form.topic) e.topic = t("errors.topic");
    if (!form.message.trim()) e.message = t("errors.message");
    else if (form.message.trim().length < MIN_MESSAGE_LENGTH)
      e.message = t("errors.messageShort");
    return e;
  }, [form, t]);

  const mutation = useMutation({
    mutationFn: () =>
      sendSupportMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        topic: form.topic,
        message: form.message.trim(),
        locale,
        website: form.website,
      }),
  });

  /** Inline errors appear once a field is blurred, or once submit is attempted. */
  const visible = (field: FieldName) =>
    (touched[field] || submitted) && errors[field] ? errors[field] : undefined;

  const summaryErrors = submitted
    ? (Object.keys(errors) as FieldName[]).map((f) => errors[f]!)
    : [];

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);

    if (Object.keys(errors).length > 0) {
      // Move focus to the summary so screen-reader and keyboard users are told
      // why nothing was sent.
      summaryRef.current?.focus();
      return;
    }

    mutation.mutate();
  };

  const reset = () => {
    setForm({ name: "", email: "", topic: "", message: "", website: "" });
    setTouched({});
    setSubmitted(false);
    setPrefilled(false);
    mutation.reset();
  };

  /* ── Success replaces the form in place ─────────────────────────────── */
  if (mutation.isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-edge p-8 text-center sm:p-10"
        role="status"
      >
        <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-gold/25 bg-gold/12 text-gold">
          <CheckCircle2 size={24} />
        </span>
        <p className="mb-2 font-playfair text-xl font-bold text-primary">
          {t("successTitle")}
        </p>
        <p className="mx-auto mb-6 max-w-sm text-[14px] leading-[1.75] text-secondary">
          {t("successBody")}
        </p>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer rounded-xl border border-edge bg-card px-4 py-2 text-[13px] font-semibold text-secondary transition-colors hover:text-primary"
        >
          {t("successAgain")}
        </button>
      </motion.div>
    );
  }

  const fieldClass = (field: FieldName) =>
    `w-full rounded-xl border bg-card px-4 py-3 text-[14.5px] text-primary outline-none transition-all placeholder:text-muted ${
      visible(field)
        ? "border-pink-light/50"
        : "border-edge focus:border-gold/50 focus:shadow-[0_0_0_3px_rgba(245,166,35,0.08)]"
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Error summary — shown in addition to the inline messages, never
          instead of them. */}
      {summaryErrors.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-xl border border-pink-light/30 bg-pink/[0.07] p-4 outline-none"
        >
          <p className="mb-2 flex items-center gap-2 text-[13px] font-bold text-pink-light">
            <AlertCircle size={15} />
            {t("errorSummary")}
          </p>
          <ul className="space-y-1 ps-6">
            {summaryErrors.map((message) => (
              <li
                key={message}
                className="list-disc text-[12.5px] text-secondary"
              >
                {message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="support-name" label={t("name")} error={visible("name")}>
          <input
            id="support-name"
            type="text"
            value={form.name}
            dir="auto"
            autoComplete="name"
            placeholder={t("namePlaceholder")}
            aria-invalid={Boolean(visible("name"))}
            aria-describedby={visible("name") ? "support-name-error" : undefined}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            className={fieldClass("name")}
          />
        </Field>

        <Field id="support-email" label={t("email")} error={visible("email")}>
          <input
            id="support-email"
            type="email"
            value={form.email}
            dir="ltr"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            aria-invalid={Boolean(visible("email"))}
            aria-describedby={
              visible("email") ? "support-email-error" : undefined
            }
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
            className={`${fieldClass("email")} text-start`}
          />
        </Field>
      </div>

      <Field id="support-topic" label={t("topic")} error={visible("topic")}>
        <select
          id="support-topic"
          value={form.topic}
          aria-invalid={Boolean(visible("topic"))}
          aria-describedby={visible("topic") ? "support-topic-error" : undefined}
          onChange={(e) => setForm({ ...form, topic: e.target.value })}
          onBlur={() => setTouched((prev) => ({ ...prev, topic: true }))}
          className={`${fieldClass("topic")} cursor-pointer appearance-none`}
        >
          <option value="" disabled>
            {t("topic")}
          </option>
          {topics.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="support-message"
        label={t("message")}
        error={visible("message")}
        hint={t("messageHint")}
      >
        <textarea
          id="support-message"
          rows={6}
          value={form.message}
          dir="auto"
          placeholder={t("messagePlaceholder")}
          aria-invalid={Boolean(visible("message"))}
          aria-describedby={
            visible("message") ? "support-message-error" : "support-message-hint"
          }
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          onBlur={() => setTouched((prev) => ({ ...prev, message: true }))}
          className={`${fieldClass("message")} resize-y leading-[1.7]`}
        />
      </Field>

      {/* Honeypot. Hidden from people, offered to bots. */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="support-website">Website</label>
        <input
          id="support-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
        />
      </div>

      {mutation.isError && (
        <p
          role="alert"
          className="flex items-center gap-2 text-[13px] text-pink-light"
        >
          <AlertCircle size={15} className="shrink-0" />
          {/* The backend's own reason (rate limit, rejected address) is more
              useful than a blanket network string; it falls back to that. */}
          {getErrorMessage(mutation.error, t("errors.network"))}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <p className="flex items-center gap-2 text-[12.5px] text-muted">
          <Clock3 size={14} className="shrink-0 text-gold/70" />
          {t("replyNote")}
        </p>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gold px-6 py-3 text-[14px] font-bold text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {t("submitting")}
            </>
          ) : (
            <>
              <Send size={16} />
              {t("submit")}
            </>
          )}
        </button>
      </div>

      <p className="border-t border-edge pt-5 text-[12.5px] text-muted">
        {t("fallback")}{" "}
        <a
          href={`mailto:${supportEmail}`}
          dir="ltr"
          className="font-semibold text-gold underline decoration-gold/30 underline-offset-4 hover:decoration-gold"
        >
          {supportEmail}
        </a>
      </p>
    </form>
  );
}

/** Label above the field — never a placeholder standing in for one, which
 *  disappears the moment someone types and breaks under RTL reflow. */
function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-secondary">
        {label}
      </label>
      {children}
      {error ? (
        <motion.p
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          id={`${id}-error`}
          className="flex items-center gap-1.5 text-[12px] text-pink-light"
        >
          <AlertCircle size={12} className="shrink-0" />
          {error}
        </motion.p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-[12px] text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
