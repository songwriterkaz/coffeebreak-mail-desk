/* Coffeebreak Mail app */
(function(){
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='cbmail_v3', GB=1073741824, FREE_Q=1*GB, PRO_Q=10*GB, SALT='|coffeebreak-mail-pro-2026';
const PAYID=''; /* no in-app payments: one price on itch */
const fmtB=window.CB_fmtBytes;
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
function fnv(str){let h=0x811c9dc5;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h}
function codeFor(ref){let a=fnv(ref.toUpperCase()+SALT),b=fnv(SALT+ref.toUpperCase()+a);const al='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let o='';for(let i=0;i<6;i++){const v=i<3?a:b;o+=al[(v>>> (i%3*8))%al.length]}return o}
function genRef(){const al='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',a=new Uint32Array(6);crypto.getRandomValues(a);return 'CBM-'+Array.from(a,x=>al[x%al.length]).join('')}
function def(){return{accounts:[],cur:null,mail:{},custom:[],labels:[{name:'Orders',color:'#ff2e93'},{name:'Music',color:'#a54cff'},{name:'Ideas',color:'#ff8a00'},{name:'Important',color:'#e0002a'}],
 signatures:[{name:'Simple',text:'Warm regards,\n{name}\nSent with Coffeebreak Mail'},{name:'Coffeebreak fan',text:'Cheers,\n{name}\n☕ Coffeebreak Mail | https://coffeebreaks.itch.io'}],
 templates:[{name:'Thank you',subj:'Thank you',body:'Hi,\n\nThank you so much for your help. It really made my day.\n\n'},{name:'Order enquiry',subj:'Order enquiry',body:'Hello,\n\nI would like to ask about ordering. Could you please send prices, delivery times and the minimum order.\n\nThank you.\n'},{name:'Follow up',subj:'Following up',body:'Hi,\n\nI am just following up on my last email. Please let me know when you have a moment.\n\n'},{name:'Music pitch',subj:'New song for you to hear',body:'Hello,\n\nI have a new song I think you will enjoy. You can hear more at https://coffeebreaks.itch.io\n\n'},{name:'Complaint',subj:'Problem with my order',body:'Hello,\n\nI am writing about a problem with my order. Here are the details:\n\nCould you please help me sort this out.\n\n'}],
 contacts:[],notes:'',todos:[],settings:{theme:'bubblegum',big:false,sort:'new',spin:true},admin:{pin:null,register:[]},driveFolders:{}}}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');return d?Object.assign(def(),d):def()}catch(e){return def()}}
let S=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast('Could not save. Your browser storage may be full.')}}
function toast(t){const e=$('#toast');e.textContent=t;e.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.display='none',3800)}
const me=()=>S.accounts.find(a=>a.id===S.cur)||null;
const isPro=()=>!!me(); /* one price: every feature is included for every account */
const box=()=>{const a=me();if(!a)return[];return S.mail[a.user]||(S.mail[a.user]=[])};
const quota=()=>isPro()?PRO_Q:FREE_Q;

/* ---------- THEMES & STICKERS ---------- */
const THEMES=[{id:'bubblegum',n:'Bubblegum',pro:false},{id:'hotpink',n:'Hot Pink',pro:false},{id:'rosegold',n:'Rose Gold',pro:true},{id:'neon',n:'Neon Night',pro:true},{id:'cottoncandy',n:'Cotton Candy',pro:true},{id:'strawberry',n:'Strawberry Milk',pro:true}];
const ST_FREE=['💗','☕','🌸','✨','😊','👍','🎵','🍰'];
const ST_PRO=['🦄','🌈','💅','👑','🍓','🎀','🪩','🎸','🍩','💖','🌺','🧁'];
function applyTheme(){let t=S.settings.theme;const th=THEMES.find(x=>x.id===t);if(!th||(th.pro&&!isPro()))t='bubblegum';document.body.dataset.theme=t;document.body.classList.toggle('big',!!S.settings.big)}

/* ---------- NAV ---------- */
let view='mail';
function go(v){view=v;$$('#tabs button[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===v));$$('.view').forEach(s=>s.classList.toggle('on',s.id==='v-'+v));render();if(v==='vr')initVR();if(v!=='vr'&&VR.on)VR.pause();window.scrollTo(0,0)}
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('button[data-v]');if(b)go(b.dataset.v)});

function lockHtml(kind){const a=me();
 if(!a)return '<div class="card lock"><div class="ic">💌</div><h2>Choose an account</h2><p>Pick or add an account on the Account page.</p><button onclick="CBM.go(\'signup\')">Open Account</button></div>';
 return ''}
function gate(id,needPro,kind){const ok=me()&&(!needPro||isPro());$('#'+id+'Lock').innerHTML=ok?'':lockHtml(kind);$('#'+id+'App').classList.toggle('hide',!ok);return ok}

function render(){applyTheme();const a=me();
 $('#who').innerHTML=a?'<b>'+esc(a.name)+'</b>'+esc(a.user)+'@coffeebreak · '+'Every feature included':'';
 $('#toolCount').textContent=TOOLS.length;$('#toolCount2').textContent=TOOLS.length;
 if(view==='signup')renderSignup();
 if(view==='mail'&&gate('mail',false,'Mail'))renderMail();
 if(view==='drive'&&gate('drive',false,'Drive'))renderDrive();
 if(view==='music'&&gate('music',true,'The music player'))renderMusic();
 if(view==='movies'&&gate('movies',true,'The movie corner'))renderMovies();
 if(view==='vr')gate('vr',true,'The VR lounge');
 if(view==='tools')renderTools();
 if(view==='settings'){renderSettings();renderProfile()}
 if(view==='admin')renderAdmin();}

/* ---------- SIGN UP ---------- */
function renderSignup(){const a=me();$('#acctCard').classList.toggle('hide',!a);
 if(!a)return;
 $('#acctInfo').innerHTML='<p style="font-size:20px">Hi '+esc(a.name)+'. Your Coffeebreak handle is <b>'+esc(a.user)+'@coffeebreak</b>.</p><p>Plan: <span class="status active">Every feature included</span></p><p class="muted">Your full email address on Coffeebreak\'s own domain arrives when outside sending goes live.</p><button class="ghost" id="logout">Change my name or handle</button>';
 let h='<h3>Every feature is included</h3><p>Your one purchase covers it all: 10 GB Drive, the VR lounge, Karen\'s songs, the movie corner, every theme and every sticker. There is nothing extra to buy.</p>';
 $('#proBox').innerHTML=h;
 $('#logout').onclick=()=>go('settings');
}
$('#suGo').onclick=()=>{const name=$('#suName').value.trim(),user=$('#suUser').value.trim().toLowerCase(),contact=$('#suContact').value.trim();
 if(!name)return msg('Please add your name.');if(!/^[a-z0-9._-]{3,20}$/.test(user))return msg('Handles use 3 to 20 letters, numbers, dots, dashes or underscores.');
 if(S.accounts.some(x=>x.user===user))return msg('That handle is taken on this device. Try another.');
 if(contact&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact))return msg('That contact email does not look right.');
 const a={id:uid(),name,user,contact,created:Date.now(),pro:'none',ref:null};S.accounts.push(a);S.cur=a.id;seed(a);save();msg('');render();toast('Welcome to Coffeebreak Mail, '+name);
 function msg(t){$('#suMsg').textContent=' '+t;return false}};
$('#suSwitch').onclick=()=>{if(!S.accounts.length)return toast('No accounts on this device yet.');gen('<h2>Switch account</h2>'+S.accounts.map(a=>'<button data-id="'+a.id+'">'+esc(a.name)+' ('+esc(a.user)+')</button>').join(''));$('#genBody').onclick=e=>{const b=e.target.closest('button[data-id]');if(b){S.cur=b.dataset.id;save();closeGen();render()}}};
function seed(a){const b=S.mail[a.user]=S.mail[a.user]||[];const t=Date.now();const k='karen@coffeebreak';
 [['Welcome to Coffeebreak Mail','Hi '+a.name+',\n\nWelcome to Coffeebreak Mail. Your handle is '+a.user+'@coffeebreak. There was nothing to sign up for. You can set your name and handle any time in Settings.\n\nWrite emails, sort them into folders, add labels and stickers, and keep files in Coffeebreak Drive.\n\nMail between Coffeebreak handles on this device works straight away. To send to and receive from Gmail, Outlook and others, link your free Coffeebreak Mail address on the Mail screen.\n\nKaren, Coffeebreak','Important'],
  ['Your Toolbox tour','There are '+TOOLS.length+' real tools in the Toolbox, from GST and invoice makers to fun bubble letters. Open the Toolbox tab to try them.','Ideas'],
  ['Meet Coffeebreak Drive','Drop any file into Coffeebreak Drive: photos, videos, songs, documents and zips. Every account gets 10 GB.',''],
  ['Need internet on the go','The Hotspot Helper shows how to share your phone\'s data and where to find free public WiFi. Coffeebreak Mail does not provide internet itself.',''],
  ['Music, movies and the VR lounge','Karen\'s songs, the movie corner and the VR lounge are all included. Open the Music, Movies and VR Lounge tabs.','Music']].forEach((m,i)=>b.push({id:uid(),from:k,fromName:'Karen at Coffeebreak',to:a.user+'@coffeebreak',subject:m[0],body:m[1],date:t-i*60000,folder:'Inbox',read:false,starred:i===0,labels:m[2]?[m[2]]:[],att:[]}))}
