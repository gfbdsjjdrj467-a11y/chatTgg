// script.js — simple interactivity: send messages, animate button
const form = document.getElementById('composer');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const sendBtn = document.getElementById('send');

form.addEventListener('submit', e=>{
  e.preventDefault();
  const text = input.value.trim();
  if(!text) return;
  addOutgoing(text);
  input.value = '';
  // fake reply
  setTimeout(()=> addIncoming(simpleReply(text)), 700);
  // animate pulse
  sendBtn.classList.add('pulse');
  setTimeout(()=> sendBtn.classList.remove('pulse'), 600);
});

function addOutgoing(text){
  const el = document.createElement('div');
  el.className = 'message outgoing';
  el.innerHTML = `<div class="bubble">${escapeHtml(text)}</div>`;
  messages.appendChild(el);
  scrollBottom();
}
function addIncoming(text){
  const el = document.createElement('div');
  el.className = 'message incoming';
  el.innerHTML = `<div class="bubble">${escapeHtml(text)}</div>`;
  messages.appendChild(el);
  scrollBottom();
}
function simpleReply(t){
  const lowers = t.toLowerCase();
  if(lowers.includes('привет')) return 'Привет! Рад видеть тебя.';
  if(lowers.includes('как') || lowers.includes('дел')) return 'Всё хорошо, спасибо! А у тебя?';
  return 'Интересно — расскажи ещё.';
}
function scrollBottom(){
  messages.scrollTop = messages.scrollHeight;
}
function escapeHtml(unsafe) {
  return unsafe
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/\"/g, "&quot;")
       .replace(/\'/g, "&#039;");
}

// small accessibility tweak: send on Ctrl+Enter
input.addEventListener('keydown', e=>{
  if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){
    form.dispatchEvent(new Event('submit',{cancelable:true}));
  }
});
