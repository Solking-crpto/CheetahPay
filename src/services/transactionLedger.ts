import type { UnifiedTransaction } from '../types/cheetahpay.ts';
import { STORAGE_PAYMENTS_KEY, type StoredPayment, EXPLORER_URL } from '../contracts/paymentRouter.ts';
import { FiatOnrampService } from './fiatOnrampService.ts';
import { ZcashShieldService } from './zcashShieldService.ts';

export class TransactionLedger {
  /**
   * Aggregate and normalize all transactions across the three rails:
   * 1. Fiat on-ramp deposits
   * 2. Arc USDC merchant payments & refunds
   * 3. CheetahPay Shield Zcash checkouts
   */
  public static getAllTransactions(): UnifiedTransaction[] {
    const list: UnifiedTransaction[] = [];

    // 1. Arc USDC payments from PaymentRouter
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_PAYMENTS_KEY);
        if (stored) {
          const payments: StoredPayment[] = JSON.parse(stored);
          payments.forEach((p) => {
            list.push({
              id: p.paymentId,
              timestamp: p.timestamp,
              rail: 'arc-usdc',
              type: p.status === 'FullyRefunded' || p.status === 'PartiallyRefunded' ? 'refund' : 'merchant-payment',
              sourceAsset: 'USDC',
              targetAsset: 'USDC',
              sourceAmount: p.amount,
              targetAmount: p.amount,
              fromAddress: p.payer,
              toAddress: p.merchant,
              status: p.status === 'FullyRefunded' ? 'Refunded' : 'Completed',
              txHash: p.txHash,
              explorerUrl: `${EXPLORER_URL}/tx/${p.txHash}`,
              memoOrReference: `Router Payment ID: ${p.paymentId.slice(0, 10)}...`,
              provenance: 'onchain-verified',
            });
          });
        }
      }
    } catch (e) {
      console.error('Failed to parse Arc payments', e);
    }

    // 2. Fiat On-Ramp records
    try {
      const fiatRecords = FiatOnrampService.getSavedRecords();
      fiatRecords.forEach((f) => {
        let status: UnifiedTransaction['status'] = 'Pending';
        if (f.status === 'COMPLETED') status = 'Completed';
        else if (f.status === 'FAILED' || f.status === 'CANCELLED' || f.status === 'EXPIRED') status = 'Failed';

        list.push({
          id: f.id,
          timestamp: f.createdAt,
          rail: 'fiat-onramp',
          type: 'deposit',
          sourceAsset: f.quote.sourceCurrency,
          targetAsset: f.quote.targetAsset,
          sourceAmount: f.quote.sourceAmount.toString(),
          targetAmount: f.quote.targetAmount.toString(),
          fromAddress: `${f.quote.paymentMethod.toUpperCase()} (${f.provider})`,
          toAddress: f.quote.destinationWallet,
          status,
          txHash: f.deliveryTxHash,
          explorerUrl: f.explorerUrl,
          memoOrReference: f.providerReference,
          provenance: f.status === 'COMPLETED' ? 'onchain-verified' : 'provider-pending',
        });
      });
    } catch (e) {
      console.error('Failed to parse fiat records', e);
    }

    // 3. CheetahPay Shield Zcash invoices
    try {
      const zcashInvoices = ZcashShieldService.getSavedInvoices();
      zcashInvoices.forEach((z) => {
        let status: UnifiedTransaction['status'] = 'Pending';
        if (z.status === 'CONFIRMED') status = 'Completed';
        else if (z.status === 'CONFIRMING' || z.status === 'SUBMITTED') status = 'Confirming';
        else if (z.status === 'EXPIRED' || z.status === 'FAILED' || z.status === 'CANCELLED') status = 'Failed';

        list.push({
          id: z.invoiceId,
          timestamp: z.createdAt,
          rail: 'zcash-shield',
          type: 'shield-payment',
          sourceAsset: 'ZEC',
          targetAsset: 'ZEC',
          sourceAmount: z.amountZec,
          targetAmount: z.amountZec,
          fromAddress: z.addressType === 'transparent' ? 'Public Zcash Wallet' : '🛡️ Shielded Address (Hidden)',
          toAddress: z.merchantAddress,
          status,
          txHash: z.txid,
          explorerUrl: z.explorerUrl,
          memoOrReference: z.memo,
          provenance: z.status === 'CONFIRMED' ? 'onchain-verified' : z.txid ? 'network-pending' : 'invoice-created',
        });
      });
    } catch (e) {
      console.error('Failed to parse Zcash invoices', e);
    }

    // Sort descending by timestamp
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Export transactions to CSV for auditing.
   */
  public static exportToCsv(): string {
    const txs = this.getAllTransactions();
    const headers = [
      'ID',
      'Timestamp',
      'Rail',
      'Type',
      'Source Asset',
      'Source Amount',
      'Target Asset',
      'Target Amount',
      'From Address / Method',
      'To Address',
      'Status',
      'TxHash / Ref',
      'Provenance',
    ];

    const rows = txs.map((t) => [
      t.id,
      new Date(t.timestamp).toISOString(),
      t.rail,
      t.type,
      t.sourceAsset,
      t.sourceAmount,
      t.targetAsset,
      t.targetAmount,
      `"${t.fromAddress}"`,
      `"${t.toAddress}"`,
      t.status,
      t.txHash || '',
      t.provenance,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
