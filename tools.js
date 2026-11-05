/* Coffeebreak Mail utility tools. Every entry here runs for real in the browser. */
(function(){
const words=s=>(s.match(/[A-Za-z0-9'\u00C0-\u024F]+/g)||[]);
const lines=s=>s.split(/\r?\n/);
const nums=s=>(s.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);
const mapChars=(s,fn)=>Array.from(s).map(fn).join('');
const off=(c,A,a,d)=>{const n=c.codePointAt(0);if(n>=65&&n<=90)return String.fromCodePoint(A+n-65);if(n>=97&&n<=122)return String.fromCodePoint(a+n-97);if(d&&n>=48&&n<=57)return String.fromCodePoint(d+n-48);return c};
const MORSE={a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','.':'.-.-.-',',':'--..--','?':'..--..'};
const NATO='Alfa Bravo Charlie Delta Echo Foxtrot Golf Hotel India Juliett Kilo Lima Mike November Oscar Papa Quebec Romeo Sierra Tango Uniform Victor Whiskey Xray Yankee Zulu'.split(' ');
const SMALL={a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ꜰ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'ꜱ',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'};
const FLIP={a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z','.':'˙',',':"'",'?':'¿','(':')',')':'(',"'":','};
const syl=w=>{w=w.toLowerCase().replace(/[^a-z]/g,'');if(w.length<=3)return 1;w=w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/,'').replace(/^y/,'');const m=w.match(/[aeiouy]{1,2}/g);return m?m.length:1};
const rnd=n=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n};
const fmtBytes=b=>{const u=['B','KB','MB','GB','TB'];let i=0;while(b>=1024&&i<4){b/=1024;i++}return (i?b.toFixed(2):b)+' '+u[i]};
const money=n=>'$'+(Math.round(n*100)/100).toFixed(2);
const T=[];
const add=(cat,name,desc,fn,param,sample)=>T.push({cat,name,desc,fn,param:param||null,sample:sample||'Hello from Coffeebreak Mail. this is a sample line.\nSecond line here.'});
// Text tidy
add('Text tidy','UPPERCASE','Turn text into capital letters',s=>s.toUpperCase());
add('Text tidy','lowercase','Turn text into small letters',s=>s.toLowerCase());
add('Text tidy','Title Case','Capitalise Each Word',s=>s.toLowerCase().replace(/(^|[\s\-])([a-z\u00E0-\u00FF])/g,(m,a,b)=>a+b.toUpperCase()));
add('Text tidy','Sentence case','Capital letter at the start of each sentence',s=>s.toLowerCase().replace(/(^\s*|[.?]\s+)([a-z])/g,(m,a,b)=>a+b.toUpperCase()));
add('Text tidy','Remove extra spaces','Squash double spaces into one',s=>s.replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').trim());
add('Text tidy','Remove line breaks','Join all lines into one paragraph',s=>s.replace(/\s*\n\s*/g,' ').trim());
add('Text tidy','Trim each line','Remove spaces at the start and end of lines',s=>lines(s).map(l=>l.trim()).join('\n'));
add('Text tidy','Remove empty lines','Delete blank lines',s=>lines(s).filter(l=>l.trim()).join('\n'));
add('Text tidy','Calm the punctuation','Swap exclamation marks for full stops',s=>s.replace(/!+/g,'.'));
add('Text tidy','Find and replace','Replace a word everywhere. Param: find=>replace',(s,p)=>{const [f,r]=(p||'').split('=>');if(!f)return s;return s.split(f).join(r||'')},'find=>replace (example: Hello=>Hi)');
add('Text tidy','Strip HTML tags','Remove web code tags',s=>s.replace(/<[^>]*>/g,''));
add('Text tidy','Capitalise names','Fix names like mary jones',s=>s.replace(/\b([a-z])([a-z']*)/g,(m,a,b)=>a.toUpperCase()+b));
add('Text tidy','Remove duplicate words','Fix the the repeated words',s=>s.replace(/\b(\w+)(\s+\1\b)+/gi,'$1'));
// Lines and lists
add('Lines and lists','Sort lines A to Z','Alphabetical order',s=>lines(s).sort((a,b)=>a.localeCompare(b)).join('\n'));
add('Lines and lists','Sort lines Z to A','Reverse alphabetical order',s=>lines(s).sort((a,b)=>b.localeCompare(a)).join('\n'));
add('Lines and lists','Unique lines','Remove repeated lines',s=>[...new Set(lines(s))].join('\n'));
add('Lines and lists','Number the lines','Add 1. 2. 3. to each line',s=>lines(s).map((l,i)=>(i+1)+'. '+l).join('\n'));
add('Lines and lists','Bullet list','Add a bullet to each line',s=>lines(s).filter(l=>l.trim()).map(l=>'• '+l.trim()).join('\n'));
add('Lines and lists','Shuffle lines','Mix up the order of lines',s=>{const a=lines(s);for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a.join('\n')});
add('Lines and lists','Reverse line order','Last line first',s=>lines(s).reverse().join('\n'));
add('Lines and lists','Wrap text','Wrap lines at a width. Param: width',(s,p)=>{const w=parseInt(p)||60;return lines(s).map(l=>{let out=[],cur='';l.split(' ').forEach(x=>{if((cur+' '+x).trim().length>w){out.push(cur.trim());cur=x}else cur+=' '+x});out.push(cur.trim());return out.join('\n')}).join('\n')},'Width in letters (example: 60)');
add('Lines and lists','Comma list to lines','Split a comma list onto separate lines',s=>s.split(',').map(x=>x.trim()).filter(Boolean).join('\n'),null,'apples, pears, honey, coffee');
add('Lines and lists','Lines to comma list','Join lines with commas',s=>lines(s).map(x=>x.trim()).filter(Boolean).join(', '));
// Counting
add('Counting','Word count','Count the words',s=>words(s).length+' words');
add('Counting','Character count','Count letters with and without spaces',s=>Array.from(s).length+' characters, '+Array.from(s.replace(/\s/g,'')).length+' without spaces');
add('Counting','Line count','Count the lines',s=>lines(s).length+' lines');
add('Counting','Reading time','How long it takes to read',s=>{const m=words(s).length/200;return m<1?Math.max(1,Math.round(m*60))+' seconds to read':Math.round(m*10)/10+' minutes to read'});
add('Counting','Speaking time','How long it takes to say out loud',s=>{const m=words(s).length/130;return m<1?Math.max(1,Math.round(m*60))+' seconds to say':Math.round(m*10)/10+' minutes to say'});
add('Counting','Word frequency','Most used words',s=>{const c={};words(s.toLowerCase()).forEach(w=>c[w]=(c[w]||0)+1);return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([w,n])=>w+': '+n).join('\n')});
add('Counting','Longest word','Find the longest word',s=>words(s).sort((a,b)=>b.length-a.length)[0]||'');
add('Counting','Count vowels','Count a e i o u',s=>(s.match(/[aeiou]/gi)||[]).length+' vowels');
add('Counting','Text message check','Fits in a 160 letter text',s=>{const n=Array.from(s).length;return n+' of 160 letters. '+(n<=160?'Fits in one text.':'Needs '+Math.ceil(n/153)+' texts.')});
add('Counting','Social post check','Fits in a 280 letter post',s=>{const n=Array.from(s).length;return n+' of 280 letters. '+(n<=280?'Fits.':'Too long by '+(n-280)+'.')});
add('Counting','Readability score','Flesch reading ease, higher is easier',s=>{const w=words(s),se=Math.max(1,(s.match(/[.?]+/g)||[]).length);if(!w.length)return 'Add some text';const sy=w.reduce((a,x)=>a+syl(x),0);const sc=Math.round(206.835-1.015*(w.length/se)-84.6*(sy/w.length));return 'Score '+sc+'. '+(sc>=70?'Easy to read.':sc>=50?'Fairly easy to read.':'Harder to read, try shorter sentences.')});
// Fun text
add('Fun text','Bold letters','Unicode bold for posts',s=>mapChars(s,c=>off(c,0x1D5D4,0x1D5EE,0x1D7EC)));
add('Fun text','Italic letters','Unicode italic for posts',s=>mapChars(s,c=>off(c,0x1D608,0x1D622)));
add('Fun text','Bubble letters','Letters in circles',s=>mapChars(s,c=>{const n=c.codePointAt(0);if(n>=49&&n<=57)return String.fromCodePoint(0x2460+n-49);return off(c,0x24B6,0x24D0)}));
add('Fun text','Small caps','Tiny capital letters',s=>mapChars(s.toLowerCase(),c=>SMALL[c]||c));
add('Fun text','Upside down','Flip text upside down',s=>mapChars(s.toLowerCase(),c=>FLIP[c]||c).split('').reverse().join(''));
add('Fun text','Reverse text','Write it backwards',s=>Array.from(s).reverse().join(''));
add('Fun text','Sparkle text','Add sparkles between words',s=>'✨ '+s.trim().split(/\s+/).join(' ✨ ')+' ✨');
add('Fun text','Heart text','Hearts between words',s=>'💗 '+s.trim().split(/\s+/).join(' 💗 ')+' 💗');
add('Fun text','Coffee text','Coffee cups between words',s=>'☕ '+s.trim().split(/\s+/).join(' ☕ ')+' ☕');
add('Fun text','Spaced out','A d d   s p a c e s',s=>Array.from(s).join(' '));
add('Fun text','Alternating case','aLtErNaTiNg letters',s=>{let i=0;return mapChars(s,c=>/[a-z]/i.test(c)?(i++%2?c.toUpperCase():c.toLowerCase()):c)});
add('Fun text','Acronym maker','First letter of each word',s=>words(s).map(w=>w[0].toUpperCase()).join(''));
add('Fun text','Hashtag maker','Turn words into hashtags',s=>words(s).map(w=>'#'+w.toLowerCase()).join(' '));
add('Fun text','Palindrome check','Reads the same both ways',s=>{const c=s.toLowerCase().replace(/[^a-z0-9]/g,'');return c&&c===[...c].reverse().join('')?'Yes, it is a palindrome.':'No, it is not a palindrome.'},null,'Never odd or even');
// Codes
add('Codes','Morse code','Text to dots and dashes',s=>s.toLowerCase().split('').map(c=>c===' '?'/':(MORSE[c]||'')).filter(Boolean).join(' '));
add('Codes','Morse decoder','Dots and dashes back to text',s=>{const R={};for(const k in MORSE)R[MORSE[k]]=k;return s.trim().split(' ').map(x=>x==='/'?' ':(R[x]||'')).join('')},null,'.... . .-.. .-.. ---');
add('Codes','Phonetic alphabet','Spell with Alfa Bravo Charlie',s=>s.toUpperCase().split('').map(c=>c>='A'&&c<='Z'?NATO[c.charCodeAt(0)-65]:c===' '?'/':c).join(' '));
add('Codes','ROT13','Simple secret code, run again to undo',s=>s.replace(/[a-z]/gi,c=>{const b=c<='Z'?65:97;return String.fromCharCode((c.charCodeAt(0)-b+13)%26+b)}));
add('Codes','Text to binary','Ones and zeros',s=>Array.from(new TextEncoder().encode(s)).map(b=>b.toString(2).padStart(8,'0')).join(' '));
add('Codes','Binary to text','Ones and zeros back to text',s=>new TextDecoder().decode(new Uint8Array(s.trim().split(/\s+/).map(b=>parseInt(b,2)))),null,'01001000 01101001');
add('Codes','Base64 encode','Encode text as Base64',s=>btoa(String.fromCharCode(...new TextEncoder().encode(s))));
add('Codes','Base64 decode','Decode Base64 text',s=>new TextDecoder().decode(Uint8Array.from(atob(s.trim()),c=>c.charCodeAt(0))),null,'SGVsbG8gS2FyZW4=');
add('Codes','Web link encode','Make text safe for a web link',s=>encodeURIComponent(s));
add('Codes','Web link decode','Turn %20 codes back into text',s=>decodeURIComponent(s),null,'coffee%20break%20mail');
add('Codes','HTML escape','Make text safe for web pages',s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'));
add('Codes','Web address maker','Turn a title into a web address slug',s=>s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));
add('Codes','Tidy JSON','Format data neatly',s=>JSON.stringify(JSON.parse(s),null,2),null,'{"app":"Coffeebreak Mail","pink":true}');
// Finders
add('Finders','Find email addresses','Pull out every email address',s=>(s.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g)||[]).join('\n')||'None found',null,'Write to hello@example.com or shop@example.org');
add('Finders','Find web links','Pull out every link',s=>(s.match(/https?:\/\/[^\s)]+/g)||[]).join('\n')||'None found',null,'See https://coffeebreaks.itch.io for more');
add('Finders','Find phone numbers','Pull out phone numbers',s=>(s.match(/(?:\+?61|0)[\d ()-]{8,13}\d/g)||[]).join('\n')||'None found',null,'Call 0400 123 456 or 02 4900 0000');
add('Finders','Find numbers','Pull out every number',s=>nums(s).join('\n')||'None found',null,'3 coffees, 2 cakes and 12.5 dollars');
// Money and maths
add('Money and maths','Add up numbers','Total of all numbers in the text',s=>'Total: '+(Math.round(nums(s).reduce((a,b)=>a+b,0)*100)/100),null,'4.50\n5.20\n12');
add('Money and maths','Average','Average of the numbers',s=>{const n=nums(s);return n.length?'Average: '+Math.round(n.reduce((a,b)=>a+b,0)/n.length*100)/100:'No numbers'},null,'10 20 30 45');
add('Money and maths','Smallest and biggest','Lowest and highest number',s=>{const n=nums(s);return n.length?'Smallest '+Math.min(...n)+', biggest '+Math.max(...n):'No numbers'},null,'7 3 19 12');
add('Money and maths','Add GST','Add 10% Australian GST to a price',s=>{const n=nums(s)[0]||0;return money(n)+' plus GST '+money(n*0.1)+' = '+money(n*1.1)},null,'100');
add('Money and maths','Remove GST','Find the GST inside a price',s=>{const n=nums(s)[0]||0;return money(n)+' includes GST of '+money(n/11)+'. Price before GST '+money(n/1.1)},null,'110');
add('Money and maths','Percent of','Work out a percentage. Param: percent',(s,p)=>{const n=nums(s)[0]||0,pc=parseFloat(p)||10;return pc+'% of '+n+' is '+Math.round(n*pc)/100},'Percent (example: 25)','80');
add('Money and maths','Tip and split','Split a bill. Param: people',(s,p)=>{const n=nums(s)[0]||0,ppl=parseInt(p)||2;return 'Each person pays '+money(n/ppl)+' (with a 10% tip: '+money(n*1.1/ppl)+')'},'Number of people (example: 4)','120');
add('Money and maths','Unit price','Price per item or per 100 g. Format: price, amount',s=>{const n=nums(s);if(n.length<2)return 'Type price then amount, like 4.50, 500';return money(n[0]/n[1])+' each, '+money(n[0]/n[1]*100)+' per 100'},null,'4.50, 500');
add('Money and maths','Profit margin','Cost and sell price. Format: cost, price',s=>{const [c,p]=nums(s);if(!p)return 'Type cost then price, like 5, 15';return 'Profit '+money(p-c)+', margin '+Math.round((p-c)/p*100)+'%, markup '+Math.round((p-c)/c*100)+'%'},null,'5, 15');
add('Money and maths','Calculator','Work out a sum like 12*3+4',s=>{if(!/^[\d\s+\-*/().%]+$/.test(s))return 'Use numbers and + - * / ( ) only';return String(Function('"use strict";return ('+s+')')())},null,'12*3+4');
add('Money and maths','File size converter','Bytes to KB, MB and GB',s=>fmtBytes(nums(s)[0]||0),null,'10737418240');
// Makers
add('Makers','Password maker','Strong random password. Param: length',(s,p)=>{const L=Math.min(64,Math.max(8,parseInt(p)||16)),c='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%*?';let o='';for(let i=0;i<L;i++)o+=c[rnd(c.length)];return o},'Length (example: 16)');
add('Makers','ID maker','Random unique ID',()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+rnd(1e9).toString(36));
add('Makers','Random number','Pick a number. Param: highest',(s,p)=>String(1+rnd(parseInt(p)||100)),'Highest number (example: 100)');
add('Makers','Dice roll','Roll two dice',()=>{const a=1+rnd(6),b=1+rnd(6);return a+' and '+b+', total '+(a+b)});
add('Makers','Coin flip','Heads or tails',()=>rnd(2)?'Heads':'Tails');
add('Makers','Pick one','Choose a random line from your list',s=>{const l=lines(s).filter(x=>x.trim());return l.length?l[rnd(l.length)]:'Add a list'},null,'Pizza\nBurgers\nSushi');
add('Makers','Filler text','Sample text for designs. Param: sentences',(s,p)=>{const w='coffee pink sugar song music sweet bold drive lounge sunset beach candy dance guitar'.split(' ');let o=[];for(let i=0;i<(parseInt(p)||3);i++){let n=6+rnd(6),x=[];for(let j=0;j<n;j++)x.push(w[rnd(w.length)]);o.push(x.join(' ').replace(/^./,c=>c.toUpperCase())+'.')}return o.join(' ')},'Sentences (example: 3)');
add('Makers','Pink palette','Five pink colour codes from a starting colour. Param: hex colour',(s,p)=>{let h=(p||'#ff2e93').replace('#','');if(!/^[0-9a-f]{6}$/i.test(h))h='ff2e93';const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4),16);return [0.2,0.4,0.6,0.8,1].map(t=>'#'+[r,g,b].map(v=>Math.round(v+(255-v)*(1-t)).toString(16).padStart(2,'0')).join('')).join('\n')},'Hex colour (example: #ff2e93)');
add('Makers','Colour code converter','Hex to RGB or RGB to hex',s=>{const m=s.match(/#?([0-9a-f]{6})\b/i);if(m){const h=m[1];return 'rgb('+[0,2,4].map(i=>parseInt(h.substr(i,2),16)).join(', ')+')'}const n=nums(s);if(n.length>=3)return '#'+n.slice(0,3).map(v=>Math.max(0,Math.min(255,v|0)).toString(16).padStart(2,'0')).join('');return 'Type #ff2e93 or 255, 46, 147'},null,'#ff2e93');
// Email helpers
add('Email helpers','Subject line ideas','Subject ideas from your message',s=>{const k=words(s).filter(w=>w.length>4).slice(0,3).join(' ')||'your message';return ['Quick question about '+k,'Following up: '+k,'Update on '+k,'Thank you for '+k,'Can we chat about '+k].join('\n')},null,'I wanted to ask about the honey order delivery');
add('Email helpers','Greeting picker','Friendly ways to start. Param: name',(s,p)=>{const n=p||'there';return ['Hi '+n+',','Hello '+n+',','Dear '+n+',','Good morning '+n+',','Hey '+n+', hope your week is going well.'].join('\n')},'Their name (example: Sam)');
add('Email helpers','Sign-off picker','Friendly ways to finish',()=>['Warm regards,','Kind regards,','Thanks so much,','Cheers,','Talk soon,','With thanks,'].join('\n'));
add('Email helpers','Tone check','Spots pushy or very casual words',s=>{const t=s.toLowerCase(),f=[];if(/!/.test(s))f.push('Has exclamation marks');if(/\b(asap|urgent|immediately)\b/.test(t))f.push('Sounds rushed');if(/\b(please|thank)/.test(t))f.push('Polite words found');else f.push('Try adding please or thank you');if(/[A-Z]{5,}/.test(s))f.push('Has shouty capitals');return f.join('\n')},null,'Please send it ASAP, thank you');
add('Email helpers','Out of office','Away message. Param: back date',(s,p)=>'Hello,\n\nThank you for your email. I am away and will be back on '+(p||'Monday')+'. I will reply as soon as I can after that.\n\nKind regards'+(s.trim()?',\n'+s.trim():''),'Back date (example: 10 November)','Karen');
add('Email helpers','Meeting invite','Invite text. Param: date and time',(s,p)=>'Hi,\n\nCould we meet on '+(p||'Friday at 10am')+' to talk about '+(s.trim()||'our plans')+'. Let me know if that time works or suggest another.\n\nThanks','Date and time (example: Friday at 10am)','the new Coffeebreak range');
add('Email helpers','Payment request','PayID payment request. Param: amount',(s,p)=>'Hello'+(s.trim()?' '+s.trim():'')+',\n\nThe amount due is $'+(parseFloat(p)||15).toFixed(2)+' AUD.\n\nPay by PayID (Teachers Mutual Bank): darkokaz@gmx.com\n\nPlease put your reference in the payment description. Thank you.','Amount (example: 15)','Sam');
add('Email helpers','Invoice maker','Lines like Item, price. Adds GST',s=>{let tot=0;const out=lines(s).filter(l=>l.trim()).map(l=>{const n=nums(l);const v=n.length?n[n.length-1]:0;tot+=v;return l.replace(/,?\s*-?\d+(\.\d+)?\s*$/,'').trim()+'  '+money(v)});return 'INVOICE\n'+out.join('\n')+'\nSubtotal '+money(tot)+'\nGST '+money(tot*0.1)+'\nTotal '+money(tot*1.1)+'\n\nPay by PayID (Teachers Mutual Bank): darkokaz@gmx.com'},null,'Tattoo flash pack, 20\nPink mug, 15');
// Dates and time
add('Dates and time','Days until','Days until a date. Format: YYYY-MM-DD',s=>{const d=new Date(s.trim()+'T00:00:00');if(isNaN(d))return 'Type a date like 2026-12-25';const n=Math.ceil((d-new Date().setHours(0,0,0,0))/864e5);return n+' days'},null,'2026-12-25');
add('Dates and time','World clock','Time now in big cities',()=>[['Sydney','Australia/Sydney'],['Perth','Australia/Perth'],['Auckland','Pacific/Auckland'],['London','Europe/London'],['New York','America/New_York'],['Los Angeles','America/Los_Angeles'],['Tokyo','Asia/Tokyo']].map(([n,z])=>n+': '+new Date().toLocaleString('en-AU',{timeZone:z,weekday:'short',hour:'numeric',minute:'2-digit'})).join('\n'));
add('Dates and time','Date formats','Today written different ways',()=>{const d=new Date();return [d.toLocaleDateString('en-AU'),d.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'}),d.toISOString().slice(0,10)].join('\n')});
add('Dates and time','Add days','Date after some days. Param: days',(s,p)=>{const d=new Date();d.setDate(d.getDate()+(parseInt(p)||7));return d.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'})},'Days to add (example: 30)');
window.CB_UTIL_TOOLS=T;
window.CB_fmtBytes=fmtBytes;
})();
