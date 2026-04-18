// ═══ export-service.js V1.26 — PDF + 圖片匯出 ═══

// 共用：截圖前還原 transform，截完恢復
async function captureReport() {
  const wrapEl = document.getElementById("report-wrap");
  const noPrint = document.querySelectorAll(".no-print");
  noPrint.forEach(el => el.style.display = "none");

  const prevTransform = wrapEl.style.transform;
  const prevMargin = wrapEl.style.marginBottom;
  wrapEl.style.transform = "none";
  wrapEl.style.marginBottom = "0";
  await new Promise(r => setTimeout(r, 80));

  const canvas = await html2canvas(wrapEl, {
    scale: 2, useCORS: true, allowTaint: true,
    backgroundColor: "#ffffff", logging: false,
    windowWidth: 780, width: 780,
    scrollX: 0, scrollY: -wrapEl.getBoundingClientRect().top
  });

  wrapEl.style.transform = prevTransform;
  wrapEl.style.marginBottom = prevMargin;
  noPrint.forEach(el => el.style.display = "");
  return canvas;
}

function getFileName(S, ext) {
  const name = (S.clientName || "客戶").replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `退休財務計畫書_${name}_${date}.${ext}`;
}

function setLoading(btnId, labelId, iconId, loading, defaultLabel) {
  const btn = document.getElementById(btnId);
  const label = document.getElementById(labelId);
  const icon = document.getElementById(iconId);
  if (loading) {
    btn.disabled = true;
    label.textContent = "產生中…";
    icon.innerHTML = '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10" style="animation:spin 1s linear infinite"/>';
  } else {
    btn.disabled = false;
    label.textContent = defaultLabel;
  }
}

const PDF_ICON = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>';
const IMG_ICON = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>';

export async function exportPDF(S) {
  setLoading("btnPDF", "pdfLabel", "pdfIcon", true);
  try {
    const canvas = await captureReport();
    const { jsPDF } = window.jspdf;
    const PDF_W = 210, PDF_H = 297, MARGIN = 8;
    const contentW = PDF_W - MARGIN * 2, contentH = PDF_H - MARGIN * 2;
    const ratio = canvas.width / canvas.height;
    let imgW = contentW, imgH = imgW / ratio;
    if (imgH > contentH) { imgH = contentH; imgW = imgH * ratio; }
    const x = MARGIN + (contentW - imgW) / 2, y = MARGIN + (contentH - imgH) / 2;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.93), "JPEG", x, y, imgW, imgH);
    pdf.save(getFileName(S, "pdf"));
    document.getElementById("pdfIcon").innerHTML = PDF_ICON;
  } catch (e) {
    console.error(e);
  }
  setLoading("btnPDF", "pdfLabel", "pdfIcon", false, "儲存為 PDF");
}

export async function exportImage(S) {
  setLoading("btnIMG", "imgLabel", "imgIcon", true);
  try {
    const canvas = await captureReport();
    const dataUrl = canvas.toDataURL("image/png", 1.0);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = getFileName(S, "png");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    document.getElementById("imgIcon").innerHTML = IMG_ICON;
  } catch (e) {
    console.error(e);
  }
  setLoading("btnIMG", "imgLabel", "imgIcon", false, "另存為圖片");
}
