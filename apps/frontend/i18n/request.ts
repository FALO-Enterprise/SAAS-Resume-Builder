import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

type AppLocale = (typeof routing.locales)[number];

function isSupported(value: string | undefined | null): value is AppLocale {
  return !!value && routing.locales.includes(value as AppLocale);
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale: string | undefined = await requestLocale;

  if (!isSupported(locale)) {
    locale = (await cookies()).get('NEXT_LOCALE')?.value;
  }

  if (!isSupported(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
