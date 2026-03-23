import { create } from 'zustand';
import { type Lang, type T, translations } from '../i18n';

interface LangStore {
  lang: Lang;
  t: T;
  toggleLang: () => void;
}

export const useLangStore = create<LangStore>((set) => ({
  lang: 'ko',
  t: translations['ko'] as T,
  toggleLang: () =>
    set((s) => {
      const next: Lang = s.lang === 'ko' ? 'en' : 'ko';
      return { lang: next, t: translations[next] as T };
    }),
}));
