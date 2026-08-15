"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { LayoutTemplate, UserCircle, BarChart3, Share2 } from "lucide-react";
import SectionLabel from "../ui/SectionLabel";

const stepIcons = [LayoutTemplate, UserCircle, BarChart3, Share2];
const stepColors = ["#f5a623", "#3b82f6", "#14b8a6", "#a855f7"];

export default function HowItWorksSection() {
  const t = useTranslations("howItWorks");
  const stepKeys = ["template", "info", "check", "export"] as const;

  return (
    <section id="how-it-works" className="section-padding relative">
      <div className="absolute inset-0 bg-linear-to-br from-transparent via-soft/60 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <SectionLabel text={t("label")} color="teal" />
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl lg:text-6xl font-black mt-5 leading-tight font-playfair"
          >
            <span className="text-primary">{t("title")}</span>
            <br />
            <span className="text-gradient-gold">{t("titleHighlight")}</span>
          </motion.h2>
        </div>

        {/* Steps */}
        <div className="relative">
          <div className="grid lg:grid-cols-4 gap-8">
            {stepKeys.map((key, i) => {
              const Icon = stepIcons[i];
              const color = stepColors[i];
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="relative flex flex-col items-center lg:items-start text-center lg:text-left"
                >
                  {/* Step circle */}
                  <div className="relative mb-8 z-10">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center"
                      style={{
                        background: `radial-gradient(circle, ${color}20 0%, ${color}08 100%)`,
                        border: `1px solid ${color}30`,
                        boxShadow: `0 0 30px ${color}20`,
                      }}
                    >
                      <Icon size={32} style={{ color }} />
                    </div>
                    {/* Step number */}
                    <div
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-ink"
                      style={{ background: color }}
                    >
                      {i + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className="text-5xl font-black mb-3 opacity-15 font-playfair"
                    style={{ color: color }}
                  >
                    {t(`steps.${key}.num`)}
                  </div>
                  <h3 className="text-primary font-bold text-xl mb-3">
                    {t(`steps.${key}.title`)}
                  </h3>
                  <p className="text-faint text-sm leading-relaxed">
                    {t(`steps.${key}.desc`)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
