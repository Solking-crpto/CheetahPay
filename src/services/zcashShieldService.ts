import type {
  ZcashInvoice,
  ZcashPrivacyRating,
  ZcashAddressType,
  ZcashNetwork,
  ZcashVerificationResult,
} from '../types/cheetahpay.ts';

const STORAGE_INVOICES_KEY = 'cheetahpay_zcash_invoices';
const inMemoryInvoices: Map<string, ZcashInvoice> = new Map();

export const ZEC_DEFAULT_TESTNET_UNIFIED =
  'utest19m5e7s6z5r569n3l0j0d4g4q2a2s4d6f8g0h2j4k6l8z0x2c4v6b8n0m2q4w6e8r0t2y4u6i8o0p2a4s6d8f0g2h4j6k8l0z2x4c6v8b0n2m4q6w8e0r2t4y6u8i';
export const ZEC_DEFAULT_TESTNET_TRANSPARENT =
  'tmP3A9Y4YqS4yN8D2qZ9yR4vT8mK6bL1x2Y';

export const ZEC_TESTNET_EXPLORER_BASE = 'https://sochain.com/testnet/zec';
export const ZEC_MAINNET_EXPLORER_BASE = 'https://sochain.com/zec';

// Reference ZEC to USD exchange rate for estimation
export const ZEC_USD_PRICE = 32.50;

export class ZcashShieldService {
  /**
   * Classify address format using structural heuristic checks (prefix, length bounds, allowed character sets).
   *
   * LIMITATION NOTICE:
   * This is a structural heuristic classification, NOT a cryptographic checksum decoder.
   * Full cryptographic checksum validation (Bech32m polymod for Unified/Sapling, Base58Check
   * double-SHA256 for Transparent) requires an external Zcash address decoder library that is not
   * bundled in this client. This method checks format boundaries safely but does not verify checksums.
   */
  public static classifyAddress(address: string): {
    addressType: ZcashAddressType;
    network: ZcashNetwork;
    isValid: boolean;
    validationMethod: 'structural_heuristic';
    isCryptographicallyDecoded: false;
    error?: string;
  } {
    const clean = address.trim();
    if (!clean) {
      return {
        addressType: 'transparent',
        network: 'testnet',
        isValid: false,
        validationMethod: 'structural_heuristic',
        isCryptographicallyDecoded: false,
        error: 'Empty address string',
      };
    }

    const alphaNumRegex = /^[a-z0-9]+$/i;
    // Base58 charset: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;

    if (clean.startsWith('utest1')) {
      const isValid = clean.length >= 70 && alphaNumRegex.test(clean);
      return {
        addressType: 'shielded_unified',
        network: 'testnet',
        isValid,
        validationMethod: 'structural_heuristic',
        isCryptographicallyDecoded: false,
        error: isValid ? undefined : 'Invalid Unified Testnet address length (expected >= 70 chars) or format',
      };
    }
    if (clean.startsWith('u1')) {
      const isValid = clean.length >= 70 && alphaNumRegex.test(clean);
      return {
        addressType: 'shielded_unified',
        network: 'mainnet',
        isValid,
        validationMethod: 'structural_heuristic',
        isCryptographicallyDecoded: false,
        error: isValid ? undefined : 'Invalid Unified Mainnet address length (expected >= 70 chars) or format',
      };
    }
    if (clean.startsWith('ztestsapling')) {
      const isValid = clean.length >= 70 && alphaNumRegex.test(clean);
      return {
        addressType: 'shielded_sapling',
        network: 'testnet',
        isValid,
        validationMethod: 'structural_heuristic',
        isCryptographicallyDecoded: false,
        error: isValid ? undefined : 'Invalid Sapling Testnet address length (expected >= 70 chars) or format',
      };
    }
    if (clean.startsWith('zs1')) {
      const isValid = clean.length >= 70 && alphaNumRegex.test(clean);
      return {
        addressType: 'shielded_sapling',
        network: 'mainnet',
        isValid,
        validationMethod: 'structural_heuristic',
        isCryptographicallyDecoded: false,
        error: isValid ? undefined : 'Invalid Sapling Mainnet address length (expected >= 70 chars) or format',
      };
    }
    if (clean.startsWith('tm')) {
      const isValid = clean.length === 35 && base58Regex.test(clean);
      return {
        addressType: 'transparent',
        network: 'testnet',
        isValid,
        validationMethod: 'structural_heuristic',
        isCryptographicallyDecoded: false,
        error: isValid ? undefined : 'Invalid Transparent Testnet address length (must be 35 chars) or Base58 characters',
      };
    }
    if (clean.startsWith('t1') || clean.startsWith('t3')) {
      const isValid = clean.length === 35 && base58Regex.test(clean);
      return {
        addressType: 'transparent',
        network: 'mainnet',
        isValid,
        validationMethod: 'structural_heuristic',
        isCryptographicallyDecoded: false,
        error: isValid ? undefined : 'Invalid Transparent Mainnet address length (must be 35 chars) or Base58 characters',
      };
    }

    return {
      addressType: 'transparent',
      network: 'testnet',
      isValid: false,
      validationMethod: 'structural_heuristic',
      isCryptographicallyDecoded: false,
      error: 'Unrecognized Zcash address prefix. Expected utest1, u1, ztestsapling, zs1, tm, t1, or t3.',
    };
  }

