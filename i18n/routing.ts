import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'hi', 'bn', 'te', 'mr', 'ta'],
  defaultLocale: 'en',
  localePrefix: 'never',
});
