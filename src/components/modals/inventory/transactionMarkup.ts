import { InventoryTransaction } from '../../../models/InventoryTransaction';

export function renderTransactionItems(transactions: InventoryTransaction[]): string {
  if (transactions.length === 0) {
    return `<div class="py-12 text-center text-[#77716D] font-serif text-xs">No activity records found.</div>`;
  }

  return transactions
    .map((tx) => {
      const isPositive = tx.quantityChange > 0;
      const changeStr = `${isPositive ? '+' : ''}${tx.quantityChange} ${tx.unit}`;
      let badgeColor = '';
      if (tx.type === 'Purchase') badgeColor = 'bg-[#EAF5EA] text-[#3E703E] border-[#D5EAD5]';
      else if (tx.type === 'Meal Usage') badgeColor = 'bg-[#FDF4E7] text-[#B87A24] border-[#F6DEBD]';
      else if (tx.type === 'Reversal') badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
      else if (tx.type === 'Waste') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
      else badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';

      const dateStr = new Date(tx.timestamp).toLocaleString('en-ZA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      return `
        <div class="p-3 rounded-2xl glass-card flex items-center justify-between border border-white/80">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-full text-[10.5px] font-semibold border ${badgeColor}">
              ${tx.type}
            </span>
            <div class="flex flex-col">
              <span class="text-xs font-semibold text-[#25221F]">${tx.ingredientName}</span>
              <span class="text-[11px] text-[#77716D]">${tx.notes || ''} ${tx.mealTitle ? `· ${tx.mealTitle}` : ''}</span>
            </div>
          </div>

          <div class="flex flex-col items-end">
            <span class="text-xs font-bold tabular-nums ${isPositive ? 'text-[#3E703E]' : 'text-[#8C5C26]'}">
              ${changeStr}
            </span>
            <span class="text-[10px] text-[#77716D]">${dateStr}</span>
          </div>
        </div>
      `;
    })
    .join('');
}
