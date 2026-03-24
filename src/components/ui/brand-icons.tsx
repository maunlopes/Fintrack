import * as React from "react";
import { CreditCard, Landmark } from "lucide-react";

export type BankName = "Nubank" | "Itaú" | "Inter" | "Bradesco" | "Santander" | "Banco do Brasil" | "Caixa Econômica" | "XP" | "C6 Bank" | "BTG Pactual" | "Outro";
export type CardNetwork = "VISA" | "MASTERCARD" | "ELO" | "AMEX" | "HIPERCARD" | "OTHER";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

// ==========================================
// BANK LOGOS — real SVGs from public/logos/banks/
// All logos verified as square (≈1:1 viewBox) for compact icon use
// ==========================================

const BANK_SVG_PATHS: Partial<Record<string, string>> = {
  "Nubank":          "/logos/banks/nubank.svg",
  "Itaú":            "/logos/banks/itau.svg",
  "Bradesco":        "/logos/banks/bradesco.svg",
  "Banco do Brasil": "/logos/banks/bancodobrasil.svg",
  "Santander":       "/logos/banks/santander.svg",
  "Caixa Econômica": "/logos/banks/caixa.svg",
  "Inter":           "/logos/banks/inter.svg",
  "C6 Bank":         "/logos/banks/c6bank.svg",
  "XP":              "/logos/banks/xp.svg",
  "XP Investimentos":"/logos/banks/xp.svg",
};

// Fallback inline SVGs for banks without a real logo file
export const BankLogos: Record<string, React.ReactNode | React.FC<IconProps>> = {};

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
  const svgPath = BANK_SVG_PATHS[name];
  if (svgPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={svgPath} alt={name} className={className} style={{ objectFit: "contain" }} />
    );
  }
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