function deliverSystem(a,subj,body){(S.mail[a.user]=S.mail[a.user]||[]).push({id:uid(),from:'karen@coffeebreak',fromName:'Karen at Coffeebreak',to:a.user+'@coffeebreak',subject:subj,body,date:Date.now(),folder:'Inbox',read:false,starred:false,labels:['Important'],att:[]});save()}

/* ---------- MAIL ---------- */
let folder='Inbox',labelF=null,selId=null,q='';
const FOLDERS=['Inbox','Starred','Sent','Drafts','Archive','Trash'];
function allFolders(){return FOLDERS.concat(S.custom)}
function msgs(){let m=box();
 if(labelF)m=m.filter(x=>x.labels.includes(labelF)&&x.folder!=='Trash');
 else if(folder==='Starred')m=m.filter(x=>x.starred&&x.folder!=='Trash');
 else m=m.filter(x=>x.folder===folder);
 if(q){const k=q.toLowerCase();m=m.filter(x=>(x.from+' '+(x.fromName||'')+' '+x.to+' '+x.subject+' '+x.body).toLowerCase().includes(k))}
 const s=S.settings.sort;m=m.slice().sort((a,b)=>s==='old'?a.date-b.date:s==='subj'?a.subject.localeCompare(b.subject):b.date-a.date);return m}
function renderMail(){const b=box();
 $('#side').innerHTML='<h3>Folders</h3>'+allFolders().map(f=>{const n=f==='Starred'?b.filter(x=>x.starred&&x.folder!=='Trash').length:b.filter(x=>x.folder===f&&(f!=='Inbox'||!x.read)).length;return '<button data-f="'+esc(f)+'" class="'+(!labelF&&folder===f?'on':'')+'"><span>'+esc(f)+'</span><span>'+(n||'')+'</span></button>'}).join('')+'<h3>Labels</h3>'+S.labels.map(l=>'<button data-l="'+esc(l.name)+'" class="'+(labelF===l.name?'on':'')+'"><span><span class="lab" style="background:'+esc(l.color)+'">&nbsp;</span>'+esc(l.name)+'</span><span>'+(b.filter(x=>x.labels.includes(l.name)&&x.folder!=='Trash').length||'')+'</span></button>').join('')+(folder==='Trash'&&!labelF?'<button class="ghost" id="emptyTrash" style="justify-content:center">Empty trash</button>':'');
 const m=msgs();
 $('#list').innerHTML='<h3>'+esc(labelF||folder)+' <span class="muted">('+m.length+')</span></h3>'+(m.length?'':'<p class="muted">Nothing here.</p>')+m.map(x=>'<div class="msg '+(x.read?'':'unread')+(x.id===selId?' sel':'')+'" data-id="'+x.id+'"><div class="from">'+(x.starred?'⭐ ':'')+esc(x.folder==='Sent'||x.folder==='Drafts'?'To: '+x.to:(x.fromName||x.from))+' · '+new Date(x.date).toLocaleString('en-AU',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})+'</div><div class="subj">'+(x.sticker||'')+' '+esc(x.subject||'(no subject)')+'</div><div>'+x.labels.map(l=>{const L=S.labels.find(z=>z.name===l);return '<span class="lab" style="background:'+(L?esc(L.color):'#999')+'">'+esc(l)+'</span>'}).join('')+'<span class="muted">'+esc(x.body.slice(0,60))+'</span></div></div>').join('');
 renderReader();}
function renderReader(){const x=box().find(m=>m.id===selId);const r=$('#reader');
 if(!x){r.innerHTML='<p class="muted">Pick an email to read it.</p>';return}
 r.innerHTML='<h2 style="font-size:22px">'+esc(x.subject||'(no subject)')+'</h2><div class="muted">From: '+esc(x.fromName?x.fromName+' <'+x.from+'>':x.from)+'<br>To: '+esc(x.to)+(x.cc?'<br>Cc: '+esc(x.cc):'')+'<br>'+new Date(x.date).toLocaleString('en-AU')+(x.folder==='Sent'&&x.outside?'<br><b>Outside addresses wait in Sent until sending goes live.</b>':'')+'</div><div class="body">'+esc(x.body)+'</div>'+(x.att&&x.att.length?'<div>Attachments: '+x.att.map(t=>'<button class="ghost" data-att="'+t.id+'">📎 '+esc(t.name)+'</button>').join('')+'</div>':'')+
 '<div class="noprint"><button data-a="reply">Reply</button><button data-a="fwd">Forward</button>'+(x.folder==='Drafts'?'<button data-a="edit">Edit draft</button>':'')+'<button class="alt" data-a="star">'+(x.starred?'Unstar':'Star')+'</button><button class="alt" data-a="unread">Mark unread</button><button class="alt" data-a="archive">Archive</button>'+(x.folder==='Trash'?'<button class="alt" data-a="restore">Restore</button><button class="ghost" data-a="purge">Delete forever</button>':'<button class="ghost" data-a="del">Delete</button>')+'<button class="ghost" data-a="print">Print</button><button class="ghost" data-a="speak">Read aloud</button>'+
 '<div class="row"><div><label for="moveSel">Move to</label><select id="moveSel"><option value="">Choose folder</option>'+allFolders().filter(f=>f!=='Starred').map(f=>'<option>'+esc(f)+'</option>').join('')+'</select></div><div><label for="labSel">Add or remove label</label><select id="labSel"><option value="">Choose label</option>'+S.labels.map(l=>'<option>'+esc(l.name)+'</option>').join('')+'</select></div></div></div>';}
$('#side').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='emptyTrash'){const a=me();S.mail[a.user]=box().filter(x=>x.folder!=='Trash');save();selId=null;renderMail();return toast('Trash emptied')}if(b.dataset.f){folder=b.dataset.f;labelF=null}if(b.dataset.l){labelF=b.dataset.l}selId=null;renderMail()});
$('#list').addEventListener('click',e=>{const d=e.target.closest('.msg');if(!d)return;selId=d.dataset.id;const x=box().find(m=>m.id===selId);if(x&&!x.read){x.read=true;save()}renderMail()});
$('#reader').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const x=box().find(m=>m.id===selId);if(!x)return;
 if(b.dataset.att)return openFile(b.dataset.att);
 const a=b.dataset.a;
 if(a==='reply')compose({to:x.folder==='Sent'?x.to:x.from,subject:/^re:/i.test(x.subject)?x.subject:'Re: '+x.subject,body:'\n\n--- On '+new Date(x.date).toLocaleString('en-AU')+' '+(x.fromName||x.from)+' wrote:\n'+x.body});
 if(a==='fwd')compose({subject:'Fwd: '+x.subject,body:'\n\n--- Forwarded message from '+(x.fromName||x.from)+':\n'+x.body,att:x.att});
 if(a==='edit'){compose({to:x.to,cc:x.cc,subject:x.subject,body:x.body,att:x.att,draftId:x.id});return}
 if(a==='star')x.starred=!x.starred;
 if(a==='unread'){x.read=false;selId=null}
 if(a==='archive'){x.folder='Archive';toast('Archived')}
 if(a==='del'){x.prev=x.folder;x.folder='Trash';selId=null;toast('Moved to Trash')}
 if(a==='restore'){x.folder=x.prev||'Inbox';toast('Restored')}
 if(a==='purge'){const u=me().user;S.mail[u]=box().filter(m=>m.id!==x.id);selId=null;toast('Deleted forever')}
 if(a==='print'){window.print();return}
 if(a==='speak'){speak(x.subject+'. '+x.body);return}
 save();renderMail()});
$('#reader').addEventListener('change',e=>{const x=box().find(m=>m.id===selId);if(!x)return;
 if(e.target.id==='moveSel'&&e.target.value){x.folder=e.target.value;toast('Moved to '+x.folder)}
 if(e.target.id==='labSel'&&e.target.value){const l=e.target.value;x.labels=x.labels.includes(l)?x.labels.filter(z=>z!==l):x.labels.concat(l)}
 save();renderMail()});
