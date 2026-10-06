import React, { useState } from 'react';
import { UserProfile, CardDef } from '../types/game';
import { claimTutorialReward, markTutorialCompleted } from '../services/storage';
import { sound } from '../services/audio';
import { GAME_VISUALS } from '../assets/visuals';

interface GameTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  cardLibrary: CardDef[];
  onUserUpdate: (u: UserProfile) => void;
  onStartPracticeBattle?: () => void;
  onGoToDeck?: () => void;
}

interface TutorialChapter {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  content: React.ReactNode;
}

export const GameTutorialModal: React.FC<GameTutorialModalProps> = ({
  isOpen,
  onClose,
  user,
  cardLibrary: _cardLibrary,
  onUserUpdate,
  onStartPracticeBattle: _onStartPracticeBattle,
  onGoToDeck: _onGoToDeck,
}) => {
  const [currentChapter, setCurrentChapter] = useState<number>(1);
  const [claimedReward, setClaimedReward] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFinishTutorial = () => {
    sound.play('victory');
    const updated = markTutorialCompleted(user);
    onUserUpdate(updated);
    onClose();
  };

  const handleClaimReward = () => {
    if (user.hasClaimedTutorialReward) return;
    sound.play('victory');
    const res = claimTutorialReward(user);
    if (res.success) {
      onUserUpdate(res.updatedUser);
      setClaimedReward(res.rewardText);
    }
  };

  const handleNext = () => {
    sound.play('click');
    if (currentChapter < 8) {
      setCurrentChapter((c) => c + 1);
    } else {
      handleFinishTutorial();
    }
  };

  const handlePrev = () => {
    sound.play('click');
    if (currentChapter > 1) {
      setCurrentChapter((c) => c - 1);
    }
  };

  const CHAPTERS: TutorialChapter[] = [
    {
      id: 1,
      title: '۱. مقدمه و انواع کارت‌های اساطیری',
      subtitle: 'شناخت نقش‌های پنج‌گانه قهرمانان در دربار شاهنامه',
      badge: '🏰 نقش‌های کارت',
      image: GAME_VISUALS.deckForgeBanner,
      content: (
        <div className="space-y-3.5 text-xs text-stone-200 leading-relaxed">
          <p>
            به بازی استراتژیک و حماسی <b className="text-amber-300">«نبرد پادشاهان»</b> خوش آمدید! در این بازی کارت‌ها بر اساس اساطیر باستانی شاهنامه طراحی شده‌اند و هر کارت دارای یکی از نقش‌های تاکتیکی زیر است:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-stone-950/80 p-3 rounded-2xl border border-amber-500/40 space-y-1 shadow">
              <span className="text-amber-300 font-black flex items-center gap-1.5 text-xs">
                <span>👑</span>
                <span>پادشاه (King) - حیاتی‌ترین کارت:</span>
              </span>
              <p className="text-[11px] text-stone-400">
                هر ارتش <b>باید دقیقاً یک پادشاه</b> در خانه مرکز ردیف سوم داشته باشد. اگر پادشاه کشته شود، نبرد بلافاصله به پایان می‌رسد!
              </p>
            </div>

            <div className="bg-stone-950/80 p-3 rounded-2xl border border-rose-500/40 space-y-1 shadow">
              <span className="text-rose-300 font-black flex items-center gap-1.5 text-xs">
                <span>⚔️</span>
                <span>تازشگر (Attacker) - قدرت هجومی:</span>
              </span>
              <p className="text-[11px] text-stone-400">
                دارای قدرت حمله بسیار بالا و ضربات سنگین برای در هم شکستن خطوط دفاعی دشمن.
              </p>
            </div>

            <div className="bg-stone-950/80 p-3 rounded-2xl border border-cyan-500/40 space-y-1 shadow">
              <span className="text-cyan-300 font-black flex items-center gap-1.5 text-xs">
                <span>🛡️</span>
                <span>پاسدار (Defender) - سد دفاعی:</span>
              </span>
              <p className="text-[11px] text-stone-400">
                جان بالا، قابلیت جذب ضربات و مسدود کردن حملات مستقیم به کارت‌های ردیف عقب و پادشاه.
              </p>
            </div>

            <div className="bg-stone-950/80 p-3 rounded-2xl border border-purple-500/40 space-y-1 shadow">
              <span className="text-purple-300 font-black flex items-center gap-1.5 text-xs">
                <span>🧙‍♂️</span>
                <span>افسونگر (Mage) - شفا و جادوی دوربرد:</span>
              </span>
              <p className="text-[11px] text-stone-400">
                شفای یاران، پرتاب آتش و زهر، ایجاد سپر محافظ و اعمال طلسم‌های راهبردی به کل تخته.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: '۲. قوانین میدان نبرد و تخته استراتژیک ۶×۳',
      subtitle: 'چیدمان ارتش در ۳ ردیف و قوانین هدف‌گیری',
      badge: '🗺️ تاکتیک تخته',
      image: GAME_VISUALS.battleArenaBg,
      content: (
        <div className="space-y-3.5 text-xs text-stone-200 leading-relaxed">
          <p>
            میدان مبارزه شامل یک تخته <b className="text-amber-300">۶×۳ (۶ ردیف و ۳ ستون)</b> است که ۳ ردیف بالا متعلق به حریف و ۳ ردیف پایین متعلق به شماست:
          </p>

          <div className="bg-stone-950/90 p-3.5 rounded-2xl border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <span>📌</span>
              <span>ردیف‌های سه‌گانه ارتش:</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-[11px] text-stone-300 pr-1">
              <li>
                <b className="text-emerald-400">ردیف ۱ (خط مقدم):</b> جایگاه ایده‌آل برای پاسداران و مبارزان تن‌به‌تن جهت جذب اولین ضربات.
              </li>
              <li>
                <b className="text-cyan-400">ردیف ۲ (خط میانی):</b> مناسب برای تازشگران و افسونگران جهت وارد آوردن آسیب به صفوف دشمن.
              </li>
              <li>
                <b className="text-amber-400">ردیف ۳ (قلعه فرماندهی):</b> خانه وسط <b className="text-yellow-300">مختص پادشاه</b> است. کارت‌های کناری پادشاه محافظان شخصی او هستند.
              </li>
            </ul>
          </div>

          <div className="bg-stone-950/90 p-3 rounded-2xl border border-stone-800 text-[11px] text-stone-300">
            <span className="font-bold text-amber-300 block mb-1">⚡ قانون خط دید (Guard Line):</span>
            تا زمانی که کارتی در ردیف جلوتر وجود داشته باشد، حملات معمولی نمی‌توانند به ردیف‌های عقب‌تر اصابت کنند (مگر با قابلیت‌های دوربرد، جادو یا رد شدن از گارد).
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: '۳. شیوه ارتقای کارت‌ها و افزایش قدرت در هر برد',
      subtitle: 'افزایش ۱۰ درصدی قدرت و جان در هر برد و تفاوت آن در کارت‌های مختلف',
      badge: '⚔️ ارتقای قهرمانان',
      image: GAME_VISUALS.deckForgeArt,
      content: (
        <div className="space-y-3.5 text-xs text-stone-200 leading-relaxed">
          <p>
            یکی از مهم‌ترین ارکان پیروزی، ارتقای پیوسته ارتش است. سیستم پیشرفت کارت‌ها به شکل زیر عمل می‌کند:
          </p>

          <div className="bg-gradient-to-r from-amber-950/80 via-stone-950 to-amber-950/80 p-3.5 rounded-2xl border-2 border-amber-400 shadow-md space-y-2">
            <span className="text-amber-300 font-black flex items-center gap-1.5 text-xs sm:text-sm">
              <span>🔥</span>
              <span>قانون افزایش ۱۰ درصدی در هر برد (Win Scaling):</span>
            </span>
            <p className="text-[11px] text-stone-200 leading-relaxed">
              با هر پیروزی که یک کارت در میدان نبرد کسب می‌کند، <b className="text-amber-300 font-bold">۱۰ درصد (۱۰٪)</b> به قدرت حمله و جان آن کارت افزوده می‌شود.
            </p>
            <div className="bg-stone-950/90 p-2.5 rounded-xl border border-amber-500/30 text-[10.5px] text-stone-300">
              ⚡ <b className="text-cyan-300">تفاوت بر اساس رده کارت (Card Tiers):</b> این درصد رشد در کارت‌های مختلف با توجه به رده آنها (نرمال، متوسط، افسانه‌ای و ایزدان) و نوع کارت (پادشاه، تهاجمی، دفاعی یا جادوگر) متفاوت و قابل شخصی‌سازی است.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-stone-950 p-3 rounded-2xl border border-emerald-500/40 space-y-1 shadow">
              <span className="font-black text-emerald-300 flex items-center gap-1">
                <span>📈</span>
                <span>لول‌آپ با سکه و تجربه:</span>
              </span>
              <p className="text-[11px] text-stone-400">
                با رسیدن به تجربه (XP) لازم، می‌توانید کارت را در بخش ارتش به سطح بالاتر ارتقا داده و آمار پایه آن را دائمی تقویت کنید.
              </p>
            </div>

            <div className="bg-stone-950 p-3 rounded-2xl border border-purple-500/40 space-y-1 shadow">
              <span className="font-black text-purple-300 flex items-center gap-1">
                <span>⚡</span>
                <span>قابلیت‌های فازی (Phase Abilities):</span>
              </span>
              <p className="text-[11px] text-stone-400">
                کارت‌ها دارای مهارت‌های شروع (onStart)، هنگام حمله (onAttack)، و پس از مرگ (onDeath) می‌باشند.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: '۴. کاپ‌ها، رده‌بندی و لیگ‌های شش‌گانه',
      subtitle: 'صعود از لیگ برنز تا تاج پادشاهی تخت جمشید',
      badge: '🏆 لیگ و جوایز',
      image: GAME_VISUALS.hallOfFameBanner,
      content: (
        <div className="space-y-3.5 text-xs text-stone-200 leading-relaxed">
          <p>
            با پیروزی در مسابقات رنک (PvP Ranked)، <b className="text-amber-300">کاپ (Trophies)</b> دریافت می‌کنید و در لیگ‌های معتبر صعود می‌نمایید:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-[11px]">
            <div className="bg-amber-950/40 border border-amber-800 p-2.5 rounded-xl">
              <span className="text-xl block">🥉</span>
              <b className="text-amber-700 font-black">لیگ برنز</b>
              <span className="text-[10px] text-stone-400 block">۰ تا ۲۹۹ کاپ</span>
            </div>
            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl">
              <span className="text-xl block">🥈</span>
              <b className="text-slate-300 font-black">لیگ نقره</b>
              <span className="text-[10px] text-stone-400 block">۳۰۰ تا ۵۹۹ کاپ</span>
            </div>
            <div className="bg-amber-950/60 border border-amber-500 p-2.5 rounded-xl">
              <span className="text-xl block">🥇</span>
              <b className="text-amber-400 font-black">لیگ طلا</b>
              <span className="text-[10px] text-stone-400 block">۶۰۰ تا ۹۹۹ کاپ</span>
            </div>
            <div className="bg-cyan-950 border border-cyan-500 p-2.5 rounded-xl">
              <span className="text-xl block">💎</span>
              <b className="text-cyan-400 font-black">لیگ پلاتین</b>
              <span className="text-[10px] text-stone-400 block">۱۰۰۰ تا ۱۴۹۹ کاپ</span>
            </div>
            <div className="bg-purple-950 border border-purple-500 p-2.5 rounded-xl">
              <span className="text-xl block">👑</span>
              <b className="text-purple-300 font-black">لیگ الماس</b>
              <span className="text-[10px] text-stone-400 block">۱۵۰۰ تا ۲۱۹۹ کاپ</span>
            </div>
            <div className="bg-rose-950 border border-rose-500 p-2.5 rounded-xl">
              <span className="text-xl block">🌟</span>
              <b className="text-rose-400 font-black">لیگ اسطوره‌ها</b>
              <span className="text-[10px] text-stone-400 block">+۲۲۰۰ کاپ</span>
            </div>
          </div>

          <p className="text-[11px] text-stone-300">
            با حضور در لیگ‌های بالاتر، میزان طلای دریافتی در هر برد تا <b>۵۰۰ سکه</b> افزایش یافته و تاج‌های زرین سه بعدی در پروفایل شما ثبت می‌شود.
          </p>
        </div>
      ),
    },
    {
      id: 5,
      title: '۵. اتحادیه‌ها (کلن‌ها)، اهدای کارت و دوئل درون‌گروهی',
      subtitle: 'ایجاد پیوند برادری و حضور در نبردهای دسته‌جمعی',
      badge: '🛡️ اتحادیه و قبیله',
      image: GAME_VISUALS.clanHallBanner,
      content: (
        <div className="space-y-3.5 text-xs text-stone-200 leading-relaxed">
          <p>
            اتحادیه‌ها کانون قدرت و همبستگی پهلوانان هستند. با عضویت در کلن از مزایای زیر بهره‌مند می‌شوید:
          </p>

          <ul className="list-disc list-inside space-y-1.5 text-[11px] text-stone-300 pr-1">
            <li>
              <b className="text-purple-300">چت اختصاصی کلن و دوئل‌های دوستانه:</b> تست استراتژی‌ها و نبرد تمرینی بدون خطر افت کاپ با یاران خودی.
            </li>
            <li>
              <b className="text-emerald-400">اهدای کارت و دریافت تجربه:</b> ارسال کارت به هم‌تیمی‌ها و دریافت سکه طلا و XP پاداش.
            </li>
            <li>
              <b className="text-amber-400">قوانین و ترفیع رتبه:</b> سلطان کلن می‌تواند نوع ورود (آزاد، با تایید یا مسدود) را تعیین کند و اعضا را به مقام ریش‌سفید (Elder) ارتقا دهد.
            </li>
            <li>
              <b className="text-cyan-400">کول‌داون خروج:</b> پس از ترک کلن، به مدت ۲۴ ساعت مهلت استراحت برای پیوستن به کلن جدید در نظر گرفته می‌شود تا عدالت حفظ گردد.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 6,
      title: '۶. بازارچه، مزایده ۲۴ ساعته و قوانین دلار ($ USD)',
      subtitle: 'کسب دلار از طریق فروش کارت، جام‌ها، چالش‌ها و تسویه با ادمین',
      badge: '💵 بازارچه و دلار',
      image: GAME_VISUALS.marketBazaarBanner,
      content: (
        <div className="space-y-3.5 text-xs text-stone-200 leading-relaxed">
          <p>
            در بازارچه اساطیر، می‌توانید کارت‌های قدرتمند خود را برای فروش بگذارید یا کارت‌های لول بالای دیگران را خریداری کنید:
          </p>

          <div className="bg-stone-950 p-3 rounded-2xl border border-rose-500/40 text-[11px] text-stone-300 leading-relaxed">
            <b className="text-rose-400 block mb-1">⚠️ قانون ارز دلاری:</b>
            دلار آمریکا ($ USD) یک ارز باارزش واقعی در بازی است و <b className="text-amber-300">به هیچ عنوان به صورت رایگان به کاربران داده نمی‌شود</b>، مگر از طریق قهرمانی در <b>جام‌ها، مسابقات و چالش‌های ویژه</b>، فروش کارت‌ها در <b>بازارچه مزایده</b> یا <b>شارژ حساب</b> با هماهنگی مدیریت.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-stone-950 p-3 rounded-2xl border border-emerald-500/40 space-y-1 shadow">
              <span className="font-black text-emerald-300 flex items-center gap-1">
                <span>💵</span>
                <span>فروش با دلار آمریکا ($ USD):</span>
              </span>
              <p className="text-[11px] text-stone-400">
                می‌توانید کارت‌های مازاد خود را با دلار یا سکه بفروشید و وجه حاصل را دریافت نمایید.
              </p>
            </div>

            <div className="bg-stone-950 p-3 rounded-2xl border border-amber-500/40 space-y-1 shadow">
              <span className="font-black text-amber-300 flex items-center gap-1">
                <span>⏳</span>
                <span>مزایده ۲۴ ساعته:</span>
              </span>
              <p className="text-[11px] text-stone-400">
                کارت در حراجی قرار می‌گیرد و بالاترین پیشنهاد پس از ۲۴ ساعت برنده کارت خواهد شد.
              </p>
            </div>
          </div>

          <div className="bg-stone-950/90 p-3 rounded-2xl border border-emerald-500/30 text-[11px] text-stone-300 space-y-1">
            <b className="text-emerald-400 block">قوانین واریز و برداشت دلار:</b>
            <div>• <b className="text-amber-300">حداقل شارژ حساب:</b> ۱۰ دلار ($10) از طریق کارت شتاب، تتر یا پرفکت‌مانی</div>
            <div>• <b className="text-amber-300">حداقل برداشت وجه:</b> ۲۰ دلار ($20) به کارت بانکی یا ولت تتر</div>
            <div>• <b className="text-cyan-300">گفتگوی مستقیم با ادمین:</b> تمامی واریزها و برداشت‌ها با چت زنده با مدیر کل تایید می‌شوند.</div>
          </div>
        </div>
      ),
    },
    {
      id: 7,
      title: '۷. صندوق‌های شاهانه و مسابقات دوره‌ای',
      subtitle: 'کسب کارت‌های لجندری و صعود در مسابقات هفتگی و ماهانه',
      badge: '🎁 جوایز و صندوق',
      image: GAME_VISUALS.tourneyArenaBanner,
      content: (
        <div className="space-y-3.5 text-xs text-stone-200 leading-relaxed">
          <p>
            برای تقویت سریع‌تر ارتش خود، به بخش صندوق‌ها و مسابقات سر بزنید:
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 space-y-1">
              <b className="text-amber-300 flex items-center gap-1">
                <span>🎁</span>
                <span>صندوق‌های ۴ گانه:</span>
              </b>
              <p className="text-stone-400 text-[10px]">
                شامل صندوق چوبی برنز، نقره‌ای، زرین شاهانه و کریستال اساطیری با تضمین کارت‌های لجندری و خدا.
              </p>
            </div>

            <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 space-y-1">
              <b className="text-rose-300 flex items-center gap-1">
                <span>🏆</span>
                <span>مسابقات دوره‌ای:</span>
              </b>
              <p className="text-stone-400 text-[10px]">
                تورنمنت‌های هفتگی و ماهانه (بیشترین برد / بیشترین لول‌آپ) با جوایز کلان طلا و الماس در صندوق پستی.
              </p>
            </div>
          </div>

          <p className="text-[11px] text-stone-300">
            جوایز رویدادها به صورت خودکار در پایان مهلت مسابقه به «صندوق هدایا 📬» ارسال می‌شوند.
          </p>
        </div>
      ),
    },
    {
      id: 8,
      title: '۸. قوانین اخلاق پهلوانی و جایزه پایان آموزش',
      subtitle: 'رعایت مرام فتوت، دریافت پاداش استارتر و پایان دوره',
      badge: '🌟 پایان آموزش',
      image: GAME_VISUALS.hallOfFameBanner,
      content: (
        <div className="space-y-4 text-xs text-stone-200 leading-relaxed text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 mx-auto flex items-center justify-center text-3xl shadow-xl border-2 border-amber-200 animate-bounce">
            🎓
          </div>

          <div>
            <h4 className="text-base font-black text-amber-300">
              تبریک! شما با موفقیت دوره جامع آموزش پهلوانی را به پایان رساندید
            </h4>
            <p className="text-[11px] text-stone-300 mt-1 max-w-md mx-auto">
              با اتمام این مرحله، آموزش از منو برداشته می‌شود و شما رسماً وارد دربار پهلوانان می‌شوید.
            </p>
          </div>

          {/* Reward Box */}
          <div className="bg-gradient-to-r from-amber-950/80 via-stone-900 to-emerald-950/80 border-2 border-amber-500/80 rounded-2xl p-4 shadow-xl max-w-md mx-auto space-y-2">
            <span className="text-xs font-black text-amber-300 flex items-center justify-center gap-1.5">
              <span>🎁</span>
              <span>بسته پاداش فارغ‌التحصیلی آموزش:</span>
            </span>

            <div className="flex justify-around items-center py-2 text-sm font-black border-y border-stone-800">
              <span className="text-amber-300 flex items-center gap-1">
                <span>💰</span>
                <span>۷۵۰ سکه طلا</span>
              </span>
              <span className="text-cyan-300 flex items-center gap-1">
                <span>💎</span>
                <span>۴۰ الماس جادویی</span>
              </span>
            </div>

            {user.hasClaimedTutorialReward ? (
              <div className="bg-emerald-950/90 text-emerald-300 border border-emerald-500 font-bold p-2 rounded-xl text-xs flex items-center justify-center gap-1">
                <span>✓</span>
                <span>شما این جایزه را قبلاً دریافت کرده‌اید!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClaimReward}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 text-stone-950 font-black py-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer text-xs border border-emerald-300"
              >
                دریافت جایزه پایان آموزش 🎁
              </button>
            )}

            {claimedReward && (
              <div className="bg-emerald-950 text-emerald-200 border border-emerald-500 p-2 rounded-xl text-[11px] font-bold animate-in fade-in">
                ✓ پاداش با موفقیت اضافه شد: {claimedReward}
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  const chapter = CHAPTERS.find((c) => c.id === currentChapter) || CHAPTERS[0];

  return (
    <div
      onClick={handleFinishTutorial}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-stone-900 border-2 border-amber-500/80 rounded-3xl text-stone-100 flex flex-col shadow-2xl my-auto animate-in zoom-in-95 duration-200 max-h-[94vh] overflow-hidden"
      >
        {/* Banner with Illustrated Chapter Backdrop */}
        <div className="relative h-36 sm:h-44 shrink-0 overflow-hidden border-b-2 border-amber-500/60 flex items-end p-4 sm:p-5">
          <img
            src={chapter.image}
            alt={chapter.title}
            className="absolute inset-0 w-full h-full object-cover brightness-[0.38] scale-105 pointer-events-none transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleFinishTutorial}
            className="absolute top-3.5 left-3.5 z-20 w-8 h-8 rounded-full bg-stone-950/80 hover:bg-stone-800 text-stone-300 flex items-center justify-center text-sm font-bold border border-stone-700 transition cursor-pointer"
            title="اتمام آموزش"
          >
            ✕
          </button>

          {/* Banner content */}
          <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-2.5 py-0.5 rounded-full shadow">
                {chapter.badge}
              </span>
              <h2 className="text-base sm:text-xl font-black text-amber-200 drop-shadow mt-1">
                {chapter.title}
              </h2>
              <p className="text-[11px] text-stone-300 drop-shadow">{chapter.subtitle}</p>
            </div>

            <div className="text-left">
              <span className="text-xs font-mono font-black text-amber-400 bg-stone-950/80 px-3 py-1 rounded-xl border border-amber-500/40">
                گام {currentChapter} از ۸
              </span>
            </div>
          </div>
        </div>

        {/* Chapter Steps Dock */}
        <div className="flex bg-stone-950 p-1.5 border-b border-stone-800 gap-1 overflow-x-auto no-scrollbar shrink-0">
          {CHAPTERS.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                sound.play('click');
                setCurrentChapter(c.id);
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black transition whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 ${
                currentChapter === c.id
                  ? 'bg-amber-500 text-stone-950 shadow border border-amber-300'
                  : 'text-stone-400 hover:text-white bg-stone-900/60'
              }`}
            >
              <span>{c.badge.split(' ')[0]}</span>
              <span className="hidden sm:inline">{c.title.split('.')[1]?.slice(0, 15)}</span>
            </button>
          ))}
        </div>

        {/* Chapter Body Content (Scrollable) */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto max-h-[50vh]">
          {chapter.content}
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-3.5 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={handlePrev}
            disabled={currentChapter === 1}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-300 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1"
          >
            <span>▶</span>
            <span>گام قبلی</span>
          </button>

          <div className="flex items-center gap-2">
            {currentChapter === 8 ? (
              <button
                onClick={handleFinishTutorial}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black rounded-xl text-xs shadow-lg transition active:scale-95 cursor-pointer border border-amber-300"
              >
                اتمام آموزش و ورود به بازی ⚔️
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black rounded-xl text-xs shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-1 border border-amber-300"
              >
                <span>گام بعدی</span>
                <span>◀</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
