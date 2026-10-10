import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Plant } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Re-encodes an image as a JPEG no larger than maxSize px on its longest side. */
export function compressImage(dataUrl: string, maxSize: number, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** Healthy / Needs Attention / Critical, from the AI status or the score. */
export function plantStatus(plant: Pick<Plant, 'healthScore' | 'status'>): 'Healthy' | 'Needs Attention' | 'Critical' {
  const s = (plant.status || '').toLowerCase();
  if (s.includes('critical')) return 'Critical';
  if (s.includes('attention') || s.includes('warning')) return 'Needs Attention';
  if (s.includes('healthy')) return 'Healthy';
  if (plant.healthScore >= 80) return 'Healthy';
  if (plant.healthScore >= 55) return 'Needs Attention';
  return 'Critical';
}

export function averageHealth(plants: Pick<Plant, 'healthScore'>[]): number | null {
  const scores = plants.map(p => p.healthScore).filter(n => Number.isFinite(n));
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function formatScanDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString([], { day: 'numeric', month: 'short' })}, ${time}`;
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Good Night';
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
