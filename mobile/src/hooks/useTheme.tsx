import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet, apiPost } from '../lib/core';

export type ThemeName = 'light' | 'dark' | 'blue' | 'green' | 'pink' | 'gray' | 'purple' | 'orange' | 'yellow' | 'brown' | 'sunset' | 'ocean' | 'red' | 'teal' | 'indigo' | 'rainbow' | 'lime' | 'cyan' | 'rose' | 'amber' | 'emerald' | 'sky' | 'violet' | 'fuchsia' | 'aurora' | 'forest' | 'fire' | 'ice' | 'galaxy' | 'desert' | 'meadow' | 'storm' | 'candy' | 'autumn' | 'sunrise' | 'twilight' | 'neon' | 'vintage' | 'tropical' | 'metallic' | 'pastel' | 'dark-blue' | 'dark-green' | 'dark-purple' | 'dark-red' | 'darker-teal';

export interface Theme {
  name: ThemeName;
  // React Native compatible properties
  bgGradient: string;
  panelBg: string;
  textPrimary: string;
  muted: string;
  accent1: string;
  accent2: string;
  peelBg: string;
  chatAssistantBg: string;
  chatSystemBg: string;
  userBubbleBg: string;
  inputBg: string;
  border: string;
  notesOverlayBg: string;
  peelSoonBg: string;
  peelOverdueBg: string;
  peelIndicatorSoon: string;
  peelIndicatorOverdue: string;
  systemText: string;
  assistantText: string;
  userText: string;
  messageText: string;
  // CSS variables for backward compatibility
  '--bg-gradient': string;
  '--panel-bg': string;
  '--text-primary'?: string;
  '--muted': string;
  '--accent-1': string;
  '--accent-2': string;
  '--peel-bg': string;
  '--chat-assistant-bg': string;
  '--chat-system-bg': string;
  '--user-bubble-bg': string;
  '--input-bg': string;
  '--border'?: string;
  '--notes-overlay-bg'?: string;
  '--peel-soon-bg'?: string;
  '--peel-overdue-bg'?: string;
  '--peel-indicator-soon'?: string;
  '--peel-indicator-overdue'?: string;
  '--system-text'?: string;
  '--assistant-text'?: string;
  '--user-text'?: string;
}

