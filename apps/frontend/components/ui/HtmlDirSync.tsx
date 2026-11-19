'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

export default function HtmlDirSync() {
  const locale = useLocale();

  useEffect(() => {
    const isArabic = locale === 'ar';
    document.documentElement.lang = locale;
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    document.body.classList.toggle('font-arabic', isArabic);
  }, [locale]);

  return null;
}
