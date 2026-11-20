import { BaseModal } from '../BaseModal';
import { getIconSvg } from '../../../utils/iconHelper';

export class PwaGuideModal extends BaseModal<void> {
  render(overlay: HTMLElement): void {
    const signal = this.beginRender(overlay);

    overlay.innerHTML = `
      <div class="glass-panel w-full max-w-sm p-6 flex flex-col gap-4 bg-white/95 rounded-3xl shadow-xl animate-fade-in text-center">
        <div class="w-12 h-12 rounded-2xl bg-[#FBF5ED] border border-[#F3E2CE] flex items-center justify-center text-[#D9A441] mx-auto">
          ${getIconSvg('download', 'w-6 h-6')}
        </div>
        <h3 class="text-lg font-serif font-bold text-[#25221F]">Install on iPhone / iPad</h3>
        <p class="text-xs text-[#77716D] leading-relaxed">
          1. Tap the <strong>Share</strong> button in Safari's bottom toolbar.<br />
          2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
          3. Tap <strong>Add</strong> in the top-right corner.
        </p>
        <button id="modal-close-btn" class="w-full py-2.5 rounded-xl bg-[#25221F] text-white text-xs font-medium cursor-pointer">
          Done
        </button>
      </div>
    `;

    this.bindCloseButton(overlay, signal);
  }
}