$('#q').addEventListener('input',e=>{q=e.target.value.trim();renderMail()});
$('#sortSel').addEventListener('change',e=>{S.settings.sort=e.target.value;save();renderMail()});
$('#composeBtn').onclick=()=>compose({});
function receive(){const a0=me();if(!a0)return;const fresh=load();fresh.cur=S.cur;const was=new Set(box().map(m=>m.id));S=fresh;const a=me()||a0;
 const since=a.lastCheck||0;const inb=box().filter(m=>m.folder==='Inbox'&&m.from!==a.user+'@coffeebreak');
 const n=inb.filter(m=>!was.has(m.id)||(m.date>since&&!m.read&&since)).length;a.lastCheck=Date.now();save();
 folder='Inbox';labelF=null;q='';$('#q').value='';renderMail();
 const unread=inb.filter(m=>!m.read).length;
 const t=n?n+' new email'+(n>1?'s':'')+' in your Inbox':'No new mail right now. '+(unread?unread+' unread in your Inbox.':'You are all caught up.');
 $('#recvMsg').textContent=t;toast(t);clearTimeout(receive.t);receive.t=setTimeout(()=>$('#recvMsg').textContent='',9000);return n}
/* ---------- OUTSIDE MAIL (linked Coffeebreak Mail address online) ---------- */
const LIVE='https://cbmail-live.'+'coffee'+'breaks.workers.dev/api';
const liveTok=()=>S.settings.liveTok||'';
async function liveApi(path,opt={}){let r;try{r=await fetch(LIVE+path,{method:opt.method||'GET',headers:{'content-type':'application/json',...(liveTok()?{authorization:'Bearer '+liveTok()}:{})},body:opt.body?JSON.stringify(opt.body):undefined})}catch(e){throw new Error('Could not reach Coffeebreak Mail online. Check your internet.')}let j={};try{j=await r.json()}catch(e){}if(r.status===401&&path!=='/login'){S.settings.liveTok='';S.settings.liveAddr='';save();renderLive()}if(!r.ok&&!j.results)throw new Error(j.error||'Coffeebreak Mail online did not answer.');return j}
function renderLive(){const el=$('#liveBox');if(!el)return;
 if(liveTok()){el.innerHTML='<b>Outside mail is on.</b> Mail from Gmail, Outlook and others to <b>'+esc(S.settings.liveAddr||'')+'</b> arrives here when you tap Receive, and emails you send to outside addresses go out from it. <button class="ghost" id="liveOff">Unlink</button>';$('#liveOff').onclick=()=>{S.settings.liveTok='';S.settings.liveAddr='';save();renderLive()}}
 else{el.innerHTML='<b>Get mail from Gmail, Outlook and others:</b> link your free Coffeebreak Mail address.<div class="row" style="align-items:end"><div><label for="liveH">Handle</label><input id="liveH" autocomplete="username" placeholder="yourname"></div><div><label for="liveP">Password</label><input id="liveP" type="password" autocomplete="current-password"></div><div><button id="liveGo">Link</button></div></div><div id="liveMsg" class="muted"></div>';
  $('#liveGo').onclick=async()=>{const m=$('#liveMsg'),b=$('#liveGo');b.disabled=true;m.textContent='One moment';try{const j=await liveApi('/login',{method:'POST',body:{handle:$('#liveH').value,password:$('#liveP').value}});S.settings.liveTok=j.token;S.settings.liveAddr=j.address;save();renderLive();pullLive(true)}catch(e){m.textContent=e.message}finally{b.disabled=false}}}}
async function pullLive(show){if(!liveTok()||!me())return 0;try{const j=await liveApi('/mail?since=0');const seen=new Set(S.settings.liveSeen||[]);let n=0;
 (j.mail||[]).filter(m=>m.folder==='Inbox'&&!seen.has(m.id)).forEach(m=>{seen.add(m.id);box().push({id:uid(),liveId:m.id,from:m.from||'',fromName:m.fromName||'',to:m.to||'',cc:m.cc||'',subject:m.subject||'(no subject)',body:m.body||'',date:Date.parse(m.date)||m.received||Date.now(),folder:'Inbox',read:false,starred:false,labels:[],att:[],outside:true});n++});
 S.settings.liveSeen=[...seen].slice(-2000);save();if(n&&view==='mail')renderMail();
 if(show||n){const t=n?n+' new outside email'+(n>1?'s':'')+' in your Inbox':'No new outside mail right now.';$('#recvMsg').textContent=t;toast(t)}return n}catch(e){if(show)$('#recvMsg').textContent=e.message;return 0}}
async function sendLive(outs,m,sent){try{const j=await liveApi('/send',{method:'POST',body:{to:outs.join(', '),subject:m.subject,text:m.body}});const ok=(j.results||[]).filter(r=>r.ok).length;
 if(sent){sent.outside=!ok;sent.results=j.results;save()}toast(ok?'Sent to '+ok+' outside address'+(ok>1?'es':''):'Not sent: '+(((j.results||[])[0]||{}).error||'please try again'))}catch(e){toast(e.message)}}
setInterval(()=>{if(liveTok()&&view==='mail'&&!document.hidden)pullLive(false)},120000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&liveTok())pullLive(false)});
$('#receiveBtn').onclick=()=>{const b=$('#receiveBtn');b.disabled=true;$('#recvMsg').textContent='Checking for new mail';setTimeout(async()=>{receive();if(liveTok())await pullLive(true);b.disabled=false},350)};
addEventListener('storage',e=>{if(e.key===KEY&&view==='mail'){const a=me();if(!a)return;const fresh=load();const cnt=((fresh.mail[a.user]||[]).length)-box().length;if(cnt>0)$('#recvMsg').textContent='New mail is waiting. Tap Receive to see it.'}});
function speak(t){if(!('speechSynthesis'in window))return toast('Read aloud is not available in this browser.');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='en-AU';speechSynthesis.speak(u)}

/* ---------- COMPOSE ---------- */
let cState={};
function compose(o){if(!me())return go('signup');cState={att:(o.att||[]).slice(),draftId:o.draftId||null,sticker:''};
 $('#cTitle').textContent=o.draftId?'Edit draft':'Write email';$('#cTo').value=o.to||'';$('#cCc').value=o.cc||'';$('#cSubj').value=o.subject||'';$('#cBody').value=o.body||'';
 $('#cTpl').innerHTML='<option value="">No template</option>'+S.templates.map((t,i)=>'<option value="'+i+'">'+esc(t.name)+'</option>').join('');
 $('#cSig').innerHTML='<option value="">No signature</option>'+S.signatures.map((t,i)=>'<option value="'+i+'">'+esc(t.name)+'</option>').join('');
 $('#cLab').innerHTML='<option value="">No label</option>'+S.labels.map(l=>'<option>'+esc(l.name)+'</option>').join('');
 $('#conDl').innerHTML=S.contacts.map(c=>'<option value="'+esc(c.email)+'">'+esc(c.name)+'</option>').join('')+S.accounts.filter(a=>a.id!==S.cur).map(a=>'<option value="'+esc(a.user)+'@coffeebreak">'+esc(a.name)+'</option>').join('');
 const st=ST_FREE.concat(isPro()?ST_PRO:[]);$('#stickers').innerHTML='<b>Stickers</b> '+st.map(s=>'<button type="button" data-s="'+s+'">'+s+'</button>').join('')+'';
 renderAtt();cCount();$('#composeM').classList.add('on');$('#cTo').focus()}
