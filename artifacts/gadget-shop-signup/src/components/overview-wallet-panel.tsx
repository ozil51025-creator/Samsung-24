import { ArrowDownToLine, ArrowUpFromLine, Clock3, Wallet } from 'lucide-react';

const walletTotals = [
  { label: 'Total accumulated', detail: 'Recorded total' },
  { label: 'Available to withdraw', detail: 'Withdrawable balance' },
  { label: 'Total deposited', detail: 'Wallet top-ups' },
  { label: 'Total withdrawn', detail: 'Completed withdrawals' },
];

export function OverviewWalletPanel() {
  return (
    <section
      className="mt-6 rounded-[22px] border border-white/10 bg-[#14201b]/80 p-4 shadow-[0_14px_36px_rgba(0,0,0,.18)] sm:p-5"
      aria-labelledby="wallet-summary-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#b9cdb4]">
            <Wallet className="h-4 w-4 text-[#edbd76]" aria-hidden="true" />
            Member wallet
          </p>
          <h2 id="wallet-summary-title" className="mt-2 font-[Syne] text-[22px] font-semibold tracking-[-.04em] text-white">
            Wallet summary
          </h2>
        </div>
        <span className="rounded-full border border-[#e3b67a]/25 bg-[#e3b67a]/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-[#f0c98e]">
          PesaJet unavailable
        </span>
      </div>

      <p className="mt-3 max-w-[640px] text-[11px] leading-5 text-white/55">
        Wallet funding and withdrawals are not connected. No balance is available or recorded yet.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {walletTotals.map(({ label, detail }) => (
          <article key={label} className="min-w-0 rounded-[16px] border border-white/[.09] bg-white/[.045] p-3">
            <p className="text-[9px] font-bold uppercase leading-4 tracking-[.06em] text-white/50">{label}</p>
            <p className="mt-2 font-[Syne] text-[13px] font-bold leading-tight text-white">Not available</p>
            <p className="mt-1 text-[9px] leading-4 text-white/40">{detail} · UGX</p>
          </article>
        ))}
      </div>

      <p id="wallet-actions-note" className="sr-only">
        Deposit and withdrawal actions are unavailable until a supported payment provider is connected.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled
          aria-describedby="wallet-actions-note"
          title="Wallet provider is unavailable"
          className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-[14px] bg-[#e9b975]/55 px-4 text-[12px] font-bold text-[#211d18]/65"
        >
          <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
          Deposit
        </button>
        <button
          type="button"
          disabled
          aria-describedby="wallet-actions-note"
          title="Wallet provider is unavailable"
          className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-white/[.04] px-4 text-[12px] font-bold text-white/45"
        >
          <ArrowUpFromLine className="h-4 w-4" aria-hidden="true" />
          Withdraw
        </button>
      </div>

      <section
        className="mt-4 rounded-[16px] border border-white/10 bg-white/[.035] p-3.5"
        aria-labelledby="withdrawal-terms-title"
        data-testid="wallet-withdrawal-terms"
      >
        <h3 id="withdrawal-terms-title" className="text-[11px] font-bold text-white/85">
          Withdrawal terms
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[.07em] text-white/45">Minimum withdrawal</p>
            <p className="mt-1 text-[12px] font-bold text-white">UGX 10,000</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[.07em] text-white/45">Withdrawal fee</p>
            <p className="mt-1 text-[12px] font-bold text-white">20%</p>
          </div>
        </div>
        <p className="mt-2 text-[10px] leading-5 text-white/50">
          The fee is deducted from each withdrawal; the remaining 80% is paid out. Withdrawals are not available until a payment provider is connected.
        </p>
      </section>

      <section id="wallet-history" className="mt-5 border-t border-white/10 pt-4" aria-labelledby="wallet-history-title">
        <h3 id="wallet-history-title" className="flex items-center gap-2 text-[12px] font-semibold text-white/80">
          <Clock3 className="h-4 w-4 text-[#edbd76]" aria-hidden="true" />
          Account history
        </h3>
        <div className="mt-3 rounded-[15px] border border-dashed border-white/15 px-4 py-4 text-center">
          <p className="text-[11px] font-semibold text-white/70">Wallet history unavailable</p>
          <p className="mt-1 text-[10px] leading-5 text-white/45">
            No transaction source is connected, so account activity cannot be shown yet.
          </p>
        </div>
      </section>
    </section>
  );
}
