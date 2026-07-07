// script.js — interactive behavior inspired by Telegram Web controls + emoji picker
const form = document.getElementById('composer');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const sendBtn = document.getElementById('send');
const attachBtn = document.getElementById('attach');
const emojiBtn = document.getElementById('emoji-btn');
const emojiPanel = document.getElementById('emoji-panel');
const msgActions = document.getElementById('msg-actions');
const confirmModal = document.getElementById('confirm');
const confirmMsgEl = document.getElementById('confirm-message');
const confirmOk = document.getElementById('confirm-ok');
const confirmCancel = document.getElementById('confirm-cancel');
let lastMsgId = 2;
let currentMsgTarget = null;

// Basic emoji set (small, curated) — can be expanded or replaced with full set
const EMOJIS = ['😀','😁','😂','🤣','😊','😍','😘','😎','🤔','🙃','🥳','🤩','😭','😅','😇','🤝','👍','🙏','🎉','💯','🔥','✨','🎯','🌟','📎','📷','🎵','🔒','⚙️','🧭','📍','🤖'];

function buildEmojiPanel(){
  emojiPanel.innerHTML = '';
  EMOJIS.forEach(e=>{
    const el = document.createElement('div');
    el.className = 'emoji-cell';
    el.textContent = e;
    el.addEventListener('click', ()=>{
      insertAtCursor(input, e);
      input.focus();
      // close panel after pick
      toggleEmoji(false);
    });
    emojiPanel.appendChild(el);
  });
}
buildEmojiPanel();

// Send message handler
form.addEventListener('submit', e=>{
  e.preventDefault();
  const text = input.value.trim();
  if(!text) return;
  addOutgoing(text);
  input.value = '';
  animateSendIcon();
  // fake reply
  setTimeout(()=> addIncoming(simpleReply(text)), 800);
});

// Attach (dummy)
attachBtn.addEventListener('click', ()=>{
  alert('Attach file — mobile/web flow not implemented in demo.');
});

// Emoji toggle
emojiBtn.addEventListener('click', ()=> toggleEmoji());
function toggleEmoji(force){
  const isOpen = emojiPanel.getAttribute('aria-hidden') === 'false';
  const open = typeof force === 'boolean' ? force : !isOpen;
  emojiPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
}

// helper to insert at cursor
function insertAtCursor(el, text) {
  const start = el.selectionStart || 0;
  const end = el.selectionEnd || 0;
  const value = el.value || '';
  el.value = value.slice(0, start) + text + value.slice(end);
  const pos = start + text.length;
  el.selectionStart = el.selectionEnd = pos;
}

// Add outgoing message
function addOutgoing(text){
  lastMsgId++;
  const id = 'm' + lastMsgId;
  const el = document.createElement('div');
  el.className = 'message outgoing';
  el.dataset.id = id;
  el.innerHTML = `<div class="bubble">${escapeHtml(text)}</div><div class="meta-msg"><span class="time">${timeNow()}</span></div>`;
  attachMessageHandlers(el);
  messages.appendChild(el);
  scrollBottom();
}
function addIncoming(text){
  lastMsgId++;
  const id = 'm' + lastMsgId;
  const el = document.createElement('div');
  el.className = 'message incoming';
  el.dataset.id = id;
  el.innerHTML = `<div class="bubble">${escapeHtml(text)}</div><div class="meta-msg"><span class="time">${timeNow()}</span></div>`;
  attachMessageHandlers(el);
  messages.appendChild(el);
  scrollBottom();
}

function simpleReply(t){
  const lowers = t.toLowerCase();
  if(lowers.includes('привет')) return 'Привет! Рад видеть тебя.';
  if(lowers.includes('как') || lowers.includes('дел')) return 'Всё хорошо, спасибо! А у тебя?';
  if(lowers.includes('сайт')) return 'Сайт готов — включай Pages и проверь.';
  return 'Интересно — расскажи ещё.';
}
function timeNow(){
  const d = new Date();
  return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}
function scrollBottom(){
  messages.scrollTop = messages.scrollHeight;
}

// animate send button
function animateSendIcon(){
  sendBtn.classList.add('pulse');
  setTimeout(()=> sendBtn.classList.remove('pulse'), 600);
}

// message handlers for long-press or click to show actions
function attachMessageHandlers(msgEl){
  // open actions on right click (desktop) — pass element as target
  msgEl.addEventListener('contextmenu', e=>{
    e.preventDefault();
    showMsgActions(e.pageX, e.pageY, msgEl);
  });
  msgEl.addEventListener('click', e=>{
    // short click toggles reaction (like)
    if(e.target.closest('.bubble')){
      toggleReaction(msgEl, '👍');
    }
  });
}

function toggleReaction(msgEl, emoji){
  let r = msgEl.querySelector('.msg-reactions');
  if(r){
    r.remove();
    return;
  }
  r = document.createElement('div');
  r.className = 'msg-reactions';
  r.innerHTML = `<div class="react">${emoji}</div>`;
  msgEl.appendChild(r);
}

// popup actions (track current message)
function showMsgActions(x,y,msgEl){
  currentMsgTarget = msgEl || null;
  msgActions.style.left = (x - 40) + 'px';
  msgActions.style.top = (y - 60) + 'px';
  msgActions.setAttribute('aria-hidden','false');
}

document.addEventListener('click', e=>{
  if(!e.target.closest('.message') && !e.target.closest('#msg-actions') && !e.target.closest('#emoji-panel') && !e.target.closest('#emoji-btn')){
    msgActions.setAttribute('aria-hidden','true');
    // close emoji panel if clicked outside
    if(emojiPanel.getAttribute('aria-hidden') === 'false') toggleEmoji(false);
  }
});

// hook action buttons
msgActions.querySelectorAll('.act').forEach(btn=>{
  btn.addEventListener('click', e=>{
    const action = btn.dataset.action;
    msgActions.setAttribute('aria-hidden','true');
    if(action === 'reply'){
      if(currentMsgTarget) input.value = '↪ ' + currentMsgTarget.querySelector('.bubble').textContent + '\n';
      input.focus();
    } else if(action === 'copy'){
      if(currentMsgTarget) navigator.clipboard && navigator.clipboard.writeText(currentMsgTarget.querySelector('.bubble').textContent);
    } else if(action === 'delete'){
      if(currentMsgTarget) {
        showConfirm('Вы уверены, что хотите удалить сообщение?', ()=>{
          currentMsgTarget.remove();
          currentMsgTarget = null;
        });
      }
    }
  });
});

// confirmation modal
function showConfirm(message, onConfirm){
  confirmMsgEl.textContent = message;
  confirmModal.setAttribute('aria-hidden','false');

  function cleanup(){
    confirmOk.removeEventListener('click', okHandler);
    confirmCancel.removeEventListener('click', cancelHandler);
    confirmModal.setAttribute('aria-hidden','true');
  }
  function okHandler(){ cleanup(); onConfirm && onConfirm(); }
  function cancelHandler(){ cleanup(); }
  confirmOk.addEventListener('click', okHandler);
  confirmCancel.addEventListener('click', cancelHandler);
}

// basic accessibility: ctrl+enter send
input.addEventListener('keydown', e=>{
  if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){
    form.requestSubmit();
  }
});

// escape HTML
function escapeHtml(unsafe) {
  return unsafe
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/\"/g, "&quot;")
       .replace(/\'/g, "&#039;");
}

// attach handlers to existing messages on load
document.querySelectorAll('.message').forEach(m=> attachMessageHandlers(m));