function renderAtt(){$('#cAtt').innerHTML=cState.att.length?'Attached: '+cState.att.map(a=>'📎 '+esc(a.name)+' ('+fmtB(a.size)+')').join(', '):''}
function cCount(){const v=$('#cBody').value;$('#cCount').textContent=(v.match(/\S+/g)||[]).length+' words, '+v.length+' characters'}
$('#cBody').addEventListener('input',cCount);
$('#cTpl').onchange=e=>{const t=S.templates[e.target.value];if(t){if(!$('#cSubj').value)$('#cSubj').value=t.subj;$('#cBody').value=t.body+$('#cBody').value;cCount()}};
$('#cSig').onchange=e=>{const t=S.signatures[e.target.value];if(t){$('#cBody').value=$('#cBody').value.replace(/\s*$/,'')+'\n\n'+t.text.replace(/\{name\}/g,me().name);cCount()}};
$('#stickers').addEventListener('click',e=>{const b=e.target.closest('button[data-s]');if(!b)return;const ta=$('#cBody'),p=ta.selectionStart||ta.value.length;ta.value=ta.value.slice(0,p)+b.dataset.s+ta.value.slice(p);cState.sticker=cState.sticker||b.dataset.s;cCount()});
$('#cClose').onclick=()=>$('#composeM').classList.remove('on');
$('#cSpeak').onclick=()=>speak($('#cBody').value);
$('#cAttach').onclick=async()=>{const fs=await dbAll();if(!fs.length)return toast('Your Drive is empty. Add files in the Drive tab first.');gen('<h2>Attach from Drive</h2>'+fs.map(f=>'<button class="ghost" data-id="'+f.id+'">'+esc(f.name)+' ('+fmtB(f.size)+')</button>').join(''));$('#genBody').onclick=e=>{const b=e.target.closest('button[data-id]');if(!b)return;const f=fs.find(z=>z.id===b.dataset.id);if(!cState.att.some(a=>a.id===f.id))cState.att.push({id:f.id,name:f.name,size:f.size});renderAtt();closeGen()}};
function readMsg(){return{to:$('#cTo').value.trim(),cc:$('#cCc').value.trim(),subject:$('#cSubj').value.trim(),body:$('#cBody').value,label:$('#cLab').value}}
$('#cDraft').onclick=()=>{const m=readMsg(),a=me();let x=cState.draftId&&box().find(z=>z.id===cState.draftId);if(!x){x={id:uid(),from:a.user+'@coffeebreak',fromName:a.name,folder:'Drafts',read:true,starred:false,labels:[],att:[]};box().push(x);cState.draftId=x.id}
 Object.assign(x,{to:m.to,cc:m.cc,subject:m.subject,body:m.body,date:Date.now(),att:cState.att,labels:m.label?[m.label]:x.labels,sticker:cState.sticker});save();toast('Draft saved');if(view==='mail')renderMail()};
$('#cSend').onclick=()=>{const m=readMsg(),a=me();const rc=(m.to+','+m.cc).split(/[,;]/).map(s=>s.trim().toLowerCase()).filter(Boolean);
 if(!rc.length)return toast('Add who the email is to.');
 const bad=rc.filter(r=>!/^[a-z0-9._-]{3,20}(@coffeebreak)?$/.test(r)&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r));if(bad.length)return toast('Check this address: '+bad[0]);
 let local=0,outside=0,outs=[];
 rc.forEach(r=>{const h=r.replace(/@coffeebreak$/,'');const acc=!r.includes('@')||r.endsWith('@coffeebreak')?S.accounts.find(z=>z.user===h):null;
  if(acc){(S.mail[acc.user]=S.mail[acc.user]||[]).push({id:uid(),from:a.user+'@coffeebreak',fromName:a.name,to:m.to,cc:m.cc,subject:m.subject,body:m.body,date:Date.now(),folder:'Inbox',read:false,starred:false,labels:[],att:cState.att,sticker:cState.sticker});local++}else{outside++;outs.push(r)}});
 if(cState.draftId){S.mail[a.user]=box().filter(z=>z.id!==cState.draftId)}
 box().push({id:uid(),from:a.user+'@coffeebreak',fromName:a.name,to:m.to,cc:m.cc,subject:m.subject,body:m.body,date:Date.now(),folder:'Sent',read:true,starred:false,labels:m.label?[m.label]:[],att:cState.att,sticker:cState.sticker,outside:outside>0});
 save();$('#composeM').classList.remove('on');
 toast(local?'Delivered to '+local+' Coffeebreak Mail account'+(local>1?'s':'')+(outside&&!liveTok()?'. Link your Coffeebreak Mail address on the Mail screen to send to outside addresses.':''):(liveTok()?'Sending':'Saved in Sent. Link your Coffeebreak Mail address on the Mail screen to send to outside addresses.'));if(view==='mail')renderMail();if(outs.length&&liveTok())sendLive(outs,m,box()[box().length-1])};

/* ---------- DRIVE (IndexedDB) ---------- */
let DB=null;
function db(){return DB?Promise.resolve(DB):new Promise((res,rej)=>{const r=indexedDB.open('cbdrive',1);r.onupgradeneeded=()=>{const s=r.result.createObjectStore('files',{keyPath:'id'});s.createIndex('owner','owner')};r.onsuccess=()=>{DB=r.result;res(DB)};r.onerror=()=>rej(r.error)})}
async function dbAll(){const a=me();if(!a)return[];const d=await db();return new Promise(res=>{const out=[];d.transaction('files').objectStore('files').index('owner').openCursor(IDBKeyRange.only(a.user)).onsuccess=e=>{const c=e.target.result;if(c){out.push(c.value);c.continue()}else res(out)}})}
async function dbPut(r){const d=await db();return new Promise((res,rej)=>{const t=d.transaction('files','readwrite');t.objectStore('files').put(r);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
async function dbGet(id){const d=await db();return new Promise(res=>{d.transaction('files').objectStore('files').get(id).onsuccess=e=>res(e.target.result)})}
async function dbDel(id){const d=await db();return new Promise(res=>{const t=d.transaction('files','readwrite');t.objectStore('files').delete(id);t.oncomplete=res})}
const icon=t=>t.startsWith('image')?'🖼️':t.startsWith('video')?'🎬':t.startsWith('audio')?'🎵':t.includes('pdf')?'📕':t.includes('zip')||t.includes('compressed')?'🗜️':t.startsWith('text')?'📝':'📄';
function dFolders(){const u=me().user;return S.driveFolders[u]||(S.driveFolders[u]=['My files'])}
async function renderDrive(){const fs=await dbAll();const used=fs.reduce((a,f)=>a+f.size,0),Q=quota();
 $('#qbar').style.width=Math.min(100,used/Q*100)+'%';
 $('#qtext').innerHTML='<b>'+fmtB(used)+'</b> used of <b>'+(Q/GB)+' GB</b> ('+(used/Q*100).toFixed(used/Q<0.01?3:1)+'%) · '+fs.length+' file'+(fs.length===1?'':'s')+' · Every feature included';
 if(navigator.storage&&navigator.storage.estimate)navigator.storage.estimate().then(e=>{$('#devStore').textContent='This device lets the browser use about '+fmtB(e.quota||0)+' in total. Coffeebreak Drive cannot store more than your device allows.'});
 const sel=$('#dfolder'),cur=sel.value;sel.innerHTML='<option value="">All folders</option>'+dFolders().map(f=>'<option'+(f===cur?' selected':'')+'>'+esc(f)+'</option>').join('');
 const k=$('#dq').value.toLowerCase(),ty=$('#dtype').value,fo=sel.value;
 const list=fs.filter(f=>(!k||f.name.toLowerCase().includes(k))&&(!ty||(f.type||'application').startsWith(ty))&&(!fo||f.folder===fo)).sort((a,b)=>b.created-a.created);
 $('#files').innerHTML=list.length?list.map(f=>'<div class="file" data-id="'+f.id+'"><div class="ic">'+icon(f.type||'')+'</div><b>'+esc(f.name)+'</b><div class="muted">'+fmtB(f.size)+' · '+esc(f.folder)+' · '+new Date(f.created).toLocaleDateString('en-AU')+(f.shareId?' · shared':'')+'</div><button data-a="open">Open</button><button data-a="dl" class="alt">Download</button><button data-a="share" class="alt">Share</button><button data-a="ren" class="ghost">Rename</button><button data-a="mv" class="ghost">Move</button><button data-a="del" class="ghost">Delete</button></div>').join(''):'<div class="card"><p class="muted">No files yet. Drop some in above.</p></div>';}
async function addFiles(list){const a=me();if(!a)return;const fs=await dbAll();let used=fs.reduce((s,f)=>s+f.size,0),n=0;const fo=$('#dfolder').value||'My files';
 for(const f of list){if(used+f.size>quota()){toast(f.name+' would go over your '+(quota()/GB)+' GB space.');continue}
  try{await dbPut({id:uid(),owner:a.user,name:f.name,type:f.type||'application/octet-stream',size:f.size,blob:f,created:Date.now(),folder:fo,shareId:null});used+=f.size;n++}catch(e){toast('Could not save '+f.name+'. Your device may be out of space.')}}
 if(n)toast('Saved '+n+' file'+(n>1?'s':'')+' to Coffeebreak Drive');renderDrive()}
$('#pickBtn').onclick=()=>$('#fileIn').click();
$('#fileIn').onchange=e=>{addFiles([...e.target.files]);e.target.value=''};
const dz=$('#drop');['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('over')}));['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('over')}));dz.addEventListener('drop',e=>addFiles([...e.dataTransfer.files]));
['dq','dtype','dfolder'].forEach(id=>$('#'+id).addEventListener(id==='dq'?'input':'change',renderDrive));
$('#newFolder').onclick=()=>{const n=prompt('Folder name');if(n&&n.trim()&&!dFolders().includes(n.trim())){dFolders().push(n.trim());save();renderDrive()}};
async function openFile(id){const f=await dbGet(id);if(!f)return toast('That file is not on this device.');const url=URL.createObjectURL(f.blob);let h='<h2>'+esc(f.name)+'</h2><p class="muted">'+fmtB(f.size)+' · '+esc(f.type)+'</p><div id="preview">';
 if(f.type.startsWith('image'))h+='<img src="'+url+'" alt="'+esc(f.name)+'">';else if(f.type.startsWith('video'))h+='<video src="'+url+'" controls></video>';else if(f.type.startsWith('audio'))h+='<audio src="'+url+'" controls style="width:100%"></audio>';
 else if(f.type.startsWith('text')||/\.(txt|csv|md|json|html?)$/i.test(f.name)){const t=await f.blob.text();h+='<pre>'+esc(t.slice(0,20000))+'</pre>'}else if(f.type.includes('pdf'))h+='<iframe src="'+url+'" style="width:100%;height:60vh;border:0"></iframe>';else h+='<p>No preview for this type. Download it to open.</p>';
 h+='</div><a class="btn" href="'+url+'" download="'+esc(f.name)+'">Download</a>';gen(h)}
$('#files').addEventListener('click',async e=>{const b=e.target.closest('button[data-a]');if(!b)return;const id=b.closest('.file').dataset.id,f=await dbGet(id),a=b.dataset.a;
 if(a==='open')openFile(id);
 if(a==='dl'){const u=URL.createObjectURL(f.blob),l=document.createElement('a');l.href=u;l.download=f.name;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
 if(a==='ren'){const n=prompt('New name',f.name);if(n&&n.trim()){f.name=n.trim();await dbPut(f);renderDrive()}}
 if(a==='mv'){const n=prompt('Move to folder: '+dFolders().join(', '),f.folder);if(n&&dFolders().includes(n.trim())){f.folder=n.trim();await dbPut(f);renderDrive()}else if(n)toast('Make that folder first with New folder.')}
 if(a==='del'){if(confirm('Delete '+f.name+'')){await dbDel(id);toast('Deleted');renderDrive()}}
 if(a==='share'){if(!f.shareId){f.shareId=uid();await dbPut(f)}const link=location.href.split('#')[0]+'#share='+f.shareId;
  gen('<h2>Share '+esc(f.name)+'</h2><label for="shareLink">Share link</label><input id="shareLink" readonly value="'+esc(link)+'"><button id="shCopy">Copy link</button>'+(navigator.canShare?'<button class="alt" id="shNative">Share the file to an app</button>':'')+'<button class="ghost" id="shStop">Stop sharing</button><div class="note">This share link opens the file in Coffeebreak Mail on this device. Links that work for anyone, anywhere, come with the Coffeebreak Mail server. To send the file to someone now, use Share the file to an app or Download it.</div>');
  $('#shCopy').onclick=()=>copy(link);const sn=$('#shNative');if(sn)sn.onclick=async()=>{const file=new File([f.blob],f.name,{type:f.type});if(navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:f.name})}catch(e){}}else toast('This device cannot share this file type.')};
  $('#shStop').onclick=async()=>{f.shareId=null;await dbPut(f);closeGen();renderDrive();toast('Sharing stopped')};renderDrive()}});
