import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '../locales/en/translation.json';
import vi from '../locales/vi/translation.json';
import zh from '../locales/zh/translation.json';
import tw from '../locales/tw/translation.json';

const resources = {
  'en-US': { translation: en },
  'vi-VN': { translation: vi },
  'zh-CN': { translation: zh },
  'zh-TW': { translation: tw },
};

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en-US', // Ngôn ngữ mặc định
    detection: {
      order: ['localStorage', 'navigator'], // Thứ tự phát hiện ngôn ngữ
      caches: ['localStorage'], // Lưu ngôn ngữ vào localStorage
    },
    interpolation: {
      escapeValue: false, // React đã xử lý việc escape
    },
  });