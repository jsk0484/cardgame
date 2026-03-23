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
          {/* How to Play */}
          <section>
            <h3>{t.rules_title}</h3>
            <ul>{t.rules.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </section>

          {/* Combos */}
          <section>
            <h3>{t.combos_title}</h3>
            <div className="combo-list">
              {t.combos.map((c, i) => (
                <div key={i} className="combo-row">
                  <div className="combo-info">
                    <span className="combo-label">{c.label}</span>
                    <span className="combo-desc">{c.desc}</span>
                  </div>
                  <div className="combo-example">
                    {c.example.map((card, j) => (
                      <span key={j} className={`mini-card ${getSuitClass(card)}`}>{card}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Scoring */}
          <section>
            <h3>{t.scoring_title}</h3>
            <ul>{t.scoring.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </section>

          {/* Special Cards */}
          <section>
            <h3>{t.special_title}</h3>
            <div className="special-card-list">
              {t.special_cards.map((sc, i) => (
                <div key={i} className="special-card-row">
                  <div className="special-card-visual" style={{ '--card-color': sc.color } as React.CSSProperties}>
                    <span className="sc-rank">{sc.rank}</span>
                    <span className="sc-suit">{getSuitSymbol(sc.suit)}</span>
                  </div>
                  <div className="special-card-info">
                    <span className="sc-name">{sc.name} <span className="sc-count">{sc.count}</span></span>
                    <span className="sc-desc">{sc.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

function getSuitClass(card: string): string {
  if (card.startsWith('♥') || card.startsWith('♦')) return 'mini-red';
  if (card.startsWith('♣')) return 'mini-green';
  return 'mini-black';
}

function getSuitSymbol(suit: string): string {
  const map: Record<string, string> = { spade: '♠', heart: '♥', diamond: '♦', club: '♣', joker: '★' };
  return map[suit] ?? '?';
}

export default RulesModal;
