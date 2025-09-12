import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import fetchOrig from 'cross-fetch';

// Re-export fetch for environments where global fetch may be unavailable (keeps types consistent)
export const fetchFn: typeof fetch = (globalThis as any).fetch || (fetchOrig as any);

// ---- Config & Auth (ported from web getAuthHeaders and API_ROOT logic) ----
export const AUTH_TOKEN_KEY = 'sa_auth_token';
const API_ROOT_KEY = 'sa_api_root';

const DEFAULT_ANDROID_API = 'https://alfred-ai-backend.onrender.com';
const DEFAULT_IOS_API = 'https://alfred-ai-backend.onrender.com';

export async function getSavedApiRoot(): Promise<string | null> {
  try {
    return (await AsyncStorage.getItem(API_ROOT_KEY)) || null;
  } catch { return null; }
}

export async function setSavedApiRoot(url: string): Promise<void> {
  try { await AsyncStorage.setItem(API_ROOT_KEY, url); } catch {}
}

export async function resolveApiRoot(): Promise<string> {
  const saved = await getSavedApiRoot();
  if (saved) return saved.replace(/\/$/, '');
  const def = Platform.OS === 'android' ? DEFAULT_ANDROID_API : DEFAULT_IOS_API;
  return def.replace(/\/$/, '');
}

export async function getToken(): Promise<string | null> {
  try {
    const t = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    return t || null;
  } catch { return null; }
}

export async function setToken(token: string): Promise<void> {
  try { await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token); } catch {}
}

export async function clearToken(): Promise<void> {
  try { await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY); } catch {}
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = await getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return headers;
}

// ---- Robust text extractor (ported from web extractTextFromApiResponse) ----
export function extractTextFromApiResponse(respText: string): string {
  try {
    const p = JSON.parse(respText);
    if (p?.candidates && Array.isArray(p.candidates)) {
      const parts = p.candidates.map((c: any) => {
        if (c?.content?.parts && Array.isArray(c.content.parts)) {
          return c.content.parts.map((pt: any) => pt.text || '').join('\n');
        }
        return c?.content || c?.output || c?.message || c?.text || '';
      });
      return parts.join('\n');
    }
    if (p?.output) return typeof p.output === 'string' ? p.output : JSON.stringify(p.output);
    if (p?.items) return p.items.map((i: any) => i.text || '').join('\n');
    if (p?.contents) {
      return p.contents.map((c: any) => (c.parts||[]).map((pp: any)=>pp.text||'').join('\n')).join('\n');
    }
    return JSON.stringify(p);
  } catch {
    try { return typeof respText === 'string' ? respText : JSON.stringify(respText); } catch { return String(respText); }
  }
}

// ---- Resilient fetch with retries (ported from web fetchWithRetries) ----
export async function fetchWithRetries(url: string, init: RequestInit = {}, maxRetries = 4): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      const resp = await fetchFn(url, init as any);
      if ((resp.status === 503 || resp.status === 429) && attempt < maxRetries) {
        const delay = Math.round((500 * Math.pow(2, attempt)) + Math.random() * 300);
        await new Promise(r => setTimeout(r, delay));
        attempt++;
        continue;
      }
      return resp;
    } catch (e) {
      if (attempt < maxRetries) {
        const delay = Math.round((500 * Math.pow(2, attempt)) + Math.random() * 300);
        await new Promise(r => setTimeout(r, delay));
        attempt++;
        continue;
      }
      throw e;
    }
  }
}

// ---- Date helpers (ported from web computeStatusFromTimestamp & parseDueDate) ----
export function computeStatusFromTimestamp(timestamp?: number | null, display?: string): 'overdue' | 'soon' | 'pending' {
  if (!timestamp) {
    const s = (display || '').toLowerCase();
    if (s.includes('yesterday') || s.includes('overdue')) return 'overdue';
    if (s.includes('today') || s.includes('now') || s.includes('hour') || /\d{1,2}:\d{2}/.test(s)) return 'soon';
    return 'pending';
  }
  const now = Date.now();
  const diff = timestamp - now;
  if (diff < 0) return 'overdue';
  if (diff <= 1000*60*60*24) return 'soon';
  return 'pending';
}

