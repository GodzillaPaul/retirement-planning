// ═══ ui.js V1.26 — 畫面渲染與事件綁定 ═══
import { DEFAULT_MALE, DEFAULT_FEMALE, MAX_MS } from './constants.js';
import { compute, fmt } from './engine.js';

export function getAvatar(S) {
  return S.clientPhoto || (S.gender === "M" ? DEFAULT_MALE : DEFAULT_FEMALE);
}

// 統一縮放：固定寬度容器適應任何螢幕，並確保置中
export function scaleWrap(id, designWidth) {
  const el = document.getElementById(id);
  if (!el) return;
  const vw = Math.min(window.innerWidth, document.documentElement.clientWidth);
  const scale = Math.min(1, (vw - 16) / designWidth);
  // translateX 補正：scale 後寬度縮小，需往右移讓它置中
  const offset = (vw - designWidth * scale) / 2;
  el.style.transform = `translateX(${offset}px) scale(${scale})`;
  el.style.marginBottom = `${(scale - 1) * el.offsetHeight}px`;
}


// ─── 輸入頁 ───
export function renderInputPage(S, onStateChange, onGenerate) {
  const D = compute(S);
  const IC = "w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-800 text-right text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400";
  const RO = IC + " bg-gray-50 cursor-not-allowed text-blue-600 font-bold";

  return {
    html: `
    <div id="input-outer" class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 safe-pad">
      <div id="input-wrap">
        <h1 class="text-2xl font-black text-center text-gray-800 mb-1 mt-2">退休財務計畫書</h1>
        <p class="text-center text-gray-400 text-sm mb-6">請輸入客戶資料與規劃參數</p>

        <div class="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <h2 class="text-sm font-bold text-blue-600 mb-3">❶ 客戶基本資料</h2>
          <div class="flex flex-col items-center mb-5">
            <div id="photoBox" class="w-20 h-20 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 overflow-hidden bg-gray-50">
              <img src="${getAvatar(S)}" class="w-full h-full object-cover"/>
            </div>
            <input type="file" id="photoInput" accept="image/*" class="hidden"/>
            <div class="flex gap-3 mt-2">
              <span class="text-xs text-blue-500 cursor-pointer hover:underline" id="changePhoto">更換照片</span>
              ${S.clientPhoto ? `<span class="text-xs text-red-400 cursor-pointer hover:underline" id="removePhoto">移除照片</span>` : ""}
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2"><label class="text-xs font-semibold text-gray-500 mb-1 block">姓名</label><input type="text" id="iName" value="${S.clientName}" placeholder="請輸入客戶姓名" class="${IC} text-left"/></div>
            <div><label class="text-xs font-semibold text-gray-500 mb-1 block">性別</label><select id="iGender" class="${IC} text-center"><option value="M" ${S.gender === "M" ? "selected" : ""}>男</option><option value="F" ${S.gender === "F" ? "selected" : ""}>女</option></select></div>
            <div><label class="text-xs font-semibold text-gray-500 mb-1 block">目前年齡</label><input type="number" id="iAge" value="${S.currentAge}" class="${IC}" min="16" max="70"/></div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <h2 class="text-sm font-bold text-blue-600 mb-3">❷ 退休規劃設定</h2>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs font-semibold text-gray-500 mb-1 block">預計退休年齡</label><input type="number" id="iRetire" value="${S.retirementAge}" class="${IC}" min="40" max="80"/></div>
            <div><label class="text-xs font-semibold text-gray-500 mb-1 block">平均餘命</label><input type="number" id="iLife" value="${S.lifeExpectancy}" class="${IC}" min="60" max="110"/></div>
            <div><label class="text-xs font-semibold text-gray-500 mb-1 block">預計退休花費（月）</label><input type="number" id="iExpense" value="${S.monthlyExpense}" class="${IC}" step="5000"/></div>
            <div><label class="text-xs font-semibold text-gray-500 mb-1 block">已準備退休金</label><input type="number" id="iPrepared" value="${S.preparedAmount}" class="${IC}" step="100000"/></div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <h2 class="text-sm font-bold text-blue-600 mb-3">❸ 保單自動試算結果</h2>
          <p class="text-xs text-gray-400 mb-4">依據退休花費與年齡自動計算。月存上限 ${fmt(MAX_MS)} 元，超出自動轉入月超額保費。</p>
          ${S.preparedAmount > 0 ? `<div class="mb-4 bg-amber-50 rounded-xl px-4 py-2 text-sm text-amber-800">已準備退休金 ${fmt(S.preparedAmount)} 元，以 7% 年化換算每月可提供 <b>${fmt(Math.round(D.preparedMonthly))}</b> 元，保單目標缺口已自動扣除。</div>` : ""}
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs font-semibold text-gray-500 mb-1 block">假設投報率 %</label><input type="number" id="iReturn" value="${S.assumedReturn}" class="${IC}" min="0" max="12" step="0.5"/></div>
            <div><label class="text-xs font-semibold text-gray-500 mb-1 block">需準備退休資金${S.preparedAmount > 0 ? ` <span class="text-amber-500 text-xs">（扣除後缺口）</span>` : ""}</label><div class="${RO}">${fmt(Math.round(D.capDist))}</div></div>
            <div><label class="text-xs font-semibold text-gray-500 mb-1 block">月存金額</label><div class="${RO}">${fmt(D.monthlySaving)}${D.monthlySaving >= MAX_MS ? `<span class="text-orange-500 text-xs ml-2">已達上限</span>` : ""}</div></div>
            <div><label class="text-xs font-semibold text-gray-500 mb-1 block">年目標保費</label><div class="${RO}">${fmt(D.annualTarget)}</div></div>
            <div><label class="text-xs font-semibold text-gray-500 mb-1 block">月超額保費${D.monthlyExtra > 0 ? ` <span class="text-blue-500">（自動溢出）</span>` : ""}</label><div class="${RO}">${fmt(D.monthlyExtra)}</div></div>
            <div><label class="text-xs font-semibold text-gray-500 mb-1 block">基本保額（萬）</label><div class="${RO}">${fmt(D.saWan)}</div></div>
          </div>
          <div class="mt-4 bg-blue-50 rounded-xl p-3 text-sm text-blue-800">
            <b>每月總存入：</b>${fmt(Math.round(D.policyMonthly))} 元 → 退休時預估解約金 <b class="text-green-700">${fmt(D.svR)}</b> 元
          </div>
        </div>

        <button id="btnGenerate" class="tap-btn w-full py-4 rounded-2xl text-white font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-500 active:from-blue-700 active:to-blue-600 shadow-lg cursor-pointer mt-2 mb-4">產生退休財務計畫書 →</button>
      </div>
    </div>`,
    bind() {
      document.getElementById("photoBox").onclick = () => document.getElementById("photoInput").click();
      document.getElementById("changePhoto").onclick = () => document.getElementById("photoInput").click();
      document.getElementById("photoInput").onchange = e => {
        const f = e.target.files?.[0];
        if (f) { const r = new FileReader(); r.onload = ev => { S.clientPhoto = ev.target.result; onStateChange(); }; r.readAsDataURL(f); }
      };
      if (document.getElementById("removePhoto")) document.getElementById("removePhoto").onclick = () => { S.clientPhoto = null; onStateChange(); };
      document.getElementById("iName").oninput = e => { S.clientName = e.target.value; };
      document.getElementById("iGender").onchange = e => { S.gender = e.target.value; onStateChange(); };
      document.getElementById("iAge").onchange = e => { S.currentAge = +e.target.value; onStateChange(); };
      document.getElementById("iRetire").onchange = e => { S.retirementAge = +e.target.value; onStateChange(); };
      document.getElementById("iLife").onchange = e => { S.lifeExpectancy = +e.target.value; onStateChange(); };
      document.getElementById("iExpense").onchange = e => { S.monthlyExpense = +e.target.value; onStateChange(); };
      document.getElementById("iPrepared").onchange = e => { S.preparedAmount = +e.target.value; };
      document.getElementById("iReturn").onchange = e => { S.assumedReturn = +e.target.value; onStateChange(); };
      document.getElementById("btnGenerate").onclick = onGenerate;
      scaleWrap("input-wrap", 480);
    }
  };
}

