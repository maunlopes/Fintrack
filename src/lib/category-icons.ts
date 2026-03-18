"use client";

import {
  Home, Utensils, Car, Heart, CreditCard, BookOpen, Zap,
  Briefcase, DollarSign, ShoppingBag, Plane, Music, Gamepad2,
  Gift, Baby, Dog, Dumbbell, Scissors, Shirt, Coffee,
  Wifi, Phone, Monitor, Wrench, Building2, Landmark, TrendingUp,
  PiggyBank, Wallet, CircleDollarSign, type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  home: Home,
  utensils: Utensils,
  car: Car,
  heart: Heart,
  "credit-card": CreditCard,
  "book-open": BookOpen,
  zap: Zap,
  briefcase: Briefcase,
  "dollar-sign": DollarSign,
  "shopping-bag": ShoppingBag,
  plane: Plane,
  music: Music,
  gamepad: Gamepad2,
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
  wrench: Wrench,
  building: Building2,
  landmark: Landmark,
  "trending-up": TrendingUp,
  "piggy-bank": PiggyBank,
  wallet: Wallet,
  circle: CircleDollarSign,
};

// Default icon mapping for common category names
export const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
  Moradia: "home",
  Aluguel: "home",
  "Alimentação": "utensils",
  Transporte: "car",
  "Saúde": "heart",
  Assinaturas: "credit-card",
  "Educação": "book-open",
  Utilidades: "zap",
  "Salário": "briefcase",
  Freelance: "briefcase",
  Investimentos: "trending-up",
  Compras: "shopping-bag",
  Viagem: "plane",
  Lazer: "music",
  Jogos: "gamepad",
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
};

export function getCategoryIcon(iconName: string): LucideIcon {
  return CATEGORY_ICONS[iconName] || CircleDollarSign;
}

export function getDefaultIconForCategory(categoryName: string): string {
  return DEFAULT_CATEGORY_ICONS[categoryName] || "circle";
}