export function parseDueDate(text: string): { display: string; timestamp: number | null } {
  const s = (text || '').trim();
  if (!s) return { display: '', timestamp: null };
  const lower = s.toLowerCase();

  let mm = lower.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (mm) {
    const hr = parseInt(mm[1],10); const min = parseInt(mm[2]||'0',10); const ampm = mm[3]; const dayToken = mm[4]; let hours = hr;
    if (ampm) { if (ampm==='pm' && hr<12) hours = hr+12; if (ampm==='am' && hr===12) hours = 0; }
    const d = new Date();
    if (dayToken === 'tomorrow') d.setDate(d.getDate()+1);
    else if (['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].includes(dayToken)) {
      const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      const target = (days as any).indexOf(dayToken);
      const diff = (target + 7 - d.getDay()) % 7 || 7;
      d.setDate(d.getDate()+diff);
    }
    d.setHours(hours, min, 0, 0);
    return { display: s, timestamp: d.getTime() };
  }

  let m = lower.match(/in\s+(\d+)\s+hours?/);
  if (m) { const hrs = parseInt(m[1],10); return { display: s, timestamp: Date.now() + hrs*3600*1000 }; }
  m = lower.match(/in\s+(\d+)\s+minutes?/);
  if (m) { const mins = parseInt(m[1],10); return { display: s, timestamp: Date.now() + mins*60*1000 }; }

  m = lower.match(/today\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (m) { const hr = parseInt(m[1],10); const min = parseInt(m[2]||'0',10); const ampm = m[3]; let hours = hr; if (ampm) { if (ampm==='pm' && hr<12) hours = hr+12; if (ampm==='am' && hr===12) hours = 0; } const d = new Date(); d.setHours(hours, min,0,0); return { display: s, timestamp: d.getTime() }; }

  m = lower.match(/tomorrow\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (m) { const hr = parseInt(m[1],10); const min = parseInt(m[2]||'0',10); const ampm = m[3]; let hours = hr; if (ampm) { if (ampm==='pm' && hr<12) hours = hr+12; if (ampm==='am' && hr===12) hours = 0; } const d = new Date(); d.setDate(d.getDate()+1); d.setHours(hours, min,0,0); return { display: s, timestamp: d.getTime() }; }

  m = lower.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (m) {
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const target = days.indexOf(m[1]);
    const hr = parseInt(m[2],10); const min = parseInt(m[3]||'0',10); const ampm = m[4]; let hours = hr; if (ampm) { if (ampm==='pm' && hr<12) hours = hr+12; if (ampm==='am' && hr===12) hours = 0; }
    const d = new Date();
    const diff = (target + 7 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate()+diff);
    d.setHours(hours,min,0,0);
    return { display: s, timestamp: d.getTime() };
  }

  m = lower.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/);
  if (m) {
    const hr = parseInt(m[1],10); const min = parseInt(m[2],10); const ampm = m[3]; let hours = hr; if (ampm) { if (ampm==='pm' && hr<12) hours = hr+12; if (ampm==='am' && hr===12) hours = 0; }
    const d = new Date(); d.setHours(hours,min,0,0); return { display: s, timestamp: d.getTime() };
  }

  return { display: s, timestamp: null };
}

// ---- Simple API client aligned with server.js endpoints ----
async function buildUrl(path: string): Promise<string> {
  const root = await resolveApiRoot();
  // if path already looks absolute, return it
  if (/^https?:\/\//i.test(path)) return path;
  return `${root}/${path.replace(/^\/+/, '')}`;
}

export async function apiGet(path: string) {
  const url = await buildUrl(`api/${path}`);
  const headers = await getAuthHeaders();
  const r = await fetchWithRetries(url, { method: 'GET', headers });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function apiPost(path: string, body: any) {
  const url = await buildUrl(`api/${path}`);
  const headers = await getAuthHeaders();
  const r = await fetchWithRetries(url, { method: 'POST', headers, body: JSON.stringify(body || {}) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function apiPut(path: string, body: any) {
  const url = await buildUrl(`api/${path}`);
  const headers = await getAuthHeaders();
  const r = await fetchWithRetries(url, { method: 'PUT', headers, body: JSON.stringify(body || {}) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function apiDelete(path: string) {
  const url = await buildUrl(`api/${path}`);
  const headers = await getAuthHeaders();
  const r = await fetchWithRetries(url, { method: 'DELETE', headers });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// Gemini proxy helper mirroring web client behavior
export async function postGemini(body: any) {
  const url = await buildUrl('gemini');
  const headers = await getAuthHeaders();
  const r = await fetchWithRetries(url, { method: 'POST', headers, body: JSON.stringify(body || {}) });
  const txt = await r.text();
  const extracted = extractTextFromApiResponse(txt) || txt;
  if (!r.ok) throw new Error(extracted);
  return extracted;
}