// ─── 報告頁 ───
export function renderReportPage(S, onBack, onPdfClick, onImgClick) {
  const D = compute(S);

  const ticks = Array.from({ length: 21 }, (_, i) => i * 5).map(n =>
    `<div class="absolute flex flex-col items-center" style="left:${n}%;transform:translateX(-50%)"><div class="w-px h-1.5 bg-gray-300"></div><span class="text-xs text-gray-400 leading-none mt-0.5">${n}</span></div>`
  ).join("");

  const tableRows = D.opt.filter((_, i) => (i + 1) % 5 === 0 || i === 0 || i === D.ri).map(r =>
    `<tr class="border-t border-gray-200 ${r.year === D.workYears + 1 ? 'bg-yellow-50 font-bold' : ''}"><td class="px-2 py-1.5 text-center">${r.year}</td><td class="px-2 py-1.5 text-center">${r.age}</td><td class="px-2 py-1.5 text-right">${fmt(r.cum)}</td><td class="px-2 py-1.5 text-right text-blue-700">${fmt(r.av)}</td><td class="px-2 py-1.5 text-right text-green-700">${fmt(r.sv)}</td><td class="px-2 py-1.5 text-right">${fmt(r.db)}</td></tr>`
  ).join("");

  return {
    html: `
  <div id="report-outer" class="bg-white safe-pad">
    <div id="report-wrap">
      <button id="btnBack" class="tap-btn no-print flex items-center gap-2 text-blue-600 text-sm font-medium mb-4 cursor-pointer px-3 py-2 rounded-xl bg-blue-50">◀ 返回修改</button>

      <div class="flex items-center gap-4 mb-3">
        <div class="flex-shrink-0" style="width:120px;height:120px">
          <div class="w-full h-full rounded-full overflow-hidden bg-gray-900 shadow-lg">
            <img src="${getAvatar(S)}" class="w-full h-full object-cover"/>
          </div>
        </div>
        <div class="flex flex-col justify-center gap-1 min-w-0">
          <h1 class="lantin" style="font-size:2.4rem;line-height:1.1;color:#2d2d2d;letter-spacing:0.03em">退休財務計畫書</h1>
          <div class="lantin" style="font-size:1.3rem;color:#555;font-weight:700;letter-spacing:0.05em">${S.clientName || "客戶名稱"}</div>
        </div>
      </div>

      <table class="w-full border-collapse text-sm mb-3"><tbody>
        <tr><td class="border border-gray-300 bg-gray-50 px-3 py-2 font-bold text-center w-1/4">目前年齡</td><td class="border border-gray-300 px-3 py-2 text-center font-bold w-1/4">${S.currentAge}歲</td><td class="border border-gray-300 bg-gray-50 px-3 py-2 font-bold text-center w-1/4">預計退休年齡</td><td class="border border-gray-300 px-3 py-2 text-center font-bold w-1/4">${S.retirementAge}歲</td></tr>
        <tr><td class="border border-gray-300 bg-gray-50 px-3 py-2 font-bold text-center">預計退休花費</td><td class="border border-gray-300 px-3 py-2 text-center font-bold">${D.expW}萬 / 月</td><td class="border border-gray-300 bg-gray-50 px-3 py-2 font-bold text-center">已準備退休金</td><td class="border border-gray-300 px-3 py-2 text-center font-bold">${S.preparedAmount > 0 ? fmt(S.preparedAmount) : "？"}</td></tr>
      </tbody></table>

      <div class="mb-3">
        <div class="flex text-[10px] text-gray-500 font-bold mb-1" style="-webkit-print-color-adjust:exact;print-color-adjust:exact">
          <div style="width:${S.currentAge}%" class="text-center">目前年紀</div>
          <div style="width:${S.retirementAge - S.currentAge}%" class="text-center">預計剩餘工作時間</div>
          <div style="width:${S.lifeExpectancy - S.retirementAge}%" class="text-center">退休生活時間</div>
          <div style="width:${100 - S.lifeExpectancy}%" class="text-center">超越平均餘命</div>
        </div>
        <div class="relative flex rounded-lg overflow-hidden font-black text-base" style="height:40px;-webkit-print-color-adjust:exact;print-color-adjust:exact">
          <div class="flex items-center justify-center overflow-hidden" style="width:${S.currentAge}%;background:#E2D3B9;color:#fff"><span class="whitespace-nowrap">${S.currentAge}年</span></div>
          <div class="flex items-center justify-center overflow-hidden" style="width:${S.retirementAge - S.currentAge}%;background:#CBA7AB;color:#fff"><span class="whitespace-nowrap">${D.workYears}年</span></div>
          <div class="flex items-center justify-center overflow-hidden" style="width:${S.lifeExpectancy - S.retirementAge}%;background:#B2C7BB;color:#fff"><span class="whitespace-nowrap">${D.retireYears}年</span></div>
          <div class="flex items-center justify-center overflow-hidden" style="width:${100 - S.lifeExpectancy}%;background:#8C9FB4;color:#fff"><span class="whitespace-nowrap">${100 - S.lifeExpectancy}年</span></div>
        </div>
        <div class="relative h-4 mt-0.5">${ticks}</div>
      </div>

      <table class="w-full border-collapse text-sm mb-3">
        <thead><tr><th class="border-2 border-gray-400 bg-gray-100 px-3 py-2 text-sm w-1/2">退休方案一</th><th class="border-2 border-gray-400 bg-gray-100 px-3 py-2 text-sm w-1/2">退休方案二</th></tr></thead>
        <tbody>
          <tr><td class="border border-gray-300 px-4 py-3 text-center">準備好退休金，每個月花存款${D.expW}萬元</td><td class="border border-gray-300 px-4 py-3 text-center">打造月配息每個月領${D.expW}萬元</td></tr>
          <tr><td class="border border-gray-300 px-4 py-3 text-center">需準備：${D.expW}萬 × 12個月 × ${D.retireYears}年 ＝ <span class="text-red-600 font-black text-xl">${D.needW}萬</span></td><td class="border border-gray-300 px-4 py-3 text-center">需準備：富邦月配息 7%<span class="text-blue-600 font-black text-xl">（約${D.capW}萬）</span>${S.preparedAmount > 0 ? `<div class="text-xs text-amber-600 mt-1">已扣除已準備退休金每月 ${fmt(Math.round(D.preparedMonthly))} 元</div>` : ""}</td></tr>
          <tr><td class="border border-gray-300 px-4 py-3 text-center bg-gray-50 font-bold">自己存</td><td class="border border-gray-300 px-4 py-3 text-center bg-gray-50 font-bold">富邦退休規劃方案</td></tr>
          <tr><td class="border border-gray-300 px-4 py-4 text-center"><div class="mb-1">每年存下：${fmt(Math.round(D.selfAnnual))}</div><div class="text-red-600 font-black text-xl">每月存下：${fmt(Math.round(D.selfMonthly))}</div></td><td class="border border-gray-300 px-4 py-4 text-center"><div class="mb-1">每年存下：${fmt(D.policyAnnual)}</div><div class="text-blue-600 font-black text-xl">每月存下：${fmt(Math.round(D.policyMonthly))}</div></td></tr>
        </tbody>
      </table>

      <div id="page2-start" class="flex gap-3 mb-2">
        <div class="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-4 border border-blue-100" style="flex:0 0 65%">
          <h2 class="text-base font-black text-gray-800 mb-1">富邦退休規劃方案明細</h2>
          <p class="text-xs text-gray-500 mb-3">年目標保費 ${fmt(D.annualTarget)} ｜月超額保費 ${fmt(D.monthlyExtra)} ｜壽險保額 ${D.saWan}萬 ｜假設投報率 ${S.assumedReturn}%</p>
          <table class="w-full text-xs border-collapse tbl-mobile">
            <thead><tr class="bg-blue-600 text-white"><th class="px-2 py-1 text-center">年度</th><th class="px-2 py-1 text-center">年齡</th><th class="px-2 py-1 text-right">累計投入</th><th class="px-2 py-1 text-right">帳戶價值</th><th class="px-2 py-1 text-right">解約金</th><th class="px-2 py-1 text-right">身故保障</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
        <div class="flex flex-col gap-4" style="flex:0 0 calc(35% - 1rem)">
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
            <h2 class="text-base font-black text-gray-800 mb-2">退休後月配息試算</h2>
            <p class="text-xs text-gray-500 mb-3">以退休時解約金 ${fmt(D.svR)} 元<br>按年配息率 7% 試算</p>
            <div class="flex flex-col gap-2">
              <div class="bg-white rounded-xl px-2 py-2 shadow-sm text-center"><div class="text-xs text-gray-400 mb-1">退休時解約金</div><div class="text-sm font-bold text-gray-800">${fmt(D.svR)}</div></div>
              <div class="bg-white rounded-xl px-2 py-2 shadow-sm text-center"><div class="text-xs text-gray-400 mb-1">每月配息金額</div><div class="text-xl font-black text-green-600">${fmt(D.monthDist)}</div></div>
              <div class="bg-white rounded-xl px-2 py-2 shadow-sm text-center"><div class="text-xs text-gray-400 mb-1">年度總配息</div><div class="text-base font-bold text-green-600">${fmt(D.monthDist * 12)}</div></div>
            </div>
          </div>
          <p class="text-xs text-gray-400 text-center leading-relaxed px-1">⚠ 本計畫書僅供參考試算，實際保單利益以富邦人壽正式建議書為準。假設投資報酬率不代表未來實際報酬。</p>
        </div>
      </div>

      <div class="no-print flex justify-center gap-4 mt-8 mb-4">
        <button id="btnPDF" class="tap-btn flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-base bg-gradient-to-r from-red-500 to-red-600 shadow-lg cursor-pointer">
          <svg id="pdfIcon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <span id="pdfLabel">儲存為 PDF</span>
        </button>
        <button id="btnIMG" class="tap-btn flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-base bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg cursor-pointer">
          <svg id="imgIcon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <span id="imgLabel">另存為圖片</span>
        </button>
      </div>
    </div>
  </div>`,
    bind() {
      document.getElementById("btnBack").onclick = onBack;
      scaleWrap("report-wrap", 780);
      document.getElementById("btnPDF").onclick = () => onPdfClick(S);
      document.getElementById("btnIMG").onclick = () => onImgClick(S);
    }
  };
}
