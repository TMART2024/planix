import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';

/*
 * i18next configuration. English-only at launch, but every user-facing string
 * goes through t() from day one (ARCHITECTURE.md). Retrofitting later is costly.
 */
void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
});

export default i18n;
