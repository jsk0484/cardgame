import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { SHOP_ITEMS } from '../store/shopItems';
import './ShopScreen.css';

interface ShopScreenProps {
  onClose: () => void;
}

const ShopScreen: React.FC<ShopScreenProps> = ({ onClose }) => {
  const { user, buyItem, selectItem } = useAuthStore();
  const [tab, setTab] = useState<'card_back' | 'emote'>('card_back');
  const [msg, setMsg] = useState<string | null>(null);

  const backs = SHOP_ITEMS.filter(i => i.type === 'card_back');
  const emotes = SHOP_ITEMS.filter(i => i.type === 'emote');
  const items = tab === 'card_back' ? backs : emotes;

  const ownedIds: string[] = user?.ownedItems ?? [];
  const selectedBack = user?.selectedCardBack ?? '';

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 2000);
  };

  const handleBuy = async (itemId: string, price: number) => {
    if (!user) { showMsg('로그인이 필요합니다.'); return; }
    if (user.coins < price) { showMsg('코인이 부족합니다.'); return; }
    const ok = await buyItem(itemId, price);
    if (ok) showMsg('구매 완료!');
    else showMsg('구매 실패.');
  };

  const handleSelectBack = async (itemId: string) => {
    if (!user) return;
    await selectItem(itemId, 'card_back');
    showMsg(itemId === '' ? '해제되었습니다.' : '적용 완료!');
  };

  return (
    <div className="shop-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="shop-panel">
        <div className="shop-header">
          <span className="shop-title">★ 상점</span>
          {user && <span className="shop-coins">★ {user.coins} 코인</span>}
          <button className="shop-close" onClick={onClose}>✕</button>
        </div>

        <div className="shop-tabs">
          <button
            className={`shop-tab${tab === 'card_back' ? ' active' : ''}`}
            onClick={() => setTab('card_back')}
          >카드 뒷면</button>
          <button
            className={`shop-tab${tab === 'emote' ? ' active' : ''}`}
            onClick={() => setTab('emote')}
          >감정표현</button>
        </div>

        {msg && <div className="shop-msg">{msg}</div>}

        <div className="shop-items">
          {/* 카드 뒷면 탭: 기본(해제) 옵션 */}
          {tab === 'card_back' && (
            <div className={`shop-item${selectedBack === '' ? ' shop-item-equipped' : ''}`}>
              <div className="shop-preview">
                <div className="shop-card-back-preview shop-back-default">🂠</div>
              </div>
              <div className="shop-item-name">기본</div>
              <button
                className="shop-btn shop-btn-select"
                onClick={() => handleSelectBack('')}
              >
                {selectedBack === '' ? '적용 중' : '기본으로'}
              </button>
            </div>
          )}

          {items.map(item => {
            const owned = ownedIds.includes(item.id);
            const isSelected = tab === 'card_back' && selectedBack === item.id;

            return (
              <div key={item.id} className={`shop-item${isSelected ? ' shop-item-equipped' : ''}${owned ? ' shop-item-owned' : ''}`}>
                <div className="shop-preview">
                  {item.type === 'card_back' ? (
                    <div
                      className="shop-card-back-preview"
                      style={{ background: item.backStyle }}
                    >🂠</div>
                  ) : (
                    <div className="shop-emoji-preview">{item.emoji}</div>
                  )}
                </div>
                <div className="shop-item-name">{item.name}</div>
                {isSelected && <div className="shop-equipped-badge">적용 중</div>}
                {owned && item.type === 'emote' && (
                  <div className="shop-owned-badge">보유 중</div>
                )}
                {!owned ? (
                  <button
                    className="shop-btn shop-btn-buy"
                    onClick={() => handleBuy(item.id, item.price)}
                    disabled={!user || (user.coins ?? 0) < item.price}
                  >
                    ★ {item.price}
                  </button>
                ) : item.type === 'card_back' ? (
                  <button
                    className={`shop-btn ${isSelected ? 'shop-btn-selected' : 'shop-btn-select'}`}
                    onClick={() => handleSelectBack(isSelected ? '' : item.id)}
                  >
                    {isSelected ? '해제' : '적용'}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        {tab === 'emote' && (
          <div className="shop-emote-hint">구매한 감정표현은 게임 중 이모지 바에 자동으로 추가됩니다.</div>
        )}
      </div>
    </div>
  );
};

export default ShopScreen;
