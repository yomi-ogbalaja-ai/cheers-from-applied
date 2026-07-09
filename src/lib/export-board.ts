import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

// GIFs (e.g. from Giphy) render as their first frame only — html-to-image
// rasterizes a single snapshot of the DOM, it doesn't play animations.
async function renderPng(el: HTMLElement): Promise<string> {
  return toPng(el, {
    backgroundColor: "#ffffff",
    pixelRatio: 2,
    cacheBust: true,
  });
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}

export async function downloadBoardAsImage(el: HTMLElement, filename: string) {
  const dataUrl = await renderPng(el);
  triggerDownload(dataUrl, `${filename}.png`);
}

export async function downloadBoardAsPdf(el: HTMLElement, filename: string) {
  const dataUrl = await renderPng(el);
  const { width, height } = el.getBoundingClientRect();

  const pdf = new jsPDF({
    orientation: height > width ? "portrait" : "landscape",
    unit: "px",
    format: [width, height],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
  pdf.save(`${filename}.pdf`);
}
