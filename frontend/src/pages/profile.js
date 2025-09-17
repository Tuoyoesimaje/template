// Profile page JavaScript
import { API_ROOT, AUTH_TOKEN_KEY } from '../utils/authHelpers.js';

const qaChat = document.getElementById('qaChat');
const qaInput = document.getElementById('qaInput');
const qaNext = document.getElementById('qaNext');
const qaSkip = document.getElementById('qaSkip');
const profileMsg = document.getElementById('profileMsg');

const steps = [
  { id: 'intro', prompt: 'Tell us a little about yourself. You can skip any optional fields.' },
  { id: 'name', prompt: "What's your name?", key: 'name', required: true },
  { id: 'school', prompt: "Class / School (optional)", key: 'school', required: false },
  { id: 'fav', prompt: "Favorite things (optional)", key: 'fav', required: false },
  { id: 'hobbies', prompt: "Hobbies (optional)", key: 'hobbies', required: false },
  { id: 'movies', prompt: "Best movies/music (optional)", key: 'movies', required: false },
  { id: 'goals', prompt: "Goals / what you want from the app (optional)", key: 'goals', required: false }
];
const answers = {};
let idx = 0;

// single prompt element
const promptWrapper = document.createElement('div');
promptWrapper.className = 'qa-prompt-wrapper'; promptWrapper.style.marginBottom = '8px';
const promptInner = document.createElement('div'); promptInner.className = 'qa-prompt';
promptWrapper.appendChild(promptInner);
qaChat.appendChild(promptWrapper);

function renderUser(text) {
  const d = document.createElement('div'); d.className = 'qa-user-wrapper'; d.style.marginBottom='8px'; d.innerHTML = `<div class="qa-user">${text}</div>`; qaChat.appendChild(d); qaChat.scrollTop = qaChat.scrollHeight;
}

function showStep() {
  const s = steps[idx];
  qaInput.type = s.type === 'password' ? 'password' : 'text';
  // prefill with existing answer if present
  qaInput.value = (s.key && answers[s.key]) ? answers[s.key] : '';
  qaInput.placeholder = s.id === 'intro' ? s.prompt : s.prompt;
  promptInner.textContent = s.prompt;
  qaChat.scrollTop = qaChat.scrollHeight;
  qaInput.focus();
}

async function saveAndFinish() {
  profileMsg.textContent = 'Saving preferences...';
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) { profileMsg.textContent = 'Please login first.'; return; }
    const meta = answers;
    const r = await fetch(`${API_ROOT.replace(/\/$/, '')}/api/user/preferences`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ meta }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j && j.error ? j.error : 'save failed');
    profileMsg.textContent = 'Preferences saved — returning home...';
    setTimeout(()=> location.href = '/', 700);
  } catch (e) { profileMsg.textContent = 'Save failed: ' + String(e); }
}

qaNext.addEventListener('click', ()=>{
  const s = steps[idx];
  const val = qaInput.value.trim();
  // dot-command handling
  if (val && val.startsWith('.')) {
    const cmd = val.slice(1).toLowerCase();
    if (cmd === 'login') { location.href = '/login.html'; return; }
    if (cmd === 'home') { location.href = '/'; return; }
  }
  if (s.required && !val && !(s.key && answers[s.key])) { profileMsg.textContent = 'This field is required.'; qaInput.focus(); return; }
  profileMsg.textContent = '';
  if (s.key) { answers[s.key] = val || answers[s.key] || ''; if (val) renderUser(val); }
  if (idx < steps.length - 1) { idx++; showStep(); } else { renderUser('Submitted.'); saveAndFinish(); }
});

qaSkip.addEventListener('click', ()=>{
  const s = steps[idx];
  if (s.required) { profileMsg.textContent = 'This field is required and cannot be skipped.'; return; }
  profileMsg.textContent = '';
  if (s.key) { answers[s.key] = ''; }
  renderUser('(skipped)');
  if (idx < steps.length - 1) { idx++; showStep(); } else { saveAndFinish(); }
});

// Load any existing preferences to prefill answers (best-effort)
(async ()=>{
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) { profileMsg.textContent = 'Please login first.'; showStep(); return; }
  try {
    const r = await fetch(`${API_ROOT.replace(/\/$/, '')}/api/user/preferences`, { method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }});
    const j = await r.json();
    if (j && j.meta) Object.assign(answers, j.meta);
  } catch(e) { /* ignore */ }
  // render any existing answers and advance idx to first unanswered
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (s.key && answers[s.key]) {
      renderUser(answers[s.key]);
    } else { idx = i; break; }
    // if we've rendered all, idx becomes steps.length - 1 + 1 (finish)
    if (i === steps.length - 1) idx = steps.length - 1;
  }
  showStep();
})();

qaInput.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') qaNext.click(); });