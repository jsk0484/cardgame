import React from 'react';
import { useLangStore } from '../store/langStore';
import './LangToggle.css';

const LangToggle: React.FC = () => {
  const { lang, toggleLang } = useLangStore();

  return (
    <button className="lang-toggle" onClick={toggleLang} title="Toggle Language">
      <span className={lang === 'ko' ? 'lang-active' : ''}>KO</span>
      <span className="lang-divider">|</span>
      <span className={lang === 'en' ? 'lang-active' : ''}>EN</span>
    </button>
  );
};

export default LangToggle;
