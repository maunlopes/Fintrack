import * as React from "react";
import { CreditCard, Landmark } from "lucide-react";

export type BankName = "Nubank" | "Itaú" | "Inter" | "Bradesco" | "Santander" | "Banco do Brasil" | "Caixa" | "XP" | "C6 Bank" | "BTG Pactual" | "Outro";
export type CardNetwork = "VISA" | "MASTERCARD" | "ELO" | "AMEX" | "HIPERCARD" | "OTHER";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

// ==========================================
// BANK LOGOS
// ==========================================

export const BankLogos: Record<BankName | string, React.ReactNode | React.FC<IconProps>> = {
  Nubank: (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="6" fill="#8A05BE"/>
      <path d="M7 14.5V9.5H8.5L11.5 13V9.5H13V14.5H11.5L8.5 11V14.5H7Z" fill="white"/>
      <path d="M14 14.5V11H15.5V14.5C15.5 15.5 16 15.5 16 15.5C16 15.5 16.5 15.5 16.5 14.5V11H18V14.5C18 16 16 16.5 16 16.5C16 16.5 14 16 14 14.5Z" fill="white"/>
    </svg>
  ),
  Itaú: (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="6" fill="#EC7000"/>
      <path d="M7 16V8.5H9V16H7Z" fill="#003399"/>
      <path d="M10 10.5H9V8.5H13V10.5H12V16H10V10.5Z" fill="#003399"/>
      <path d="M13.5 16V10.5H15.5V13.5C15.5 14.5 16 14.5 16 14.5C16 14.5 16.5 14.5 16.5 13.5V10.5H18.5V16H16.5V14.5C16 15 15.5 16 15.5 16H13.5Z" fill="#003399"/>
    </svg>
  ),
  Inter: (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="6" fill="#FF7A00"/>
      <circle cx="9" cy="12" r="3" fill="white"/>
      <circle cx="15" cy="12" r="3" fill="white"/>
      <path d="M12 9L15 12L12 15L9 12L12 9Z" fill="#FF7A00"/>
    </svg>
  ),
  Bradesco: (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="6" fill="#CC092F"/>
      <path d="M6 16V8L18 16V8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Santander: (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="6" fill="#EC0000"/>
      <path d="M6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  "Banco do Brasil": (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="6" fill="#FCEB00"/>
      <path d="M8 8H16L12 12L16 16H8L12 12L8 8Z" fill="#003DA5"/>
    </svg>
  ),
  Caixa: (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="6" fill="#005CA9"/>
      <path d="M6 16V8H18V16H6ZM8 10V14H16V10H8Z" fill="#F39200"/>
    </svg>
  ),
  XP: (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="6" fill="#000000"/>
      <path d="M7 8L12 16L17 8" stroke="white" strokeWidth="2"/>
      <path d="M7 16L12 8L17 16" stroke="white" strokeWidth="2"/>
    </svg>
  ),
  "C6 Bank": (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" rx="6" fill="#242424"/>
      <path d="M15 8C12 8 9 10 9 13C9 16 12 18 15 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="15" cy="13" r="2" fill="white"/>
    </svg>
  ),
};

export const FallbackBankIcon = (props: any) => <Landmark {...props} />;

// ==========================================
// CARD NETWORK LOGOS
// ==========================================

export const CardBrandLogos: Record<CardNetwork, React.ReactNode | React.FC<IconProps>> = {
  MASTERCARD: (props: IconProps) => (
    <svg viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="10" cy="10" r="10" fill="#EB001B"/>
      <circle cx="22" cy="10" r="10" fill="#F79E1B" fillOpacity="0.9"/>
    </svg>
  ),
  VISA: (props: IconProps) => (
    <svg viewBox="0 0 38 14" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <text x="0" y="12" fill="currentColor" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="14" fontStyle="italic">VISA</text>
    </svg>
  ),
  ELO: (props: IconProps) => (
    <svg viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="10" cy="10" r="8" stroke="#00A4E0" strokeWidth="3"/>
      <circle cx="16" cy="10" r="8" stroke="#EF4123" strokeWidth="3"/>
      <circle cx="22" cy="10" r="8" stroke="#FFBC3D" strokeWidth="3"/>
    </svg>
  ),
  AMEX: (props: IconProps) => (
    <svg viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="32" height="20" rx="2" fill="#007CC3"/>
      <text x="3" y="14" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="9">AMEX</text>
    </svg>
  ),
  HIPERCARD: (props: IconProps) => (
    <svg viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="32" height="20" rx="2" fill="#CC0000"/>
      <text x="3" y="14" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="7">HIPER</text>
    </svg>
  ),
  OTHER: (props: IconProps) => <CreditCard className="w-8 h-8 text-muted-foreground" {...props} />
};

export const getBankIcon = (name: string, className?: string) => {
  const Icon = BankLogos[name as BankName];
  if (Icon) {
    return typeof Icon === "function" ? <Icon className={className} /> : Icon;
  }
  return <FallbackBankIcon className={className} />;
};

export const getCardBrandIcon = (brand: string, className?: string) => {
  const Icon = CardBrandLogos[brand as CardNetwork];
  if (Icon) {
    return typeof Icon === "function" ? <Icon className={className} /> : Icon;
  }
  return <CreditCard className={className} />;
};
