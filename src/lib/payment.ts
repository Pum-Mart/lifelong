// Payment settings shared by the checkout popup (client) and the payments API (server).
// Nothing here is secret: it is the same information printed on a bank transfer slip.

// TODO: replace every [ ... ] with the center's real bank account details before going live.
// To show a KHQR / bank QR code, put the image in /public/payment/ and set `qrImage`.
export interface BankAccount {
  id: string;
  name: string;
  accountName: string;
  accountNumber: string;
  qrImage?: string;
  color: string; // Tailwind classes for the bank tile
  kind?: 'bank' | 'cash'; // cash = paid in person at the centre, no transfer slip
}

export const BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'aba',
    name: 'ABA Bank',
    accountName: '[ឈ្មោះគណនី]',
    accountNumber: '[000 000 000]',
    qrImage: '/payment/aba-qr.png',
    color: 'bg-[#005d7f] text-white'
  },
  {
    id: 'acleda',
    name: 'ACLEDA Bank',
    accountName: '[ឈ្មោះគណនី]',
    accountNumber: '[0000-00-000000-0-0]',
    qrImage: '/payment/acleda-qr.png',
    color: 'bg-[#0b3d91] text-white'
  },
  {
    id: 'wing',
    name: 'Wing Bank',
    accountName: '[ឈ្មោះគណនី]',
    accountNumber: '[000 000 00]',
    qrImage: '/payment/wing-qr.png',
    color: 'bg-[#a6ce39] text-slate-900'
  },
  {
    id: 'khqr',
    name: 'Bakong KHQR',
    accountName: '[ឈ្មោះគណនី]',
    accountNumber: '[name@bank]',
    qrImage: '/payment/khqr.png',
    color: 'bg-[#e1232e] text-white'
  },
  {
    id: 'cash',
    name: 'សាច់ប្រាក់ (នៅមជ្ឈមណ្ឌល)',
    accountName: 'បង់ផ្ទាល់នៅការិយាល័យមជ្ឈមណ្ឌល',
    accountNumber: '',
    color: 'bg-amber-400 text-emerald-950',
    kind: 'cash'
  }
];

// Riel per US dollar (close to the National Bank of Cambodia rate; update when it moves).
export const KHR_PER_USD = 4100;

// Cambodian payers transfer either in US dollars or in riel
export type PayCurrency = 'USD' | 'KHR';
export const PAY_CURRENCIES: PayCurrency[] = ['USD', 'KHR'];

export const COUPONS: Record<string, { percent: number; label: string }> = {
  LIFELONG20: { percent: 20, label: 'សិក្សាពេញមួយជីវិត 20%' },
  SENIOR30: { percent: 30, label: 'មនុស្សចាស់ 30%' },
  WELCOME50: { percent: 50, label: 'អ្នកសិក្សាថ្មី 50%' }
};

// Signed-in members get this off every paid course
export const MEMBER_DISCOUNT_PERCENT = 10;

export interface PaymentQuote {
  subtotal: number;
  memberDiscountAmount: number;
  couponCode?: string;
  discountPercent: number; // coupon percent
  discountAmount: number; // coupon amount
  total: number;
  totalKhr: number;
}

const roundCents = (n: number) => Math.round(n * 100) / 100;

// Member discount comes off the subtotal first; a coupon then applies to what remains
export function quotePayment(prices: number[], couponCode?: string, isMember = false): PaymentQuote {
  const subtotal = roundCents(prices.reduce((sum, p) => sum + p, 0));
  const memberDiscountAmount = isMember ? roundCents((subtotal * MEMBER_DISCOUNT_PERCENT) / 100) : 0;
  const afterMember = subtotal - memberDiscountAmount;

  const code = couponCode?.trim().toUpperCase();
  const coupon = code ? COUPONS[code] : undefined;
  const discountPercent = coupon?.percent || 0;
  const discountAmount = roundCents((afterMember * discountPercent) / 100);

  const total = Math.max(0, roundCents(afterMember - discountAmount));
  return {
    subtotal,
    memberDiscountAmount,
    couponCode: coupon ? code : undefined,
    discountPercent,
    discountAmount,
    total,
    totalKhr: toKhr(total)
  };
}

// Riel amounts are rounded up to the nearest 100 ៛, the smallest note in common use
export function toKhr(usd: number): number {
  return Math.ceil((usd * KHR_PER_USD) / 100) * 100;
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// Accepts 012345678, 012 345 678, 097-620-7676, +855 12 345 678, 85512345678.
// Returns the local form "012 345 678" / "097 620 7676", or null if it isn't a Cambodian number.
export function normalizeKhPhone(raw: string): string | null {
  let digits = raw.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('855')) digits = '0' + digits.slice(3).replace(/^0/, '');
  if (!/^0[1-9]\d{7,8}$/.test(digits)) return null;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

// Price a member pays for one course (before coupons)
export function memberPrice(price: number): number {
  return roundCents(price * (1 - MEMBER_DISCOUNT_PERCENT / 100));
}

export function formatKhr(amount: number): string {
  return `${amount.toLocaleString('en-US')} ៛`;
}