async function checkShare(){const m=location.hash.match(/share=([\w]+)/);if(!m)return;const d=await db();d.transaction('files').objectStore('files').openCursor().onsuccess=e=>{const c=e.target.result;if(!c)return toast('That shared file is not on this device.');if(c.value.shareId===m[1])openFile(c.value.id);else c.continue()}}

/* ---------- MUSIC ---------- */
const SONGS=[['Coffee Break','coffee-break'],['Coffee Break Ride','coffee-break-ride'],['Sweet Juices Cotton Candy','sweet-juices-cotton-candy'],['Cinnamon Candy','cinnamon-candy'],['Sugar Coated Fever','sugar-coated-fever'],['Drip Drip Drip Country','drip-drip-drip-country'],['Fussell St','fussell-st'],['Thunder In My Hands','thunder-in-my-hands'],['Restless Engine','restless-engine'],['Talk Is Cheap','talk-is-cheap'],['Kicking Marshmallows Up The Mud','kicking-marshmallows-up-the-mud'],['A Delicious Disaster','a-delicious-disaster']].map(([t,f])=>({t,src:'assets/music/'+f+'.mp3'}));
let playlist=SONGS.slice(),ti=-1,shuf=false,rep=false,actx=null,an=null;const au=$('#audio');
function renderMusic(){$('#tracks').innerHTML=playlist.map((s,i)=>'<div class="t'+(i===ti?' on':'')+'" data-i="'+i+'"><span>'+(i===ti?'▶ ':'')+esc(s.t)+'</span><span class="muted">'+(s.mine?'My song':'Coffeebreak')+'</span></div>').join('')}
function playT(i){if(!playlist.length)return;ti=(i+playlist.length)%playlist.length;au.src=playlist[ti].src;au.play().catch(e=>{if(e&&e.name!=='AbortError')toast('Tap Play to start the song')});$('#nowT').textContent='Now playing: '+playlist[ti].t;renderMusic();viz()}
$('#tracks').addEventListener('click',e=>{const t=e.target.closest('.t');if(t)playT(+t.dataset.i)});
$('#mPlay').onclick=()=>{if(ti<0)return playT(0);au.paused?au.play():au.pause()};
au.addEventListener('play',()=>$('#mPlay').textContent='Pause');au.addEventListener('pause',()=>$('#mPlay').textContent='Play');
$('#mNext').onclick=()=>playT(shuf?Math.floor(Math.random()*playlist.length):ti+1);$('#mPrev').onclick=()=>playT(ti-1);
au.addEventListener('error',()=>{if(au.src)toast('That song could not be loaded. Try the next one.')});au.addEventListener('ended',()=>rep?playT(ti):$('#mNext').onclick());
$('#mShuf').onclick=()=>{shuf=!shuf;$('#mShuf').textContent='Shuffle '+(shuf?'on':'off')};$('#mRep').onclick=()=>{rep=!rep;$('#mRep').textContent='Repeat '+(rep?'on':'off')};
$('#mVol').oninput=e=>au.volume=+e.target.value;au.volume=0.8;
$('#mDrive').onclick=async()=>{const fs=(await dbAll()).filter(f=>f.type.startsWith('audio'));if(!fs.length)return toast('No songs in your Drive yet.');let n=0;fs.forEach(f=>{if(!playlist.some(p=>p.id===f.id)){playlist.push({t:f.name.replace(/\.[^.]+$/,''),src:URL.createObjectURL(f.blob),mine:true,id:f.id});n++}});renderMusic();toast('Added '+n+' song'+(n===1?'':'s')+' from Drive')};
function viz(){const c=$('#viz'),g=c.getContext('2d');const webOK=/^https?:$/.test(location.protocol);try{if(webOK&&!actx){actx=new (window.AudioContext||window.webkitAudioContext)();const src=actx.createMediaElementSource(au);an=actx.createAnalyser();an.fftSize=128;src.connect(an);an.connect(actx.destination)}if(actx.state==='suspended')actx.resume()}catch(e){}
 if(viz.on)return;viz.on=true;const d=new Uint8Array(64);(function f(){requestAnimationFrame(f);if(view!=='music')return;const W=c.width,H=c.height;g.clearRect(0,0,W,H);if(an)an.getByteFrequencyData(d);const st=getComputedStyle(document.body).getPropertyValue('--p').trim()||'#ff2e93';for(let i=0;i<64;i++){const v=an&&!au.paused?d[i]/255:!au.paused?0.35+0.3*Math.abs(Math.sin(Date.now()/180+i*0.7))*Math.abs(Math.cos(Date.now()/410+i*0.3)):0.08+0.04*Math.sin(Date.now()/300+i);g.fillStyle=st;g.globalAlpha=.4+v*.6;const h=Math.max(4,v*H);g.fillRect(i*(W/64)+2,H-h,W/64-4,h)}g.globalAlpha=1})()}

