import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { SHOP_ITEMS } from '../store/shopItems';
import './ShopScreen.css';

interface ShopScreenProps {
  onClose: () => void;
}

const ShopScreen: React.FC<ShopScreenProps> = ({ onClose }) => {
  const { user, buyItem, selectItem } = useAuthStore();
  const [tab, setTab] = useState<'card_back' | 'card_emoji'>('card_back');
  const [msg, setMsg] = useState<string | null>(null);

  const backs = SHOP_ITEMS.filter(i => i.type === 'card_back');
  const emojis = SHOP_ITEMS.filter(i => i.type === 'card_emoji');
  const items = tab === 'card_back' ? backs : emojis;

  const ownedIds: string[] = user?.ownedItems ?? [];
  const selectedBack = user?.selectedCardBack ?? '';
  const selectedEmoji = user?.selectedCardEmoji ?? '';

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

  const handleSelect = async (itemId: string, type: 'card_back' | 'card_emoji') => {
    if (!user) { showMsg('로그인이 필요합니다.'); return; }
    await selectItem(itemId, type);
    showMsg('적용 완료!');
  };

  const handleDeselect = async (type: 'card_back' | 'card_emoji') => {
    await selectItem('', type);
    showMsg('해제되었습니다.');
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
            className={`shop-tab${tab === 'card_emoji' ? ' active' : ''}`}
            onClick={() => setTab('card_emoji')}
          >카드 이모지</button>
        </div>

        {msg && <div className="shop-msg">{msg}</div>}

        <div className="shop-items">
          {/* 기본(해제) 옵션 */}
          <div className={`shop-item${(tab === 'card_back' ? selectedBack === '' : selectedEmoji === '') ? ' shop-item-equipped' : ''}`}>
            <div className="shop-preview">
              {tab === 'card_back'
                ? <div className="shop-card-back-preview shop-back-default">🂠</div>
                : <div className="shop-emoji-preview">—</div>
              }
            </div>
            <div className="shop-item-name">기본</div>
            <button
              className="shop-btn shop-btn-select"
              onClick={() => handleDeselect(tab)}
            >
              {(tab === 'card_back' ? selectedBack === '' : selectedEmoji === '') ? '적용 중' : '기본으로'}
            </button>
          </div>

          {items.map(item => {
            const owned = ownedIds.includes(item.id);
            const isSelected = tab === 'card_back' ? selectedBack === item.id : selectedEmoji === item.id;

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
                {!owned ? (
                  <button
                    className="shop-btn shop-btn-buy"
                    onClick={() => handleBuy(item.id, item.price)}
                    disabled={!user || (user.coins ?? 0) < item.price}
                  >
                    ★ {item.price}
                  </button>
                ) : (
                  <button
                    className={`shop-btn ${isSelected ? 'shop-btn-selected' : 'shop-btn-select'}`}
                    onClick={() => isSelected ? handleDeselect(tab) : handleSelect(item.id, item.type)}
                  >
                    {isSelected ? '해제' : '적용'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShopScreen;