  /**
   * Analyze privacy rating and distinguish address receiver capabilities from
   * runtime on-chain transaction privacy guarantees.
   */
  public static getPrivacyRating(address: string): ZcashPrivacyRating {
    const { addressType, isValid } = this.classifyAddress(address);

    if (!isValid || addressType === 'transparent') {
      return {
        addressType: 'transparent',
        isShielded: false,
        capabilityLevel: 'Transparent Only (Public Ledger)',
        level: 'Transparent Only (Public Ledger)',
        transactionPrivacyNotice:
          'Transparent address format — all transaction metadata is public on the blockchain ledger.',
        description:
          'Transactions to transparent addresses expose sender, recipient, and amount publicly on the blockchain ledger. Encrypted memos are not supported.',
        metadataVisibility: {
          senderAddress: 'Public',
          recipientAddress: 'Public',
          amount: 'Public',
          memoData: 'Public / Not Supported',
        },
      };
    }

    if (addressType === 'shielded_unified') {
      return {
        addressType: 'shielded_unified',
        isShielded: true,
        capabilityLevel: 'Shielded Receiver Capable (Unified)',
        level: 'Shielded Receiver Capable (Unified)',
        transactionPrivacyNotice:
          'Shielded address format — transaction privacy not yet verified.',
        description:
          'Unified Address with Orchard/Sapling receiver capability. Address format supports shielded incoming transfers. Actual payment confidentiality is verified only when your wallet constructs the zero-knowledge proof and the merchant wallet decrypts the note via Incoming Viewing Key (IVK).',
        metadataVisibility: {
          senderAddress: 'Concealed (if sender shields)',
          recipientAddress: 'Concealed by receiver pool',
          amount: 'Encrypted in note (if shielded)',
          memoData: 'Encrypted 512-byte payload (if shielded)',
        },
      };
    }

    return {
      addressType: 'shielded_sapling',
      isShielded: true,
      capabilityLevel: 'Shielded Receiver Capable (Sapling)',
      level: 'Shielded Receiver Capable (Sapling)',
      transactionPrivacyNotice:
        'Shielded address format — transaction privacy not yet verified.',
      description:
        'Sapling shielded address format. The address supports incoming shielded transfers. Transaction-level privacy is realized when the sender submits a shielded note and the merchant wallet decrypts the note.',
      metadataVisibility: {
        senderAddress: 'Concealed (if sender shields)',
        recipientAddress: 'Concealed by receiver pool',
        amount: 'Encrypted in note (if shielded)',
        memoData: 'Encrypted 512-byte payload (if shielded)',
      },
    };
  }