/* ---------- MOVIES ---------- */
const MOVIES=[['Newcastle Sunset','v18-newcastle-sunset'],['On the Mic','v05-singing'],['Karaoke Night','v20-karaoke'],['Barista Break','v07-barista'],['Guitar Time','v21-guitar'],['Dance Party','v11-dancing']].map(([t,f])=>({t,src:'assets/movies/'+f+'.mp4',poster:'assets/movies/'+f+'.jpg'}));
let movies=MOVIES.slice();const mv=$('#movie');
function renderMovies(){$('#posters').innerHTML=movies.map((m,i)=>'<div class="poster" data-i="'+i+'">'+(m.poster?'<img src="'+m.poster+'" alt="'+esc(m.t)+'" loading="lazy">':'<div style="font-size:60px;text-align:center;padding:30px">🎬</div>')+'<div>'+esc(m.t)+(m.mine?' · mine':'')+'</div></div>').join('')}
$('#posters').addEventListener('click',e=>{const p=e.target.closest('.poster');if(!p)return;const m=movies[+p.dataset.i];mv.src=m.src;if(m.poster)mv.poster=m.poster;mv.playbackRate=+$('#movSpeed').value;mv.play().catch(()=>{});$('#movT').textContent='Now showing: '+m.t;window.scrollTo({top:0,behavior:'smooth'})});
$('#movSpeed').onchange=e=>mv.playbackRate=+e.target.value;
$('#movPip').onclick=async()=>{try{if(document.pictureInPictureElement)await document.exitPictureInPicture();else await mv.requestPictureInPicture()}catch(e){toast('Picture in picture needs a movie playing and a browser that supports it.')}};
$('#movFull').onclick=()=>{(mv.requestFullscreen||mv.webkitEnterFullscreen||function(){}).call(mv)};
$('#movDrive').onclick=async()=>{const fs=(await dbAll()).filter(f=>f.type.startsWith('video'));if(!fs.length)return toast('No videos in your Drive yet.');fs.forEach(f=>{if(!movies.some(m=>m.id===f.id))movies.push({t:f.name.replace(/\.[^.]+$/,''),src:URL.createObjectURL(f.blob),mine:true,id:f.id})});renderMovies();toast('Added your videos from Drive')};

/* ---------- VR LOUNGE ---------- */
const VR={on:false,ready:false,pause(){if(VR.vid)VR.vid.pause()}};
function initVR(){if(!isPro())return;if(VR.ready){VR.on=true;if(VR.vid)VR.vid.play().catch(()=>{});return}
 const boxEl=$('#vrbox');if(!window.THREE){boxEl.innerHTML='<p style="color:#fff;padding:20px">3D is loading.</p>';const s=document.createElement('script');s.src='assets/three.min.js';s.onload=initVR;s.onerror=()=>boxEl.innerHTML='<p style="color:#fff;padding:20px">The 3D lounge could not load on this device.</p>';document.head.appendChild(s);return}
 const T=window.THREE;let R;try{R=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true})}catch(e){boxEl.innerHTML='<p style="color:#fff;padding:20px">This device does not support 3D graphics, so the lounge cannot open here.</p>';return}
 boxEl.innerHTML='';VR.ready=true;VR.on=true;VR.R=R;R.setPixelRatio(Math.min(2,devicePixelRatio));R.xr.enabled=true;boxEl.appendChild(R.domElement);
 const sc=new T.Scene();sc.background=new T.Color(0x3a0a2c);sc.fog=new T.Fog(0x3a0a2c,8,26);
 const cam=new T.PerspectiveCamera(70,1,0.1,100);cam.position.set(0,1.6,4);
 const rig=new T.Group();rig.add(cam);sc.add(rig);
 sc.add(new T.HemisphereLight(0xffd0ea,0x401030,1.1));const pl=new T.PointLight(0xff4fb0,1.4,30);pl.position.set(0,5,0);sc.add(pl);
 const floor=new T.Mesh(new T.CircleGeometry(12,64),new T.MeshStandardMaterial({color:0xff7ac0,roughness:.7}));floor.rotation.x=-Math.PI/2;sc.add(floor);
 const ring=new T.Mesh(new T.TorusGeometry(12,.15,8,96),new T.MeshStandardMaterial({color:0xffffff,emissive:0xff2e93}));ring.rotation.x=Math.PI/2;ring.position.y=.05;sc.add(ring);
 const wall=new T.Mesh(new T.CylinderGeometry(12,12,8,64,1,true),new T.MeshStandardMaterial({color:0x8a1e64,side:T.BackSide}));wall.position.y=4;sc.add(wall);
 const vid=document.createElement('video');vid.src=MOVIES[0].src;vid.loop=true;vid.muted=true;vid.playsInline=true;vid.crossOrigin='anonymous';vid.play().catch(()=>{});VR.vid=vid;VR.mi=0;
 const vt=new T.VideoTexture(vid);const screen=new T.Mesh(new T.PlaneGeometry(2.7,4.8),new T.MeshBasicMaterial({map:vt}));screen.position.set(0,2.9,-6);sc.add(screen);
 const frame=new T.Mesh(new T.BoxGeometry(2.95,5.05,.1),new T.MeshStandardMaterial({color:0xffffff,emissive:0xff2e93,emissiveIntensity:.5}));frame.position.set(0,2.9,-6.08);sc.add(frame);
 const sofa=new T.Mesh(new T.BoxGeometry(3,.5,1),new T.MeshStandardMaterial({color:0xff2e93}));sofa.position.set(0,.25,1.5);sc.add(sofa);const back=new T.Mesh(new T.BoxGeometry(3,.8,.25),new T.MeshStandardMaterial({color:0xe0007a}));back.position.set(0,.8,2);sc.add(back);
 const floaters=[];for(let i=0;i<14;i++){const g=new T.Group();const cup=new T.Mesh(new T.CylinderGeometry(.18,.13,.3,20),new T.MeshStandardMaterial({color:i%2?0xffffff:0xffb3d6}));const h=new T.Mesh(new T.TorusGeometry(.08,.025,8,16),cup.material);h.position.x=.2;g.add(cup,h);const a=i/14*Math.PI*2;g.position.set(Math.cos(a)*6,1.5+Math.random()*3,Math.sin(a)*6);g.userData={a,s:.2+Math.random()*.3,y:g.position.y};sc.add(g);floaters.push(g)}
 const hearts=[];const hs=new T.Shape();hs.moveTo(0,.25);hs.bezierCurveTo(0,.3,-.05,.4,-.2,.4);hs.bezierCurveTo(-.45,.4,-.45,.1,-.45,.1);hs.bezierCurveTo(-.45,-.05,-.3,-.22,0,-.4);hs.bezierCurveTo(.3,-.22,.45,-.05,.45,.1);hs.bezierCurveTo(.45,.1,.45,.4,.2,.4);hs.bezierCurveTo(.05,.4,0,.3,0,.25);
 const hg=new T.ExtrudeGeometry(hs,{depth:.1,bevelEnabled:false});for(let i=0;i<10;i++){const m=new T.Mesh(hg,new T.MeshStandardMaterial({color:0xff2e93,emissive:0x660033}));m.position.set((Math.random()-.5)*10,Math.random()*6,-3-Math.random()*5);m.scale.setScalar(.5+Math.random()*.6);sc.add(m);hearts.push(m)}
 let yaw=0,pitch=0,dist=4,drag=null;const el=R.domElement;
 el.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};el.setPointerCapture(e.pointerId)});el.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag.x)*.005;pitch=Math.max(-.6,Math.min(.6,pitch-(e.clientY-drag.y)*.004));drag={x:e.clientX,y:e.clientY}});el.addEventListener('pointerup',()=>drag=null);
 el.addEventListener('wheel',e=>{e.preventDefault();dist=Math.max(1,Math.min(9,dist+e.deltaY*.005))},{passive:false});
 function size(){const w=boxEl.clientWidth||800,h=boxEl.clientHeight||450;R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}size();addEventListener('resize',size);VR.size=size;
 R.setAnimationLoop(t=>{if(!VR.on&&!R.xr.isPresenting)return;if(S.settings.spin&&!drag&&!R.xr.isPresenting)yaw+=.0015;
  if(!R.xr.isPresenting){cam.position.set(Math.sin(yaw)*dist,1.6+Math.sin(pitch)*2,Math.cos(yaw)*dist);cam.lookAt(0,2,-2)}
  floaters.forEach(g=>{g.userData.a+=.002*g.userData.s;g.position.x=Math.cos(g.userData.a)*6;g.position.z=Math.sin(g.userData.a)*6;g.position.y=g.userData.y+Math.sin(t/900+g.userData.a*5)*.3;g.rotation.y+=.01});
  hearts.forEach((m,i)=>{m.position.y+=.004+i*.0003;m.rotation.y+=.01;if(m.position.y>7)m.position.y=0});ring.material.emissiveIntensity=.6+.4*Math.sin(t/400);R.render(sc,cam)});
 VR.scene=sc;
 if(navigator.xr&&navigator.xr.isSessionSupported){navigator.xr.isSessionSupported('immersive-vr').then(ok=>{VR.xrOk=ok;$('#vrEnter').disabled=!ok;$('#vrNote').textContent=ok?'A VR headset is ready. Tap Enter VR, or drag to look around.':'No VR headset found, so you are in the 3D view. Drag to look around and use the wheel to move closer.'}).catch(()=>noXR())}else noXR();
 function noXR(){VR.xrOk=false;$('#vrEnter').disabled=true;$('#vrNote').textContent='No VR headset found, so you are in the 3D view. Drag to look around and use the wheel to move closer.'}}
