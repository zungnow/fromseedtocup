'use strict';

// ══════════════════════════════════════════
//  오디오 엔진
// ══════════════════════════════════════════
const audio = {
  ctx: null, isMuted: false,
  init() { if (!this.ctx) { try { this.ctx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){} } },
  playSfx(type) {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc=this.ctx.createOscillator(); const gain=this.ctx.createGain();
      osc.connect(gain); gain.connect(this.ctx.destination);
      const now=this.ctx.currentTime;
      if (type==='plant')   { osc.frequency.setValueAtTime(200,now); osc.frequency.exponentialRampToValueAtTime(50,now+0.1); gain.gain.setValueAtTime(0.15,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.1); osc.start(); osc.stop(now+0.1); }
      if (type==='harvest') { osc.type='sine'; osc.frequency.setValueAtTime(500,now); osc.frequency.exponentialRampToValueAtTime(900,now+0.15); gain.gain.setValueAtTime(0.2,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.15); osc.start(); osc.stop(now+0.15); }
      if (type==='serve')   { osc.type='sine'; osc.frequency.setValueAtTime(700,now); osc.frequency.exponentialRampToValueAtTime(1100,now+0.2); gain.gain.setValueAtTime(0.15,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.3); osc.start(); osc.stop(now+0.3); }
      if (type==='money')   { osc.type='triangle'; osc.frequency.setValueAtTime(900,now); osc.frequency.exponentialRampToValueAtTime(1400,now+0.1); gain.gain.setValueAtTime(0.2,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.2); osc.start(); osc.stop(now+0.2); }
      if (type==='stageup') {
        [0,0.1,0.2,0.35].forEach((t,i)=>{
          const o2=this.ctx.createOscillator(); const g2=this.ctx.createGain();
          o2.connect(g2); g2.connect(this.ctx.destination);
          const freqs=[600,750,900,1200]; o2.frequency.value=freqs[i];
          g2.gain.setValueAtTime(0.2,now+t); g2.gain.exponentialRampToValueAtTime(0.001,now+t+0.15);
          o2.start(now+t); o2.stop(now+t+0.15);
        });
      }
    } catch(e) {}
  },
  toggle() { this.isMuted=!this.isMuted; return this.isMuted; }
};

// ══════════════════════════════════════════
//  플로팅 텍스트
// ══════════════════════════════════════════
function floatText(text, x, y, color='#F4C430') {
  const el=document.createElement('div');
  el.className='float-text';
  el.textContent=text;
  el.style.cssText=`left:${x}px;top:${y}px;color:${color};`;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 1300);
}

function floatTextAtEl(text, el, color) {
  const rect=el.getBoundingClientRect();
  floatText(text, rect.left+rect.width/2-20, rect.top+rect.height/2, color);
}

// 항상 화면 중앙에 보이는 보상 플로팅 (탭 무관하게 사용)
function floatReward(text, color='#D4A017') {
  // 현재 보이는 mob-cust 패널 우선, 없으면 화면 중앙
  const panels = ['mob-cust-list','mob-cust-list-manage','customerList'];
  let el = null;
  for (const id of panels) {
    const candidate = document.getElementById(id);
    if (!candidate) continue;
    const rect = candidate.getBoundingClientRect();
    if (rect.width > 0 && rect.top > 0 && rect.top < window.innerHeight) { el = candidate; break; }
  }
  if (el) {
    const rect = el.getBoundingClientRect();
    floatText(text, rect.left + rect.width/2 - 40, rect.top + 20, color);
  } else {
    floatText(text, window.innerWidth/2 - 40, window.innerHeight * 0.35, color);
  }
}

// ══════════════════════════════════════════
//  📸 공유 카드 시스템
// ══════════════════════════════════════════
function openShareCard() {
  if (!G.cafeOpen) { showNotif('카페를 오픈하면 공유할 수 있어요!'); return; }

  // 기본 정보
  const stage = STAGE_DATA[G.stage];
  const interior = getOwnedInterior();
  const sat = G.satisfaction;
  const satFull = Math.floor(sat);
  const satHalf = sat % 1 >= 0.5;
  const satStars = '🩵'.repeat(satFull) + (satHalf?'💙':'') + '🤍'.repeat(Math.max(0,5-satFull-(satHalf?1:0)));

  // 테마별 카드 배경
  document.getElementById('shareCard').style.background = '#111111';

  // 헤더
  document.getElementById('sc-brand-icon').textContent = stage.building;
  document.getElementById('sc-brand-name').textContent = G.brandName;
  document.getElementById('sc-stage').textContent = stage.name + (G.stage >= 9 ? ' 🏆' : '');
  document.getElementById('sc-sat').textContent = satStars;
  document.getElementById('sc-sat-val').textContent = sat.toFixed(1) + '점';
  document.getElementById('sc-day').textContent = `Day ${G.day}`;

  // 핵심 스탯
  const statCard = (emoji, label, value) =>
    `<div style="background:rgba(255,248,240,0.08);border-radius:10px;padding:8px 6px;text-align:center;">
      <div style="font-size:20px;">${emoji}</div>
      <div style="font-size:9px;color:rgba(255,248,240,0.5);margin-top:2px;">${label}</div>
      <div style="font-family:'Jua',sans-serif;font-size:13px;color:#FFF8F0;margin-top:1px;">${value}</div>
    </div>`;
  document.getElementById('sc-stats').innerHTML =
    statCard('🍽️','총 서빙', G.totalServed.toLocaleString()+'명') +
    statCard('💰','누적 수익', Math.floor(G.totalMoneyEarned/10000)+'만원') +
    statCard('⭐','현재 명성', G.reputation.toLocaleString());

  // 단골 TOP3
  const topRegs = Object.entries(G.regulars||{})
    .filter(([,r]) => r.visits >= 5)
    .sort((a,b) => b[1].visits - a[1].visits)
    .slice(0, 3);
  const regSection = document.getElementById('sc-regulars-section');
  if (topRegs.length > 0) {
    regSection.innerHTML = `
      <div style="font-size:10px;color:rgba(255,248,240,0.5);margin-bottom:6px;letter-spacing:1px;">💝 단골 손님 TOP ${topRegs.length}</div>
      <div style="display:flex;gap:6px;">
        ${topRegs.map(([name, r], i) => {
          const favR = r.favMenu && RECIPES[r.favMenu];
          return `<div style="flex:1;background:rgba(233,30,140,0.12);border:1px solid rgba(233,30,140,0.2);border-radius:9px;padding:7px;text-align:center;">
            <div style="font-size:10px;font-weight:700;color:#FFF8F0;">${['🥇','🥈','🥉'][i]} ${name}</div>
            <div style="font-size:9px;color:rgba(255,248,240,0.5);margin-top:2px;">${r.visits}회 방문</div>
            ${favR ? `<div style="font-size:9px;color:#D4A017;margin-top:2px;">${favR.emoji}단골</div>` : ''}
          </div>`;
        }).join('')}
      </div>`;
  } else {
    regSection.innerHTML = '';
  }

  // 베스트 메뉴 TOP3
  const topMenus = Object.entries(G.menuSoldCount||{})
    .sort((a,b) => b[1]-a[1]).slice(0,3);
  const menuSection = document.getElementById('sc-menus-section');
  if (topMenus.length > 0) {
    menuSection.innerHTML = `
      <div style="font-size:10px;color:rgba(255,248,240,0.5);margin-bottom:6px;letter-spacing:1px;">🏆 베스트 메뉴</div>
      <div style="display:flex;gap:6px;">
        ${topMenus.map(([k,cnt],i) => {
          const r = RECIPES[k];
          return `<div style="flex:1;background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.2);border-radius:9px;padding:6px;text-align:center;">
            <div style="font-size:20px;">${r?.emoji||'?'}</div>
            <div style="font-size:9px;color:#FFF8F0;font-weight:700;margin-top:2px;">${r?.name||k}</div>
            <div style="font-size:9px;color:#D4A017;">${cnt}회</div>
          </div>`;
        }).join('')}
      </div>`;
  } else {
    menuSection.innerHTML = '';
  }

  // 대회 뱃지
  const badges = G.contestHistory?.filter(h =>
    h.rank.includes('1위')||h.rank.includes('대상')||h.rank.includes('MVP')||h.rank.includes('미슐랭')
  ) || [];
  const badgeSection = document.getElementById('sc-badges-section');
  if (badges.length > 0) {
    badgeSection.innerHTML = `
      <div style="font-size:10px;color:rgba(255,248,240,0.5);margin-bottom:6px;letter-spacing:1px;">🎖️ 대회 수상</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;">
        ${badges.map(h => `<div style="background:rgba(212,160,23,0.15);border:1px solid rgba(212,160,23,0.3);border-radius:20px;padding:3px 10px;font-size:10px;color:#D4A017;">${h.emoji} ${h.name}</div>`).join('')}
      </div>`;
  } else {
    badgeSection.innerHTML = '';
  }

  showModal('shareModal');
}

function copyShareText() {
  const stage = STAGE_DATA[G.stage];
  const topRegs = Object.entries(G.regulars||{})
    .filter(([,r])=>r.visits>=5).sort((a,b)=>b[1].visits-a[1].visits).slice(0,3);
  const topMenus = Object.entries(G.menuSoldCount||{})
    .sort((a,b)=>b[1]-a[1]).slice(0,3);

  let text = `🌱 ${G.brandName}\n`;
  text += `${stage.name} | Day ${G.day}\n`;
  text += `⭐ 명성 ${G.reputation.toLocaleString()} | 🍽️ ${G.totalServed}명 서빙\n`;
  if (topRegs.length) text += `\n💝 단골 손님\n` + topRegs.map(([n,r])=>`  ${n} (${r.visits}회)`).join('\n') + '\n';
  if (topMenus.length) text += `\n🏆 베스트 메뉴\n` + topMenus.map(([k,c])=>`  ${RECIPES[k]?.emoji||''} ${RECIPES[k]?.name||k} ${c}회`).join('\n') + '\n';
  text += `\n#나도사장 #FromSeedToCup`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showNotif('📋 텍스트가 복사됐어요! SNS에 붙여넣기 하세요 😊');
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  showNotif('📋 텍스트가 복사됐어요! SNS에 붙여넣기 하세요 😊');
}

function saveShareImage() {
  const btn = document.getElementById('shareImgBtn');
  const card = document.getElementById('shareCard');
  if (!card) return;
  btn.textContent = '⏳ 생성 중...';
  btn.disabled = true;
  html2canvas(card, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    logging: false,
    onclone: (doc) => {
      // 복제된 DOM에서 폰트 렌더링 안정화
      doc.getElementById('shareCard').style.fontFamily = "'Jua', 'Gowun Dodum', sans-serif";
    }
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = `${G.brandName}_나도사장.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showNotif('🖼️ 이미지 저장 완료! SNS에 공유해보세요 😊');
    btn.textContent = '🖼️ 이미지 저장';
    btn.disabled = false;
  }).catch(() => {
    showNotif('⚠️ 이미지 저장 실패. 텍스트 복사를 이용해주세요!');
    btn.textContent = '🖼️ 이미지 저장';
    btn.disabled = false;
  });
}
// ══════════════════════════════════════════
function launchConfetti(count, colors) {
  const cols = colors || ['#D4A017','#F4C430','#5A8A3C','#e056fd','#2980b9','#e74c3c','#27ae60','#f39c12'];
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.cssText = `
        left:${Math.random()*100}vw;
        top:-10px;
        background:${cols[Math.floor(Math.random()*cols.length)]};
        width:${6+Math.random()*10}px;
        height:${6+Math.random()*10}px;
        border-radius:${Math.random()>0.5?'50%':'2px'};
        animation-duration:${1.5+Math.random()*2}s;
        animation-delay:${Math.random()*0.5}s;
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }, i * 20);
  }
}

function launchStarBurst(emojis, count) {
  const arr = emojis || ['⭐','✨','🌟','💫'];
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'star-burst';
      el.textContent = arr[Math.floor(Math.random()*arr.length)];
      el.style.cssText = `left:${15+Math.random()*70}vw;top:${10+Math.random()*60}vh;animation-delay:${Math.random()*0.4}s;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1000);
    }, i * 60);
  }
}

function levelFlash() {
  const el = document.createElement('div');
  el.className = 'level-flash';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 600);
}

// 단계별 연출 강도
function stageUpEffect(stage) {
  screenShake();
  levelFlash();
  audio.init(); audio.playSfx('stageup');

  // 단계별 돈 보상만 지급
  const stageRewards = [0,0,5000,15000,30000,60000,100000,150000,250000,500000];
  const monReward = stageRewards[stage] || 0;
  if (monReward) { G.money += monReward; setTimeout(()=>floatReward(`🎁 단계업 보상 +${monReward.toLocaleString()}원`, '단계업'), 600); }

  if (stage >= 9) {
    launchConfetti(120);
    launchStarBurst(['🏆','👑','🌟','✨','🎊','🎉'], 20);
  } else if (stage >= 7) {
    launchConfetti(80);
    launchStarBurst(['🌟','✨','🎊','🎉'], 14);
  } else if (stage >= 4) {
    launchConfetti(50);
    launchStarBurst(['⭐','✨','🎉'], 10);
  } else {
    launchConfetti(30);
    launchStarBurst(['⭐','✨'], 6);
  }
}

function contestWinEffect(rank) {
  screenShake();
  audio.init(); audio.playSfx('stageup');
  if (rank.includes('1위') || rank.includes('대상') || rank.includes('MVP') || rank.includes('미슐랭')) {
    launchConfetti(100, ['#FFD700','#FFF44F','#F4C430','#fff','#e056fd']);
    launchStarBurst(['🏆','🥇','⭐','✨','🎊'], 18);
  } else if (rank.includes('2위') || rank.includes('금상') || rank.includes('은상')) {
    launchConfetti(60, ['#C0C0C0','#e0e0e0','#D4A017','#fff']);
    launchStarBurst(['🥈','⭐','✨'], 10);
  } else if (rank.includes('3위') || rank.includes('동상') || rank.includes('참가상') || rank.includes('인기')) {
    launchConfetti(30);
    launchStarBurst(['🥉','⭐'], 6);
  }
}

function screenShake() {
  const app=document.getElementById('app');
  app.classList.add('shake');
  setTimeout(()=>app.classList.remove('shake'), 400);
}

// ══════════════════════════════════════════
//  STATIC DATA
// ══════════════════════════════════════════

const SEASONS = [
  { id:'spring', name:'봄',   emoji:'🌸', bg:'linear-gradient(160deg,#fce4ec 0%,#e8f5e9 60%,#c8e6c9 100%)', barColor:'#f48fb1', dayCrops:['wheat','strawb','milk_c','sugar_c','egg_c'] },
  { id:'summer', name:'여름', emoji:'🌞', bg:'linear-gradient(160deg,#fffde7 0%,#e0f7fa 60%,#b2ebf2 100%)', barColor:'#ffb300', dayCrops:['peach','bean','milk_c','sugar_c','tomato_c','basil_c'] },
  { id:'autumn', name:'가을', emoji:'🍂', bg:'linear-gradient(160deg,#fff3e0 0%,#ffe0b2 60%,#ffcc80 100%)', barColor:'#e65100', dayCrops:['wheat','strawb','peach','sugar_c','potato_c','mushroom_c'] },
  { id:'winter', name:'겨울', emoji:'❄️', bg:'linear-gradient(160deg,#e3f2fd 0%,#e8eaf6 60%,#c5cae9 100%)', barColor:'#5c6bc0', dayCrops:['bean','milk_c','wheat','meat_c'] },
];

const CROPS = {
  // 기본 작물 (1단계부터)
  wheat:    {emoji:'🌾',name:'밀',      growTime:40,  cost:500,  yield:14, gives:'wheat',    unlockStage:0},
  egg_c:    {emoji:'🥚',name:'달걀',    growTime:50,  cost:800,  yield:12, gives:'egg',      unlockStage:0}, // 1단계 계란토스트에 필요
  sugar_c:  {emoji:'🍬',name:'설탕수수',growTime:35,  cost:1500, yield:18, gives:'sugar',    unlockStage:0},
  // 2단계 이후
  milk_c:   {emoji:'🥛',name:'유제품',  growTime:60,  cost:3000, yield:20, gives:'milk',     unlockStage:2}, // 2단계 햄치즈토스트에 필요
  strawb:   {emoji:'🍓',name:'딸기',    growTime:70,  cost:1000, yield:10, gives:'strawb',   unlockStage:2}, // 2단계 딸기잼토스트에 필요
  bean:     {emoji:'🫘',name:'커피콩',  growTime:110, cost:2500, yield:20, gives:'bean',     unlockStage:2}, // 2단계 콤보메뉴에 필요
  // 3단계 이후
  tomato_c: {emoji:'🍅',name:'토마토',  growTime:90,  cost:1500, yield:12, gives:'tomato',   unlockStage:3}, // 3단계 떡볶이에 필요
  mushroom_c:{emoji:'🍄',name:'버섯',   growTime:100, cost:2000, yield:12, gives:'mushroom', unlockStage:3}, // 3단계 김밥에 필요
  meat_c:   {emoji:'🥩',name:'고기',    growTime:140, cost:5000, yield:6,  gives:'meat',     unlockStage:3}, // 3단계 순대에 필요
  // 4단계 이후
  peach:    {emoji:'🍑',name:'복숭아',  growTime:120, cost:1000, yield:10, gives:'peach',    unlockStage:4}, // 4단계 복숭아티에 필요
  // 5단계 이후
  cream_c:  {emoji:'🍶',name:'생크림',  growTime:130, cost:4000, yield:20, gives:'cream',    unlockStage:5}, // 5단계 케이크에 필요
  // 6단계 이후
  potato_c: {emoji:'🥔',name:'감자',    growTime:110, cost:1200, yield:12, gives:'potato',   unlockStage:6}, // 6단계 감자수프에 필요
  basil_c:  {emoji:'🌿',name:'허브',    growTime:90,  cost:2000, yield:14, gives:'basil',    unlockStage:6}, // 6단계 파스타에 필요
  // 8단계 이후
  truffle_c:{emoji:'⚫',name:'트러플',  growTime:200, cost:6000, yield:16, gives:'truffle',  unlockStage:8}, // 8단계 트러플파스타에 필요
};

const ITEMS = {
  wheat:   {name:'밀',    emoji:'🌾'}, strawb:  {name:'딸기',   emoji:'🍓'},
  peach:   {name:'복숭아',emoji:'🍑'}, bean:    {name:'커피콩', emoji:'🫘'},
  milk:    {name:'우유',  emoji:'🥛'}, sugar:   {name:'설탕',   emoji:'🍬'},
  egg:     {name:'달걀',  emoji:'🥚'}, potato:  {name:'감자',  emoji:'🥔'}, 
tomato:  {name:'토마토', emoji:'🍅'}, mushroom:{name:'버섯',  emoji:'🍄'}, 
meat:    {name:'고기',   emoji:'🥩'}, basil:   {name:'허브',  emoji:'🌿'}, 
truffle: {name:'트러플', emoji:'⚫'}, cream:   {name:'생크림',emoji:'🍶'},
};

// stageReq: 0=농장, 1=노점, 2=토스트점, 3=분식점, 4=카페, 5=디저트카페, 6=비스트로, 7=레스토랑, 8=파인다이닝, 9=프랜차이즈
const RECIPES = {
  // ── 1단계: 노점 ──
  egg_toast:    {emoji:'🍳',name:'계란 토스트',   price:4000, stageReq:1, ingredients:{wheat:1,egg:1},              learnCost:0,    season:null,     reviews:['든든해요!','아침에 딱!','따뜻하고 맛있어요~']},
  hotteok:      {emoji:'🥞',name:'호떡',          price:2500, stageReq:1, ingredients:{wheat:1,sugar:1},            learnCost:500,  season:null,     reviews:['달콤해요!','길거리 감성~','바삭하고 맛있어요!']},
  // ── 2단계: 토스트점 ──
  ham_toast:    {emoji:'🥪',name:'햄치즈 토스트', price:4500, stageReq:2, ingredients:{wheat:1,egg:1,milk:1},       learnCost:1000, season:null,     reviews:['치즈가 쭉쭉~','든든해요!','점심으로 딱!']},
  strawb_toast: {emoji:'🍓',name:'딸기잼 토스트', price:5000, stageReq:2, ingredients:{wheat:1,strawb:1,sugar:1},   learnCost:800,  season:null,     reviews:['달콤해요!','향기가 좋아요~','아이들이 좋아해요!']},
  plain_cookie: {emoji:'🍪',name:'플레인 쿠키',   price:2500, stageReq:2, ingredients:{wheat:1,sugar:1,egg:1},      learnCost:500,  season:null,     reviews:['바삭해요!','고소한 냄새~','커피랑 잘 어울려요!']},
  // ── 3단계: 분식점 ──
  tteokbokki:   {emoji:'🌶️',name:'떡볶이',       price:5000, stageReq:3, ingredients:{wheat:2,tomato:1,sugar:1},   learnCost:2000, season:null,     reviews:['매콤달콤!','중독적이에요~','또 먹고 싶어요!']},
  kimbap:       {emoji:'🍙',name:'김밥',          price:4500, stageReq:3, ingredients:{wheat:1,egg:1,mushroom:1},   learnCost:2000, season:null,     reviews:['꽉 찬 속재료!','소풍 필수템~','집밥 느낌!']},
  sundae:       {emoji:'🌭',name:'순대',           price:3500, stageReq:3, ingredients:{meat:1,wheat:1},             learnCost:1500, season:null,     reviews:['쫄깃해요!','분식집 느낌~','고소해요!']},
  // ── 4단계: 카페 ──
  latte:        {emoji:'☕',name:'라떼',           price:5500, stageReq:4, ingredients:{bean:1,milk:1},              learnCost:3000, season:null,     reviews:['부드러운 라떼!','커피 향이 진해요!','진짜 카페 느낌~']},
  americano:    {emoji:'🖤',name:'아메리카노',     price:4500, stageReq:4, ingredients:{bean:2},                     learnCost:2000, season:null,     reviews:['진한 커피!','쌉싸름해요~','깔끔해요!']},
  strawb_latte: {emoji:'🍓',name:'딸기 라떼',     price:6500, stageReq:4, ingredients:{bean:1,strawb:1,milk:1},     learnCost:3000, season:null,     reviews:['이 메뉴 최고!','인스타에 올렸어요!','또 주문했어요!']},
  peach_tea:    {emoji:'🫖',name:'복숭아 티',      price:5000, stageReq:4, ingredients:{peach:1,sugar:1},            learnCost:2500, season:null,     reviews:['복숭아향 진해요!','향기 너무 좋아요~','힐링돼요!']},
  // ── 5단계: 디저트 카페 ──
  strawb_cake:  {emoji:'🍰',name:'딸기 케이크',   price:8000, stageReq:5, ingredients:{wheat:1,strawb:2,cream:1},   learnCost:5000, season:null,     reviews:['예쁘고 맛있어요!','선물용으로 딱!','달콤해요~']},
  macaron:      {emoji:'🧁',name:'마카롱',         price:6000, stageReq:5, ingredients:{wheat:1,egg:1,sugar:2,cream:1},learnCost:4000,season:null,   reviews:['너무 예뻐요!','달달해요~','선물하기 좋아요!']},
  waffle:       {emoji:'🧇',name:'와플',           price:7000, stageReq:5, ingredients:{wheat:2,egg:1,milk:1},       learnCost:4000, season:null,     reviews:['바삭바삭!','시럽이랑 최고~','브런치 느낌!']},
  peach_smoothie:{emoji:'🥤',name:'복숭아 스무디',price:6500, stageReq:5, ingredients:{peach:2,milk:1,sugar:1},     learnCost:3500, season:null,     reviews:['시원해요!','복숭아가 진해요~','여름에 딱!']},
  // ── 6단계: 비스트로 ──
  potato_soup:  {emoji:'🥣',name:'감자 수프',      price:9000, stageReq:6, ingredients:{potato:2,milk:1,basil:1},   learnCost:6000, season:null,     reviews:['따뜻하고 맛있어요!','크리미해요~','속이 편해요!']},
  tomato_pasta: {emoji:'🍝',name:'토마토 파스타',  price:12000,stageReq:6, ingredients:{wheat:2,tomato:2,basil:1},  learnCost:8000, season:null,     reviews:['정통 이탈리안!','소스가 진해요~','또 먹고 싶어요!']},
  mushroom_risotto:{emoji:'🍚',name:'버섯 리조또',price:13000,stageReq:6, ingredients:{wheat:1,mushroom:2,milk:1,basil:1},learnCost:8000,season:null,reviews:['고급스러워요!','버섯향이 진해요~','레스토랑 느낌!']},
  // ── 7단계: 레스토랑 ──
  steak:        {emoji:'🥩',name:'스테이크',       price:35000,stageReq:7, ingredients:{meat:2,basil:1,mushroom:1},  learnCost:15000,season:null,    reviews:['육즙이 살아있어요!','완벽한 굽기!','최고의 스테이크!']},
  burger:       {emoji:'🍔',name:'프리미엄 버거',  price:15000,stageReq:7, ingredients:{wheat:1,meat:1,tomato:1,egg:1},learnCost:10000,season:null,  reviews:['패티가 두툼해요!','소스가 맛있어요~','최고의 버거!']},
  // ── 8단계: 파인다이닝 ──
  truffle_pasta:{emoji:'🖤',name:'트러플 파스타',  price:37000,stageReq:8, ingredients:{wheat:2,truffle:1,cream:1,basil:1},learnCost:30000,season:null,reviews:['환상적이에요!','이런 맛은 처음!','럭셔리해요~']},
  prime_steak:  {emoji:'🥇',name:'프라임 스테이크',price:60000,stageReq:8, ingredients:{meat:3,truffle:1,basil:1},   learnCost:40000,season:null,    reviews:['인생 스테이크!','완벽 그 자체!','별 다섯개!']},
  // ── 9단계: 프랜차이즈 ──
  premium_course:{emoji:'🎂',name:'프리미엄 코스', price:90000,stageReq:9, ingredients:{meat:2,truffle:1,cream:2,mushroom:1,basil:1},learnCost:60000,season:null,reviews:['인생 최고의 식사!','모든 게 완벽해요!','또 오고 싶어요!']},

  // ── 계절 한정 ──
  // 봄
  spring_blossom:{emoji:'🌸',name:'봄꽃 라떼',    price:7000, stageReq:4, ingredients:{bean:1,milk:1,sugar:1},      learnCost:3000, season:'spring', reviews:['봄 느낌 물씬~','또 먹고 싶어요!','사진 찍었어요!']},
  spring_strawb_crepe:{emoji:'🥞',name:'딸기 크레페',price:8000,stageReq:5,ingredients:{wheat:1,strawb:2,cream:1},  learnCost:5000, season:'spring', reviews:['봄 딸기 최고!','크레페가 부드러워요~','예쁘게 나왔어요!']},
  // 여름
  summer_ice:   {emoji:'🧊',name:'썸머 아이스티',  price:7000, stageReq:4, ingredients:{peach:1,sugar:2},           learnCost:3000, season:'summer', reviews:['시원해요!','여름엔 이게 최고!','또 주문했어요!']},
  summer_pasta: {emoji:'🍝',name:'냉파스타',        price:13000,stageReq:6, ingredients:{wheat:2,tomato:2,basil:1},  learnCost:8000, season:'summer', reviews:['여름에 딱!','시원하고 맛있어요~','상큼해요!']},
  // 가을
  autumn_latte: {emoji:'🍂',name:'가을 호박 라떼',  price:7000, stageReq:4, ingredients:{bean:1,milk:1,sugar:2},    learnCost:3000, season:'autumn', reviews:['가을 감성!','호박향이 은은해요~','따뜻해요!']},
  autumn_mushroom:{emoji:'🍄',name:'버섯 크림 수프',price:10000,stageReq:6, ingredients:{mushroom:2,cream:1,basil:1},learnCost:6000, season:'autumn', reviews:['가을 별미!','버섯향 진해요~','크리미해요!']},
  // 겨울
  winter_choco: {emoji:'☃️',name:'겨울 핫초코',    price:6500, stageReq:4, ingredients:{milk:2,sugar:2},            learnCost:3000, season:'winter', reviews:['따뜻해요!','겨울에 딱!','몸이 녹아요~']},
  winter_stew:  {emoji:'🫕',name:'겨울 비프 스튜', price:20000,stageReq:7, ingredients:{meat:2,potato:1,tomato:1,basil:1},learnCost:12000,season:'winter',reviews:['겨울 최고의 음식!','따뜻하고 든든해요!','집밥보다 맛있어요!']},

  // ── 콤보 메뉴 ──
  combo_americano_cookie:{emoji:'🖤🍪',name:'아메리카노+쿠키', price:6000, stageReq:2, ingredients:{bean:2,wheat:1,sugar:1,egg:1}, learnCost:1000, season:null, isCombo:true, reviews:['가성비 최고!','커피랑 쿠키 찰떡~','자주 올게요!']},
  combo_latte_waffle:    {emoji:'☕🧇',name:'라떼+와플',        price:10500,stageReq:5, ingredients:{bean:1,milk:1,wheat:2,egg:1}, learnCost:4000, season:null, isCombo:true, reviews:['완벽한 조합!','브런치 느낌~','두 개 따로보다 저렴해요!']},
  combo_cake_latte:      {emoji:'🍰☕',name:'케이크+라떼',      price:12000,stageReq:5, ingredients:{wheat:1,strawb:2,cream:1,bean:1,milk:1}, learnCost:6000, season:null, isCombo:true, reviews:['세트로 시키길 잘했어요!','달콤해요~','인생 조합!']},
  combo_steak_wine:      {emoji:'🥩🍷',name:'스테이크+와인',    price:40000,stageReq:7, ingredients:{meat:2,basil:1,mushroom:1,bean:1}, learnCost:15000,season:null, isCombo:true, reviews:['완벽한 디너!','고급스러워요~','특별한 날에 딱!']},

  // ── 선물세트 ──
  gift_cake_drink: {emoji:'🎁',name:'딸기케이크+음료',    price:14000,stageReq:5, ingredients:{wheat:1,strawb:2,cream:1,bean:1,milk:1,sugar:1}, learnCost:8000, season:null, isGift:true, reviews:['선물용으로 딱!','포장이 예뻐요~','소중한 사람에게 선물했어요!']},
  gift_premium:    {emoji:'🎀',name:'프리미엄 디저트',    price:45000,stageReq:8, ingredients:{truffle:1,cream:2,strawb:1,bean:1,milk:1},         learnCost:20000,season:null, isGift:true, reviews:['최고급 선물!','럭셔리해요~','받는 사람이 감동받았대요!']},
};

const UPGRADES = {
  fertilizer:  {name:'비료 시스템',     emoji:'🌿',desc:'작물 성장 30% 단축',          cost:30000,  stageReq:0},
  display:      {name:'예쁜 진열대',    emoji:'🖼', desc:'손님 만족도 +10%',           cost:90000,  stageReq:1},
  espresso_m:   {name:'에스프레소 머신',emoji:'⚙️',desc:'커피류 재료 필요량 1개 절감',  cost:120000,  stageReq:4},
  loyalty:      {name:'단골 카드',      emoji:'🃏',desc:'단골 손님 방문 빈도 +20%',    cost:100000,  stageReq:3},
  premium_mat:  {name:'프리미엄 식재료',emoji:'✨',desc:'메뉴 판매가 +15%',            cost:70000,  stageReq:5},
  auto_harvest: {name:'자동 수확기',    emoji:'🚜',desc:'익은 작물 자동 수확',          cost:80000,  stageReq:2},
  pro_kitchen:  {name:'전문 주방',      emoji:'🍳',desc:'조리 메뉴 판매가 +10%',       cost:200000,  stageReq:6},
  wine_cellar:  {name:'와인 셀러',      emoji:'🍷',desc:'파인다이닝 메뉴 가격 +20%',   cost:250000, stageReq:8},
};

const STAFF_DEFS = {
  parttime: {name:'아르바이트생', emoji:'👧',role:'barista',  desc:'손님 1명 자동 서빙',             hireCost:40000,  dailyCost:1000,  stageReq:1},
  barista:  {name:'바리스타',    emoji:'☕',role:'patience', desc:'손님 인내심 소모 속도 -20% (대기 시간↑)', hireCost:45000, dailyCost:2000, stageReq:4},
  manager:  {name:'재료 관리자', emoji:'🧑‍💼',role:'manager',  desc:'레시피 기반으로 부족한 재료 스마트 심기',    hireCost:50000,  dailyCost:2000, stageReq:3},
  head_chef:{name:'수석 셰프',   emoji:'👨‍🍳',role:'barista',  desc:'메뉴 판매가 +10% & 자동 서빙',   hireCost:55000, dailyCost:3000, stageReq:6},
  sommelier:{name:'소믈리에',    emoji:'🍷',role:'quality',  desc:'VIP·파인다이닝 손님 만족도 +0.5',  hireCost:70000, dailyCost:4000, stageReq:8},
};

const STAGE_DATA = [
  {name:'🌱 농장',       building:'🏕️',desc:'작물을 재배하고 재료를 모아보세요',           repReq:0},
  {name:'🛖 노점',       building:'🛖', desc:'길거리 노점으로 첫 장사를 시작해보세요!',    repReq:0},
  {name:'🥪 토스트점',   building:'🏠', desc:'작은 토스트 가게를 운영해보세요',            repReq:800},
  {name:'🍱 분식점',     building:'🏪', desc:'떡볶이, 김밥으로 손님을 모아보세요',         repReq:2500},
  {name:'☕ 카페',       building:'☕', desc:'본격 카페! 커피와 디저트를 선보이세요',       repReq:6000},
  {name:'🍰 디저트카페', building:'🎂', desc:'달콤한 디저트로 감성 카페를 꾸려보세요',     repReq:14000},
  {name:'🍝 비스트로',   building:'🍝', desc:'파스타와 수프로 유럽식 감성을 더하세요',     repReq:30000},
  {name:'🍽️ 레스토랑',  building:'🍽️',desc:'스테이크와 코스 요리로 격조를 높이세요',     repReq:60000},
  {name:'🥂 파인다이닝', building:'🥂', desc:'트러플과 프라임 스테이크, 최고급 요리',      repReq:100000},
  {name:'🏢 프랜차이즈', building:'🏢', desc:'전국 프랜차이즈 브랜드로 성장했어요!',      repReq:160000},
];

// SPECIAL GUEST types
const SPECIAL_TYPES = {
  regular: {name:'단골손님',   emoji:'🥰',tag:'ctag-regular', label:'단골',   patBonus:30, repMult:1.2, moneyMult:1.0, fussiness:0,   spawnChance:0.25},
  vip:     {name:'VIP 손님',   emoji:'🤩',tag:'ctag-vip',     label:'VIP',    patBonus:10, repMult:2.0, moneyMult:1.5, fussiness:0.2, spawnChance:0.10},
  fussy:   {name:'까다로운 손님',emoji:'😤',tag:'ctag-fussy', label:'까다로움',patBonus:-20,repMult:3.0, moneyMult:1.0, fussiness:0.5, spawnChance:0.10},
  blogger: {name:'푸드 블로거',emoji:'📸',tag:'ctag-blogger', label:'블로거', patBonus:0,  repMult:5.0, moneyMult:1.2, fussiness:0.1, spawnChance:0.02},
};

// STORY EVENTS (triggered at rep milestones or random)
const STORY_EVENTS = [
  {id:'rival_cafe',     triggerRep:400,   title:'🏪 경쟁 가게 등장!',     text:'골목 맞은편에 새로운 가게가 오픈했어요. 메뉴도 비슷하고 손님들이 비교하기 시작했어요.', choices:[{label:'품질로 승부하기',reward:{rep:50},msg:'품질 향상에 집중! 명성 +50'},{label:'프로모션 행사하기',reward:{money:20000,rep:20},msg:'할인 행사 진행! 명성 +20'}]},
  {id:'regular_chan',   triggerRep:700,   title:'👴 단골손님 건희 씨',     text:'"저 여기 매일 오거든요. 오늘도 항상 먹던 거 주세요." 건희 씨는 이제 가게의 숨은 홍보대사가 됐어요.', choices:[{label:'감사 선물 드리기',reward:{rep:80,money:-10000},msg:'건희 씨 감동! 명성 +80'},{label:'메뉴 이름 붙여주기',reward:{rep:120},msg:'"건희 특선" 탄생! 명성 +120'}]},
  {id:'food_magazine',  triggerRep:8000,   title:'📰 잡지 취재 요청!',     text:'지역 음식 잡지에서 취재 요청이 왔어요. 기사가 실리면 대박날 수도 있어요!', choices:[{label:'취재 수락하기',reward:{rep:300},msg:'잡지 기사 게재! 명성 +300'},{label:'정중히 거절하기',reward:{money:0},msg:'다음 기회로...'}]},
  {id:'staff_story',    triggerRep:200,   title:'👧 아르바이트생 소연',   text:'"사장님, 저 창업이 꿈이에요. 많이 배우고 싶어요!" 소연이의 열정이 가게 분위기를 밝게 만들어요.', choices:[{label:'열심히 가르쳐주기',reward:{rep:80},msg:'소연이 성장! 명성 +80'},{label:'운영 노하우 전수',reward:{rep:150,money:-5000},msg:'소연이 감동! 명성 +150'}]},
  {id:'rainy_day',      triggerRep:0,     title:'🌧 비 오는 날',           text:'갑자기 비가 내리기 시작했어요. 빗소리와 함께 가게 안이 더 아늑해진 것 같아요.', choices:[{label:'무료 음료 한 잔 제공',reward:{rep:100,money:-8000},msg:'따뜻한 서비스! 명성 +100'},{label:'분위기 음악 틀기',reward:{rep:50},msg:'분위기 UP! 명성 +50'}]},
  {id:'celeb_visit',    triggerRep:4000,   title:'🌟 연예인 방문!',         text:'SNS에서 화제인 인플루언서가 왔어요! 팔로워들에게 위치를 공유했다고 해요.', choices:[{label:'특별 서비스 제공',reward:{rep:500,money:-15000},msg:'SNS 대박! 명성 +500'},{label:'자연스럽게 응대하기',reward:{rep:250},msg:'쿨한 대응! 명성 +250'}]},
  {id:'health_dept',    triggerRep:2500,   title:'🏥 위생 점검 방문',       text:'보건소에서 위생 점검 나왔어요. 평소 청결 관리를 잘 했다면 문제없겠죠?', choices:[{label:'자신 있게 보여주기',reward:{rep:100},msg:'우수 판정! 명성 +100'},{label:'긴장해서 실수하기',reward:{rep:-50,money:-10000},msg:'지적 사항 몇 가지... 명성 -50'}]},
  {id:'new_recipe',     triggerRep:1500,  title:'👨‍🍳 셰프의 새 레시피',   text:'수석 셰프가 특별한 레시피를 개발했어요. 시그니처 메뉴가 생길 것 같아요!', choices:[{label:'메뉴에 바로 추가',reward:{rep:300},msg:'시그니처 메뉴 탄생! 명성 +300'},{label:'더 연구하기',reward:{rep:150,money:-20000},msg:'완벽한 레시피 완성! 명성 +150'}]},
  {id:'michelin',       triggerRep:15000,  title:'⭐ 미식 평론가 방문!',    text:'유명 미식 평론가가 몰래 방문했어요. 리뷰가 어떻게 나올지 두근두근해요.', choices:[{label:'최선을 다해 서빙',reward:{rep:800},msg:'별점 만점! 명성 +800'},{label:'평소대로 운영',reward:{rep:400},msg:'좋은 평가! 명성 +400'}]},
  {id:'franchise_offer',triggerRep:28000,  title:'🏢 프랜차이즈 제안!',    text:'대형 외식 기업에서 프랜차이즈 계약을 제안해왔어요. 전국구 브랜드가 될 기회예요!', choices:[{label:'계약 수락하기',reward:{rep:2000},msg:'전국 진출 시작! 명성 +2000'},{label:'독립 브랜드 유지',reward:{rep:1000,money:500000},msg:'나만의 브랜드 고수! 명성 +1000'}]},
  {id:'award',          triggerRep:55000, title:'🏆 올해의 레스토랑 수상!', text:'권위 있는 외식 어워드에서 올해의 레스토랑으로 선정됐어요! 수많은 축하 인사가 쏟아지고 있어요.', choices:[{label:'수상 소감 발표',reward:{rep:3000},msg:'감동의 수상! 명성 +3000'},{label:'직원들과 파티',reward:{rep:2000,money:-100000},msg:'함께여서 가능했어요! 명성 +2000'}]},
];

const CUST_NAMES  = ['민준','서연','지호','예은','준서','하은','도현','소율','소연','재원','나연','시우','지아','건우','다은','우림','형호','두훈','민규','석진','태형','현준','태양','하린','유진','찬호','보미','서연','다솜','국화','에스더','영현','소호','정훈','정우','석주','일향','혜진','규연','민현'];
const CUST_EMOJIS = ['👩','👨','🧑','👧','👦','🧒','👴','👵','🧔','🧕'];

// ══════════════════════════════════════════
//  GAME STATE
// ══════════════════════════════════════════
let G = {
  brandName:'내 농장', money:100000, reputation:0, day:1,
  stage:0, cafeOpen:false, satisfaction:0, totalServed:0,
  paused:false, secondsPlayed:0, dayTimer:0,
  seasonIndex:0, seasonDay:1,
  attendStreak:0, lastAttendDay:0,  // 출석: 게임 내 day 기준
  plots:Array(8).fill(null).map(()=>({crop:null,plantedAt:null,growTime:null,stage:'empty'})),
  plotSlots:8,           // 밭 칸 수 (최대 16)
  inventory:{wheat:0,strawb:0,peach:0,bean:0,milk:0,sugar:0,egg:0,potato:0,tomato:0,mushroom:0,meat:0,basil:0,truffle:0,cream:0},
  learnedRecipes:['egg_toast'],
  disabledMenus:[],
  upgrades:[],
  staff:{},
  customers:[],
  reviews:[],
  triggeredEvents:new Set(),
  activeStory:null,
  weather:null,
  rival:{active:false, level:0, lastStealDay:0},
  trendMenu:null, trendSeason:-1,
  quests:[], questDay:0,
  boosters:{},
  staffLevels:{},
  achievements:[],
  encyclopedia:{},
  harvestedCrops:{},
  regulars:{},
  totalMoneyEarned:0,
  autoHarvestEnabled:true,
  contest: null,
  contestHistory: [],
  triggeredContests: [],
  // 납품 주문
  supplyOrders:[],
  supplyOrderDay:0,
  // 폐업 위기
  crisisActive:false, crisisDay:0, crisisDaysLeft:0,
  lowSatDays:0,
  // 멀티 지점
  branches:[],         // [{name, stage, day, money}]
  branchUnlocked:false,
  // 단골 선호 메뉴 (regulars[name].favMenu 로 저장)
};

// ══════════════════════════════════════════
//  TIMERS
// ══════════════════════════════════════════
let tickTimer=null, spawnTimer=null, staffTimer=null;

// ══════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════
window.onload = () => {
  // 즉시 수확 버튼 이벤트 위임
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.instant-harvest-btn');
    if (btn) {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      const cost = parseInt(btn.dataset.cost);
      instantHarvest(idx, cost);
    }
  });
  const raw = localStorage.getItem('farmcafe_v3');
  if (raw) {
    let valid = false;
    try { const d = JSON.parse(raw); if (d && d.day) valid = true; } catch(e) {}
    if (valid) {
      const el=document.createElement('div'); el.className='modal-overlay show';
      el.innerHTML=`<div class="modal"><div class="modal-title">🌱 저장된 게임 발견!</div>
        <div class="modal-body" style="text-align:center;color:var(--latte);font-size:13px;">이전 게임을 이어할까요?</div>
        <div class="modal-btns" style="flex-direction:column;gap:8px;">
          <button class="btn btn-primary" onclick="loadGame();this.closest('.modal-overlay').remove()">💾 이어하기</button>
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove();showModal('nameModal')">🆕 새 게임</button>
        </div></div>`;
      document.body.appendChild(el);
    } else {
      localStorage.removeItem('farmcafe_v3');
      showModal('nameModal');
    }
  } else showModal('nameModal');
};

function startGame() {
  const v=document.getElementById('brandInput').value.trim();
  if (v) G.brandName=v;
  // 새 게임 시작 시 횟수 제한 초기화
  localStorage.removeItem('emergencyLog');
  localStorage.removeItem('boosterLog');
  localStorage.removeItem('farmcafe_tut_done');
  localStorage.removeItem('daily_bonus');
  // 스타터 키트: 밀 3개, 설탕 2개, 달걀 2개 무료 지급
  G.inventory.wheat = 3;
  G.inventory.sugar = 2;
  G.inventory.egg = 2;
  closeModal('nameModal'); boot();
  // 게임 시작 후 튜토리얼 실행
  setTimeout(()=>startTutorial(), 500);
}

function boot() {
  if (!(G.triggeredEvents instanceof Set)) G.triggeredEvents=new Set(G.triggeredEvents||[]);
  if (!G.staff) G.staff={};
  if (!G.boosters) G.boosters={};
  if (!G.staffLevels) G.staffLevels={};
  if (!G.achievements) G.achievements=[];
  if (!G.encyclopedia) G.encyclopedia={};
  if (!G.harvestedCrops) G.harvestedCrops={};
  if (!G.regulars) G.regulars={};
  if (!G.totalMoneyEarned) G.totalMoneyEarned=0;
  if (!G.menuSoldCount) G.menuSoldCount={};
  if (!G.contestHistory) G.contestHistory=[];
  if (!G.triggeredContests) G.triggeredContests=[];
  if (!G.staffFatigue) G.staffFatigue={};
  if (!G.interior) G.interior={theme:null,props:[]};
  if (!G.interiorOwned) G.interiorOwned=[];
  if (!G._interiorApplied) G._interiorApplied={};
  if (!G._regDeepSeen) G._regDeepSeen={};
  if (!G.plotSlots) G.plotSlots=8;
  if (!G.supplyOrders) G.supplyOrders=[];
  if (!G.branches) G.branches=[];
  // plots 길이 보정
  while (G.plots.length < G.plotSlots) G.plots.push({crop:null,plantedAt:null,growTime:null,stage:'empty'});
  // 날씨 계절 검증 — 현재 계절에 맞지 않으면 초기화
  if (G.weather) {
    const seasonId = SEASONS[G.seasonIndex].id;
    const valid = SEASON_WEATHER[seasonId] || [];
    if (!valid.includes(G.weather.id)) { G.weather = null; }
  }
  // 트렌드 메뉴 계절 검증 — 현재 계절 재료와 맞지 않으면 리셋
  if (G.trendMenu && RECIPES[G.trendMenu]) {
    const seasonHints = {spring:['strawb','peach','cream'],summer:['peach','bean','tomato'],autumn:['mushroom','potato','bean'],winter:['milk','meat','sugar']};
    const seasonId = SEASONS[G.seasonIndex].id;
    const hints = seasonHints[seasonId] || [];
    const ingrs = Object.keys(RECIPES[G.trendMenu].ingredients||{});
    const fits = ingrs.some(ing => hints.includes(ing));
    if (!fits) { G.trendMenu = null; G.trendSeason = -1; }
  }
  // 대회 계절 검증 — 계절 한정 대회가 맞지 않는 계절에 진행 중이면 취소
  cancelContestIfWrongSeason();
  document.getElementById('brandNameDisplay').textContent=G.brandName;
  if (G.cafeOpen) {
    document.getElementById('cafe-locked').style.display='none';
    document.getElementById('cafe-open').style.cssText='display:flex;flex-direction:column';
  }
  applySeasonBg();
  renderAll();
  // 타이머 항상 새로 시작 (중복 방지: 기존 타이머 정리 후 재시작)
  clearInterval(tickTimer); tickTimer = null;
  startTimers();
  addLog(`🌱 ${G.brandName}의 이야기가 시작됩니다!`);
  renderAutoHarvestBtn();
  initDailyBonus();
  // 인테리어 테마 복원
  applyInteriorTheme();
  applyInteriorEffects();
  renderCafeIllustration();
  renderPropDisplay();
  renderMobIllustration();
  renderExpandFarmBtn();
}

function startTimers() {
  tickTimer=setInterval(tick,1000);
  resetSpawnTimer();
  resetStaffTimer();
}

function resetSpawnTimer(customRate) {
  clearInterval(spawnTimer);
  if (!G.cafeOpen) return;
  const base=[null,18000,14000,11000,9000,7000];
  let rate=customRate||base[G.stage]||12000;
  if (!customRate && hasStaff('loyalty')) rate*=0.8;
  // 인테리어 내추럴 가든: 손님 방문 속도 +15%
  if (!customRate && getInteriorBonus('regularBonus') > 0) rate *= (1 - getInteriorBonus('regularBonus'));
  spawnTimer=setInterval(spawnCustomer,rate);
}

function resetStaffTimer() {
  clearInterval(staffTimer);
  const interval = (G.boosters?.staffB && G.day <= (G.boosters.staffB.endDay||0)) ? 25000 : 50000;
  staffTimer=setInterval(runStaffActions, interval);
}

// ══════════════════════════════════════════
//  MAIN TICK
// ══════════════════════════════════════════
function tick() {
  if (G.paused) return;
  G.secondsPlayed++;
  G.dayTimer++;

  // Day change (every 90 sec)
  if (G.dayTimer>=300) {
    G.dayTimer=0; G.day++;
    G.seasonDay++;
    // Pay daily staff wages
    let wages=0;
    Object.keys(G.staff).forEach(sid=>{
      wages+=STAFF_DEFS[sid]?.dailyCost||0;
    });
    if (wages>0) {
      const actualWages = Math.min(wages, G.money);
      G.money = Math.max(0, G.money - wages);
      if (actualWages < wages) {
        addLog(`⚠️ 돈이 부족해 일급 일부만 지급! (${actualWages.toLocaleString()}/${wages.toLocaleString()}원)`);
        showNotif('⚠️ 직원 일급 미지급! 돈을 더 벌어야 해요!');
      } else {
        addLog(`💸 직원 일급 -${wages.toLocaleString()}원`);
      }
    }
    // Season change (every 7 game-days)
    if (G.seasonDay>7) { G.seasonDay=1; advanceSeason(); }
    addLog(`📅 Day ${G.day} 시작! (${SEASONS[G.seasonIndex].name})`);
    // 일일 도전과제 새 날 초기화 + 배너 표시
    G.dailyChallenge = null; // 하루 새로 리셋
    setTimeout(()=>{
      const dc = getDailyChallenge();
      const obj = getDailyChallengeObj();
      const banner = document.getElementById('dailyChallengeBanner');
      if (banner) {
        banner.style.display='block';
        renderDailyChallengeBanner();
      }
      addLog(`📅 오늘의 도전: ${obj.desc}`);
    }, 500);
    // 부스터 만료 체크
    if (G.boosters?.ads && G.day > G.boosters.ads.endDay) {
      delete G.boosters.ads; resetSpawnTimer();
      addLog('📢 SNS 광고 효과 종료');
    }
    if (G.boosters?.bean && G.day > G.boosters.bean.endDay) {
      delete G.boosters.bean; addLog('☕ 특별 원두 효과 종료');
    }
    if (G.boosters?.staffB && G.day > G.boosters.staffB.endDay) {
      delete G.boosters.staffB; addLog('🎁 직원 보너스 효과 종료');
    }
    // 임대료 — 7일(1시즌)마다 청구
    if (G.cafeOpen && G.seasonDay === 1) {
      const rentByStage = [0, 0, 15000, 40000, 80000, 150000, 250000, 400000, 700000, 1200000];
      const rent = rentByStage[G.stage] || 0;
      if (rent > 0) {
        G.money = Math.max(0, G.money - rent);
        addLog(`🏠 월 임대료 -${rent.toLocaleString()}원`);
        if (G.money < rent) showNotif(`⚠️ 다음 달 임대료가 부족해요! (${rent.toLocaleString()}원)`);
        else if (G.money < rent * 2) showNotif(`⚠️ 임대료 냈어요! 잔액 확인하세요 (${rent.toLocaleString()}원)`);
      }
    }
    saveToStorage();
    renderSeasonStrip();
    if (G.cafeOpen) {
      tickBranches();
      checkSupplyOrderExpiry();
      checkBusinessCrisis();
      renderExpandFarmBtn();
    }
  }

  // Auto-harvest
  const sm=G.upgrades.includes('fertilizer')?0.7:1;
  let farmChanged=false;
  G.plots.forEach(p=>{
    if (p.stage==='growing') {
      const elapsed=(Date.now()-p.plantedAt)/1000;
      if (elapsed>=p.growTime*sm) {
        p.stage='ready'; farmChanged=true;
        // If auto_harvest upgrade, harvest immediately
        if (G.upgrades.includes('auto_harvest') && G.autoHarvestEnabled !== false) {
          const crop=CROPS[p.crop];
          G.inventory[crop.gives]=(G.inventory[crop.gives]||0)+crop.yield;
          p.stage='empty'; p.crop=null;
          addLog(`🚜 자동수확! ${crop.emoji}${crop.name} ${crop.yield}개`);
        } else {
          addLog(`🌿 ${CROPS[p.crop].name} 수확 준비!`);
        }
      }
    }
  });
  if (farmChanged) { renderFarm(); renderInventory(); }

  // Customer patience
  if (G.cafeOpen && G.customers.length>0) {
    let removed=false;
    for (let i=G.customers.length-1;i>=0;i--) {
      G.customers[i].patience -= hasStaff('barista') ? 1.2 : 1.5; // 바리스타: 인내심 소모 -20%
      if (G.customers[i].patience<=0) {
        const c=G.customers[i];
        G.customers.splice(i,1);
        document.querySelector(`[data-cid="${c.id}"]`)?.remove();
        G.satisfaction=Math.max(0,G.satisfaction-0.15);
        removed=true;
        addLog(`😤 ${c.name}님이 기다리다 떠났어요`);
        updateDailyChallengeStats('custleft');
      }
    }
    if (removed && G.customers.length===0) showCustEmpty();
    else updatePatBars();
    document.getElementById('custCount').textContent=`(${G.customers.length}명)`;
  }

  checkCafeEligibility();
  checkStageUp();
  if (!_eventBusy) checkStoryEvents();
  if (!_eventBusy && G.day - (G.lastRandomEventDay||0) >= 2 && Math.random()<0.0015) {
    G.lastRandomEventDay = G.day;
    randomEvent();
  }
  if (G.cafeOpen) {
    checkWeatherEvent();
    checkRivalSteal();
    checkQuests();
    checkTrend();
    checkDailyQuest();
    checkSupplyOrder();
    if (!_eventBusy) checkContestTrigger();
    tickContest();
  }
  updateHeader();
  updateTimeDisplay();
}

// ══════════════════════════════════════════
//  SEASONS
// ══════════════════════════════════════════
function advanceSeason() {
  G.seasonIndex=(G.seasonIndex+1)%4;
  const s=SEASONS[G.seasonIndex];
  applySeasonBg();
  showStageAnnounce(null, s.emoji+' '+s.name+' 시작!', '계절이 바뀌었어요! 새로운 메뉴와 작물이 준비됐어요.');
  addLog(`${s.emoji} ${s.name} 시작! 계절 한정 메뉴를 확인하세요`);
  renderAll();
  // 계절 전환 시: 맞지 않는 대회 취소 + 겨울 대회 체크
  cancelContestIfWrongSeason();
  if (G.cafeOpen && s.id === 'winter') {
    setTimeout(() => {
      const triggered = G.triggeredContests || [];
      const xmas = CONTESTS.find(c => c.id === 'xmas_market');
      if (xmas && !triggered.includes('xmas_market') && xmas.triggerStage <= G.stage && !G.contest) {
        addLog('🎄 겨울이 왔어요! 크리스마스 마켓 개최 예정...');
        setTimeout(() => launchContestAnnounce(xmas), 5000);
      }
    }, 3000);
  }
}

function applySeasonBg() {
  const s=SEASONS[G.seasonIndex];
  document.body.style.background=s.bg;
  const badge=document.getElementById('season-badge');
  if (badge) {
    badge.textContent=s.emoji+' '+s.name;
    const colors=[
      {bg:'#fce4ec',border:'#f48fb1',color:'#880e4f'},
      {bg:'#fffde7',border:'#ffb300',color:'#e65100'},
      {bg:'#fff3e0',border:'#e65100',color:'#bf360c'},
      {bg:'#e3f2fd',border:'#5c6bc0',color:'#1a237e'},
    ];
    const c=colors[G.seasonIndex];
    badge.style.cssText=`background:${c.bg};border-color:${c.border};color:${c.color};font-family:'Jua',sans-serif;font-size:12px;padding:5px 12px;border-radius:20px;white-space:nowrap;border:1.5px solid;`;
  }
}

function renderSeasonStrip() {
  const s=SEASONS[G.seasonIndex];
  document.getElementById('seasonEmoji').textContent=s.emoji;
  document.getElementById('seasonName').textContent=s.name;
  document.getElementById('seasonDay').textContent=`Day ${G.seasonDay}/7`;
  const fill=document.getElementById('seasonBar');
  if (fill) { fill.style.width=(G.seasonDay/7*100)+'%'; fill.style.background=s.barColor; }
}

// ══════════════════════════════════════════
//  CAFE ELIGIBILITY
// ══════════════════════════════════════════
function checkCafeEligibility() {
  if (G.cafeOpen) return;
  const total=Object.values(G.inventory).reduce((a,b)=>a+b,0);
  const btn=document.getElementById('open-cafe-btn');
  const desc=document.getElementById('cafe-lock-desc');
  if (total>=20) {
    btn.style.display='block';
    desc.innerHTML='재료가 충분히 모였어요! 카페를 오픈할 수 있어요 🎉';
    if (!G._cafeNotified) {
      G._cafeNotified = true;
      addLog('☕ 재료가 모였어요! 카페탭에서 카페를 오픈할 수 있어요!');
      showNotif('☕ 카페 오픈 준비 완료! 카페탭을 확인하세요 🎉');
    }
  } else {
    btn.style.display='none';
    G._cafeNotified = false;
    desc.innerHTML=`재료를 모으면 카페를 열 수 있어요<br><span style="color:var(--grass);font-size:11px;">현재 창고: ${total}/20개</span>`;
  }
}

function openCafe() {
  G.cafeOpen=true; G.stage=1;
  document.getElementById('cafe-locked').style.display='none';
  document.getElementById('cafe-open').style.cssText='display:flex;flex-direction:column';
  resetSpawnTimer();
  showStageAnnounce(1);
  addLog(`☕ ${G.brandName} 카페 오픈!!`);
  renderAll();
  renderCafeIllustration();
  renderMobIllustration();
}

// ══════════════════════════════════════════
//  STAGE UP
// ══════════════════════════════════════════
function checkStageUp() {
  if (!G.cafeOpen||G.stage>=9) return;
  const next=STAGE_DATA[G.stage+1];
  if (next&&G.reputation>=next.repReq) {
    G.stage++;
    showStageAnnounce(G.stage);
    addLog(`🎊 ${STAGE_DATA[G.stage].name} 달성!`);
    stageUpEffect(G.stage);
    // 단계업 현금 보상
    const stageRewards = [0, 0, 20000, 50000, 100000, 200000, 350000, 500000, 800000, 1500000];
    const reward = stageRewards[G.stage] || 0;
    if (reward > 0) {
      G.money += reward;
      setTimeout(()=>{
        floatReward(`🎊 단계업 보상 +${reward.toLocaleString()}원`, '단계업');
        showNotif(`🎊 ${STAGE_DATA[G.stage].name} 달성! +${reward.toLocaleString()}원 보상!`);
      }, 800);
      addLog(`🎁 단계업 보상: +${reward.toLocaleString()}원`);
    }
    checkForcedContest(G.stage);
    renderCafeIllustration();
    renderMobIllustration();
    if (G.stage===9) {
      setTimeout(()=>{
        showStageAnnounce(null,
          '🏆 전설의 사장님!',
          `🎉 축하합니다, ${G.brandName}!\n작은 농장에서 시작해 전국 프랜차이즈까지!\n당신은 진정한 외식업 레전드예요! 🌟`
        );
        addLog('🏆 축하합니다! 최종 단계 프랜차이즈 달성!!');
        showNotif('🏆 전설의 사장님 탄생! 🎉');
      }, 2500);
    }
    resetSpawnTimer(); renderAll();
  }
}

function toggleMenu(key) {
  if (!G.disabledMenus) G.disabledMenus = [];
  const idx = G.disabledMenus.indexOf(key);
  if (idx === -1) {
    G.disabledMenus.push(key);
    showNotif(`⏸ ${RECIPES[key].name} 판매 중지`);
  } else {
    G.disabledMenus.splice(idx, 1);
    showNotif(`▶ ${RECIPES[key].name} 판매 재개`);
  }
  renderMenu();
}

function showStageAnnounce(stageIdx, customTitle, customSub) {
  queueEvent(() => {
    const el=document.createElement('div'); el.className='stage-announce';
    let emoji,title,sub,boxClass='sa-box';
    if (stageIdx!==null && stageIdx!==undefined) {
      const sd=STAGE_DATA[stageIdx];
      emoji=sd.building; title=sd.name+' 달성!'; sub=sd.desc;
      if (stageIdx >= 9) boxClass='sa-box sa-final';
      else if (stageIdx >= 7) boxClass='sa-box';
    } else {
      emoji='🎉'; title=customTitle; sub=customSub;
    }
    el.innerHTML=`<div class="${boxClass}">
      <div class="sa-emoji" style="animation:saIn 0.5s cubic-bezier(.34,1.56,.64,1);">${emoji}</div>
      <div class="sa-title">${title}</div>
      <div class="sa-sub">${sub}</div>
      <button class="btn btn-gold" style="margin-top:18px;display:block;margin:18px auto 0;" onclick="this.closest('.stage-announce').remove();_eventDone();">계속하기 🚀</button>
    </div>`;
    document.body.appendChild(el);
  });
}

// ══════════════════════════════════════════
//  STORY EVENTS
// ══════════════════════════════════════════
function checkStoryEvents() {
  if (!G.cafeOpen) return;
  if (document.getElementById('storyModal').classList.contains('show')) return;
  if (_eventBusy) return;
  // 마지막 스토리 이벤트 후 최소 3일 쿨다운
  if (G.day - (G.lastStoryEventDay||0) < 3) return;
  // Random rainy day event (low probability)
  if (Math.random()<0.001 && !G.triggeredEvents.has('rainy_day_recent')) {
    G.triggeredEvents.add('rainy_day_recent');
    setTimeout(()=>G.triggeredEvents.delete('rainy_day_recent'), 300000);
    G.lastStoryEventDay = G.day;
    triggerStoryEvent(STORY_EVENTS.find(e=>e.id==='rainy_day'));
    return;
  }
  // Rep-based events — 하나만 발동 후 즉시 리턴
  for (const ev of STORY_EVENTS) {
    if (ev.triggerRep>0 && G.reputation>=ev.triggerRep && !G.triggeredEvents.has(ev.id)) {
      G.triggeredEvents.add(ev.id);
      G.lastStoryEventDay = G.day;
      triggerStoryEvent(ev);
      return;
    }
  }
}

function triggerStoryEvent(ev) {
  if (!ev) return;
  queueEvent(() => {
    document.getElementById('storyModalTitle').textContent=ev.title;
    document.getElementById('storyModalBody').innerHTML=`<p style="font-size:13px;line-height:1.7;color:var(--text);">${ev.text}</p>`;
    document.getElementById('storyModalBtns').innerHTML=ev.choices.map((c,i)=>
      `<button class="btn btn-primary" onclick="resolveStory(${i})" style="flex:1">${c.label}</button>`
    ).join('');
    G.activeStory=ev;
    showModal('storyModal');
  });
}

function resolveStory(choiceIdx) {
  if (!G.activeStory) return;
  const choice=G.activeStory.choices[choiceIdx];
  const r=choice.reward||{};
  if (r.money) G.money=Math.max(0,G.money+r.money);
  if (r.rep) G.reputation=Math.max(0,G.reputation+r.rep);
  G.activeStory=null;
  closeModal('storyModal');
  showNotif('📖 '+choice.msg);
  addLog(`📖 스토리 선택: ${choice.label}`);
  // 보상 플로팅
  if (r.money > 0) floatReward(`📖 💰+${r.money.toLocaleString()}`, '#D4A017');
  if (r.rep > 0)   floatReward(`📖 ⭐+${r.rep}`, '#9b59b6');
  updateHeader(); updateProgressBar();
}

// ══════════════════════════════════════════
//  FARM
// ══════════════════════════════════════════
function plotClick(idx) {
  const p=G.plots[idx];
  if (p.stage==='ready') { harvestPlot(idx); return; }
  if (p.stage==='growing') {
    const sm=G.upgrades.includes('fertilizer')?0.7:1;
    const rem=Math.max(0,Math.ceil(p.growTime*sm-(Date.now()-p.plantedAt)/1000));
    return; // 성장 중 팝업 제거 (밭 클릭마다 떠서 불편)
  }
  openPlantModal(idx);
}

function harvestPlot(idx) {
  const p=G.plots[idx]; if (p.stage!=='ready') return;
  const crop=CROPS[p.crop];
  G.inventory[crop.gives]=(G.inventory[crop.gives]||0)+crop.yield;
  if (!G.harvestedCrops) G.harvestedCrops={};
  G.harvestedCrops[p.crop]=(G.harvestedCrops[p.crop]||0)+1;
  G.plots[idx]={crop:null,plantedAt:null,growTime:null,stage:'empty'};
  addLog(`🎉 ${crop.emoji} ${crop.name} ${crop.yield}개 수확!`);
  // 일일 도전과제: 수확 종류 추적
  updateDailyChallengeStats('harvest', p.crop);
  // 수확 퀘스트 진행
  (G.quests||[]).forEach(q=>{
    if (q.done) return;
    if (q.type==='harvest_crop') { q.current++; if(q.current>=q.goal){q.done=true;if(q.reward.money)G.money+=q.reward.money;if(q.reward.rep)G.reputation+=q.reward.rep;showNotif(`🎯 퀘스트 완료! ${q.desc} → ${q.rewardDesc}`);floatReward(`🎯 ${q.rewardDesc}`,'#8e44ad');} }
  });
  // 플로팅 텍스트 + 사운드
  const plotEls=document.querySelectorAll('#farm-grid .plot');
  if (plotEls[idx]) floatTextAtEl(`${crop.emoji}+${crop.yield}`, plotEls[idx], '#5A8A3C');
  audio.init(); audio.playSfx('harvest');
  checkAchievements();
  checkCafeEligibility(); renderFarm(); renderInventory();
}

function harvestAll() {
  const readyPlots = G.plots.map((p,i)=>({p,i})).filter(({p})=>p.stage==='ready');
  if (readyPlots.length === 0) { return; }
  readyPlots.forEach(({i}) => harvestPlot(i));
}

function showCropEncyclo() {
  const sm = G.upgrades.includes('fertilizer') ? 0.7 : 1;
  const season = SEASONS[G.seasonIndex];
  const seasonHints = {
    spring:['strawb','peach','cream_c'],
    summer:['peach','bean','tomato_c'],
    autumn:['mushroom_c','potato_c','bean'],
    winter:['milk_c','meat_c','sugar_c'],
  };
  const recommended = seasonHints[season.id] || [];

  // 단계별 그룹
  const groups = [
    {label:'🌱 기본 작물', keys:['wheat','sugar_c','milk_c','strawb','peach','bean']},
    {label:'🥚 2단계~', keys:['egg_c']},
    {label:'🥔 4단계~', keys:['potato_c','tomato_c','mushroom_c']},
    {label:'🥩 6단계~', keys:['meat_c','basil_c']},
    {label:'⚫ 8단계~', keys:['truffle_c','cream_c']},
  ];

  let html = `<div style="font-size:11px;color:var(--latte);margin-bottom:10px;">${season.emoji} ${season.name} — 추천 작물에 ✨ 표시</div>`;

  groups.forEach(g => {
    const available = g.keys.filter(k => CROPS[k]);
    if (!available.length) return;
    html += `<div style="font-size:11px;font-weight:700;color:var(--latte);margin:10px 0 5px;">${g.label}</div>`;
    html += `<div style="display:flex;flex-direction:column;gap:4px;">`;
    available.forEach(k => {
      const c = CROPS[k];
      const growSec = Math.round(c.growTime * sm);
      const growLabel = growSec >= 60 ? `${Math.ceil(growSec/60)}분 ${growSec%60 ? growSec%60+'초' : ''}`.trim() : `${growSec}초`;
      const isRec = recommended.includes(k);
      // 현재 심겨있는 수
      const planted = G.plots.filter(p => p.crop === k).length;
      const inInventory = G.inventory[c.gives] || 0;
      html += `
        <div style="display:flex;align-items:center;gap:10px;padding:7px 10px;background:${isRec?'rgba(212,160,23,0.08)':'rgba(107,66,38,0.03)'};border:1px solid ${isRec?'rgba(212,160,23,0.3)':'rgba(107,66,38,0.08)'};border-radius:9px;">
          <div style="font-size:22px;width:28px;text-align:center;">${c.emoji}</div>
          <div style="flex:1;">
            <div style="font-size:12px;font-weight:700;color:var(--espresso);">${c.name}${isRec?' ✨':''}</div>
            <div style="font-size:10px;color:var(--latte);margin-top:1px;">⏱ ${growLabel} &nbsp;·&nbsp; 🌾 ${c.yield}개 수확 &nbsp;·&nbsp; 💰 ${c.cost.toLocaleString()}원</div>
          </div>
          <div style="text-align:right;font-size:10px;color:var(--latte);">
            <div>창고 ${inInventory}개</div>
            ${planted>0?`<div style="color:var(--grass);">재배중 ${planted}칸</div>`:''}
          </div>
        </div>`;
    });
    html += `</div>`;
  });

  if (G.upgrades.includes('fertilizer')) {
    html += `<div style="margin-top:10px;font-size:10px;color:var(--gold);">🌿 비료 적용 중 — 성장 시간 30% 단축된 수치예요</div>`;
  }

  document.getElementById('cropEncycloBody').innerHTML = html;
  showModal('cropEncycloModal');
}

function instantHarvest(idx, cost) {
  const p = G.plots[idx];
  if (!p || p.stage !== 'growing') return;
  if (G.money < cost) {
    showNotif(`💸 돈이 부족해요! (필요: ${cost.toLocaleString()}원)`);
    return;
  }
  G.money -= cost;
  floatReward(`-${cost.toLocaleString()}원`, '즉시수확');
  // 즉시 완료 상태로 만든 뒤 수확
  p.stage = 'ready';
  harvestPlot(idx);
  addLog(`⚡ 즉시 수확! (-${cost.toLocaleString()}원)`);
  audio.init(); audio.playSfx('harvest');
  updateHeader();
}

function toggleAutoHarvest() {
  G.autoHarvestEnabled = !G.autoHarvestEnabled;
  const onOff = G.autoHarvestEnabled ? 'ON' : 'OFF';
  addLog(`🚜 자동수확기 ${onOff}`);
  renderAutoHarvestBtn();
}

function renderAutoHarvestBtn() {
  const on = G.autoHarvestEnabled !== false;
  const owned = G.upgrades.includes('auto_harvest');
  const label = `🚜 자동수확 ${on?'ON':'OFF'}`;
  document.querySelectorAll('.autoHarvestToggleBtn').forEach(btn => {
    btn.textContent = label;
    btn.setAttribute('style', `font-size:11px;padding:3px 8px;background:${on?'var(--grass)':'rgba(107,66,38,0.2)'};color:${on?'white':'var(--soil)'};border-radius:7px;border:none;cursor:pointer;font-family:'Gowun Dodum',sans-serif;font-weight:600;display:${owned?'inline-flex':'none'};`);
  });
}


function openPlantModal(idx) {
  const season = SEASONS[G.seasonIndex];
  document.getElementById('plantModalTitle').textContent = `🌱 밭 ${idx+1}번 — 씨앗 고르기`;
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    document.getElementById('plantModalBody').innerHTML = `
      <p style="font-size:11px;color:var(--latte);margin-bottom:10px;">
        ${season.emoji} 추천: ${season.dayCrops.filter(k=>CROPS[k]).map(k=>CROPS[k].emoji).join(' ')}
      </p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;">
        ${Object.entries(CROPS).map(([k,c]) => {
          const isSeasonal = season.dayCrops.includes(k);
          const noMoney = G.money < c.cost;
          const locked = (c.unlockStage||0) > G.stage;
          if (locked) return `<div style="padding:8px 4px;border-radius:10px;border:1.5px solid rgba(107,66,38,0.12);background:rgba(107,66,38,0.04);opacity:0.4;display:flex;flex-direction:column;align-items:center;gap:3px;">
            <span style="font-size:24px;">${c.emoji}</span>
            <span style="font-size:9px;font-weight:700;color:var(--espresso);">${c.name}</span>
            <span style="font-size:8px;color:var(--latte);">🔒 ${c.unlockStage}단계</span>
          </div>`;
          return `<button onclick="${noMoney?'':` plantCrop(${idx},'${k}')`}"
            style="padding:8px 4px;border-radius:10px;
              border:1.5px solid ${isSeasonal?'#5dade2':'rgba(107,66,38,0.2)'};
              background:${isSeasonal?'rgba(93,173,226,0.1)':'rgba(107,66,38,0.05)'};
              opacity:${noMoney?0.4:1};cursor:${noMoney?'not-allowed':'pointer'};
              display:flex;flex-direction:column;align-items:center;gap:3px;">
            <span style="font-size:24px;">${c.emoji}</span>
            <span style="font-size:9px;font-weight:700;color:var(--espresso);">${c.name}</span>
            <span style="font-size:9px;color:var(--gold);">💰${c.cost}</span>
            <span style="font-size:8px;color:var(--latte);">⏱${c.growTime}초</span>
          </button>`;
        }).join('')}
      </div>`;
  } else {
    document.getElementById('plantModalBody').innerHTML = `
      <p style="font-size:11px;color:var(--latte);margin-bottom:8px;">${season.emoji} ${season.name} 추천 작물: ${season.dayCrops.filter(k=>CROPS[k]).map(k=>CROPS[k].emoji+CROPS[k].name).join(', ')}</p>
      <div class="seed-picker" style="display:grid;grid-template-columns:repeat(2,1fr);gap:5px;">${Object.entries(CROPS).map(([k,c])=>{
        const isSeasonal=season.dayCrops.includes(k);
        const locked=(c.unlockStage||0)>G.stage;
        if (locked) return `<div class="seed-row" style="opacity:0.4;">
          <span style="font-size:22px;">${c.emoji}</span>
          <div class="seed-row-info">
            <div class="seed-row-name">${c.name}</div>
            <div class="seed-row-detail">🔒 ${c.unlockStage}단계 해금</div>
          </div>
        </div>`;
        return `<div class="seed-row" style="${isSeasonal?'border:1.5px solid rgba(93,173,226,0.5);background:rgba(93,173,226,0.07)':''}">
          <span style="font-size:22px;">${c.emoji}</span>
          <div class="seed-row-info">
            <div class="seed-row-name">${c.name}${isSeasonal?' 🌟':''}</div>
            <div class="seed-row-detail">⏱ ${c.growTime}초 · 수확 ${c.yield}개</div>
          </div>
          <span style="font-size:12px;color:var(--gold);font-weight:700;margin-right:6px;">💰${c.cost}</span>
          <button class="btn btn-green btn-sm" ${G.money<c.cost?'disabled':''} onclick="plantCrop(${idx},'${k}')">심기</button>
        </div>`;
      }).join('')}
      </div>`;
  }
  showModal('plantModal');
}

function plantCrop(idx, cropKey) {
  const crop=CROPS[cropKey];
  if (G.money<crop.cost) { showNotif('💰 돈이 부족해요!'); return; }
  G.money-=crop.cost;
  G.plots[idx]={crop:cropKey,plantedAt:Date.now(),growTime:crop.growTime,stage:'growing'};
  closeModal('plantModal');
  addLog(`🌱 ${crop.emoji} ${crop.name} 심기! (${crop.growTime}초 후 수확)`);
  audio.init(); audio.playSfx('plant');
  renderFarm(); updateHeader();
}

// ══════════════════════════════════════════
//  STAFF ACTIONS
// ══════════════════════════════════════════
function hasStaff(id) { return !!G.staff[id]; }

function runStaffActions() {
  if (G.paused) return;

  // MANAGER: identify most-needed ingredients for learned recipes and plant accordingly
  if (hasStaff('manager')) {
    // Find ingredient most lacking
    const needs={};
    G.learnedRecipes.forEach(rk=>{
      const r=RECIPES[rk];
      if (!r||r.stageReq>G.stage) return;
      Object.entries(r.ingredients).forEach(([item,qty])=>{
        const cropKey=Object.keys(CROPS).find(ck=>CROPS[ck].gives===item);
        if (cropKey) needs[cropKey]=(needs[cropKey]||0)+qty;
      });
    });
    // Subtract what we already have
    Object.keys(CROPS).forEach(ck=>{
      const gives=CROPS[ck].gives;
      needs[ck]=Math.max(0,(needs[ck]||0)-(G.inventory[gives]||0));
    });
    // Plant the most needed crop in first empty plot
    const sorted=Object.entries(needs).sort((a,b)=>b[1]-a[1]);
    if (sorted.length>0 && sorted[0][1]>0) {
      const cropKey=sorted[0][0];
      const crop=CROPS[cropKey];
      const emptyIdx=G.plots.findIndex(p=>p.stage==='empty');
      if ((G.inventory[CROPS[cropKey].gives]||0) >= 50) return;
      if (emptyIdx>=0 && G.money>=crop.cost) {
        G.money-=crop.cost;
        G.plots[emptyIdx]={crop:cropKey,plantedAt:Date.now(),growTime:crop.growTime,stage:'growing'};
        addLog(`🧑‍💼 관리자가 부족한 ${crop.emoji}${crop.name} 자동 재배 시작!`);
        renderFarm(); updateHeader();
      }
    }
  }

  // PARTTIME / HEAD_CHEF: auto-serve one customer (피로도 반영)
  const autoServe = hasStaff('head_chef') || hasStaff('parttime');
  if (autoServe && G.cafeOpen && G.customers.length>0) {
    const staffKey = hasStaff('head_chef') ? 'head_chef' : 'parttime';
    // 피로도 체크 — 불가 시 서빙 중단
    if (!staffFatigueEffect(staffKey)) return;
    // Serve the customer with most patience loss (most urgent)
    const sorted=[...G.customers].sort((a,b)=>a.patience-b.patience);
    const target=sorted[0];
    const recipe=RECIPES[target.order];
    // Check if we have ingredients
    const canServe=Object.entries(recipe.ingredients).every(([item,qty])=>(G.inventory[item]||0)>=qty);
    if (canServe) {
      const staffName = hasStaff('head_chef') ? '수석 셰프' : '아르바이트생';
      serveCustomer(target.id, true, staffName);
      // 서빙할 때마다 피로도 +5~8 누적
      addStaffFatigue(staffKey, 5 + Math.floor(Math.random()*4));
    }
  }
  // 관리자 피로도 누적 (매 staffTimer 호출)
  if (hasStaff('manager')) addStaffFatigue('manager', 3);
}

// ══════════════════════════════════════════
//  CUSTOMERS
// ══════════════════════════════════════════
function spawnCustomer(force) {
  const maxCustBonus = getInteriorBonus('maxCust');
  const maxCust = 6 + Math.round(maxCustBonus);
  if (!force && (G.paused||!G.cafeOpen||G.customers.length>=maxCust)) return;
  if (G.paused||!G.cafeOpen) return;
  // 날씨 손님 수 제한 (팝업 강제 소환 시 우회)
  if (!force && G.weather) {
    const wLimit={blizzard:3,rain:4,heatwave:6,festival:6}[G.weather.id];
    if (wLimit && G.customers.length>=wLimit) return;
    if ((G.weather.id==='blizzard'&&Math.random()<0.5)||(G.weather.id==='rain'&&Math.random()<0.3)) return;
  }
  const disabled=G.disabledMenus||[];
  const avail=Object.keys(RECIPES).filter(k=>{
    const r=RECIPES[k];
    if (r.stageReq>G.stage||!G.learnedRecipes.includes(k)) return false;
    if (r.season&&r.season!==SEASONS[G.seasonIndex].id) return false;
    if (disabled.includes(k)) return false;
    if (G.weather?.id==='heatwave'&&['latte','americano','autumn_latte','winter_choco'].includes(k)) return false;
    return true;
  });
  const fallback=Object.keys(RECIPES).filter(k=>RECIPES[k].stageReq<=G.stage&&G.learnedRecipes.includes(k)&&!RECIPES[k].season&&!disabled.includes(k));
  let pool=avail.length>0?avail:fallback;
  if (!pool.length) return;
  // 트렌드 메뉴 가중치
  if (G.trendMenu&&pool.includes(G.trendMenu)) pool=[...pool,G.trendMenu,G.trendMenu];
  // 날씨 메뉴 선호도 가중치
  if (G.weather && WEATHER_MENU_PREF[G.weather.id]) {
    const pref = WEATHER_MENU_PREF[G.weather.id];
    const prefList = pref.warm || pref.cold || [];
    const mult = Math.round(pref.mult);
    prefList.filter(k=>pool.includes(k)).forEach(k=>{
      for (let i=1;i<mult;i++) pool.push(k);
    });
  }

  const orderKey=pool[Math.floor(Math.random()*pool.length)];
  const pool2=pool.filter(k=>k!==orderKey&&!RECIPES[k].isCombo&&!RECIPES[k].isGift);
  const orderKey2=(Math.random()<0.25&&pool2.length>0&&!RECIPES[orderKey].isCombo&&!RECIPES[orderKey].isGift)
    ?pool2[Math.floor(Math.random()*pool2.length)]:null;

  let custType='normal';
  const roll=Math.random(); let cum=0;
  // SNS 홍보 대회 효과: 블로거 출현율 3배
  const snsBoost = G._contestSNS ? 3 : 1;
  // 인테리어 모던 테마: VIP 스폰 +10%
  const vipInteriorBonus = getInteriorBonus('vipBonus');
  for (const [tid,td] of Object.entries(SPECIAL_TYPES)) {
    let chance = tid==='blogger' ? td.spawnChance*snsBoost : td.spawnChance;
    if (tid==='vip') chance = Math.min(0.25, chance + vipInteriorBonus);
    cum+=chance; if (roll<cum){custType=tid;break;}
  }

  const typeData=SPECIAL_TYPES[custType];
  const weatherPatBonus=G.weather?.id==='rain'?20:0;
  const interiorPatBonus=getInteriorBonus('patBonus');
  const cust={
    id:Date.now()+Math.random(),
    name:CUST_NAMES[Math.floor(Math.random()*CUST_NAMES.length)],
    emoji:typeData?typeData.emoji:CUST_EMOJIS[Math.floor(Math.random()*CUST_EMOJIS.length)],
    order:orderKey, order2:orderKey2,
    patience:Math.min(100,100+(typeData?.patBonus||0)+weatherPatBonus+interiorPatBonus),
    type:custType,
  };
  G.customers.push(cust);
  const recipe=RECIPES[orderKey];
  const r2=orderKey2?RECIPES[orderKey2]:null;
  addLog(`${cust.emoji} ${cust.name}님 방문 — ${recipe.emoji}${recipe.name}${r2?` + ${r2.emoji}${r2.name}`:''} 주문`);
  appendCustCard(cust);
  document.getElementById('custCount').textContent=`(${G.customers.length}명)`;
  updateServeAllBtn();
}

function appendCustCard(c) {
  const list=document.getElementById('customerList');
  list.querySelector('.cust-empty')?.remove();
  const td=SPECIAL_TYPES[c.type];
  const typeClass=td?c.type:'';
  const tag=td?`<span class="cust-tag ${td.tag}">${td.label}</span>`:'';
  // 단골 뱃지
  const regData=G.regulars?.[c.name];
  const regVisits=regData?.visits||0;
  const regBadge=regVisits>=5?`<span style="font-size:9px;background:rgba(233,30,140,0.15);color:#e91e8c;padding:1px 4px;border-radius:4px;margin-left:2px;">🥰단골${regVisits}회</span>`:'';
  const favMenu = regData?.favMenu && RECIPES[regData.favMenu];
  const favBadge = favMenu && regVisits>=5 ? `<span style="font-size:9px;background:rgba(212,160,23,0.15);color:var(--gold);padding:1px 4px;border-radius:4px;margin-left:2px;" title="단골 선호 메뉴">${favMenu.emoji}단골</span>` : '';
  const r1=RECIPES[c.order];
  const r2=c.order2?RECIPES[c.order2]:null;
  const orderBadge1=r1.isCombo?'<span style="font-size:8px;background:#e67e22;color:white;padding:1px 4px;border-radius:4px;margin-left:2px;">콤보</span>':r1.isGift?'<span style="font-size:8px;background:#9b59b6;color:white;padding:1px 4px;border-radius:4px;margin-left:2px;">선물</span>':'';
  const div=document.createElement('div');
  div.className=`cust-card ${typeClass}`; div.setAttribute('data-cid',c.id);
  div.innerHTML=`
    <span class="cust-avatar">${c.emoji}</span>
    <div class="cust-info">
      <div class="cust-name">${c.name}${tag}${regBadge}${favBadge}</div>
      <div class="cust-order">${r1.emoji} ${r1.name}${orderBadge1}${r2?` <span style="color:var(--gold);">+ ${r2.emoji} ${r2.name}</span>`:''}</div>
      <div style="display:flex;align-items:center;gap:4px;">
        <div class="cust-pat-bg" style="flex:1;"><div class="cust-pat-fill" style="width:${c.patience}%;background:var(--grass)"></div></div>
        <span class="patience-text" style="color:${c.patience>60?'var(--grass)':c.patience>30?'var(--gold)':'#e74c3c'}">${Math.round(c.patience)}%</span>
      </div>
    </div>
    <button class="btn btn-green btn-sm" onclick="serveCustomer(${c.id},false,'')">서빙 ✓</button>`;
  list.appendChild(div);
}

function showCustEmpty() {
  const list=document.getElementById('customerList');
  if (!list.querySelector('.cust-empty')) list.innerHTML='<div class="cust-empty">손님을 기다리는 중...</div>';
  updateServeAllBtn();
}

function updatePatBars() {
  G.customers.forEach(c=>{
    const card=document.querySelector(`[data-cid="${c.id}"]`);
    if (!card) return;
    const bar=card.querySelector('.cust-pat-fill');
    if (bar) { bar.style.width=c.patience+'%'; bar.style.background=c.patience>60?'var(--grass)':c.patience>30?'var(--sun)':'#e74c3c'; }
    const pctEl=card.querySelector('.patience-text');
    if (pctEl) {
      pctEl.textContent=Math.round(c.patience)+'%';
      pctEl.style.color=c.patience>60?'var(--grass)':c.patience>30?'var(--gold)':'#e74c3c';
    }
  });
}

function updateServeAllBtn() {
  const has = G.cafeOpen && G.customers.length > 0;
  document.querySelectorAll('.serve-all-btn').forEach(btn => {
    btn.disabled = !has;
    btn.style.opacity = has ? '1' : '0.4';
  });
}

function serveAll() {
  if (!G.cafeOpen || G.customers.length === 0) return;
  let served = 0;
  const ids = [...G.customers].map(c => c.id);
  ids.forEach(id => {
    const c = G.customers.find(x => x.id == id);
    if (!c) return;
    const recipe = RECIPES[c.order];
    let ingr = {...recipe.ingredients};
    if (G.upgrades.includes('espresso_m') && ingr.bean) ingr.bean = Math.max(0, ingr.bean-1);
    if (c.order2) {
      const r2 = RECIPES[c.order2];
      let ingr2 = {...r2.ingredients};
      if (G.upgrades.includes('espresso_m') && ingr2.bean) ingr2.bean = Math.max(0, ingr2.bean-1);
      Object.entries(ingr2).forEach(([item,qty]) => { ingr[item] = (ingr[item]||0) + qty; });
    }
    const canServe = Object.entries(ingr).every(([item,qty]) => (G.inventory[item]||0) >= qty);
    if (canServe) { serveCustomer(id, false, ''); served++; }
  });
  if (served === 0) showNotif('⚠️ 서빙 가능한 손님이 없어요! (재료 부족)');
}

function serveCustomer(custId, isAuto, staffName) {
  const idx=G.customers.findIndex(c=>c.id==custId); if (idx===-1) return;
  const cust=G.customers[idx]; const recipe=RECIPES[cust.order];
  const missing=[];
  let ingr={...recipe.ingredients};
  if (G.upgrades.includes('espresso_m') && ingr.bean) ingr.bean=Math.max(0,ingr.bean-1);
  // order2 재료도 합산 체크
  let ingr2={};
  if (cust.order2) {
    const r2=RECIPES[cust.order2];
    ingr2={...r2.ingredients};
    if (G.upgrades.includes('espresso_m') && ingr2.bean) ingr2.bean=Math.max(0,ingr2.bean-1);
    // 두 주문 재료 합산
    Object.entries(ingr2).forEach(([item,qty])=>{ ingr[item]=(ingr[item]||0)+qty; });
  }
  for (const [item,qty] of Object.entries(ingr)) if ((G.inventory[item]||0)<qty) missing.push(`${ITEMS[item]?.emoji||'?'} ${ITEMS[item]?.name||item} ×${qty-(G.inventory[item]||0)}`);
  if (missing.length) { if (!isAuto) showNotif(`⚠️ 재료 부족: ${missing.join(', ')}`); return; }
  for (const [item,qty] of Object.entries(ingr)) G.inventory[item]-=qty;

  const td=SPECIAL_TYPES[cust.type];
  let price=recipe.price*(td?.moneyMult||1);
  // order2 가격 추가
  if (cust.order2) price+=RECIPES[cust.order2].price*(td?.moneyMult||1);
  if (G.upgrades.includes('premium_mat')) price*=1.15;
  if (hasStaff('head_chef')) price*=1.1;
  // 인테리어 테마 가격 보너스 (럭셔리 +20%)
  const interiorPriceBonus = getInteriorBonus('priceBonus');
  if (interiorPriceBonus > 0) price *= (1 + interiorPriceBonus);
  // 인테리어 디저트 쇼케이스 보너스 (+10%)
  const dessertKeys2 = ['strawb_cake','macaron','waffle','spring_strawb_crepe','macaron','peach_smoothie'];
  if (dessertKeys2.includes(cust.order) && getInteriorBonus('dessertPrice') > 0) price *= (1 + getInteriorBonus('dessertPrice'));
  // 직원 레벨 보너스 (수석 셰프)
  const chefLv=G.staffLevels?.head_chef||1;
  if (hasStaff('head_chef')&&chefLv>1) price*=(1+(chefLv-1)*0.2);
  // 특별 원두 부스터
  const coffeeKeys=['latte','americano','strawb_latte','spring_blossom','summer_ice','autumn_latte','winter_choco','combo_americano_cookie','combo_latte_waffle','combo_cake_latte','peach_tea'];
  if (G.boosters?.bean&&G.day<=G.boosters.bean.endDay&&(coffeeKeys.includes(cust.order)||coffeeKeys.includes(cust.order2))) price*=2;
  // 폭염 - 차가운 음료 수익 2배
  const coldKeys=['peach_tea','peach_smoothie','summer_ice','strawb_latte'];
  if (G.weather?.id==='heatwave'&&(coldKeys.includes(cust.order)||coldKeys.includes(cust.order2))) { price*=2; addLog(`☀️ 폭염 특수! 차가운 음료 수익 2배`); }
  // 장마/폭설 - 따뜻한 음료 수익 1.5배
  const warmKeys=['latte','americano','potato_soup','winter_choco','mushroom_risotto','autumn_latte','spring_blossom','winter_stew'];
  if ((G.weather?.id==='rain'||G.weather?.id==='blizzard')&&(warmKeys.includes(cust.order)||warmKeys.includes(cust.order2))) price*=1.5;
  // 단골 선호 메뉴 보너스
  const favBonus = getFavMenuBonus(cust.name, cust.order);
  if (favBonus.money > 0) price = Math.floor(price * (1 + favBonus.money));

  price=Math.floor(price);
  G.money+=price;
  if (!G.totalMoneyEarned) G.totalMoneyEarned=0;
  G.totalMoneyEarned+=price;

  G.totalServed++;
  // 메뉴별 판매 횟수 기록
  if (!G.menuSoldCount) G.menuSoldCount={};
  G.menuSoldCount[cust.order] = (G.menuSoldCount[cust.order]||0)+1;
  if (cust.order2) G.menuSoldCount[cust.order2] = (G.menuSoldCount[cust.order2]||0)+1;

  // 일일 도전과제 통계 업데이트
  updateDailyChallengeStats('serve');
  updateDailyChallengeStats('earn', price);
  updateDailyChallengeStats('menu', cust.order);
  if (cust.order2) updateDailyChallengeStats('menu', cust.order2);
  if (cust.type==='vip')     updateDailyChallengeStats('vip');
  if (cust.type==='regular') updateDailyChallengeStats('regular');
  if (cust.type==='blogger') updateDailyChallengeStats('blogger');
  if (cust.order2)           updateDailyChallengeStats('combo');

  if (cust.type==='vip') { 
    if(!G.vipServed) G.vipServed=0; G.vipServed++;
    // VIP 특별 연출 강화
    setTimeout(()=>{
      launchStarBurst(['🤩','⭐','💫','✨','💎','👑'], 16);
      launchConfetti(40, ['#FFD700','#FFF44F','#e056fd','#fff','#FFB6C1']);
    }, 200);
    floatReward('👑 VIP 서빙!', 'VIP');
    showNotif(`🤩 VIP 손님 서빙! 명성 2배 획득!`);
  }
  if (cust.type==='regular') {
    // 단골 특별 연출
    setTimeout(()=>{
      launchStarBurst(['💕','❤️','🌸','✨'], 6);
    }, 200);
  }
  const patPct=cust.patience/100;
  let newSat=2+Math.round(patPct*3);
  if (G.upgrades.includes('display')) newSat = Math.min(5, newSat + 0.3);
  if (cust.type==='vip') newSat = Math.min(5, newSat + getInteriorBonus('vipSat'));
  // 소믈리에: VIP + 파인다이닝(stageReq 8+) 손님 만족도 +0.5
  if (hasStaff('sommelier') && (cust.type==='vip' || (RECIPES[cust.order]?.stageReq >= 8))) newSat = Math.min(5, newSat + 0.5);
  // 단골 선호 메뉴 만족도 보너스
  const favB = getFavMenuBonus(cust.name, cust.order);
  if (favB.sat > 0) newSat = Math.min(5, newSat + favB.sat);
  newSat=Math.min(5,newSat);
  G.satisfaction=Math.min(5,(G.satisfaction*(G.totalServed-1)+newSat)/G.totalServed);
  // 일일 도전과제: 만족도 최솟값 트래킹
  updateDailyChallengeStats('sat', G.satisfaction);
  // 별점 2점 이하 트래킹
  if (Math.round(newSat) <= 2) updateDailyChallengeStats('lowstar');
  G.reputation+=Math.round(newSat*(td?.repMult||1)*2.5);

  // 단골 선호 메뉴 갱신
  updateRegularFavMenu(cust.name, cust.order);

  // 도감 업데이트
  if (!G.encyclopedia) G.encyclopedia={};
  G.encyclopedia[cust.order]=true;
  if (cust.order2) G.encyclopedia[cust.order2]=true;

  // 단골 업데이트
  updateRegular(cust.name, cust.order);

  const txt=recipe.reviews[Math.floor(Math.random()*recipe.reviews.length)];
  const isSpecial=cust.type!=='normal';
  G.reviews.unshift({name:cust.name,stars:Math.min(5,Math.round(newSat)),text:txt,special:isSpecial});
  if (G.reviews.length>25) G.reviews.pop();
  // 알림 패널에도 리뷰 추가
  addReviewLog(cust.name, Math.min(5, Math.round(newSat)), txt, isSpecial);

  G.customers.splice(idx,1);
  // 플로팅 텍스트 + 사운드 — 카드 제거 전에 위치 저장
  const custEl=document.querySelector(`[data-cid="${custId}"]`);
  const custRect = custEl ? custEl.getBoundingClientRect() : null;
  const custVisible = custRect && custRect.width > 0 && custRect.top > 0 && custRect.top < window.innerHeight;

  // 표시 기준 좌표 결정 (카페탭: 카드 위치 / 메인·관리탭: mob-cust-list 패널)
  let floatX, floatY;
  if (custVisible) {
    floatX = custRect.left + custRect.width/2 - 20;
    floatY = custRect.top  + custRect.height/2;
  } else {
    const listEl = document.getElementById('mob-cust-list') || document.getElementById('mob-cust-list-manage');
    const listRect = listEl ? listEl.getBoundingClientRect() : null;
    if (listRect && listRect.width > 0 && listRect.top > 0 && listRect.top < window.innerHeight) {
      floatX = listRect.left + listRect.width/2 - 20;
      floatY = listRect.top  + 20;
    } else {
      floatX = window.innerWidth/2 - 40;
      floatY = window.innerHeight * 0.4;
    }
  }

  // 가격 텍스트 (모든 탭 동일)
  floatText(`+💰${price.toLocaleString()}`, floatX, floatY, '#D4A017');

  audio.init(); audio.playSfx('serve'); audio.playSfx('money');

  // 음식 이모지 팡! 연출 (모든 탭 동일)
  const foodEl = document.createElement('div');
  foodEl.style.cssText = `position:fixed;left:${floatX}px;top:${floatY - 20}px;font-size:28px;z-index:500;pointer-events:none;animation:foodPop 0.7s cubic-bezier(.34,1.56,.64,1) forwards;`;
  foodEl.textContent = recipe.emoji;
  document.body.appendChild(foodEl);
  setTimeout(()=>foodEl.remove(), 750);
  custEl?.remove();
  if (G.customers.length===0) showCustEmpty();
  document.getElementById('custCount').textContent=`(${G.customers.length}명)`;
  updateServeAllBtn();  // ← 이 한 줄 추가
  // 트렌드 보너스
  if (G.trendMenu && (cust.order===G.trendMenu||cust.order2===G.trendMenu)) {
    const bonus=Math.round(newSat*3); G.reputation+=bonus;
    addLog(`🔥 유행 메뉴! 명성 +${bonus}`);
  }
  // 퀘스트 진행
  (G.quests||[]).forEach(q=>{
    if (q.done) return;
    if (q.type==='serve_menu'&&(cust.order===q.target||cust.order2===q.target)) q.current++;
    if (q.type==='serve_vip'&&cust.type==='vip') q.current++;
    if (q.type==='serve_blogger'&&cust.type==='blogger') q.current++;
    if (q.type==='serve_regular'&&cust.type==='regular') q.current++;
    if (q.type==='earn_money') q.current+=price;
    if (q.type==='serve_count') q.current++;
    if (q.type==='serve_cold') {
      const coldK=['peach_tea','peach_smoothie','summer_ice','strawb_latte'];
      if (coldK.includes(cust.order)||coldK.includes(cust.order2)) q.current++;
    }
    if (q.type==='sat_high'&&G.satisfaction>=4.0) q.current=1;
    if (!q.done&&q.current>=q.goal) {
      q.done=true;
      if (q.reward.money) G.money+=q.reward.money;
      if (q.reward.rep) G.reputation+=q.reward.rep;
      showNotif(`🎯 퀘스트 완료! ${q.desc} → ${q.rewardDesc}`);
      addLog(`🎯 퀘스트 달성: ${q.desc}`);
      floatReward(`🎯 ${q.rewardDesc}`, '#8e44ad');
      if (q.type==='supply_done') {}
    }
  });
  // 대회 심사위원 서빙 처리
  if (cust.isContestJudge) onContestJudgeServed(cust);
  // 대회 수익 기반 누적
  onContestRevenueServed(price, cust);

  const who=isAuto?`[${staffName}] `:'';
  addLog(`✅ ${who}${cust.name}님 서빙! +${price}원`);
  recordDailyIncome(price);
  renderInventory(); renderReviews(); updateHeader(); updateSatisfaction(); updateProgressBar();
  checkAchievements();
  updateContestBanner();
}

// ══════════════════════════════════════════
//  RECIPES & UPGRADES & STAFF
// ══════════════════════════════════════════
function learnRecipe(key) {
  const r=RECIPES[key];
  if (G.learnedRecipes.includes(key)) return;
  if (r.stageReq>G.stage) { showNotif('카페 단계가 더 높아야 해요!'); return; }
  if (G.money<r.learnCost) { showNotif('💰 돈이 부족해요!'); return; }
  G.money-=r.learnCost; G.learnedRecipes.push(key);
  addLog(`📖 ${r.emoji} ${r.name} 레시피 습득!`);
  renderMenu(); updateHeader();
}

function buyUpgrade(key) {
  const u=UPGRADES[key];
  if (G.upgrades.includes(key)) return;
  if (u.stageReq>G.stage) { showNotif('카페 단계가 더 높아야 해요!'); return; }
  if (G.money<u.cost) { showNotif('💰 돈이 부족해요!'); return; }
  G.money-=u.cost; G.upgrades.push(key);
  if (key==='loyalty') resetSpawnTimer();
  addLog(`🔧 ${u.emoji} ${u.name} 완료!`);
  renderTab('upgrades'); updateHeader();
}

function hireStaff(key) {
  const s=STAFF_DEFS[key];
  if (G.staff[key]) return;
  if (s.stageReq>G.stage) { showNotif('카페 단계가 더 높아야 해요!'); return; }
  if (G.money<s.hireCost) { showNotif('💰 돈이 부족해요!'); return; }
  G.money-=s.hireCost; G.staff[key]=true;
  addLog(`🎉 ${s.emoji} ${s.name} 고용 완료! (일급 ${s.dailyCost}원)`);
  renderTab('staff'); updateHeader();
}

// ══════════════════════════════════════════
//  RANDOM EVENTS
// ══════════════════════════════════════════
function randomEvent() {
  if (!G.cafeOpen) {
    const evts=[
      ()=>{G.money+=5000; addLog('📰 지역 신문 소개! +5,000원');},
      ()=>{G.inventory.sugar=(G.inventory.sugar||0)+10; addLog('🍬 설탕 공급업체 사은품! +10');},
      ()=>{G.inventory.milk=(G.inventory.milk||0)+8; addLog('🥛 유제품 협찬! +8');},
    ];
    evts[Math.floor(Math.random()*evts.length)](); renderInventory(); return;
  }
  const evts=[
    ()=>{G.money+=15000; addLog('📰 지역 신문 소개! +15,000원');},
    ()=>{G.reputation+=300; addLog('📣 SNS 화제! +300 명성');},
    ()=>{G.inventory.sugar=(G.inventory.sugar||0)+30; addLog('🍬 설탕 공급업체 사은품! +30');},
    ()=>{G.inventory.milk=(G.inventory.milk||0)+20; addLog('🥛 유제품 협찬! +20');},
    ()=>{const bonus=Math.floor(Math.random()*10000)+5000; G.money+=bonus; addLog(`🍀 행운의 날! +${bonus}원`);},
    ()=>{
      const items=Object.keys(G.inventory).filter(k=>G.inventory[k]>0);
      if (!items.length) return;
      const item=items[Math.floor(Math.random()*items.length)];
      const was=G.inventory[item];
      G.inventory[item]=was>=20?was-20:0;
      addLog(`🚨 ${ITEMS[item]?.emoji||''} ${ITEMS[item]?.name||item} 품절! -${was>=20?20:was}개`);
      showNotif(`🚨 재료 품절! ${ITEMS[item]?.name||item} 줄었어요`);
      renderInventory();
    },
    ()=>{
      if (G.stage>=2) {
        addLog('🔥 갑작스러운 손님 폭주!'); showNotif('🔥 손님이 갑자기 몰려와요!');
        resetSpawnTimer(1500); setTimeout(()=>resetSpawnTimer(), 30000);
      }
    },
  ];
  evts[Math.floor(Math.random()*evts.length)](); renderInventory();
}

// ══════════════════════════════════════════
//  이름 변경
// ══════════════════════════════════════════
function openRenameModal() {
  document.getElementById('renameInput').value = G.brandName;
  showModal('renameModal');
}

function confirmRename() {
  const v = document.getElementById('renameInput').value.trim();
  if (!v) { showNotif('이름을 입력해주세요!'); return; }
  if (G.money < 50000) { showNotif('💰 돈이 부족해요! (50,000원 필요)'); return; }
  G.money -= 50000;
  G.brandName = v;
  document.getElementById('brandNameDisplay').textContent = v;
  closeModal('renameModal');
  addLog(`✏️ 브랜드 이름이 "${v}"로 변경됐어요!`);
  showNotif(`✨ "${v}" 으로 새 출발!`);
  updateHeader();
}

// ══════════════════════════════════════════
//  날씨 이벤트
// ══════════════════════════════════════════
const WEATHER_EVENTS = [
  {id:'blizzard',emoji:'❄️', name:'폭설',     desc:'손님이 절반으로! 따뜻한 음료가 잘 팔려요.', duration:3},
  {id:'rain',    emoji:'🌧️',name:'장마',     desc:'비가 내려요. 따뜻한 메뉴가 잘 팔려요!',    duration:2},
  {id:'heatwave',emoji:'☀️', name:'폭염',     desc:'차가운 음료 수익이 2배!',                   duration:2},
  {id:'festival',emoji:'🎉', name:'동네 축제',desc:'손님이 폭주해요!',                           duration:2},
  {id:'rush',    emoji:'🔥', name:'손님 폭주',desc:'갑자기 손님이 몰려왔어요!',                  duration:1},
];

// 날씨별 선호 메뉴 (확률 가중치 +)
const WEATHER_MENU_PREF = {
  rain:     { warm:['latte','americano','potato_soup','winter_choco','mushroom_risotto','tomato_pasta','autumn_latte','spring_blossom','winter_stew'], mult:1.5 },
  blizzard: { warm:['latte','americano','potato_soup','winter_choco','mushroom_risotto','winter_stew'], mult:2.0 },
  heatwave: { cold:['peach_tea','peach_smoothie','summer_ice','strawb_latte','strawb_smoothie'], mult:2.0 },
};

const SEASON_WEATHER = {
  spring: ['rain','festival'],          // 봄비, 봄 축제
  summer: ['rain','heatwave','rush'],   // 장마, 폭염, 손님폭주
  autumn: ['festival','rush'],          // 가을 축제, 손님폭주 (쾌청한 가을)
  winter: ['blizzard','rush'],          // 폭설, 손님폭주
};

function checkWeatherEvent() {
  if (G.weather && G.day > G.weather.endDay) {
    addLog(`${G.weather.emoji} ${G.weather.name} 이벤트 종료`);
    G.weather=null; resetSpawnTimer(); updateAllBanners(); return;
  }
  if (!G.weather && Math.random()<0.0015 && G.stage>=1 && G.day - (G.lastWeatherDay||0) >= 4) {
    const seasonId = SEASONS[G.seasonIndex].id;
    const pool = SEASON_WEATHER[seasonId].map(id => WEATHER_EVENTS.find(e=>e.id===id));
    const w = pool[Math.floor(Math.random()*pool.length)];
    G.weather={id:w.id,emoji:w.emoji,name:w.name,endDay:G.day+w.duration};
    G.lastWeatherDay = G.day;
    addLog(`${w.emoji} ${w.name} 발생! ${w.desc}`);
    showNotif(`${w.emoji} ${w.name}! ${w.desc}`);
    if (w.id==='festival'||w.id==='rush') resetSpawnTimer(2000);
    updateAllBanners();
  }
}

// 카페탭 + 모바일 패널 배너 모두 업데이트
// ══════════════════════════════════════════
//  배너 통합 렌더링 — 카페탭·메인·관리탭 동일하게
// ══════════════════════════════════════════
function syncAllBanners() {
  if (!G.cafeOpen) return;

  // ── 배너 HTML 생성 (공통) ──
  function makeBannerHTML(dark) {
    // dark=true: 모바일 어두운 패널용, false: 카페탭 밝은 패널용
    const α = dark ? '0.7' : '1';
    let html = '';

    // 폐업 위기
    if (G.crisisActive) {
      html += `<div style="background:linear-gradient(135deg,#c0392b,#e74c3c);color:white;border-radius:10px;padding:8px 12px;font-size:11px;margin-bottom:4px;animation:contestPulse 1.5s infinite;">
        🚨 <strong>폐업 위기!</strong> 만족도를 2.5 이상으로 올려주세요 <span style="font-size:10px;opacity:0.8;">(${G.crisisDaysLeft}일 남음)</span>
      </div>`;
    }

    // 날씨
    if (G.weather) {
      html += `<div style="background:linear-gradient(135deg,#2980b9,#1a5276);color:white;border-radius:10px;padding:8px 12px;font-size:11px;margin-bottom:4px;display:flex;align-items:center;justify-content:space-between;gap:6px;">
        <div style="display:flex;align-items:center;gap:5px;"><span style="font-size:16px;">${G.weather.emoji}</span> <strong>${G.weather.name}</strong> 진행 중</div>
        <span style="font-size:10px;opacity:0.7;white-space:nowrap;">Day ${G.day} → ${G.weather.endDay}</span>
      </div>`;
    }

    // 납품 주문
    const activeSupply = (G.supplyOrders||[]).filter(o=>!o.done);
    if (activeSupply.length) {
      html += `<div style="background:linear-gradient(135deg,#1a5276,#2e86c1);color:white;border-radius:10px;padding:8px 12px;font-size:11px;margin-bottom:4px;">
        <div style="font-weight:700;margin-bottom:5px;">📦 납품 주문</div>` +
        activeSupply.map(o => {
          const have = G.inventory[o.item]||0;
          const canFill = have >= o.qty;
          const daysLeft = o.failDay - G.day;
          return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;background:rgba(255,255,255,0.1);border-radius:7px;padding:4px 7px;">
            <span style="font-size:16px;">${o.emoji}</span>
            <div style="flex:1;">
              <div style="font-weight:600;">${o.name} <span style="font-size:9px;opacity:0.7;">(${daysLeft}일 남음)</span></div>
              <div style="font-size:9px;opacity:0.8;">${ITEMS[o.item]?.name} ${have}/${o.qty}개 · +${o.reward.toLocaleString()}원 +${o.rep}명성</div>
            </div>
            <button onclick="fulfillSupplyOrder('${o.id}')" ${canFill?'':'disabled'}
              style="background:${canFill?'#27ae60':'rgba(255,255,255,0.2)'};color:white;border:none;border-radius:6px;padding:3px 8px;font-size:10px;cursor:${canFill?'pointer':'not-allowed'};font-family:'Gowun Dodum',sans-serif;font-weight:600;white-space:nowrap;">
              ${canFill?'납품하기':'재료부족'}
            </button>
          </div>`;
        }).join('') + '</div>';
    }

    // 퀘스트
    const activeQ = (G.quests||[]).filter(q=>!q.done);
    if (activeQ.length) {
      html += `<div style="background:linear-gradient(135deg,#6c3483,#8e44ad);color:white;border-radius:10px;padding:8px 12px;font-size:11px;margin-bottom:4px;">
        <div style="font-weight:700;margin-bottom:4px;">🎯 오늘의 퀘스트</div>` +
        activeQ.map(q => {
          const pct = Math.min(100, Math.round(q.current/q.goal*100));
          return `<div style="margin-bottom:3px;">${q.desc} <span style="opacity:0.7;">(${q.current}/${q.goal})</span>
            <div style="height:3px;background:rgba(255,255,255,0.2);border-radius:2px;margin-top:2px;">
              <div style="height:100%;width:${pct}%;background:#F4C430;border-radius:2px;"></div>
            </div>
            <span style="font-size:9px;opacity:0.7;">보상: ${q.rewardDesc}</span>
          </div>`;
        }).join('') + '</div>';
    }

    // 트렌드
    if (G.trendMenu && RECIPES[G.trendMenu]) {
      const r = RECIPES[G.trendMenu];
      html += `<div style="background:linear-gradient(135deg,#c0392b,#e74c3c);color:white;border-radius:10px;padding:7px 12px;font-size:11px;margin-bottom:4px;">
        🔥 <strong>트렌드</strong>: ${r.emoji} ${r.name} <span style="font-size:10px;opacity:0.8;">(명성 보너스!)</span>
      </div>`;
    }

    // 경쟁 가게
    if (G.rival?.active) {
      html += `<div style="background:linear-gradient(135deg,#2c3e50,#4a4a4a);color:white;border-radius:10px;padding:7px 12px;font-size:11px;margin-bottom:4px;">
        🏪 <strong>경쟁 가게 활성</strong> <span style="font-size:10px;opacity:0.7;">(Lv.${G.rival.level} — 손님을 뺏길 수 있어요)</span>
      </div>`;
    }

    return html;
  }

  // ── 카페탭 storyBannerArea ──
  const area = document.getElementById('storyBannerArea');
  if (area) {
    // 대회 배너는 updateContestBanner()가 관리하므로 보존
    Array.from(area.children)
      .filter(el => !el.classList.contains('contest-banner'))
      .forEach(el => el.remove());
    area.insertAdjacentHTML('afterbegin', makeBannerHTML(false));
  }

  // ── 모바일 배너 영역 ──
  ['mob-story-banner-farm', 'mob-story-banner-manage'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = makeBannerHTML(true);
  });

  // 대회 배너 동기화
  if (typeof updateContestBanner === 'function') updateContestBanner();

  // 일일 도전과제 배너 동기화
  const dcBanner = document.getElementById('dailyChallengeBanner');
  if (dcBanner && G.cafeOpen) {
    dcBanner.style.display = 'block';
    renderDailyChallengeBanner();
  }
}

function updateAllBanners() {
  syncAllBanners();
}

function updateMobEventBanners() {
  ['mob-event-banner-farm','mob-event-banner-manage'].forEach(id=>{
    const el=document.getElementById(id); if (!el) return;
    Array.from(el.children).filter(c=>!c.classList.contains('contest-banner')).forEach(c=>c.remove());
    const appendBanner = html => el.insertAdjacentHTML('beforeend', html);

    // 폐업 위기 (최우선)
    if (G.crisisActive) appendBanner(`<div style="background:rgba(192,57,43,0.7);border-radius:7px;padding:5px 8px;font-size:11px;color:white;margin-bottom:5px;animation:contestPulse 1.5s infinite;">🚨 <strong>폐업 위기!</strong> 만족도를 올려주세요 (${G.crisisDaysLeft}일)</div>`);

    if (G.weather) appendBanner(`<div style="background:rgba(41,128,185,0.5);border-radius:7px;padding:5px 8px;font-size:11px;color:white;margin-bottom:5px;">${G.weather.emoji} <strong>${G.weather.name}</strong> ~Day ${G.weather.endDay}</div>`);

    // 납품 주문
    const activeSupply = (G.supplyOrders||[]).filter(o=>!o.done);
    if (activeSupply.length) {
      appendBanner('<div style="background:rgba(26,82,118,0.6);border-radius:7px;padding:5px 8px;font-size:10px;color:white;margin-bottom:5px;">' +
        '<div style="font-weight:700;margin-bottom:3px;">📦 납품 주문</div>' +
        activeSupply.map(o => {
          const have = G.inventory[o.item]||0;
          const canFill = have >= o.qty;
          const daysLeft = o.failDay - G.day;
          return `<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
            <span>${o.emoji}</span>
            <span style="flex:1;">${o.name} <span style="opacity:0.7;">${have}/${o.qty}개 (${daysLeft}일)</span></span>
            <button onclick="fulfillSupplyOrder('${o.id}')" ${canFill?'':'disabled'}
              style="background:${canFill?'#27ae60':'rgba(255,255,255,0.2)'};color:white;border:none;border-radius:5px;padding:2px 6px;font-size:9px;cursor:${canFill?'pointer':'not-allowed'};font-family:'Gowun Dodum',sans-serif;white-space:nowrap;">
              ${canFill?'납품':'부족'}
            </button>
          </div>`;
        }).join('') +
      '</div>');
    }

    if (G.quests?.length) {
      const active=G.quests.filter(q=>!q.done);
      if (active.length) appendBanner('<div style="background:rgba(108,52,131,0.5);border-radius:7px;padding:5px 8px;font-size:10px;color:white;margin-bottom:5px;"><div style="font-weight:700;margin-bottom:3px;">🎯 퀘스트</div>'+active.map(q=>{const pct=Math.min(100,Math.round(q.current/q.goal*100));return`<div>${q.desc} (${q.current}/${q.goal})<div style="height:3px;background:rgba(255,255,255,0.2);border-radius:2px;margin-top:2px;"><div style="height:100%;width:${pct}%;background:#F4C430;border-radius:2px;"></div></div></div>`;}).join('')+'</div>');
    }
    if (G.trendMenu && RECIPES[G.trendMenu]) appendBanner(`<div style="background:rgba(192,57,43,0.5);border-radius:7px;padding:5px 8px;font-size:10px;color:white;margin-bottom:5px;">🔥 트렌드: ${RECIPES[G.trendMenu].emoji} ${RECIPES[G.trendMenu].name}</div>`);
    if (G.rival?.active) appendBanner(`<div style="background:rgba(0,0,0,0.25);border-radius:7px;padding:5px 8px;font-size:10px;color:rgba(255,248,240,0.7);margin-bottom:5px;">🏪 경쟁 가게 활성 (Lv.${G.rival.level})</div>`);
  });
}

// ══════════════════════════════════════════
//  경쟁 가게 (강화판)
// ══════════════════════════════════════════
const RIVAL_EVENTS = [
  { id:'price_war',   title:'🏷️ 경쟁 가게 가격 할인!',  text:'맞은편 가게가 10% 할인 행사를 시작했어요. 손님들이 흔들리고 있어요!',
    choices:[
      {label:'📣 SNS 홍보로 맞불',    effect(){ G.rival._defBonus=(G.rival._defBonus||0)+0.3; G.reputation+=80;  showNotif('📣 SNS로 맞불 작전! 명성 +80'); addLog('📣 경쟁: SNS 홍보로 대응'); } },
      {label:'⭐ 품질로 정면 승부',    effect(){ G.rival._defBonus=(G.rival._defBonus||0)+0.5; G.satisfaction=Math.min(5,G.satisfaction+0.4); showNotif('⭐ 품질 UP! 만족도 +0.4'); addLog('⭐ 경쟁: 품질로 대응'); } },
    ]},
  { id:'poach_staff', title:'🤝 경쟁 가게가 직원을 스카우트!',
    text:'경쟁 가게가 우리 직원에게 스카우트 제의를 했어요. 어떻게 대응할까요?',
    choices:[
      {label:'💰 급여 인상 (30,000원)', effect(){
        if(G.money>=30000){
          G.money-=30000;
          showNotif('💰 급여 인상! 직원 잔류 확정');
          addLog('💰 경쟁: 급여 인상으로 직원 방어');
        } else {
          showNotif('💰 돈이 부족해요! 직원이 흔들리고 있어요...');
          // 돈 없으면 35% 확률로 이직
          if(Math.random()<0.35) _fireRandomStaff('💸 급여 인상 못 해줬더니');
        }
      }},
      {label:'🎓 성장 기회로 설득', effect(){
        if(Math.random()<0.65){
          showNotif('🎓 직원이 남기로 했어요!');
          addLog('🎓 경쟁: 설득 성공');
        } else {
          _fireRandomStaff('😢 설득 실패로');
        }
      }},
    ]},
  { id:'negative_review', title:'😡 악성 리뷰 공격!', text:'경쟁 가게 팬이 우리 가게에 악성 리뷰를 남겼어요. 명성이 흔들려요!',
    choices:[
      {label:'🤝 정중하게 대응',       effect(){ G.reputation=Math.max(0,G.reputation-50); showNotif('명성 -50... 하지만 품위 있는 대응!'); addLog('😤 경쟁: 악성 리뷰 정중 대응'); } },
      {label:'💬 단골 리뷰로 방어',    effect(){ const regularsCount=Object.values(G.regulars||{}).filter(r=>r.visits>=5).length; const bonus=regularsCount*20; G.reputation+=bonus; showNotif(`🥰 단골 ${regularsCount}명이 응원! +${bonus} 명성`); addLog(`🥰 경쟁: 단골 리뷰 방어 +${bonus}`); } },
    ]},
];

// 경쟁 가게 스카우트로 직원 실제 이탈
function _fireRandomStaff(reason) {
  const hiredKeys = Object.keys(G.staff || {});
  if (!hiredKeys.length) {
    showNotif('😮‍💨 다행히 고용된 직원이 없어서 피해를 면했어요');
    addLog('😮‍💨 경쟁: 직원 없어서 스카우트 무효');
    return;
  }
  // 가장 레벨 낮은 직원이 먼저 이직
  const target = hiredKeys.sort((a,b) =>
    (G.staffLevels?.[a]||1) - (G.staffLevels?.[b]||1)
  )[0];
  const s = STAFF_DEFS[target];
  delete G.staff[target];
  if (G.staffFatigue) delete G.staffFatigue[target];
  addLog(`😢 ${reason} ${s.emoji} ${s.name}이(가) 경쟁 가게로 이직했어요!`);
  showNotif(`😢 ${s.name}이(가) 이직했어요! 다시 고용하세요`);
  // 자동 서빙 타이머 리셋
  resetStaffTimer();
  updateHeader();
  renderStaff();
}

function checkRivalSteal() {
  if (!G.rival) G.rival={active:false,level:0,lastStealDay:0,eventCooldown:0,_defBonus:0};
  // 2단계부터 경쟁 가게 등장 (기존 3단계 → 2단계)
  if (!G.rival.active && G.stage>=2) {
    G.rival.active=true; G.rival.level=1;
    addLog('🏪 맞은편에 경쟁 가게가 오픈했어요!');
    showNotif('🏪 경쟁 가게 등장! 손님을 뺏길 수 있어요!');
    updateAllBanners();
  }
  if (!G.rival.active) return;

  // 레벨 = 단계에 비례, 최대 7 (기존 5 → 7)
  G.rival.level = Math.min(7, Math.floor(G.stage * 0.8));

  // 경쟁 이벤트 (2일에 한 번, 4단계 이상으로 완화 — 더 자주)
  if (G.stage >= 4 && G.day - (G.rival.eventCooldown||0) >= 2 && Math.random() < 0.3) {
    G.rival.eventCooldown = G.day;
    const ev = RIVAL_EVENTS[Math.floor(Math.random()*RIVAL_EVENTS.length)];
    if (!G.triggeredEvents.has('rival_ev_'+ev.id+'_'+G.day)) {
      G.triggeredEvents.add('rival_ev_'+ev.id+'_'+G.day);
      triggerRivalEvent(ev);
      return;
    }
  }

  // 손님 스틸 — 강화된 확률
  const defBonus = G.rival._defBonus || 0;
  const stealChance = Math.max(0, 0.09 * G.rival.level - defBonus * 0.02); // 기존 0.06 → 0.09
  if (G.day - G.rival.lastStealDay >= 1 && Math.random() < stealChance) {
    G.rival.lastStealDay = G.day;
    if (G.customers.length > 0) {
      // 레벨 5+ 에서 최대 3명 스틸 (기존 2명)
      const stealCount = G.rival.level >= 6 ? (Math.random()<0.4 ? 3 : 2)
                       : G.rival.level >= 4 ? (Math.random()<0.4 ? 2 : 1) : 1;
      let stolen = 0;
      for (let s=0; s<stealCount && G.customers.length>0; s++) {
        const idx = Math.floor(Math.random()*G.customers.length);
        const c = G.customers[idx];
        // VIP·단골 저항 확률 40%로 낮춤 (기존 50%)
        if ((c.type==='vip'||c.type==='regular') && Math.random()<0.4) {
          addLog(`💪 ${c.name}님이 경쟁 가게를 거절했어요!`); continue;
        }
        G.customers.splice(idx,1);
        document.querySelector(`[data-cid="${c.id}"]`)?.remove();
        stolen++;
      }
      if (stolen > 0) {
        if (G.customers.length===0) showCustEmpty();
        document.getElementById('custCount').textContent=`(${G.customers.length}명)`;
        G.satisfaction = Math.max(0, G.satisfaction - 0.08 * stolen);
        // 일일 도전과제: 경쟁가게에 손님 뺏긴 횟수
        for (let i=0; i<stolen; i++) updateDailyChallengeStats('rival');
        const msgs = stolen >= 3
          ? ['🏪 경쟁 가게가 손님 3명을 싹쓸이했어요! 😱', '😡 경쟁 가게의 대공세! 손님 3명 이탈']
          : stolen === 2
          ? ['🏪 경쟁 가게가 손님 2명을 연속으로 데려갔어요!','😡 경쟁 가게의 공세가 거세요! 손님 2명 이탈']
          : ['🏪 경쟁 가게가 손님을 데려갔어요!','😠 경쟁 가게에 손님을 뺏겼어요'];
        const msg = msgs[Math.floor(Math.random()*msgs.length)];
        addLog(msg); showNotif(msg);
      }
    }
    if (defBonus > 0) G.rival._defBonus = Math.max(0, defBonus - 0.1);
  }
}

function triggerRivalEvent(ev) {
  queueEvent(() => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `<div class="modal" style="max-width:360px;">
      <div class="modal-title">${ev.title}</div>
      <div class="modal-body"><p style="font-size:13px;line-height:1.7;color:var(--text);">${ev.text}</p></div>
      <div class="modal-btns" style="flex-direction:column;gap:7px;">
        ${ev.choices.map((c,i) => `<button class="btn btn-primary" style="width:100%" onclick="
          window._rivalChoices[${i}]();
          this.closest('.modal-overlay').remove();
          _eventDone();
        ">${c.label}</button>`).join('')}
      </div>
    </div>`;
    window._rivalChoices = ev.choices.map(c => c.effect);
    document.body.appendChild(overlay);
  });
}

// ══════════════════════════════════════════
//  퀘스트
// ══════════════════════════════════════════
// ══════════════════════════════════════════
//  🌱 밭 확장 시스템
// ══════════════════════════════════════════
const FARM_EXPAND_COSTS = [0,0,0,0,0,0,0,0, 50000,80000,120000,160000,200000,260000,330000,400000];
// 인덱스 = 확장 후 슬롯 수 (8→16)

function getFarmExpandCost() {
  return FARM_EXPAND_COSTS[G.plotSlots] ?? null;
}

function expandFarm() {
  if (G.plotSlots >= 16) { showNotif('🌾 밭이 최대 크기예요! (16칸)'); return; }
  const cost = getFarmExpandCost();
  if (cost === null) return;
  if (G.money < cost) { showNotif(`💰 돈이 부족해요! (${cost.toLocaleString()}원 필요)`); return; }
  G.money -= cost;
  G.plotSlots++;
  G.plots.push({crop:null,plantedAt:null,growTime:null,stage:'empty'});
  const cols = G.plotSlots <= 8 ? 4 : G.plotSlots <= 12 ? 4 : 4;
  addLog(`🌱 밭 확장 완료! (${G.plotSlots}칸) -${cost.toLocaleString()}원`);
  showNotif(`🌾 밭이 ${G.plotSlots}칸으로 늘어났어요!`);
  updateHeader(); renderFarm(); renderExpandFarmBtn();
}

function renderExpandFarmBtn() {
  const btn = document.getElementById('expandFarmBtn');
  const lbl = document.getElementById('farmSlotLabel');
  if (!btn) return;
  if (G.plotSlots >= 16) { btn.style.display='none'; return; }
  if (!G.cafeOpen || G.stage < 1) { btn.style.display='none'; return; }
  const cost = getFarmExpandCost();
  btn.style.display = 'inline-flex';
  btn.textContent = `🌱 확장 💰${(cost/10000).toFixed(0)}만`;
  btn.disabled = G.money < cost;
  btn.style.opacity = G.money < cost ? '0.45' : '1';
}

// ══════════════════════════════════════════
//  📦 납품 주문 시스템
// ══════════════════════════════════════════
const SUPPLY_ORDER_DEFS = [
  {id:'so_wheat',  emoji:'🌾', name:'제과점 납품', item:'wheat',  qty:15, reward:25000,  rep:20,  stageReq:1, desc:'제과점에서 밀 15개 요청'},
  {id:'so_strawb', emoji:'🍓', name:'딸기 납품',   item:'strawb', qty:10, reward:30000,  rep:25,  stageReq:2, desc:'아이스크림 가게에서 딸기 10개'},
  {id:'so_bean',   emoji:'🫘', name:'원두 납품',   item:'bean',   qty:12, reward:40000,  rep:30,  stageReq:3, desc:'로스터리에서 원두 12개 요청'},
  {id:'so_milk',   emoji:'🥛', name:'우유 납품',   item:'milk',   qty:15, reward:35000,  rep:25,  stageReq:2, desc:'베이커리에서 우유 15개 요청'},
  {id:'so_egg',    emoji:'🥚', name:'달걀 납품',   item:'egg',    qty:20, reward:30000,  rep:20,  stageReq:1, desc:'식당에서 달걀 20개 요청'},
  {id:'so_tomato', emoji:'🍅', name:'토마토 납품', item:'tomato', qty:10, reward:45000,  rep:35,  stageReq:3, desc:'피자집에서 토마토 10개 요청'},
  {id:'so_mushroom',emoji:'🍄',name:'버섯 납품',   item:'mushroom',qty:8, reward:55000,  rep:40,  stageReq:4, desc:'레스토랑에서 버섯 8개 요청'},
  {id:'so_meat',   emoji:'🥩', name:'고기 납품',   item:'meat',   qty:6,  reward:80000,  rep:50,  stageReq:5, desc:'스테이크 하우스에서 고기 6개'},
  {id:'so_truffle',emoji:'⚫', name:'트러플 납품', item:'truffle',qty:4,  reward:150000, rep:80,  stageReq:7, desc:'파인다이닝에서 트러플 4개 요청'},
  {id:'so_peach',  emoji:'🍑', name:'복숭아 납품', item:'peach',  qty:12, reward:38000,  rep:28,  stageReq:2, desc:'주스 카페에서 복숭아 12개 요청'},
  {id:'so_sugar',  emoji:'🍬', name:'설탕 납품',   item:'sugar',  qty:20, reward:28000,  rep:18,  stageReq:1, desc:'제과점에서 설탕 20개 요청'},
  {id:'so_basil',  emoji:'🌿', name:'허브 납품',   item:'basil',  qty:10, reward:50000,  rep:38,  stageReq:5, desc:'이탈리안 레스토랑에서 허브 10개'},
  {id:'so_cream',  emoji:'🍶', name:'생크림 납품', item:'cream',  qty:8,  reward:60000,  rep:42,  stageReq:5, desc:'디저트 카페에서 생크림 8개 요청'},
  {id:'so_potato', emoji:'🥔', name:'감자 납품',   item:'potato', qty:15, reward:42000,  rep:30,  stageReq:3, desc:'분식집에서 감자 15개 요청'},
];

function checkSupplyOrder() {
  if (!G.cafeOpen || G.stage < 1) return;
  if (G.day - G.supplyOrderDay < 4) return;           // 4일마다 새 주문
  if ((G.supplyOrders||[]).filter(o=>!o.done).length >= 2) return;
  G.supplyOrderDay = G.day;
  const available = SUPPLY_ORDER_DEFS.filter(d => d.stageReq <= G.stage);
  if (!available.length) return;
  const def = available[Math.floor(Math.random()*available.length)];
  const order = { ...def, current:0, done:false, failDay: G.day+7, id: def.id+'_'+G.day };
  if (!G.supplyOrders) G.supplyOrders=[];
  G.supplyOrders.push(order);
  addLog(`📦 납품 요청: ${def.emoji} ${def.desc}! (7일 내)`);
  showNotif(`📦 새 납품 주문! ${def.emoji} ${def.name} — ${def.desc}`);
  renderSupplyOrders();
}

function fulfillSupplyOrder(orderId) {
  const order = (G.supplyOrders||[]).find(o=>o.id===orderId);
  if (!order || order.done) return;
  const have = G.inventory[order.item]||0;
  if (have < order.qty) { showNotif(`⚠️ ${ITEMS[order.item]?.name} ${order.qty}개 필요 (보유: ${have}개)`); return; }
  G.inventory[order.item] -= order.qty;
  G.money += order.reward;
  G.totalMoneyEarned += order.reward;
  G.reputation += order.rep;
  order.done = true;
  updateDailyChallengeStats('supply');
  addLog(`📦 납품 완료! ${order.emoji} ${order.name} +${order.reward.toLocaleString()}원 +${order.rep}명성`);
  showNotif(`📦 납품 성공! 💰+${order.reward.toLocaleString()}원 ⭐+${order.rep}명성`);
  floatText(`📦+${order.reward.toLocaleString()}`, window.innerWidth/2-60, window.innerHeight/3, '#27ae60');
  // 납품 퀘스트 진행
  (G.quests||[]).forEach(q=>{
    if (q.done||q.type!=='supply_done') return;
    q.current++;
    if (q.current>=q.goal) { q.done=true; if(q.reward.money)G.money+=q.reward.money; if(q.reward.rep)G.reputation+=q.reward.rep; showNotif(`🎯 퀘스트 완료! ${q.desc}`); floatReward(`🎯 +보상!`,'#8e44ad'); }
  });
  updateHeader(); renderInventory(); renderSupplyOrders();
  checkAchievements();
}

function checkSupplyOrderExpiry() {
  if (!G.supplyOrders?.length) return;
  let changed=false;
  G.supplyOrders.forEach(o=>{
    if (!o.done && G.day > o.failDay) {
      o.done=true; o.failed=true;
      G.reputation=Math.max(0,G.reputation-20);
      addLog(`❌ 납품 기한 초과: ${o.emoji} ${o.name} — 명성 -20`);
      showNotif(`❌ 납품 기한 초과! ${o.emoji} ${o.name}`);
      changed=true;
    }
  });
  if (changed) { updateHeader(); renderSupplyOrders(); }
}

function renderSupplyOrders() {
  syncAllBanners();
}

// ══════════════════════════════════════════
//  🚨 폐업 위기 시스템
// ══════════════════════════════════════════
function checkBusinessCrisis() {
  if (!G.cafeOpen || G.stage < 2) return;
  // 만족도 2.0 미만이 3일 이상 지속 → 위기 발동
  if (G.satisfaction < 2.0) {
    G.lowSatDays = (G.lowSatDays||0) + 1;
  } else {
    G.lowSatDays = 0;
    if (G.crisisActive) {
      G.crisisActive = false;
      addLog('✅ 위기 극복! 카페가 안정됐어요');
      showNotif('✅ 폐업 위기 극복! 잘 하셨어요 👏');
      updateAllBanners();
    }
    return;
  }
  if (G.lowSatDays >= 3 && !G.crisisActive && !G.triggeredEvents.has('crisis_'+G.day)) {
    G.crisisActive = true;
    G.crisisDay = G.day;
    G.crisisDaysLeft = 5;
    G.triggeredEvents.add('crisis_'+G.day);
    triggerCrisisEvent();
  }
  if (G.crisisActive) {
    G.crisisDaysLeft = Math.max(0, 5-(G.day-G.crisisDay));
    if (G.crisisDaysLeft <= 0) {
      // 위기 해소 실패 → 명성 & 돈 대폭 감소
      const repPenalty = Math.round(G.reputation * 0.2);
      const moneyPenalty = Math.round(G.money * 0.15);
      G.reputation = Math.max(0, G.reputation - repPenalty);
      G.money = Math.max(0, G.money - moneyPenalty);
      G.crisisActive = false;
      G.lowSatDays = 0;
      addLog(`😰 폐업 위기 해소 실패! 명성 -${repPenalty}, 돈 -${moneyPenalty.toLocaleString()}원`);
      showNotif(`😰 위기 미해소... 명성 -${repPenalty}, 돈 -${moneyPenalty.toLocaleString()}원`);
      updateHeader(); updateAllBanners();
    }
  }
}

function triggerCrisisEvent() {
  queueEvent(() => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `<div class="modal" style="max-width:380px;">
      <div class="modal-title" style="color:#c0392b;">🚨 폐업 위기!</div>
      <div class="modal-body">
        <p style="font-size:13px;line-height:1.8;color:var(--text);">
          손님 만족도가 너무 낮아요! 소문이 나쁘게 퍼지고 있어요.<br>
          <strong style="color:#c0392b;">5일 안에 만족도 2.5 이상</strong>으로 올리지 않으면<br>
          명성과 수익이 크게 줄어들 수 있어요!
        </p>
        <div style="background:rgba(192,57,43,0.08);border-radius:10px;padding:10px;font-size:12px;margin-top:6px;">
          💡 <strong>위기 탈출 방법</strong><br>
          • 손님에게 빠르게 서빙하기<br>
          • 인테리어 소품으로 만족도 올리기<br>
          • 버프 탭의 팝업 이벤트 활용
        </div>
      </div>
      <div class="modal-btns">
        <button class="btn btn-danger" onclick="this.closest('.modal-overlay').remove();_eventDone();" style="width:100%">😤 극복해보겠어요!</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    updateAllBanners();
  });
}

// 위기 배너 updateAllBanners에 통합
function _getCrisisBannerHtml() {
  if (!G.crisisActive) return '';
  return `<div class="crisis-banner" style="background:linear-gradient(135deg,#c0392b,#e74c3c);color:white;border-radius:10px;padding:8px 12px;font-size:12px;margin-bottom:4px;animation:contestPulse 1.5s infinite;">
    🚨 <strong>폐업 위기!</strong> 만족도를 올려주세요 <span style="font-size:10px;opacity:0.8;">(${G.crisisDaysLeft}일 남음)</span>
  </div>`;
}

// ══════════════════════════════════════════
//  🏢 멀티 지점 시스템
// ══════════════════════════════════════════
const BRANCH_DEFS = [
  { id:'branch1', name:'2호점', emoji:'🏠', unlockStage:7, cost:500000,  dailyIncome:15000, dailyRep:10,  desc:'동네에 2호점 오픈! 매일 수익+명성이 들어와요' },
  { id:'branch2', name:'3호점', emoji:'🏪', unlockStage:8, cost:1000000, dailyIncome:30000, dailyRep:20,  desc:'상권에 3호점 오픈! 더 큰 수익을!' },
  { id:'branch3', name:'4호점', emoji:'🏢', unlockStage:9, cost:2000000, dailyIncome:60000, dailyRep:40,  desc:'프랜차이즈 4호점! 전국 진출 완성!' },
];

function openBranch(branchId) {
  const def = BRANCH_DEFS.find(b=>b.id===branchId);
  if (!def) return;
  if (G.stage < def.unlockStage) { showNotif(`🔒 ${def.name}은 ${def.unlockStage}단계 이후 가능해요`); return; }
  if (G.money < def.cost) { showNotif(`💰 돈이 부족해요! (${def.cost.toLocaleString()}원 필요)`); return; }
  if (G.branches.find(b=>b.id===branchId)) { showNotif('이미 오픈한 지점이에요!'); return; }
  G.money -= def.cost;
  G.branches.push({ id:branchId, name:def.name, openDay:G.day, emoji:def.emoji });
  G.branchUnlocked = true;
  addLog(`🏢 ${def.name} 오픈! -${def.cost.toLocaleString()}원`);
  showNotif(`🎉 ${def.name} 그랜드 오픈! 이제 매일 수익이 들어와요!`);
  showStageAnnounce(null, `${def.emoji} ${def.name} 오픈!`, def.desc);
  updateHeader(); renderBranchPanel(); checkAchievements();
}

function tickBranches() {
  // advanceDay 시 호출
  if (!G.branches?.length) return;
  let totalIncome=0, totalRep=0;
  G.branches.forEach(b=>{
    const def = BRANCH_DEFS.find(d=>d.id===b.id);
    if (!def) return;
    totalIncome += def.dailyIncome;
    totalRep    += def.dailyRep;
  });
  if (totalIncome>0) {
    G.money += totalIncome;
    G.totalMoneyEarned += totalIncome;
    G.reputation += totalRep;
    addLog(`🏢 지점 수익: 💰+${totalIncome.toLocaleString()}원 ⭐+${totalRep}명성`);
  }
}

function renderBranchPanel() {
  const el = document.getElementById('tab-branch');
  if (!el) return;
  const opened = G.branches||[];
  el.innerHTML = `
    <div style="font-size:11px;color:var(--latte);margin-bottom:8px;">지점을 늘릴수록 매일 자동으로 수익이 들어와요!</div>
    ${BRANCH_DEFS.map(def=>{
      const isOpen = opened.find(b=>b.id===def.id);
      const locked = G.stage < def.unlockStage;
      const canBuy = !isOpen && !locked && G.money >= def.cost;
      return `<div style="background:${isOpen?'rgba(90,138,60,0.08)':'rgba(107,66,38,0.06)'};border:1.5px solid ${isOpen?'rgba(90,138,60,0.35)':'rgba(200,149,108,0.2)'};border-radius:10px;padding:9px 11px;margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:24px;">${def.emoji}</span>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:13px;">${def.name} ${isOpen?'<span style="font-size:9px;background:var(--grass);color:white;padding:1px 5px;border-radius:5px;">운영중</span>':''}</div>
            <div style="font-size:10px;color:var(--latte);">${def.desc}</div>
            <div style="font-size:10px;color:var(--gold);margin-top:2px;">매일 💰+${def.dailyIncome.toLocaleString()}원 ⭐+${def.dailyRep}명성</div>
          </div>
          ${locked ? `<span style="font-size:10px;color:var(--latte);">🔒 Lv.${def.unlockStage}</span>`
            : isOpen ? `<span style="font-size:11px;color:var(--grass);">✓ 운영중</span>`
            : `<button class="btn btn-gold btn-sm" ${canBuy?'':'disabled'} onclick="openBranch('${def.id}')">💰${(def.cost/10000).toFixed(0)}만</button>`}
        </div>
      </div>`;
    }).join('')}
  `;
}

// ══════════════════════════════════════════
//  💝 단골 손님 선호 메뉴 시스템
// ══════════════════════════════════════════
function updateRegularFavMenu(custName, menuKey) {
  if (!G.regulars?.[custName]) return;
  const r = G.regulars[custName];
  if (!r.menuCount) r.menuCount={};
  r.menuCount[menuKey] = (r.menuCount[menuKey]||0)+1;
  // 가장 많이 주문한 메뉴를 선호 메뉴로
  const fav = Object.entries(r.menuCount).sort((a,b)=>b[1]-a[1])[0]?.[0];
  if (fav && fav !== r.favMenu) {
    r.favMenu = fav;
    if (r.visits >= 5) { // 단골 인정 후에만 로그
      const recipe = RECIPES[fav];
      if (recipe) addLog(`💝 ${custName}님의 단골 메뉴: ${recipe.emoji}${recipe.name}`);
    }
  }
}

function getFavMenuBonus(custName, menuKey) {
  // 단골의 선호 메뉴를 서빙하면 만족도·수익 보너스
  const r = G.regulars?.[custName];
  if (!r || !r.favMenu || r.favMenu !== menuKey || (r.visits||0) < 5) return {sat:0, money:0};
  return {sat:0.3, money:0.1}; // 만족도 +0.3, 가격 +10%
}

// ══════════════════════════════════════════
//  📋 퀘스트 다양화 (30종+)
// ══════════════════════════════════════════
function buildQuestPool() {
  const seasonId = SEASONS[G.seasonIndex].id;
  const learned = G.learnedRecipes.filter(k =>
    RECIPES[k] && RECIPES[k].stageReq <= G.stage &&
    (RECIPES[k].season===null || RECIPES[k].season===seasonId)
  );
  const learnedNoCombo = learned.filter(k=>!RECIPES[k].isCombo&&!RECIPES[k].isGift);
  const comboLearned = learned.filter(k=>RECIPES[k].isCombo);
  const rand = arr => arr[Math.floor(Math.random()*arr.length)];
  const stageScale = Math.max(1, G.stage);

  const pool = [
    // 기본 서빙
    ...(learnedNoCombo.length>0 ? [
      {type:'serve_menu', target:rand(learnedNoCombo), goal:3, current:0, done:false,
       get desc(){ return `${RECIPES[this.target]?.emoji||''} ${RECIPES[this.target]?.name||''} 3개 팔기`; },
       reward:{money:10000*stageScale}, rewardDesc:`💰 +${(10000*stageScale).toLocaleString()}원`},
      {type:'serve_menu', target:rand(learnedNoCombo), goal:5, current:0, done:false,
       get desc(){ return `${RECIPES[this.target]?.emoji||''} ${RECIPES[this.target]?.name||''} 5개 팔기`; },
       reward:{money:18000*stageScale}, rewardDesc:`💰 +${(18000*stageScale).toLocaleString()}원`},
    ] : []),
    // 손님 수 서빙
    {type:'serve_count', goal:5,  current:0, done:false, desc:'손님 5명 서빙',  reward:{rep:30},  rewardDesc:'⭐ 명성 +30'},
    {type:'serve_count', goal:10, current:0, done:false, desc:'손님 10명 서빙', reward:{rep:70, money:5000}, rewardDesc:'⭐+70 💰+5,000'},
    {type:'serve_count', goal:20, current:0, done:false, desc:'손님 20명 서빙', reward:{rep:150, money:15000}, rewardDesc:'⭐+150 💰+15,000'},
    // 수익
    {type:'earn_money', goal:20000,          current:0, done:false, desc:'💰 20,000원 벌기',   reward:{rep:50},   rewardDesc:'⭐ 명성 +50'},
    {type:'earn_money', goal:50000*stageScale,current:0, done:false, desc:`💰 ${(50000*stageScale).toLocaleString()}원 벌기`, reward:{rep:120}, rewardDesc:'⭐ 명성 +120'},
    // VIP
    {type:'serve_vip',    goal:1, current:0, done:false, desc:'VIP 손님 1명 서빙',   reward:{money:8000},  rewardDesc:'💰 +8,000원'},
    {type:'serve_vip',    goal:3, current:0, done:false, desc:'VIP 손님 3명 서빙',   reward:{money:25000}, rewardDesc:'💰 +25,000원'},
    // 특수 손님
    {type:'serve_blogger',goal:1, current:0, done:false, desc:'📸 블로거 손님 서빙',  reward:{rep:100},     rewardDesc:'⭐ 명성 +100'},
    {type:'serve_regular',goal:3, current:0, done:false, desc:'🥰 단골 손님 3명 서빙',reward:{rep:80, money:10000}, rewardDesc:'⭐+80 💰+10,000'},
    // 수확
    {type:'harvest_crop', goal:3, current:0, done:false, desc:'🌾 작물 3번 수확',     reward:{money:8000},  rewardDesc:'💰 +8,000원'},
    {type:'harvest_crop', goal:6, current:0, done:false, desc:'🌾 작물 6번 수확',     reward:{money:18000, rep:20}, rewardDesc:'💰+18,000 ⭐+20'},
    // 날씨 연동
    ...(G.weather?.id==='rain'||G.weather?.id==='blizzard' ? [
      {type:'serve_count', goal:5, current:0, done:false, desc:'🌧️ 궂은 날씨에 손님 5명 서빙', reward:{money:20000, rep:40}, rewardDesc:'💰+20,000 ⭐+40'},
    ] : []),
    ...(G.weather?.id==='heatwave' ? [
      {type:'serve_cold', goal:5, current:0, done:false, desc:'☀️ 차가운 음료 5잔 판매', reward:{money:25000}, rewardDesc:'💰 +25,000원'},
    ] : []),
    // 납품 완료
    {type:'supply_done', goal:1, current:0, done:false, desc:'📦 납품 주문 1건 완료',  reward:{money:15000, rep:30}, rewardDesc:'💰+15,000 ⭐+30'},
    // 연속 서빙 (콤보)
    ...(comboLearned.length>0 ? [
      {type:'serve_menu', target:rand(comboLearned), goal:2, current:0, done:false,
       get desc(){ return `${RECIPES[this.target]?.emoji||''} ${RECIPES[this.target]?.name||''} 2세트 팔기`; },
       reward:{money:20000, rep:30}, rewardDesc:'💰+20,000 ⭐+30'},
    ] : []),
    // 만족도
    {type:'sat_high', goal:1, current:0, done:false, desc:'⭐ 만족도 4.0 이상 유지',  reward:{rep:60},  rewardDesc:'⭐ 명성 +60'},
    // 계절 한정
    ...(learned.filter(k=>RECIPES[k].season===seasonId).length>0 ? [
      {type:'serve_menu', target:rand(learned.filter(k=>RECIPES[k].season===seasonId)), goal:3, current:0, done:false,
       get desc(){ return `${SEASONS[G.seasonIndex].emoji} 계절 메뉴 3개 팔기 (${RECIPES[this.target]?.name||''})`; },
       reward:{money:20000, rep:50}, rewardDesc:'💰+20,000 ⭐+50'},
    ] : []),
  ].filter(Boolean);

  return pool;
}

function checkDailyQuest() {
  if (!G.cafeOpen||G.stage<1) return;
  if (G.day-G.questDay<3) return;
  if (!G.quests) G.quests=[];
  const curSeason=SEASONS[G.seasonIndex].id;
  G.quests=G.quests.filter(q=>{
    if (q.done) return false;
    if (q.type==='serve_menu'&&q.target&&RECIPES[q.target]) {
      const r=RECIPES[q.target];
      if (r.season&&r.season!==curSeason) return false;
    }
    return true;
  });
  if (G.quests.length>=2) return;
  G.questDay=G.day;
  const pool = buildQuestPool();
  if (!pool.length) return;
  const q = pool[Math.floor(Math.random()*pool.length)];
  G.quests.push(q);
  addLog(`🎯 새 퀘스트: ${q.desc}`);
  renderQuestPanel();
}

function checkQuests() { if (G.quests?.length) renderQuestPanel(); }

// ─── 일일 도전과제 시스템 ───────────────────────────────────────
const DAILY_CHALLENGES = [
  // 기존
  {id:'dc_serve10',    desc:'오늘 손님 10명 서빙하기',          check:(s)=>s.servedToday>=10,      reward:{money:5000}},
  {id:'dc_serve15',    desc:'오늘 손님 15명 서빙하기',          check:(s)=>s.servedToday>=15,      reward:{money:8000, rep:30}},
  {id:'dc_earn5k',     desc:'오늘 매출 5,000원 달성',           check:(s)=>s.earnedToday>=5000,    reward:{money:3000}},
  {id:'dc_earn30k',    desc:'오늘 매출 30,000원 달성',          check:(s)=>s.earnedToday>=30000,   reward:{money:12000, rep:40}},
  {id:'dc_earn80k',    desc:'오늘 매출 80,000원 달성',          check:(s)=>s.earnedToday>=80000,   reward:{money:25000, rep:80}},
  {id:'dc_sat45',      desc:'만족도 4.5 이상 유지하기',         check:(s)=>s.minSat>=4.5,          reward:{money:4000}},
  {id:'dc_sat48',      desc:'만족도 4.8 이상 유지하기',         check:(s)=>s.minSat>=4.8,          reward:{money:10000, rep:50}},
  {id:'dc_harvest3',   desc:'작물 3종 이상 수확하기',           check:(s)=>s.harvestTypes>=3,      reward:{money:5000}},
  {id:'dc_harvest8',   desc:'작물 8번 이상 수확하기',           check:(s)=>s.harvestCount>=8,      reward:{money:8000, rep:20}},
  {id:'dc_harvest15',  desc:'작물 15번 이상 수확하기',          check:(s)=>s.harvestCount>=15,     reward:{money:15000, rep:40}},
  {id:'dc_vip',        desc:'VIP 손님 1명 이상 서빙',           check:(s)=>s.vipServed>=1,         reward:{money:8000, rep:50}},
  {id:'dc_vip3',       desc:'VIP 손님 3명 이상 서빙',           check:(s)=>s.vipServed>=3,         reward:{money:20000, rep:100}},
  {id:'dc_noRival',    desc:'경쟁가게에 손님 뺏기지 않기',      check:(s)=>s.rivalSteal===0,       reward:{money:6000}},
  {id:'dc_regular3',   desc:'단골 손님 3명 이상 서빙',          check:(s)=>s.regularServed>=3,     reward:{money:5000}},
  {id:'dc_regular6',   desc:'단골 손님 6명 이상 서빙',          check:(s)=>s.regularServed>=6,     reward:{money:12000, rep:60}},
  {id:'dc_menu3',      desc:'다른 메뉴 3종 이상 판매',          check:(s)=>s.menuVariety>=3,       reward:{money:4000}},
  {id:'dc_menu5',      desc:'다른 메뉴 5종 이상 판매',          check:(s)=>s.menuVariety>=5,       reward:{money:10000, rep:40}},
  {id:'dc_menu7',      desc:'다른 메뉴 7종 이상 판매',          check:(s)=>s.menuVariety>=7,       reward:{money:18000, rep:70}},
  // 신규 — 별점 유지
  {id:'dc_nolow',      desc:'별점 2점 이하 손님 없이 서빙',     check:(s)=>s.servedToday>=5 && s.lowStarCount===0,  reward:{money:12000, rep:60}},
  {id:'dc_allstar',    desc:'모든 손님에게 별점 4점 이상 받기', check:(s)=>s.servedToday>=8 && s.lowStarCount===0,  reward:{money:20000, rep:100}},
  // 신규 — 연속 서빙 콤보
  {id:'dc_combo5',     desc:'콤보 메뉴 5세트 판매',             check:(s)=>s.comboServed>=5,       reward:{money:15000, rep:50}},
  {id:'dc_combo10',    desc:'콤보 메뉴 10세트 판매',            check:(s)=>s.comboServed>=10,      reward:{money:28000, rep:100}},
  // 신규 — 블로거
  {id:'dc_blogger',    desc:'📸 블로거 손님 서빙하기',          check:(s)=>s.bloggerServed>=1,     reward:{rep:150, money:10000}},
  {id:'dc_blogger2',   desc:'📸 블로거 손님 2명 서빙',          check:(s)=>s.bloggerServed>=2,     reward:{rep:300, money:20000}},
  // 신규 — 납품
  {id:'dc_supply',     desc:'📦 납품 주문 1건 완료하기',        check:(s)=>s.supplyDone>=1,        reward:{money:15000, rep:30}},
  // 신규 — 무결점 하루
  {id:'dc_noleave',    desc:'손님이 기다리다 떠나지 않기',       check:(s)=>s.servedToday>=5 && s.custLeft===0, reward:{money:18000, rep:80}},
];

function getDailyChallenge() {
  if (!G.dailyChallenge || G.dailyChallenge.day !== G.day) {
    const idx = G.day % DAILY_CHALLENGES.length;
    G.dailyChallenge = {
      day: G.day,
      id: DAILY_CHALLENGES[idx].id,
      done: false,
      stats: {servedToday:0, earnedToday:0, minSat:999, harvestTypes:0, harvestCount:0, vipServed:0, rivalSteal:0, regularServed:0, menuVariety:0, menus:new Set(), lowStarCount:0, comboServed:0, bloggerServed:0, supplyDone:0, custLeft:0}
    };
  }
  return G.dailyChallenge;
}

function getDailyChallengeObj() {
  const dc = getDailyChallenge();
  return DAILY_CHALLENGES.find(d=>d.id===dc.id) || DAILY_CHALLENGES[0];
}

function updateDailyChallengeStats(type, value) {
  const dc = getDailyChallenge();
  if (dc.done) return;
  const s = dc.stats;
  if (type==='serve')    { s.servedToday=(s.servedToday||0)+1; }
  if (type==='earn')     { s.earnedToday=(s.earnedToday||0)+(value||0); }
  if (type==='sat')      { s.minSat=Math.min(s.minSat||999, value||0); }
  if (type==='harvest')  { s.harvestTypes=new Set((dc.stats._harvestKeys||[])).size; dc.stats._harvestKeys=(dc.stats._harvestKeys||[]); if(!dc.stats._harvestKeys.includes(value)){dc.stats._harvestKeys.push(value);s.harvestTypes=dc.stats._harvestKeys.length;} s.harvestCount=(s.harvestCount||0)+1; }
  if (type==='vip')      { s.vipServed=(s.vipServed||0)+1; }
  if (type==='rival')    { s.rivalSteal=(s.rivalSteal||0)+1; }
  if (type==='regular')  { s.regularServed=(s.regularServed||0)+1; }
  if (type==='menu')     { if(!s.menus.has(value)){s.menus.add(value);s.menuVariety=s.menus.size;} }
  if (type==='lowstar')  { s.lowStarCount=(s.lowStarCount||0)+1; }
  if (type==='combo')    { s.comboServed=(s.comboServed||0)+1; }
  if (type==='blogger')  { s.bloggerServed=(s.bloggerServed||0)+1; }
  if (type==='supply')   { s.supplyDone=(s.supplyDone||0)+1; }
  if (type==='custleft') { s.custLeft=(s.custLeft||0)+1; }
  checkDailyChallenge();
}

function checkDailyChallenge() {
  const dc = getDailyChallenge();
  if (dc.done) return;
  const obj = getDailyChallengeObj();
  if (obj.check(dc.stats)) {
    dc.done = true;
    G.dailyClearTotal = (G.dailyClearTotal||0)+1;
    // 보상 지급
    if (obj.reward.money) { G.money += obj.reward.money; floatReward(`+${obj.reward.money.toLocaleString()}원`, '일일보상'); }
    if (obj.reward.rep)   { G.reputation += obj.reward.rep; floatReward(`+${obj.reward.rep} 명성`, '일일보상'); }
    addLog(`🎉 일일 도전과제 클리어! "${obj.desc}"`);
    showNotif(`🎉 일일 도전과제 클리어! 보상 획득!`);
    launchConfetti(50, ['#4CAF50','#8BC34A','#CDDC39','#fff','#FFD700']);
    checkAchievements();
    renderDailyChallengeBanner();
  }
}

function renderDailyChallengeBanner() {
  const dc = getDailyChallenge();
  const obj = getDailyChallengeObj();
  const el = document.getElementById('dailyChallengeBanner');
  if (!el) return;
  const rewardText = [obj.reward.money?`💰${obj.reward.money.toLocaleString()}원`:'', obj.reward.rep?`⭐${obj.reward.rep}`:''].filter(Boolean).join(' ');
  const contentLight = dc.done
    ? `<div style="color:#4CAF50;font-weight:700;">✅ 오늘의 도전 클리어! <span style="font-size:10px;opacity:0.8;">${obj.desc}</span></div>`
    : `<div><span style="font-weight:700;color:var(--gold);">📅 오늘의 도전</span> <span style="font-size:11px;">${obj.desc}</span> <span style="font-size:10px;opacity:0.7;"> → 보상 ${rewardText}</span></div>`;
  const contentDark = dc.done
    ? `<div style="color:#7CFC00;font-weight:700;">✅ 오늘의 도전 클리어! <span style="font-size:10px;opacity:0.85;">${obj.desc}</span></div>`
    : `<div><span style="font-weight:700;color:#FFD700;">📅 오늘의 도전</span> <span style="font-size:11px;color:rgba(255,255,255,0.9);">${obj.desc}</span> <span style="font-size:10px;color:rgba(255,255,255,0.6);"> → 보상 ${rewardText}</span></div>`;
  el.innerHTML = contentLight;
  el.style.display = 'block';
  // 메인탭·관리탭: 어두운 배경용 글자색
  ['dailyChallengeBannerFarm','dailyChallengeBannerManage'].forEach(id => {
    const el2 = document.getElementById(id);
    if (el2) { el2.style.display = 'block'; el2.innerHTML = contentDark; }
  });
}

function renderQuestPanel() {
  syncAllBanners();
}

// ══════════════════════════════════════════
//  트렌드
// ══════════════════════════════════════════
function checkTrend() {
  if (!G.cafeOpen) return;
  if (G.trendSeason===G.seasonIndex) return;
  if ((G.seasonIndex%2!==0)&&G.trendMenu) return;
  const seasonId = SEASONS[G.seasonIndex].id;
  let cands = G.learnedRecipes.filter(k =>
  RECIPES[k] && RECIPES[k].stageReq<=G.stage && !RECIPES[k].isCombo && !RECIPES[k].isGift
  && k!==G.trendMenu && RECIPES[k].season===null  // 계절 한정 제외
);
// 계절 분위기에 맞는 메뉴 가중치 부여
const seasonHints = {
  spring: ['strawb','peach','cream'],
  summer: ['peach','bean','tomato'],
  autumn: ['mushroom','potato','bean'],
  winter: ['milk','meat','sugar'],
};
  const hints = seasonHints[seasonId] || [];
  const weighted = cands.filter(k =>
    Object.keys(RECIPES[k].ingredients).some(ing => hints.includes(ing))
  );
  if (weighted.length > 0) cands = weighted;
  if (!cands.length) return;
  G.trendSeason=G.seasonIndex;
  G.trendMenu=cands[Math.floor(Math.random()*cands.length)];
  const r=RECIPES[G.trendMenu];
  addLog(`🔥 요즘 유행: ${r.emoji} ${r.name}! 주문이 늘어요`);
  showNotif(`🔥 트렌드 메뉴: ${r.emoji} ${r.name}`);
  renderMenu(); updateAllBanners();
}

// ══════════════════════════════════════════
//  SAVE / LOAD
// ══════════════════════════════════════════
function saveToStorage() {
  // 직렬화 불가 필드 안전 처리
  let safeContest = null;
  if (G.contest) {
    const { _judgeSpawnTimer, _judgeQueue, ...rest } = G.contest;
    safeContest = rest;
  }
  const safeQuests = (G.quests||[]).map(q => ({
    type: q.type, target: q.target||null, goal: q.goal,
    current: q.current, done: q.done, desc: String(q.desc||''),
    reward: q.reward, rewardDesc: q.rewardDesc,
  }));

  // G에서 직렬화 불가 내부 필드 제외하고 복사
  const {
    _lastSavedTime, _cafeNotified, _autoPaused, _contestSNS,
    customers,  // 손님은 저장 불필요 (휘발성)
    ...safeG
  } = G;

  // dailyChallenge의 menus Set 직렬화
  let safeDailyChallenge = null;
  if (G.dailyChallenge) {
    const dc = G.dailyChallenge;
    safeDailyChallenge = {
      ...dc,
      stats: dc.stats ? {
        ...dc.stats,
        menus: dc.stats.menus instanceof Set ? [...dc.stats.menus] : (dc.stats.menus || []),
      } : {}
    };
  }

  const data = {
    ...safeG,
    triggeredEvents: [...(G.triggeredEvents instanceof Set ? G.triggeredEvents : [])],
    contest:        safeContest,
    quests:         safeQuests,
    dailyChallenge: safeDailyChallenge,
    customers: [],
    savedAt:  new Date().toLocaleString(),
    savedTimestamp: Date.now(),
  };

  try {
    localStorage.setItem('farmcafe_v3', JSON.stringify(data));
    updateSaveStatus(true);
  } catch(e) {
    data.contest = null;
    try { localStorage.setItem('farmcafe_v3', JSON.stringify(data)); updateSaveStatus(true); } catch(e2) {
      showNotif('⚠️ 저장 공간이 부족해요!');
    }
  }
}
function saveGame() { saveToStorage(); showNotif('💾 저장 완료!'); closeModal('saveModal'); }

function loadGame() {
  const raw = localStorage.getItem('farmcafe_v3');
  if (!raw) { showNotif('저장 데이터가 없어요!'); return; }
  let d;
  try { d = JSON.parse(raw); } catch(e) {
    showNotif('❌ 저장 데이터가 손상됐어요.');
    localStorage.removeItem('farmcafe_v3');
    showModal('nameModal'); return;
  }

  // 타이머 먼저 전부 정리 (중복 방지)
  clearInterval(tickTimer);  tickTimer  = null;
  clearInterval(spawnTimer); spawnTimer = null;
  clearInterval(staffTimer); staffTimer = null;

  // G 전체를 초기값으로 리셋 후 저장 데이터 덮어쓰기
  G.brandName         = d.brandName         || '내 농장';
  G.money             = d.money             ?? 100000;
  G.reputation        = d.reputation        ?? 0;
  G.day               = d.day               ?? 1;
  G.stage             = d.stage             ?? 0;
  G.cafeOpen          = d.cafeOpen          ?? false;
  G.satisfaction      = d.satisfaction      ?? 0;
  G.totalServed       = d.totalServed       ?? 0;
  G.totalMoneyEarned  = d.totalMoneyEarned  ?? 0;
  G.paused            = false;   // 항상 재개 상태로 시작
  G.secondsPlayed     = d.secondsPlayed     ?? 0;
  G.dayTimer          = d.dayTimer          ?? 0;
  G.seasonIndex       = d.seasonIndex       ?? 0;
  G.seasonDay         = d.seasonDay         ?? 1;
  G.autoHarvestEnabled= d.autoHarvestEnabled ?? true;
  G.trendMenu         = d.trendMenu         ?? null;
  G.trendSeason       = d.trendSeason       ?? -1;
  G.questDay          = d.questDay          ?? 0;
  G.weather           = d.weather           ?? null;
  G.activeStory       = d.activeStory       ?? null;
  G.vipServed         = d.vipServed         ?? 0;
  G.consecutiveStageUp= d.consecutiveStageUp ?? 0;
  G.plotSlots         = d.plotSlots         ?? 8;
  G.supplyOrderDay    = d.supplyOrderDay     ?? 0;
  G.crisisActive      = d.crisisActive      ?? false;
  G.crisisDay         = d.crisisDay         ?? 0;
  G.crisisDaysLeft    = d.crisisDaysLeft    ?? 0;
  G.lowSatDays        = d.lowSatDays        ?? 0;
  G.branchUnlocked    = d.branchUnlocked    ?? false;
  G.dailyClearTotal   = d.dailyClearTotal   ?? 0;
  G.lastStoryEventDay  = d.lastStoryEventDay  ?? 0;
  G.attendStreak      = d.attendStreak      ?? 0;
  G.lastAttendDay     = d.lastAttendDay     ?? 0;
  G.lastRandomEventDay = d.lastRandomEventDay ?? 0;
  G.lastWeatherDay     = d.lastWeatherDay     ?? 0;
  G.totalMoneyEarned       = d.totalEarned       ?? (d.totalMoneyEarned ?? 0);
  // dailyChallenge 복원 (menus array → Set)
  if (d.dailyChallenge) {
    G.dailyChallenge = {
      ...d.dailyChallenge,
      stats: d.dailyChallenge.stats ? {
        ...d.dailyChallenge.stats,
        menus: new Set(Array.isArray(d.dailyChallenge.stats.menus) ? d.dailyChallenge.stats.menus : []),
      } : { menus: new Set() }
    };
  } else {
    G.dailyChallenge = null;
  }

  // 배열/객체 복원
  G.plots          = Array.isArray(d.plots) && d.plots.length > 0 ? d.plots : Array(8).fill(null).map(()=>({crop:null,plantedAt:null,growTime:null,stage:'empty'}));
  // 밭 슬롯 수에 맞게 plots 길이 보정
  while (G.plots.length < (G.plotSlots||8)) G.plots.push({crop:null,plantedAt:null,growTime:null,stage:'empty'});
  G.supplyOrders   = Array.isArray(d.supplyOrders) ? d.supplyOrders : [];
  G.branches       = Array.isArray(d.branches)     ? d.branches     : [];
  G.inventory      = d.inventory      && typeof d.inventory      === 'object' ? d.inventory      : {};
  G.staff          = d.staff          && typeof d.staff          === 'object' ? d.staff          : {};
  G.boosters       = d.boosters       && typeof d.boosters       === 'object' ? d.boosters       : {};
  G.staffLevels    = d.staffLevels    && typeof d.staffLevels    === 'object' ? d.staffLevels    : {};
  G.encyclopedia   = d.encyclopedia   && typeof d.encyclopedia   === 'object' ? d.encyclopedia   : {};
  G.harvestedCrops = d.harvestedCrops && typeof d.harvestedCrops === 'object' ? d.harvestedCrops : {};
  G.regulars       = d.regulars       && typeof d.regulars       === 'object' ? d.regulars       : {};
  G.menuSoldCount  = d.menuSoldCount  && typeof d.menuSoldCount  === 'object' ? d.menuSoldCount  : {};
  G.contestBadges  = d.contestBadges  && typeof d.contestBadges  === 'object' ? d.contestBadges  : {};
  G.rival          = d.rival          && typeof d.rival          === 'object' ? d.rival          : {active:false,level:0,lastStealDay:0};
  G.staffFatigue   = d.staffFatigue   && typeof d.staffFatigue   === 'object' ? d.staffFatigue   : {};
  G.interior       = d.interior       && typeof d.interior       === 'object' ? d.interior       : {theme:null,props:[]};
  G.interiorOwned  = Array.isArray(d.interiorOwned) ? d.interiorOwned : [];
  G._interiorApplied = d._interiorApplied && typeof d._interiorApplied === 'object' ? d._interiorApplied : {};
  G._regDeepSeen    = d._regDeepSeen    && typeof d._regDeepSeen    === 'object' ? d._regDeepSeen    : {};
  G.boosterLog      = d.boosterLog     && typeof d.boosterLog     === 'object' ? d.boosterLog     : {};

  // Set / Array 복원
  G.learnedRecipes    = Array.isArray(d.learnedRecipes)    ? d.learnedRecipes    : ['egg_toast'];
  G.disabledMenus     = Array.isArray(d.disabledMenus)     ? d.disabledMenus     : [];
  G.upgrades          = Array.isArray(d.upgrades)          ? d.upgrades          : [];
  G.achievements      = Array.isArray(d.achievements)      ? d.achievements      : [];
  G.quests            = Array.isArray(d.quests)            ? d.quests            : [];
  G.triggeredContests = Array.isArray(d.triggeredContests) ? d.triggeredContests : [];
  G.contestHistory    = Array.isArray(d.contestHistory)    ? d.contestHistory    : [];
  G.triggeredEvents   = new Set(Array.isArray(d.triggeredEvents) ? d.triggeredEvents : []);
  G.customers         = [];  // 손님은 초기화 (저장 안 됨)
  G.reviews           = Array.isArray(d.reviews) ? d.reviews : [];

  // contest 타이머 초기화
  G.contest = d.contest || null;
  if (G.contest) {
    G.contest._judgeSpawnTimer = null;
    G.contest._judgeQueue      = [];
  }

  closeModal('saveModal');
  boot();
  addLog(`💾 불러오기 완료! (${d.savedAt||''})`);
  G._lastSavedTime = Date.now();
  updateSaveStatus(true);

  // 명성 요구치 변경 대응 — 현재 명성으로 올바른 단계 재계산
  if (G.cafeOpen && G.stage >= 1) {
    let correctStage = 1;
    for (let i = 1; i < STAGE_DATA.length; i++) {
      if (G.reputation >= STAGE_DATA[i].repReq) correctStage = i;
      else break;
    }
    if (correctStage < G.stage) {
      G.stage = correctStage;
      addLog(`⚠️ 명성 기준 변경으로 단계가 ${STAGE_DATA[G.stage].name}(으)로 조정됐어요`);
      renderAll();
    }
  }

  // 오프라인 작물 성장 계산
  applyOfflineCropGrowth(d.savedTimestamp);
}
function applyOfflineCropGrowth(savedTimestamp) {
  if (!savedTimestamp) return;
  const elapsed = (Date.now() - savedTimestamp) / 1000; // 초 단위
  if (elapsed < 10) return; // 10초 미만은 무시

  const sm = G.upgrades.includes('fertilizer') ? 0.7 : 1;
  let grownCount = 0;
  let harvestedCount = 0;

  G.plots.forEach((p, idx) => {
    if (p.stage !== 'growing' || !p.crop || !p.plantedAt) return;
    const crop = CROPS[p.crop];
    if (!crop) return;

    // 오프라인 경과 시간 적용 후 남은 성장 시간 계산
    const totalGrow = p.growTime * sm;
    const alreadyElapsed = (savedTimestamp - p.plantedAt) / 1000;
    const newElapsed = alreadyElapsed + elapsed;

    if (newElapsed >= totalGrow) {
      // 다 자람!
      p.stage = 'ready';
      grownCount++;

      // 자동 수확이 켜져 있으면 바로 수확
      if (G.autoHarvestEnabled) {
        G.inventory[crop.gives] = (G.inventory[crop.gives] || 0) + crop.yield;
        G.plots[idx] = {crop:null, plantedAt:null, growTime:null, stage:'empty'};
        harvestedCount++;
      }
    }
    // 아직 성장 중이면 plantedAt 보정 (경과시간만큼 당겨줌)
    // → 실제로는 이미 plantedAt이 기록되어 있으므로 renderFarm이 알아서 계산
  });

  if (grownCount > 0 || harvestedCount > 0) {
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    const timeStr = mins > 0 ? `${mins}분 ${secs}초` : `${secs}초`;
    const msg = harvestedCount > 0
      ? `🌾 오프라인 ${timeStr} 동안 작물 ${harvestedCount}개 자동 수확됐어요!`
      : `🌱 오프라인 ${timeStr} 동안 작물 ${grownCount}칸이 다 자랐어요! 수확하세요!`;
    addLog(msg);
    setTimeout(() => showNotif(msg), 1000);
    renderFarm();
    renderInventory();
  } else if (elapsed > 30) {
    // 성장 중인 작물이 있었는데 아직 덜 자란 경우도 렌더 갱신
    renderFarm();
  }
}

function exportSave() {
  const d={...G,triggeredEvents:[...G.triggeredEvents],savedAt:new Date().toLocaleString()};
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(d)],{type:'application/json'}));
  a.download=`farmcafe_${G.brandName}.json`; a.click(); showNotif('📥 내보내기 완료!');
}
function importSave() {
  const inp=document.createElement('input'); inp.type='file'; inp.accept='.json';
  inp.onchange=e=>{
    const r=new FileReader(); r.onload=ev=>{
      try {
        const d=JSON.parse(ev.target.result);
        if (!d || !d.day) { showNotif('❌ 올바른 저장 파일이 아니에요'); return; }
        // localStorage에 쓰고 loadGame으로 통일 처리
        localStorage.setItem('farmcafe_v3', ev.target.result);
        loadGame();
        showNotif('✅ 불러오기 완료!');
        closeModal('saveModal');
      }
      catch(e) { showNotif('❌ 파일 오류: ' + e.message); }
    }; r.readAsText(e.target.files[0]);
  }; inp.click();
}
function openSaveModal() {
  const has=!!localStorage.getItem('farmcafe_v3');
  document.getElementById('saveModalBody').innerHTML=`
    <div style="display:flex;flex-direction:column;gap:8px;">
      <button class="btn btn-primary" onclick="saveGame()" style="width:100%">💾 지금 저장 (브라우저)</button>
      ${has?`<button class="btn btn-green" onclick="loadGame()" style="width:100%">📂 저장 불러오기</button>`:''}
      <hr style="border:none;border-top:1px dashed rgba(200,149,108,0.3);margin:2px 0">
      <button class="btn btn-purple" onclick="closeModal('saveModal');showModal('renameModal');document.getElementById('renameInput').value=''" style="width:100%">✏️ 브랜드 이름 변경 (💰50,000원)</button>
      <hr style="border:none;border-top:1px dashed rgba(200,149,108,0.3);margin:2px 0">
      <button class="btn btn-secondary" onclick="exportSave()" style="width:100%">📥 파일로 내보내기</button>
      <button class="btn btn-secondary" onclick="importSave()" style="width:100%">📤 파일에서 불러오기</button>
      ${has?`<button class="btn btn-danger btn-sm" style="width:100%;margin-top:2px" onclick="if(confirm('정말?')){localStorage.removeItem('farmcafe_v3');openSaveModal()}">🗑️ 저장 삭제</button>`:''}
    </div>`; showModal('saveModal');
}

// ══════════════════════════════════════════
//  UI HELPERS
// ══════════════════════════════════════════
function toggleMute() {
  audio.init();
  const muted = audio.toggle();
  const btn = document.getElementById('muteBtn');
  if (btn) btn.textContent = muted ? '🔇' : '🔊';
  const mobIcon = document.getElementById('mob-mute-icon');
  if (mobIcon) mobIcon.textContent = muted ? '🔇' : '🔊';
  const mobBtn = document.getElementById('mbt-mute');
  if (mobBtn) mobBtn.querySelector('.mbt-l').textContent = muted ? '음소거' : '소리';
  showNotif(muted ? '🔇 음소거' : '🔊 소리 켜짐');
}

function togglePause() {
  G.paused=!G.paused;
  document.getElementById('pauseLabel').textContent=G.paused?'재개':'일시정지';
  // 모바일 버튼 동기화
  var mi=document.getElementById('mob-pause-icon');
  var ml=document.getElementById('mob-pause-label');
  if (mi) mi.textContent=G.paused?'▶':'⏸';
  if (ml) ml.textContent=G.paused?'재개':'일시정지';
  showNotif(G.paused?'⏸ 일시정지':'▶ 재개');
}

// 브라우저 백그라운드 → 자동 일시정지
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    if (!G.paused) { G.paused=true; G._autoPaused=true; }
  } else {
    if (G.paused && G._autoPaused) { G.paused=false; G._autoPaused=false; }
  }
});

const LOGS=[];
function addLog(msg) {
  LOGS.unshift({ type: 'log', text: msg });
  if (LOGS.length > 6) LOGS.pop();
  _renderLogEntries();
}

function addReviewLog(name, stars, text, isSpecial) {
  LOGS.unshift({ type: 'review', name, stars, text, special: isSpecial });
  if (LOGS.length > 6) LOGS.pop();
  _renderLogEntries();
}

function _renderLogEntries() {
  const el = document.getElementById('logEntries');
  if (!el) return;
  el.innerHTML = LOGS.map((l, i) => {
    if (l.type === 'review') {
      const stars = '🩵'.repeat(l.stars) + '🤍'.repeat(5 - l.stars);
      const badge = l.special ? ' ✨' : '';
      return `<div class="log-entry log-review${i > 0 ? ' log-old' : ''}">
        <span class="log-rv-badge">💬${badge}</span>
        <span class="log-rv-stars">${stars}</span>
        <span class="log-rv-text">"${l.text}"</span>
        <span class="log-rv-name">— ${l.name}</span>
      </div>`;
    }
    return `<div class="log-entry${i > 0 ? ' log-old' : ''}">${l.text}</div>`;
  }).join('');
}

// 알림 스택 관리
const _notifStack = [];
const NOTIF_GAP = 48;
const NOTIF_MARGIN = 8;

// 헤더 높이를 CSS 변수로 실시간 추적
(function() {
  function updateHeaderHeight() {
    var h = document.querySelector('header');
    if (h) {
      document.documentElement.style.setProperty('--notif-top', (h.offsetHeight + NOTIF_MARGIN) + 'px');
    }
  }
  document.addEventListener('DOMContentLoaded', updateHeaderHeight);
  window.addEventListener('resize', updateHeaderHeight);
  if (document.readyState !== 'loading') updateHeaderHeight();
  setTimeout(function() {
    var h = document.querySelector('header');
    if (h && window.ResizeObserver) {
      new ResizeObserver(updateHeaderHeight).observe(h);
    }
    updateHeaderHeight();
  }, 100);
})();

function _getNotifTopStart() {
  var val = getComputedStyle(document.documentElement).getPropertyValue('--notif-top');
  return parseInt(val) || 70;
}

function _updateNotifPositions() {
  const topStart = _getNotifTopStart();
  _notifStack.forEach((el, i) => {
    el.style.top = (topStart + i * NOTIF_GAP) + 'px';
  });
}

function showNotif(msg) {
  const el = document.createElement('div');
  el.className = 'notif';
  el.textContent = msg;
  el.style.top = (_getNotifTopStart() + _notifStack.length * NOTIF_GAP) + 'px';
  document.body.appendChild(el);
  _notifStack.push(el);
  setTimeout(() => {
    el.remove();
    const idx = _notifStack.indexOf(el);
    if (idx > -1) _notifStack.splice(idx, 1);
    _updateNotifPositions();
  }, 2600);
}
// ══════════════════════════════════════════
//  이벤트 큐 시스템 — 모달/스테이지 알림을 한 번에 하나씩
// ══════════════════════════════════════════
const _eventQueue = [];
let _eventBusy = false;

// 큐에 이벤트 추가
function queueEvent(fn) {
  _eventQueue.push(fn);
  _flushEventQueue();
}

// 큐 소비
function _flushEventQueue() {
  if (_eventBusy) return;
  if (_eventQueue.length === 0) return;
  _eventBusy = true;
  const fn = _eventQueue.shift();
  fn();
}

// 이벤트가 끝났음을 큐에 알림 (모달 닫힐 때, 스테이지 announce 닫힐 때 호출)
function _eventDone() {
  _eventBusy = false;
  setTimeout(_flushEventQueue, 350); // 닫히는 애니메이션 후 다음 실행
}

function showModal(id) {
  document.getElementById(id).classList.add('show');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
  _eventDone(); // 모달 닫히면 다음 큐 이벤트 실행
}
function updateTimeDisplay() {
  const m=Math.floor(G.secondsPlayed/60).toString().padStart(2,'0');
  const s=(G.secondsPlayed%60).toString().padStart(2,'0');
  document.getElementById('game-time').textContent=`${m}:${s}`;
}

// TABS
let currentTab='staff';
function switchTab(tab) {
  currentTab=tab;
  document.querySelectorAll('.tab-btn').forEach((b,i)=>{
    const tabs=['staff','upgrades','interior','branch','booster','achieve','recipebook','encyclo','stats'];
    b.classList.toggle('active',tabs[i]===tab);
  });
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.getElementById('tab-'+tab)?.classList.add('active');
  renderTab(tab);
}
function renderTab(tab) {
  if (tab==='staff') renderStaff();
  else if (tab==='upgrades') renderUpgrades();
  else if (tab==='interior') renderInteriorPanel();
  else if (tab==='branch') renderBranchPanel();
  else if (tab==='booster') renderBooster();
  else if (tab==='achieve') renderAchievements();
  else if (tab==='recipebook') renderRecipeBook();
  else if (tab==='encyclo') renderEncyclopedia();
  else if (tab==='stats') renderStats();
}

// ══════════════════════════════════════════
//  RENDER
// ══════════════════════════════════════════
function renderAll() {
  updateHeader(); renderSeasonStrip(); renderFarm(); renderInventory();
  renderExpandFarmBtn();
  if (G.cafeOpen) { renderCafeInfo(); renderMenu(); renderCustomers(); updateAllBanners(); renderQuestPanel(); renderSupplyOrders(); }
  else checkCafeEligibility();
  renderTab(currentTab); renderReviews();
  applySeasonBg();
  applyInteriorTheme();
}

function updateHeader() {
  document.getElementById('moneyDisplay').textContent=G.money.toLocaleString();
  document.getElementById('repDisplay').textContent=G.reputation.toLocaleString();
  document.getElementById('dayDisplay').textContent=G.day;
  document.getElementById('stageBadge').textContent=STAGE_DATA[G.stage].name;
  document.getElementById('brandIcon').textContent=STAGE_DATA[G.stage].building;
  const roadmap = document.getElementById('stageRoadmap');
  if (roadmap) {
    roadmap.innerHTML = STAGE_DATA.map((s, i) => {
      const done    = G.cafeOpen && i < G.stage;
      const current = (G.cafeOpen && i === G.stage) || (!G.cafeOpen && i === 0);
      const locked  = (!G.cafeOpen && i > 0) || (G.cafeOpen && i > G.stage);
      return `<div style="display:flex;align-items:center;gap:6px;font-size:11px;
        opacity:${locked?0.3:1};font-weight:${current?700:400};
        color:${current?'var(--espresso)':'var(--soil)'};">
        <span>${done?'✅':current?'▶️':'⬜'}</span>
        <span>${s.name}</span>
        ${current?'<span style="font-size:9px;background:var(--gold);color:white;padding:1px 6px;border-radius:8px;margin-left:auto;">현재</span>':
          !done&&!locked?`<span style="font-size:9px;color:var(--latte);margin-left:auto;">${s.repReq.toLocaleString()}</span>`:''}
      </div>`;
    }).join('');
  }
}

function renderFarm() {
  const sm=G.upgrades.includes('fertilizer')?0.7:1;
  const slots = G.plotSlots||8;
  const cols = slots <= 8 ? 4 : slots <= 12 ? 4 : 4;
  const grid = document.getElementById('farm-grid');
  if (grid) grid.style.gridTemplateColumns=`repeat(${cols},1fr)`;
  document.getElementById('farm-grid').innerHTML=G.plots.slice(0,slots).map((p,i)=>{
    if (p.stage==='empty') return `<div class="plot empty" onclick="plotClick(${i})"><span style="font-size:13px;color:rgba(255,255,255,0.5)">+</span><div class="plot-label">빈 밭</div></div>`;
    const crop=CROPS[p.crop];
    if (p.stage==='ready') return `<div class="plot ready" onclick="plotClick(${i})" title="클릭 → 즉시 수확!">${crop.emoji}<div class="plot-label">수확!</div></div>`;
    const elapsed=(Date.now()-p.plantedAt)/1000;
    const remSec = Math.max(0, Math.ceil(p.growTime*sm - elapsed));
    const remLabel = remSec >= 60 ? `${Math.ceil(remSec/60)}분` : `${remSec}초`;
    return `<div class="plot growing" onclick="plotClick(${i})" title="${crop.name} — ${remLabel} 후 수확" data-plotidx="${i}" style="justify-content:center;gap:4px;">
      <div style="font-size:20px;line-height:1;">${crop.emoji}</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.9);font-weight:700;padding-bottom:18px;">${remLabel}</div>
    </div>`;
  }).join('');
  // 즉시수확 버튼: HTML 문자열 대신 DOM으로 직접 삽입 (따옴표 충돌 완전 방지)
  document.querySelectorAll('#farm-grid .plot.growing').forEach(function(el) {
    var i = parseInt(el.dataset.plotidx);
    var p = G.plots[i];
    if (!p || p.stage !== 'growing') return;
    var crop = CROPS[p.crop];
    var cost = Math.round(crop.cost * 0.5 / 100) * 100 || 500;
    var costLabel = cost >= 10000 ? Math.round(cost/1000)+'천' : cost.toLocaleString();
    var btn = document.createElement('button');
    btn.textContent = '⚡' + costLabel;
    btn.style.cssText = 'position:absolute;bottom:3px;left:50%;transform:translateX(-50%);font-size:9px;padding:1px 6px;background:rgba(212,160,23,0.9);color:#fff;border:none;border-radius:4px;cursor:pointer;line-height:1.5;z-index:2;white-space:nowrap;';
    (function(idx, c){ btn.addEventListener('click', function(e){ e.stopPropagation(); instantHarvest(idx, c); }); })(i, cost);
    el.appendChild(btn);
  });

  // 모두수확 버튼 상태
  const harvestBtn = document.getElementById('harvestAllBtn');
  if (harvestBtn) {
    const hasReady = G.plots.some(p => p.stage === 'ready');
    harvestBtn.disabled = !hasReady;
    harvestBtn.style.opacity = hasReady ? '1' : '0.4';
  }
}


// ── 긴급 주문 ──
const EMERGENCY_ITEMS = [
  {key:'wheat',  stageReq:0},
  {key:'sugar',  stageReq:0},
  {key:'egg',    stageReq:1},
  {key:'milk',   stageReq:1},
  {key:'strawb', stageReq:1},
  {key:'bean',   stageReq:3},
  {key:'peach',  stageReq:3},
  {key:'potato', stageReq:3},
  {key:'tomato', stageReq:3},
  {key:'mushroom',stageReq:5},
  {key:'meat',   stageReq:5},
  {key:'basil',  stageReq:5},
  {key:'cream',  stageReq:7},
  {key:'truffle',stageReq:7},
];
const EMERGENCY_MAX = 3;
const EMERGENCY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24시간
const EMERGENCY_QTY = 5;

function getEmergencyPriceMult() {
  // 단계가 높을수록 긴급주문이 더 비쌈 (3배 → 최대 6배)
  const stageMult = [3, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6, 6];
  return stageMult[G.stage] || 3;
}
function getTodayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
}

function getEmergencyLog() {
  try {
    const raw = localStorage.getItem('emergencyLog');
    const data = raw ? JSON.parse(raw) : {};
    const today = getTodayKey();
    return data[today] || 0;
  } catch(e) { return 0; }
}

function saveEmergencyLog(count) {
  try {
    const today = getTodayKey();
    localStorage.setItem('emergencyLog', JSON.stringify({[today]: count}));
  } catch(e) {}
}

function getEmergencyRemaining() {
  return Math.max(0, EMERGENCY_MAX - getEmergencyLog());
}

function getEmergencyResetTime() {
  // 오늘 자정까지 남은 시간
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0, 0, 0);
  const ms = midnight - now;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return { h, m, ms };
}

// ── 단기 부스터 사용 횟수 제한 (게임 day 기준, 1일 5회) ──
const BOOSTER_MAX_PER_DAY = 5;

function getBoosterLog(key) {
  if (!G.boosterLog) G.boosterLog = {};
  const entry = G.boosterLog[key];
  if (!entry || entry.day !== G.day) return 0;
  return entry.count || 0;
}

function saveBoosterLog(key, count) {
  if (!G.boosterLog) G.boosterLog = {};
  G.boosterLog[key] = { day: G.day, count };
}

function getBoosterRemaining(key) {
  return Math.max(0, BOOSTER_MAX_PER_DAY - getBoosterLog(key));
}


function openEmergencyModal() {
  const available = EMERGENCY_ITEMS.filter(e => e.stageReq <= G.stage);
  const remaining = getEmergencyRemaining();
  const { h, m } = getEmergencyResetTime();
  let nextRefill = remaining < EMERGENCY_MAX
    ? `<div style="font-size:10px;color:var(--latte);margin-top:3px;">🕐 ${h}시간 ${m}분 남음</div>` : '';
  let html = `<div style="font-size:12px;color:var(--latte);margin-bottom:10px;">
    오늘 남은 횟수: <b style="color:${remaining>0?'var(--grass)':'#c0392b'}">${remaining}회</b> / ${EMERGENCY_MAX}회
    ${nextRefill}
    <div style="font-size:11px;margin-top:3px;opacity:0.7;">재료 ${EMERGENCY_QTY}개 · 시장가 ${getEmergencyPriceMult()}배</div>
  </div>`;
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';
  available.forEach(e => {
    const item = ITEMS[e.key];
    const crop = Object.values(CROPS).find(c => c.gives === e.key);
    const basePrice = crop ? Math.round(crop.cost / crop.yield) : 500;
    const price = basePrice * getEmergencyPriceMult() * EMERGENCY_QTY;
    const canAfford = G.money >= price;
    const canOrder = canAfford && remaining > 0;
    html += `<button onclick="emergencyOrder('${e.key}')"
      style="background:${canOrder?'rgba(59,31,15,0.08)':'rgba(0,0,0,0.03)'};border:1.5px solid ${canOrder?'rgba(212,160,23,0.4)':'rgba(200,149,108,0.2)'};
      border-radius:10px;padding:8px 6px;cursor:${canOrder?'pointer':'not-allowed'};opacity:${canOrder?1:0.45};
      font-family:'Gowun Dodum',sans-serif;text-align:center;"
      ${!canOrder?'disabled':''}>
      <div style="font-size:18px;">${item.emoji}</div>
      <div style="font-size:11px;font-weight:700;color:var(--espresso);">${item.name} ×${EMERGENCY_QTY}</div>
      <div style="font-size:10px;color:#c0392b;margin-top:2px;">💰 ${price.toLocaleString()}원</div>
    </button>`;
  });
  html += '</div>';
  document.getElementById('emergencyModalBody').innerHTML = html;
  showModal('emergencyModal');
}

function emergencyOrder(itemKey) {
  const remaining = getEmergencyRemaining();
  if (remaining <= 0) { showNotif('⛔ 24시간 내 주문 횟수를 모두 사용했어요!'); return; }
  const item = ITEMS[itemKey];
  const crop = Object.values(CROPS).find(c => c.gives === itemKey);
  const basePrice = crop ? Math.round(crop.cost / crop.yield) : 500;
  const price = basePrice * getEmergencyPriceMult() * EMERGENCY_QTY;
  if (G.money < price) { showNotif('💰 돈이 부족해요!'); return; }
  G.money -= price;
  G.inventory[itemKey] = (G.inventory[itemKey] || 0) + EMERGENCY_QTY;
  saveEmergencyLog(getEmergencyLog() + 1);
  addLog(`🚚 주문: ${item.emoji} ${item.name} ×${EMERGENCY_QTY} (-${price.toLocaleString()}원)`);
  showNotif(`🚚 ${item.emoji} ${item.name} ×${EMERGENCY_QTY} 도착!`);
  closeModal('emergencyModal');
  renderInventory();
}


function renderInventory() {
  const el = document.getElementById('inventoryInline');
  if (!el) return;
  // 긴급주문 뱃지 업데이트
  const badge = document.getElementById('emergencyBadge');
  const statusEl = document.getElementById('emergencyStatus');
  if (badge) {
    const rem = getEmergencyRemaining();
    badge.textContent = rem + '회 남음';
    badge.style.opacity = rem > 0 ? '1' : '0.5';
    if (statusEl) {
      if (rem < EMERGENCY_MAX) {
        const { h, m } = getEmergencyResetTime();
        statusEl.textContent = `🕐 ${h}시간 ${m}분 후 초기화`;
      } else {
        statusEl.textContent = '';
      }
    }
  }
  el.innerHTML = Object.entries(ITEMS).map(([k,item]) => {
    const qty = G.inventory[k]||0;
    const cropKey = Object.keys(CROPS).find(ck => CROPS[ck].gives === k);
    const crop = cropKey ? CROPS[cropKey] : null;
    const locked = crop && (crop.unlockStage||0) > G.stage;
    const canPlant = !locked && cropKey && G.money >= crop.cost && G.plots.some(p=>p.stage==='empty');
    const style = canPlant
      ? 'cursor:pointer;border:1.5px solid rgba(90,138,60,0.4);background:rgba(90,138,60,0.08);'
      : '';
    const onclick = canPlant ? `onclick="quickPlant('${cropKey}')"` : '';
    return `<div class="inv-chip" ${onclick} style="${style}" title="${canPlant?crop.name+' 심기':''}">
      <span class="inv-chip-icon">${item.emoji}</span>
      <span class="inv-chip-qty ${qty===0?'low':''}">${qty}</span>
      ${canPlant?'<span style="font-size:8px;color:var(--grass);">+</span>':''}
      ${locked?`<span style="font-size:8px;color:var(--latte);">🔒</span>`:''}
    </div>`;
  }).join('');
  // 재료 부족 경고 — DOM 조작만, 재렌더링 없음
  requestAnimationFrame(checkIngredientWarnings);
}

function quickPlant(cropKey) {
  const crop = CROPS[cropKey];
  if (!crop) return;
  if (G.money < crop.cost) { showNotif('💰 돈이 부족해요!'); return; }
  const emptyIdx = G.plots.findIndex(p=>p.stage==='empty');
  if (emptyIdx < 0) { showNotif('빈 밭이 없어요!'); return; }
  G.money -= crop.cost;
  G.plots[emptyIdx] = {crop:cropKey, plantedAt:Date.now(), growTime:crop.growTime, stage:'growing'};
  addLog(`🌱 ${crop.emoji} ${crop.name} 심기! (${crop.growTime}초 후 수확)`);
  audio.init(); audio.playSfx('plant');
  renderFarm(); renderInventory(); updateHeader();
}

function renderCafeInfo() {
  const sd=STAGE_DATA[G.stage];
  document.getElementById('cafeStageLabel').textContent=sd.name;
  updateSatisfaction(); updateProgressBar();
}
function updateProgressBar() {
  const cur=G.reputation, prev=STAGE_DATA[G.stage].repReq;
  const next=STAGE_DATA[G.stage+1]?.repReq||prev;
  const pct=G.stage>=9?100:Math.min(100,prev===next?100:((cur-prev)/(next-prev))*100);
  document.getElementById('progressFill').style.width=pct+'%';
  document.getElementById('progressText').textContent=G.stage>=9?'🏆 최고 단계!':cur.toLocaleString()+' / '+next.toLocaleString()+' 명성';
}
function updateSatisfaction() {
  const sat=G.satisfaction,full=Math.floor(sat),half=sat%1>=0.5;
  document.getElementById('satStars').textContent='🩵'.repeat(full)+(half?'💙':'')+'🤍'.repeat(Math.max(0,5-full-(half?1:0)));
  document.getElementById('satVal').textContent=sat.toFixed(1);
}

// ══════════════════════════════════════════
//  메뉴 필터
// ══════════════════════════════════════════
let _menuFilter = 'all';
function setMenuFilter(f) {
  _menuFilter = f;
  // 버튼 스타일 업데이트
  ['all','season','combo','gift','unlocked'].forEach(k => {
    const btn = document.getElementById('mf-'+k);
    if (!btn) return;
    const active = k === f;
    btn.style.background = active ? 'var(--espresso)' : 'transparent';
    btn.style.color = active ? 'var(--cream)' : 'var(--soil)';
  });
  renderMenu();
}

function renderMenu() {
  const seasonId=SEASONS[G.seasonIndex].id;
  const f = _menuFilter || 'all';
  document.getElementById('menuGrid').innerHTML=Object.entries(RECIPES).map(([k,r])=>{
    const isSeasonal=r.season!==null;
    const wrongSeason=isSeasonal&&r.season!==seasonId;
    const learned=G.learnedRecipes.includes(k);
    const stageLocked=r.stageReq>G.stage||wrongSeason;
    // 필터 적용
    if (f==='season' && !isSeasonal) return '';
    if (f==='combo' && !r.isCombo) return '';
    if (f==='gift' && !r.isGift) return '';
    if (f==='unlocked' && !learned) return '';
    const canLearn=!learned&&!stageLocked&&G.money>=r.learnCost;
    const disabled=G.disabledMenus.includes(k);
    const ingr=Object.entries(r.ingredients).map(([i,q])=>`${ITEMS[i]?.emoji||'?'}×${q}`).join(' ');
    let cardClass='menu-card';
    if (learned&&!stageLocked&&!disabled) cardClass+=' unlocked';
    else if (learned&&!stageLocked&&disabled) cardClass+=' locked';
    else if (canLearn) cardClass+=' can-learn';
    else if (stageLocked) cardClass+=' locked';
    if (isSeasonal&&!wrongSeason&&!disabled) cardClass+=' seasonal';
    const seasonTag=isSeasonal&&!disabled?`<div style="font-size:9px;color:#2471a3;">${SEASONS.find(s=>s.id===r.season)?.emoji} 한정</div>`:'';
    let action='';
    if (learned&&!stageLocked) {
      action=`<div class="menu-action" style="display:flex;align-items:center;justify-content:space-between;margin-top:3px;">
        <span style="color:${disabled?'var(--latte)':'var(--grass)'};font-size:9px;">${disabled?'⏸ 판매중지':'✓ 판매중'}</span>
        <button onclick="event.stopPropagation();toggleMenu('${k}')" style="font-size:8px;padding:1px 5px;border-radius:5px;border:1px solid ${disabled?'var(--grass)':'#e74c3c'};background:transparent;color:${disabled?'var(--grass)':'#e74c3c'};cursor:pointer;">${disabled?'재개':'중지'}</button>
      </div>`;
    } else if (stageLocked) {
      action=`<div class="menu-action" style="color:var(--latte);">${wrongSeason?'비수기':'🔒 Lv.'+r.stageReq}</div>`;
    } else {
      action=`<div class="menu-action"><button class="menu-learn-btn" onclick="learnRecipe('${k}')">습득 💰${r.learnCost}</button></div>`;
    }
    return `<div class="${cardClass}" ${!learned&&!stageLocked?`onclick="learnRecipe('${k}')"`:''}>
  <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">
    <span style="font-size:15px;${disabled?'filter:grayscale(1);opacity:0.5':''}">${r.emoji}</span>
    <span style="font-size:11px;font-weight:700;flex:1;text-align:left;${disabled?'opacity:0.5':''};">${r.name}${r.isCombo?'<span style="font-size:7px;background:#e67e22;color:white;padding:1px 3px;border-radius:3px;margin-left:2px;vertical-align:middle;">콤보</span>':''}${r.isGift?'<span style="font-size:7px;background:#9b59b6;color:white;padding:1px 3px;border-radius:3px;margin-left:2px;vertical-align:middle;">선물</span>':''}${G.trendMenu===k?'<span style="font-size:7px;background:#e74c3c;color:white;padding:1px 3px;border-radius:3px;margin-left:2px;vertical-align:middle;">🔥유행</span>':''}</span>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:9px;">
    <span style="color:${disabled?'var(--latte)':'var(--grass)'};">${learned&&!stageLocked?(disabled?'판매중지':'💰'+r.price):!stageLocked?'습득 💰'+r.learnCost:''}</span>
    <span style="color:var(--latte);${disabled?'opacity:0.5':''}">${ingr}</span>
  </div>
  ${seasonTag}${action}
</div>`;
  }).join('');
}

function renderCustomers() {
  const list=document.getElementById('customerList');
  list.innerHTML='';
  if (G.customers.length===0) showCustEmpty();
  else G.customers.forEach(c=>appendCustCard(c));
  document.getElementById('custCount').textContent=`(${G.customers.length}명)`;
  updateServeAllBtn();
}

function renderRecipes() {
  const seasonId=SEASONS[G.seasonIndex].id;
  document.getElementById('tab-recipes').innerHTML=Object.entries(RECIPES).map(([k,r])=>{
    const learned=G.learnedRecipes.includes(k);
    const isSeasonal=r.season!==null;
    const wrongSeason=isSeasonal&&r.season!==seasonId;
    const stageLocked=r.stageReq>G.stage||(!G.cafeOpen&&r.stageReq>=1)||wrongSeason;
    const ingr=Object.entries(r.ingredients).map(([i,q])=>`${ITEMS[i]?.emoji||'?'}×${q}`).join(' ');
    const tag=learned?`<span class="rr-tag t-learned">✓ 보유</span>`:
      wrongSeason?`<span class="rr-tag t-seasonal">${SEASONS.find(s=>s.id===r.season)?.emoji} 비수기</span>`:
      stageLocked?`<span class="rr-tag t-lock">🔒 Lv.${r.stageReq}</span>`:
      `<span class="rr-tag t-buy">💰${r.learnCost}</span>`;
    return `<div class="recipe-row ${stageLocked?'r-locked':learned?'r-learned':''} ${isSeasonal&&!wrongSeason?'r-seasonal':''}"
      onclick="${!learned&&!stageLocked?`learnRecipe('${k}')`:''}" >
      <div class="rr-head"><span class="rr-icon">${r.emoji}</span><span class="rr-name">${r.name}</span>${tag}</div>
      <div class="rr-ingr">${ingr} · 판매 ${r.price}원${isSeasonal?' · '+SEASONS.find(s=>s.id===r.season)?.emoji+'한정':''}</div>
    </div>`;
  }).join('');
}

function renderStaff() {
  if (!G.staffLevels) G.staffLevels = {};
  if (!G.staffFatigue) G.staffFatigue = {};
  document.getElementById('tab-staff').innerHTML=Object.entries(STAFF_DEFS).map(([k,s])=>{
    const hired=!!G.staff[k];
    const stageLocked=s.stageReq>G.stage||!G.cafeOpen;
    const lv = G.staffLevels[k] || 1;
    const upgCost = lv * 20000;
    const canUpg = hired && lv < 3 && G.money >= upgCost;
    const lvStars = hired ? '⭐'.repeat(lv) + '☆'.repeat(3-lv) : '';
    const lvDesc = lv===1 ? '' : lv===2 ? ' (효율 +30%)' : ' (효율 +60%)';
    const fatigue = G.staffFatigue[k] || 0;
    const fatigueColor = getFatigueColor(fatigue);
    const fatigueLabel = getFatigueLabel(fatigue);
    const canRest = hired && fatigue >= 40 && G.money >= 10000;
    return `<div class="staff-row ${hired?'hired':''}" style="${hired && fatigue>=90?'border-color:#e74c3c;background:rgba(231,76,60,0.05);':''}">
      <div class="staff-head">
        <span class="staff-icon">${s.emoji}</span>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:5px;">
            <span class="staff-name">${s.name}</span>
            ${hired?`<span style="font-size:11px;letter-spacing:1px;">${lvStars}</span>`:''}
          </div>
          ${hired?`<div style="font-size:10px;color:var(--latte);">Lv.${lv}${lvDesc} · 일급 ${s.dailyCost.toLocaleString()}원</div>`:''}
        </div>
        ${hired ? '' : stageLocked
          ? `<span style="color:var(--latte);font-size:11px;">🔒 Lv.${s.stageReq}</span>`
          : `<button class="btn btn-green btn-sm" onclick="hireStaff('${k}')">고용 💰${s.hireCost.toLocaleString()}</button>`}
      </div>
      <div class="staff-desc">${s.desc}</div>
      ${hired ? `
      <div style="margin-top:5px;">
        <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px;">
          <span style="color:${fatigueColor};font-weight:700;">💪 피로도 ${fatigueLabel}</span>
          <span style="color:var(--latte);">${fatigue}/100</span>
        </div>
        <div style="height:5px;background:rgba(107,66,38,0.12);border-radius:3px;overflow:hidden;margin-bottom:5px;">
          <div style="height:100%;width:${fatigue}%;background:${fatigueColor};border-radius:3px;transition:width 0.5s;"></div>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
        ${fatigue >= 40
          ? `<button class="btn btn-sm" ${canRest?'':'disabled'} onclick="restStaff('${k}')"
              style="background:#3498db;color:white;font-size:11px;">😴 휴식 -10,000원</button>`
          : `<span style="color:var(--grass);font-size:11px;">✓ 재직중</span>`}
        ${lv < 3
          ? `<button class="btn btn-gold btn-sm" ${canUpg?'':'disabled'} onclick="trainStaff('${k}')" style="font-size:11px;">
              🎓 Lv.${lv+1} 교육 💰${upgCost.toLocaleString()}원
            </button>`
          : `<span style="font-size:11px;color:var(--gold);">🏆 최고 레벨!</span>`}
      </div>` : ''}
    </div>`;
  }).join('');
}

function renderUpgrades() {
  // 업그레이드 효과 미리보기 텍스트 생성
  function getUpgPreview(k) {
    if (!G.cafeOpen) return '';
    const previews = {
      fertilizer:  `현재 성장 시간 → 30% 단축 예시: 60초 → 42초`,
      display:     `손님 만족도 현재 ${G.satisfaction.toFixed(1)} → 평균 +10% 향상`,
      espresso_m:  `커피 레시피 원두 소비 1개 절감`,
      loyalty:     `단골 손님 방문 더 자주! 손님 대기 -20%`,
      premium_mat: `모든 메뉴 판매가 +15% 예시: ${Math.round(5000*1.15).toLocaleString()}원`,
      auto_harvest:`익은 작물 자동 수확! 수동 클릭 불필요`,
      pro_kitchen: `조리 메뉴 +10% 예시: 파스타 ${Math.round(13000*1.1).toLocaleString()}원`,
      wine_cellar: `파인다이닝 +20% 예시: 스테이크 ${Math.round(28000*1.2).toLocaleString()}원`,
    };
    return previews[k] ? `<div class="upg-preview">📈 ${previews[k]}</div>` : '';
  }
  document.getElementById('tab-upgrades').innerHTML=Object.entries(UPGRADES).map(([k,u])=>{
    const owned=G.upgrades.includes(k), stageLocked=u.stageReq>G.stage||!G.cafeOpen;
    return `<div class="upg-row">
      <span style="font-size:18px;">${u.emoji}</span>
      <div class="upg-info"><div class="upg-name">${u.name}${owned?' ✓':''}</div><div class="upg-desc">${u.desc}</div>${!owned&&!stageLocked?getUpgPreview(k):''}</div>
      ${owned?`<span style="color:var(--grass);font-size:11px;">${k==='auto_harvest'?`<button class="btn btn-sm autoHarvestToggleBtn" onclick="toggleAutoHarvest()" style="font-size:11px;padding:3px 8px;">🚜 자동수확 ${G.autoHarvestEnabled!==false?'ON':'OFF'}</button>`:'완료'}</span>`:
        stageLocked?`<span style="color:var(--latte);font-size:11px;">🔒</span>`:
        `<button class="btn btn-gold btn-sm" onclick="buyUpgrade('${k}')">💰${u.cost.toLocaleString()}</button>`}
    </div>`;
  }).join('');
}

function renderBooster() {
  if (!G.cafeOpen) {
    document.getElementById('tab-booster').innerHTML='<div style="text-align:center;color:var(--latte);font-size:12px;padding:16px;">카페 오픈 후 이용 가능해요!</div>';
    return;
  }
  if (!G.boosters) G.boosters={};
  if (!G.staffLevels) G.staffLevels={};

  const now = G.day;
  const beanActive   = G.boosters.bean   && now <= G.boosters.bean.endDay;
  const adsActive    = G.boosters.ads    && now <= G.boosters.ads.endDay;
  const staffBActive = G.boosters.staffB && now <= G.boosters.staffB.endDay;

  // 단기 부스터
  const boosters = [
    {key:'bean',   emoji:'☕', name:'특별 원두',    desc:'1일간 커피 메뉴 수익 2배',     cost:30000, stageReq:4, active:beanActive,   endDay:G.boosters.bean?.endDay},
    {key:'ads',    emoji:'📢', name:'SNS 광고',     desc:'1일간 손님 스폰 속도 2배',     cost:20000, stageReq:1, active:adsActive,    endDay:G.boosters.ads?.endDay},
    {key:'popup',  emoji:'🎪', name:'팝업 이벤트',  desc:'즉시 손님 6명 소환',           cost:15000, stageReq:2, active:false,        endDay:null},
    {key:'lucky',  emoji:'🍀', name:'럭키 박스',    desc:'랜덤 보상 (돈/명성/재료)',     cost:2000, stageReq:1, active:false,        endDay:null},
    {key:'staffB', emoji:'🎁', name:'직원 보너스',  desc:'1일간 서빙 속도 2배',          cost:25000, stageReq:1, active:staffBActive, endDay:G.boosters.staffB?.endDay},
  ];

  // 직원 교육
  const staffTraining = Object.entries(STAFF_DEFS).filter(([k])=>G.staff[k]).map(([k,s])=>{
    const lv = G.staffLevels[k]||1;
    const upgCost = lv * 20000;
    const canUpg = lv < 3;
    return {key:k, s, lv, upgCost, canUpg};
  });

  // 직원 교육 섹션 제거 (관리-직원 탭과 중복)
  document.getElementById('tab-booster').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;padding-bottom:3px;border-bottom:1px dashed rgba(200,149,108,0.3);">
      <div style="font-size:11px;font-weight:700;color:var(--espresso);">⚡ 단기 부스터</div>
      <div style="font-size:10px;color:var(--latte);">각 버프 ${BOOSTER_MAX_PER_DAY}회 · 자정 초기화</div>
    </div>
    ${boosters.map(b=>{
      const locked = b.stageReq > G.stage;
      const boosterRem = getBoosterRemaining(b.key);
    const canBuy = !locked && G.money >= b.cost && !b.active && boosterRem > 0;
      return `<div style="display:flex;align-items:center;gap:7px;background:${b.active?'rgba(90,138,60,0.08)':'rgba(107,66,38,0.06)'};border:1.5px solid ${b.active?'rgba(90,138,60,0.3)':'transparent'};border-radius:9px;padding:7px 9px;font-size:12px;margin-bottom:3px;">
        <span style="font-size:18px;">${b.emoji}</span>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:11px;">${b.name}${b.active?` <span style="font-size:9px;color:var(--grass);">~Day ${b.endDay}</span>`:''}</div>
          <div style="font-size:9px;color:var(--latte);">${b.desc}</div>
        </div>
        ${b.active
          ? `<span style="font-size:10px;color:var(--grass);">활성중</span>`
          : locked
            ? `<span style="font-size:10px;color:var(--latte);">🔒 ${b.stageReq}단계</span>`
            : `<button class="btn btn-gold btn-sm" onclick="activateBooster('${b.key}')" ${canBuy?'':'disabled'}>💰${b.cost.toLocaleString()} <span style='font-size:9px;opacity:0.8;'>(${boosterRem}회)</span></button>`
        }
      </div>`;
    }).join('')}
  `;
}

function activateBooster(key) {
  if (!G.boosters) G.boosters={};
  const remaining = getBoosterRemaining(key);
  if (remaining <= 0) {
    const { h, m } = getEmergencyResetTime();
    showNotif(`⛔ 오늘 이 부스터는 더 이상 사용할 수 없어요! (${h}시간 ${m}분 후 초기화)`);
    return;
  }
  const costs = {bean:30000, ads:20000, popup:15000, lucky:2000, staffB:25000};
  const cost = costs[key] ?? 0;
  if (G.money < cost) { showNotif('💰 돈이 부족해요!'); return; }
  G.money -= cost;
  saveBoosterLog(key, getBoosterLog(key) + 1);

  if (key==='bean') {
    G.boosters.bean = {endDay: G.day+1};
    showNotif('☕ 특별 원두 효과 시작! 커피 수익 2배 (1일)');
    addLog('☕ 특별 원두 구매! 커피 메뉴 수익 2배');
  } else if (key==='ads') {
    G.boosters.ads = {endDay: G.day+1};
    resetSpawnTimer(Math.max(5000, (()=>{const base=[null,18000,14000,11000,9000,7000]; return (base[G.stage]||25000)/2;})()));
    showNotif('📢 SNS 광고 시작! 손님 2배 (1일)');
    addLog('📢 SNS 광고 집행! 손님 스폰 2배');
  } else if (key==='popup') {
    const maxCustBonus = getInteriorBonus('maxCust');
    const maxCust = 6 + Math.round(maxCustBonus);
    const toSpawn = maxCust - G.customers.length;
    let spawned = 0;
    for (let i = 0; i < toSpawn; i++) { spawnCustomer(true); spawned++; }
    showNotif(`🎪 팝업 이벤트! 손님 ${spawned}명 즉시 방문!`);
    addLog(`🎪 팝업 이벤트 개최! 손님 ${spawned}명 소환`);
  } else if (key==='lucky') {
    const roll = Math.random();
    if (roll<0.33) { const m=Math.floor(Math.random()*50000)+20000; G.money+=m; showNotif(`🍀 럭키! 💰+${m.toLocaleString()}원`); addLog(`🍀 럭키 박스: +${m.toLocaleString()}원`); }
    else if (roll<0.66) { const r=Math.floor(Math.random()*500)+200; G.reputation+=r; showNotif(`🍀 럭키! ⭐+${r} 명성`); addLog(`🍀 럭키 박스: +${r} 명성`); }
    else { const items=Object.keys(G.inventory); const item=items[Math.floor(Math.random()*items.length)]; G.inventory[item]=(G.inventory[item]||0)+20; showNotif(`🍀 럭키! ${ITEMS[item]?.emoji||''}${ITEMS[item]?.name||item} +20개`); addLog(`🍀 럭키 박스: ${ITEMS[item]?.name||item} +20`); renderInventory(); }
  } else if (key==='staffB') {
    G.boosters.staffB = {endDay: G.day+1};
    showNotif('🎁 직원 보너스! 서빙 속도 2배 (1일)');
    addLog('🎁 직원 보너스 지급! 서빙 속도 2배');
  }
  updateHeader();
  renderBooster();
}

// ══════════════════════════════════════════
//  직원 피로도 시스템
// ══════════════════════════════════════════
// G.staffFatigue[staffKey] = 0~100 (100이면 탈진)
function getStaffFatigue(key) {
  if (!G.staffFatigue) G.staffFatigue = {};
  return G.staffFatigue[key] || 0;
}
function addStaffFatigue(key, amt) {
  if (!G.staffFatigue) G.staffFatigue = {};
  G.staffFatigue[key] = Math.min(100, (G.staffFatigue[key] || 0) + amt);
}
function restStaff(key) {
  if (!G.staff[key]) return;
  if (!G.staffFatigue) G.staffFatigue = {};
  const cost = 10000;
  if (G.money < cost) { showNotif('💰 돈이 부족해요! (10,000원 필요)'); return; }
  G.money -= cost;
  G.staffFatigue[key] = 0;
  const s = STAFF_DEFS[key];
  showNotif(`😴 ${s.name} 휴식 완료! 피로도 초기화 (-${cost.toLocaleString()}원)`);
  addLog(`😴 ${s.emoji} ${s.name} 휴식 부여 — 피로도 0으로 초기화`);
  updateHeader(); renderStaff();
}
function getFatigueColor(fatigue) {
  if (fatigue < 40) return '#5A8A3C';
  if (fatigue < 70) return '#F4C430';
  return '#e74c3c';
}
function getFatigueLabel(fatigue) {
  if (fatigue < 40) return '😊 활기참';
  if (fatigue < 70) return '😓 피곤함';
  if (fatigue < 90) return '😵 지침';
  return '🚨 탈진!';
}
// 직원이 자동 서빙할 때 피로도 반영 (runStaffActions 에서 호출)
function staffFatigueEffect(key) {
  const fatigue = getStaffFatigue(key);
  // 피로 70 이상: 실수 확률 20%
  if (fatigue >= 70 && Math.random() < 0.2) {
    const s = STAFF_DEFS[key];
    G.satisfaction = Math.max(0, G.satisfaction - 0.1);
    addLog(`😵 ${s.name} 피로로 실수! 만족도 -0.1`);
    showNotif(`😵 ${s.name}이 지쳐서 실수했어요! 휴식을 줘야 해요`);
    return false; // 서빙 취소
  }
  // 피로 90 이상: 서빙 완전 거부
  if (fatigue >= 90) {
    const s = STAFF_DEFS[key];
    addLog(`🚨 ${s.name} 탈진 — 서빙 불가! 휴식을 주세요`);
    if (Math.random() < 0.3) showNotif(`🚨 ${s.name} 탈진! 관리 탭에서 휴식을 주세요!`);
    return false;
  }
  return true;
}

function trainStaff(key) {
  if (!G.staffLevels) G.staffLevels={};
  const lv = G.staffLevels[key]||1;
  if (lv>=3) { showNotif('이미 최고 레벨이에요!'); return; }
  const cost = lv * 20000;
  if (G.money < cost) { showNotif('💰 돈이 부족해요!'); return; }
  G.money -= cost;
  G.staffLevels[key] = lv+1;
  const s = STAFF_DEFS[key];
  showNotif(`🎓 ${s.name} Lv.${lv+1} 교육 완료!`);
  addLog(`🎓 ${s.emoji} ${s.name} Lv.${lv+1} 달성!`);
  updateHeader();
  renderBooster();
  renderStaff();
}

// ══════════════════════════════════════════
//  🎨 가게 꾸미기 (인테리어) 시스템
// ══════════════════════════════════════════
const INTERIOR_ITEMS = [
  { id:'theme_cozy',   type:'theme', emoji:'🕯️', name:'아늑한 감성',      desc:'따뜻한 카페 분위기. 만족도 +0.2',     cost:50000,  stageReq:1, effect:{sat:0.2},         themeClass:'theme-cozy'   },
  { id:'theme_modern', type:'theme', emoji:'🖤', name:'모던 인테리어',     desc:'세련된 현대적 느낌. VIP 손님 +10%',  cost:80000,  stageReq:4, effect:{vipBonus:0.1},    themeClass:'theme-modern' },
  { id:'theme_nature', type:'theme', emoji:'🌿', name:'내추럴 가든',       desc:'자연 친화적. 단골 방문 속도 +15%',   cost:70000,  stageReq:3, effect:{regularBonus:0.15},themeClass:'theme-nature' },
  { id:'theme_luxury', type:'theme', emoji:'✨', name:'럭셔리 파인다이닝', desc:'고급스러운 분위기. 메뉴 가격 +20%',  cost:150000, stageReq:7, effect:{priceBonus:0.20},  themeClass:'theme-luxury' },
  { id:'prop_plant',   type:'prop',  emoji:'🪴', name:'식물 인테리어',     desc:'손님 만족도 +0.1',                   cost:20000,  stageReq:1, effect:{sat:0.1}   },
  { id:'prop_board',   type:'prop',  emoji:'🪧', name:'메뉴 칠판',         desc:'신메뉴 판매 시 명성 보너스 +10%',    cost:30000,  stageReq:2, effect:{newMenuRep:0.1}},
  { id:'prop_lamp',    type:'prop',  emoji:'🪔', name:'무드 조명',          desc:'손님 인내심 +15',                    cost:40000,  stageReq:3, effect:{patBonus:15} },
  { id:'prop_artwork', type:'prop',  emoji:'🖼️', name:'예술 작품',         desc:'VIP 손님 만족도 추가 +0.3',          cost:60000,  stageReq:5, effect:{vipSat:0.3}  },
  { id:'prop_counter', type:'prop',  emoji:'🍫', name:'디저트 쇼케이스',   desc:'디저트 메뉴 가격 +10%',              cost:80000,  stageReq:5, effect:{dessertPrice:0.1}},
  { id:'prop_garden',  type:'prop',  emoji:'🌸', name:'야외 테라스',       desc:'최대 손님 수 +2명 (최대 8명)',        cost:100000, stageReq:4, effect:{maxCust:2}    },
];

function getOwnedInterior() {
  if (!G.interior) G.interior = { theme: null, props: [] };
  return G.interior;
}

function buyInterior(id) {
  const item = INTERIOR_ITEMS.find(x => x.id === id);
  if (!item) return;
  const interior = getOwnedInterior();
  if (!G.interiorOwned) G.interiorOwned = [];
  if (item.stageReq > G.stage) { showNotif('카페 단계가 더 높아야 해요!'); return; }

  if (item.type === 'theme') {
    if (interior.theme === id) { showNotif('이미 적용된 테마예요!'); return; }
    const alreadyOwned = G.interiorOwned.includes(id);
    if (!alreadyOwned) {
      // 처음 구매할 때만 돈 확인
      if (G.money < item.cost) { showNotif('💰 돈이 부족해요!'); return; }
      G.money -= item.cost;
      G.interiorOwned.push(id);
      addLog(`🎨 테마 구매: ${item.emoji} ${item.name}`);
    }
    interior.theme = id;
    applyInteriorTheme();
    showNotif(`${item.emoji} ${item.name} 테마 적용!`);
  } else {
    if (G.interiorOwned.includes(id)) { showNotif('이미 구매한 소품이에요!'); return; }
    if (G.money < item.cost) { showNotif('💰 돈이 부족해요!'); return; }
    G.money -= item.cost;
    G.interiorOwned.push(id);
    interior.props.push(id);
    applyInteriorEffects();
    renderCafeIllustration();
    renderPropDisplay();
    renderMobIllustration();
    addLog(`🎨 소품 설치: ${item.emoji} ${item.name}`);
    showNotif(`${item.emoji} ${item.name} 설치 완료! ${item.desc}`);
  }
  updateHeader(); renderUpgrades(); renderInteriorPanel();
}

function applyInteriorTheme() {
  // 기존 테마 클래스 모두 제거
  INTERIOR_ITEMS.filter(x => x.type==='theme').forEach(x => {
    if (x.themeClass) document.body.classList.remove(x.themeClass);
  });
  const interior = getOwnedInterior();
  if (interior.theme) {
    const item = INTERIOR_ITEMS.find(x => x.id === interior.theme);
    if (item?.themeClass) document.body.classList.add(item.themeClass);
  }
  renderCafeIllustration();
  renderPropDisplay();
  renderMobIllustration();
  if (currentTab === 'interior') renderInteriorPanel();
}

// ── 모바일 패널 일러스트 + 소품 렌더링 ──
function renderMobIllustration() {
  ['mob-illustration-farm', 'mob-illustration-manage'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!G.cafeOpen) { el.innerHTML = ''; return; }

    const interior = getOwnedInterior();
    const themeKey = interior.theme || null;
    const scene = THEME_SCENES[themeKey] || THEME_SCENES[null];
    // 씬 아이템 앞 3개만 (모바일은 공간이 좁으므로)
    const stageItem = STAGE_SCENE_ITEMS[G.stage] ? [STAGE_SCENE_ITEMS[G.stage][0]] : [];
    const sceneItems = [...scene.items.slice(0, 3), ...stageItem];

    // 소품 이모지
    const propIcons = { prop_plant:'🪴', prop_board:'🪧', prop_lamp:'🪔', prop_artwork:'🖼️', prop_counter:'🍫', prop_garden:'🌸' };
    const ownedProps = (interior.props || []).map(p => propIcons[p]).filter(Boolean);

    el.innerHTML = `
      <div class="mob-illust-scene">
        ${sceneItems.map(i => `<span>${i}</span>`).join('')}
        <span class="mob-illust-label"></span>
      </div>
      ${ownedProps.length ? `<div class="mob-prop-row">${ownedProps.map(e => `<span title="">${e}</span>`).join('')}</div>` : ''}
    `;
  });
}

// ── 테마별 가게 일러스트 ──
const THEME_SCENES = {
  null:         { bg:'linear-gradient(135deg,rgba(59,31,15,0.85),rgba(92,58,30,0.9))',  label:'☕ 우리 카페',    items:['🏕️','☕','🌱','✨','🍽️'] },
  theme_cozy:   { bg:'linear-gradient(135deg,rgba(92,58,30,0.9),rgba(139,94,60,0.85))', label:'🕯️ 아늑한 공간', items:['🕯️','🛋️','☕','📚','🧸'] },
  theme_modern: { bg:'linear-gradient(135deg,rgba(26,37,47,0.92),rgba(44,62,80,0.88))', label:'🖤 모던 카페',    items:['🖤','💻','☕','🎵','🔲'] },
  theme_nature: { bg:'linear-gradient(135deg,rgba(30,86,49,0.9),rgba(46,125,50,0.85))', label:'🌿 내추럴 가든',  items:['🌿','🌸','🪴','🌞','🍃'] },
  theme_luxury: { bg:'linear-gradient(135deg,rgba(44,26,0,0.92),rgba(125,90,0,0.88))',  label:'✨ 럭셔리 공간',  items:['✨','🥂','🌹','💎','🕊️'] },
};

// 스테이지별 추가 아이템
const STAGE_SCENE_ITEMS = {
  1:['🛖'],2:['🏠'],3:['🍱'],4:['☕'],5:['🎂'],6:['🍝'],7:['🍽️'],8:['🥂'],9:['🏢'],
};

function renderCafeIllustration() {
  const el = document.getElementById('cafe-illustration');
  if (!el || !G.cafeOpen) { if(el) el.innerHTML=''; return; }

  const interior = getOwnedInterior();
  const themeKey = interior.theme || null;
  const scene = THEME_SCENES[themeKey] || THEME_SCENES[null];

  // 씬 아이템 (앞 3개 + 현재 단계 아이콘)
  const stageItem = STAGE_SCENE_ITEMS[G.stage] ? [STAGE_SCENE_ITEMS[G.stage][0]] : [];
  const sceneItems = [...scene.items.slice(0, 3), ...stageItem];

  // 소품 이모지 (오른쪽에 별도 표시)
  const propIcons = { prop_plant:'🪴', prop_board:'🪧', prop_lamp:'🪔', prop_artwork:'🖼️', prop_counter:'🍫', prop_garden:'🌸' };
  const ownedProps = (interior.props || []).map(id => propIcons[id]).filter(Boolean);

  el.innerHTML = `
    <div class="cafe-scene">
      ${sceneItems.map(icon => `<span>${icon}</span>`).join('')}
      <span class="scene-label"></span>
    </div>
    ${ownedProps.length ? `<div class="prop-row">${ownedProps.map(e=>`<span>${e}</span>`).join('')}</div>` : ''}
  `;
}

// ── 소품 배지 (topbar 우측) ──
const PROP_DISPLAY_INFO = {
  prop_plant:   { emoji:'🪴', name:'식물 인테리어' },
  prop_board:   { emoji:'🪧', name:'메뉴 칠판' },
  prop_lamp:    { emoji:'🪔', name:'무드 조명' },
  prop_artwork: { emoji:'🖼️', name:'예술 작품' },
  prop_counter: { emoji:'🍫', name:'디저트 쇼케이스' },
  prop_garden:  { emoji:'🌸', name:'야외 테라스' },
};

function renderPropDisplay() {
  const el = document.getElementById('prop-display');
  if (!el) return;
  const interior = getOwnedInterior();
  const props = interior.props || [];
  if (props.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = props.map(id => {
    const info = PROP_DISPLAY_INFO[id];
    if (!info) return '';
    return `<span class="prop-badge" data-name="${info.name}" title="${info.name}">${info.emoji}</span>`;
  }).join('');
}

function applyInteriorEffects() {
  const interior = getOwnedInterior();
  if (!G._interiorApplied) G._interiorApplied = {};
  (interior.props || []).forEach(id => {
    if (G._interiorApplied[id]) return;
    G._interiorApplied[id] = true;
    const item = INTERIOR_ITEMS.find(x => x.id === id);
    if (item?.effect?.sat) G.satisfaction = Math.min(5, G.satisfaction + item.effect.sat);
  });
}

function getInteriorBonus(type) {
  const interior = getOwnedInterior();
  let bonus = 0;
  if (interior.theme) {
    const theme = INTERIOR_ITEMS.find(x => x.id === interior.theme);
    if (theme?.effect?.[type]) bonus += theme.effect[type];
  }
  (interior.props || []).forEach(id => {
    const prop = INTERIOR_ITEMS.find(x => x.id === id);
    if (prop?.effect?.[type]) bonus += prop.effect[type];
  });
  return bonus;
}

function renderInteriorPanel() {
  const el = document.getElementById('tab-interior');
  if (!el) return;
  const interior = getOwnedInterior();
  const owned = G.interiorOwned || [];
  const themes = INTERIOR_ITEMS.filter(x => x.type === 'theme');
  const props   = INTERIOR_ITEMS.filter(x => x.type === 'prop');

  const renderItem = (item) => {
    const isOwned  = owned.includes(item.id);
    const isActive = item.type==='theme' ? interior.theme===item.id : (interior.props||[]).includes(item.id);
    const locked   = item.stageReq > G.stage;
    const canBuy   = !isOwned && !locked && G.money >= item.cost;
    return `<div class="deco-item ${isOwned?'owned':''} ${isActive?'active':''}">
      <div class="deco-preview">${item.emoji}</div>
      <div class="deco-info">
        <div class="deco-name">${item.name}${isActive?' <span style="font-size:9px;background:var(--grass);color:white;padding:1px 5px;border-radius:5px;">적용중</span>':''}</div>
        <div class="deco-desc">${item.desc}</div>
      </div>
      ${locked
        ? `<span style="font-size:10px;color:var(--latte);">🔒 Lv.${item.stageReq}</span>`
        : isOwned && item.type==='prop'
          ? `<span style="font-size:11px;color:var(--grass);">✓ 설치됨</span>`
          : isOwned && item.type==='theme' && !isActive
            ? `<button class="btn btn-green btn-sm" onclick="buyInterior('${item.id}')">적용</button>`
            : `<button class="btn btn-gold btn-sm" ${canBuy?'':'disabled'} onclick="buyInterior('${item.id}')">💰${item.cost.toLocaleString()}</button>`
      }
    </div>`;
  };

  el.innerHTML = `
    <div style="font-size:11px;font-weight:700;color:var(--espresso);margin-bottom:6px;padding-bottom:4px;border-bottom:2px dashed rgba(200,149,108,0.28);">🎨 테마 변경</div>
    <div style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">${themes.map(renderItem).join('')}</div>
    <div style="font-size:11px;font-weight:700;color:var(--espresso);margin-bottom:6px;padding-bottom:4px;border-bottom:2px dashed rgba(200,149,108,0.28);">🪴 소품 설치</div>
    <div style="display:flex;flex-direction:column;gap:5px;">${props.map(renderItem).join('')}</div>
  `;
}

// ══════════════════════════════════════════
//  업적 시스템
// ══════════════════════════════════════════
const ACHIEVEMENTS = [
  {id:'first_serve',   emoji:'🍽️', name:'첫 서빙!',        desc:'첫 손님을 서빙했어요',              check:()=>G.totalServed>=1},
  {id:'serve_10',      emoji:'👨‍🍳', name:'열정 사장',       desc:'손님 10명 서빙',                    check:()=>G.totalServed>=10},
  {id:'serve_100',     emoji:'🏅', name:'백전노장',          desc:'손님 100명 서빙',                   check:()=>G.totalServed>=100},
  {id:'serve_500',     emoji:'🏆', name:'전설의 서빙왕',     desc:'손님 500명 서빙',                   check:()=>G.totalServed>=500},
  {id:'money_100k',    emoji:'💰', name:'백만장자의 꿈',     desc:'50만원 보유',                       check:()=>G.money>=500000},
  {id:'money_1m',      emoji:'💎', name:'백만장자!',          desc:'100만원 보유',                      check:()=>G.money>=1000000},
  {id:'money_10m',     emoji:'👑', name:'재벌 사장님',        desc:'1000만원 보유',                     check:()=>G.money>=10000000},
  {id:'earned_1m',     emoji:'🤑', name:'누적 백만',          desc:'누적 수익 100만원',                 check:()=>G.totalMoneyEarned>=1000000},
  {id:'stage_cafe',    emoji:'☕', name:'카페 오픈!',         desc:'카페 단계 달성',                    check:()=>G.stage>=4},
  {id:'stage_fine',    emoji:'🥂', name:'파인다이닝',         desc:'파인다이닝 단계 달성',               check:()=>G.stage>=8},
  {id:'stage_max',     emoji:'🏢', name:'프랜차이즈 왕',      desc:'최종 단계 달성!',                   check:()=>G.stage>=9},
  {id:'recipe_10',     emoji:'📖', name:'요리사 입문',        desc:'레시피 10개 습득',                  check:()=>G.learnedRecipes.length>=10},
  {id:'recipe_all',    emoji:'📚', name:'마스터 셰프',        desc:'모든 레시피 습득',                  check:()=>G.learnedRecipes.length>=Object.keys(RECIPES).length},
  {id:'harvest_100',   emoji:'🌾', name:'농부의 손',          desc:'작물 100번 수확',                   check:()=>Object.values(G.harvestedCrops||{}).reduce((a,b)=>a+b,0)>=100},
  {id:'regular_1',     emoji:'🥰', name:'단골 탄생!',         desc:'첫 단골 손님 등장',                 check:()=>Object.values(G.regulars||{}).some(r=>r.visits>=5)},
  {id:'regular_5',     emoji:'💝', name:'단골 부자',          desc:'단골 손님 5명',                     check:()=>Object.values(G.regulars||{}).filter(r=>r.visits>=5).length>=5},
  {id:'vip_10',        emoji:'🤩', name:'VIP 단골',           desc:'VIP 손님 10명 서빙',                check:()=>(G.vipServed||0)>=10},
  {id:'stage_up_all',  emoji:'🚀', name:'승승장구',           desc:'3번 연속 스테이지 업',              check:()=>(G.consecutiveStageUp||0)>=3},
  {id:'contest_first', emoji:'🏆', name:'첫 대회 참가!',       desc:'첫 번째 대회에 참가했어요',          check:()=>(G.contestHistory||[]).length>=1},
  {id:'contest_gold',  emoji:'🥇', name:'대회 우승!',           desc:'대회에서 1위를 차지했어요',           check:()=>(G.contestHistory||[]).some(h=>h.rank.includes('1위')||h.rank.includes('대상')||h.rank.includes('MVP')||h.rank.includes('미슐랭'))},
  {id:'contest_all',   emoji:'🎖️', name:'대회 마스터',          desc:'모든 종류의 대회에 참가했어요',       check:()=>['local_champ','barista_cup','dessert_fest','gourmet_event','xmas_market'].every(id=>(G.triggeredContests||[]).includes(id))},
  {id:'interior_1',    emoji:'🎨', name:'내 공간 꾸미기',        desc:'인테리어 소품 첫 설치',               check:()=>(G.interiorOwned||[]).length>=1},
  {id:'interior_full', emoji:'🏡', name:'나만의 카페',            desc:'테마 + 소품 3개 이상 설치',           check:()=>(G.interior?.theme)&&(G.interior?.props||[]).length>=3},
  {id:'regular_deep',  emoji:'💝', name:'진짜 단골',              desc:'단골 손님과 심층 스토리 진행',         check:()=>G.triggeredEvents&&[...G.triggeredEvents].some(e=>e.startsWith('reg_deep_'))},
  {id:'staff_rest',    emoji:'😴', name:'직원 복지 사장',         desc:'직원에게 처음으로 휴식을 줬어요',      check:()=>Object.values(G.staffFatigue||{}).some(f=>f===0&&Object.keys(G.staff||{}).length>0)},
  // 밭 확장
  {id:'farm_12',       emoji:'🌾', name:'대농장',                  desc:'밭을 12칸으로 확장했어요',             check:()=>(G.plotSlots||8)>=12},
  {id:'farm_max',      emoji:'🏡', name:'농장왕',                  desc:'밭을 최대(16칸)로 확장했어요',         check:()=>(G.plotSlots||8)>=16},
  // 납품
  {id:'supply_first',  emoji:'📦', name:'첫 납품!',                desc:'납품 주문을 처음으로 완료했어요',       check:()=>(G.supplyOrders||[]).some(o=>o.done&&!o.failed)},
  {id:'supply_10',     emoji:'🚚', name:'납품 전문가',              desc:'납품 주문 10건 완료',                  check:()=>(G.supplyOrders||[]).filter(o=>o.done&&!o.failed).length>=10},
  // 폐업 위기
  {id:'crisis_survive',emoji:'💪', name:'위기를 넘다!',             desc:'폐업 위기를 극복했어요',               check:()=>G.triggeredEvents&&[...G.triggeredEvents].some(e=>e.startsWith('crisis_'))&&!G.crisisActive&&(G.lowSatDays||0)===0},
  // 멀티 지점
  {id:'branch_first',  emoji:'🏠', name:'2호점 오픈!',             desc:'두 번째 지점을 오픈했어요',             check:()=>(G.branches||[]).length>=1},
  {id:'branch_full',   emoji:'🏢', name:'프랜차이즈 완성!',         desc:'지점 3개를 모두 오픈했어요',           check:()=>(G.branches||[]).length>=3},
  // 단골 선호 메뉴
  {id:'fav_menu',      emoji:'💝', name:'단골의 입맛',              desc:'단골 손님의 선호 메뉴가 생겼어요',      check:()=>Object.values(G.regulars||{}).some(r=>r.favMenu&&r.visits>=5)},
  // 퀘스트
  {id:'quest_20',      emoji:'🎯', name:'퀘스트 헌터',              desc:'퀘스트 20개 달성',                     check:()=>(G.achievements||[]).filter(id=>id.startsWith('quest')).length>=1&&G.totalServed>=50},
  // 레시피 수집
  {id:'recipe_5',      emoji:'📖', name:'레시피 5개',               desc:'레시피 5종 이상 배웠어요',              check:()=>(G.learnedRecipes||[]).length>=5, reward:{money:20000}},
  {id:'recipe_10',     emoji:'📚', name:'레시피 마스터',             desc:'레시피 10종 이상 배웠어요',             check:()=>(G.learnedRecipes||[]).length>=10, reward:{money:50000}},
  {id:'recipe_all',    emoji:'🍴', name:'완전정복!',                 desc:'모든 레시피를 배웠어요',                check:()=>Object.keys(RECIPES).every(k=>k==='combo_americano_cookie'||(G.learnedRecipes||[]).includes(k)), reward:{money:200000}},
  // 매출
  {id:'earn_100k',     emoji:'💰', name:'첫 10만 달성',             desc:'누적 매출 100,000원 달성',              check:()=>(G.totalMoneyEarned||0)>=100000, reward:{money:10000}},
  {id:'earn_1m',       emoji:'💵', name:'100만 클럽',               desc:'누적 매출 1,000,000원 달성',            check:()=>(G.totalMoneyEarned||0)>=1000000, reward:{money:50000}},
  {id:'earn_10m',      emoji:'💎', name:'천만 사장님',              desc:'누적 매출 10,000,000원 달성',           check:()=>(G.totalMoneyEarned||0)>=10000000, reward:{money:200000, rep:500}},
  // 서빙
  {id:'serve_100',     emoji:'🍽️', name:'100번 서빙',               desc:'손님 100명에게 음식을 냈어요',           check:()=>(G.totalServed||0)>=100, reward:{money:10000}},
  {id:'serve_500',     emoji:'🍽️', name:'서빙 고수',                desc:'손님 500명에게 음식을 냈어요',           check:()=>(G.totalServed||0)>=500, reward:{money:30000}},
  // 만족도
  {id:'sat_5star',     emoji:'⭐', name:'별점 만점',                desc:'만족도 4.8 이상 달성',                  check:()=>(G.satisfaction||0)>=4.8, reward:{rep:200}},
  // 대회
  {id:'contest_1st',   emoji:'🥇', name:'대회 우승!',               desc:'음식 대회에서 1위를 차지했어요',         check:()=>G.contestHistory?.some(h=>h.rank===1), reward:{money:100000, rep:300}},
  // 일일 퀘스트
  {id:'daily_3',       emoji:'📅', name:'꾸준한 사장',               desc:'일일 도전과제 3회 클리어',               check:()=>(G.dailyClearTotal||0)>=3, reward:{money:15000}},
  {id:'daily_10',      emoji:'📅', name:'도전과제 달인',             desc:'일일 도전과제 10회 클리어',              check:()=>(G.dailyClearTotal||0)>=10, reward:{money:50000}},
];

function checkAchievements() {
  if (!G.achievements) G.achievements=[];
  ACHIEVEMENTS.forEach(a=>{
    if (!G.achievements.includes(a.id) && a.check()) {
      G.achievements.push(a.id);
      showAchieveToast(a);
      addLog(`🏅 업적: ${a.name} — ${a.desc}`);
      // 보상 지급
      if (a.reward) {
        if (a.reward.money) { G.money += a.reward.money; floatReward(`+${a.reward.money.toLocaleString()}원`, '업적보상'); }
        if (a.reward.rep)   { G.reputation += a.reward.rep; floatReward(`+${a.reward.rep} 명성`, '업적보상'); }
      }
      // 업적 파티클
      launchConfetti(40, ['#FFD700','#FFF44F','#e056fd','#fff','#4CAF50']);
    }
  });
}
function showAchieveToast(a) {
  // 기존 토스트 제거
  document.querySelectorAll('.achieve-toast').forEach(el=>el.remove());
  const el = document.createElement('div');
  el.className = 'achieve-toast';
  el.innerHTML = `${a.emoji} 업적 달성! <strong>${a.name}</strong><br><span style="font-size:11px;opacity:0.75;">${a.desc}</span>`;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 4000);
  audio.init(); audio.playSfx('harvest');
}

function renderRecipeBook() {
  const el = document.getElementById('tab-recipebook');
  if (!el) return;
  const learned = G.learnedRecipes || [];
  const allKeys = Object.keys(RECIPES);
  const total = allKeys.length;
  const count = learned.length + 1; // egg_toast 기본 포함

  const byStage = {};
  allKeys.forEach(k=>{
    const r = RECIPES[k];
    const s = r.stageReq || 0;
    if (!byStage[s]) byStage[s] = [];
    byStage[s].push({key:k, r});
  });

  let html = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <div style="font-size:20px;">📔</div>
      <div>
        <div style="font-weight:700;font-size:13px;color:var(--espresso);">레시피 도감</div>
        <div style="font-size:11px;color:var(--latte);">수집 ${count}/${total} (${Math.round(count/total*100)}%)</div>
      </div>
    </div>
    <div style="background:rgba(212,160,23,0.08);border-radius:8px;height:6px;margin-bottom:10px;overflow:hidden;">
      <div style="background:var(--gold);height:100%;width:${Math.round(count/total*100)}%;border-radius:8px;transition:width 0.5s;"></div>
    </div>`;

  const stageNames = ['🌱 농장','🛖 노점','🥪 토스트점','🍱 분식점','☕ 카페','🍰 디저트카페','🍝 비스트로','🍽️ 레스토랑','🥂 파인다이닝','🏢 프랜차이즈'];
  Object.keys(byStage).sort((a,b)=>Number(a)-Number(b)).forEach(s=>{
    html += `<div style="font-size:11px;font-weight:700;color:var(--latte);margin:8px 0 4px;">${stageNames[Number(s)]||s+'단계'}</div>`;
    html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;">`;
    byStage[s].forEach(({key,r})=>{
      const owned = key==='egg_toast' || learned.includes(key);
      const seasonal = r.season ? ` (${r.season==='spring'?'봄':r.season==='summer'?'여름':r.season==='autumn'?'가을':'겨울'})` : '';
      html += `<div style="background:${owned?'rgba(212,160,23,0.1)':'rgba(0,0,0,0.04)'};border:1.5px solid ${owned?'rgba(212,160,23,0.4)':'rgba(0,0,0,0.08)'};border-radius:9px;padding:6px;text-align:center;opacity:${owned?1:0.4};">
        <div style="font-size:22px;">${owned?r.emoji:'❓'}</div>
        <div style="font-size:9px;font-weight:700;color:var(--espresso);margin-top:2px;">${owned?r.name:'???'}</div>
        <div style="font-size:9px;color:var(--latte);">${owned?r.price.toLocaleString()+'원'+seasonal:''}</div>
        ${owned?`<div style="font-size:8px;color:var(--gold);">✓ 보유</div>`:''}
      </div>`;
    });
    html += `</div>`;
  });
  el.innerHTML = html;
}

function renderAchievements() {
  const el = document.getElementById('tab-achieve');
  if (!G.achievements) G.achievements=[];
  el.innerHTML = `
    <div style="font-size:11px;color:var(--latte);margin-bottom:6px;">달성 ${G.achievements.length}/${ACHIEVEMENTS.length}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
    ${ACHIEVEMENTS.map(a=>{
      const done=G.achievements.includes(a.id);
      return `<div style="background:${done?'rgba(212,160,23,0.12)':'rgba(107,66,38,0.05)'};border:1.5px solid ${done?'rgba(212,160,23,0.4)':'rgba(107,66,38,0.1)'};border-radius:9px;padding:7px 8px;opacity:${done?1:0.45};">
        <div style="font-size:18px;">${a.emoji}</div>
        <div style="font-size:10px;font-weight:700;color:var(--espresso);margin-top:2px;">${a.name}</div>
        <div style="font-size:9px;color:var(--latte);">${a.desc}</div>
        ${done?'<div style="font-size:9px;color:var(--gold);margin-top:2px;">✓ 달성!</div>':''}
      </div>`;
    }).join('')}
    </div>`;
}

// ══════════════════════════════════════════
//  도감 시스템
// ══════════════════════════════════════════
function renderEncyclopedia() {
  const el = document.getElementById('tab-encyclo');
  if (!el) return;
  el.style.alignItems = 'center';
  if (!G.encyclopedia) G.encyclopedia={};
  if (!G.harvestedCrops) G.harvestedCrops={};

  const recipeCount = Object.keys(G.encyclopedia).length;
  const recipeTotal = Object.keys(RECIPES).length;
  const cropCount = Object.keys(G.harvestedCrops).length;
  const cropTotal = Object.keys(CROPS).length;

  el.innerHTML = `
    <div style="font-size:11px;font-weight:700;color:var(--espresso);margin-bottom:5px;padding-bottom:3px;border-bottom:1px dashed rgba(200,149,108,0.3);">
      🌾 수확 작물 <span style="color:var(--gold);">${cropCount}/${cropTotal}</span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;justify-content:center;">
      ${Object.entries(CROPS).map(([k,c])=>{
        const cnt=G.harvestedCrops[k]||0;
        const done=cnt>0;
        return `<div style="background:${done?'rgba(90,138,60,0.1)':'rgba(107,66,38,0.05)'};border:1.5px solid ${done?'rgba(90,138,60,0.3)':'rgba(107,66,38,0.1)'};border-radius:8px;padding:5px 7px;text-align:center;opacity:${done?1:0.35};min-width:48px;">
          <div style="font-size:18px;">${done?c.emoji:'❓'}</div>
          <div style="font-size:8px;color:var(--espresso);">${done?c.name:'???'}</div>
          ${done?`<div style="font-size:8px;color:var(--latte);">×${cnt}</div>`:''}
        </div>`;
      }).join('')}
    </div>
    <div style="font-size:11px;font-weight:700;color:var(--espresso);margin-bottom:5px;padding-bottom:3px;border-bottom:1px dashed rgba(200,149,108,0.3);">
      📋 레시피 <span style="color:var(--gold);">${recipeCount}/${recipeTotal}</span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;">
      ${Object.entries(RECIPES).map(([k,r])=>{
        const done=!!G.encyclopedia[k];
        return `<div style="background:${done?'rgba(212,160,23,0.1)':'rgba(107,66,38,0.05)'};border:1.5px solid ${done?'rgba(212,160,23,0.3)':'rgba(107,66,38,0.1)'};border-radius:8px;padding:5px 7px;text-align:center;opacity:${done?1:0.35};min-width:48px;">
          <div style="font-size:18px;">${done?r.emoji:'❓'}</div>
          <div style="font-size:8px;color:var(--espresso);">${done?r.name:'???'}</div>
        </div>`;
      }).join('')}
    </div>`;
}

// ══════════════════════════════════════════
//  통계 탭
// ══════════════════════════════════════════
function renderStats() {
  const el = document.getElementById('tab-stats');
  if (!el) return;

  // 메뉴별 판매 횟수 (G.menuSoldCount 사용)
  const menuSold = G.menuSoldCount || {};
  const topMenus = Object.entries(menuSold)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,5);

  // 총 플레이 시간
  const totalSec = G.secondsPlayed || 0;
  const playH = Math.floor(totalSec/3600);
  const playM = Math.floor((totalSec%3600)/60);
  const playS = totalSec%60;
  const playStr = playH>0 ? `${playH}시간 ${playM}분` : playM>0 ? `${playM}분 ${playS}초` : `${playS}초`;

  // 단골 TOP3
  const topRegulars = Object.entries(G.regulars||{})
    .sort((a,b)=>b[1].visits-a[1].visits)
    .slice(0,3);

  const statBox = (emoji, label, value, color='var(--espresso)') =>
    `<div style="background:rgba(107,66,38,0.07);border-radius:10px;padding:9px 10px;display:flex;align-items:center;gap:8px;">
      <span style="font-size:20px;">${emoji}</span>
      <div style="flex:1;">
        <div style="font-size:10px;color:var(--latte);">${label}</div>
        <div style="font-size:14px;font-weight:700;color:${color};">${value}</div>
      </div>
    </div>`;

  el.innerHTML = `
    <div style="font-size:11px;font-weight:700;color:var(--espresso);margin-bottom:6px;padding-bottom:4px;border-bottom:2px dashed rgba(200,149,108,0.28);">📊 나의 경영 기록</div>
    <div style="display:flex;flex-direction:column;gap:5px;">
      ${statBox('💰','누적 수익', (G.totalMoneyEarned||0).toLocaleString()+'원', 'var(--gold)')}
      ${statBox('🍽️','총 서빙 수', (G.totalServed||0).toLocaleString()+'명', 'var(--grass)')}
      ${statBox('⭐','현재 명성', (G.reputation||0).toLocaleString(), '#9b59b6')}
      ${statBox('🏪','현재 단계', STAGE_DATA[G.stage].name)}
      ${statBox('⏱️','총 플레이 시간', playStr)}
      ${statBox('🥰','단골 손님 수', Object.values(G.regulars||{}).filter(r=>r.visits>=5).length+'명', '#e91e8c')}
      ${statBox('🎨','인테리어 구매', (G.interiorOwned||[]).length+'개')}
      ${(G.branches||[]).length>0 ? statBox('🏢','운영 지점 수', (G.branches||[]).length+'개', 'var(--gold)') : ''}
      ${statBox('📦','납품 완료', (G.supplyOrders||[]).filter(o=>o.done&&!o.failed).length+'건', '#27ae60')}
      ${Object.keys(G.staff||{}).length > 0 ? statBox('💪','직원 평균 피로도',
        (Object.keys(G.staff).reduce((sum,k)=>(sum+(G.staffFatigue?.[k]||0)),0)/Object.keys(G.staff).length).toFixed(0)+'%',
        Object.keys(G.staff).some(k=>(G.staffFatigue?.[k]||0)>=90)?'#e74c3c':
        Object.keys(G.staff).some(k=>(G.staffFatigue?.[k]||0)>=70)?'#F4C430':'var(--grass)'
      ) : ''}
    </div>
    ${topMenus.length ? `
    <div style="font-size:11px;font-weight:700;color:var(--espresso);margin:10px 0 5px;padding-bottom:4px;border-bottom:2px dashed rgba(200,149,108,0.28);">🏆 베스트 메뉴 TOP5</div>
    <div style="display:flex;flex-direction:column;gap:4px;">
      ${topMenus.map(([k,cnt],i)=>{
        const r=RECIPES[k];
        const medals=['🥇','🥈','🥉','4️⃣','5️⃣'];
        return `<div style="display:flex;align-items:center;gap:7px;background:rgba(107,66,38,0.06);border-radius:8px;padding:6px 9px;font-size:12px;">
          <span>${medals[i]}</span>
          <span style="font-size:16px;">${r?.emoji||'?'}</span>
          <span style="flex:1;font-weight:600;">${r?.name||k}</span>
          <span style="color:var(--gold);font-weight:700;">${cnt}회</span>
        </div>`;
      }).join('')}
    </div>` : '<div style="font-size:12px;color:var(--latte);text-align:center;padding:10px;">아직 메뉴 판매 기록이 없어요</div>'}
    ${topRegulars.length ? `
    <div style="font-size:11px;font-weight:700;color:var(--espresso);margin:10px 0 5px;padding-bottom:4px;border-bottom:2px dashed rgba(200,149,108,0.28);">🥰 단골 TOP3</div>
    <div style="display:flex;flex-direction:column;gap:4px;">
      ${topRegulars.map(([name,data])=>
        `<div style="display:flex;align-items:center;gap:7px;background:rgba(233,30,140,0.06);border-radius:8px;padding:6px 9px;font-size:12px;">
          <span style="font-size:16px;">🥰</span>
          <span style="flex:1;font-weight:600;">${name}</span>
          <span style="color:#e91e8c;font-weight:700;">${data.visits}회 방문</span>
        </div>`
      ).join('')}
    </div>` : ''}
    ${(G.contestHistory||[]).length ? `
    <div style="font-size:11px;font-weight:700;color:var(--espresso);margin:10px 0 5px;padding-bottom:4px;border-bottom:2px dashed rgba(200,149,108,0.28);">🏆 대회 전적</div>
    <div style="display:flex;flex-direction:column;gap:4px;">
      ${G.contestHistory.map(h=>`
        <div style="display:flex;align-items:center;gap:7px;background:rgba(212,160,23,0.07);border-radius:8px;padding:6px 9px;font-size:12px;">
          <span style="font-size:16px;">${h.emoji}</span>
          <span style="flex:1;font-weight:600;">${h.name}</span>
          <span style="color:var(--gold);font-weight:700;">${h.rank}</span>
          <span style="font-size:10px;color:var(--latte);">Day${h.day}</span>
        </div>`).join('')}
    </div>` : ''}
  `;
}

// ══════════════════════════════════════════
//  🏆 대회 시스템
// ══════════════════════════════════════════

// ── 대회 정의 ──
const CONTESTS = [
  // ① 지역 카페 챔피언십 — 5단계 달성 직후 (필수)
  {
    id: 'local_champ',
    emoji: '🏆', name: '지역 카페 챔피언십',
    triggerStage: 5, forceTrigger: true,
    announceDays: 2,
    desc: '지역 최고 카페를 가리는 챔피언십! 심사위원 4명이 짧은 시간 안에 연속으로 방문해요. 재료 준비 필수!',
    prepChoices: [
      { label: '🍽️ 시그니처 메뉴 집중 연습', desc: '본선 메뉴 점수 +20%', key: 'menu_drill', cost: 0 },
      { label: '🖼️ 카페 인테리어 투자', desc: '인테리어 점수 +30%', key: 'interior', cost: 40000 },
      { label: '📣 단골 손님 홍보 동원', desc: '심사위원 호감도 +15%', key: 'promo', cost: 0 },
    ],
    dayRule: '심사위원 4명이 방문! 인내심이 30%로 낮아요 — 재료 부족하면 즉시 탈락 위기. 모두 서빙하면 보너스!',
    judgeCount: 4,
    judgePatience: 28,   // ↑ 더 까다롭게
    judgeOrders: null,
    evaluate(ctx) {
      const { servedJudges, prepKeys } = ctx;
      const bonusMult = 1
        + (prepKeys.includes('menu_drill') ? 0.20 : 0)
        + (prepKeys.includes('interior')   ? 0.30 : 0)
        + (prepKeys.includes('promo')      ? 0.15 : 0);
      if (servedJudges >= 4) {
        return { rank:'🥇 1위', rep: Math.round(600*bonusMult), money: Math.round(70000*bonusMult), badge:'🏆', msg:'완벽한 서비스! 챔피언십 우승!', title:'카페 챔피언' };
      } else if (servedJudges === 3) {
        return { rank:'🥈 2위', rep: Math.round(250*bonusMult), money: 20000, msg:'아슬아슬하게 2위! 한 명만 더 서빙했더라면...' };
      } else if (servedJudges === 2) {
        return { rank:'🥉 3위', rep: 80, money: 0, msg:'3위 입상. 재료 관리가 아쉬웠어요.' };
      } else {
        return { rank:'😞 탈락', rep: -50, money: 0, msg:'심사위원을 기다리게 했어요. 재료·속도를 점검하세요!' };
      }
    },
  },

  // ② 바리스타 경연 대회 — 커피 레시피 4종 이상
  {
    id: 'barista_cup',
    emoji: '☕', name: '바리스타 경연 대회',
    triggerStage: 4, forceTrigger: false,
    requireRecipes: ['latte','americano','strawb_latte','peach_tea'],
    announceDays: 2,
    desc: '전국 바리스타 경연! 아메리카노→라떼→딸기라떼 순서로 정확히 서빙해야 해요. 순서가 틀리면 퍼펙트 초기화!',
    prepChoices: [
      { label: '☕ 특별 원두 구매', desc: '커피 품질 점수 대폭 상승', key: 'bean_buy', cost: 25000 },
      { label: '🎓 직원 특훈 (직원 필요)', desc: '서빙 속도 2배로 당일 가동', key: 'staff_train', cost: 0, requireStaff: true },
      { label: '📝 레시피 연구 (무료)', desc: '커피 신메뉴 1개 무료 습득', key: 'recipe_study', cost: 0 },
    ],
    dayRule: '심사위원 3명이 아메리카노→라떼→딸기라떼 순서로 주문해요. 인내심 20% — 빠른 서빙 필수! 순서 틀리면 퍼펙트 취소.',
    judgeCount: 3,
    judgePatience: 22,   // ↑ 더 빡빡하게
    judgeOrders: ['americano','latte','strawb_latte'],
    evaluate(ctx) {
      const { servedJudges, prepKeys, perfectCombo } = ctx;
      const hasBeans = prepKeys.includes('bean_buy');
      if (perfectCombo && hasBeans) {
        return { rank:'🏅 대상', rep: 800, money: 80000, badge:'☕', msg:'퍼펙트 루틴 + 최상급 원두! 역대급 점수!', title:'바리스타 챔피언' };
      } else if (perfectCombo) {
        return { rank:'🥇 금상', rep: 400, money: 30000, badge:'🥇', msg:'퍼펙트 루틴 달성! 뛰어난 기량이에요!' };
      } else if (servedJudges >= 2) {
        return { rank:'🥈 은상', rep: 120, money: 0, msg:'아쉽게 은상. 순서와 속도를 더 연습해봐요.' };
      } else {
        return { rank:'🎖️ 참가상', rep: 20, money: 0, msg:'참가에 의의를! 인내심이 다 닳기 전에 서빙해야 해요.' };
      }
    },
  },

  // ③ 디저트 페스티벌 — 디저트 레시피 2종 이상
  {
    id: 'dessert_fest',
    emoji: '🎪', name: '디저트 페스티벌',
    triggerStage: 5, forceTrigger: false,
    requireRecipes: ['strawb_cake','macaron'],
    announceDays: 2,
    desc: '시청 주최 디저트 페스티벌! 손님이 4배로 몰려오지만 재료가 금방 떨어져요. 사전 재배가 핵심!',
    prepChoices: [
      { label: '🍓 딸기 대량 재배', desc: '씨앗 2개 자동 심기 (재료 확보)', key: 'grow_strawb', cost: 0 },
      { label: '🎁 예쁜 포장 투자', desc: '손님 만족도 +0.5 (당일)', key: 'packaging', cost: 15000 },
      { label: '📱 SNS 홍보', desc: '블로거 손님 출현율 3배 (무료)', key: 'sns', cost: 0 },
    ],
    dayRule: '하루 동안 손님 4배! 디저트 수익 1.5배. 목표: 250,000원 — 재료 소진되면 서빙 불가.',
    judgeCount: 0,
    judgePatience: 60,
    judgeOrders: null,
    evaluate(ctx) {
      const { festRevenue } = ctx;
      if (festRevenue >= 300000) {
        return { rank:'🥇 인기 부스상', rep: 700, money: 0, badge:'🎪', msg:`페스티벌 최고 인기 부스! 수익 ${festRevenue.toLocaleString()}원!`, title:'디저트 페스티벌 MVP' };
      } else if (festRevenue >= 200000) {
        return { rank:'🥈 우수상', rep: 350, money: 0, msg:`훌륭해요! 수익 ${festRevenue.toLocaleString()}원 달성!` };
      } else if (festRevenue >= 100000) {
        return { rank:'🥉 참가상', rep: 100, money: 0, msg:`참가 완료! 수익 ${festRevenue.toLocaleString()}원. 재료를 더 준비했다면...` };
      } else {
        return { rank:'😅 아쉬운 결과', rep: -20, money: -10000, msg:`부스 철수 비용 10,000원... 재료 사전 준비가 필수예요!` };
      }
    },
  },

  // ④ 미식가 초청 시식회 — 명성 8000+
  {
    id: 'gourmet_event',
    emoji: '🌟', name: '미식가 초청 시식회',
    triggerStage: 7, forceTrigger: false,
    requireRep: 8000,
    announceDays: 2,
    desc: '전국 50인의 미식가를 초대한 프라이빗 시식회! 인내심이 극도로 짧아요 — 15초 안에 서빙하지 못하면 퇴장!',
    prepChoices: [
      { label: '✨ 프리미엄 식재료 긴급 구매', desc: '고급 메뉴 점수 +40%', key: 'premium_ingr', cost: 60000 },
      { label: '👨‍🍳 수석 셰프 특별 지시 (직원 필요)', desc: '서빙 실수 없음 보장', key: 'chef_direct', cost: 0, requireStaff: true },
      { label: '📋 메뉴 구성 연구 (무료)', desc: '보유 최고가 메뉴 자동 선택', key: 'menu_study', cost: 0 },
    ],
    dayRule: '미식가 10명 연속 방문! 인내심 15% — 즉시 서빙 필수. 만족도 4.5 이상이어야 미슐랭 달성 가능.',
    judgeCount: 10,
    judgePatience: 18,   // ↑ 극도로 빡빡
    judgeOrders: ['steak','mushroom_risotto','truffle_pasta','prime_steak'],
    evaluate(ctx) {
      const { servedJudges, finalSat, prepKeys } = ctx;
      const bonusMult = prepKeys.includes('premium_ingr') ? 1.4 : 1.0;
      if (servedJudges >= 10 && finalSat >= 4.5) {
        return { rank:'⭐ 미슐랭 추천', rep: Math.round(2500*bonusMult), money: 250000, badge:'⭐', msg:'완벽! 미슐랭 가이드 추천 등재!', title:'미슐랭 스타 셰프' };
      } else if (servedJudges >= 10) {
        return { rank:'🥇 호평', rep: Math.round(1000*bonusMult), money: 100000, msg:`전원 서빙 성공! 만족도 ${finalSat.toFixed(1)} — 4.5 이상이었다면 미슐랭이었는데!` };
      } else if (servedJudges >= 7) {
        return { rank:'🥈 보통', rep: 300, money: 0, msg:`${servedJudges}/10명 서빙. 인내심이 짧으니 재료를 미리 채워두세요.` };
      } else {
        return { rank:'😞 혹평', rep: -150, money: 0, msg:'기대에 크게 못 미쳤어요. 고급 재료·스피드·만족도 모두 점검 필요!' };
      }
    },
  },

  // ⑤ 크리스마스 마켓 — 겨울 시즌 + 5단계
  {
    id: 'xmas_market',
    emoji: '🎄', name: '크리스마스 마켓',
    triggerStage: 5, forceTrigger: false,
    requireSeason: 'winter',
    announceDays: 1,
    desc: '마을 크리스마스 마켓 부스! 손님이 4배로 몰리지만 겨울 메뉴가 없으면 수익이 반 토막 나요.',
    prepChoices: [
      { label: '☃️ 겨울 메뉴 집중 준비', desc: '핫초코·비프 스튜 수익 2배', key: 'winter_menu', cost: 0 },
      { label: '🎄 부스 장식 투자', desc: '손님 만족도 +1 (당일만)', key: 'decor', cost: 25000 },
      { label: '🎁 무료 시식 행사', desc: '손님 5배, 수익 65%', key: 'free_taste', cost: 0 },
    ],
    dayRule: '겨울 손님 4배 폭주! 목표: 30명 서빙. 겨울 메뉴 미보유 시 수익 -30% 패널티.',
    judgeCount: 0,
    judgePatience: 55,
    judgeOrders: null,
    evaluate(ctx) {
      const { xmasServed } = ctx;
      if (xmasServed >= 30) {
        return { rank:'🥇 마켓 MVP', rep: 1200, money: 180000, badge:'🎄', msg:`${xmasServed}명 서빙! 크리스마스 마켓의 전설!`, title:'크리스마스 스타' };
      } else if (xmasServed >= 20) {
        return { rank:'🥈 인기 부스', rep: 500, money: 60000, msg:`${xmasServed}명 서빙! 따뜻한 인기 부스였어요.` };
      } else if (xmasServed >= 10) {
        return { rank:'🥉 참가상', rep: 120, money: 0, msg:`${xmasServed}명 서빙. 겨울 메뉴가 더 있었다면!` };
      } else {
        return { rank:'😅 조용한 부스', rep: 0, money: -10000, msg:'손님이 거의 없었어요... 겨울 메뉴 준비가 필수예요.' };
      }
    },
  },
];

// ── 대회 트리거 체크 ──
// 계절이 맞지 않는 대회 취소
function cancelContestIfWrongSeason() {
  if (!G.contest) return;
  const def = CONTESTS.find(c => c.id === G.contest.defId);
  if (!def || !def.requireSeason) return;
  const currentSeason = SEASONS[G.seasonIndex].id;
  if (def.requireSeason === currentSeason) return;
  // 계절 불일치 → 대회 취소, triggeredContests에서도 제거해서 올바른 계절에 다시 발동 가능하게
  addLog(`🗓️ 계절이 바뀌어 [${def.name}] 대회가 취소됐어요. 겨울에 다시 열려요!`);
  showNotif(`❄️ 계절이 바뀌어 ${def.emoji} ${def.name} 취소됐어요`);
  if (G.triggeredContests) {
    const idx = G.triggeredContests.indexOf(def.id);
    if (idx !== -1) G.triggeredContests.splice(idx, 1);
  }
  G.contest = null;
  updateContestBanner();
}

function checkContestTrigger() {
  if (G.contest) return;                  // 이미 진행 중
  if (Math.random() > 0.004) return;      // 초당 0.4% 확률 체크

  const seasonId = SEASONS[G.seasonIndex].id;
  const triggered = G.triggeredContests || [];

  // 계절 한정 대회를 먼저 별도 체크 — 지금 계절과 맞으면 우선 발동
  for (const c of CONTESTS) {
    if (!c.requireSeason) continue;
    if (triggered.includes(c.id)) continue;
    if (c.triggerStage > G.stage) continue;
    if (c.requireSeason !== seasonId) continue;          // 계절 불일치 → 스킵
    if (c.requireRecipes && !c.requireRecipes.every(r => G.learnedRecipes.includes(r))) continue;
    if (c.requireRep && G.reputation < c.requireRep) continue;
    launchContestAnnounce(c);
    return;
  }

  // 계절 무관 대회 체크
  for (const c of CONTESTS) {
    if (c.requireSeason) continue;                       // 계절 한정은 위에서 처리
    if (triggered.includes(c.id)) continue;
    if (c.triggerStage > G.stage) continue;
    if (c.requireRecipes && !c.requireRecipes.every(r => G.learnedRecipes.includes(r))) continue;
    if (c.requireRep && G.reputation < c.requireRep) continue;
    launchContestAnnounce(c);
    return;
  }
}

// 단계 달성 시 forceTrigger 대회 즉시 발생
function checkForcedContest(stage) {
  if (G.contest) return;
  const triggered = G.triggeredContests || [];
  const c = CONTESTS.find(x => x.forceTrigger && x.triggerStage === stage && !triggered.includes(x.id));
  if (c) setTimeout(()=>launchContestAnnounce(c), 3000);
}

function launchContestAnnounce(contestDef) {
  if (!G.triggeredContests) G.triggeredContests=[];
  G.triggeredContests.push(contestDef.id);
  G.contest = {
    defId: contestDef.id,
    phase: 'announce',   // announce → prep → day → result
    announceDay: G.day,
    startDay: G.day + contestDef.announceDays,
    prepKeys: [],
    servedJudges: 0,
    judgesLeft: [],
    perfectCombo: false,
    perfectIdx: 0,
    festRevenue: 0,
    xmasServed: 0,
    finalSat: G.satisfaction,
  };
  addLog(`🏆 [대회 공지] ${contestDef.name} — ${contestDef.announceDays}일 후 개최!`);
  showNotif(`🏆 ${contestDef.name} 개최 공지!`);
  updateContestBanner();
  // 모달은 큐를 통해 하나씩
  queueEvent(() => showContestAnnounceModal(contestDef));
}

// ── 매 tick 대회 진행 ──
function tickContest() {
  if (!G.contest) return;
  const def = getContestDef();
  if (!def) return;

  const c = G.contest;

  // announce → prep 전환
  if (c.phase === 'announce' && G.day >= c.startDay) {
    c.phase = 'prep';
    addLog(`🏆 [대회] ${def.name} 준비 기간 시작! 준비 선택지를 골라주세요.`);
    showNotif(`🏆 ${def.name} 준비 시작! 카페탭을 확인하세요`);
    updateContestBanner();
    queueEvent(() => showContestPrepModal(def));
    return;
  }

  // prep → day 전환 (준비 기간 1일 후)
  if (c.phase === 'prep' && G.day >= c.startDay + 1) {
    c.phase = 'day';
    c.dayStartMoney = G.money;
    c.dayStartServed = G.totalServed;
    // 준비 선택지 효과 즉시 적용
    applyPrepEffects(def, c);
    spawnContestJudges(def, c);
    addLog(`🏆 [대회 당일] ${def.name} 본선 시작! ${def.dayRule}`);
    showNotif(`🏆 ${def.name} 본선 시작!`);
    updateContestBanner();
    return;
  }

  // day 중 — 심사위원 스폰 완료 체크 (judgeCount > 0인 대회)
  if (c.phase === 'day' && def.judgeCount > 0) {
    // 심사위원이 모두 처리됐는지(서빙되거나 기다리다 감)
    const judgesStillWaiting = G.customers.filter(x => x.isContestJudge).length;
    const allDone = c.judgesLeft.length === 0 && judgesStillWaiting === 0 && c._judgesSpawned;
    if (allDone) {
      finishContest(def);
      return;
    }
    // 다음 심사위원 스폰
    if (c._judgeQueue && c._judgeQueue.length > 0 && !c._judgeSpawnTimer) {
      c._judgeSpawnTimer = setTimeout(()=>{
        c._judgeSpawnTimer = null;
        spawnNextJudge(def, c);
      }, 3000);
    }
  }

  // day 중 — 수익 기반 대회 (judgeCount === 0): 1일 경과 후 결과
  if (c.phase === 'day' && def.judgeCount === 0) {
    if (G.day >= c.startDay + 2) {
      finishContest(def);
    }
  }
}

function getContestDef() {
  if (!G.contest) return null;
  return CONTESTS.find(c => c.id === G.contest.defId) || null;
}

// ── 준비 효과 적용 ──
function applyPrepEffects(def, c) {
  const keys = c.prepKeys;
  if (def.id === 'barista_cup' && keys.includes('recipe_study')) {
    // 커피 계열 미습득 레시피 중 하나 무료 습득
    const coffeeRecipes = ['latte','americano','strawb_latte','peach_tea','spring_blossom','winter_choco','autumn_latte','summer_ice'];
    const notLearned = coffeeRecipes.filter(k => RECIPES[k] && !G.learnedRecipes.includes(k) && RECIPES[k].stageReq <= G.stage);
    if (notLearned.length > 0) {
      G.learnedRecipes.push(notLearned[0]);
      addLog(`📖 레시피 연구 성과: ${RECIPES[notLearned[0]].emoji} ${RECIPES[notLearned[0]].name} 무료 습득!`);
      renderMenu && renderMenu();
    }
  }
  if (def.id === 'dessert_fest' && keys.includes('grow_strawb')) {
    let planted = 0;
    G.plots.forEach((p,i) => {
      if (p.stage==='empty' && planted < 2 && G.money >= CROPS['strawb'].cost) {
        G.money -= CROPS['strawb'].cost;
        G.plots[i] = {crop:'strawb', plantedAt:Date.now(), growTime:CROPS['strawb'].growTime, stage:'growing'};
        planted++;
      }
    });
    if (planted > 0) addLog(`🍓 딸기 씨앗 ${planted}개 자동 심기 완료!`);
    renderFarm();
  }
  // 페스티벌·크리스마스: 손님 스폰 3배 속도
  if ((def.id === 'dessert_fest' || def.id === 'xmas_market')) {
    resetSpawnTimer(1200);
    addLog(`🎪 [대회 당일] 손님이 평소보다 3배 빠르게 몰려와요!`);
    showNotif(`🎪 손님 폭주 시작!`);
    // 대회 종료 후 스폰 원복 — 2일 뒤
    setTimeout(()=>{ if(!G.contest || G.contest.phase==='result') resetSpawnTimer(); }, 180000);
  }
  // 포장 투자: 만족도 +0.5
  if (keys.includes('packaging') || keys.includes('decor')) {
    G.satisfaction = Math.min(5, G.satisfaction + 0.5);
    addLog(`✨ [대회 준비] 인테리어/포장 효과: 만족도 +0.5`);
  }
  // SNS 홍보: 블로거 스폰율 임시 3배 (G._contestSNS 플래그)
  if (keys.includes('sns')) {
    G._contestSNS = true;
    addLog(`📱 SNS 홍보 효과: 블로거 손님 출현율 3배!`);
    setTimeout(()=>{ G._contestSNS = false; }, 180000);
  }
}

// ── 심사위원 스폰 ──
function spawnContestJudges(def, c) {
  if (def.judgeCount === 0) return;
  // 주문 목록 준비
  let orders = def.judgeOrders
    ? def.judgeOrders.filter(k => G.learnedRecipes.includes(k) && RECIPES[k].stageReq <= G.stage)
    : G.learnedRecipes.filter(k => RECIPES[k] && RECIPES[k].stageReq <= G.stage && !RECIPES[k].season).slice(0, def.judgeCount);
  // 학습된 메뉴가 없으면 보유 메뉴로 폴백
  if (orders.length === 0) orders = G.learnedRecipes.filter(k => RECIPES[k] && RECIPES[k].stageReq <= G.stage).slice(0, 3);

  c._judgeQueue = [];
  for (let i = 0; i < def.judgeCount; i++) {
    c._judgeQueue.push(orders[i % orders.length]);
  }
  c._judgesSpawned = false;
  c._judgeSpawnTimer = null;
  spawnNextJudge(def, c);
}

function spawnNextJudge(def, c) {
  if (!c._judgeQueue || c._judgeQueue.length === 0) {
    c._judgesSpawned = true;
    return;
  }
  if (G.customers.length >= 6) {
    // 대기
    c._judgeSpawnTimer = setTimeout(()=>{ c._judgeSpawnTimer=null; spawnNextJudge(def,c); }, 4000);
    return;
  }
  const orderKey = c._judgeQueue.shift();
  if (!RECIPES[orderKey]) { spawnNextJudge(def,c); return; }

  const judgeNames = ['김 심사위원','박 심사위원','이 심사위원','최 심사위원','정 심사위원',
                      '한 심사위원','오 심사위원','신 심사위원','장 심사위원','임 심사위원'];
  const judgeEmojis = ['👨‍⚖️','👩‍⚖️','🧑‍⚖️'];

  const cust = {
    id: Date.now() + Math.random(),
    name: judgeNames[c.servedJudges] || `심사위원 ${c.servedJudges+1}`,
    emoji: judgeEmojis[c.servedJudges % judgeEmojis.length],
    order: orderKey, order2: null,
    patience: def.judgePatience,
    type: 'vip',
    isContestJudge: true,
    judgeIdx: c.servedJudges + c._judgeQueue.length,  // for perfect combo tracking
  };
  G.customers.push(cust);
  appendCustCard(cust);
  document.getElementById('custCount').textContent = `(${G.customers.length}명)`;
  addLog(`👨‍⚖️ [대회] ${cust.name} 방문 — ${RECIPES[orderKey].emoji} ${RECIPES[orderKey].name} 주문`);
  updateServeAllBtn();

  if (c._judgeQueue.length === 0) c._judgesSpawned = true;
}

// ── 서빙 시 심사위원 체크 (serveCustomer 에서 호출) ──
function onContestJudgeServed(cust) {
  if (!G.contest || G.contest.phase !== 'day') return;
  const def = getContestDef();
  if (!def) return;
  const c = G.contest;

  c.servedJudges++;
  c.finalSat = G.satisfaction;

  // 퍼펙트 콤보 (바리스타 대회)
  if (def.judgeOrders) {
    if (cust.order === def.judgeOrders[c.perfectIdx]) {
      c.perfectIdx++;
      if (c.perfectIdx >= def.judgeOrders.filter(k=>G.learnedRecipes.includes(k)).length) {
        c.perfectCombo = true;
        floatText('🎯 퍼펙트 루틴!', window.innerWidth/2-60, window.innerHeight/3, '#D4A017');
        showNotif('🎯 퍼펙트 루틴 달성!');
        addLog('🎯 [대회] 퍼펙트 루틴 달성!!');
      }
    } else {
      c.perfectIdx = 0; // 순서 틀리면 리셋
    }
  }

  addLog(`✅ [대회] ${cust.name} 서빙 완료! (${c.servedJudges}/${def.judgeCount})`);
  floatText(`✅ 심사위원 +1`, window.innerWidth/2-60, window.innerHeight/3-30, '#5A8A3C');
}

// ── 수익 기반 대회 수익 누적 (serveCustomer 에서 호출) ──
function onContestRevenueServed(price, cust) {
  if (!G.contest || G.contest.phase !== 'day') return;
  const def = getContestDef();
  if (!def || def.judgeCount !== 0) return;
  const c = G.contest;

  const dessertKeys = ['strawb_cake','macaron','waffle','spring_strawb_crepe','strawb_smoothie'];
  const winterKeys  = ['winter_choco','winter_stew'];

  let earned = price;
  // 페스티벌: 디저트 1.5배
  if (def.id === 'dessert_fest' && (dessertKeys.includes(cust.order) || dessertKeys.includes(cust.order2))) {
    earned = Math.floor(price * 1.5);
    G.money += (earned - price); // 추가 수익
  }
  // 크리스마스: 겨울 메뉴 2배 (winter_menu 준비 시)
  if (def.id === 'xmas_market' && c.prepKeys.includes('winter_menu') && (winterKeys.includes(cust.order) || winterKeys.includes(cust.order2))) {
    const bonus = price;
    G.money += bonus;
    earned += bonus;
  }
  // 무료 시식 (70%만)
  if (def.id === 'xmas_market' && c.prepKeys.includes('free_taste')) {
    const penalty = Math.floor(price * 0.3);
    G.money -= penalty;
    earned -= penalty;
  }

  c.festRevenue = (c.festRevenue||0) + earned;
  if (def.id === 'xmas_market') c.xmasServed = (c.xmasServed||0) + 1;
}

// ── 대회 종료 및 결과 ──
function finishContest(def) {
  if (!G.contest || G.contest.phase === 'result') return;
  const c = G.contest;
  c.phase = 'result';

  const result = def.evaluate({
    servedJudges: c.servedJudges,
    prepKeys: c.prepKeys,
    perfectCombo: c.perfectCombo,
    festRevenue: c.festRevenue || 0,
    xmasServed: c.xmasServed || 0,
    finalSat: c.finalSat || G.satisfaction,
  });

  // 보상 적용
  if (result.rep > 0)  G.reputation = Math.max(0, G.reputation + result.rep);
  if (result.rep < 0)  G.reputation = Math.max(0, G.reputation + result.rep);
  if (result.money > 0) { G.money += result.money; G.totalMoneyEarned += result.money; }
  if (result.money < 0)  G.money = Math.max(0, G.money + result.money);
  if (result.badge) {
    if (!G.contestBadges) G.contestBadges = {};
    G.contestBadges[def.id] = result.badge;
  }

  // 전적 기록
  if (!G.contestHistory) G.contestHistory = [];
  G.contestHistory.unshift({ name: def.name, emoji: def.emoji, rank: result.rank, day: G.day });

  addLog(`🏆 [대회 결과] ${def.name}: ${result.rank}`);
  queueEvent(() => showContestResultModal(def, result));
  updateContestBanner();
  updateHeader();
  checkAchievements();
}

// ── 대회 배너 ──
function updateContestBanner() {
  // 대회 배너 HTML 생성 (공통)
  function makeContestBannerEl() {
    if (!G.contest || G.contest.phase === 'result') return null;
    const def = getContestDef(); if (!def) return null;
    const c = G.contest;

    const phaseLabel = {
      announce: `📢 D-${c.startDay - G.day} 공지`,
      prep:     '📋 준비 기간',
      day:      '🔥 대회 당일!',
    }[c.phase] || '';

    let extra = '';
    if (c.phase === 'day' && def.judgeCount > 0) extra = ` (${c.servedJudges}/${def.judgeCount}명 서빙)`;
    if (c.phase === 'day' && def.judgeCount === 0) extra = ` (수익: ${(c.festRevenue||0).toLocaleString()}원)`;

    const d = document.createElement('div');
    d.className = 'contest-banner';
    d.style.cssText = 'background:linear-gradient(135deg,#c0392b,#8e44ad);color:white;border-radius:10px;padding:8px 12px;font-size:12px;margin-bottom:4px;cursor:pointer;';
    d.innerHTML = `${def.emoji} <strong>[대회] ${def.name}</strong> <span style="font-size:10px;opacity:0.8;">${phaseLabel}${extra}</span>`;
    d.onclick = () => {
      if (c.phase === 'prep') showContestPrepModal(def);
      else showContestAnnounceModal(def);
    };
    return d;
  }

  // ① 카페탭 storyBannerArea
  const area = document.getElementById('storyBannerArea');
  if (area) {
    area.querySelectorAll('.contest-banner').forEach(el => el.remove());
    const el = makeContestBannerEl();
    if (el) area.prepend(el);
  }

  // ② 모바일 메인/관리탭 손님 패널 배너 (mob-story-banner-*)
  ['mob-story-banner-farm','mob-story-banner-manage'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.querySelectorAll('.contest-banner').forEach(e => e.remove());
    const cb = makeContestBannerEl();
    if (cb) { cb.style.marginBottom='4px'; el.prepend(cb); }
  });

  // ③ 메인탭 모바일 이벤트 배너 (기존 mob-event-banner-*)
  const farmBanner = document.getElementById('mob-event-banner-farm');
  if (farmBanner) {
    farmBanner.querySelectorAll('.contest-banner').forEach(el => el.remove());
    const el = makeContestBannerEl();
    if (el) { el.style.marginBottom = '5px'; farmBanner.prepend(el); }
  }

  // ④ 관리탭 모바일 이벤트 배너
  const manageBanner = document.getElementById('mob-event-banner-manage');
  if (manageBanner) {
    manageBanner.querySelectorAll('.contest-banner').forEach(el => el.remove());
    const el = makeContestBannerEl();
    if (el) { el.style.marginBottom = '5px'; manageBanner.prepend(el); }
  }

  // ⑤ 데스크탑 메인탭(좌측) 알림 패널
  const logPanel = document.getElementById('contest-banner-farm-desktop');
  if (logPanel) {
    logPanel.querySelectorAll('.contest-banner').forEach(el => el.remove());
    const el = makeContestBannerEl();
    if (el) logPanel.prepend(el);
  }

  // ⑥ 데스크탑 관리탭(우측) 패널
  const managePanel = document.getElementById('contest-banner-manage-desktop');
  if (managePanel) {
    managePanel.querySelectorAll('.contest-banner').forEach(el => el.remove());
    const el = makeContestBannerEl();
    if (el) managePanel.prepend(el);
  }
}

// ── 모달: 공지 ──
function showContestAnnounceModal(def) {
  const c = G.contest;
  document.getElementById('contestModalTitle').textContent = `${def.emoji} ${def.name}`;
  document.getElementById('contestModalBody').innerHTML = `
    <div style="font-size:13px;line-height:1.8;color:var(--text);margin-bottom:12px;">${def.desc}</div>
    <div style="background:rgba(142,68,173,0.08);border-radius:10px;padding:10px 12px;font-size:12px;color:var(--soil);margin-bottom:10px;">
      <strong>📋 본선 규칙:</strong><br>${def.dayRule}
    </div>
    <div style="background:rgba(212,160,23,0.1);border-radius:8px;padding:8px 12px;font-size:11px;color:var(--espresso);">
      🗓️ 본선 Day: <strong>${c.startDay + 1}</strong> (현재 Day ${G.day})
    </div>`;
  document.getElementById('contestModalBtns').innerHTML = `
    <button class="btn btn-primary" onclick="closeModal('contestModal')">알겠어요! 준비할게요 💪</button>`;
  showModal('contestModal');
}

// ── 모달: 준비 선택 ──
function showContestPrepModal(def) {
  const c = G.contest;
  document.getElementById('contestModalTitle').textContent = `${def.emoji} ${def.name} — 준비하기`;
  const choicesHtml = def.prepChoices.map((ch, i) => {
    const alreadyPicked = c.prepKeys.includes(ch.key);
    const needStaff = ch.requireStaff && Object.keys(G.staff||{}).length === 0;
    const cantAfford = ch.cost > 0 && G.money < ch.cost;
    const disabled = alreadyPicked || needStaff || cantAfford;
    const costTxt = ch.cost > 0 ? ` (💰${ch.cost.toLocaleString()}원)` : '';
    const staffWarn = needStaff ? '<span style="color:#e74c3c;font-size:10px;"> ⚠️직원 필요</span>' : '';
    return `
      <div style="background:${alreadyPicked?'rgba(90,138,60,0.12)':'rgba(107,66,38,0.06)'};border:1.5px solid ${alreadyPicked?'var(--grass)':'rgba(200,149,108,0.25)'};border-radius:10px;padding:10px 12px;margin-bottom:7px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="flex:1;">
            <div style="font-size:12px;font-weight:700;color:var(--espresso);">${ch.label}${costTxt}${staffWarn}</div>
            <div style="font-size:11px;color:var(--latte);margin-top:2px;">${ch.desc}</div>
          </div>
          <button onclick="pickContestPrep('${ch.key}',${ch.cost})" ${disabled?'disabled':''} class="btn ${alreadyPicked?'btn-green':'btn-primary'} btn-sm">
            ${alreadyPicked?'✅ 선택됨':'선택'}
          </button>
        </div>
      </div>`;
  }).join('');
  document.getElementById('contestModalBody').innerHTML = `
    <div style="font-size:12px;color:var(--latte);margin-bottom:10px;">최대 2개까지 선택할 수 있어요. (현재 ${c.prepKeys.length}/2)</div>
    ${choicesHtml}
    <div style="background:rgba(212,160,23,0.1);border-radius:8px;padding:8px 12px;font-size:11px;color:var(--espresso);margin-top:5px;">
      🔥 본선은 <strong>Day ${c.startDay + 1}</strong>에 자동 시작돼요!
    </div>`;
  document.getElementById('contestModalBtns').innerHTML = `
    <button class="btn btn-secondary" onclick="closeModal('contestModal')">닫기</button>`;
  showModal('contestModal');
}

function pickContestPrep(key, cost) {
  const c = G.contest;
  if (!c) return;
  if (c.prepKeys.includes(key)) return;
  if (c.prepKeys.length >= 2) { showNotif('⚠️ 준비 선택은 최대 2개까지!'); return; }
  if (cost > 0 && G.money < cost) { showNotif('💰 돈이 부족해요!'); return; }
  if (cost > 0) { G.money -= cost; updateHeader(); }
  c.prepKeys.push(key);
  const def = getContestDef();
  if (def) showContestPrepModal(def);
  addLog(`✅ [대회 준비] ${CONTESTS.flatMap(x=>x.prepChoices).find(x=>x.key===key)?.label || key} 선택!`);
  showNotif(`✅ 대회 준비 선택 완료!`);
}

// ── 모달: 결과 ──
function showContestResultModal(def, result) {
  const isWin = result.rank.includes('1위')||result.rank.includes('대상')||result.rank.includes('MVP')||result.rank.includes('미슐랭');
  const isMed = result.rank.includes('2위')||result.rank.includes('금상')||result.rank.includes('은상')||result.rank.includes('인기');
  const rankColors = { '🥇':['#D4A017','#fffbe6'], '🥈':['#aaa','#f0f0f0'], '🥉':['#cd7f32','#fff4ec'],
    '🏅':['#D4A017','#fffbe6'], '⭐':['#f39c12','#fffbe6'], '😞':['#e74c3c','#fff0f0'], '😅':['#e67e22','#fff7f0'] };
  const rankKey = Object.keys(rankColors).find(k => result.rank.includes(k)) || '🥉';
  const [color, bg] = rankColors[rankKey];

  document.getElementById('contestModalTitle').textContent = `${def.emoji} ${def.name} — 결과 발표!`;
  document.getElementById('contestModalBody').innerHTML = `
    <div style="text-align:center;padding:16px 0;">
      <div style="font-size:${isWin?72:52}px;margin-bottom:8px;animation:saIn 0.5s cubic-bezier(.34,1.56,.64,1);">${result.badge || def.emoji}</div>
      ${isWin ? `<div style="font-size:13px;color:#D4A017;font-family:'Jua',sans-serif;margin-bottom:6px;letter-spacing:2px;">🎊 축하합니다! 🎊</div>` : ''}
      <div style="background:${bg};border:2px solid ${color};border-radius:12px;padding:10px 18px;display:inline-block;margin-bottom:12px;
        ${isWin?'box-shadow:0 0 20px rgba(212,160,23,0.4);':''}">
        <span style="font-family:'Jua',sans-serif;font-size:22px;color:${color};">${result.rank}</span>
      </div>
      <div style="font-size:13px;line-height:1.8;color:var(--text);margin-bottom:12px;">${result.msg}</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        ${result.rep>0 ? `<div style="background:rgba(155,89,182,0.12);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;color:#8e44ad;">⭐ 명성 +${result.rep}</div>` : ''}
        ${result.rep<0 ? `<div style="background:rgba(231,76,60,0.12);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;color:#c0392b;">⭐ 명성 ${result.rep}</div>` : ''}
        ${result.money>0 ? `<div style="background:rgba(212,160,23,0.12);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;color:var(--gold);">💰 +${result.money.toLocaleString()}원</div>` : ''}
        ${result.money<0 ? `<div style="background:rgba(231,76,60,0.12);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;color:#c0392b;">💰 ${result.money.toLocaleString()}원</div>` : ''}
        ${result.title ? `<div style="background:rgba(212,160,23,0.12);border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;color:var(--espresso);">🏷️ ${result.title}</div>` : ''}
      </div>
    </div>`;
  document.getElementById('contestModalBtns').innerHTML = `
    <button class="btn ${isWin?'btn-gold':'btn-primary'}" onclick="closeModal('contestModal');G.contest=null;updateContestBanner();">계속하기 🚀</button>`;
  showModal('contestModal');
  contestWinEffect(result.rank);
  if (result.rep > 0) floatReward(`🏆 ${result.rank}`, '#D4A017');
}


function updateSaveStatus(isSaving) {
  const el = document.getElementById('save-status');
  if (!el) return;
  if (isSaving) {
    el.textContent = '💾 자동저장됨';
    el.style.color = 'var(--grass)';
    el.style.fontWeight = '600';
    G._lastSavedTime = Date.now();
    // 2초 후 색상 원래대로
    setTimeout(() => {
      if (el) { el.style.color = 'var(--latte)'; el.style.fontWeight = ''; }
    }, 2000);
  } else {
    const diff = G._lastSavedTime ? Math.floor((Date.now()-G._lastSavedTime)/1000) : null;
    if (diff === null) { el.textContent = '저장 안 됨'; el.style.color = 'var(--latte)'; }
    else if (diff < 60) { el.textContent = `💾 ${diff}초 전`; el.style.color = 'var(--latte)'; }
    else { el.textContent = `💾 ${Math.floor(diff/60)}분 전`; el.style.color = 'var(--latte)'; }
  }
}
setInterval(updateSaveStatus, 10000);

// ══════════════════════════════════════════
//  자동 저장 (60초마다)
// ══════════════════════════════════════════
setInterval(function autoSave() {
  // 게임이 시작되었고 브랜드명이 설정된 경우에만 자동저장
  if (!G || !G.brandName || G.brandName === '') return;
  saveToStorage();
  // 조용히 저장 (알림 없이), save-status UI만 업데이트됨
}, 60000);

// ══════════════════════════════════════════
//  우클릭 방지
// ══════════════════════════════════════════
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
  return false;
});
// 드래그 선택 방지 (이미지/텍스트 복사 방지)
document.addEventListener('selectstart', function(e) {
  // input, textarea 제외
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  e.preventDefault();
});

// ══════════════════════════════════════════
//  튜토리얼 시스템
// ══════════════════════════════════════════
let tutStep = 0;
let tutActive = false;

const TUTORIAL_STEPS = [
  {
    title: '🌱 농장에 오신 걸 환영해요!',
    emoji: '🌾',
    text: '밭을 눌러서 씨앗을 심어보세요. 스타터 재료(밀·설탕·달걀)가 준비되어 있어요!',
    hint: '메인탭 → 빈 밭 클릭',
  },
  {
    title: '⏳ 작물이 자라면 수확하세요',
    emoji: '🌿',
    text: '씨앗을 심으면 🌱→🌿→완성 순서로 자라요. 수확 준비가 되면 밭이 반짝여요!',
    hint: '반짝이는 밭 클릭 → 즉시 수확',
  },
  {
    title: '☕ 재료 20개를 모으면 카페 오픈!',
    emoji: '🏪',
    text: '창고에 재료가 20개 이상 쌓이면 카페탭에서 가게를 열 수 있어요.',
    hint: '카페탭 → 카페 오픈하기 버튼',
  },
  {
    title: '👥 손님이 오면 서빙하세요',
    emoji: '🍽️',
    text: '카페를 열면 손님이 방문해요. 인내심 바가 닳기 전에 서빙 버튼을 눌러주세요! 빠를수록 만족도와 명성이 올라가요.',
    hint: '손님 카드 → 서빙 ✓ 버튼',
  },
  {
    title: '🏆 명성을 쌓아 단계를 올려요!',
    emoji: '⭐',
    text: '손님을 서빙할수록 명성이 쌓이고, 노점 → 토스트점 → 분식점 → 카페 → 파인다이닝 순으로 성장해요!',
    hint: '즐거운 게임 되세요 🌟',
  },
];

function startTutorial() {
  if (localStorage.getItem('farmcafe_tut_done')) return;
  tutStep = 0;
  tutActive = true;
  showTutStep();
}

function showTutStep() {
  clearTutorial();
  if (tutStep >= TUTORIAL_STEPS.length) { endTutorial(); return; }
  const step = TUTORIAL_STEPS[tutStep];
  const isLast = tutStep === TUTORIAL_STEPS.length - 1;

  // 오버레이
  const overlay = document.createElement('div');
  overlay.id = 'tut-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1400;display:flex;align-items:center;justify-content:center;padding:20px;';

  overlay.innerHTML = `
    <div style="background:var(--cream);border-radius:20px;padding:24px 20px;max-width:340px;width:100%;border:2px solid var(--gold);box-shadow:0 12px 40px rgba(0,0,0,0.4);text-align:center;animation:tut-pop 0.3s cubic-bezier(.34,1.56,.64,1);">
      <div style="font-size:11px;color:var(--latte);margin-bottom:8px;">단계 ${tutStep+1} / ${TUTORIAL_STEPS.length}</div>
      <div style="font-size:48px;margin-bottom:10px;">${step.emoji}</div>
      <div style="font-family:'Jua',sans-serif;font-size:17px;color:var(--espresso);margin-bottom:10px;">${step.title}</div>
      <div style="font-size:13px;color:var(--soil);line-height:1.7;margin-bottom:12px;">${step.text}</div>
      <div style="background:rgba(212,160,23,0.12);border-radius:8px;padding:6px 10px;font-size:11px;color:var(--gold);font-weight:700;margin-bottom:16px;">💡 ${step.hint}</div>
      <div style="display:flex;gap:8px;justify-content:center;">
        <button onclick="endTutorial()" style="padding:8px 16px;border-radius:10px;border:1px solid rgba(107,66,38,0.2);background:transparent;color:var(--latte);font-size:12px;cursor:pointer;">건너뛰기</button>
        <button onclick="nextTutStep()" style="padding:8px 20px;border-radius:10px;border:none;background:var(--espresso);color:var(--cream);font-size:13px;font-weight:700;cursor:pointer;font-family:'Jua',sans-serif;">${isLast ? '시작하기 🚀' : '다음 →'}</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
}

function nextTutStep() { tutStep++; showTutStep(); }

function clearTutorial() {
  document.getElementById('tut-overlay')?.remove();
  document.getElementById('tut-hl')?.remove();
  document.getElementById('tut-tt')?.remove();
}

function endTutorial() {
  clearTutorial();
  tutActive = false;
  localStorage.setItem('farmcafe_tut_done', '1');
}


const REGULAR_STORIES = [
  // 일상적 방문
  '"{name}님이 오늘도 오셨어요! 항상 감사해요 🥰"',
  '"{name}님: 여기 음식이 최고예요! 매일 올게요~"',
  '"{name}님이 친구를 데려왔어요! 소문내줘서 고마워요 😊"',
  '"{name}님: 사장님 덕분에 요즘 행복해요!"',
  '"{name}님이 SNS에 우리 카페를 올렸대요! 🎉"',
  // 음식 칭찬
  '"{name}님: 어제도 생각나서 또 왔어요. 이집 중독인가봐요 😆"',
  '"{name}님이 포장 주문까지 했어요! 집에서도 먹고 싶대요 🛍️"',
  '"{name}님: 다른 데 가봤는데 역시 여기가 제일 맛있어요!"',
  '"{name}님이 메뉴 다 먹어봤다며 다음 신메뉴 기다린대요 🍽️"',
  '"{name}님: 이거 레시피 알 수 있을까요? 집에서도 만들고 싶어요!"',
  '"{name}님이 접시까지 깨끗하게 비웠어요 ✨"',
  '"{name}님: 가격 대비 너무 훌륭해요. 양도 많고!"',
  // 감동·감사
  '"{name}님: 힘든 날에도 여기 오면 기분이 나아져요 🌸"',
  '"{name}님이 생일을 우리 카페에서 보내고 싶대요 🎂"',
  '"{name}님: 직장 때문에 이 동네 왔는데, 여기 덕분에 행복해요!"',
  '"{name}님이 감사 카드를 두고 갔어요 💌"',
  '"{name}님: 사장님 항상 웃는 얼굴이 너무 좋아요 😊"',
  '"{name}님이 음료를 다 마시고 엄지척을 하고 갔어요 👍"',
  // 홍보·소문
  '"{name}님 덕분에 새 손님이 왔어요! 소문을 냈나봐요 📣"',
  '"{name}님: 회사 동료들한테 강력 추천했어요!"',
  '"{name}님이 블로그에 후기를 올렸어요! 사진도 예쁘게 찍었대요 📸"',
  '"{name}님: 부모님도 모시고 오고 싶어요. 꼭 다시 올게요!"',
  // 귀여운 에피소드
  '"{name}님이 자기 단골 자리가 생겼다며 좋아했어요 😄"',
  '"{name}님: 오늘 회의 잘 됐어요! 여기서 먹으면 왠지 잘 풀려요 🍀"',
  '"{name}님이 우산을 두고 갔다가 또 와서 겸사겸사 추가 주문했어요 ☂️"',
  '"{name}님: 다이어트 중인데 여기만큼은 참을 수가 없어요 🤤"',
  '"{name}님이 웨이팅 중에도 전혀 안 지루하다고 했어요 😊"',
  '"{name}님: 출근길에 들르는 게 하루의 낙이에요!"',
  '"{name}님이 늘 먹던 메뉴가 품절이자 실망하며 다음에 또 온다고 했어요 😢➡️🔜"',
  '"{name}님: 여기 없어지면 진짜 큰일나요. 오래오래 해주세요! 🙏"',
];

// 단골 심층 스토리 이벤트 (10·20·30회 방문 시)
const REGULAR_DEEP_EVENTS = [
  // ── 10회 방문 (3종 랜덤) ──
  { visits:10, variants:[
    { title:'🥰 단골 {name}님의 고백',
      text:'{name}님이 조심스럽게 말을 꺼냈어요. "사실... 여기 음식이 저한테 정말 큰 위로가 돼요. 힘든 시기에도 여기만 오면 기분이 나아지거든요." 따뜻한 말에 마음이 뭉클해져요.',
      choices:[
        {label:'☕ 오늘 음료 무료로 드리기', effect(name){ G.money=Math.max(0,G.money-5000); G.reputation+=60; showNotif(`🥰 ${name}님 감동! 명성 +60`); addLog(`☕ ${name}님께 음료 무료 서비스`); }},
        {label:'💌 단골 카드 만들어드리기', effect(name){ G.reputation+=100; if(G.regulars[name]) G.regulars[name].hasCard=true; showNotif(`💌 ${name}님 단골 카드 발급! 명성 +100`); addLog(`💌 ${name}님 단골 카드 발급`); }},
      ]},
    { title:'📖 {name}님의 이야기',
      text:'{name}님이 자리에 앉으며 말했어요. "저 사실 이 동네 처음 이사 왔을 때 되게 외로웠어요. 근데 여기 오면서 좀 안정이 된 것 같아요." 단골이 된 데에는 이유가 있었군요.',
      choices:[
        {label:'🌸 "항상 환영해요" 전하기', effect(name){ G.reputation+=80; showNotif(`🌸 ${name}님과 더 가까워졌어요! 명성 +80`); addLog(`🌸 ${name}님과 마음이 통했어요`); }},
        {label:'🎁 다음 방문 시 서비스 약속', effect(name){ if(G.regulars[name]) G.regulars[name].nextBonus=true; G.reputation+=120; showNotif(`🎁 ${name}님 다음 방문이 기대돼요! 명성 +120`); addLog(`🎁 ${name}님께 서비스 약속`); }},
      ]},
    { title:'😊 {name}님의 루틴',
      text:'{name}님이 웃으며 말했어요. "저 사실 매주 여기 오는 게 제 소확행이에요. 여기 안 오면 일주일이 허전해요!" 이 가게가 누군가의 작은 행복이 됐네요.',
      choices:[
        {label:'☕ 시그니처 메뉴 서비스', effect(name){ G.money=Math.max(0,G.money-3000); G.reputation+=70; showNotif(`☕ ${name}님의 소확행 지켜드릴게요! 명성 +70`); addLog(`☕ ${name}님 소확행 응원 서비스`); }},
        {label:'💌 단골 카드 발급', effect(name){ G.reputation+=110; if(G.regulars[name]) G.regulars[name].hasCard=true; showNotif(`💌 ${name}님 단골 카드! 명성 +110`); addLog(`💌 ${name}님 단골 카드 발급`); }},
      ]},
  ]},

  // ── 20회 방문 (3종 랜덤) ──
  { visits:20, variants:[
    { title:'🎂 {name}님의 생일!',
      text:'{name}님이 오늘 생일이에요! 몰래 케이크에 초를 꽂고 깜짝 파티를 준비할까요, 아니면 조용히 축하해드릴까요?',
      choices:[
        {label:'🎉 깜짝 파티 열기 (-15,000원)', effect(name){ if(G.money>=15000){G.money-=15000; G.reputation+=200; floatText('🎂 생일 파티!', window.innerWidth/2-60, window.innerHeight/3, '#e91e8c'); showNotif(`🎉 ${name}님 생일 파티! 명성 +200`);}else showNotif('돈이 부족해요!'); addLog(`🎉 ${name}님 생일 파티 개최`); }},
        {label:'🌸 꽃 한 송이 선물하기', effect(name){ G.reputation+=120; showNotif(`🌸 ${name}님 감동! 명성 +120`); addLog(`🌸 ${name}님께 꽃 선물`); }},
      ]},
    { title:'💼 {name}님의 승진 소식!',
      text:'{name}님이 활짝 웃으며 들어왔어요. "저 오늘 승진했어요! 기쁜 날 제일 먼저 여기 오고 싶었어요." 기쁜 날을 함께 나눌 수 있어서 뿌듯하네요.',
      choices:[
        {label:'🥂 축하 음료 서비스 (-10,000원)', effect(name){ if(G.money>=10000){G.money-=10000; G.reputation+=180; showNotif(`🥂 ${name}님 승진 축하! 명성 +180`);}else showNotif('돈이 부족해요!'); addLog(`🥂 ${name}님 승진 축하 서비스`); }},
        {label:'👏 진심으로 축하 전하기', effect(name){ G.reputation+=130; showNotif(`👏 ${name}님과 기쁨을 나눴어요! 명성 +130`); addLog(`👏 ${name}님 승진 축하`); }},
      ]},
    { title:'💬 {name}님의 부탁',
      text:'{name}님이 쑥스러워하며 말했어요. "저... 다음 주에 소개팅이 있는데 여기서 하면 될까요? 제가 제일 좋아하는 곳이라서요!" 이 가게가 특별한 날의 무대가 되겠네요.',
      choices:[
        {label:'🌹 특별석 준비해주기', effect(name){ G.reputation+=200; showNotif(`🌹 ${name}님 소개팅 성공을 빌어요! 명성 +200`); addLog(`🌹 ${name}님 소개팅 자리 준비`); }},
        {label:'🎵 분위기 있는 플레이리스트 틀기', effect(name){ G.reputation+=150; showNotif(`🎵 분위기 UP! ${name}님 소개팅 응원! 명성 +150`); addLog(`🎵 ${name}님 소개팅 분위기 세팅`); }},
      ]},
  ]},

  // ── 30회 방문 (3종 랜덤) ──
  { visits:30, variants:[
    { title:'🤝 {name}님의 제안',
      text:'{name}님이 진지하게 얘기했어요. "저 친구들 단체로 데려올게요. 사장님 가게 소문 제대로 내드릴게요!" 진짜 홍보대사가 될 것 같아요.',
      choices:[
        {label:'🙏 감사하게 받아들이기', effect(name){ G.reputation+=300; resetSpawnTimer(Math.max(5000,(parseInt(G._spawnRate)||25000)*0.7)); setTimeout(()=>resetSpawnTimer(),200000); showNotif(`🙏 ${name}님 홍보 시작! 명성 +300`); addLog(`📣 ${name}님 홍보대사 활동 시작!`); }},
        {label:'💰 사례금 드리기 (-30,000원)', effect(name){ if(G.money>=30000){G.money-=30000; G.reputation+=500; showNotif(`💰 ${name}님께 사례! 명성 +500`);}else showNotif('돈이 부족해요!'); addLog(`💰 ${name}님께 사례금 지급`); }},
      ]},
    { title:'📰 {name}님의 제보',
      text:'{name}님이 흥분해서 달려왔어요. "저 지역 신문사 다니는데요, 여기 기사 한 번 써도 될까요? 진짜 맛있는 곳 소개하고 싶어요!" 뜻밖의 기회가 찾아왔어요.',
      choices:[
        {label:'📷 인터뷰 수락하기', effect(name){ G.reputation+=400; showNotif(`📰 ${name}님 기사 게재! 명성 +400`); addLog(`📰 ${name}님 신문 기사 인터뷰`); }},
        {label:'🤫 조용히 운영하고 싶어요', effect(name){ G.reputation+=150; G.money+=30000; showNotif(`🤫 조용한 명성... 그래도 명성 +150, +30,000원`); addLog(`🤫 ${name}님 인터뷰 정중히 거절`); }},
      ]},
    { title:'🏆 {name}님의 선언',
      text:'{name}님이 당당하게 말했어요. "저 주변 사람들한테 여기가 동네 최고 맛집이라고 공식 선언했어요! 절대 다른 데 안 가요." 이보다 큰 칭찬이 있을까요?',
      choices:[
        {label:'🎖️ 명예 단골 인증서 드리기', effect(name){ G.reputation+=350; if(G.regulars[name]) G.regulars[name].hasCard=true; showNotif(`🎖️ ${name}님 명예 단골 등극! 명성 +350`); addLog(`🎖️ ${name}님 명예 단골 인증`); }},
        {label:'🍽️ 오늘 식사 전부 서비스', effect(name){ G.money=Math.max(0,G.money-20000); G.reputation+=450; showNotif(`🍽️ ${name}님 감동의 눈물! 명성 +450`); addLog(`🍽️ ${name}님 풀코스 서비스`); }},
      ]},
  ]},
];

function updateRegular(custName, menuKey) {
  if (!G.regulars) G.regulars={};
  if (!G.regulars[custName]) G.regulars[custName]={visits:0, lastMenus:[], hasCard:false};
  const r = G.regulars[custName];
  r.visits++;
  r.lastMenus.unshift(menuKey);
  if (r.lastMenus.length>5) r.lastMenus.pop();

  // 5방문마다 단골 스토리 메시지
  if (r.visits>0 && r.visits%5===0 && r.visits%10!==0) {
    const prevIdx = G.regulars[custName]._lastStoryIdx ?? -1;
    let storyIdx;
    do { storyIdx = Math.floor(Math.random() * REGULAR_STORIES.length); }
    while (storyIdx === prevIdx && REGULAR_STORIES.length > 1);
    G.regulars[custName]._lastStoryIdx = storyIdx;
    const story = REGULAR_STORIES[storyIdx].replace(/{name}/g, custName);
    addLog(`🥰 ${story}`);
    showNotif(`🥰 단골 ${custName}님 ${r.visits}번째 방문!`);
    const repBonus = Math.min(50, r.visits*5);
    G.reputation += repBonus;
    // 단골 카드 소지 시 보너스 +20%
    if (r.hasCard) G.reputation += Math.round(repBonus*0.2);
    floatText(`🥰 단골 +${repBonus}명성`, window.innerWidth/2-60, 200, '#e91e8c');
    floatReward(`🥰 명성 +${repBonus}`, '#e91e8c');
  }

  // 10·20·30회 방문: 심층 스토리 이벤트 (버전 랜덤)
  const deepEvDef = REGULAR_DEEP_EVENTS.find(e => e.visits === r.visits);
  if (deepEvDef && !G.triggeredEvents.has(`reg_deep_${custName}_${r.visits}`)) {
    G.triggeredEvents.add(`reg_deep_${custName}_${r.visits}`);
    // variants 중 이 손님이 아직 안 본 버전 우선 선택
    const seenKey = `reg_deep_seen_${custName}`;
    const seen = G._regDeepSeen?.[custName] || {};
    const available = deepEvDef.variants.filter((_, i) => !seen[`${r.visits}_${i}`]);
    const pool = available.length > 0 ? available : deepEvDef.variants;
    const pickedIdx = deepEvDef.variants.indexOf(pool[Math.floor(Math.random() * pool.length)]);
    if (!G._regDeepSeen) G._regDeepSeen = {};
    if (!G._regDeepSeen[custName]) G._regDeepSeen[custName] = {};
    G._regDeepSeen[custName][`${r.visits}_${pickedIdx}`] = true;
    const variant = deepEvDef.variants[pickedIdx];
    const ev = {
      title:   variant.title.replace(/{name}/g, custName),
      text:    variant.text.replace(/{name}/g, custName),
      choices: variant.choices.map(c => ({ label: c.label, effect: () => c.effect(custName) })),
    };
    triggerRegularDeepEvent(ev, custName, r.visits);
  }
}

function triggerRegularDeepEvent(ev, custName, visits) {
  queueEvent(() => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `<div class="modal" style="max-width:380px;">
      <div class="modal-title">${ev.title}</div>
      <div class="modal-body">
        <p style="font-size:13px;line-height:1.8;color:var(--text);margin-bottom:8px;">${ev.text}</p>
        <div style="font-size:11px;color:var(--latte);background:rgba(233,30,140,0.07);border-radius:8px;padding:6px 10px;">
          🥰 ${custName}님 방문 횟수: <strong style="color:#e91e8c;">${visits}회</strong>
        </div>
      </div>
      <div class="modal-btns" style="flex-direction:column;gap:8px;">
        ${ev.choices.map((c,i) => `<button class="btn btn-primary" style="width:100%" onclick="
          window._regDeepChoices[${i}]();
          this.closest('.modal-overlay').remove();
          updateHeader(); renderStaff();
          _eventDone();
        ">${c.label}</button>`).join('')}
      </div>
    </div>`;
    window._regDeepChoices = ev.choices.map(c => c.effect);
    document.body.appendChild(overlay);
  });
}

function getReg(name){ return G.regulars?.[name]; }

function renderReviews() {
  const list=document.getElementById('reviewList');
  if (!G.reviews.length) { list.innerHTML='<div style="text-align:center;color:var(--latte);font-size:12px;padding:10px;">아직 리뷰가 없어요</div>'; return; }
  const firstText=list.querySelector('.rv-text')?.textContent;
  if (firstText===G.reviews[0]?.text) return;
  list.innerHTML=G.reviews.slice(0,10).map(r=>`
    <div class="review-row ${r.special?'rv-special':''}">
      <div class="rv-stars">${'🩵'.repeat(r.stars)}${'🤍'.repeat(5-r.stars)}</div>
      <div class="rv-text">${r.text}</div>
      <div class="rv-name">— ${r.name}</div>
    </div>`).join('');
}

// ══════════════════════════════════════════
//  🎁 매일 출석 보너스 (룰렛형)
// ══════════════════════════════════════════

const DAILY_BONUS_POOL = [
  // 돈 보상
  { emoji:'💰', label:'용돈',        value:'+5,000원',   type:'money',  amount:5000,   weight:25 },
  { emoji:'💵', label:'보너스',      value:'+15,000원',  type:'money',  amount:15000,  weight:18 },
  { emoji:'💴', label:'횡재',        value:'+30,000원',  type:'money',  amount:30000,  weight:10 },
  { emoji:'💎', label:'대박!',       value:'+80,000원',  type:'money',  amount:80000,  weight:4  },
  { emoji:'👑', label:'잭팟!!!',     value:'+200,000원', type:'money',  amount:200000, weight:1  },
  // 명성 보상
  { emoji:'⭐', label:'소문',        value:'+20 명성',   type:'rep',    amount:20,     weight:22 },
  { emoji:'🌟', label:'입소문',      value:'+60 명성',   type:'rep',    amount:60,     weight:12 },
  { emoji:'✨', label:'화제!',       value:'+100 명성',  type:'rep',    amount:100,    weight:6  },
  { emoji:'🏆', label:'전설',        value:'+130 명성',  type:'rep',    amount:130,    weight:2  }
];

// 가중치 기반 랜덤 선택
function weightedRandom(pool) {
  const total = pool.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const x of pool) { r -= x.weight; if (r <= 0) return x; }
  return pool[pool.length - 1];
}

// 오늘 날짜 키
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

// 미수령 여부 체크 — 게임 day 기준
// 미수령 여부 체크 — 실제 날짜 기준
function isDailyBonusAvailable() {
  try {
    const data = JSON.parse(localStorage.getItem('daily_bonus') || '{}');
    return data.date !== getTodayKey();
  } catch(e) { return true; }
}

// 연속 출석일 수
function getDailyStreak() {
  try {
    const data = JSON.parse(localStorage.getItem('daily_bonus') || '{}');
    if (!data.date) return 0;
    const last = new Date(data.date);
    const today = new Date(getTodayKey());
    const diff = (today - last) / 86400000;
    return diff === 1 ? (data.streak || 1) : 0;
  } catch(e) { return 0; }
}

function saveDailyBonus(streak) {
  localStorage.setItem('daily_bonus', JSON.stringify({ date: getTodayKey(), streak }));
}

// 출석 버튼 상태 갱신
function updateDailyBonusBtn() {
  const avail = isDailyBonusAvailable();
  const btn = document.getElementById('dailyBonusBtn');
  const dot  = document.getElementById('dailyBonusDot');
  const dotM = document.getElementById('dailyBonusDotMob');
  if (btn) btn.classList.toggle('available', avail);
  if (dot)  dot.style.display  = avail ? 'block' : 'none';
  if (dotM) dotM.style.display = avail ? 'block' : 'none';
}

// 룰렛 오픈
function openDailyBonus() {
  const body = document.getElementById('dailyBonusBody');
  const btns = document.getElementById('dailyBonusBtns');
  const avail = isDailyBonusAvailable();
  const streak = getDailyStreak() + (avail ? 1 : 0);

  if (!avail) {
    // 이미 수령
    body.innerHTML = `
      <div class="streak-badge">🔥 ${(()=>{try{return JSON.parse(localStorage.getItem('daily_bonus')||'{}').streak||1;}catch(e){return 1;}})()}일 연속 출석!</div>
      <div style="font-size:40px;margin:12px 0;">✅</div>
      <div style="font-size:14px;font-weight:700;color:var(--espresso);margin-bottom:6px;">오늘 이미 수령했어요!</div>
      <div style="font-size:12px;color:var(--latte);">다음 날이 되면 새 보너스가 준비돼요 🌙</div>`;
    btns.innerHTML = `<button class="btn btn-secondary" onclick="closeModal('dailyBonusModal')">닫기</button>`;
    showModal('dailyBonusModal');
    return;
  }

  // 룰렛 아이템 생성 (12개 — 가중치 섞어서)
  const displayItems = [];
  for (let i = 0; i < 12; i++) displayItems.push(weightedRandom(DAILY_BONUS_POOL));
  // 당첨 아이템 — 연속 출석 보너스 적용
  const winner = weightedRandom(
    streak >= 7 ? DAILY_BONUS_POOL.map(x => ({...x, weight: x.weight * (x.amount >= 80000 || x.amount >= 400 ? 4 : 1)})) :
    streak >= 3 ? DAILY_BONUS_POOL.map(x => ({...x, weight: x.weight * (x.amount >= 15000 || x.amount >= 60 ? 2 : 1)})) :
    DAILY_BONUS_POOL
  );
  const winnerIdx = 8; // 가운데쯤
  displayItems[winnerIdx] = winner;

  // 스트릭 메시지
  const streakMsg = streak >= 7 ? `🔥 7일 연속! 희귀 보상 확률 UP!` :
                   streak >= 3 ? `🔥 ${streak}일 연속! 좋은 보상 확률 UP!` :
                   streak >= 2 ? `🔥 ${streak}일 연속 출석!` : `오늘도 방문해줘서 고마워요! 🌱`;

  body.innerHTML = `
    <div class="streak-badge">🔥 ${streak}일 연속 출석</div>
    <div style="font-size:12px;color:var(--latte);margin-bottom:12px;">${streakMsg}</div>
    <div class="roulette-wrap">
      <div id="rouletteTrack" class="roulette-track">
        ${displayItems.map((item, i) => `
          <div class="roulette-item${i===winnerIdx?' winner':''}" id="ri-${i}">
            <div class="roulette-emoji">${item.emoji}</div>
            <div class="roulette-label">${item.label}</div>
            <div class="roulette-value">${item.value}</div>
          </div>`).join('')}
      </div>
      <div style="position:absolute;top:0;bottom:0;left:50%;transform:translateX(-50%);width:88px;border:2.5px solid var(--gold);border-radius:12px;pointer-events:none;box-shadow:0 0 12px rgba(212,160,23,0.4);"></div>
    </div>
    <div id="rouletteResult" style="margin-top:14px;min-height:48px;"></div>`;

  btns.innerHTML = `<button class="btn btn-gold" id="spinBtn" onclick="spinRoulette(${winnerIdx})">🎰 돌리기!</button>`;
  showModal('dailyBonusModal');
}

function spinRoulette(winnerIdx) {
  const spinBtn = document.getElementById('spinBtn');
  if (!spinBtn || spinBtn.disabled) return;
  spinBtn.disabled = true;
  spinBtn.textContent = '🎰 돌리는 중...';

  const track = document.getElementById('rouletteTrack');
  // 실제 아이템 너비 + 마진을 DOM에서 측정 (고정값 대신)
  const firstItem = track.children[0];
  let ITEM_W = 88;
  if (firstItem) {
    const cs = window.getComputedStyle(firstItem);
    ITEM_W = firstItem.offsetWidth
           + parseFloat(cs.marginLeft  || 0)
           + parseFloat(cs.marginRight || 0);
  }
  const wrapW  = track.parentElement.clientWidth;
  const targetPos = winnerIdx * ITEM_W - (wrapW / 2) + ITEM_W / 2;

  let pos = 0;
  let speed = 24;
  let frame = 0;

  // 하이라이트 순환
  let hlIdx = 0;
  const hlInterval = setInterval(() => {
    track.querySelectorAll('.roulette-item').forEach(el => el.classList.remove('highlight'));
    const el = track.children[hlIdx % track.children.length];
    if (el) el.classList.add('highlight');
    hlIdx++;
  }, 75);

  const scrollInterval = setInterval(() => {
    frame++;
    if (frame > 28) speed = Math.max(0.8, speed - 1.4);
    pos += speed;
    track.style.transform = `translateX(-${pos}px)`;

    if (speed <= 0.8 && pos >= targetPos) {
      clearInterval(scrollInterval);
      clearInterval(hlInterval);
      track.style.transform = `translateX(-${targetPos}px)`;
      track.querySelectorAll('.roulette-item').forEach(el => el.classList.remove('highlight'));
      showBonusResult(winnerIdx);
    }
  }, 16);
}

function showBonusResult(winnerIdx) {
  const track = document.getElementById('rouletteTrack');
  const winnerEl = track.children[winnerIdx];
  if (winnerEl) winnerEl.classList.add('winner');

  // 당첨 아이템 파악
  const emoji = winnerEl.querySelector('.roulette-emoji').textContent;
  const label = winnerEl.querySelector('.roulette-label').textContent;
  const valueText = winnerEl.querySelector('.roulette-value').textContent;

  // 보상 지급
  const matchedItem = DAILY_BONUS_POOL.find(x => x.emoji === emoji && x.label === label);
  if (matchedItem) {
    if (matchedItem.type === 'money') G.money += matchedItem.amount;
    if (matchedItem.type === 'rep')   G.reputation += matchedItem.amount;
    updateHeader();
    checkAchievements();
    audio.init(); audio.playSfx('money');
    floatText(`${emoji} ${valueText}`, window.innerWidth/2 - 40, window.innerHeight/3, '#D4A017');
  }

  // 저장
  const streak = getDailyStreak() + 1;
  saveDailyBonus(streak);
  updateDailyBonusBtn();

  const resultEl = document.getElementById('rouletteResult');
  if (resultEl) {
    resultEl.innerHTML = `
      <div style="font-size:28px;margin-bottom:4px;">${emoji}</div>
      <div style="font-family:'Jua',sans-serif;font-size:18px;color:var(--gold);">${valueText} 획득!</div>
      <div style="font-size:11px;color:var(--latte);margin-top:4px;">내일 또 출석하면 보상이 더 좋아져요! 🌟</div>`;
  }

  const btns = document.getElementById('dailyBonusBtns');
  if (btns) btns.innerHTML = `<button class="btn btn-gold" onclick="closeModal('dailyBonusModal')">감사해요! 🎉</button>`;

  addLog(`🎁 출석 보너스: ${emoji} ${valueText} 획득!`);
  showNotif(`🎁 출석 보너스 ${valueText}!`);
}

// 게임 부팅 후 출석 버튼 상태 초기화 + 자동 팝업
function initDailyBonus() {
  updateDailyBonusBtn();
  // 미수령이면 3초 후 큐를 통해 자동 팝업 (다른 이벤트와 충돌 방지)
  if (isDailyBonusAvailable()) {
    setTimeout(() => {
      queueEvent(() => {
        if (!document.querySelector('.modal-overlay.show')) {
          openDailyBonus();
        } else {
          _eventDone(); // 이미 다른 모달이 있으면 그냥 건너뜀
        }
      });
    }, 3000);
  }
}

// ══════════════════════════════════════════
//  🌱 전체 재배 (부족한 재료 자동 심기)
// ══════════════════════════════════════════
function plantAllNeeded() {
  const emptyPlots = G.plots.map((p,i)=>({p,i})).filter(({p})=>p.stage==='empty');
  if (emptyPlots.length === 0) { showNotif('🌱 빈 밭이 없어요!'); return; }

  // 부족한 재료 계산
  const needs = {};
  const seasonCrops = SEASONS[G.seasonIndex].dayCrops;
  G.learnedRecipes.forEach(rk => {
    const r = RECIPES[rk];
    if (!r || r.stageReq > G.stage) return;
    Object.entries(r.ingredients).forEach(([item, qty]) => {
      const have = G.inventory[item] || 0;
      if (have < qty * 3) {
        const cropKey = Object.keys(CROPS).find(ck => CROPS[ck].gives === item);
        if (cropKey) needs[cropKey] = (needs[cropKey] || 0) + Math.max(0, qty * 3 - have);
      }
    });
  });

  // 계절 작물 우선 정렬
  const sorted = Object.entries(needs).sort((a, b) => {
    const aS = seasonCrops.includes(a[0]) ? 1 : 0;
    const bS = seasonCrops.includes(b[0]) ? 1 : 0;
    return bS - aS || b[1] - a[1];
  });

  if (sorted.length === 0) { showNotif('🌱 현재 재료는 충분해요!'); return; }

  let planted = 0;
  emptyPlots.forEach(({i}) => {
    const [cropKey] = sorted[planted % sorted.length] || [];
    if (!cropKey) return;
    const crop = CROPS[cropKey];
    if (!crop || G.money < crop.cost) return;
    G.money -= crop.cost;
    G.plots[i] = {crop: cropKey, plantedAt: Date.now(), growTime: crop.growTime, stage: 'growing'};
    planted++;
  });

  if (planted > 0) {
    audio.init(); audio.playSfx('plant');
    showNotif(`🌱 빈 밭 ${planted}개에 자동 재배 시작!`);
    addLog(`🌱 전체 재배: ${planted}개 밭 심기 완료`);
    renderFarm(); renderInventory(); updateHeader();
  } else {
    showNotif('💰 돈이 부족해요!');
  }
}

// ══════════════════════════════════════════
//  🎹 키보드 단축키 시스템
// ══════════════════════════════════════════
document.addEventListener('keydown', function(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  // 스페이스바: 일시정지/재개
  if (e.code === 'Space') { e.preventDefault(); togglePause(); return; }
  // S: 저장
  if (e.key === 's' || e.key === 'S') { if (!e.ctrlKey && !e.metaKey) { saveGame(); showNotif('💾 저장 완료!'); } return; }
  // H: 전체 수확
  if (e.key === 'h' || e.key === 'H') { harvestAll(); return; }
  // A: 전체 서빙
  if (e.key === 'a' || e.key === 'A') {
    const btn = document.getElementById('serveAllBtn');
    if (btn && !btn.disabled) btn.click();
    return;
  }
  // 1/2/3: 모바일 탭 전환
  if (e.key === '1') { if(document.getElementById('mbt-farm')) mobTab('farm'); }
  if (e.key === '2') { if(document.getElementById('mbt-cafe')) mobTab('cafe'); }
  if (e.key === '3') { if(document.getElementById('mbt-manage')) mobTab('manage'); }
  // ?: 단축키 도움말
  if (e.key === '?' || e.key === '/') { showHotkeyHelp(); return; }
});

function showHotkeyHelp() {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(59,31,15,0.7);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);';
  el.innerHTML = `<div style="background:var(--cream);border-radius:18px;padding:24px 28px;max-width:320px;border:2px solid rgba(212,160,23,0.3);box-shadow:0 16px 50px rgba(59,31,15,0.3);">
    <div style="font-family:'Nanum Myeongjo',serif;font-size:17px;font-weight:800;color:var(--espresso);margin-bottom:14px;text-align:center;">⌨️ 키보드 단축키</div>
    <div style="display:flex;flex-direction:column;gap:7px;font-size:12px;">
      ${[['Space','일시정지 / 재개'],['H','전체 수확'],['A','전체 서빙'],['S','게임 저장'],['1/2/3','탭 전환 (모바일)'],['?','이 도움말']].map(([k,v])=>`
        <div style="display:flex;align-items:center;gap:10px;">
          <kbd style="background:var(--espresso);color:var(--cream);padding:3px 9px;border-radius:6px;font-size:11px;font-family:monospace;min-width:28px;text-align:center;">${k}</kbd>
          <span style="color:var(--soil);">${v}</span>
        </div>`).join('')}
    </div>
    <div style="text-align:center;margin-top:16px;">
      <button onclick="this.closest('div[style*=inset]').remove()" style="background:var(--espresso);color:var(--cream);border:none;border-radius:9px;padding:8px 20px;font-family:'Gowun Dodum',sans-serif;font-size:13px;cursor:pointer;">닫기</button>
    </div>
  </div>`;
  document.body.appendChild(el);
  el.addEventListener('click', function(ev){ if(ev.target===el) el.remove(); });
}

// ══════════════════════════════════════════
//  💰 시간별 수익 스파크라인
// ══════════════════════════════════════════
const _incomeHistory = []; // 최근 10 게임일 수익
let _incomeThisDay = 0;

function recordDailyIncome(amount) {
  _incomeThisDay += amount;
}

function pushDailyIncome() {
  _incomeHistory.push(_incomeThisDay);
  if (_incomeHistory.length > 10) _incomeHistory.shift();
  _incomeThisDay = 0;
  renderSparkline();
}

function renderSparkline() {
  const el = document.getElementById('income-sparkline');
  if (!el || _incomeHistory.length < 2) return;
  const max = Math.max(..._incomeHistory, 1);
  el.innerHTML = _incomeHistory.map((v,i) => {
    const h = Math.max(4, Math.round((v / max) * 30));
    const isToday = i === _incomeHistory.length - 1;
    return `<div class="spark-bar" style="height:${h}px;${isToday?'background:linear-gradient(var(--gold),var(--sun));':''};" title="${v.toLocaleString()}원"></div>`;
  }).join('');
}

// ══════════════════════════════════════════
//  ❄️ 날씨 시각 이펙트
// ══════════════════════════════════════════
let _weatherFx = null;

function updateWeatherFx() {
  const overlay = document.getElementById('weather-overlay');
  if (!overlay) return;

  const w = G.weather?.id;
  // 현재 이펙트가 동일하면 스킵
  if (_weatherFx === w) return;
  _weatherFx = w;
  overlay.innerHTML = '';

  if (w === 'blizzard' || w === 'rain') {
    const count = w === 'blizzard' ? 20 : 15;
    const char = w === 'blizzard' ? '❄' : '💧';
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = w === 'blizzard' ? 'snowflake' : 'raindrop';
      el.textContent = char;
      el.style.left = Math.random() * 100 + 'vw';
      el.style.fontSize = (8 + Math.random() * 8) + 'px';
      el.style.animationDuration = (2 + Math.random() * 4) + 's';
      el.style.animationDelay = (-Math.random() * 4) + 's';
      overlay.appendChild(el);
    }
  }
}

// ══════════════════════════════════════════
//  📊 수익 기록 + 스파크라인 훅 연결
// ══════════════════════════════════════════

// 날씨 이펙트 — 3초마다 체크
setInterval(() => { updateWeatherFx(); }, 3000);

// 수익 스파크라인 — 매 게임일 변경 시 갱신 (2초마다 체크)
let _lastDay = 0;
setInterval(() => {
  if (G.day !== _lastDay) {
    if (_lastDay > 0) pushDailyIncome();
    _lastDay = G.day;
  }
}, 2000);

// ══════════════════════════════════════════
//  🎯 재료 부족 경고 시스템
// ══════════════════════════════════════════
let _warnBusy = false;
function checkIngredientWarnings() {
  if (_warnBusy || !G.cafeOpen) return;
  _warnBusy = true;
  try {
    const chips = document.querySelectorAll('#inventoryInline .inv-chip');
    const items = Object.keys(ITEMS);
    chips.forEach((chip, i) => {
      const key = items[i];
      if (!key) return;
      const qty = G.inventory[key] || 0;
      const needed = G.learnedRecipes.some(rk => {
        const r = RECIPES[rk];
        return r && r.stageReq <= G.stage && r.ingredients[key] && qty < 3;
      });
      chip.classList.toggle('warn', needed && qty < 3);
    });
  } finally {
    _warnBusy = false;
  }
}

// ── 모바일 탭 전환 ──
function mobTab(t) {
  ['farm','cafe','manage'].forEach(function(n) {
    var col = document.getElementById('col-'+n);
    var btn = document.getElementById('mbt-'+n);
    if (col) col.classList.remove('tab-show');
    if (btn) btn.classList.remove('on');
  });
  var c = document.getElementById('col-'+t);
  var b = document.getElementById('mbt-'+t);
  if (c) c.classList.add('tab-show');
  if (b) b.classList.add('on');
  window.scrollTo(0, 0);
  // 탭 전환 후 알림 위치 재계산
  requestAnimationFrame(function() {
    var h = document.querySelector("header");
    if (h) document.documentElement.style.setProperty("--notif-top", (h.offsetHeight + 8) + "px");
    _updateNotifPositions();
  });
}

// ── 모바일 방문손님 + 단계 미니패널 업데이트 (1초마다) ──
setInterval(function() {
  if (window.innerWidth > 768) return;

  // ── 공통 계산 ──
  var cur = G.reputation;
  var prev = STAGE_DATA[G.stage].repReq;
  var nextData = STAGE_DATA[G.stage + 1];
  var next = nextData ? nextData.repReq : prev;
  var pct = G.stage >= 9 ? 100 : (next > prev ? Math.min(100, ((cur - prev) / (next - prev)) * 100) : 0);
  var progressText = G.stage >= 9 ? '🏆 최고 단계!' : cur.toLocaleString() + ' / ' + next.toLocaleString() + ' 명성';
  var stageLabel = STAGE_DATA[G.stage].name;
  var countText = G.cafeOpen ? '(' + G.customers.length + '명)' : '';
  var hasCust = G.cafeOpen && G.customers.length > 0;

  // ── 손님 카드 HTML ──
  var emptyHTML = '<div style="font-size:12px;color:rgba(255,248,240,0.45);text-align:center;">' +
    (G.cafeOpen ? '손님을 기다리는 중...' : '카페 오픈 후 손님이 방문해요') + '</div>';

  function makeCustHTML() {
    return G.customers.map(function(c) {
      var recipe = RECIPES[c.order] || {};
      var r2 = c.order2 ? RECIPES[c.order2] : null;
      var orderText = (recipe.emoji||'') + ' ' + (recipe.name||'') + (r2 ? ' <span style="color:#F4C430;">+ ' + r2.emoji + ' ' + r2.name + '</span>' : '');
      var pc = c.patience > 60 ? '#5A8A3C' : c.patience > 30 ? '#F4C430' : '#e74c3c';
      var td = SPECIAL_TYPES[c.type];
      var tag = td ? '<span style="font-size:9px;background:rgba(255,255,255,0.15);color:white;padding:1px 5px;border-radius:5px;margin-left:3px;">' + td.label + '</span>' : '';
      // 단골 배지
      var reg = G.regulars && G.regulars[c.name];
      var regVisits = reg ? (reg.visits||0) : 0;
      var regBadge = regVisits >= 5 ? '<span style="font-size:9px;background:rgba(233,30,140,0.2);color:#e91e8c;padding:1px 4px;border-radius:4px;margin-left:2px;">🥰단골'+regVisits+'회</span>' : '';
      // 선호 메뉴 배지
      var favMenu = reg && reg.favMenu && reg.visits >= 5 && RECIPES[reg.favMenu];
      var favBadge = (favMenu && reg.favMenu === c.order) ? '<span style="font-size:9px;background:rgba(212,160,23,0.2);color:#D4A017;padding:1px 4px;border-radius:4px;margin-left:2px;">' + favMenu.emoji + '단골</span>' : '';
      return '<div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.08);border-radius:8px;padding:6px 9px;margin-bottom:4px;">' +
        '<span style="font-size:20px;">' + c.emoji + '</span>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:11px;font-weight:600;color:white;">' + c.name + tag + regBadge + favBadge + '</div>' +
          '<div style="font-size:10px;color:rgba(255,248,240,0.6);">' + orderText + '</div>' +
          '<div style="height:3px;background:rgba(255,255,255,0.15);border-radius:2px;margin-top:3px;">' +
            '<div style="height:100%;width:' + c.patience + '%;background:' + pc + ';border-radius:2px;transition:width 0.8s;"></div>' +
          '</div>' +
        '</div>' +
        '<button onclick="serveCustomer(' + c.id + ',false,\'\')" style="background:#5A8A3C;color:white;border:none;border-radius:7px;padding:4px 9px;font-size:11px;cursor:pointer;font-family:\'Gowun Dodum\',sans-serif;font-weight:600;">서빙</button>' +
      '</div>';
    }).join('');
  }

  var custHTML = hasCust ? makeCustHTML() : emptyHTML;

  // ── 모바일 배너 HTML 생성 (storyBannerArea와 동일한 내용) ──
  function makeMobBannerHTML() {
    var html = '';
    var bannerStyle = 'border-radius:8px;padding:6px 10px;font-size:11px;margin-bottom:5px;color:white;';
    if (G.crisisActive) html += '<div style="background:rgba(192,57,43,0.8);' + bannerStyle + 'animation:contestPulse 1.5s infinite;">🚨 <strong>폐업 위기!</strong> (' + G.crisisDaysLeft + '일 남음)</div>';
    if (G.weather) html += '<div style="background:rgba(41,128,185,0.7);' + bannerStyle + '">' + G.weather.emoji + ' <strong>' + G.weather.name + '</strong> ~Day ' + G.weather.endDay + '</div>';
    // 납품 주문
    var activeSupply = (G.supplyOrders||[]).filter(function(o){return !o.done;});
    if (activeSupply.length) {
      html += '<div style="background:rgba(26,82,118,0.7);' + bannerStyle + '"><div style="font-weight:700;margin-bottom:3px;">📦 납품 주문</div>';
      activeSupply.forEach(function(o) {
        var have = G.inventory[o.item]||0;
        var canFill = have >= o.qty;
        var daysLeft = o.failDay - G.day;
        html += '<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">' +
          '<span>' + o.emoji + '</span>' +
          '<span style="flex:1;font-size:10px;">' + o.name + ' ' + have + '/' + o.qty + '개 (' + daysLeft + '일)</span>' +
          '<button onclick="fulfillSupplyOrder(\'' + o.id + '\')" ' + (canFill?'':'disabled') +
          ' style="background:' + (canFill?'#27ae60':'rgba(255,255,255,0.2)') + ';color:white;border:none;border-radius:5px;padding:2px 6px;font-size:9px;cursor:' + (canFill?'pointer':'not-allowed') + ';font-family:\'Gowun Dodum\',sans-serif;">' +
          (canFill?'납품':'부족') + '</button></div>';
      });
      html += '</div>';
    }
    // 퀘스트
    var activeQ = (G.quests||[]).filter(function(q){return !q.done;});
    if (activeQ.length) {
      html += '<div style="background:rgba(108,52,131,0.7);' + bannerStyle + '"><div style="font-weight:700;margin-bottom:3px;">🎯 퀘스트</div>';
      activeQ.forEach(function(q) {
        var qpct = Math.min(100, Math.round(q.current/q.goal*100));
        html += '<div style="font-size:10px;margin-bottom:3px;">' + q.desc + ' (' + q.current + '/' + q.goal + ')' +
          '<div style="height:3px;background:rgba(255,255,255,0.2);border-radius:2px;margin-top:2px;">' +
          '<div style="height:100%;width:' + qpct + '%;background:#F4C430;border-radius:2px;"></div></div>' +
          '<span style="font-size:9px;opacity:0.7;">보상: ' + q.rewardDesc + '</span></div>';
      });
      html += '</div>';
    }
    if (G.trendMenu && RECIPES[G.trendMenu]) html += '<div style="background:rgba(192,57,43,0.6);' + bannerStyle + '">🔥 트렌드: ' + RECIPES[G.trendMenu].emoji + ' ' + RECIPES[G.trendMenu].name + ' <span style="font-size:9px;opacity:0.8;">(명성 보너스!)</span></div>';
    if (G.rival && G.rival.active) html += '<div style="background:rgba(44,62,80,0.7);' + bannerStyle + '">🏪 <strong>경쟁 가게</strong> Lv.' + G.rival.level + ' — 손님을 뺏길 수 있어요</div>';
    return html;
  }

  // ── 만족도 별 ──
  var sat = G.satisfaction || 0;
  var full = Math.floor(sat);
  var half = sat % 1 >= 0.5;
  var satStars = '🩵'.repeat(full) + (half ? '💙' : '') + '🤍'.repeat(Math.max(0, 5-full-(half?1:0)));

  // ── 모두서빙 버튼 상태 ──
  var serveAllDisabled = !hasCust;

  // ── 패널 업데이트 ──
  [
    { panelId:'mob-cust-panel',        stageId:'mob-cafe-stage-label-farm',   progTxtId:'mob-progress-text',        progFillId:'mob-progress-fill',        countId:'mob-cust-count',        listId:'mob-cust-list',        bannerAreaId:'mob-story-banner-farm',   satStarsId:'mob-sat-stars-farm',   satValId:'mob-sat-val-farm' },
    { panelId:'mob-cust-panel-manage', stageId:'mob-cafe-stage-label-manage', progTxtId:'mob-progress-text-manage', progFillId:'mob-progress-fill-manage', countId:'mob-cust-count-manage', listId:'mob-cust-list-manage', bannerAreaId:'mob-story-banner-manage', satStarsId:'mob-sat-stars-manage', satValId:'mob-sat-val-manage' },
  ].forEach(function(ids) {
    var panel = document.getElementById(ids.panelId);
    if (!panel) return;
    panel.style.display = 'block';

    var el;
    el = document.getElementById(ids.stageId);    if (el) el.textContent = stageLabel;
    el = document.getElementById(ids.progTxtId);  if (el) el.textContent = progressText;
    el = document.getElementById(ids.progFillId); if (el) el.style.width = pct + '%';
    el = document.getElementById(ids.countId);    if (el) el.textContent = countText;
    el = document.getElementById(ids.listId);     if (el) el.innerHTML = custHTML;
    el = document.getElementById(ids.satStarsId); if (el) el.textContent = satStars;
    el = document.getElementById(ids.satValId);   if (el) el.textContent = sat.toFixed(1);
    el = document.getElementById(ids.bannerAreaId); // syncAllBanners()가 채워줌

    // 모두서빙 버튼
    var btns = panel.querySelectorAll('.serve-all-btn');
    btns.forEach(function(btn) {
      btn.disabled = serveAllDisabled;
      btn.style.opacity = serveAllDisabled ? '0.4' : '1';
    });
  });

  if (G.cafeOpen) renderMobIllustration();
  syncAllBanners();
}, 1000);
