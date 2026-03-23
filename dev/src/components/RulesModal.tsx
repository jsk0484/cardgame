import React from 'react';
import { useLangStore } from '../store/langStore';
import LangToggle from './LangToggle';
import './RulesModal.css';

interface Props {
  onClose: () => void;
}

const RulesModal: React.FC<Props> = ({ onClose }) => {
  const t = useLangStore(s => s.t);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">HANDOOF</span>
          <div className="modal-header-right">
            <LangToggle />
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="modal-body">
          <section>
            <h3>{t.rules_title}</h3>
            <ul>{t.rules.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </section>
          <section>
            <h3>{t.scoring_title}</h3>
            <ul>{t.scoring.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </section>
          <section>
            <h3>{t.special_title}</h3>
            <ul>{t.special.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
