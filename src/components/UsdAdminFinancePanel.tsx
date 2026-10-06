import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, UsdTransactionRequest, UsdTransactionType } from '../types/game';
import {
  loadUsdRequests,
  sendUsdChatMessage,
  approveUsdRequest,
  rejectUsdRequest,
  adminAdjustUserUsd,
  loadAllUsers,
} from '../services/storage';
import { sound } from '../services/audio';
import { UserAvatar } from './UserAvatar';
import { GAME_VISUALS } from '../assets/visuals';

interface UsdAdminFinancePanelProps {
  currentUser?: UserProfile;
}

export const UsdAdminFinancePanel: React.FC<UsdAdminFinancePanelProps> = ({ currentUser }) => {
  const [requests, setRequests] = useState<UsdTransactionRequest[]>(() => loadUsdRequests());
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'deposit' | 'withdraw' | 'trade_support'>('all');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Manual adjust modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustDelta, setAdjustDelta] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState('هدیه مدیریت / تسویه');

  // Reject reason modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState('فیش یا مشخصات نامعتبر است');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Refresh every 2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setRequests(loadUsdRequests());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const adminProfile = currentUser || {
    id: 'user_admin',
    username: 'Mahdimirzapor',
    displayName: 'مهدی میرزاپور (مدیر کل)',
    role: 'admin' as const,
    avatar: GAME_VISUALS.rostam,
  };

  const filteredRequests = requests.filter((r) => {
    if (filterType === 'pending') return r.status === 'pending';
    if (filterType === 'deposit') return r.type === 'deposit';
    if (filterType === 'withdraw') return r.type === 'withdraw';
    if (filterType === 'trade_support') return r.type === 'trade_support';
    return true;
  });

  const selectedRequest = requests.find((r) => r.id === selectedRequestId) || filteredRequests[0] || null;

  const allUsers = loadAllUsers();
  const targetUser = selectedRequest ? allUsers.find((u) => u.id === selectedRequest.userId) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedRequest?.messages]);

  const handleSendAdminReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminReplyText.trim() || !selectedRequest) return;

    const ok = sendUsdChatMessage(selectedRequest.id, adminProfile as any, adminReplyText.trim());
    if (ok) {
      sound.play('select');
      setAdminReplyText('');
      setRequests(loadUsdRequests());
    }
  };

  const handleApprove = (req: UsdTransactionRequest) => {
    sound.play('click');
    setErrorNotice(null);
    const res = approveUsdRequest(req.id, adminProfile as any);
    if (res.success) {
      sound.play('coin');
      setNotice(
        req.type === 'deposit'
          ? `درخواست واریز $${req.amount} تایید شد و موجودی کاربر شارژ گردید!`
          : `درخواست برداشت $${req.amount} تایید و نهایی شد!`
      );
      setRequests(loadUsdRequests());
      setTimeout(() => setNotice(null), 4000);
    } else {
      sound.play('hit');
      setErrorNotice(res.error || 'خطا در تایید');
    }
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    sound.play('click');
    setErrorNotice(null);
    const res = rejectUsdRequest(selectedRequest.id, adminProfile as any, rejectReasonText);
    if (res.success) {
      sound.play('select');
      setNotice(`درخواست رد شد و به کاربر اطلاع داده شد.`);
      setShowRejectModal(false);
      setRequests(loadUsdRequests());
      setTimeout(() => setNotice(null), 4000);
    } else {
      sound.play('hit');
      setErrorNotice(res.error || 'خطا در رد');
    }
  };

  const handleAdjustUserUsd = () => {
    if (!selectedRequest || !targetUser) return;
    const res = adminAdjustUserUsd(targetUser.id, adjustDelta, adjustReason);
    if (res.success) {
      sound.play('coin');
      setNotice(`موجودی کاربر تغییر یافت. موجودی جدید: $${res.newBalance}`);
      setShowAdjustModal(false);
      setRequests(loadUsdRequests());
      setTimeout(() => setNotice(null), 4000);
    } else {
      sound.play('hit');
      setErrorNotice(res.error || 'خطا در تغییر موجودی');
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="flex flex-col gap-5 select-none">
      {/* Top Banner */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-amber-300 flex items-center gap-2">
              <span>💵</span>
              <span>مدیریت تراکنش‌های دلاری و گفتگوی مستقیم با خریداران و فروشندگان</span>
            </h2>
            {pendingCount > 0 && (
              <span className="bg-rose-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow animate-pulse">
                {pendingCount} درخواست در انتظار
              </span>
            )}
          </div>
          <p className="text-xs text-stone-400 mt-1">
            بررسی واریزها (شارژ بالای ۱۰$)، برداشت‌ها (تسویه بالای ۲۰$) و پشتیبانی مستقیم از خریداران و فروشندگان کارت‌های بازارچه
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-stone-950 p-1.5 rounded-2xl border border-stone-800 overflow-x-auto">
          {[
            { id: 'all', label: 'همه' },
            { id: 'pending', label: `در انتظار (${pendingCount})` },
            { id: 'deposit', label: 'واریزها' },
            { id: 'withdraw', label: 'برداشت‌ها' },
            { id: 'trade_support', label: 'معاملات کارت' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                sound.play('click');
                setFilterType(f.id as any);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterType === f.id
                  ? 'bg-amber-500 text-stone-950 font-black shadow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs p-3.5 rounded-2xl text-center shadow animate-in fade-in font-bold">
          ✓ {notice}
        </div>
      )}
      {errorNotice && (
        <div className="bg-rose-950/90 border border-rose-500 text-rose-200 text-xs p-3.5 rounded-2xl text-center shadow animate-in fade-in font-bold">
          ⚠️ {errorNotice}
        </div>
      )}

      {/* Main 2-Column Split: Requests List (Left/4 Cols) & Active Conversation/Controls (Right/8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[560px]">
        {/* Left Column: Request Cards (4 Cols) */}
        <div className="lg:col-span-4 bg-stone-900/90 border border-stone-800 rounded-3xl p-3.5 flex flex-col gap-2 max-h-[640px] overflow-y-auto no-scrollbar shadow-xl">
          <div className="text-xs font-black text-stone-300 px-2 py-1 border-b border-stone-800 flex justify-between items-center">
            <span>لیست درخواست‌ها ({filteredRequests.length})</span>
            <span className="text-[11px] text-amber-400">به‌روزرسانی خودکار</span>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-xs">درخواستی یافت نشد.</div>
          ) : (
            filteredRequests.map((r) => {
              const isSel = selectedRequest?.id === r.id;
              const isDep = r.type === 'deposit';
              const isWith = r.type === 'withdraw';

              return (
                <div
                  key={r.id}
                  onClick={() => {
                    sound.play('click');
                    setSelectedRequestId(r.id);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSel
                      ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                      : 'bg-stone-950/70 border-stone-800/80 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserAvatar avatar={r.userAvatar} size="xs" />
                      <span className="text-xs font-bold text-amber-200 truncate max-w-[110px]">
                        {r.displayName}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                        r.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : r.status === 'rejected'
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : 'bg-amber-950 text-amber-300 border-amber-500 animate-pulse'
                      }`}
                    >
                      {r.status === 'completed' ? 'تایید شده' : r.status === 'rejected' ? 'رد شده' : 'در انتظار تایید'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-800/50">
                    <span
                      className={`font-black flex items-center gap-1 ${
                        isDep ? 'text-emerald-400' : isWith ? 'text-amber-400' : 'text-cyan-400'
                      }`}
                    >
                      <span>{isDep ? '📥 شارژ' : isWith ? '📤 برداشت' : '🤝 هماهنگی معامله'}</span>
                      {r.amount > 0 && <span>${r.amount}</span>}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {new Date(r.updatedAt).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {r.note && (
                    <p className="text-[10px] text-stone-400 truncate bg-stone-900/60 px-2 py-0.5 rounded">
                      {r.note}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Conversation & Transaction Action Toolbar (8 Cols) */}
        <div className="lg:col-span-8 bg-stone-900/90 border border-stone-800 rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-xl min-h-[580px]">
          {selectedRequest ? (
            <div className="flex-1 flex flex-col justify-between">
              {/* Header: User Information & Action Buttons */}
              <div className="bg-stone-950/80 border border-stone-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3">
                  <UserAvatar avatar={selectedRequest.userAvatar} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-amber-200">
                        {selectedRequest.displayName}
                      </span>
                      <span className="text-[11px] text-stone-400">(@{selectedRequest.username})</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-stone-300 mt-0.5">
                      <span>
                        موجودی دلار کاربر: <b className="text-emerald-400 font-bold">${targetUser?.usd ?? 0}</b>
                      </span>
                      <span>|</span>
                      <span>
                        درخواست: <b className="text-amber-300">${selectedRequest.amount}</b>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {selectedRequest.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedRequest)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1"
                      >
                        <span>✓</span>
                        <span>{selectedRequest.type === 'deposit' ? 'تایید و شارژ دلار' : 'تایید و تسویه'}</span>
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        className="px-3 py-1.5 bg-rose-800 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1"
                      >
                        <span>✕</span>
                        <span>رد درخواست</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setShowAdjustModal(true)}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition cursor-pointer"
                    title="تغییر مستقیم موجودی دلاری این کاربر"
                  >
                    <span>⚙️ شارژ / کسر دستی</span>
                  </button>
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 my-3 p-3.5 bg-stone-950/60 border border-stone-800/80 rounded-2xl overflow-y-auto flex flex-col gap-2.5 max-h-[380px]">
                {selectedRequest.messages.map((m) => {
                  const isAdmin = m.senderRole === 'admin';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-stone-400">
                        {isAdmin ? (
                          <span className="font-bold text-amber-300">👑 شما (مدیر کل)</span>
                        ) : (
                          <span className="font-bold text-stone-300">{m.senderName} (کاربر)</span>
                        )}
                        <span>
                          {new Date(m.timestamp).toLocaleTimeString('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-md ${
                          isAdmin
                            ? 'bg-amber-950/80 border border-amber-500/50 text-amber-100 rounded-tl-none'
                            : 'bg-stone-800 border border-stone-700 text-stone-100 rounded-tr-none'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Presets */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                {[
                  'فیش واریز شما تایید شد و حسابتان شارژ گردید.',
                  'مبلغ درخواستی به شماره شبا / ولت تتر شما واریز شد.',
                  'لطفاً عکس فیش یا هش تراکنش را بفرستید.',
                  'معامله کارت در بازارچه تایید شد، موفق باشید.',
                ].map((txt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAdminReplyText(txt)}
                    className="shrink-0 bg-stone-800 hover:bg-stone-700 text-stone-300 px-2.5 py-1 rounded-lg border border-stone-700 cursor-pointer"
                  >
                    {txt}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendAdminReply} className="flex gap-2 items-center mt-2">
                <input
                  type="text"
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  placeholder="پاسخ مستقیم مدیر کل برای کاربر..."
                  className="flex-1 bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black px-5 py-2.5 rounded-xl text-xs transition cursor-pointer shadow flex items-center gap-1.5"
                >
                  <span>ارسال پاسخ</span>
                  <span>📤</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-stone-500 text-xs">
              یک درخواست یا گفتگو را از ستون کناری انتخاب کنید.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Adjust USD Balance */}
      {showAdjustModal && targetUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-amber-500 rounded-3xl p-5 max-w-sm w-full flex flex-col gap-4 text-xs shadow-2xl">
            <h3 className="text-sm font-black text-amber-300">
              شارژ یا کسر دستی موجودی دلار ({targetUser.displayName})
            </h3>
            <p className="text-stone-300 text-[11px]">
              موجودی فعلی کاربر: <b className="text-emerald-400">${targetUser.usd || 0}</b>
            </p>

            <div>
              <label className="text-stone-300 font-bold block mb-1">
                مقدار تغییر به دلار (عدد مثبت برای افزایش، عدد منفی برای کسر):
              </label>
              <input
                type="number"
                step={1}
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(parseInt(e.target.value) || 0)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold"
              />
            </div>

            <div>
              <label className="text-stone-300 font-bold block mb-1">دلیل تغییر:</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleAdjustUserUsd}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl cursor-pointer"
              >
                اعمال تغییرات
              </button>
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="py-2.5 px-4 bg-stone-800 text-stone-300 rounded-xl cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Reject Reason */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-rose-500 rounded-3xl p-5 max-w-sm w-full flex flex-col gap-4 text-xs shadow-2xl">
            <h3 className="text-sm font-black text-rose-300">رد درخواست کاربر</h3>
            <p className="text-stone-300 text-[11px]">
              دلیل رد درخواست را جهت ثبت در گفتگوی کاربر وارد کنید:
            </p>

            <input
              type="text"
              value={rejectReasonText}
              onChange={(e) => setRejectReasonText(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleReject}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl cursor-pointer"
              >
                تایید رد درخواست
              </button>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="py-2.5 px-4 bg-stone-800 text-stone-300 rounded-xl cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