$('#vrEnter').onclick=async()=>{if(!VR.xrOk)return toast('No VR headset found on this device.');try{const s=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor']});VR.R.xr.setSession(s)}catch(e){toast('VR could not start: '+e.message)}};
$('#vrSong').onclick=()=>{go('vr');const s=SONGS[Math.floor(Math.random()*SONGS.length)];playlist=SONGS.slice();ti=SONGS.indexOf(s);au.src=s.src;au.play().catch(()=>{});toast('Playing '+s.t+' in the lounge')};
$('#vrScreen').onclick=()=>{if(!VR.vid)return;VR.mi=(VR.mi+1)%MOVIES.length;VR.vid.src=MOVIES[VR.mi].src;VR.vid.play().catch(()=>{});toast('Big screen: '+MOVIES[VR.mi].t)};
$('#vrSpin').onclick=()=>{S.settings.spin=!S.settings.spin;save();$('#vrSpin').textContent='Auto spin '+(S.settings.spin?'on':'off')};

/* ---------- TOOLS REGISTRY ---------- */
const FEAT=[
['Mail','Inbox','Read your incoming mail','mail',()=>{folder='Inbox';labelF=null}],['Mail','Write email','Compose a new message','mail',()=>compose({})],['Mail','Drafts folder','Save and finish emails later','mail',()=>{folder='Drafts';labelF=null}],['Mail','Sent folder','See what you sent','mail',()=>{folder='Sent';labelF=null}],['Mail','Starred mail','Star the important ones','mail',()=>{folder='Starred';labelF=null}],['Mail','Archive','Tidy mail away without deleting','mail',()=>{folder='Archive';labelF=null}],['Mail','Trash and restore','Delete, restore or empty trash','mail',()=>{folder='Trash';labelF=null}],
['Mail','Custom folders','Make your own folders','settings'],['Mail','Mail search','Search from, subject and words','mail',()=>setTimeout(()=>$('#q').focus(),50)],['Mail','Sort mail','Newest, oldest or A to Z','mail'],['Mail','Labels','Colour labels for your mail','settings'],['Mail','Reply and forward','Answer or pass on any email','mail'],['Mail','Mark unread','Keep an email for later','mail'],['Mail','Move to folder','File any email','mail'],
['Mail','Signatures','Save signatures to add in one tap','settings'],['Mail','Templates','Ready-made emails','settings'],['Mail','Stickers','Add cute stickers to emails','mail',()=>compose({})],['Mail','Attach from Drive','Attach your Drive files','mail',()=>compose({})],['Mail','Word counter','Live word and letter count while you write','mail',()=>compose({})],['Mail','Read aloud','Hear any email spoken','mail'],['Mail','Print email','Print a neat copy','mail'],['Mail','Contacts book','Save names and addresses','settings'],['Mail','Mailbox backup','Export and import your mailbox','settings'],
['Drive','Drive upload','Upload any file type, or drag and drop','drive'],['Drive','File preview','View photos, videos, songs, text and PDFs','drive'],['Drive','Share by link','Share links and share to apps','drive'],['Drive','Drive folders','Group your files','drive'],['Drive','Space meter','See how much space you have used','drive'],['Drive','File search and filter','Find files by name or type','drive'],
['Lounge','Music player','Karen\'s songs with shuffle and repeat','music'],['Lounge','Music visualiser','Pink bars that dance to the music','music'],['Lounge','Movie corner','Watch Coffeebreak movies','movies'],['Lounge','Picture in picture','Keep a movie floating while you work','movies'],['Lounge','VR lounge','A pink 3D lounge, in VR if you have a headset','vr'],
['Helpers','Hotspot Helper','Share your phone data and find free WiFi','hotspot'],['Helpers','Data calculator','How long your data lasts','hotspot'],['Helpers','Themes','Pink themes for every mood','settings'],['Helpers','Bigger text','Easier reading','settings'],['Helpers','Notes pad','Quick notes that save themselves','settings'],['Helpers','To-do list','Tick off your jobs','settings']];
const TOOLS=FEAT.map(f=>({cat:f[0],name:f[1],desc:f[2],view:f[3],act:f[4]})).concat(window.CB_UTIL_TOOLS);
let curTool=null;
function renderTools(){const cats=[...new Set(TOOLS.map(t=>t.cat))];const cs=$('#tcat');if(cs.options.length<2)cs.innerHTML+=cats.map(c=>'<option>'+esc(c)+'</option>').join('');
 const k=$('#tq').value.toLowerCase(),c=cs.value;let h='';cats.filter(x=>!c||x===c).forEach(cat=>{const ts=TOOLS.filter(t=>t.cat===cat&&(!k||(t.name+' '+t.desc).toLowerCase().includes(k)));if(!ts.length)return;h+='<div class="card"><h3>'+esc(cat)+' <span class="muted">('+ts.length+')</span></h3><div class="grid">'+ts.map(t=>'<button class="tool" data-i="'+TOOLS.indexOf(t)+'"><b>'+esc(t.name)+'</b><span>'+esc(t.desc)+'</span></button>').join('')+'</div></div>'});$('#toolGrid').innerHTML=h||'<div class="card"><p class="muted">No tools match.</p></div>'}
$('#tq').addEventListener('input',renderTools);$('#tcat').addEventListener('change',renderTools);
$('#toolGrid').addEventListener('click',e=>{const b=e.target.closest('.tool');if(!b)return;const t=TOOLS[+b.dataset.i];
 if(t.fn){curTool=t;$('#runner').classList.remove('hide');$('#rName').textContent=t.name;$('#rDesc').textContent=t.desc;$('#rIn').value=t.sample||'';$('#rParamBox').classList.toggle('hide',!t.param);$('#rParamLbl').textContent=t.param||'';$('#rParam').value='';$('#rOut').value='';window.scrollTo({top:0,behavior:'smooth'})}
 else{if(t.view==='mail'&&!me())return go('signup');go(t.view);if(t.act)t.act();if(t.view==='mail')renderMail()}});
function runTool(t,input,param){try{return String(t.fn(input,param))}catch(e){return 'That did not work with this text. Check the format and try again.'}}
$('#rRun').onclick=()=>{$('#rOut').value=runTool(curTool,$('#rIn').value,$('#rParam').value)};
$('#rCopy').onclick=()=>copy($('#rOut').value);$('#rClose').onclick=()=>$('#runner').classList.add('hide');
$('#rMail').onclick=()=>{if(!me())return go('signup');compose({body:$('#rOut').value||$('#rIn').value})};

/* ---------- SETTINGS ---------- */
function renderSettings(){$('#themes').innerHTML=THEMES.map(t=>{const lock=t.pro&&!isPro();return '<button class="'+(S.settings.theme===t.id?'':'ghost')+'" data-t="'+t.id+'"'+(lock?' disabled title="Pro theme"':'')+'>'+esc(t.n)+(lock?' (Pro)':'')+'</button>'}).join('');
 $('#bigText').checked=!!S.settings.big;
 $('#sigList').innerHTML=S.signatures.map((s,i)=>'<div class="pill">'+esc(s.name)+' <a href="#" data-del-sig="'+i+'">remove</a></div>').join('');
 $('#tplList').innerHTML=S.templates.map((s,i)=>'<div class="pill">'+esc(s.name)+' <a href="#" data-del-tpl="'+i+'">remove</a></div>').join('');
 $('#labList').innerHTML=S.labels.map((s,i)=>'<div class="pill"><span class="lab" style="background:'+esc(s.color)+'">&nbsp;</span>'+esc(s.name)+' <a href="#" data-del-lab="'+i+'">remove</a></div>').join('');
 $('#folList').innerHTML=S.custom.length?S.custom.map((s,i)=>'<div class="pill">'+esc(s)+' <a href="#" data-del-fol="'+i+'">remove</a></div>').join(''):'<p class="muted">No custom folders yet.</p>';
 $('#conList').innerHTML=S.contacts.map((s,i)=>'<div class="pill">'+esc(s.name)+' · '+esc(s.email)+' <a href="#" data-del-con="'+i+'">remove</a></div>').join('')||'<p class="muted">No contacts yet.</p>';
 $('#notes').value=S.notes;
 $('#todoList').innerHTML=S.todos.map((t,i)=>'<div><label style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" data-todo="'+i+'" style="width:auto"'+(t.done?' checked':'')+'><span style="'+(t.done?'text-decoration:line-through;opacity:.6':'')+'">'+esc(t.text)+'</span> <a href="#" data-del-todo="'+i+'">remove</a></label></div>').join('')}
$('#themes').addEventListener('click',e=>{const b=e.target.closest('button[data-t]');if(!b||b.disabled)return;S.settings.theme=b.dataset.t;save();renderSettings();applyTheme()});
$('#bigText').onchange=e=>{S.settings.big=e.target.checked;save();applyTheme()};
$('#v-settings').addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const d=a.dataset;let hit=true;
 if(d.delSig!=null)S.signatures.splice(+d.delSig,1);else if(d.delTpl!=null)S.templates.splice(+d.delTpl,1);else if(d.delLab!=null)S.labels.splice(+d.delLab,1);else if(d.delFol!=null){const f=S.custom.splice(+d.delFol,1)[0];Object.values(S.mail).forEach(b=>b.forEach(m=>{if(m.folder===f)m.folder='Inbox'}))}else if(d.delCon!=null)S.contacts.splice(+d.delCon,1);else if(d.delTodo!=null)S.todos.splice(+d.delTodo,1);else hit=false;
 if(hit){e.preventDefault();save();renderSettings()}});