  /**
   * Generate ZIP-321 compliant Payment Request URI.
   * Spec: zcash:<address>?amount=<val>&memo=<base64url>&message=<msg>
   */
  public static generateZip321Uri(params: {
    address: string;
    amountZec: string;
    memo?: string;
    message?: string;
  }): string {
    const cleanAddress = params.address.trim();
    const queryParts: string[] = [];

    if (params.amountZec && Number(params.amountZec) > 0) {
      queryParts.push(`amount=${encodeURIComponent(params.amountZec)}`);
    }

    if (params.memo) {
      // In ZIP-321, standard memo is base64url-encoded without trailing '=' padding
      const rawBytes = new TextEncoder().encode(params.memo);
      let binary = '';
      for (let i = 0; i < rawBytes.length; i++) {
        binary += String.fromCharCode(rawBytes[i]);
      }
      const base64 = btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      queryParts.push(`memo=${base64}`);
    }

    if (params.message) {
      queryParts.push(`message=${encodeURIComponent(params.message)}`);
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return `zcash:${cleanAddress}${queryString}`;
  }

  /**
   * Parse a ZIP-321 Payment Request URI.
   * Specification: ZIP-321 Payment Request URIs
   * Supports: zcash:<address>?amount=<decimal>&memo=<base64url>&message=<text>
   */
  public static parseZip321Uri(uri: string): {
    isValid: boolean;
    address: string;
    amountZec?: string;
    memo?: string;
    message?: string;
    error?: string;
  } {
    const clean = uri.trim();
    if (!clean.startsWith('zcash:')) {
      return { isValid: false, address: '', error: 'URI must start with "zcash:" scheme' };
    }

    try {
      const withoutScheme = clean.slice(6);
      const [addressPart, queryPart] = withoutScheme.split('?');
      const address = decodeURIComponent(addressPart.trim());

      const classification = this.classifyAddress(address);
      if (!classification.isValid) {
        return {
          isValid: false,
          address,
          error: classification.error || `Invalid Zcash address in URI: ${address}`,
        };
      }

      let amountZec: string | undefined;
      let memo: string | undefined;
      let message: string | undefined;

      if (queryPart) {
        const searchParams = new URLSearchParams(queryPart);

        // Check primary or indexed .1 amount
        const rawAmount = searchParams.get('amount') || searchParams.get('amount.1');
        if (rawAmount) {
          const num = Number(rawAmount);
          if (isNaN(num) || num < 0) {
            return { isValid: false, address, error: `Invalid amount in ZIP-321 URI: ${rawAmount}` };
          }
          amountZec = rawAmount;
        }

        // Check memo: base64url encoded
        const rawMemo = searchParams.get('memo') || searchParams.get('memo.1');
        if (rawMemo) {
          try {
            // Restore base64 standard padding
            let b64 = rawMemo.replace(/-/g, '+').replace(/_/g, '/');
            while (b64.length % 4 !== 0) {
              b64 += '=';
            }
            const binary = atob(b64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            memo = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
          } catch {
            return { isValid: false, address, error: 'Failed to decode base64url memo in ZIP-321 URI' };
          }
        }

        // Check human-readable message
        const rawMessage = searchParams.get('message') || searchParams.get('message.1');
        if (rawMessage) {
          message = rawMessage;
        }
      }

      return {
        isValid: true,
        address,
        amountZec,
        memo,
        message,
      };
    } catch (e) {
      return {
        isValid: false,
        address: '',
        error: e instanceof Error ? e.message : 'Malformed ZIP-321 URI',
      };
    }
  }

  /**
   * Create a new CheetahPay Shield merchant invoice.
   */
  public static createInvoice(params: {
    merchantAddress: string;
    amountZec?: string;
    amountUsd?: string;
    itemDescription: string;
    merchantName?: string;
    expiryMinutes?: number;
  }): ZcashInvoice {
    const invoiceId = `CP-SHIELD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    let zec = params.amountZec || '0';
    let usd = params.amountUsd || '0';

    if (Number(zec) > 0 && Number(usd) === 0) {
      usd = (Number(zec) * ZEC_USD_PRICE).toFixed(2);
    } else if (Number(usd) > 0 && Number(zec) === 0) {
      zec = (Number(usd) / ZEC_USD_PRICE).toFixed(6);
    }

    const { addressType, network } = this.classifyAddress(params.merchantAddress);
    const memo = `Invoice ${invoiceId}: ${params.itemDescription}`;
    const zip321Uri = this.generateZip321Uri({
      address: params.merchantAddress,
      amountZec: zec,
      memo,
      message: params.itemDescription,
    });

    const expiryMs = (params.expiryMinutes ?? 30) * 60 * 1000;

    const invoice: ZcashInvoice = {
      invoiceId,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiryMs,
      merchantAddress: params.merchantAddress,
      addressType,
      amountZec: zec,
      amountUsd: usd,
      memo,
      zip321Uri,
      itemDescription: params.itemDescription,
      merchantName: params.merchantName || 'CheetahPay Merchant',
      network,
      status: 'AWAITING_PAYMENT',
      confirmations: 0,
      requiredConfirmations: 3,
    };

    this.saveInvoice(invoice);
    return invoice;
  }

  /**
   * Record submitted transaction hash and update state machine.
   */
  public static submitPaymentTx(invoiceId: string, txid: string): ZcashInvoice {
    const cleanTx = txid.trim().replace(/^0x/, '');
    const invoice = this.getInvoice(invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    const explorerBase = invoice.network === 'testnet' ? ZEC_TESTNET_EXPLORER_BASE : ZEC_MAINNET_EXPLORER_BASE;

    invoice.txid = cleanTx;
    invoice.status = 'SUBMITTED';
    invoice.confirmations = 0;
    invoice.explorerUrl = `${explorerBase}/tx/${cleanTx}`;

    this.saveInvoice(invoice);
    return invoice;
  }

  /**
   * Query the live Zcash Testnet network for real transaction data.
   * Never substitutes mock success or fake confirmations.
   *
   * Cryptographic verification boundary:
   * - Transparent payments (tm..., t1...): Recipient outputs and amounts are public on-chain and verified via explorer outputs.
   * - Shielded payments (Orchard/Sapling): Recipient addresses, amounts, and encrypted memos are cryptographically concealed via zk-SNARKs.
   *   The explorer verifies transaction inclusion and confirmation count. Full memo and note plaintext decryption requires the merchant's viewing key (IVK).
   */
  public static async verifyTxOnNetwork(
    txid: string,
    expectedInvoice?: {
      merchantAddress: string;
      amountZec: string;
      addressType: ZcashAddressType;
    }
  ): Promise<ZcashVerificationResult> {
    const cleanTx = txid.trim().replace(/^0x/, '');
    if (!cleanTx || cleanTx.length < 32) {
      return {
        found: false,
        confirmations: 0,
        settlementScope: 'unconfirmed',
        detailsMessage: 'Invalid Zcash transaction hash format (must be 64-character hex).',
        error: 'Invalid Zcash transaction hash format.',
      };
    }

    try {
      // Query active SoChain Zcash Testnet REST API v3
      const url = `https://sochain.com/api/v3/transaction/ZECTEST/${encodeURIComponent(cleanTx)}`;
      let response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      // Transient retry for public REST node rate limits
      if (response.status === 429 || response.status >= 500) {
        await new Promise((r) => setTimeout(r, 600));
        response = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
      }

      if (!response.ok) {
        return {
          found: false,
          confirmations: 0,
          settlementScope: 'unconfirmed',
          detailsMessage: `Network node HTTP error ${response.status}: ${response.statusText}`,
          error: `Network query HTTP error ${response.status}: ${response.statusText}`,
        };
      }

      const json = await response.json();
      if (json.status === 'success' && json.data) {
        const confirmations = typeof json.data.confirmations === 'number' ? json.data.confirmations : 0;
        const blockNumber = json.data.block_no ?? json.data.block_height ?? undefined;
        const networkTime = json.data.time ? json.data.time * 1000 : undefined;
        const outputs = Array.isArray(json.data.outputs) ? json.data.outputs : [];

        // Check if invoice context is provided
        if (expectedInvoice) {
          if (expectedInvoice.addressType === 'transparent') {
            // Transparent outputs are publicly visible on-chain. Inspect outputs for recipient and amount.
            const matched = outputs.find(
              (o: { address?: string; value?: string }) =>
                o.address && o.address.toLowerCase() === expectedInvoice.merchantAddress.toLowerCase()
            );

            if (matched) {
              const matchedVal = Number(matched.value || 0);
              const expectedVal = Number(expectedInvoice.amountZec || 0);
              // Allow tiny rounding delta (0.000001 ZEC)
              if (matchedVal >= expectedVal - 0.000001) {
                return {
                  found: true,
                  confirmations,
                  blockNumber,
                  networkTime,
                  raw: json.data,
                  settlementScope: 'transparent_verified',
                  detailsMessage: `Authoritatively confirmed on-chain: Output pays ${matched.value} ZEC to merchant transparent address ${matched.address}.`,
                  matchedTransparentOutput: {
                    address: matched.address,
                    value: matched.value,
                  },
                };
              } else {
                return {
                  found: true,
                  confirmations,
                  blockNumber,
                  networkTime,
                  raw: json.data,
                  settlementScope: 'mismatch',
                  detailsMessage: `Underpayment mismatch: Transaction outputs pay ${matchedVal} ZEC, but invoice requires ${expectedVal} ZEC.`,
                  error: `Underpayment mismatch: Output pays ${matchedVal} ZEC, expected ${expectedVal} ZEC.`,
                };
              }
            } else {
              return {
                found: true,
                confirmations,
                blockNumber,
                networkTime,
                raw: json.data,
                settlementScope: 'mismatch',
                detailsMessage: `Recipient mismatch: Transaction outputs do not pay to transparent merchant address ${expectedInvoice.merchantAddress}.`,
                error: `Recipient mismatch: No output in transaction pays to merchant address ${expectedInvoice.merchantAddress}.`,
              };
            }
          } else {
            // Shielded invoice (Unified or Sapling)
            // zk-SNARK outputs encrypt recipient, value, and memo.
            // Explorer verifies block inclusion and confirmation depth.
            return {
              found: true,
              confirmations,
              blockNumber,
              networkTime,
              raw: json.data,
              settlementScope: 'shielded_cryptographic_inclusion',
              detailsMessage: `Transaction confirmed in block ${blockNumber || 'included'} with ${confirmations} confirmations. Note value, recipient address, and encrypted memo are protected on-chain via zk-SNARKs. Note decryption is verified via merchant viewing key (IVK) in wallet.`,
            };
          }
        }

        // Generic query without invoice context (e.g. initial lookup)
        return {
          found: true,
          confirmations,
          blockNumber,
          networkTime,
          raw: json.data,
          settlementScope: confirmations > 0 ? 'shielded_cryptographic_inclusion' : 'unconfirmed',
          detailsMessage: `Transaction found on Zcash Testnet with ${confirmations} confirmations (block ${blockNumber ?? 'mempool'}).`,
        };
      } else {
        const msg = json.data?.error_message || 'Transaction not found in Zcash Testnet mempool or blockchain.';
        return {
          found: false,
          confirmations: 0,
          settlementScope: 'unconfirmed',
          detailsMessage: msg,
          error: msg,
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network failure querying Zcash Testnet node.';
      return {
        found: false,
        confirmations: 0,
        settlementScope: 'unconfirmed',
        detailsMessage: msg,
        error: msg,
      };
    }
  }

  /**
   * Verify on-chain status of an invoice and advance only if authoritatively confirmed by network.
   */
  public static async verifyAndAdvanceInvoice(invoiceId: string): Promise<{
    invoice: ZcashInvoice;
    verification: ZcashVerificationResult;
  }> {
    const invoice = this.getInvoice(invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    if (!invoice.txid) {
      return {
        invoice,
        verification: {
          found: false,
          confirmations: 0,
          settlementScope: 'unconfirmed',
          detailsMessage: 'No transaction hash submitted for this invoice.',
          error: 'No transaction hash submitted for this invoice.',
        },
      };
    }

    const verification = await this.verifyTxOnNetwork(invoice.txid, {
      merchantAddress: invoice.merchantAddress,
      amountZec: invoice.amountZec,
      addressType: invoice.addressType,
    });

    if (verification.found) {
      invoice.confirmations = verification.confirmations;
      invoice.blockHeight = verification.blockNumber;

      // Fail-closed against transparent recipient/amount mismatches
      if (verification.settlementScope === 'mismatch') {
        invoice.status = 'FAILED';
        invoice.settlementDetails = verification.detailsMessage;
        this.saveInvoice(invoice);
        return { invoice, verification };
      }

      if (verification.confirmations >= invoice.requiredConfirmations) {
        if (invoice.addressType === 'transparent') {
          // Transparent invoices can advance to CONFIRMED because public outputs
          // authoritatively verify recipient address and payment amount.
          invoice.status = 'CONFIRMED';
          invoice.settlementDetails = verification.detailsMessage;
        } else {
          // Shielded invoices (Unified or Sapling):
          // zk-SNARK outputs encrypt recipient, amount, and memo on-chain.
          // Public block inclusion and confirmation depth cannot independently confirm
          // note plaintext. Therefore, the invoice transitions to AWAITING_WALLET_VERIFICATION
          // rather than falsely asserting CONFIRMED without merchant wallet note decryption.
          invoice.status = 'AWAITING_WALLET_VERIFICATION';
          invoice.settlementDetails = `Transaction inclusion & ${verification.confirmations} block confirmations verified on Zcash Testnet node. Recipient, amount, and memo are encrypted on-chain via zk-SNARKs. Awaiting merchant wallet note decryption via Incoming Viewing Key (IVK).`;
        }
      } else if (verification.confirmations > 0) {
        invoice.status = 'CONFIRMING';
        invoice.settlementDetails = `Transaction detected in block ${verification.blockNumber || 'included'}. Awaiting confirmation threshold (${verification.confirmations}/${invoice.requiredConfirmations}).`;
      } else {
        invoice.status = 'SUBMITTED';
        invoice.settlementDetails = 'Transaction hash submitted. Awaiting block inclusion on Zcash Testnet.';
      }
      invoice.verificationScope = verification.settlementScope;
      this.saveInvoice(invoice);
    }

    return { invoice, verification };
  }

  public static getSavedInvoices(): ZcashInvoice[] {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(STORAGE_INVOICES_KEY);
        if (data) return JSON.parse(data) as ZcashInvoice[];
      }
    } catch {
      // fallback to memory
    }
    return Array.from(inMemoryInvoices.values());
  }

  public static getInvoice(invoiceId: string): ZcashInvoice | undefined {
    return this.getSavedInvoices().find((inv) => inv.invoiceId === invoiceId);
  }

  public static saveInvoice(invoice: ZcashInvoice): void {
    inMemoryInvoices.set(invoice.invoiceId, invoice);
    try {
      if (typeof localStorage !== 'undefined') {
        const list = this.getSavedInvoices();
        const updated = [invoice, ...list.filter((i) => i.invoiceId !== invoice.invoiceId)].slice(0, 50);
        localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to save Zcash invoice', e);
    }
  }
}