// Helper function to create React Native compatible theme from CSS variables
const createRNCompatibleTheme = (cssVars: Record<string, string>): Theme => {
  const theme = {
    name: cssVars.name as ThemeName,
    // React Native compatible properties (extract colors from CSS variables)
    bgGradient: cssVars['--bg-gradient']?.includes('linear-gradient') ? '#f5f7fa' : cssVars['--bg-gradient'] || '#f5f7fa',
    panelBg: cssVars['--panel-bg'] || '#ffffff',
    textPrimary: cssVars['--text-primary'] || '#2c3e50',
    muted: cssVars['--muted'] || '#6c757d',
    accent1: cssVars['--accent-1'] || '#667eea',
    accent2: cssVars['--accent-2'] || '#764ba2',
    peelBg: cssVars['--peel-bg']?.includes('linear-gradient') ? '#f8f9fa' : cssVars['--peel-bg'] || '#f8f9fa',
    chatAssistantBg: cssVars['--chat-assistant-bg']?.includes('linear-gradient') ? '#f8f9fa' : cssVars['--chat-assistant-bg'] || '#f8f9fa',
    chatSystemBg: cssVars['--chat-system-bg']?.includes('linear-gradient') ? '#e3f2fd' : cssVars['--chat-system-bg'] || '#e3f2fd',
    userBubbleBg: cssVars['--user-bubble-bg']?.includes('linear-gradient')
      ? cssVars['--user-bubble-bg']?.match(/#[0-9a-f]{6}|#[0-9a-f]{3}/gi)?.[0] || '#667eea'
      : cssVars['--user-bubble-bg'] || '#667eea',
    inputBg: cssVars['--input-bg'] || '#f8f9fa',
    border: cssVars['--border'] || 'rgba(0,0,0,0.08)',
    notesOverlayBg: cssVars['--notes-overlay-bg'] || 'rgba(255,255,255,0.96)',
    peelSoonBg: cssVars['--peel-soon-bg']?.includes('linear-gradient') ? '#f8f9fa' : cssVars['--peel-soon-bg'] || '#f8f9fa',
    peelOverdueBg: cssVars['--peel-overdue-bg']?.includes('linear-gradient') ? '#ffe6e6' : cssVars['--peel-overdue-bg'] || '#ffe6e6',
    peelIndicatorSoon: cssVars['--peel-indicator-soon'] || '#667eea',
    peelIndicatorOverdue: cssVars['--peel-indicator-overdue'] || '#dc3545',
    systemText: cssVars['--system-text'] || '#1565c0',
    assistantText: cssVars['--assistant-text'] || '#2c3e50',
    userText: cssVars['--user-text'] || '#ffffff',
    messageText: cssVars['--text-primary'] || '#2c3e50'
  } as Theme;

  // Add all CSS variables to the theme
  Object.keys(cssVars).forEach(key => {
    (theme as any)[key] = cssVars[key];
  });

  return theme;
};

export const THEMES: Record<ThemeName, Theme> = {
  light: createRNCompatibleTheme({
    name: 'light',
    '--bg-gradient': 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    '--panel-bg': '#ffffff',
    '--muted': '#6c757d',
    '--accent-1': '#667eea',
    '--accent-2': '#764ba2',
    '--peel-bg': 'linear-gradient(145deg, #ffffff, #f8f9fa)',
    '--chat-assistant-bg': 'linear-gradient(145deg, #f8f9fa, #e9ecef)',
    '--chat-system-bg': 'linear-gradient(145deg, #e3f2fd, #bbdefb)',
    '--user-bubble-bg': 'linear-gradient(145deg, #667eea, #764ba2)',
    '--input-bg': '#f8f9fa',
    '--border': 'rgba(0,0,0,0.08)',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#ffffff,#f8f9fa)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#667eea',
    '--peel-indicator-overdue': '#dc3545'
  }),
  dark: createRNCompatibleTheme({
    name: 'dark',
    '--bg-gradient': 'linear-gradient(135deg,#071021 0%,#06101a 100%)',
    '--panel-bg': '#071021',
    '--text-primary': '#e6eef6',
    '--muted': '#9fb0c8',
    '--border': '#123047',
    '--accent-1': '#4f46e5',
    '--accent-2': '#06b6d4',
    '--peel-bg': 'linear-gradient(145deg,#081426,#0b2230)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#0b1622,#0f2430)',
    '--chat-system-bg': 'linear-gradient(145deg,#06283d,#064663)',
    '--user-bubble-bg': 'linear-gradient(145deg,#2b6cb0,#235a7a)',
    '--input-bg': '#061526',
    '--system-text': '#a8d1ff',
    '--assistant-text': '#e6eef6',
    '--user-text': '#ffffff',
    '--peel-soon-bg': 'linear-gradient(145deg,#063b66,#05507f)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#3a1111,#5a1b1b)',
    '--peel-indicator-soon': '#4fb3ff',
    '--peel-indicator-overdue': '#ff7b7b',
    '--notes-overlay-bg': 'rgba(7,16,33,0.95)'
  }),
  blue: createRNCompatibleTheme({
    name: 'blue',
    '--bg-gradient': 'linear-gradient(135deg,#eef5ff 0%,#e2edff 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#0b2540',
    '--muted': '#4b6b8a',
    '--border': '#d6e6fb',
    '--accent-1': '#2563eb',
    '--accent-2': '#1e40af',
    '--peel-bg': 'linear-gradient(145deg,#f3f9ff,#e6f2ff)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fbfdff,#f2f8ff)',
    '--chat-system-bg': 'linear-gradient(145deg,#dbeafe,#bfdbfe)',
    '--user-bubble-bg': 'linear-gradient(145deg,#1e63d6,#174a9a)',
    '--input-bg': '#f3f9ff',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#cfe6ff,#b6dbff)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffdfe0,#ffd6d6)',
    '--peel-indicator-soon': '#1e63d6',
    '--peel-indicator-overdue': '#d64545'
  }),
  green: createRNCompatibleTheme({
    name: 'green',
    '--bg-gradient': 'linear-gradient(135deg,#f6fff5 0%,#e6f9ea 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#043023',
    '--muted': '#2f855a',
    '--border': '#dff3ea',
    '--accent-1': '#16a34a',
    '--accent-2': '#059669',
    '--peel-bg': 'linear-gradient(145deg,#f3fff6,#e6fbef)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#f7fff9,#eefdf4)',
    '--chat-system-bg': 'linear-gradient(145deg,#dff7e6,#bff0c9)',
    '--user-bubble-bg': 'linear-gradient(145deg,#2f855a,#15703b)',
    '--input-bg': '#f6fff6',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#cfeedd,#b6e7c4)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#2f855a',
    '--peel-indicator-overdue': '#c24141'
  }),
  pink: createRNCompatibleTheme({
    name: 'pink',
    '--bg-gradient': 'linear-gradient(135deg,#fff0f7 0%,#ffe6f0 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#2b1220',
    '--muted': '#7a5a6a',
    '--border': '#ffdbea',
    '--accent-1': '#f472b6',
    '--accent-2': '#ec4899',
    '--peel-bg': 'linear-gradient(145deg,#fff4fb,#ffe7f5)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fff8fb,#fff0f6)',
    '--chat-system-bg': 'linear-gradient(145deg,#ffe6f3,#ffd6ea)',
    '--user-bubble-bg': 'linear-gradient(145deg,#f472b6,#d9467a)',
    '--input-bg': '#fff6fb',
    '--notes-overlay-bg': 'rgba(250,252,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#ffd6ee,#ffc0e6)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffdede,#ffcccc)',
    '--peel-indicator-soon': '#f472b6',
    '--peel-indicator-overdue': '#ff6b6b'
  }),
  gray: createRNCompatibleTheme({
    name: 'gray',
    '--bg-gradient': 'linear-gradient(135deg,#f7f7f8 0%,#ebebec 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#1f2933',
    '--muted': '#6b7280',
    '--border': '#e6e7e9',
    '--accent-1': '#6b7280',
    '--accent-2': '#4b5563',
    '--peel-bg': 'linear-gradient(145deg,#fbfbfc,#f0f0f2)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fbfbfc,#f5f5f7)',
    '--chat-system-bg': 'linear-gradient(145deg,#eef2f6,#e6ebf0)',
    '--user-bubble-bg': 'linear-gradient(145deg,#4b5563,#374151)',
    '--input-bg': '#f7f7f8',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#e9edf3,#dfe6ef)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffecec,#ffdede)',
    '--peel-indicator-soon': '#6b7280',
    '--peel-indicator-overdue': '#d64545'
  }),
  purple: createRNCompatibleTheme({
    name: 'purple',
    '--bg-gradient': 'linear-gradient(135deg,#f3e8ff 0%,#e9d5ff 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#2d1b69',
    '--muted': '#7c3aed',
    '--border': '#d8b4fe',
    '--accent-1': '#8b5cf6',
    '--accent-2': '#7c3aed',
    '--peel-bg': 'linear-gradient(145deg,#f5f3ff,#ede9fe)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#faf5ff,#f3e8ff)',
    '--chat-system-bg': 'linear-gradient(145deg,#e9d5ff,#d8b4fe)',
    '--user-bubble-bg': 'linear-gradient(145deg,#8b5cf6,#7c3aed)',
    '--input-bg': '#f3e8ff',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#ddd6fe,#c4b5fd)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#8b5cf6',
    '--peel-indicator-overdue': '#dc3545'
  }),
  orange: createRNCompatibleTheme({
    name: 'orange',
    '--bg-gradient': 'linear-gradient(135deg,#fff7ed 0%,#fed7aa 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#7c2d12',
    '--muted': '#ea580c',
    '--border': '#fdba74',
    '--accent-1': '#f97316',
    '--accent-2': '#ea580c',
    '--peel-bg': 'linear-gradient(145deg,#fff7ed,#fef3c7)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fff8f1,#fef3c7)',
    '--chat-system-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
    '--user-bubble-bg': 'linear-gradient(145deg,#f97316,#ea580c)',
    '--input-bg': '#fff7ed',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#f97316',
    '--peel-indicator-overdue': '#dc3545'
  }),
  yellow: createRNCompatibleTheme({
    name: 'yellow',
    '--bg-gradient': 'linear-gradient(135deg,#fefce8 0%,#fde68a 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#713f12',
    '--muted': '#d97706',
    '--border': '#fcd34d',
    '--accent-1': '#f59e0b',
    '--accent-2': '#d97706',
    '--peel-bg': 'linear-gradient(145deg,#fefce8,#fef3c7)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fffbeb,#fef3c7)',
    '--chat-system-bg': 'linear-gradient(145deg,#fde68a,#fcd34d)',
    '--user-bubble-bg': 'linear-gradient(145deg,#f59e0b,#d97706)',
    '--input-bg': '#fefce8',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#fde68a,#fcd34d)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#f59e0b',
    '--peel-indicator-overdue': '#dc3545'
  }),
  brown: createRNCompatibleTheme({
    name: 'brown',
    '--bg-gradient': 'linear-gradient(135deg,#f5f5f4 0%,#d6d3d1 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#44403c',
    '--muted': '#a8a29e',
    '--border': '#d6d3d1',
    '--accent-1': '#78716c',
    '--accent-2': '#57534e',
    '--peel-bg': 'linear-gradient(145deg,#f5f5f4,#e7e5e4)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fafaf9,#f5f5f4)',
    '--chat-system-bg': 'linear-gradient(145deg,#d6d3d1,#a8a29e)',
    '--user-bubble-bg': 'linear-gradient(145deg,#78716c,#57534e)',
    '--input-bg': '#f5f5f4',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#d6d3d1,#a8a29e)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#78716c',
    '--peel-indicator-overdue': '#dc3545'
  }),
  sunset: createRNCompatibleTheme({
    name: 'sunset',
    '--bg-gradient': 'linear-gradient(135deg,#fef2f2 0%,#fecaca 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#7f1d1d',
    '--muted': '#dc2626',
    '--border': '#fca5a5',
    '--accent-1': '#ef4444',
    '--accent-2': '#dc2626',
    '--peel-bg': 'linear-gradient(145deg,#fef2f2,#fee2e2)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fef2f2,#fee2e2)',
    '--chat-system-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
    '--user-bubble-bg': 'linear-gradient(145deg,#ef4444,#dc2626)',
    '--input-bg': '#fef2f2',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#ef4444',
    '--peel-indicator-overdue': '#dc3545'
  }),
  ocean: createRNCompatibleTheme({
    name: 'ocean',
    '--bg-gradient': 'linear-gradient(135deg,#ecfeff 0%,#a5f3fc 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#164e63',
    '--muted': '#0891b2',
    '--border': '#67e8f9',
    '--accent-1': '#06b6d4',
    '--accent-2': '#0891b2',
    '--peel-bg': 'linear-gradient(145deg,#ecfeff,#cffafe)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#f0fdfa,#ecfeff)',
    '--chat-system-bg': 'linear-gradient(145deg,#a5f3fc,#67e8f9)',
    '--user-bubble-bg': 'linear-gradient(145deg,#06b6d4,#0891b2)',
    '--input-bg': '#ecfeff',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#a5f3fc,#67e8f9)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#06b6d4',
    '--peel-indicator-overdue': '#dc3545'
  }),
  red: createRNCompatibleTheme({
    name: 'red',
    '--bg-gradient': 'linear-gradient(135deg,#fef2f2 0%,#fecaca 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#7f1d1d',
    '--muted': '#dc2626',
    '--border': '#fca5a5',
    '--accent-1': '#ef4444',
    '--accent-2': '#dc2626',
    '--peel-bg': 'linear-gradient(145deg,#fef2f2,#fee2e2)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fef2f2,#fee2e2)',
    '--chat-system-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
    '--user-bubble-bg': 'linear-gradient(145deg,#ef4444,#dc2626)',
    '--input-bg': '#fef2f2',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#ef4444',
    '--peel-indicator-overdue': '#dc3545'
  }),
  teal: createRNCompatibleTheme({
    name: 'teal',
    '--bg-gradient': 'linear-gradient(135deg,#f0fdfa 0%,#ccfbf1 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#115e59',
    '--muted': '#0d9488',
    '--border': '#5eead4',
    '--accent-1': '#14b8a6',
    '--accent-2': '#0d9488',
    '--peel-bg': 'linear-gradient(145deg,#f0fdfa,#ecfdf5)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#f0fdfa,#ecfdf5)',
    '--chat-system-bg': 'linear-gradient(145deg,#ccfbf1,#5eead4)',
    '--user-bubble-bg': 'linear-gradient(145deg,#14b8a6,#0d9488)',
    '--input-bg': '#f0fdfa',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#ccfbf1,#5eead4)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#14b8a6',
    '--peel-indicator-overdue': '#dc3545'
  }),
  indigo: createRNCompatibleTheme({
    name: 'indigo',
    '--bg-gradient': 'linear-gradient(135deg,#eef2ff 0%,#c7d2fe 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#312e81',
    '--muted': '#6366f1',
    '--border': '#a5b4fc',
    '--accent-1': '#818cf8',
    '--accent-2': '#6366f1',
    '--peel-bg': 'linear-gradient(145deg,#eef2ff,#e0e7ff)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#f5f3ff,#eef2ff)',
    '--chat-system-bg': 'linear-gradient(145deg,#c7d2fe,#a5b4fc)',
    '--user-bubble-bg': 'linear-gradient(145deg,#818cf8,#6366f1)',
    '--input-bg': '#eef2ff',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#c7d2fe,#a5b4fc)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#818cf8',
    '--peel-indicator-overdue': '#dc3545'
  }),
  rainbow: createRNCompatibleTheme({
    name: 'rainbow',
    '--bg-gradient': 'linear-gradient(135deg,#fef3c7 0%,#a7f3d0 50%,#bfdbfe 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#1f2937',
    '--muted': '#7c3aed',
    '--border': '#d1d5db',
    '--accent-1': '#8b5cf6',
    '--accent-2': '#06b6d4',
    '--peel-bg': 'linear-gradient(145deg,#fef3c7,#fde68a)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fef3c7,#fde68a)',
    '--chat-system-bg': 'linear-gradient(145deg,#a7f3d0,#6ee7b7)',
    '--user-bubble-bg': 'linear-gradient(145deg,#8b5cf6,#7c3aed)',
    '--input-bg': '#fef3c7',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#a7f3d0,#6ee7b7)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
    '--peel-indicator-soon': '#10b981',
    '--peel-indicator-overdue': '#ef4444'
  }),
  lime: createRNCompatibleTheme({
    name: 'lime',
    '--bg-gradient': 'linear-gradient(135deg,#f7fee7 0%,#d9f99d 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#365314',
    '--muted': '#65a30d',
    '--border': '#bef264',
    '--accent-1': '#84cc16',
    '--accent-2': '#65a30d',
    '--peel-bg': 'linear-gradient(145deg,#f7fee7,#ecfccb)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#f7fee7,#ecfccb)',
    '--chat-system-bg': 'linear-gradient(145deg,#d9f99d,#bef264)',
    '--user-bubble-bg': 'linear-gradient(145deg,#84cc16,#65a30d)',
    '--input-bg': '#f7fee7',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#d9f99d,#bef264)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#84cc16',
    '--peel-indicator-overdue': '#dc3545'
  }),
  cyan: createRNCompatibleTheme({
    name: 'cyan',
    '--bg-gradient': 'linear-gradient(135deg,#ecfeff 0%,#cffafe 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#164e63',
    '--muted': '#0891b2',
    '--border': '#67e8f9',
    '--accent-1': '#06b6d4',
    '--accent-2': '#0891b2',
    '--peel-bg': 'linear-gradient(145deg,#ecfeff,#cffafe)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#ecfeff,#cffafe)',
    '--chat-system-bg': 'linear-gradient(145deg,#a5f3fc,#67e8f9)',
    '--user-bubble-bg': 'linear-gradient(145deg,#06b6d4,#0891b2)',
    '--input-bg': '#ecfeff',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#a5f3fc,#67e8f9)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#06b6d4',
    '--peel-indicator-overdue': '#dc3545'
  }),
  rose: createRNCompatibleTheme({
    name: 'rose',
    '--bg-gradient': 'linear-gradient(135deg,#fff1f2 0%,#fce7f3 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#831843',
    '--muted': '#db2777',
    '--border': '#f9a8d4',
    '--accent-1': '#ec4899',
    '--accent-2': '#db2777',
    '--peel-bg': 'linear-gradient(145deg,#fff1f2,#fce7f3)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fff1f2,#fce7f3)',
    '--chat-system-bg': 'linear-gradient(145deg,#fce7f3,#f9a8d4)',
    '--user-bubble-bg': 'linear-gradient(145deg,#ec4899,#db2777)',
    '--input-bg': '#fff1f2',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#fce7f3,#f9a8d4)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#ec4899',
    '--peel-indicator-overdue': '#dc3545'
  }),
  amber: createRNCompatibleTheme({
    name: 'amber',
    '--bg-gradient': 'linear-gradient(135deg,#fffbeb 0%,#fed7aa 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#78350f',
    '--muted': '#d97706',
    '--border': '#fdba74',
    '--accent-1': '#f97316',
    '--accent-2': '#d97706',
    '--peel-bg': 'linear-gradient(145deg,#fffbeb,#fef3c7)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fffbeb,#fef3c7)',
    '--chat-system-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
    '--user-bubble-bg': 'linear-gradient(145deg,#f97316,#d97706)',
    '--input-bg': '#fffbeb',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#f97316',
    '--peel-indicator-overdue': '#dc3545'
  }),
  emerald: createRNCompatibleTheme({
    name: 'emerald',
    '--bg-gradient': 'linear-gradient(135deg,#ecfdf5 0%,#a7f3d0 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#064e3b',
    '--muted': '#047857',
    '--border': '#6ee7b7',
    '--accent-1': '#10b981',
    '--accent-2': '#047857',
    '--peel-bg': 'linear-gradient(145deg,#ecfdf5,#d1fae5)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#ecfdf5,#d1fae5)',
    '--chat-system-bg': 'linear-gradient(145deg,#a7f3d0,#6ee7b7)',
    '--user-bubble-bg': 'linear-gradient(145deg,#10b981,#047857)',
    '--input-bg': '#ecfdf5',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#a7f3d0,#6ee7b7)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#10b981',
    '--peel-indicator-overdue': '#dc3545'
  }),
  sky: createRNCompatibleTheme({
    name: 'sky',
    '--bg-gradient': 'linear-gradient(135deg,#f0f9ff 0%,#bae6fd 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#0c4a6e',
    '--muted': '#0369a1',
    '--border': '#7dd3fc',
    '--accent-1': '#0ea5e9',
    '--accent-2': '#0369a1',
    '--peel-bg': 'linear-gradient(145deg,#f0f9ff,#e0f2fe)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#f0f9ff,#e0f2fe)',
    '--chat-system-bg': 'linear-gradient(145deg,#bae6fd,#7dd3fc)',
    '--user-bubble-bg': 'linear-gradient(145deg,#0ea5e9,#0369a1)',
    '--input-bg': '#f0f9ff',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#bae6fd,#7dd3fc)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#0ea5e9',
    '--peel-indicator-overdue': '#dc3545'
  }),
  violet: createRNCompatibleTheme({
    name: 'violet',
    '--bg-gradient': 'linear-gradient(135deg,#f5f3ff 0%,#c4b5fd 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#581c87',
    '--muted': '#7c3aed',
    '--border': '#a78bfa',
    '--accent-1': '#8b5cf6',
    '--accent-2': '#7c3aed',
    '--peel-bg': 'linear-gradient(145deg,#f5f3ff,#ede9fe)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#f5f3ff,#ede9fe)',
    '--chat-system-bg': 'linear-gradient(145deg,#c4b5fd,#a78bfa)',
    '--user-bubble-bg': 'linear-gradient(145deg,#8b5cf6,#7c3aed)',
    '--input-bg': '#f5f3ff',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#c4b5fd,#a78bfa)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#8b5cf6',
    '--peel-indicator-overdue': '#dc3545'
  }),
  fuchsia: createRNCompatibleTheme({
    name: 'fuchsia',
    '--bg-gradient': 'linear-gradient(135deg,#fdf4ff 0%,#f0abfc 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#701a75',
    '--muted': '#c026d3',
    '--border': '#e879f9',
    '--accent-1': '#d946ef',
    '--accent-2': '#c026d3',
    '--peel-bg': 'linear-gradient(145deg,#fdf4ff,#fce7f3)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fdf4ff,#fce7f3)',
    '--chat-system-bg': 'linear-gradient(145deg,#f0abfc,#e879f9)',
    '--user-bubble-bg': 'linear-gradient(145deg,#d946ef,#c026d3)',
    '--input-bg': '#fdf4ff',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#f0abfc,#e879f9)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#d946ef',
    '--peel-indicator-overdue': '#dc3545'
  }),
  aurora: createRNCompatibleTheme({
    name: 'aurora',
    '--bg-gradient': 'linear-gradient(135deg,#ecfdf5 0%,#a5f3fc 50%,#c4b5fd 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#1f2937',
    '--muted': '#059669',
    '--border': '#6b7280',
    '--accent-1': '#10b981',
    '--accent-2': '#0891b2',
    '--peel-bg': 'linear-gradient(145deg,#ecfdf5,#d1fae5)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#ecfdf5,#d1fae5)',
    '--chat-system-bg': 'linear-gradient(145deg,#a5f3fc,#67e8f9)',
    '--user-bubble-bg': 'linear-gradient(145deg,#8b5cf6,#7c3aed)',
    '--input-bg': '#ecfdf5',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#a5f3fc,#67e8f9)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
    '--peel-indicator-soon': '#06b6d4',
    '--peel-indicator-overdue': '#ef4444'
  }),
  forest: createRNCompatibleTheme({
    name: 'forest',
    '--bg-gradient': 'linear-gradient(135deg,#f0fdf4 0%,#d9f99d 30%,#a3a3a3 70%,#92400e 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#14532d',
    '--muted': '#166534',
    '--border': '#86efac',
    '--accent-1': '#22c55e',
    '--accent-2': '#15803d',
    '--peel-bg': 'linear-gradient(145deg,#f0fdf4,#dcfce7)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#f0fdf4,#dcfce7)',
    '--chat-system-bg': 'linear-gradient(145deg,#d9f99d,#bef264)',
    '--user-bubble-bg': 'linear-gradient(145deg,#a3a3a3,#78716c)',
    '--input-bg': '#f0fdf4',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#d9f99d,#bef264)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
    '--peel-indicator-soon': '#16a34a',
    '--peel-indicator-overdue': '#dc2626'
  }),
  fire: createRNCompatibleTheme({
    name: 'fire',
    '--bg-gradient': 'linear-gradient(135deg,#fef2f2 0%,#fed7aa 40%,#fde68a 70%,#fca5a5 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#7f1d1d',
    '--muted': '#dc2626',
    '--border': '#fca5a5',
    '--accent-1': '#ef4444',
    '--accent-2': '#dc2626',
    '--peel-bg': 'linear-gradient(145deg,#fef2f2,#fee2e2)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fef2f2,#fee2e2)',
    '--chat-system-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
    '--user-bubble-bg': 'linear-gradient(145deg,#f97316,#ea580c)',
    '--input-bg': '#fef2f2',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#f97316',
    '--peel-indicator-overdue': '#dc3545'
  }),
  ice: createRNCompatibleTheme({
    name: 'ice',
    '--bg-gradient': 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 30%,#bae6fd 60%,#a5f3fc 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#0f172a',
    '--muted': '#334155',
    '--border': '#cbd5e1',
    '--accent-1': '#0ea5e9',
    '--accent-2': '#0284c7',
    '--peel-bg': 'linear-gradient(145deg,#f8fafc,#f1f5f9)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#f8fafc,#f1f5f9)',
    '--chat-system-bg': 'linear-gradient(145deg,#bae6fd,#7dd3fc)',
    '--user-bubble-bg': 'linear-gradient(145deg,#06b6d4,#0891b2)',
    '--input-bg': '#f8fafc',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#bae6fd,#7dd3fc)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
    '--peel-indicator-soon': '#0ea5e9',
    '--peel-indicator-overdue': '#ef4444'
  }),
  galaxy: createRNCompatibleTheme({
    name: 'galaxy',
    '--bg-gradient': 'linear-gradient(135deg,#2d1b69 0%,#3730a3 30%,#7c3aed 60%,#c026d3 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#581c87',
    '--muted': '#7c3aed',
    '--border': '#a78bfa',
    '--accent-1': '#8b5cf6',
    '--accent-2': '#a855f7',
    '--peel-bg': 'linear-gradient(145deg,#f5f3ff,#ede9fe)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#f5f3ff,#ede9fe)',
    '--chat-system-bg': 'linear-gradient(145deg,#c4b5fd,#a78bfa)',
    '--user-bubble-bg': 'linear-gradient(145deg,#d946ef,#c026d3)',
    '--input-bg': '#f5f3ff',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#c4b5fd,#a78bfa)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
    '--peel-indicator-soon': '#8b5cf6',
    '--peel-indicator-overdue': '#ef4444'
  }),
  desert: createRNCompatibleTheme({
    name: 'desert',
    '--bg-gradient': 'linear-gradient(135deg,#fef3c7 0%,#fed7aa 30%,#d97706 60%,#92400e 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#78350f',
    '--muted': '#d97706',
    '--border': '#fdba74',
    '--accent-1': '#f97316',
    '--accent-2': '#ea580c',
    '--peel-bg': 'linear-gradient(145deg,#fffbeb,#fef3c7)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fffbeb,#fef3c7)',
    '--chat-system-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
    '--user-bubble-bg': 'linear-gradient(145deg,#d97706,#92400e)',
    '--input-bg': '#fffbeb',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#f97316',
    '--peel-indicator-overdue': '#dc3545'
  }),
  meadow: createRNCompatibleTheme({
    name: 'meadow',
    '--bg-gradient': 'linear-gradient(135deg,#f0fdf4 0%,#d9f99d 40%,#fce7f3 70%,#e9d5ff 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#14532d',
    '--muted': '#16a34a',
    '--border': '#86efac',
    '--accent-1': '#22c55e',
    '--accent-2': '#059669',
    '--peel-bg': 'linear-gradient(145deg,#f0fdf4,#dcfce7)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#f0fdf4,#dcfce7)',
    '--chat-system-bg': 'linear-gradient(145deg,#d9f99d,#bef264)',
    '--user-bubble-bg': 'linear-gradient(145deg,#ec4899,#db2777)',
    '--input-bg': '#f0fdf4',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#d9f99d,#bef264)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
    '--peel-indicator-soon': '#16a34a',
    '--peel-indicator-overdue': '#dc2626'
  }),
  storm: createRNCompatibleTheme({
    name: 'storm',
    '--bg-gradient': 'linear-gradient(135deg,#1e293b 0%,#334155 30%,#475569 60%,#64748b 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#0f172a',
    '--muted': '#475569',
    '--border': '#cbd5e1',
    '--accent-1': '#64748b',
    '--accent-2': '#475569',
    '--peel-bg': 'linear-gradient(145deg,#f8fafc,#f1f5f9)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#f8fafc,#f1f5f9)',
    '--chat-system-bg': 'linear-gradient(145deg,#e2e8f0,#cbd5e1)',
    '--user-bubble-bg': 'linear-gradient(145deg,#6366f1,#4f46e5)',
    '--input-bg': '#f8fafc',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#e2e8f0,#cbd5e1)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
    '--peel-indicator-soon': '#64748b',
    '--peel-indicator-overdue': '#ef4444'
  }),
  candy: createRNCompatibleTheme({
    name: 'candy',
    '--bg-gradient': 'linear-gradient(135deg,#fdf2f8 0%,#dbeafe 30%,#fef3c7 60%,#fce7f3 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#831843',
    '--muted': '#db2777',
    '--border': '#f9a8d4',
    '--accent-1': '#ec4899',
    '--accent-2': '#3b82f6',
    '--peel-bg': 'linear-gradient(145deg,#fdf2f8,#fce7f3)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fdf2f8,#fce7f3)',
    '--chat-system-bg': 'linear-gradient(145deg,#dbeafe,#bfdbfe)',
    '--user-bubble-bg': 'linear-gradient(145deg,#f59e0b,#d97706)',
    '--input-bg': '#fdf2f8',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#dbeafe,#bfdbfe)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#3b82f6',
    '--peel-indicator-overdue': '#dc2626'
  }),
  autumn: createRNCompatibleTheme({
    name: 'autumn',
    '--bg-gradient': 'linear-gradient(135deg,#fef2f2 0%,#fed7aa 30%,#dc2626 60%,#7c2d12 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#7f1d1d',
    '--muted': '#dc2626',
    '--border': '#fca5a5',
    '--accent-1': '#ef4444',
    '--accent-2': '#ea580c',
    '--peel-bg': 'linear-gradient(145deg,#fef2f2,#fee2e2)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fef2f2,#fee2e2)',
    '--chat-system-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
    '--user-bubble-bg': 'linear-gradient(145deg,#92400e,#78350f)',
    '--input-bg': '#fef2f2',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#ea580c',
    '--peel-indicator-overdue': '#dc3545'
  }),
  sunrise: createRNCompatibleTheme({
    name: 'sunrise',
    '--bg-gradient': 'linear-gradient(135deg,#fdf2f8 0%,#fed7aa 40%,#fef3c7 70%,#fce7f3 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#831843',
    '--muted': '#db2777',
    '--border': '#f9a8d4',
    '--accent-1': '#ec4899',
    '--accent-2': '#f97316',
    '--peel-bg': 'linear-gradient(145deg,#fdf2f8,#fce7f3)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fdf2f8,#fce7f3)',
    '--chat-system-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
    '--user-bubble-bg': 'linear-gradient(145deg,#f59e0b,#d97706)',
    '--input-bg': '#fdf2f8',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#f97316',
    '--peel-indicator-overdue': '#dc2626'
  }),
  twilight: createRNCompatibleTheme({
    name: 'twilight',
    '--bg-gradient': 'linear-gradient(135deg,#1e1b4b 0%,#312e81 30%,#7c3aed 60%,#db2777 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#1e1b4b',
    '--muted': '#312e81',
    '--border': '#6366f1',
    '--accent-1': '#4f46e5',
    '--accent-2': '#7c3aed',
    '--peel-bg': 'linear-gradient(145deg,#f5f3ff,#ede9fe)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#f5f3ff,#ede9fe)',
    '--chat-system-bg': 'linear-gradient(145deg,#c4b5fd,#a78bfa)',
    '--user-bubble-bg': 'linear-gradient(145deg,#db2777,#be185d)',
    '--input-bg': '#f5f3ff',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#c4b5fd,#a78bfa)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
    '--peel-indicator-soon': '#4f46e5',
    '--peel-indicator-overdue': '#dc2626'
  }),
  neon: createRNCompatibleTheme({
    name: 'neon',
    '--bg-gradient': 'linear-gradient(135deg,#0c0a09 0%,#ec4899 30%,#06b6d4 60%,#10b981 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#0c0a09',
    '--muted': '#374151',
    '--border': '#6b7280',
    '--accent-1': '#ec4899',
    '--accent-2': '#06b6d4',
    '--peel-bg': 'linear-gradient(145deg,#f9fafb,#f3f4f6)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#f9fafb,#f3f4f6)',
    '--chat-system-bg': 'linear-gradient(145deg,#dbeafe,#bfdbfe)',
    '--user-bubble-bg': 'linear-gradient(145deg,#10b981,#059669)',
    '--input-bg': '#f9fafb',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#dbeafe,#bfdbfe)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
    '--peel-indicator-soon': '#06b6d4',
    '--peel-indicator-overdue': '#dc2626'
  }),
  vintage: createRNCompatibleTheme({
    name: 'vintage',
    '--bg-gradient': 'linear-gradient(135deg,#fef7ed 0%,#d6d3d1 30%,#a8a29e 60%,#78716c 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#374151',
    '--muted': '#6b7280',
    '--border': '#d1d5db',
    '--accent-1': '#92400e',
    '--accent-2': '#a16207',
    '--peel-bg': 'linear-gradient(145deg,#fef7ed,#fffbeb)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fef7ed,#fffbeb)',
    '--chat-system-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
    '--user-bubble-bg': 'linear-gradient(145deg,#78716c,#57534e)',
    '--input-bg': '#fef7ed',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#a16207',
    '--peel-indicator-overdue': '#dc2626'
  }),
  tropical: createRNCompatibleTheme({
    name: 'tropical',
    '--bg-gradient': 'linear-gradient(135deg,#ecfdf5 0%,#d9f99d 30%,#fed7aa 60%,#fce7f3 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#14532d',
    '--muted': '#16a34a',
    '--border': '#86efac',
    '--accent-1': '#22c55e',
    '--accent-2': '#f97316',
    '--peel-bg': 'linear-gradient(145deg,#ecfdf5,#dcfce7)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#ecfdf5,#dcfce7)',
    '--chat-system-bg': 'linear-gradient(145deg,#d9f99d,#bef264)',
    '--user-bubble-bg': 'linear-gradient(145deg,#ec4899,#db2777)',
    '--input-bg': '#ecfdf5',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#d9f99d,#bef264)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
    '--peel-indicator-soon': '#22c55e',
    '--peel-indicator-overdue': '#dc2626'
  }),
  metallic: createRNCompatibleTheme({
    name: 'metallic',
    '--bg-gradient': 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 30%,#f59e0b 60%,#b91c1c 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#1f2937',
    '--muted': '#4b5563',
    '--border': '#9ca3af',
    '--accent-1': '#f59e0b',
    '--accent-2': '#dc2626',
    '--peel-bg': 'linear-gradient(145deg,#f8fafc,#f1f5f9)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#f8fafc,#f1f5f9)',
    '--chat-system-bg': 'linear-gradient(145deg,#e2e8f0,#cbd5e1)',
    '--user-bubble-bg': 'linear-gradient(145deg,#7c3aed,#5b21b6)',
    '--input-bg': '#f8fafc',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#e2e8f0,#cbd5e1)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
    '--peel-indicator-soon': '#f59e0b',
    '--peel-indicator-overdue': '#dc2626'
  }),
  pastel: createRNCompatibleTheme({
    name: 'pastel',
    '--bg-gradient': 'linear-gradient(135deg,#fdf2f8 0%,#e0e7ff 30%,#f0fdf4 60%,#fef7ed 100%)',
    '--panel-bg': '#ffffff',
    '--text-primary': '#374151',
    '--muted': '#6b7280',
    '--border': '#d1d5db',
    '--accent-1': '#ec4899',
    '--accent-2': '#6366f1',
    '--peel-bg': 'linear-gradient(145deg,#fdf2f8,#fce7f3)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#fdf2f8,#fce7f3)',
    '--chat-system-bg': 'linear-gradient(145deg,#e0e7ff,#c7d2fe)',
    '--user-bubble-bg': 'linear-gradient(145deg,#22c55e,#16a34a)',
    '--input-bg': '#fdf2f8',
    '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
    '--peel-soon-bg': 'linear-gradient(145deg,#e0e7ff,#c7d2fe)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
    '--peel-indicator-soon': '#6366f1',
    '--peel-indicator-overdue': '#dc2626'
  }),
  'dark-blue': createRNCompatibleTheme({
    name: 'dark-blue',
    '--bg-gradient': 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
    '--panel-bg': '#0f172a',
    '--text-primary': '#f1f5f9',
    '--muted': '#94a3b8',
    '--border': '#334155',
    '--accent-1': '#3b82f6',
    '--accent-2': '#1d4ed8',
    '--peel-bg': 'linear-gradient(145deg,#1e293b,#334155)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#1e293b,#334155)',
    '--chat-system-bg': 'linear-gradient(145deg,#1e40af,#1e3a8a)',
    '--user-bubble-bg': 'linear-gradient(145deg,#3b82f6,#1d4ed8)',
    '--input-bg': '#1e293b',
    '--system-text': '#93c5fd',
    '--assistant-text': '#f1f5f9',
    '--user-text': '#ffffff',
    '--peel-soon-bg': 'linear-gradient(145deg,#1e40af,#1e3a8a)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#7f1d1d,#991b1b)',
    '--peel-indicator-soon': '#3b82f6',
    '--peel-indicator-overdue': '#ef4444',
    '--notes-overlay-bg': 'rgba(15,23,42,0.95)'
  }),
  'dark-green': createRNCompatibleTheme({
    name: 'dark-green',
    '--bg-gradient': 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
    '--panel-bg': '#0f172a',
    '--text-primary': '#f1f5f9',
    '--muted': '#94a3b8',
    '--border': '#334155',
    '--accent-1': '#10b981',
    '--accent-2': '#059669',
    '--peel-bg': 'linear-gradient(145deg,#1e293b,#334155)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#1e293b,#334155)',
    '--chat-system-bg': 'linear-gradient(145deg,#065f46,#047857)',
    '--user-bubble-bg': 'linear-gradient(145deg,#10b981,#059669)',
    '--input-bg': '#1e293b',
    '--system-text': '#6ee7b7',
    '--assistant-text': '#f1f5f9',
    '--user-text': '#ffffff',
    '--peel-soon-bg': 'linear-gradient(145deg,#065f46,#047857)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#7f1d1d,#991b1b)',
    '--peel-indicator-soon': '#10b981',
    '--peel-indicator-overdue': '#ef4444',
    '--notes-overlay-bg': 'rgba(15,23,42,0.95)'
  }),
  'dark-purple': createRNCompatibleTheme({
    name: 'dark-purple',
    '--bg-gradient': 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
    '--panel-bg': '#0f172a',
    '--text-primary': '#f1f5f9',
    '--muted': '#94a3b8',
    '--border': '#334155',
    '--accent-1': '#8b5cf6',
    '--accent-2': '#7c3aed',
    '--peel-bg': 'linear-gradient(145deg,#1e293b,#334155)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#1e293b,#334155)',
    '--chat-system-bg': 'linear-gradient(145deg,#5b21b6,#6d28d9)',
    '--user-bubble-bg': 'linear-gradient(145deg,#8b5cf6,#7c3aed)',
    '--input-bg': '#1e293b',
    '--system-text': '#c4b5fd',
    '--assistant-text': '#f1f5f9',
    '--user-text': '#ffffff',
    '--peel-soon-bg': 'linear-gradient(145deg,#5b21b6,#6d28d9)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#7f1d1d,#991b1b)',
    '--peel-indicator-soon': '#8b5cf6',
    '--peel-indicator-overdue': '#ef4444',
    '--notes-overlay-bg': 'rgba(15,23,42,0.95)'
  }),
  'dark-red': createRNCompatibleTheme({
    name: 'dark-red',
    '--bg-gradient': 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
    '--panel-bg': '#0f172a',
    '--text-primary': '#f1f5f9',
    '--muted': '#94a3b8',
    '--border': '#334155',
    '--accent-1': '#ef4444',
    '--accent-2': '#dc2626',
    '--peel-bg': 'linear-gradient(145deg,#1e293b,#334155)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#1e293b,#334155)',
    '--chat-system-bg': 'linear-gradient(145deg,#991b1b,#b91c1c)',
    '--user-bubble-bg': 'linear-gradient(145deg,#ef4444,#dc2626)',
    '--input-bg': '#1e293b',
    '--system-text': '#fca5a5',
    '--assistant-text': '#f1f5f9',
    '--user-text': '#ffffff',
    '--peel-soon-bg': 'linear-gradient(145deg,#991b1b,#b91c1c)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#7f1d1d,#991b1b)',
    '--peel-indicator-soon': '#ef4444',
    '--peel-indicator-overdue': '#f87171',
    '--notes-overlay-bg': 'rgba(15,23,42,0.95)'
  }),
  'darker-teal': createRNCompatibleTheme({
    name: 'darker-teal',
    '--bg-gradient': 'linear-gradient(135deg,#0f4c3a 0%,#1e5f4c 100%)',
    '--panel-bg': '#0f4c3a',
    '--text-primary': '#ecfdf5',
    '--muted': '#86efac',
    '--border': '#065f46',
    '--accent-1': '#0d9488',
    '--accent-2': '#0f766e',
    '--peel-bg': 'linear-gradient(145deg,#1e5f4c,#2d7a5f)',
    '--chat-assistant-bg': 'linear-gradient(145deg,#1e5f4c,#2d7a5f)',
    '--chat-system-bg': 'linear-gradient(145deg,#065f46,#047857)',
    '--user-bubble-bg': 'linear-gradient(145deg,#0d9488,#0f766e)',
    '--input-bg': '#1e5f4c',
    '--system-text': '#5eead4',
    '--assistant-text': '#ecfdf5',
    '--user-text': '#ffffff',
    '--peel-soon-bg': 'linear-gradient(145deg,#065f46,#047857)',
    '--peel-overdue-bg': 'linear-gradient(145deg,#7f1d1d,#991b1b)',
    '--peel-indicator-soon': '#0d9488',
    '--peel-indicator-overdue': '#ef4444',
    '--notes-overlay-bg': 'rgba(15,76,58,0.95)'
  })
};

type ThemeContextType = {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => Promise<void>;
  availableThemes: ThemeName[];
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'sa_theme';

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

async function getStoredTheme(): Promise<ThemeName> {
  try {
    const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    return (stored as ThemeName) || 'light';
  } catch {
    return 'light';
  }
}

async function storeTheme(name: ThemeName): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, name);
  } catch (e) {
    console.warn('Failed to store theme:', e);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeName, setThemeNameState] = useState<ThemeName>('light');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeTheme = async () => {
      try {
        // Try to load from server first (with timeout)
        const serverThemePromise = apiGet('settings/theme');
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Server timeout')), 3000)
        );

        const serverTheme = await Promise.race([serverThemePromise, timeoutPromise]).catch(() => null);

        if (serverTheme && serverTheme.theme && THEMES[serverTheme.theme as ThemeName]) {
          if (mounted) {
            setThemeNameState(serverTheme.theme);
            await storeTheme(serverTheme.theme);
          }
          return;
        }

        // Fall back to stored theme
        const stored = await getStoredTheme();
        if (mounted) {
          setThemeNameState(stored);
        }
      } catch (e) {
        console.warn('Failed to initialize theme:', e);
        // Fall back to stored theme even on error
        try {
          const stored = await getStoredTheme();
          if (mounted) {
            setThemeNameState(stored);
          }
        } catch (fallbackError) {
          console.warn('Failed to load stored theme:', fallbackError);
          // Use default theme if everything fails
          if (mounted) {
            setThemeNameState('light');
          }
        }
      } finally {
        if (mounted) {
          setInitialized(true);
        }
      }
    };

    initializeTheme();

    return () => {
      mounted = false;
    };
  }, []);

  const setTheme = async (name: ThemeName) => {
    setThemeNameState(name);
    await storeTheme(name);

    // Sync to server
    try {
      await apiPost('settings/theme', { theme: name });
    } catch (e) {
      console.warn('Failed to sync theme to server:', e);
    }
  };

  const theme = THEMES[themeName];

  const value: ThemeContextType = {
    theme,
    themeName,
    setTheme,
    availableThemes: Object.keys(THEMES) as ThemeName[]
  };

  if (!initialized) {
    return null; // Or a loading component
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}