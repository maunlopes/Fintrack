"use client";

import {
  Home, Utensils, Car, Heart, HeartPulse, CreditCard, BookOpen, GraduationCap, Zap,
  Briefcase, DollarSign, ShoppingBag, Plane, Music, Gamepad2,
  Gift, Baby, Dog, Dumbbell, Scissors, Shirt, Coffee,
  Wifi, Phone, Monitor, Laptop, Wrench, Building2, Landmark, TrendingUp,
  PiggyBank, Wallet, CircleDollarSign, Receipt, ArrowLeftRight, type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  home: Home,
  utensils: Utensils,
  car: Car,
  heart: Heart,
  "heart-pulse": HeartPulse,
  "credit-card": CreditCard,
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
  zap: Zap,
  briefcase: Briefcase,
  "dollar-sign": DollarSign,
  "shopping-bag": ShoppingBag,
  plane: Plane,
  music: Music,
  gamepad: Gamepad2,
  "gamepad-2": Gamepad2,
  gift: Gift,
  baby: Baby,
  dog: Dog,
  dumbbell: Dumbbell,
  scissors: Scissors,
  shirt: Shirt,
  coffee: Coffee,
  wifi: Wifi,
  phone: Phone,
  monitor: Monitor,
  laptop: Laptop,
  wrench: Wrench,
  building: Building2,
  landmark: Landmark,
  "trending-up": TrendingUp,
  "piggy-bank": PiggyBank,
  wallet: Wallet,
  receipt: Receipt,
  "arrow-left-right": ArrowLeftRight,
  circle: CircleDollarSign,
};

// Default icon mapping for common category names
export const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
  Moradia: "home",
  Aluguel: "home",
  "Alimentação": "utensils",
  Transporte: "car",
  "Saúde": "heart-pulse",
  Assinaturas: "credit-card",
  "Serviços/Assinaturas": "wifi",
  "Educação": "graduation-cap",
  Utilidades: "zap",
  Impostos: "receipt",
  "Salário": "briefcase",
  Freelance: "laptop",
  Rendimentos: "trending-up",
  Investimentos: "trending-up",
  Compras: "shopping-bag",
  Viagem: "plane",
  Lazer: "gamepad-2",
  Jogos: "gamepad-2",
  Presentes: "gift",
  "Bebê": "baby",
  Pet: "dog",
  Academia: "dumbbell",
  "Beleza": "scissors",
  Roupas: "shirt",
  "Café": "coffee",
  Internet: "wifi",
  Telefone: "phone",
  "Tecnologia": "monitor",
  "Manutenção": "wrench",
  "Condomínio": "building",
  "Transferência": "arrow-left-right",
};

export function getCategoryIcon(iconName: string): LucideIcon {
  return CATEGORY_ICONS[iconName] || CircleDollarSign;
}

export function getDefaultIconForCategory(categoryName: string): string {
  return DEFAULT_CATEGORY_ICONS[categoryName] || "circle";
}
