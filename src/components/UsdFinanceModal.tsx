import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, UsdTransactionRequest, UsdTransactionType } from '../types/game';
import {
  loadUsdRequests,
  createUsdRequest,
  sendUsdChatMessage,
  MIN_USD_DEPOSIT,
  MIN_USD_WITHDRAW,
} from '../services/storage';
import { sound } from '../services/audio';
import { GAME_VISUALS } from '../assets/visuals';
import { UserAvatar } from './UserAvatar';

interface UsdFinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUserUpdate: (u: UserProfile) => void;
  defaultTab?: 'deposit' | 'withdraw' | 'chat';
  tradeContextListingId?: string;
}

export const UsdFinanceModal: React.FC<UsdFinanceModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdate,
  defaultTab = 'deposit',
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'chat'>(defaultTab);
  const [requests, setRequests] = useState<UsdTransactionRequest[]>(() => loadUsdRequests());
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Form states
  const [depositAmount, setDepositAmount] = useState<number>(15);
  const [depositMethod, setDepositMethod] = useState<'card' | 'crypto' | 'perfect_money'>('card');
  const [depositNote, setDepositNote] = useState<string>('');

  const [withdrawAmount, setWithdrawAmount] = useState<number>(20);
  const [withdrawDest, setWithdrawDest] = useState<string>('');
  const [withdrawMethod, setWithdrawMethod] = useState<'card' | 'crypto'>('card');

  // Support / Trade chat state
  const [chatInput, setChatInput] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const all = loadUsdRequests();
      setRequests(all);
      setActiveTab(defaultTab);
      // Pick user's latest request if available
      const myReqs = all.filter((r) => r.userId === user.id);
      if (myReqs.length > 0 && !selectedRequestId) {
        setSelectedRequestId(myReqs[0].id);
      }
    }
  }, [isOpen, defaultTab]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRequests(loadUsdRequests());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [requests, selectedRequestId]);

  if (!isOpen) return null;

  const myRequests = requests.filter((r) => r.userId === user.id);
  const selectedRequest = requests.find((r) => r.id === selectedRequestId) || myRequests[0] || null;

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    setNotice(null);

    if (depositAmount < MIN_USD_DEPOSIT) {
      sound.play('hit');
      setErrorNotice(`حداقل مبلغ شارژ حساب ${MIN_USD_DEPOSIT} دلار است.`);
      return;
    }

    const methodName =
      depositMethod === 'card'
        ? 'کارت بانکی شتاب'
        : depositMethod === 'crypto'
        ? 'تتر USDT (TRC20)'
        : 'پرفکت مانی';

    const note = `روش پرداخت: ${methodName} | مشخصات / کد پیگیری: ${depositNote.trim() || 'ارسال در گفتگو'}`;
    const res = createUsdRequest(user, 'deposit', depositAmount, note);

    if (res.success && res.request) {
      sound.play('coin');
      setNotice(`درخواست شارژ $${depositAmount} با موفقیت ثبت شد. گفتگو با مدیر باز شد.`);
      setRequests(loadUsdRequests());
      setSelectedRequestId(res.request.id);
      setActiveTab('chat');
      setDepositNote('');
      setTimeout(() => setNotice(null), 4000);
    } else {
      sound.play('hit');
      setErrorNotice(res.error || 'خطا در ثبت درخواست');
    }
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    setNotice(null);

    if (withdrawAmount < MIN_USD_WITHDRAW) {
      sound.play('hit');
      setErrorNotice(`حداقل مبلغ برداشت ${MIN_USD_WITHDRAW} دلار است.`);
      return;
    }
    if ((user.usd || 0) < withdrawAmount) {
      sound.play('hit');
      setErrorNotice(`موجودی دلار شما کافی نیست. ($${user.usd || 0} موجود دارید)`);
      return;
    }
    if (!withdrawDest.trim()) {
      sound.play('hit');
      setErrorNotice('لطفاً شماره کارت یا آدرس ولت مقصد را وارد کنید.');
      return;
    }

    const note = `مقصد واریز: ${withdrawDest.trim()} (${withdrawMethod === 'card' ? 'شماره کارت شتاب' : 'تتر TRC20'})`;
    const res = createUsdRequest(user, 'withdraw', withdrawAmount, note);

    if (res.success && res.request) {
      sound.play('coin');
      setNotice(`درخواست برداشت $${withdrawAmount} ثبت شد. مبلغ از موجودی شما کسر و پس از تایید مدیر واریز می‌گردد.`);
      const updatedUser = {
        ...user,
        usd: (user.usd || 0) - withdrawAmount,
      };
      onUserUpdate(updatedUser);
      setRequests(loadUsdRequests());
      setSelectedRequestId(res.request.id);
      setActiveTab('chat');
      setWithdrawDest('');
      setTimeout(() => setNotice(null), 4000);
    } else {
      sound.play('hit');
      setErrorNotice(res.error || 'خطا در ثبت درخواست');
    }
  };

  const handleSendChatMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !selectedRequest) return;

    const ok = sendUsdChatMessage(selectedRequest.id, user, chatInput.trim());
    if (ok) {
      sound.play('select');
      setChatInput('');
      setRequests(loadUsdRequests());
    }
  };

  const handleCreateTradeSupportTicket = () => {
    const res = createUsdRequest(
      user,
      'trade_support',
      0,
      'درخواست پشتیبانی و هماهنگی معامله کارت بازارچه بین خریدار و فروشنده'
    );
    if (res.success && res.request) {
      sound.play('select');
      setRequests(loadUsdRequests());
      setSelectedRequestId(res.request.id);
      setActiveTab('chat');
      setNotice('تیکت گفتگوی مستقیم با ادمین ایجاد شد.');
      setTimeout(() => setNotice(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none">
      <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-stone-900 border-2 border-emerald-500/80 rounded-3xl shadow-2xl overflow-hidden text-stone-100 flex flex-col z-10 max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-stone-900 to-amber-950 border-b border-stone-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-400 p-1 bg-stone-950 flex items-center justify-center shadow-lg">
              <img
                src={GAME_VISUALS.usdIcon}
                alt="USD Currency"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-emerald-300 flex items-center gap-2">
                <span>صرافی دلار، واریز، برداشت و گفتگوی مستقیم با مدیریت</span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-stone-300 mt-0.5">
                <span>موجودی دلار شما:</span>
                <b className="text-emerald-400 font-black text-sm bg-stone-950 px-2 py-0.5 rounded-lg border border-emerald-500/40">
                  ${(user.usd || 0).toLocaleString()} USD
                </b>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-stone-950 p-1.5 border-b border-stone-800 gap-1.5">
          <button
            onClick={() => {
              sound.play('click');
              setActiveTab('deposit');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'deposit'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>📥</span>
            <span>شارژ و واریز (حداقل ۱۰$)</span>
          </button>
          <button
            onClick={() => {
              sound.play('click');
              setActiveTab('withdraw');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'withdraw'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>📤</span>
            <span>برداشت وجه (حداقل ۲۰$)</span>
          </button>
          <button
            onClick={() => {
              sound.play('click');
              setActiveTab('chat');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>💬</span>
            <span>گفتگوی مستقیم با ادمین</span>
            {myRequests.some((r) => r.status === 'pending') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-1.5 right-2" />
            )}
          </button>
        </div>

        {notice && (
          <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs p-3 m-3 mb-0 rounded-2xl text-center shadow animate-in fade-in font-bold">
            ✓ {notice}
          </div>
        )}
        {errorNotice && (
          <div className="bg-rose-950/90 border border-rose-500 text-rose-200 text-xs p-3 m-3 mb-0 rounded-2xl text-center shadow animate-in fade-in font-bold">
            ⚠️ {errorNotice}
          </div>
        )}

        {/* Tab 1: Deposit */}
        {activeTab === 'deposit' && (
          <div className="p-5 overflow-y-auto flex flex-col gap-4">
            <div className="bg-emerald-950/30 border border-emerald-500/40 p-3.5 rounded-2xl text-xs text-stone-300 leading-relaxed">
              <b className="text-emerald-300 block mb-1">راهنمای شارژ دلار آمریکا:</b>
              حداقل مبلغ شارژ حساب <span className="text-emerald-400 font-black">۱۰ دلار ($10)</span> می‌باشد.
              پس از ثبت درخواست، مستقیماً به گفتگوی امن با مدیر کل (<b className="text-amber-300">Mahdimirzapor</b>) هدایت می‌شوید تا پس از تایید فیش، حسابتان شارژ گردد.
            </div>

            <form onSubmit={handleDepositSubmit} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="text-stone-300 font-bold block mb-1.5">مبلغ شارژ به دلار ($):</label>
                <div className="flex gap-2 mb-2">
                  {[10, 15, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className={`flex-1 py-1.5 rounded-xl font-bold border transition cursor-pointer text-xs ${
                        depositAmount === amt
                          ? 'bg-emerald-500 text-stone-950 border-emerald-400 font-black shadow'
                          : 'bg-stone-950 border-stone-700 text-stone-300 hover:border-stone-500'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={10}
                  step={1}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-stone-950 border border-stone-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-stone-100 font-black text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-stone-300 font-bold block mb-1.5">روش پرداخت دلخواه:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'card', label: '💳 کارت به کارت شتاب' },
                    { id: 'crypto', label: '🪙 تتر USDT (TRC20)' },
                    { id: 'perfect_money', label: '💎 پرفکت مانی / ووچر' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setDepositMethod(m.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer font-bold ${
                        depositMethod === m.id
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow'
                          : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-stone-300 font-bold block mb-1">
                  توضیحات واریز یا شماره پیگیری فیش (اختیاری):
                </label>
                <textarea
                  rows={2}
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  placeholder="مثلاً: واریز از کارت بانک سامان به نام علی..."
                  className="w-full bg-stone-950 border border-stone-700 focus:border-emerald-400 rounded-xl p-3 text-stone-200 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 text-stone-950 font-black text-sm rounded-2xl shadow-xl transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 border border-emerald-300"
              >
                <span>📥 ثبت درخواست شارژ و گفتگو مستقیم با ادمین</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Withdraw */}
        {activeTab === 'withdraw' && (
          <div className="p-5 overflow-y-auto flex flex-col gap-4">
            <div className="bg-amber-950/30 border border-amber-500/40 p-3.5 rounded-2xl text-xs text-stone-300 leading-relaxed">
              <b className="text-amber-300 block mb-1">راهنمای تسویه و برداشت دلار:</b>
              حداقل مبلغ برداشت <span className="text-amber-400 font-black">۲۰ دلار ($20)</span> می‌باشد.
              پس از ثبت، موجودی دلاری شما کسر شده و مدیر کل از طریق چت مستقیم با شما در ارتباط خواهد بود تا واریز به حساب بانکی یا ولت کریپتو شما را انجام دهد.
            </div>

            <form onSubmit={handleWithdrawSubmit} className="flex flex-col gap-4 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-stone-300 font-bold">مبلغ برداشت به دلار ($):</label>
                  <span className="text-stone-400">
                    موجودی قابل برداشت: <b className="text-emerald-400">${user.usd || 0}</b>
                  </span>
                </div>
                <div className="flex gap-2 mb-2">
                  {[20, 30, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      disabled={(user.usd || 0) < amt}
                      onClick={() => setWithdrawAmount(amt)}
                      className={`flex-1 py-1.5 rounded-xl font-bold border transition cursor-pointer text-xs ${
                        withdrawAmount === amt
                          ? 'bg-amber-500 text-stone-950 border-amber-400 font-black shadow'
                          : (user.usd || 0) < amt
                          ? 'opacity-40 bg-stone-950 border-stone-800 text-stone-600 cursor-not-allowed'
                          : 'bg-stone-950 border-stone-700 text-stone-300 hover:border-stone-500'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(user.usd || 0)}
                    disabled={(user.usd || 0) < MIN_USD_WITHDRAW}
                    className="flex-1 py-1.5 rounded-xl font-bold border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition cursor-pointer text-xs"
                  >
                    کل موجودی
                  </button>
                </div>
                <input
                  type="number"
                  min={20}
                  max={user.usd || 0}
                  step={1}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-stone-100 font-black text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-stone-300 font-bold block mb-1.5">شیوه دریافت وجه:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('card')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer font-bold ${
                      withdrawMethod === 'card'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow'
                        : 'border-stone-800 bg-stone-950 text-stone-400'
                    }`}
                  >
                    💳 کارت به کارت / شماره شبا
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('crypto')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer font-bold ${
                      withdrawMethod === 'crypto'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow'
                        : 'border-stone-800 bg-stone-950 text-stone-400'
                    }`}
                  >
                    🪙 آدرس تتر USDT (TRC20)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-stone-300 font-bold block mb-1">
                  {withdrawMethod === 'card'
                    ? 'شماره کارت و شماره شبا بانکی به همراه نام صاحب حساب:'
                    : 'آدرس ولت تتر TRC20 مقصد:'}
                </label>
                <input
                  type="text"
                  value={withdrawDest}
                  onChange={(e) => setWithdrawDest(e.target.value)}
                  placeholder={
                    withdrawMethod === 'card'
                      ? 'شماره کارت ۱۶ رقمی یا شبا IR... و نام صاحب حساب'
                      : 'آدرس ولت تتر شما که با T شروع می‌شود...'
                  }
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-stone-100 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={(user.usd || 0) < MIN_USD_WITHDRAW}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-stone-950 font-black text-sm rounded-2xl shadow-xl transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 border border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>📤 ثبت درخواست برداشت و ارسال برای مدیر کل</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Direct Admin Chat & Requests */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-[380px] max-h-[500px]">
            {/* Header: Request Selector or Start Ticket */}
            <div className="p-3 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {myRequests.map((r) => {
                  const isSel = selectedRequest?.id === r.id;
                  const typeLabel =
                    r.type === 'deposit' ? `شارژ $${r.amount}` : r.type === 'withdraw' ? `برداشت $${r.amount}` : 'معامله';
                  const statusBadge =
                    r.status === 'completed'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : r.status === 'rejected'
                      ? 'bg-rose-950 text-rose-300 border-rose-700'
                      : 'bg-amber-950 text-amber-300 border-amber-700 animate-pulse';

                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        sound.play('click');
                        setSelectedRequestId(r.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border cursor-pointer flex items-center gap-1.5 ${
                        isSel
                          ? 'border-cyan-400 bg-cyan-950 text-cyan-200 shadow'
                          : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-white'
                      }`}
                    >
                      <span>{typeLabel}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${statusBadge}`}>
                        {r.status === 'completed' ? 'تایید شد' : r.status === 'rejected' ? 'رد شد' : 'در انتظار ادمین'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleCreateTradeSupportTicket}
                className="shrink-0 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs px-2.5 py-1.5 rounded-xl transition font-bold border border-stone-700 cursor-pointer flex items-center gap-1"
                title="گفتگو جهت تضمین و معامله کارت در بازارچه"
              >
                <span>➕</span>
                <span>تیکت معامله کارت</span>
              </button>
            </div>

            {/* Conversation Window */}
            {selectedRequest ? (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                {/* Messages scroll area */}
                <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 space-y-1">
                  <div className="text-center">
                    <span className="text-[10px] bg-stone-950 text-stone-400 px-3 py-1 rounded-full border border-stone-800">
                      گفتگوی مستقیم با ادمین (مهدی میرزاپور) در بستر امن
                    </span>
                  </div>

                  {selectedRequest.messages.map((m) => {
                    const isAdmin = m.senderRole === 'admin';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-stone-400">
                          {isAdmin ? (
                            <span className="font-bold text-amber-300 flex items-center gap-1">
                              <span>👑</span>
                              <span>مهدی میرزاپور (مدیر کل)</span>
                            </span>
                          ) : (
                            <span className="font-bold text-stone-300">{m.senderName}</span>
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
                              ? 'bg-gradient-to-br from-amber-950/80 to-stone-900 border border-amber-500/50 text-amber-100 rounded-tr-none'
                              : 'bg-stone-800 border border-stone-700 text-stone-100 rounded-tl-none'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat input box */}
                <form
                  onSubmit={handleSendChatMessage}
                  className="p-3 bg-stone-950 border-t border-stone-800 flex gap-2 items-center"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="پیام خود را برای مدیر کل بنویسید..."
                    className="flex-1 bg-stone-900 border border-stone-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs text-stone-100 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow flex items-center gap-1"
                  >
                    <span>ارسال</span>
                    <span>📤</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400 text-xs gap-3">
                <span className="text-3xl">💬</span>
                <p>هیچ گفتگوی فعالی با ادمین ندارید.</p>
                <button
                  onClick={() => setActiveTab('deposit')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-xl font-bold cursor-pointer"
                >
                  شارژ حساب یا ثبت درخواست
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