$('#sigAdd').onclick=()=>{const n=$('#sigName').value.trim(),t=$('#sigText').value.trim();if(!n||!t)return toast('Add a name and the signature.');S.signatures.push({name:n,text:t});$('#sigName').value=$('#sigText').value='';save();renderSettings();toast('Signature saved')};
$('#tplAdd').onclick=()=>{const n=$('#tplName').value.trim();if(!n)return toast('Give the template a name.');S.templates.push({name:n,subj:$('#tplSubj').value,body:$('#tplBody').value});['tplName','tplSubj','tplBody'].forEach(i=>$('#'+i).value='');save();renderSettings();toast('Template saved')};
$('#labAdd').onclick=()=>{const n=$('#labName').value.trim();if(!n||S.labels.some(l=>l.name===n))return toast('Pick a new label name.');S.labels.push({name:n,color:$('#labColor').value});$('#labName').value='';save();renderSettings()};
$('#folAdd').onclick=()=>{const n=$('#folName').value.trim();if(!n||allFolders().includes(n))return toast('Pick a new folder name.');S.custom.push(n);$('#folName').value='';save();renderSettings();toast('Folder added')};
$('#conAdd').onclick=()=>{const n=$('#conName').value.trim(),em=$('#conEmail').value.trim();if(!n||!em)return toast('Add a name and an address.');S.contacts.push({name:n,email:em});$('#conName').value=$('#conEmail').value='';save();renderSettings()};
$('#notes').addEventListener('input',e=>{S.notes=e.target.value;save()});
$('#todoAdd').onclick=()=>{const t=$('#todoIn').value.trim();if(!t)return;S.todos.push({text:t,done:false});$('#todoIn').value='';save();renderSettings()};
$('#todoList').addEventListener('change',e=>{const i=e.target.dataset.todo;if(i!=null){S.todos[+i].done=e.target.checked;save();renderSettings()}});
$('#expBtn').onclick=()=>{const a=me();const data={app:'Coffeebreak Mail',version:3,exported:new Date().toISOString(),user:a?a.user:null,mail:a?box():[],labels:S.labels,signatures:S.signatures,templates:S.templates,contacts:S.contacts,custom:S.custom,notes:S.notes,todos:S.todos};const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,1)],{type:'application/json'}));const l=document.createElement('a');l.href=u;l.download='coffeebreak-mail-backup.json';document.body.appendChild(l);l.click();l.remove();toast('Backup saved')};
$('#impBtn').onclick=()=>$('#impIn').click();
$('#impIn').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(d.app!=='Coffeebreak Mail')throw 0;const a=me();if(a&&Array.isArray(d.mail)){const ids=new Set(box().map(m=>m.id));d.mail.forEach(m=>{if(!ids.has(m.id))box().push(m)})}
 ['labels','signatures','templates','contacts'].forEach(k=>{if(Array.isArray(d[k]))d[k].forEach(x=>{if(!S[k].some(y=>y.name===x.name&&(y.email||'')===(x.email||'')))S[k].push(x)})});if(Array.isArray(d.custom))d.custom.forEach(c=>{if(!S.custom.includes(c))S.custom.push(c)});if(d.notes&&!S.notes)S.notes=d.notes;if(Array.isArray(d.todos))S.todos=S.todos.concat(d.todos);
 save();renderSettings();toast('Backup imported')}catch(x){toast('That file is not a Coffeebreak Mail backup.')}e.target.value=''};

/* ---------- PROFILE ---------- */
function ensureAccount(){if(!S.accounts.length){let u='friend';const a={id:uid(),name:'Coffeebreak friend',user:u,contact:'',created:Date.now(),pro:'none',ref:null,auto:true};S.accounts.push(a);S.cur=a.id;seed(a);save()}else if(!me()){S.cur=S.accounts[0].id;save()}}
function renderProfile(){const a=me();if(!a)return;$('#pfName').value=a.name;$('#pfUser').value=a.user;$('#pfContact').value=a.contact||''}
$('#pfSave').onclick=async()=>{const a=me();const name=$('#pfName').value.trim(),user=$('#pfUser').value.trim().toLowerCase(),contact=$('#pfContact').value.trim();
 if(!name)return toast('Please add your name.');if(!/^[a-z0-9._-]{3,20}$/.test(user))return toast('Handles use 3 to 20 letters, numbers, dots, dashes or underscores.');
 if(user!==a.user&&S.accounts.some(x=>x.user===user))return toast('That handle is taken on this device. Try another.');
 if(contact&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact))return toast('That contact email does not look right.');
 const old=a.user;if(user!==old){S.mail[user]=(S.mail[old]||[]).map(m=>{if(m.from===old+'@coffeebreak')m.from=user+'@coffeebreak';if(m.to===old+'@coffeebreak')m.to=user+'@coffeebreak';return m});delete S.mail[old];if(S.driveFolders[old]){S.driveFolders[user]=S.driveFolders[old];delete S.driveFolders[old]}
  const fs=await dbAll();a.user=user;for(const f of fs){f.owner=user;await dbPut(f)}}
 a.name=name;a.user=user;a.contact=contact;a.auto=false;Object.values(S.mail).forEach(b=>b.forEach(m=>{if(m.from===user+'@coffeebreak')m.fromName=name}));save();render();toast('Saved. You are '+user+'@coffeebreak')};

/* ---------- ADMIN ---------- */
let adminOk=false;
function renderAdmin(){} /* no payments to confirm: every feature is included */

/* ---------- HOTSPOT ---------- */
$('#hsCalc').onclick=()=>{const gb=parseFloat($('#hsGb').value)||0,per=parseFloat($('#hsUse').value);const h=gb/per;$('#hsOut').textContent=gb+' GB lasts about '+(h>=48?Math.round(h/24)+' days of nonstop use ('+Math.round(h)+' hours)':(Math.round(h*10)/10)+' hours')+' for that activity.'};

/* ---------- HELPERS ---------- */
function copy(t){(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Copied')).catch(()=>{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('Copied')}catch(e){toast('Copy did not work here')}ta.remove()})}
function gen(h){$('#genBody').innerHTML=h;$('#genBody').onclick=null;$('#genM').classList.add('on')}
function closeGen(){$('#genM').classList.remove('on')}
$('#genClose').onclick=closeGen;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeGen();$('#composeM').classList.remove('on')}});

/* ---------- PWA ---------- */
let deferred=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('#installBtn').classList.remove('hide')});
$('#installBtn').onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;$('#installBtn').classList.add('hide')};
if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')&&!/itch\.(io|zone)$/.test(location.hostname))navigator.serviceWorker.register('sw.js').catch(()=>{});

window.CBM={go,receive,switchTo(u){const a=S.accounts.find(x=>x.user===u);if(a){S.cur=a.id;save();render()}},get S(){return S},TOOLS,codeFor,runTool,dbAll,quota,isPro,me};
ensureAccount();
render();checkShare();renderLive();if(liveTok())pullLive(false);
})();
