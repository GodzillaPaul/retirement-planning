// ═══ engine.js V1.26 — 純運算邏輯 ═══
import { COI_MALE, COI_FEMALE, FFT, FFE, ADM, SA_M, SA_F, MAX_MS } from './constants.js';

// 保額自動計算（回傳萬元，無條件進位到萬）
export function calcSA(g, age, ap) {
  const t = g === "M" ? SA_M : SA_F;
  const [lo, hi] = t[Math.max(0, Math.min(70, age))] || [10, 10];
  const avg = (lo + hi) / 2;
  const raw = Math.min(60000000, avg * ap);
  return Math.ceil(raw / 10000); // 回傳萬元單位
}

// 保單帳戶逐月模擬（甲型 UNDA）
export function simulate(p) {
  const coi = p.gender === "M" ? COI_MALE : COI_FEMALE;
  const months = Math.min(p.paymentYears * 12, (110 - p.currentAge) * 12);
  const res = [];
  let av = 0, cum = 0;
  const mr = Math.pow(1 + p.assumedReturn, 1 / 12) - 1;

  for (let m = 0; m < months; m++) {
    const yr = Math.floor(m / 12) + 1, mo = (m % 12) + 1, age = p.currentAge + yr - 1;
    const tp = mo === 1 ? p.annualTarget : 0, ep = p.monthlyExtra;
    const fr = FFT[Math.min(yr, 6)] || 0;
    const fee = Math.round(tp * fr) + Math.round(ep * FFE);
    cum += tp + ep;
    const adm = av > 0 || (tp + ep - fee) > 0 ? ADM : 0;

    // Step 1: avMid = 期初AV + 投入 - 前置費用 - 管理費
    const avMid = av + tp + ep - fee - adm;

    // Step 2: COI 用 avMid 計算危險保額（不是期初 AV）
    const coiRate = coi[Math.min(age, 110)] || 1;
    const coiCost = Math.round(Math.max(p.sumInsured - avMid, 0) * coiRate);

    // Step 3: 期末AV = MAX(avMid - COI, 0) × (1 + 月報酬率)
    av = Math.max(avMid - coiCost, 0) * (1 + mr);

    if (mo === 12 || m === months - 1) {
      const avRound = Math.round(av);
      // 甲型（UNDA）：身故保障 = MAX(保額, 帳戶價值)
      const db = Math.max(p.sumInsured, avRound);
      res.push({ year: yr, age, av: avRound, db, sv: avRound, cum: Math.round(cum) });
    }
  }
  return res;
}

// 數字格式化
export const fmt = n => n == null ? "-" : Math.round(n).toLocaleString("zh-TW");

// 目標搜尋：找出最低每月存入金額使退休解約金 >= capDist
export function goalSeek(S, capDist) {
  const workYears = S.retirementAge - S.currentAge;
  const payYears = workYears + 1;
  const ar = S.assumedReturn / 100;

  function trySV(totalMonthly) {
    const ms = Math.min(MAX_MS, totalMonthly);
    const me = Math.max(0, Math.round((totalMonthly - ms) / 500) * 500);
    const at = ms * 12;
    const sw = calcSA(S.gender, S.currentAge, at);
    const si = sw * 10000;
    const res = simulate({
      currentAge: S.currentAge, retirementAge: S.retirementAge, gender: S.gender,
      annualTarget: at, monthlyExtra: me, assumedReturn: ar, paymentYears: payYears, sumInsured: si
    });
    const idx = Math.min(workYears, (res?.length || 1) - 1);
    return { sv: res[idx]?.sv || 0, ms, me, at, sw, si, res };
  }

  // 二分搜尋
  let lo = 500, hi = 200000, best = hi;
  for (let i = 0; i < 30; i++) {
    const mid = Math.round((lo + hi) / 2 / 500) * 500;
    if (mid <= lo) break;
    if (trySV(mid).sv >= capDist) { best = mid; hi = mid; }
    else lo = mid;
  }
  // 微調
  while (best > 500) {
    if (trySV(best - 500).sv >= capDist) best -= 500;
    else break;
  }

  return trySV(best);
}

// 完整計算：整合所有衍生值
export function compute(S) {
  const workYears = S.retirementAge - S.currentAge;
  const retireYears = S.lifeExpectancy - S.retirementAge;
  const payYears = workYears + 1;
  const totalNeed = S.monthlyExpense * retireYears * 12;
  const selfAnnual = workYears > 0 ? totalNeed / workYears : 0;
  const selfMonthly = selfAnnual / 12;
  const distRate = 0.0468, distNav = 7.83;
  const preparedMonthly = S.preparedAmount * 0.07 / 12;
  const netMonthlyExpense = Math.max(0, S.monthlyExpense - preparedMonthly);
  const capDist = netMonthlyExpense * 12 / 0.07;

  const ac = goalSeek(S, capDist);
  const ri = Math.min(workYears, (ac.res?.length || 1) - 1);
  const svR = ac.res[ri]?.sv || 0;
  const units = svR / distNav;
  const monthDist = svR * 0.07 / 12;
  const policyAnnual = ac.at + ac.me * 12;
  const policyMonthly = policyAnnual / 12;
  const expW = S.monthlyExpense / 10000;
  const needW = Math.round(totalNeed / 10000);
  const capW = Math.round(capDist / 10000);

  return {
    workYears, retireYears, payYears, totalNeed, selfAnnual, selfMonthly,
    capDist, preparedMonthly, netMonthlyExpense,
    monthlySaving: ac.ms, monthlyExtra: ac.me, annualTarget: ac.at,
    saWan: ac.sw, sa: ac.si, opt: ac.res, ri, svR, units, monthDist,
    policyAnnual, policyMonthly, expW, needW, capW, distRate, distNav
  };
}
