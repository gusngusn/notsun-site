// 낯선 픽셀 방명록 v3 — 공용 코드 (세이클럽풍 캐릭터 + 매장 장면 + 저장소)
(function (global) {
  const W = 480, H = 270;
  const OWNER_EMAIL = 'owner@notsun.bar';
  const DRINKS = [
    { k: 'whisky', name: '위스키' }, { k: 'cocktail', name: '칵테일' },
    { k: 'beer', name: '맥주' }, { k: 'champagne', name: '샴페인' }
  ];
  const SEXES = [{ k: 'f', name: '여성' }, { k: 'm', name: '남성' }];
  const HAIR_STYLES = ['짧은 머리', '단발', '긴 머리', '묶은 머리'];
  const BOTTOMS = ['바지', '치마'];
  const ACCS = ['없음', '안경', '모자', '리본'];
  const HAIR_COLORS = ['#1c1416', '#4a2e1f', '#7a4a2a', '#c99a5b', '#9c3f2a', '#e8e2da', '#5a4a8a'];
  const SKIN_COLORS = ['#f6d5bb', '#f0c4a0', '#e0a97f', '#c98e66', '#9a6646'];
  const SHIRT_COLORS = ['#f2ede6', '#1e1e24', '#7a1f22', '#2f3a52', '#2c4a3a', '#d99a3a', '#ef9fbf', '#6b8fd6'];
  const PANTS = '#2a2f45';
  // 사장님 기본값 — 사장 전용 페이지(owner.html)에서 바꾸면 그 값이 우선해요
  const DEFAULT_OWNERS = [
    { nick: '낯 사장', hair: '#1c1416', skin: '#f0c4a0', shirt: '#151517', pants: '#151517', style: 'm001',
      lines: ['어서오세요, 낯선 손님!', '오늘의 한 잔 추천해드릴까요?', '옆자리랑 인사해보세요'] },
    { nick: '선 사장', hair: '#4a2e1f', skin: '#f6d5bb', shirt: '#151517', pants: '#151517', style: 'f300',
      lines: ['혼자 오셨어요? 잘 오셨어요', 'QR 찍고 바에 앉아보세요', '오늘 밤도 천천히 마셔요'] }
  ];
  // 시즌 테마: 자동이면 날짜로 정해져요 (사장 리모컨에서 직접 고를 수도 있어요)
  const THEMES = [
    { k: 'auto', name: '자동(날짜)' }, { k: 'default', name: '기본' }, { k: 'spring', name: '봄' },
    { k: 'summer', name: '여름 바캉스' }, { k: 'halloween', name: '할로윈' }, { k: 'christmas', name: '크리스마스' },
    { k: 'valentine', name: '발렌타인데이' }, { k: 'white', name: '화이트데이' }, { k: 'rose', name: '로즈데이' }, { k: 'pepero', name: '빼빼로데이' }
  ];
  function resolveTheme(setting) {
    if (setting && setting !== 'auto' && THEMES.some(t => t.k === setting)) return setting;
    const d = new Date(Date.now() + 9 * 3600e3), m = d.getUTCMonth() + 1, day = d.getUTCDate();
    if (m === 2 && day >= 10 && day <= 14) return 'valentine';
    if (m === 3 && day >= 10 && day <= 14) return 'white';
    if (m === 5 && day >= 10 && day <= 14) return 'rose';
    if (m === 11 && day >= 7 && day <= 11) return 'pepero';
    if (m === 10) return 'halloween';
    if (m === 12) return 'christmas';
    if (m === 7 || m === 8) return 'summer';
    if ((m === 3 && day >= 20) || (m === 4 && day <= 20)) return 'spring';
    return 'default';
  }
  // 할로윈은 저작권 캐릭터 대신 오리지널 코스튬 (낯선맨 히어로, 유령, 미라, 해적, 호박머리, 마녀, 뱀파이어, 고양이)
  const COSTUMES = {
    halloween: ['vampire', 'witch', 'mummy', 'ghost', 'pumpkinhead', 'frank', 'skeleton', 'zombie', 'werewolf', 'devil', 'reaper', 'jiangshi', 'cat', 'pirate'],
    christmas: ['santasuit', 'antler', 'elf', 'snowman', 'ginger', 'sweater', 'xtree', 'earmuff', 'santasuit'],
    summer: ['swim+shades', 'swim+straw', 'swim+lei', 'swim'],
    spring: ['flower', 'flower', 'lei'],
    valentine: ['heartband', 'wings', 'rosehair', 'heartband'],
    white: ['candy', 'candy', 'wings', 'heartband'],
    rose: ['rosehair', 'rosehair', 'heartband'],
    pepero: ['pepero', 'pepero', 'heartband']
  };
  const OWNER_COSTUMES = { halloween: ['vampire', 'witch'], christmas: ['santasuit', 'elf'], summer: ['shades+lei', 'lei+straw'], spring: ['flower', 'flower'],
    valentine: ['heartband', 'rosehair'], white: ['candy', 'heartband'], rose: ['rosehair', 'rosehair'], pepero: ['pepero', 'heartband'] };
  const costumeFor = (theme, seedStr) => { const l = COSTUMES[theme]; if (!l) return ''; const h = [...String(seedStr || '')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 17); return l[h % l.length]; };
  const BLOCK = ['시발', '씨발', 'ㅅㅂ', '병신', 'ㅂㅅ', '좆', '개새', '섹스', '꺼져', '죽어'];
  const clean = s => !BLOCK.some(w => String(s || '').replace(/\s/g, '').includes(w));
  const bizDate = () => new Date(Date.now() + 9 * 3600e3 - 6 * 3600e3).toISOString().slice(0, 10);
  const isHex = c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
  const STYLE_RE = /^[mf][0-3][01][0-3]$/;
  const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const shade = (c, k) => { const n = parseInt(c.slice(1), 16); return hex((n >> 16) * k, ((n >> 8) & 255) * k, (n & 255) * k); };

  function colorsFromImage(img) {
    const c = document.createElement('canvas'); c.width = 40; c.height = 40;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, 40, 40);
    const d = x.getImageData(0, 0, 40, 40).data;
    const avg = (x0, y0, x1, y1) => { let r = 0, g = 0, b = 0, n = 0;
      for (let y = y0; y < y1; y++) for (let xx = x0; xx < x1; xx++) { const i = (y * 40 + xx) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
      return [r / n, g / n, b / n]; };
    const boost = ([r, g, b], k) => { const m = (r + g + b) / 3; return hex(m + (r - m) * k, m + (g - m) * k, m + (b - m) * k); };
    return { hair: boost(avg(15, 3, 25, 8), 1.2), skin: boost(avg(17, 16, 23, 22), 1.1), shirt: boost(avg(12, 34, 28, 40), 1.25) };
  }

  // ---------- 세이클럽풍 캐릭터 ----------
  // 스프라이트: 28 x 46, 캐릭터 몸 중심 x = 11, 맨 아래 줄 = 발
  const CX = 11;
  const cache = new Map();
  function sprite(look, sit, drink, frame, costume) {
    frame = frame || 'n'; costume = costume || '';
    const style = STYLE_RE.test(look.style) ? look.style : 'm000';
    let hair = isHex(look.hair) ? look.hair : '#1c1416', skin = isHex(look.skin) ? look.skin : '#f0c4a0';
    let shirt = isHex(look.shirt) ? look.shirt : '#2f3a52', pants = isHex(look.pants) ? look.pants : PANTS;
    { const cp = String(costume || '').split('+'), on = k => cp.includes(k);   // 코스튬이 피부·옷 색을 바꾸는 경우
      if (on('frank')) { skin = '#9cc97a'; shirt = '#3a3a42'; pants = '#26262c'; hair = '#151515'; }
      if (on('zombie')) { skin = '#a9b98e'; shirt = '#6a7a8a'; pants = '#3a3a4a'; }
      if (on('vampire')) { skin = '#f3e9ec'; shirt = '#f2f2f2'; pants = '#151018'; hair = '#151018'; }
      if (on('skeleton') || on('reaper')) { shirt = '#18141c'; pants = '#18141c'; }
      if (on('jiangshi')) { skin = '#e9e5d8'; shirt = '#2a3a6a'; pants = '#1e2a50'; }
      if (on('devil')) { shirt = '#b8202a'; }
      if (on('werewolf')) { hair = '#5e5048'; shirt = '#6a4a3a'; }
      if (on('santasuit')) { shirt = '#d6262e'; pants = '#d6262e'; }
      if (on('elf')) { shirt = '#2a8a4a'; pants = '#d6262e'; }
      if (on('snowman')) { shirt = '#f6f8fc'; pants = '#e8ecf4'; }
      if (on('ginger')) { skin = '#c8844a'; shirt = '#b8743c'; pants = '#a8662e'; }
      if (on('sweater')) { shirt = '#c8262e'; }
      if (on('xtree')) { shirt = '#2a8a4a'; } }
    const dk = DRINKS.some(d => d.k === drink) ? drink : '';
    const key = [hair, skin, shirt, pants, style, sit ? 1 : 0, dk, frame, costume].join('|');
    if (cache.has(key)) return cache.get(key);
    const fem = style[0] === 'f', hs = +style[1], bt = +style[2], ac = +style[3];
    const cw = 30, ch = sit ? 48 : 52, c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const x = c.getContext('2d');
    const P = (px, py, w, h, col) => { x.fillStyle = col; x.fillRect(px + 2, py + 8, w, h); };
    const inHead = (px, py) => ((px - 9.5) / 8.6) ** 2 + ((py - 9) / 7.9) ** 2 <= 1;
    const sd = shade(shirt, .78), pd = shade(pants, .8);
    if (hs === 2) P(2, 6, 16, fem ? 20 : 16, hair);                       // 뒷머리
    const parts = costume.split('+'), has = k => parts.includes(k), swim = has('swim');
    const csAll = parts.filter(k => k !== 'swim');
    if (has('cape') || has('vampire')) { P(0, 16, 20, 16, '#1a1016'); P(1, 13, 3, 5, '#a0202a'); P(16, 13, 3, 5, '#a0202a'); }
    if (has('reaper')) { P(0, 14, 20, 20, '#18141c'); }
    if (has('hero')) { P(0, 17, 20, 18, '#d6262e'); P(1, 17, 18, 1, '#a01a20'); }
    if (has('wings')) { P(-3, 18, 4, 7, '#ffffff'); P(-4, 19, 2, 4, '#f0f4ff'); P(19, 18, 4, 7, '#ffffff'); P(21, 19, 2, 4, '#f0f4ff'); }
    P(8, 16, 4, 2, skin);                                                  // 목
    // 상체 (수영복이면 피부 + 비키니/수영바지)
    const top = swim ? skin : shirt, topD = swim ? shade(skin, .9) : sd, sw = shirt, swd = shade(shirt, .75);
    if (fem) { P(5, 18, 10, 6, top); P(6, 24, 8, 4, top); P(12, 18, 3, 6, topD); P(12, 24, 2, 4, topD); }
    else { P(4, 18, 12, 10, top); P(13, 18, 3, 10, topD); }
    if (swim && fem) { P(6, 20, 3, 3, sw); P(11, 20, 3, 3, sw); P(9, 21, 2, 1, swd); P(6, 19, 1, 1, swd); P(13, 19, 1, 1, swd); }
    if (swim && !fem) { P(7, 21, 1, 1, shade(skin, .82)); P(12, 21, 1, 1, shade(skin, .82)); P(9, 25, 2, 1, shade(skin, .85)); }
    if (!swim) { P(8, 18, 4, 1, skin); P(9, 19, 2, 1, skin); }             // 깃
    const ax = fem ? 3 : 2;
    const raise = frame === 's' || frame === 'k';
    const arm = swim ? skin : shirt, armD = swim ? shade(skin, .9) : sd;
    P(ax, 19, 2, 8, arm); P(ax, 27, 2, 2, skin);                            // 왼팔
    if (!raise) { P(19 - ax - 1, 19, 2, 8, armD); P(19 - ax - 1, 27, 2, 2, skin); }   // 오른팔
    else { P(19 - ax - 1, 19, 2, 3, armD); P(19 - ax, 17, 2, 3, armD); P(19 - ax, 15, 2, 2, skin); }
    // 하체
    if (swim) {
      const legTop = sit ? 28 : 28;
      if (fem) { P(6, 28, 8, 2, sw); P(7, 30, 6, 1, sw); }
      else { P(5, 28, 10, 5, sw); P(5, 30, 10, 1, '#ffffff'); P(10, 31, 1, 2, swd); }
      if (!sit) { const ly = fem ? 30 : 33; P(6, ly, 3, 40 - ly, skin); P(11, ly, 3, 40 - ly, shade(skin, .92)); P(5, 40, 4, 1, '#ffffff'); P(11, 40, 4, 1, '#ffffff'); P(5, 41, 4, 1, sw); P(11, 41, 4, 1, sw); }
      else { P(5, fem ? 30 : 33, 10, 1, skin); P(6, 31, 3, 6, skin); P(11, 31, 3, 6, shade(skin, .92)); P(5, 37, 4, 1, sw); P(11, 37, 4, 1, sw); if (!fem) { P(5, 28, 10, 4, sw); P(5, 30, 10, 1, '#ffffff'); } }
    } else if (!sit) {
      if (bt === 0) { P(6, 28, 4, 12, pants); P(10, 28, 4, 12, pd); P(10, 28, 1, 12, shade(pants, .65)); }
      else { P(5, 28, 10, 3, pants); P(4, 31, 12, 3, pants); P(4, 33, 12, 1, pd); P(7, 34, 2, 6, skin); P(11, 34, 2, 6, skin); }
      P(5, 39, 5, 2, '#f4f0ea'); P(10, 39, 5, 2, '#f4f0ea'); P(5, 41, 5, 1, '#b9ada4'); P(10, 41, 5, 1, '#b9ada4'); P(7, 39, 1, 1, shade(shirt, .9)); P(12, 39, 1, 1, shade(shirt, .9));
    } else {
      if (bt === 0) { P(5, 28, 10, 4, pants); P(6, 32, 3, 5, pants); P(11, 32, 3, 5, pd); }
      else { P(4, 28, 12, 4, pants); P(6, 32, 3, 5, skin); P(11, 32, 3, 5, skin); }
      P(5, 37, 4, 2, '#f4f0ea'); P(11, 37, 4, 2, '#f4f0ea'); P(5, 38, 4, 1, '#b9ada4'); P(11, 38, 4, 1, '#b9ada4');
    }
    // 얼굴: 동글동글 + 볼 음영
    const clr = (px, py) => x.clearRect(px + 2, py + 8, 1, 1);
    for (let py = 1; py <= 17; py++) for (let px = 0; px < 20; px++) if (inHead(px, py)) P(px, py, 1, 1, (py >= 16 || !inHead(px + 2, py)) ? shade(skin, .93) : skin);
    // 머리 볼륨 (정수리 둥글게)
    for (let py = -1; py <= 8; py++) for (let px = -1; px < 21; px++) if (((px - 9.5) / 9.6) ** 2 + ((py - 8.4) / 9.2) ** 2 <= 1 && !inHead(px, py)) P(px, py, 1, 1, shade(hair, .9));
    // 머리: 뾰족 앞머리 + 옆머리 + 윤기
    for (let py = 1; py <= 17; py++) for (let px = 0; px < 20; px++) {
      if (!inHead(px, py)) continue;
      let on = py < 6 || (py === 6 && px % 4 !== 3) || (py === 7 && px % 4 === 1);
      on = on || ((px <= 2 || px >= 17) && py < 12);
      if (hs === 1 || hs === 2) on = on || ((px <= 3 || px >= 16) && py < 16);
      if (on) P(px, py, 1, 1, (py === 6 || py === 7) ? shade(hair, .85) : hair);
    }
    if (hs === 1) { P(0, 9, 2, 7, hair); P(18, 9, 2, 7, hair); P(1, 15, 2, 1, shade(hair, .85)); P(17, 15, 2, 1, shade(hair, .85)); }
    if (hs === 3) { if (fem) { P(16, 3, 4, 4, hair); P(18, 7, 3, 7, hair); P(17, 4, 2, 1, shade(hair, 1.35)); } else { P(8, -1, 4, 3, hair); P(7, 0, 6, 1, hair); } }
    const hl = shade(hair, 1.45);
    P(5, 2, 4, 1, hl); P(4, 3, 1, 1, hl); P(12, 2, 2, 1, hl);                // 머리 윤기 (천사 링)
    // 눈: 크고 반짝이게 (3x4 + 하이라이트 2개)
    const eyeD = '#2a1618', iris = '#6a3e2e';
    if (frame === 'b') { [[4, 11], [5, 12], [6, 11], [13, 11], [14, 12], [15, 11]].forEach(([ex, ey]) => P(ex, ey, 1, 1, eyeD)); }
    else {
      P(4, 9, 3, 4, eyeD); P(13, 9, 3, 4, eyeD);
      P(5, 11, 1, 2, iris); P(14, 11, 1, 2, iris);
      P(4, 10, 1, 1, '#ffffff'); P(13, 10, 1, 1, '#ffffff'); P(6, 12, 1, 1, '#ffe8ec'); P(15, 12, 1, 1, '#ffe8ec');
      clr(4, 9); clr(15, 9); P(4, 9, 1, 1, skin); P(15, 9, 1, 1, skin);
    }
    if (fem) { P(3, 9, 1, 1, eyeD); P(16, 9, 1, 1, eyeD); P(4, 8, 2, 1, eyeD); P(14, 8, 2, 1, eyeD); }
    else { P(4, 7, 3, 1, shade(hair, .75)); P(13, 7, 3, 1, shade(hair, .75)); }
    // 볼터치 + 웃는 입
    const blush = fem ? '#ff9aac' : '#f5aaa6';
    P(2, 13, 3, 1, blush); P(15, 13, 3, 1, blush); P(3, 14, 1, 1, shade(blush, 1.05)); P(16, 14, 1, 1, shade(blush, 1.05));
    const mouthC = fem ? '#d4505c' : '#a8463c';
    P(8, 14, 1, 1, mouthC); P(9, 15, 2, 1, mouthC); P(11, 14, 1, 1, mouthC);
    // 둥근 어깨 + 단추
    if (!swim) { if (fem) { clr(5, 18); clr(14, 18); } else { clr(4, 18); clr(15, 18); } P(10, 21, 1, 1, shade(shirt, .6)); P(10, 24, 1, 1, shade(shirt, .6)); }
    // 소품
    if (ac === 1) { x.strokeStyle = '#2a1e1e'; x.lineWidth = 1; x.strokeRect(3.5 + 2, 8.5 + 8, 5, 5); x.strokeRect(12.5 + 2, 8.5 + 8, 5, 5); P(8, 10, 4, 1, '#2a1e1e'); }
    if (ac === 2) { const capc = shade(shirt, .7); for (let py = 1; py <= 5; py++) for (let px = 0; px < 20; px++) if (inHead(px, py)) P(px, py, 1, 1, capc); P(1, 5, 12, 2, capc); P(8, 2, 3, 2, shade(capc, 1.4)); }
    if (ac === 3) { P(13, 0, 2, 3, '#e23b4a'); P(17, 0, 2, 3, '#e23b4a'); P(15, 1, 2, 1, '#b5202f'); }
    // 시즌 코스튬
    for (const cs of csAll) {
    if (cs === 'witch') { P(-1, 2, 22, 2, '#1e1a24'); for (let k = 0; k < 7; k++) P(4 + k, 1 - k, 12 - k * 2 > 1 ? 12 - k * 2 : 2, 1, '#1e1a24'); P(4, 1, 12, 1, '#7a4ac0'); P(12, -6, 3, 1, '#1e1a24'); }
    if (cs === 'horns') { P(3, -1, 2, 3, '#d42a2a'); P(2, -2, 1, 2, '#d42a2a'); P(15, -1, 2, 3, '#d42a2a'); P(17, -2, 1, 2, '#d42a2a'); }
    if (cs === 'cat') { P(2, -2, 4, 4, '#1e1a1e'); P(3, -1, 2, 2, '#f39ab0'); P(14, -2, 4, 4, '#1e1a1e'); P(15, -1, 2, 2, '#f39ab0'); }
    if (cs === 'santa') { for (let py = -1; py <= 3; py++) for (let px = 0; px < 20; px++) if (py < 1 || inHead(px, py)) if (py >= -1 && px >= 3 + Math.max(0, -py) * 2 && px <= 16) P(px, py, 1, 1, '#d6262e'); P(14, -3, 4, 2, '#d6262e'); P(17, -2, 3, 3, '#ffffff'); P(1, 3, 18, 2, '#ffffff'); }
    if (cs === 'antler') { P(4, -4, 1, 6, '#8a5a2b'); P(2, -3, 2, 1, '#8a5a2b'); P(15, -4, 1, 6, '#8a5a2b'); P(16, -3, 2, 1, '#8a5a2b'); P(9, 12, 2, 2, '#e02a2a'); }
    if (cs === 'scarf') { P(4, 16, 12, 3, '#d6262e'); P(12, 19, 3, 5, '#d6262e'); P(4, 17, 12, 1, '#f2f2f2'); }
    if (cs === 'shades') { P(3, 10, 6, 3, '#151518'); P(11, 10, 6, 3, '#151518'); P(9, 10, 2, 1, '#151518'); P(4, 10, 2, 1, '#6a8ab0'); P(12, 10, 2, 1, '#6a8ab0'); }
    if (cs === 'straw') { P(-1, 3, 22, 2, '#e8c879'); P(4, -1, 12, 4, '#e8c879'); P(4, 2, 12, 1, '#d6262e'); P(5, -1, 10, 1, '#f4dc98'); }
    if (cs === 'lei') { for (let k = 0; k < 6; k++) P(4 + k * 2, 17 + (k === 0 || k === 5 ? 0 : 1), 2, 2, k % 2 ? '#ffd23a' : '#ff6aa8'); }
    if (cs === 'flower') { [[3, 2, '#ff9ac0'], [6, 0, '#ffffff'], [9, -1, '#ffd0e0'], [12, 0, '#ffffff'], [15, 2, '#ff9ac0']].forEach(([fx, fy, fc]) => { P(fx, fy, 2, 2, fc); P(fx + 1, fy + 1, 1, 1, '#f5c84a'); }); }
    // 오리지널 할로윈 코스튬
    if (cs === 'hero') { P(3, 9, 14, 4, '#1a1a2a'); P(5, 10, 2, 2, '#ffffff'); P(13, 10, 2, 2, '#ffffff'); P(5, 11, 1, 1, '#1a1010'); P(13, 11, 1, 1, '#1a1010'); P(8, 21, 4, 3, '#ffd23a'); P(9, 20, 2, 1, '#ffd23a'); P(9, 24, 2, 1, '#ffd23a'); P(9, 22, 2, 1, '#d6262e'); }
    if (cs === 'pirate') { for (let py = 1; py <= 5; py++) for (let px = 0; px < 20; px++) if (inHead(px, py)) P(px, py, 1, 1, '#c8262e'); P(1, 5, 18, 1, '#c8262e'); P(3, 2, 1, 1, '#ffffff'); P(8, 3, 1, 1, '#ffffff'); P(13, 2, 1, 1, '#ffffff'); P(17, 4, 3, 2, '#c8262e'); P(19, 6, 2, 3, '#c8262e'); P(12, 9, 4, 4, '#151515'); P(3, 8, 9, 1, '#151515'); }
    if (cs === 'mummy') { for (let py = 1; py <= 17; py += 2) for (let px = 0; px < 20; px++) if (inHead(px, py)) P(px, py, 1, 1, '#e8e2d0'); for (let py = 18; py <= 39; py += 3) P(4, py, 12, 1, '#e8e2d0'); P(5, 10, 2, 3, '#1a1010'); P(13, 10, 2, 3, '#1a1010'); P(5, 10, 1, 1, '#ffffff'); P(13, 10, 1, 1, '#ffffff'); }
    if (cs === 'pumpkinhead') { for (let py = 0; py <= 17; py++) for (let px = 0; px < 20; px++) if (((px - 9.5) / 9) ** 2 + ((py - 9) / 8.2) ** 2 <= 1) P(px, py, 1, 1, (px % 5 === 2) ? '#d8701a' : '#f08a1a'); P(9, -2, 2, 3, '#3a6a2a'); P(5, 9, 3, 2, '#2a1408'); P(12, 9, 3, 2, '#2a1408'); P(6, 8, 1, 1, '#2a1408'); P(13, 8, 1, 1, '#2a1408'); P(6, 13, 8, 2, '#2a1408'); P(8, 13, 1, 1, '#f08a1a'); P(11, 14, 1, 1, '#f08a1a'); }
    // 할로윈 단골 캐릭터 (특정 작품 캐릭터가 아닌 누구나 아는 유형)
    if (cs === 'vampire') { P(8, 5, 4, 2, hair); P(9, 7, 2, 1, hair); P(8, 15, 1, 1, '#ffffff'); P(11, 15, 1, 1, '#ffffff'); if (frame !== 'b') { P(5, 11, 1, 2, '#c0202a'); P(14, 11, 1, 2, '#c0202a'); } P(9, 19, 2, 2, '#a0202a'); }
    if (cs === 'frank') { P(1, -1, 18, 5, '#151515'); P(2, 4, 16, 1, '#151515'); P(5, 5, 9, 1, '#3a3a3a'); [6, 8, 10, 12].forEach(k => P(k, 4, 1, 3, '#3a3a3a')); P(-1, 15, 2, 2, '#9aa0a6'); P(19, 15, 2, 2, '#9aa0a6'); P(4, 13, 3, 1, '#6a8a5a'); P(13, 13, 3, 1, '#6a8a5a'); }
    if (cs === 'skeleton') { for (let py = 9; py <= 16; py++) for (let px = 2; px < 18; px++) if (inHead(px, py)) P(px, py, 1, 1, '#f4f4f0'); P(4, 9, 4, 4, '#151515'); P(12, 9, 4, 4, '#151515'); P(5, 10, 1, 1, '#ffffff'); P(13, 10, 1, 1, '#ffffff'); P(9, 13, 2, 1, '#151515'); P(6, 15, 8, 1, '#151515'); [7, 9, 11, 13].forEach(k => P(k, 14, 1, 2, '#151515'));
      [20, 22, 24, 26].forEach(y => P(6, y, 8, 1, '#ece8e0')); P(9, 19, 2, 9, '#ece8e0'); P(fem ? 3 : 2, 21, 1, 7, '#ece8e0'); if (!sit) { P(7, 30, 1, 9, '#ece8e0'); P(12, 30, 1, 9, '#ece8e0'); } }
    if (cs === 'zombie') { P(4, 13, 3, 1, '#7a8a6a'); P(13, 13, 3, 1, '#7a8a6a'); P(13, 4, 4, 1, '#5a2a2a'); P(14, 3, 1, 3, '#5a2a2a'); P(6, 22, 1, 3, '#8a1a1a'); P(13, 25, 2, 1, '#8a1a1a'); [5, 8, 12].forEach(k => P(k, 27, 2, 1, '#1a1414')); }
    if (cs === 'werewolf') { P(1, -3, 4, 5, '#5e5048'); P(2, -2, 2, 3, '#f39ab0'); P(15, -3, 4, 5, '#5e5048'); P(16, -2, 2, 3, '#f39ab0'); P(-1, 10, 2, 5, '#6e6058'); P(19, 10, 2, 5, '#6e6058'); P(0, 14, 2, 2, '#6e6058'); P(18, 14, 2, 2, '#6e6058'); P(9, 12, 2, 1, '#2a1a1a'); P(8, 15, 1, 1, '#ffffff'); P(11, 15, 1, 1, '#ffffff'); P(5, 20, 10, 1, '#4a3a30'); }
    if (cs === 'devil') { P(3, -1, 2, 3, '#d42a2a'); P(2, -2, 1, 2, '#d42a2a'); P(15, -1, 2, 3, '#d42a2a'); P(17, -2, 1, 2, '#d42a2a'); P(16, 27, 4, 1, '#d42a2a'); P(19, 23, 1, 4, '#d42a2a'); P(18, 21, 3, 2, '#d42a2a'); P(19, 20, 1, 1, '#d42a2a'); }
    if (cs === 'reaper') { for (let py = -1; py <= 17; py++) for (let px = -1; px < 21; px++) { const inH = ((px - 9.5) / 10.4) ** 2 + ((py - 8.6) / 10) ** 2 <= 1; if (inH && (py < 6 || px <= 2 || px >= 17)) P(px, py, 1, 1, '#18141c'); } P(3, 6, 14, 1, '#2a2430'); P(21, -4, 1, 42, '#6a4a2a'); P(13, -5, 9, 2, '#d8dde2'); P(12, -4, 2, 2, '#d8dde2'); P(14, -5, 6, 1, '#ffffff'); }
    if (cs === 'jiangshi') { P(2, -1, 16, 6, '#1a1a28'); P(0, 4, 20, 2, '#1a1a28'); P(9, -3, 2, 2, '#c0202a'); P(3, 0, 14, 1, '#2a2a40'); P(8, 4, 4, 10, '#f2d84a'); P(9, 6, 2, 1, '#c0202a'); P(8, 8, 4, 1, '#c0202a'); P(9, 10, 2, 1, '#c0202a'); P(9, 12, 1, 1, '#c0202a'); P(4, 18, 12, 1, '#d8b040'); P(9, 18, 2, 10, '#d8b040'); }
    // 크리스마스
    if (cs === 'santasuit') { for (let py = -1; py <= 3; py++) for (let px = 0; px < 20; px++) if (py < 1 || inHead(px, py)) if (px >= 3 + Math.max(0, -py) * 2 && px <= 16) P(px, py, 1, 1, '#d6262e'); P(14, -3, 4, 2, '#d6262e'); P(17, -2, 3, 3, '#ffffff'); P(1, 3, 18, 2, '#ffffff');
      P(3, 13, 14, 3, '#ffffff'); P(5, 16, 10, 2, '#ffffff'); P(7, 18, 6, 1, '#ffffff'); P(6, 13, 3, 1, '#f2f2f2'); P(11, 13, 3, 1, '#f2f2f2'); P(8, 14, 4, 1, '#e8e8e8');
      P(4, 25, 12, 2, '#151515'); P(9, 25, 2, 2, '#ffd23a'); P(4, 27, 12, 1, '#ffffff'); P(9, 19, 2, 6, '#ffffff'); }
    if (cs === 'elf') { for (let k = 0; k < 8; k++) P(3 + k, 4 - k, 14 - k * 2 > 1 ? 14 - k * 2 : 2, 1, '#2a8a4a'); P(15, -4, 4, 1, '#2a8a4a'); P(18, -3, 2, 2, '#ffd23a'); P(2, 4, 16, 2, '#d6262e'); P(-1, 9, 2, 2, skin); P(-2, 8, 1, 1, skin); P(19, 9, 2, 2, skin); P(21, 8, 1, 1, skin); P(4, 25, 12, 1, '#151515'); }
    if (cs === 'snowman') { P(4, -4, 12, 6, '#151515'); P(2, 2, 16, 1, '#151515'); P(4, 1, 12, 1, '#d6262e'); P(10, 11, 3, 1, '#f08a1a'); P(13, 11, 1, 1, '#d8701a'); P(4, 16, 12, 3, '#d6262e'); P(12, 19, 3, 5, '#d6262e'); [21, 24, 27].forEach(y => P(9, y, 2, 2, '#151515')); }
    if (cs === 'ginger') { P(3, 8, 14, 1, '#ffffff'); P(7, 15, 6, 1, '#ffffff'); P(6, 14, 1, 1, '#ffffff'); P(13, 14, 1, 1, '#ffffff'); P(9, 20, 2, 2, '#e23b4a'); P(9, 23, 2, 2, '#4fd36a'); P(9, 26, 2, 2, '#3a7aff'); for (let k = 0; k < 6; k++) P(4 + k * 2, 28 + (k % 2), 1, 1, '#ffffff'); }
    if (cs === 'sweater') { for (let y = 20; y <= 26; y += 3) for (let x2 = 4; x2 < 16; x2 += 2) P(x2, y + ((x2 / 2) % 2), 1, 1, y === 23 ? '#ffffff' : '#2a8a4a'); P(9, 21, 2, 1, '#2a8a4a'); P(8, 22, 4, 1, '#2a8a4a'); P(9, 20, 2, 1, '#ffd23a'); P(4, 27, 12, 1, '#2a8a4a'); }
    if (cs === 'xtree') { P(8, -5, 4, 4, '#ffd23a'); P(9, -6, 2, 1, '#fff2a0'); for (let k = 0; k < 13; k++) { const w2 = 6 + k; P(10 - Math.ceil(w2 / 2), 17 + k, w2, 1, k % 3 ? '#2a8a4a' : '#1f6a3a'); } [[6, 21, '#e23b4a'], [12, 23, '#ffd23a'], [8, 26, '#3a7aff'], [14, 28, '#e23b4a'], [5, 28, '#ffd23a']].forEach(([a2, b2, c2]) => P(a2, b2, 2, 2, c2)); }
    if (cs === 'earmuff') { P(1, 2, 18, 1, '#e23b4a'); P(-2, 8, 4, 5, '#ffffff'); P(18, 8, 4, 5, '#ffffff'); P(-1, 9, 2, 3, '#f0f0f8'); P(19, 9, 2, 3, '#f0f0f8'); P(4, 16, 12, 2, '#3a7aff'); }
    // 생일 고깔모자
    if (cs === 'party') { for (let k = 0; k < 9; k++) P(9 - Math.floor(k / 1.6), -6 + k, 2 + Math.floor(k / 1.6) * 2, 1, k % 3 === 0 ? '#ffd23a' : (k % 3 === 1 ? '#ff6aa8' : '#4ad0e0')); P(9, -8, 2, 2, '#ffffff'); P(10, -8, 1, 1, '#ffd23a'); }
    // 기념일 코스튬
    if (cs === 'heartband') { P(2, 4, 16, 1, '#e23b6a'); P(7, -1, 2, 2, '#ff4a7a'); P(10, -1, 2, 2, '#ff4a7a'); P(7, 1, 5, 1, '#ff4a7a'); P(8, 2, 3, 1, '#ff4a7a'); P(9, 3, 1, 1, '#ff4a7a'); }
    if (cs === 'rosehair') { P(15, 2, 4, 4, '#d6202e'); P(16, 3, 2, 2, '#a01020'); P(16, 2, 1, 1, '#ff5a6a'); P(14, 5, 2, 2, '#3a8a3a'); }
    if (cs === 'pepero') { P(11, 14, 1, 1, '#5a3020'); P(12, 13, 1, 1, '#5a3020'); P(13, 12, 1, 1, '#5a3020'); P(14, 11, 1, 1, '#e8c070'); P(15, 10, 1, 1, '#e8c070'); P(16, 9, 1, 1, '#e8c070'); }
    if (cs === 'candy') { P(1, 21, 1, 6, '#f2f2f2'); P(-1, 17, 5, 4, '#ff8ac0'); P(0, 18, 3, 2, '#ffffff'); P(1, 18, 1, 1, '#ff8ac0'); }
    }
    if (has('ghost')) {
      x.clearRect(0, 0, cw, ch);
      const gb = sit ? 36 : 40;
      for (let py = 1; py <= gb; py++) for (let px = 0; px < 20; px++) {
        const inTop = ((px - 9.5) / 8.6) ** 2 + ((py - 10) / 9) ** 2 <= 1, inBody = py >= 10 && px >= 1 + Math.max(0, (14 - py) / 3) && px <= 18 - Math.max(0, (14 - py) / 3);
        const wave = py > gb - 2 && ((px + (py === gb ? 0 : 2)) % 4 < 2);
        if ((inTop || inBody) && !wave) P(px, py, 1, 1, px > 14 ? '#e6e8f0' : '#fbfbff');
      }
      P(5, 10, 3, 4, '#1a1010'); P(12, 10, 3, 4, '#1a1010'); P(5, 10, 1, 1, '#ffffff'); P(12, 10, 1, 1, '#ffffff'); P(9, 15, 2, 2, '#3a2a2a'); P(3, 14, 2, 1, '#ffb0c0'); P(15, 14, 2, 1, '#ffb0c0');
      P(19, 20, 2, 3, '#fbfbff');
    }
    // 손에 든 술 (오른손 옆)
    if (frame === 'k') { P(19, 6, 4, 9, '#cfd5da'); P(19, 6, 4, 1, '#f4f6f8'); P(20, 4, 2, 2, '#cfd5da'); P(22, 7, 1, 7, '#9aa3aa'); }
    if (dk) {
      const gx = raise ? 19 : 18, gy = raise ? 9 : 21;
      if (dk === 'whisky') { P(gx, gy + 2, 6, 5, '#dfe7ec'); P(gx + 1, gy + 4, 4, 2, '#d9902a'); P(gx + 1, gy + 3, 2, 1, '#ffffff'); }
      if (dk === 'cocktail') { P(gx, gy, 7, 1, '#f0f4f6'); P(gx + 1, gy + 1, 5, 1, '#e0344a'); P(gx + 2, gy + 2, 3, 1, '#e0344a'); P(gx + 3, gy + 3, 1, 3, '#dfe7ec'); P(gx + 1, gy + 6, 5, 1, '#dfe7ec'); P(gx + 5, gy - 1, 2, 1, '#7bd36a'); }
      if (dk === 'beer') { P(gx, gy, 5, 2, '#fffaf0'); P(gx, gy + 2, 5, 5, '#f0b030'); P(gx + 5, gy + 3, 2, 3, '#e8e2d0'); P(gx + 1, gy + 3, 1, 3, '#ffd870'); }
      if (dk === 'champagne') { P(gx + 1, gy - 1, 3, 5, '#f3dc8a'); P(gx + 2, gy, 1, 1, '#fff8dc'); P(gx + 2, gy + 2, 1, 1, '#fff8dc'); P(gx + 2, gy + 4, 1, 3, '#dfe7ec'); P(gx, gy + 7, 5, 1, '#dfe7ec'); }
    }
    // 외곽선
    const id = x.getImageData(0, 0, cw, ch), d = id.data, out = new Uint8ClampedArray(d);
    const a = (px, py) => px >= 0 && py >= 0 && px < cw && py < ch && d[(py * cw + px) * 4 + 3] > 0;
    for (let py = 0; py < ch; py++) for (let px = 0; px < cw; px++) {
      if (a(px, py)) continue;
      if (a(px - 1, py) || a(px + 1, py) || a(px, py - 1) || a(px, py + 1)) { const i = (py * cw + px) * 4; out[i] = 34; out[i + 1] = 19; out[i + 2] = 22; out[i + 3] = 255; }
    }
    id.data.set(out); x.putImageData(id, 0, 0);
    cache.set(key, c);
    return c;
  }
  function drawPreview(canvas, look, drink, costume) {
    const ctx = canvas.getContext('2d'), s = sprite(look, false, drink, 'n', costume);
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.imageSmoothingEnabled = false;
    const k = Math.floor(Math.min(canvas.width / s.width, canvas.height / s.height));
    ctx.drawImage(s, (canvas.width - s.width * k) / 2 + (s.width / 2 - CX - 2) * k, (canvas.height - s.height * k) / 2, s.width * k, s.height * k);
  }

  // 방문 횟수 등급: 2~4 은색 · 5~9 금색 왕관 · 10+ 단골
  function tierOf(v) { v = v | 0; return v >= 10 ? { k: 'regular', name: '낯선 단골', color: '#ffd36a', ring: '#ffd36a' } : v >= 5 ? { k: 'gold', name: v + '번째 방문', color: '#ffe2a0', ring: '#e8b84a' } : v >= 2 ? { k: 'silver', name: v + '번째 방문', color: '#eef0f4', ring: '#b8c0cc' } : null; }
  // ---------- 효과음 (브라우저 정책상 화면을 한 번 눌러야 켜짐) ----------
  const SFX = { ac: null, on: false };
  function enableSound() {
    try { const AC = global.AudioContext || global.webkitAudioContext; if (!AC) return false; SFX.ac = SFX.ac || new AC(); SFX.ac.resume && SFX.ac.resume(); SFX.on = true; tone(880, 0.05, 0.04); return true; } catch (e) { return false; }
  }
  function tone(freq, dur, vol, type, when) {
    if (!SFX.on || !SFX.ac) return; const ac = SFX.ac, t0 = ac.currentTime + (when || 0);
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.08, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noiseHit(dur, vol, hp, when) {
    if (!SFX.on || !SFX.ac) return; const ac = SFX.ac, t0 = ac.currentTime + (when || 0), n = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); src.buffer = buf; f.type = 'highpass'; f.frequency.value = hp || 800;
    g.gain.value = vol || 0.15; src.connect(f).connect(g).connect(ac.destination); src.start(t0);
  }
  const sfxBoom = () => { noiseHit(0.9, 0.35, 120); tone(70, 0.6, 0.12, 'sine'); tone(110, 0.4, 0.08, 'square'); };
  const sfxTick = k => { tone(520 + k * 40, 0.05, 0.05, 'square'); noiseHit(0.03, 0.06, 2500); };
  const sfxDrum = () => noiseHit(0.06, 0.09, 300);
  const sfxHeart = () => { tone(1319, 0.18, 0.05, 'sine'); tone(1760, 0.3, 0.05, 'sine', 0.1); };
  const sfxClink = () => { tone(2093, 0.25, 0.06, 'sine'); tone(2637, 0.35, 0.05, 'sine', 0.06); tone(3136, 0.4, 0.035, 'sine', 0.12); };
  const sfxDing = () => { tone(1319, 0.5, 0.09, 'sine'); tone(1047, 0.7, 0.09, 'sine', 0.32); };
  function sfxBirthday() {
    const N2 = { G4: 392, A4: 440, B4: 494, C5: 523, D5: 587, E5: 659, F5: 698, G5: 784 }, b = 0.36;
    const song = [['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2], ['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2], ['G4', .75], ['G4', .25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2], ['F5', .75], ['F5', .25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2.5]];
    let at = 0.3; song.forEach(([n, d]) => { tone(N2[n], d * b * .95, .07, 'triangle', at); tone(N2[n] * 2, d * b * .6, .025, 'sine', at); at += d * b; });
    noiseHit(.8, .12, 4000, at); tone(1047, .5, .06, 'triangle', at); tone(1319, .7, .05, 'triangle', at + .1);
  }
  function sfxFanfare() {
    noiseHit(0.9, 0.18, 4000); [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 0.09, 'square', i * 0.11));
    [784, 1047].forEach((f, i) => tone(f, 0.6, 0.07, 'triangle', 0.5 + i * 0.02)); tone(1319, 0.8, 0.05, 'triangle', 0.5);
  }
  // ---------- 인스타 스토리용 캐릭터 카드 (1080x1920) ----------
  function makeCard(look, drink, costume, nick, msg, themeKey, visits) {
    const W2 = 1080, H2 = 1920, c = document.createElement('canvas'); c.width = W2; c.height = H2;
    const g = c.getContext('2d'), floorY = 1430;
    // 벽 (붉은 커튼 줄무늬) + 바닥
    const wall = g.createLinearGradient(0, 0, 0, floorY); wall.addColorStop(0, '#3a0d10'); wall.addColorStop(0.45, '#6e1a1c'); wall.addColorStop(1, '#5a1517');
    g.fillStyle = wall; g.fillRect(0, 0, W2, floorY);
    for (let x = 0; x < W2; x += 12) { g.fillStyle = `rgba(0,0,0,${0.06 + ((x * 7919) % 13) / 130})`; g.fillRect(x, 0, 6, floorY); }
    const floor = g.createLinearGradient(0, floorY, 0, H2); floor.addColorStop(0, '#1d1517'); floor.addColorStop(1, '#0d090a');
    g.fillStyle = floor; g.fillRect(0, floorY, W2, H2 - floorY);
    g.fillStyle = '#ffb27a'; g.globalAlpha = 0.5; g.fillRect(0, floorY, W2, 4); g.globalAlpha = 1;
    // 위에서 내려오는 조명 + 간판
    const cx = W2 / 2;
    g.save(); g.globalCompositeOperation = 'lighter';
    const cone = g.createLinearGradient(0, 120, 0, floorY); cone.addColorStop(0, 'rgba(255,226,180,.28)'); cone.addColorStop(1, 'rgba(255,226,180,0)');
    g.fillStyle = cone; g.beginPath(); g.moveTo(cx - 60, 150); g.lineTo(cx + 60, 150); g.lineTo(cx + 470, floorY); g.lineTo(cx - 470, floorY); g.closePath(); g.fill();
    const pool = g.createRadialGradient(cx, floorY + 20, 0, cx, floorY + 20, 420); pool.addColorStop(0, 'rgba(255,200,140,.25)'); pool.addColorStop(1, 'rgba(255,200,140,0)');
    g.fillStyle = pool; g.fillRect(0, floorY - 300, W2, 700); g.restore();
    g.fillStyle = '#1a1214'; g.fillRect(cx - 6, 60, 12, 80);
    g.fillStyle = '#2b2224'; g.beginPath(); g.moveTo(cx - 80, 138); g.lineTo(cx + 80, 138); g.lineTo(cx + 64, 160); g.lineTo(cx - 64, 160); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,236,200,.95)'; g.fillRect(cx - 60, 156, 120, 6);
    const spaced = (text, y, font, gap, fill, shadow) => {
      g.save(); g.font = font; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
      const ws = [...text].map(ch => g.measureText(ch).width), total = ws.reduce((a, b) => a + b, 0) + gap * (text.length - 1);
      let x = cx - total / 2; if (shadow) { g.shadowColor = 'rgba(20,6,8,.8)'; g.shadowBlur = 18; g.shadowOffsetY = 12; }
      g.fillStyle = fill; [...text].forEach((ch, i) => { g.fillText(ch, x, y); x += ws[i] + gap; }); g.restore();
    };
    const signGrad = g.createLinearGradient(0, 230, 0, 310); signGrad.addColorStop(0, '#fff6e8'); signGrad.addColorStop(1, '#d9c3a8');
    spaced('- notsun -', 310, '300 104px "Helvetica Neue", "Segoe UI Light", Arial, sans-serif', 18, signGrad, true);
    const label = { halloween: ['HAPPY HALLOWEEN', '#ff8a1a'], christmas: ['MERRY CHRISTMAS', '#ff6a6a'], summer: ['SUMMER VACANCE', '#4ad0e0'], spring: ['SPRING NIGHT', '#ff9ac0'],
      valentine: ['HAPPY VALENTINE', '#ff7a95'], white: ['HAPPY WHITE DAY', '#bfe6ff'], rose: ['HAPPY ROSE DAY', '#ff6a7a'], pepero: ['HAPPY PEPERO DAY', '#e8a060'] }[themeKey];
    if (label) spaced(label[0], 392, '40px "DotGothic16", monospace', 6, label[1], false);
    // 캐릭터 (크게, 픽셀 그대로)
    const sp = sprite(look, false, drink, 'n', costume), k = 15;
    g.imageSmoothingEnabled = false;
    let bottom = sp.height; try { const d = sp.getContext('2d').getImageData(0, 0, sp.width, sp.height).data; for (let y = sp.height - 1; y >= 0; y--) { let hit = false; for (let x = 0; x < sp.width; x++) if (d[(y * sp.width + x) * 4 + 3] > 0) { hit = true; break; } if (hit) { bottom = y + 1; break; } } } catch (e) {}
    const sx = cx - (CX + 2) * k, sy = floorY + 14 - bottom * k;
    g.save(); g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(cx, floorY + 18, 170, 26, 0, 0, Math.PI * 2); g.fill(); g.restore();
    g.drawImage(sp, sx, sy, sp.width * k, sp.height * k);
    // 말풍선
    const text = String(msg || '').trim();
    if (text) {
      g.save(); g.font = '68px "Do Hyeon", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const tw = Math.min(900, g.measureText(text).width), bw = tw + 120, bh = 140, by = Math.max(430, sy + 60 - bh - 40), bx = cx - bw / 2;
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, bx + 6, by + 10, bw, bh, 70); g.fill();
      g.fillStyle = '#fffaf3'; rr(g, bx, by, bw, bh, 70); g.fill();
      g.beginPath(); g.moveTo(cx - 26, by + bh - 4); g.lineTo(cx + 26, by + bh - 4); g.lineTo(cx, by + bh + 40); g.closePath(); g.fill();
      g.fillStyle = '#2a1618'; g.fillText(text, cx, by + bh / 2 + 4, 900); g.restore();
    }
    // 이름표 + 하단 정보
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '76px "Do Hyeon", sans-serif'; const nw = g.measureText(nick).width + 90;
    g.fillStyle = 'rgba(26,18,20,.92)'; rr(g, cx - nw / 2, floorY + 70, nw, 116, 58); g.fill();
    g.strokeStyle = '#ffb27a'; g.lineWidth = 4; rr(g, cx - nw / 2, floorY + 70, nw, 116, 58); g.stroke();
    g.fillStyle = '#f6eee6'; g.fillText(nick, cx, floorY + 130);
    g.fillStyle = '#b9a59c'; g.font = '44px "Do Hyeon", sans-serif';
    g.fillText(`오늘 밤, 낯선 바에 앉았어요 · ${bizDate().replaceAll('-', '.')}`, cx, floorY + 274);
    g.fillStyle = '#ffb27a'; g.font = '56px "DotGothic16", monospace'; g.fillText("@_notsun_daegu", cx, floorY + 358);
    g.fillStyle = '#8f7268'; g.font = '38px "Do Hyeon", sans-serif'; g.fillText("대구 교동 혼술바 낯·선", cx, floorY + 426);
    g.restore();
    return c;
  }
  // ---------- 마감 사진: 손님 단체사진(1080x1350) / 가게 장면(1920x1080) ----------
  function makeGroupPhoto(guests, o) {
    o = o || {}; const day = bizDate(), th = o.theme || 'default';
    if (o.kind === 'scene') {
      const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const g = c.getContext('2d');
      createScene().render(g, 1920, 1080, guests, 1000, { day, count: guests.length, qr: null, owners: o.owners, theme: th, seats: o.seats, vip: o.vip, best: o.best, screenTitle: '오늘의 낯선 손님들' });
      g.font = '34px "DotGothic16", monospace'; g.textAlign = 'right'; g.fillStyle = 'rgba(255,178,122,.9)'; g.fillText('@_notsun_daegu', 1890, 1050);
      return c;
    }
    const W2 = 1080, H2 = 1350, c = document.createElement('canvas'); c.width = W2; c.height = H2; const g = c.getContext('2d'), cx = W2 / 2;
    const bg = g.createLinearGradient(0, 0, 0, H2); bg.addColorStop(0, '#3a0d10'); bg.addColorStop(0.5, '#5e1618'); bg.addColorStop(1, '#1a0b0d');
    g.fillStyle = bg; g.fillRect(0, 0, W2, H2);
    for (let x = 0; x < W2; x += 12) { g.fillStyle = `rgba(0,0,0,${0.05 + ((x * 7919) % 13) / 150})`; g.fillRect(x, 0, 6, H2); }
    g.save(); g.globalCompositeOperation = 'lighter'; const cone = g.createLinearGradient(0, 40, 0, 330); cone.addColorStop(0, 'rgba(255,226,180,.25)'); cone.addColorStop(1, 'rgba(255,226,180,0)');
    g.fillStyle = cone; g.beginPath(); g.moveTo(cx - 40, 60); g.lineTo(cx + 40, 60); g.lineTo(cx + 300, 330); g.lineTo(cx - 300, 330); g.closePath(); g.fill(); g.restore();
    g.fillStyle = '#2b2224'; g.fillRect(cx - 4, 0, 8, 46); g.beginPath(); g.moveTo(cx - 54, 44); g.lineTo(cx + 54, 44); g.lineTo(cx + 44, 60); g.lineTo(cx - 44, 60); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,236,200,.95)'; g.fillRect(cx - 40, 57, 80, 4);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.save(); g.shadowColor = 'rgba(20,6,8,.8)'; g.shadowBlur = 12; g.shadowOffsetY = 8; g.fillStyle = '#f6e9d8'; g.font = '300 76px "Helvetica Neue", "Segoe UI Light", Arial, sans-serif';
    const word = '- notsun -'; const ws = [...word].map(ch => g.measureText(ch).width), gap = 12, tot = ws.reduce((a, b) => a + b, 0) + gap * (word.length - 1);
    let x0 = cx - tot / 2; g.textAlign = 'left'; [...word].forEach((ch, i) => { g.fillText(ch, x0, 150); x0 += ws[i] + gap; }); g.restore();
    g.textAlign = 'center'; g.fillStyle = '#f6eee6'; g.font = '60px "Do Hyeon", sans-serif'; g.fillText('오늘의 낯선 손님들', cx, 240);
    g.fillStyle = '#ffb27a'; g.font = '36px "DotGothic16", monospace'; g.fillText(`${day.replaceAll('-', '.')}  ·  ${guests.length}명`, cx, 296);
    // 그리드
    const bestG = o.best && guests.find(x => x.id === o.best && x.msg);
    const list = guests.slice(0, 48), n = list.length, top = 340, bottom = H2 - (bestG ? 290 : 200);
    const cols = n <= 4 ? Math.max(1, n) : n <= 9 ? 3 : n <= 16 ? 4 : n <= 25 ? 5 : n <= 36 ? 6 : 8;
    const rows = Math.max(1, Math.ceil(n / cols)), cw = (W2 - 80) / cols, ch = Math.min(380, (bottom - top) / rows);
    const k = Math.max(2, Math.floor(Math.min(cw / 34, (ch - 40) / 54)));
    const vipSet = new Set(o.vip || []);
    g.imageSmoothingEnabled = false;
    list.forEach((gu, i) => {
      const r = Math.floor(i / cols), cIdx = i % cols, inRow = Math.min(cols, n - r * cols), offX = (cols - inRow) * cw / 2;
      const gx = 40 + offX + cIdx * cw + cw / 2, gy = top + r * ch + ch - 34;
      const sp = sprite(gu, false, gu.drink, 'n', costumeFor(th, gu.nick));
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(gx, gy - 2, 12 * k, 2.4 * k, 0, 0, Math.PI * 2); g.fill();
      g.drawImage(sp, gx - (CX + 2) * k, gy - (sp.height - 2) * k, sp.width * k, sp.height * k);
      const tr = null, vip = gu.id && vipSet.has(gu.id), best = o.best && gu.id === o.best;
      const fs2 = Math.max(18, Math.min(34, k * 6)); g.font = `${fs2}px "Do Hyeon", sans-serif`;
      const label = (best ? '★ ' : '') + gu.nick; const tw = g.measureText(label).width + 22;
      g.fillStyle = vip ? 'rgba(40,26,8,.92)' : 'rgba(14,10,11,.8)'; rr(g, gx - tw / 2, gy + 4, tw, fs2 + 12, (fs2 + 12) / 2); g.fill();
      if (vip || tr) { g.strokeStyle = vip ? '#ffd36a' : tr.ring; g.lineWidth = 2; g.stroke(); }
      g.fillStyle = best ? '#ffd36a' : vip ? '#ffe9a8' : tr ? tr.color : '#f6eee6'; g.textBaseline = 'middle'; g.fillText(label, gx, gy + 10 + fs2 / 2); g.textBaseline = 'alphabetic';
    });
    if (guests.length > 48) { g.fillStyle = '#b9a59c'; g.font = '30px "Do Hyeon", sans-serif'; g.fillText(`외 ${guests.length - 48}명`, cx, bottom + 10); }
    // 오늘의 한 줄
    if (bestG) {
      g.font = '44px "Do Hyeon", sans-serif'; const t2 = `“${bestG.msg}”`, bw = Math.min(W2 - 120, g.measureText(t2).width + 100);
      g.fillStyle = '#fff0b8'; rr(g, cx - bw / 2, H2 - 196, bw, 84, 42); g.fill();
      g.fillStyle = '#c98a1a'; g.font = '26px "Do Hyeon", sans-serif'; g.fillText(`오늘의 한 줄 ★ ${bestG.nick}`, cx, H2 - 206);
      g.fillStyle = '#2a1618'; g.font = '44px "Do Hyeon", sans-serif'; g.textBaseline = 'middle'; g.fillText(t2, cx, H2 - 152, W2 - 160); g.textBaseline = 'alphabetic';
    }
    g.fillStyle = '#ffb27a'; g.font = '40px "DotGothic16", monospace'; g.fillText('@_notsun_daegu', cx, H2 - 58);
    g.fillStyle = '#8f7268'; g.font = '28px "Do Hyeon", sans-serif'; g.fillText('대구 교동 혼술바 낯·선', cx, H2 - 18);
    return c;
  }
  function rr(g, x, y, w, h, r) { r = Math.min(r, h / 2, w / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  // ---------- 매장 장면 ----------
  // 자리
  // 자리 40석: 메인바 7 · ㄱ테이블 10 · ㄴ테이블 10 · 스탠딩 13
  const L = (layer, xs, foot, extra) => xs.map(x => ({ x, foot, layer, ...extra }));
  const SLOTS = {
    stool: L('stool', [14, 40, 66, 92, 118, 144, 170], 210, { sit: true, zone: 'bar' }),
    gBack: L('gBack', [232, 262, 292, 322, 352, 382, 412], 180, { zone: 'g' }),
    gIn: L('gIn', [262, 318, 374], 216, { zone: 'g' }),
    nFront: L('nFront', [252, 286, 320, 354, 388, 422], 268, { zone: 'n' }),
    nLeft: L('nLeft', [200, 202], 0, { zone: 'n' }).map((p, i) => ({ ...p, foot: i ? 254 : 230 })),
    nIn: L('nIn', [292, 346], 246, { zone: 'n' }),
    standBack: L('standBack', [247, 287, 327, 367, 407, 447], 162, { zone: 'stand' }),
    standFront: L('standFront', [14, 42, 70, 98, 126, 154, 182], 266, { zone: 'stand' })
  };
  const ORDER = [];
  const seq = [['stool'], ['gBack'], ['nFront']];
  for (let i = 0; i < 7; i++) seq.forEach(([k]) => SLOTS[k][i] && ORDER.push(SLOTS[k][i]));
  [...SLOTS.gIn, ...SLOTS.nIn, ...SLOTS.nLeft].forEach(p => ORDER.push(p));
  for (let i = 0; i < 7; i++) { if (SLOTS.standFront[i]) ORDER.push(SLOTS.standFront[i]); if (SLOTS.standBack[i]) ORDER.push(SLOTS.standBack[i]); }
  // 자리 번호: 메인바 b1~7 · ㄱ g1~10 · ㄴ n1~10 · 스탠딩 s1~13
  const SEATS = [];
  [['b', [...SLOTS.stool]], ['g', [...SLOTS.gBack, ...SLOTS.gIn]], ['n', [...SLOTS.nFront, ...SLOTS.nLeft, ...SLOTS.nIn]], ['s', [...SLOTS.standFront, ...SLOTS.standBack]]]
    .forEach(([k, arr]) => arr.forEach((slot, i) => { slot.code = k + (i + 1); SEATS.push(slot); }));
  const SEAT_BY_CODE = Object.fromEntries(SEATS.map(x => [x.code, x]));
  // 사장이 지정한 자리는 고정, 나머지 손님은 빈자리를 차례대로
  function placeGuests(guests, seats) {
    const seated = guests.slice(-ORDER.length), map = seats || {}, taken = new Set(), fixed = new Map();
    seated.forEach(g => { const c = g.id && map[g.id]; if (c && SEAT_BY_CODE[c] && !taken.has(c)) { taken.add(c); fixed.set(g, SEAT_BY_CODE[c]); } });
    const free = ORDER.filter(x => !taken.has(x.code)); let fi = 0;
    return seated.map(g => ({ g, slot: fixed.get(g) || free[fi++] }));
  }
  function createScene() {
    const buf = document.createElement('canvas'); buf.width = W; buf.height = H;
    const b = buf.getContext('2d');
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const noise = Array.from({ length: W / 2 }, () => rnd() * 8 - 4);
    const bottles = Array.from({ length: 12 }, () => Array.from({ length: 4 }, () => ({ h: 7 + Math.floor(rnd() * 5), c: ['#7a3a12', '#c98a2a', '#3a5a2a', '#e8d8b0', '#5a1f1a', '#2a2a40'][Math.floor(rnd() * 6)] })));
    const px = (x, y, w, h, c) => { b.fillStyle = c; b.fillRect(x, y, w, h); };
    const OWNER_X = [62, 128];
    function room() {
      px(0, 0, W, H, '#0e0a0b');
      for (let x = 0; x < W; x += 2) { const v = noise[x / 2]; px(x, 26, 2, 128, `rgb(${108 + v},${26 + v / 2},${28 + v / 2})`); }
      px(0, 0, W, 26, '#120c0d'); px(0, 18, 210, 8, '#5a1416'); px(0, 25, 210, 1, '#ff6a5a'); px(0, 26, 210, 2, 'rgba(255,90,80,.35)');
      px(180, 26, 18, 9, '#1a1a1e'); px(186, 22, 2, 4, '#2a2a2e'); px(181, 33, 2, 1, '#3a7aff');
      px(232, 22, 2, 6, '#2a2a2e'); px(220, 28, 26, 2, '#d9dde3'); px(230, 27, 6, 3, '#eef0f2');
      px(70, 30, 70, 30, '#cfd6dc');
      for (let y = 32; y < 58; y += 4) for (let x = 72; x < 138; x += 4) px(x + ((y / 4) % 2) * 2, y, 2, 2, '#4a5560');
      px(84, 36, 10, 8, '#2a3038'); px(116, 36, 10, 8, '#2a3038'); px(84, 48, 10, 8, '#2a3038'); px(116, 48, 10, 8, '#2a3038');
      px(10, 62, 176, 82, '#2a1d16');
      for (let k = 0; k < 4; k++) {
        const x0 = 13 + k * 43;
        px(x0, 64, 40, 78, '#f08a5d');
        for (let x = x0 + 1; x < x0 + 40; x += 3) px(x, 64, 1, 78, 'rgba(255,220,190,.35)');
        px(x0, 64, 2, 78, '#ffd2b0'); px(x0 + 38, 64, 2, 78, '#ffd2b0');
        [82, 100, 118, 136].forEach((sy, r) => {
          px(x0 + 2, sy, 36, 1, '#ffe2c8');
          if (k < 3) bottles[k * 4 + r].forEach((bt, i) => { const bx = x0 + 5 + i * 9; px(bx, sy - bt.h, 4, bt.h, bt.c); px(bx + 1, sy - bt.h - 2, 2, 2, bt.c); });
          else for (let i = 0; i < 5; i++) { px(x0 + 4 + i * 7, sy - 6, 4, 1, 'rgba(255,255,255,.8)'); px(x0 + 5 + i * 7, sy - 5, 2, 4, 'rgba(255,255,255,.35)'); }
        });
      }
      px(290, 34, 172, 96, '#e6e2dc'); px(293, 37, 166, 90, '#141018');
      px(200, 148, W - 200, 1, '#ff8a6a');
      px(0, 154, W, H - 154, '#0f0b10');
      for (let i = 0; i < 6; i++) px(30 + i * 80, 200 + (i % 3) * 18, 40, 1, 'rgba(255,255,255,.04)');
    }
    function barFront() {
      px(0, 146, 196, 5, '#2a2a30'); px(0, 146, 196, 1, '#55555c');
      px(0, 151, 196, 34, '#6a5644');
      for (let x = 2; x < 196; x += 6) px(x, 152, 1, 33, 'rgba(0,0,0,.12)');
      px(0, 151, 196, 3, '#ffe9c8'); px(0, 154, 196, 4, 'rgba(255,233,200,.35)');
      px(0, 185, 196, 2, '#1a1414');
      [44, 150].forEach(lx => { px(lx - 4, 132, 9, 2, '#efe2c0'); px(lx, 134, 1, 12, '#c9b48a'); px(lx - 3, 144, 7, 2, '#c9b48a'); });
      px(180, 132, 2, 14, '#9aa0a6'); px(176, 132, 6, 2, '#9aa0a6');
    }
    function stool(x) { px(x - 8, 203, 16, 4, '#141416'); px(x - 7, 202, 14, 1, '#2a2a2e'); px(x - 9, 207, 18, 2, '#e8e8ea'); px(x - 1, 209, 2, 20, '#2a2a2e'); px(x - 6, 229, 12, 2, '#2a2a2e'); }
    // ㄱ + ㄴ 테이블: 윗면 + 앞면 두께 + 다리
    const TOP = '#403c48', HI = '#625e6c', FRONT = '#1c1a21', LEG = '#0c0b0e';
    function slab([x0, y0, x1, y1], legs) {
      px(x0, y0, x1 - x0, y1 - y0, TOP);
      px(x0, y0, x1 - x0, 1, HI); px(x0, y0, 1, y1 - y0, shade(HI, .85));
      px(x0, y1, x1 - x0, 5, FRONT); px(x0, y1, x1 - x0, 1, '#2a2830');
      legs.forEach(lx => px(lx, y1 + 5, 2, 12, LEG));
    }
    const A = [214, 168, 460, 184], B = [440, 184, 460, 232];   // ㄱ
    const C = [214, 190, 234, 250], D = [234, 234, 434, 250];   // ㄴ
    const lamp = (lx, ly) => { px(lx - 4, ly - 12, 9, 2, '#efe2c0'); px(lx, ly - 10, 1, 9, '#c9b48a'); px(lx - 3, ly - 1, 7, 2, '#c9b48a'); };
    const card = (mx, my) => { px(mx, my - 7, 6, 8, '#efe9de'); px(mx + 1, my - 6, 4, 3, '#3a3a3a'); };
    function tableBack() {
      slab(A, [216, 456]); slab(B, [442, 456]); slab(C, [216, 230]);
      lamp(276, 178); lamp(396, 178); lamp(450, 212); lamp(224, 222);
      card(334, 180); card(445, 198);
    }
    function tableFront() { slab(D, [236, 300, 370, 430]); lamp(334, 244); card(280, 246); card(392, 246); }
    const glowsAt = [[44, 133], [150, 133], [276, 167], [396, 167], [450, 201], [224, 211], [334, 233]];
    const blit = (sp, cx, foot) => b.drawImage(sp, Math.round(cx - CX - 2), Math.round(foot - sp.height + 1));
    function bubble(ctx, s, ax, ay, text, kind, age, icon) {
      const pop = Math.min(1, age / 220), k = 0.6 + 0.4 * (1 - (1 - pop) ** 3);
      ctx.save();
      ctx.font = `${7 * s}px "Do Hyeon", sans-serif`;
      const tw = ctx.measureText(text).width, padX = 6 * s, bh = 15 * s, ic = icon ? 10 * s : 0, bw = tw + padX * 2 + (kind === 'live' ? 9 * s : 0) + ic;
      let bx = ax * s - bw / 2; bx = Math.max(4 * s, Math.min(W * s - bw - 4 * s, bx));
      const by = ay * s - bh - 7 * s;
      ctx.translate(ax * s, ay * s); ctx.scale(k, k); ctx.translate(-ax * s, -ay * s);
      const fill = kind === 'owner' || kind === 'live' ? '#ffe7d2' : kind === 'best' ? '#fff0b8' : kind === 'order' ? '#d9f7df' : kind === 'drink' ? '#ffe9d6' : '#ffffff';
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.roundRect(bx + 1.5 * s, by + 2 * s, bw, bh, 7.5 * s); ctx.fill();
      ctx.fillStyle = fill; ctx.strokeStyle = '#3a2326'; ctx.lineWidth = 1.2 * s;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 7.5 * s); ctx.fill(); ctx.stroke();
      // 꼬리 (둥근 삼각)
      const tx = Math.max(bx + 8 * s, Math.min(bx + bw - 8 * s, ax * s));
      ctx.beginPath(); ctx.moveTo(tx - 4 * s, by + bh - .6 * s); ctx.quadraticCurveTo(tx - 1 * s, by + bh + 3 * s, tx - 1.5 * s, by + bh + 6 * s);
      ctx.quadraticCurveTo(tx + 2 * s, by + bh + 3 * s, tx + 4 * s, by + bh - .6 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = fill; ctx.fillRect(tx - 3.4 * s, by + bh - 2 * s, 6.8 * s, 2 * s);
      ctx.fillStyle = '#2a1618'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const textX = bx + bw / 2 + (kind === 'live' ? 4.5 * s : 0) + ic / 2;
      ctx.fillText(text, textX, by + bh / 2 + .5 * s);
      if (icon) { ctx.save(); ctx.translate(bx + padX + 3.6 * s, by + bh / 2 + 3.4 * s); ctx.scale(.78, .78); talkIcon(ctx, s, 0, 0, icon, 0); ctx.restore(); }  // 말하는 사람의 대화 아이콘은 말풍선 안 왼쪽에
      if (kind === 'live') { ctx.fillStyle = '#e2493c'; ctx.font = `${7 * s}px "Do Hyeon", sans-serif`; ctx.fillText('★', bx + 8 * s, by + bh / 2 + .5 * s); }
      if (kind === 'order') { ctx.fillStyle = '#2f8a44'; ctx.font = `${4.6 * s}px "Do Hyeon", sans-serif`; ctx.fillText('♪ 띵동', bx + bw / 2, by - 3.5 * s); }
      if (kind === 'best') { ctx.fillStyle = '#c98a1a'; ctx.font = `${4.6 * s}px "Do Hyeon", sans-serif`; ctx.fillText('오늘의 한 줄 ★', bx + bw / 2, by - 3.5 * s); }
      ctx.restore();
    }
    let lastKey = '', since = 0, sfxOrderKey = 0;
    const seen = new Map(), lastSeat = new Map();
    // ---------- 시즌 장식 ----------
    function lights(x0, x1, y, cols, t, step) { for (let x = x0, i = 0; x < x1; x += step, i++) { const on = (i + Math.floor(t / 450)) % 3 !== 0; px(x, y + (i % 2), 2, 2, on ? cols[i % cols.length] : shade(cols[i % cols.length], .45)); px(x - step / 2, y - 1 + (i % 2 ? 0 : 1), step / 2, 1, '#2a2020'); } }
    function pumpkin(x, y) { px(x, y - 6, 9, 6, '#f08a1a'); px(x + 1, y - 7, 7, 1, '#f08a1a'); px(x + 3, y - 6, 1, 6, '#c86a10'); px(x + 6, y - 6, 1, 6, '#c86a10'); px(x + 4, y - 9, 1, 2, '#3a6a2a'); px(x + 2, y - 5, 1, 1, '#2a1408'); px(x + 6, y - 5, 1, 1, '#2a1408'); px(x + 2, y - 3, 5, 1, '#2a1408'); }
    function bat(x, y) { px(x, y, 9, 1, '#1a1014'); px(x + 1, y - 1, 2, 1, '#1a1014'); px(x + 6, y - 1, 2, 1, '#1a1014'); px(x + 3, y - 1, 3, 2, '#1a1014'); px(x + 1, y + 1, 1, 1, '#1a1014'); px(x + 7, y + 1, 1, 1, '#1a1014'); }
    function web(x, y, dir) { for (let k = 0; k < 14; k++) { px(x + dir * k, y + k, 1, 1, 'rgba(240,240,240,.55)'); px(x + dir * k, y, 1, 1, 'rgba(240,240,240,.45)'); px(x, y + k, 1, 1, 'rgba(240,240,240,.45)'); } [5, 10].forEach(r => { for (let k = 0; k <= r; k++) px(x + dir * k, y + r - k + (k % 2), 1, 1, 'rgba(240,240,240,.4)'); }); }
    function tree(x, base) { px(x - 2, base - 6, 4, 6, '#5a3a1e'); [[0, 14], [10, 11], [19, 8], [27, 5]].forEach(([dy, hw]) => { for (let r = 0; r < 10; r++) px(x - Math.round(hw * (r + 3) / 13), base - 6 - dy - 10 + r, Math.round(hw * (r + 3) / 13) * 2, 1, r % 3 ? '#1f6a3a' : '#2a8a4a'); });
      px(x - 1, base - 50, 3, 3, '#ffd23a'); [[-6, -18, '#e23b4a'], [5, -22, '#3a7aff'], [-3, -31, '#ffd23a'], [6, -12, '#ffd23a'], [-9, -10, '#3a7aff'], [2, -38, '#e23b4a']].forEach(([dx, dy, c]) => px(x + dx, base + dy, 2, 2, c));
      px(x - 16, base - 6, 9, 7, '#d6262e'); px(x - 12, base - 6, 1, 7, '#ffd23a'); px(x + 7, base - 5, 8, 6, '#3a7aff'); px(x + 10, base - 5, 1, 6, '#ffffff'); }
    function palm(x, y, dir) { [[0, 0], [1, 1], [2, 1], [3, 2], [4, 3], [5, 3], [6, 4], [7, 5], [8, 6], [9, 6], [10, 7], [11, 8], [12, 9]].forEach(([dx, dy]) => { px(x + dir * dx, y + dy, 2, 2, '#2a8a3a'); px(x + dir * dx, y + dy + 2, 1, 2, '#3aa84a'); });
      [[0, 0], [2, 2], [3, 4], [4, 6], [5, 9], [5, 12], [5, 15]].forEach(([dx, dy]) => { px(x + dir * (dx + 2), y + dy, 2, 2, '#1f7a32'); px(x + dir * (dx + 4), y + dy + 1, 1, 2, '#3aa84a'); }); }
    function heart(x, y, c) { px(x, y, 2, 1, c); px(x + 3, y, 2, 1, c); px(x, y + 1, 5, 1, c); px(x + 1, y + 2, 3, 1, c); px(x + 2, y + 3, 1, 1, c); }
    function rose(x, y) { px(x, y - 3, 3, 3, '#d6202e'); px(x + 1, y - 2, 1, 1, '#ff5a6a'); px(x + 1, y, 1, 4, '#3a8a3a'); px(x + 2, y + 1, 1, 1, '#3a8a3a'); }
    function vase(x, y) { px(x, y - 6, 5, 6, '#cfe0ea'); rose(x - 1, y - 7); rose(x + 2, y - 9); rose(x + 4, y - 6); }
    function peperoBox(x, y) { px(x, y - 8, 7, 8, '#d6262e'); px(x + 1, y - 7, 5, 2, '#ffffff'); for (let k = 0; k < 3; k++) { px(x + 1 + k * 2, y - 14, 1, 6, '#e8c070'); px(x + 1 + k * 2, y - 14, 1, 3, '#5a3020'); } }
    function lolli(x, y) { px(x + 1, y - 6, 1, 6, '#f2f2f2'); px(x, y - 9, 3, 3, '#ff8ac0'); px(x + 1, y - 8, 1, 1, '#ffffff'); }
    function bunting(x0, x1, y, cols) { px(x0, y, x1 - x0, 1, '#2a2020'); for (let x = x0 + 2, i = 0; x < x1 - 4; x += 8, i++) { const c = cols[i % cols.length]; for (let r = 0; r < 5; r++) px(x + Math.floor(r / 2), y + 1 + r, 5 - Math.floor(r / 2) * 2, 1, c); } }
    function spider(x, y) { px(x - 1, y, 3, 3, '#151015'); px(x, y - 1, 1, 1, '#151015'); [[-3, 0], [-3, 2], [3, 0], [3, 2]].forEach(([dx, dy]) => px(x + dx, y + dy, 2, 1, '#151015')); px(x - 1, y + 1, 1, 1, '#e02a2a'); px(x + 1, y + 1, 1, 1, '#e02a2a'); }
    function skull(x, y) { px(x, y - 6, 7, 5, '#ece8e0'); px(x + 1, y - 7, 5, 1, '#ece8e0'); px(x + 1, y - 1, 5, 2, '#ece8e0'); px(x + 1, y - 5, 2, 2, '#151515'); px(x + 4, y - 5, 2, 2, '#151515'); px(x + 3, y - 3, 1, 1, '#151515'); px(x + 2, y - 1, 1, 1, '#9a9a9a'); px(x + 4, y - 1, 1, 1, '#9a9a9a'); }
    function candle(x, y, t, k) { px(x, y - 6, 2, 6, '#f2ead8'); px(x, y - 6, 2, 1, '#d8ccb0'); const f = Math.floor(t / 120 + k * 3) % 3; px(x, y - 9 + (f === 2 ? 1 : 0), 2, 2, f ? '#ffb22a' : '#ffd860'); px(x, y - 10, 1, 1, '#fff2b0'); }
    function potion(x, y, c) { px(x + 1, y - 9, 2, 2, '#a07a5a'); px(x, y - 7, 4, 2, '#cfe0ea'); px(x - 1, y - 5, 6, 5, c); px(x, y - 4, 1, 2, 'rgba(255,255,255,.6)'); }
    function lantern(x, y, t, k) { const lit = (Math.floor(t / 90 + k * 5) % 7) !== 0; px(x, y - 7, 10, 7, '#f08a1a'); px(x + 1, y - 8, 8, 1, '#f08a1a'); px(x + 1, y, 8, 1, '#c86a10'); px(x + 3, y - 7, 1, 7, '#d8701a'); px(x + 6, y - 7, 1, 7, '#d8701a'); px(x + 4, y - 10, 2, 2, '#3a6a2a');
      const fc = lit ? '#ffe070' : '#7a3a08'; px(x + 2, y - 6, 2, 2, fc); px(x + 6, y - 6, 2, 2, fc); px(x + 2, y - 3, 6, 1, fc); px(x + 3, y - 2, 1, 1, fc); px(x + 6, y - 2, 1, 1, fc); }
    function miniGhost(x, y) { px(x + 1, y, 7, 1, '#f6f6ff'); px(x, y + 1, 9, 8, '#f6f6ff'); px(x, y + 9, 2, 1, '#f6f6ff'); px(x + 4, y + 9, 2, 1, '#f6f6ff'); px(x + 7, y + 9, 2, 1, '#f6f6ff'); px(x + 2, y + 3, 2, 2, '#1a1010'); px(x + 5, y + 3, 2, 2, '#1a1010'); px(x + 3, y + 6, 3, 1, '#3a2a2a'); }
    function bow(x, y) { px(x, y, 3, 3, '#d6262e'); px(x + 4, y, 3, 3, '#d6262e'); px(x + 3, y + 1, 1, 2, '#a01a20'); px(x + 2, y + 3, 1, 3, '#d6262e'); px(x + 4, y + 3, 1, 3, '#d6262e'); }
    function stocking(x, y, c) { px(x, y, 6, 2, '#ffffff'); px(x, y + 2, 5, 7, c); px(x - 2, y + 7, 7, 3, c); px(x - 2, y + 9, 3, 1, shade(c, .8)); px(x + 1, y + 4, 1, 1, '#ffffff'); }
    function bigTree(x, base, t) {
      px(x - 2, base - 6, 4, 6, '#5a3a1e');
      const tiers = [[0, 18], [12, 14], [23, 10], [32, 6]];
      tiers.forEach(([dy, hw]) => { for (let r = 0; r < 13; r++) { const w2 = Math.round(hw * (r + 3) / 15); px(x - w2, base - 6 - dy - 13 + r, w2 * 2, 1, r % 3 ? '#1f6a3a' : '#2a8a4a'); if (r === 12) px(x - w2, base - 6 - dy - 13 + r, w2 * 2, 1, '#174f2c'); } });
      for (let k = 0; k < 22; k++) { const yy = base - 10 - (k * 2.1), half = Math.max(2, 17 - k * 0.7), xx = x + Math.round(Math.sin(k * 2.3) * half * 0.8); const on = (k + Math.floor(t / 380)) % 3 !== 0; px(xx, Math.round(yy), 2, 2, on ? ['#ff4a5a', '#ffd23a', '#4ab0ff', '#7be06a', '#ff8ad0'][k % 5] : '#3a3a2a'); }
      for (let k = 0; k < 4; k++) { const yy = base - 14 - k * 9; for (let xx = -12 + k * 3; xx <= 12 - k * 3; xx += 2) px(x + xx, yy + Math.round(xx / 6), 1, 1, '#e8e8f0'); }
      const tw = 0.6 + 0.4 * Math.sin(t / 300); px(x - 2, base - 56, 5, 5, '#ffd23a'); px(x, base - 58, 1, 9, '#ffd23a'); px(x - 4, base - 54, 9, 1, '#ffd23a'); if (tw > .8) px(x - 1, base - 55, 3, 3, '#fff6c0');
      [[x - 20, '#d6262e', '#ffd23a', 9, 7], [x - 10, '#3a7aff', '#ffffff', 8, 6], [x + 6, '#ffd23a', '#d6262e', 10, 8], [x + 17, '#4fd36a', '#d6262e', 7, 5]].forEach(([bx, c1, c2, w2, h2]) => { px(bx, base - h2, w2, h2, c1); px(bx + Math.floor(w2 / 2), base - h2, 1, h2, c2); px(bx, base - h2 + 2, w2, 1, c2); px(bx + Math.floor(w2 / 2) - 1, base - h2 - 2, 3, 2, c2); }); }
    function fireplace(x, y, t) {
      px(x, y, 52, 36, '#7a3a2a'); for (let r = 0; r < 36; r += 4) for (let c = (r / 4) % 2 ? 0 : 4; c < 52; c += 8) px(x + c, y + r, 1, 4, '#5a2a1e'); for (let r = 0; r < 36; r += 4) px(x, y + r, 52, 1, '#5a2a1e');
      px(x - 3, y - 3, 58, 4, '#4a2e22'); px(x - 3, y - 3, 58, 1, '#6a4a38');
      px(x + 10, y + 12, 32, 24, '#140c0c');
      const f = t / 110; for (let k = 0; k < 9; k++) { const h2 = 6 + Math.round((Math.sin(f + k * 1.7) + 1) * 4); px(x + 13 + k * 3, y + 36 - h2, 3, h2, k % 2 ? '#ff7a1a' : '#ffb22a'); px(x + 14 + k * 3, y + 36 - Math.round(h2 * .5), 1, Math.round(h2 * .5), '#ffe070'); }
      px(x + 12, y + 33, 28, 3, '#5a3a1e'); px(x + 14, y + 31, 24, 2, '#6a4a2e');
      [[x + 2, '#d6262e'], [x + 20, '#2a8a4a'], [x + 38, '#d6262e']].forEach(([sx, c]) => stocking(sx + 2, y + 1, c));
      for (let k = 0; k < 26; k++) px(x - 2 + k * 2, y - 4 + (k % 2), 2, 2, k % 5 ? '#1f6a3a' : '#e23b4a');
      candle(x + 1, y - 4, t, 1); candle(x + 49, y - 4, t, 2); }
    function snowman(x, base) { px(x - 6, base - 11, 13, 11, '#f6f8fc'); px(x - 5, base - 12, 11, 1, '#f6f8fc'); px(x - 4, base - 19, 9, 7, '#f6f8fc'); px(x - 3, base - 20, 7, 1, '#f6f8fc'); px(x - 2, base - 17, 1, 1, '#151515'); px(x + 2, base - 17, 1, 1, '#151515'); px(x, base - 15, 3, 1, '#f08a1a');
      px(x - 4, base - 12, 9, 2, '#d6262e'); px(x + 2, base - 10, 2, 4, '#d6262e'); px(x - 4, base - 24, 9, 4, '#151515'); px(x - 6, base - 20, 13, 1, '#151515'); [-7, -4].forEach(dy => px(x, base + dy, 1, 1, '#151515')); px(x - 10, base - 9, 4, 1, '#6a4a2a'); px(x + 7, base - 9, 4, 1, '#6a4a2a'); }
    function balloon(x, y, c, t, k) { const bob = Math.round(Math.sin(t / 700 + k) * 1.5); px(x, y + bob, 6, 7, c); px(x + 1, y - 1 + bob, 4, 1, c); px(x + 1, y + 7 + bob, 4, 1, c); px(x + 2, y + 8 + bob, 2, 1, shade(c, .8)); px(x + 1, y + 1 + bob, 1, 2, 'rgba(255,255,255,.7)'); for (let q = 0; q < 14; q++) px(x + 3 + (q % 4 === 0 ? 1 : 0), y + 9 + q + bob, 1, 1, 'rgba(230,230,230,.6)'); }
    function decorWall(th, t) {
      if (['valentine', 'white', 'rose', 'pepero', 'spring', 'summer'].includes(th)) bunting(200, 288, 34, { valentine: ['#ff4a7a', '#ffffff', '#ffb0c8'], white: ['#bfe6ff', '#ffffff', '#ff8ac0'], rose: ['#d6202e', '#ffffff', '#3a8a3a'], pepero: ['#c8945a', '#ff8ab0', '#5a3020'], spring: ['#ff9ac0', '#ffffff', '#ffe08a'], summer: ['#ff6a8a', '#ffd23a', '#4ad0e0', '#7be06a'] }[th]);
      if (th === 'valentine') { for (let x = 4; x < 206; x += 9) heart(x, 27 + (x % 18 ? 1 : 0), x % 18 ? '#ff4a7a' : '#ffffff'); for (let x = 300; x < 458; x += 10) heart(x, 31, x % 20 ? '#ff4a7a' : '#ffb0c8');
        for (let r = 0; r < 14; r++) { const w = r < 4 ? 6 + r * 2 : 28 - (r - 4) * 2.6; px(Math.round(256 - w / 2 - (r < 4 ? 8 : 0)), 58 + r, Math.max(1, Math.round(w)), 1, '#e23b6a'); if (r < 4) px(Math.round(256 + 8 - w / 2), 58 + r, Math.round(w), 1, '#e23b6a'); } }
      if (th === 'white') { for (let x = 4; x < 206; x += 6) px(x, 27 + (x % 12 ? 1 : 0), 3, 3, x % 12 ? '#ffffff' : '#bfe6ff'); for (let x = 300; x < 458; x += 7) px(x, 31, 3, 3, x % 14 ? '#ffffff' : '#bfe6ff'); }
      if (th === 'rose') { for (let x = 6; x < 206; x += 12) rose(x, 31); for (let x = 302; x < 458; x += 14) rose(x, 34); }
      if (th === 'pepero') { for (let x = 4; x < 206; x += 8) { px(x, 26, 6, 1, '#5a3020'); px(x + 1, 27, 4, 2, x % 16 ? '#ff8ab0' : '#c8945a'); px(x + 2, 29, 2, 1, x % 16 ? '#ff8ab0' : '#c8945a'); } for (let x = 300; x < 458; x += 9) { px(x + 1, 31, 4, 2, x % 18 ? '#ff8ab0' : '#c8945a'); } }
      if (th === 'halloween') {
        lights(4, 208, 27, ['#ff8a1a', '#9a5ae0', '#7be06a'], t, 8); lights(296, 460, 31, ['#ff8a1a', '#9a5ae0'], t, 8);
        bunting(200, 288, 34, ['#ff8a1a', '#1a1014', '#9a5ae0']);
        web(210, 28, 1); web(479, 28, -1); web(11, 63, 1); web(185, 63, -1); web(294, 38, 1);
        [[222, 0], [276, 1.7], [466, 3.1]].forEach(([x, ph]) => { const yy = Math.round(48 + Math.sin(t / 900 + ph) * 7); px(x, 26, 1, yy - 26, 'rgba(225,225,225,.55)'); spider(x, yy); });
        bat(248, 112); bat(266, 124); bat(470, 66); bat(206, 96);
        lantern(146, 82, t, 1); skull(160, 82); skull(146, 118); candle(156, 118, t, 2); candle(162, 118, t, 3); candle(168, 118, t, 4); potion(148, 100, '#7be06a'); potion(158, 100, '#9a5ae0'); potion(168, 100, '#e0344a'); skull(168, 136); potion(150, 136, '#4ad0e0');
        miniGhost(Math.round(212 + Math.sin(t / 1400) * 8), Math.round(118 + Math.sin(t / 650) * 4));
        px(466, 132, 12, 16, '#6a6a74'); px(467, 130, 10, 2, '#6a6a74'); px(468, 129, 8, 1, '#6a6a74'); px(471, 134, 2, 8, '#4a4a54'); px(469, 136, 6, 2, '#4a4a54');
      } else if (th === 'christmas') {
        for (let x = 0; x < 208; x += 2) px(x, 26 + Math.round(Math.sin(x / 9) * 1.5), 2, 3, x % 4 ? '#1f6a3a' : '#2a8a4a');
        for (let x = 14; x < 208; x += 40) bow(x, 26);
        lights(4, 208, 29, ['#e23b4a', '#ffd23a', '#3a7aff', '#4fd36a'], t, 7); lights(296, 460, 31, ['#e23b4a', '#ffd23a', '#3a7aff', '#4fd36a'], t, 7);
        bunting(200, 288, 34, ['#d6262e', '#2a8a4a', '#ffffff']);
        px(290, 32, 172, 3, '#ffffff'); for (let x = 292; x < 460; x += 7) { px(x, 35, 2, 2 + (x % 3), '#dff2ff'); px(x + 3, 35, 1, 1, '#ffffff'); }
        px(10, 61, 176, 2, '#ffffff'); for (let x = 12; x < 186; x += 9) px(x, 63, 1, 2 + (x % 2), '#dff2ff');
        for (let a = 0; a < 36; a++) { const ang = a / 36 * Math.PI * 2; px(Math.round(470 + Math.cos(ang) * 6), Math.round(70 + Math.sin(ang) * 6), 2, 2, a % 6 ? '#1f6a3a' : '#e23b4a'); } bow(467, 75);
        fireplace(234, 112, t);
        bigTree(212, 152, t);
      } else if (th === 'summer') {
        lights(4, 208, 27, ['#ff6a8a', '#ffd23a', '#4ad0e0', '#7be06a'], t, 8); lights(296, 460, 31, ['#ff6a8a', '#ffd23a', '#4ad0e0'], t, 8);
        palm(0, 30, 1); palm(479, 30, -1);
        px(468, 92, 8, 56, '#4ad0e0'); px(469, 90, 6, 2, '#4ad0e0'); px(471, 92, 2, 56, '#ffffff'); px(468, 146, 8, 2, '#2a9ab0');
      } else if (th === 'spring') {
        for (let x = 2; x < 206; x += 6) { px(x, 27 + (x % 12 ? 1 : 0), 3, 3, x % 12 ? '#ff9ac0' : '#ffffff'); px(x + 1, 28 + (x % 12 ? 1 : 0), 1, 1, '#f5c84a'); }
        for (let k = 0; k < 18; k++) { px(476 - k * 2, 30 + k, 2, 1, '#5a3a2a'); if (k % 3 === 0) { px(470 - k * 2, 28 + k, 3, 3, '#ffb0cc'); px(471 - k * 2, 29 + k, 1, 1, '#ffffff'); } }
      }
    }
    let tNow = 0;
    function decorFront(th) {
      if (th === 'valentine') { [[6, 146], [184, 146], [222, 168], [446, 168]].forEach(([x, y]) => { px(x, y - 5, 8, 5, '#7a2a3a'); heart(x + 1, y - 5, '#ff4a7a'); }); }
      if (th === 'white') { [[8, 146], [186, 146], [224, 168], [448, 168], [244, 234]].forEach(([x, y]) => { lolli(x, y); lolli(x + 3, y + 1); }); }
      if (th === 'rose') { vase(8, 146); vase(184, 146); vase(222, 168); vase(446, 168); vase(244, 234); }
      if (th === 'pepero') { peperoBox(6, 146); peperoBox(184, 146); peperoBox(222, 168); peperoBox(444, 168); peperoBox(242, 234); }
      if (th === 'halloween') { lantern(2, 146, tNow, 1); lantern(184, 146, tNow, 2); lantern(214, 168, tNow, 3); lantern(448, 168, tNow, 4); lantern(236, 234, tNow, 5); candle(300, 168, tNow, 6); candle(420, 168, tNow, 7); candle(360, 234, tNow, 8); }
      if (th === 'christmas') { [[6, 146], [186, 146]].forEach(([x, y]) => { px(x, y - 6, 6, 6, '#d6262e'); px(x + 2, y - 6, 1, 6, '#ffd23a'); px(x, y - 4, 6, 1, '#ffd23a'); });
        [[300, 168], [420, 168], [360, 234]].forEach(([x, y], k) => { candle(x, y, tNow, k); px(x - 3, y, 8, 1, '#1f6a3a'); px(x - 2, y - 1, 2, 1, '#e23b4a'); px(x + 3, y - 1, 2, 1, '#e23b4a'); });
        snowman(470, 266); }
      if (th === 'summer') { px(200, 162, 10, 10, '#ffffff'); px(200, 162, 5, 5, '#ff4a5a'); px(205, 167, 5, 5, '#3a7aff'); px(205, 162, 5, 5, '#ffd23a'); px(186, 138, 7, 8, '#e8b030'); px(187, 134, 2, 4, '#3a9a3a'); px(190, 133, 2, 5, '#3a9a3a'); }
    }
    function particles(ctx, s, t, th) {
      if (th === 'valentine') { for (let i = 0; i < 18; i++) { const x = (i * 83) % W + Math.sin(t / 900 + i) * 8, y = H - ((t / 1000 * (9 + i % 5)) + i * 47) % (H - 20); const k = 1.3 * s;
        ctx.fillStyle = i % 3 ? 'rgba(255,90,130,.85)' : 'rgba(255,190,210,.85)'; ctx.fillRect(x * s, y * s, 2 * k, k); ctx.fillRect((x + 3) * s, y * s, 2 * k, k); ctx.fillRect(x * s, y * s + k, 5 * k, k); ctx.fillRect((x + 1) * s, y * s + 2 * k, 3 * k, k); ctx.fillRect((x + 2) * s, y * s + 3 * k, k, k); } }
      if (th === 'white') { for (let i = 0; i < 40; i++) { const x = (i * 97) % W + Math.sin(t / 1300 + i) * 6, y = ((t / 1000 * (6 + i % 7)) + i * 31) % (H + 10) - 5; ctx.fillStyle = `rgba(255,255,255,${.5 + .4 * Math.sin(t / 250 + i)})`; ctx.fillRect(x * s, y * s, 1.6 * s, 1.6 * s); } }
      if (th === 'rose') { for (let i = 0; i < 24; i++) { const x = ((i * 131) % W + Math.sin(t / 900 + i) * 12 + t / 260) % W, y = ((t / 1000 * (10 + i % 6)) + i * 41) % (H + 10) - 5; ctx.fillStyle = i % 2 ? 'rgba(214,32,46,.9)' : 'rgba(255,90,106,.9)'; ctx.fillRect(x * s, y * s, 2.4 * s, 1.6 * s); } }
      if (th === 'pepero') { for (let i = 0; i < 14; i++) { const x = (i * 113) % W + Math.sin(t / 1000 + i) * 8, y = ((t / 1000 * (12 + i % 5)) + i * 53) % (H + 20) - 10;
        ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(.6 + Math.sin(t / 700 + i) * .4); ctx.fillStyle = '#e8c070'; ctx.fillRect(0, 0, 1.4 * s, 9 * s); ctx.fillStyle = '#5a3020'; ctx.fillRect(0, 0, 1.4 * s, 5 * s); ctx.restore(); } }
      if (th === 'christmas') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const fg = .2 + .07 * Math.sin(t / 120) + .04 * Math.sin(t / 47); const g = ctx.createRadialGradient(260 * s, 138 * s, 0, 260 * s, 138 * s, 50 * s); g.addColorStop(0, `rgba(255,150,60,${fg})`); g.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = g; ctx.fillRect(200 * s, 80 * s, 120 * s, 120 * s);
        const g2 = ctx.createRadialGradient(212 * s, 98 * s, 0, 212 * s, 98 * s, 30 * s); g2.addColorStop(0, `rgba(255,220,120,${.18 + .08 * Math.sin(t / 300)})`); g2.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = g2; ctx.fillRect(180 * s, 66 * s, 64 * s, 64 * s);
        ctx.restore();
        const sp2 = (t % 26000) / 9000; if (sp2 < 1) { const sx = (1 - sp2) * (W + 120) - 60, sy = 13 + Math.sin(sp2 * Math.PI * 3) * 3; ctx.fillStyle = '#1a1014';
          for (let r = 0; r < 3; r++) { const rx = sx - 14 - r * 11; ctx.fillRect(rx * s, sy * s, 8 * s, 3 * s); ctx.fillRect((rx - 1) * s, (sy - 3) * s, 2 * s, 3 * s); ctx.fillRect((rx + 1) * s, (sy + 3) * s, 1 * s, 2 * s); ctx.fillRect((rx + 6) * s, (sy + 3) * s, 1 * s, 2 * s); if (r === 0) { ctx.fillStyle = '#ff3a3a'; ctx.fillRect((rx - 2) * s, (sy - 1) * s, 1.5 * s, 1.5 * s); ctx.fillStyle = '#1a1014'; } }
          ctx.fillRect(sx * s, (sy - 1) * s, 12 * s, 5 * s); ctx.fillRect((sx + 9) * s, (sy - 4) * s, 4 * s, 3 * s); ctx.fillRect((sx - 1) * s, (sy + 4) * s, 15 * s, 1 * s); ctx.fillRect((sx - 4) * s, (sy + 1) * s, 4 * s, .6 * s);
          for (let k = 0; k < 6; k++) { ctx.fillStyle = `rgba(255,230,140,${.8 - k * .12})`; ctx.fillRect((sx + 16 + k * 5) * s, (sy + 2 + Math.sin(t / 100 + k) * 1.5) * s, 1.4 * s, 1.4 * s); } }
        for (let i = 0; i < 16; i++) { const x = ((i * 131) % W + Math.sin(t / 1800 + i) * 10), y = ((t / 1000 * (7 + i % 4)) + i * 61) % (H + 10) - 5, r = 2.2 * s; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(x * s - r, y * s, r * 3, r * .8); ctx.fillRect(x * s, y * s - r, r * .8, r * 3); }
        for (let i = 0; i < 70; i++) { const sp = 12 + (i * 7) % 11, x = ((i * 97) % W + Math.sin(t / 1400 + i) * 6), y = ((t / 1000 * sp) + i * 37) % (H + 10) - 5; ctx.fillStyle = 'rgba(255,255,255,.8)'; const r = (i % 3 ? 1 : 1.6) * s; ctx.fillRect(x * s, y * s, r, r); } }
      if (th === 'spring') { for (let i = 0; i < 26; i++) { const x = ((i * 131) % W + Math.sin(t / 900 + i) * 14 + t / 220) % W, y = ((t / 1000 * (10 + i % 6)) + i * 41) % (H + 10) - 5; ctx.fillStyle = i % 2 ? 'rgba(255,170,200,.9)' : 'rgba(255,220,235,.9)'; ctx.fillRect(x * s, y * s, 2.4 * s, 1.6 * s); } }
      if (th === 'summer') { for (let i = 0; i < 22; i++) { const x = (i * 89) % W + Math.sin(t / 1100 + i) * 5, y = H - ((t / 1000 * (8 + i % 5)) + i * 53) % (H - 30); ctx.fillStyle = `rgba(255,230,140,${.35 + .3 * Math.sin(t / 300 + i)})`; ctx.fillRect(x * s, y * s, 1.6 * s, 1.6 * s); } }
      if (th === 'halloween') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) { const fx = ((i * 97 + t / 60) % (W + 120)) - 60, fy = 236 + (i % 3) * 12; const g = ctx.createRadialGradient(fx * s, fy * s, 0, fx * s, fy * s, 60 * s); g.addColorStop(0, 'rgba(150,110,200,.13)'); g.addColorStop(1, 'rgba(150,110,200,0)'); ctx.fillStyle = g; ctx.fillRect((fx - 60) * s, (fy - 60) * s, 120 * s, 120 * s); }
        [[2, 146], [184, 146], [214, 168], [448, 168], [236, 234]].forEach(([lx, ly], k) => { const fl = .14 + .06 * Math.sin(t / 90 + k * 2); const g = ctx.createRadialGradient((lx + 5) * s, (ly - 4) * s, 0, (lx + 5) * s, (ly - 4) * s, 22 * s); g.addColorStop(0, `rgba(255,170,60,${fl})`); g.addColorStop(1, 'rgba(255,170,60,0)'); ctx.fillStyle = g; ctx.fillRect((lx - 18) * s, (ly - 26) * s, 46 * s, 46 * s); });
        ctx.restore();
        for (let i = 0; i < 3; i++) { const p = ((t / 9000) + i / 3) % 1, x = p * (W + 40) - 20, y = 40 + i * 18 + Math.sin(t / 260 + i * 2) * 5, flap = Math.floor(t / 140 + i) % 2;
        ctx.fillStyle = '#140c10'; ctx.fillRect((x - 1) * s, y * s, 3 * s, 2 * s); ctx.fillRect((x - 6) * s, (y - (flap ? 2 : 0)) * s, 5 * s, 1.4 * s); ctx.fillRect((x + 2) * s, (y - (flap ? 2 : 0)) * s, 5 * s, 1.4 * s); } }
    }
    function cheerPair(placed, t) {
      const slot = Math.floor(t / 22000), local = t % 22000;
      if (local > 2400) return null;
      const near = [];
      for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i], c = placed[j];
        if (a.layer === c.layer && Math.abs(a.x - c.x) <= 40 && !a.layer.startsWith('stand')) near.push([a, c]);
      }
      return near.length ? near[slot % near.length] : null;
    }
    // 바와 스크린 사이 벽: 외부간판 같은 '- notsun -' + 위에서 내려오는 작은 조명
    function wallSign(ctx, s, t) {
      const cx = 238 * s, ty = 86 * s, lampY = 60 * s, breathe = 0.92 + Math.sin(t / 2600) * 0.08;
      ctx.save();
      // 빛 번짐 (원뿔 + 벽 반사)
      ctx.globalCompositeOperation = 'lighter';
      const cone = ctx.createLinearGradient(0, lampY, 0, 104 * s);
      cone.addColorStop(0, `rgba(255,226,180,${0.2 * breathe})`); cone.addColorStop(1, 'rgba(255,226,180,0)');
      ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(cx - 9 * s, lampY + 3 * s); ctx.lineTo(cx + 9 * s, lampY + 3 * s); ctx.lineTo(cx + 44 * s, 104 * s); ctx.lineTo(cx - 44 * s, 104 * s); ctx.closePath(); ctx.fill();
      const wash = ctx.createRadialGradient(cx, ty - 4 * s, 0, cx, ty - 4 * s, 46 * s);
      wash.addColorStop(0, `rgba(255,200,150,${0.16 * breathe})`); wash.addColorStop(1, 'rgba(255,200,150,0)');
      ctx.fillStyle = wash; ctx.fillRect(cx - 50 * s, ty - 50 * s, 100 * s, 100 * s);
      ctx.restore(); ctx.save();
      // 조명 기구 (벽에 붙은 갤러리 조명)
      ctx.fillStyle = '#1a1214'; ctx.fillRect(cx - 1 * s, lampY - 8 * s, 2 * s, 8 * s);
      ctx.fillStyle = '#2b2224'; ctx.beginPath(); ctx.moveTo(cx - 10 * s, lampY); ctx.lineTo(cx + 10 * s, lampY); ctx.lineTo(cx + 8 * s, lampY + 3 * s); ctx.lineTo(cx - 8 * s, lampY + 3 * s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(255,236,200,${0.9 * breathe})`; ctx.fillRect(cx - 7.5 * s, lampY + 2.6 * s, 15 * s, 0.9 * s);
      // 글자: 얇은 입체 채널 글자처럼 그림자 + 위쪽이 더 밝게
      const text = '- notsun -', size = 11 * s, gap = 2.2 * s;
      ctx.font = `300 ${size}px "Helvetica Neue", "Segoe UI Light", Arial, sans-serif`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      const ws = [...text].map(c => ctx.measureText(c).width), total = ws.reduce((a, b) => a + b, 0) + gap * (text.length - 1);
      const grad = ctx.createLinearGradient(0, ty - size, 0, ty);
      grad.addColorStop(0, '#fff6e8'); grad.addColorStop(1, '#d9c3a8');
      let x = cx - total / 2;
      [...text].forEach((c, i) => {
        ctx.shadowColor = 'rgba(20,6,8,.75)'; ctx.shadowBlur = 3 * s; ctx.shadowOffsetY = 2.2 * s; ctx.shadowOffsetX = 0;
        ctx.fillStyle = grad; ctx.fillText(c, x, ty); x += ws[i] + gap; });
      ctx.restore();
    }
    function render(ctx, cw, ch, guests, t, opts) {
      const owners = opts.owners || DEFAULT_OWNERS;
      const th = opts.theme || 'default';
      room();
      decorWall(th, t);
      if ((opts.bdays || []).length) { balloon(463, 40, '#ff6aa8', t, 1); balloon(470, 52, '#ffd23a', t, 2); balloon(464, 64, '#4ad0e0', t, 3); }
      const placed = placeGuests(guests, opts.seats).map(({ g, slot }, i) => ({ g, ...slot, i }));
      placed.forEach(p => { const id = p.g.id; if (!id) return; const was = lastSeat.get(id); if (was && was !== p.code && seen.has(id)) seen.set(id, t); lastSeat.set(id, p.code); });
      const bob = i => (Math.sin(t / 650 + i * 1.9) > 0.7 ? -1 : 0);
      // 자연스러운 움직임: 깜빡임, 한 모금, 흔들흔들, 등장 점프, 짠!
      const ph = p => (p.ph ??= [...(p.g.nick || '')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7 + p.i * 131));
      const lk = luckyState(placed, opts.lucky);
      const cheer = cheerPair(placed, t);
      const frameOf = p => {
        const k = ph(p);
        if (cheer && (cheer[0] === p || cheer[1] === p)) return 's';
        if ((t + k * 37) % 13000 < 1300) return 's';
        if ((t + k * 53) % 4300 < 140) return 'b';
        return 'n';
      };
      const swayX = p => (p.layer === 'standFront' || p.layer === 'standBack' || p.layer === 'nLeft') ? Math.round(Math.sin(t / 1800 + ph(p)) * 2.4) : 0;
      const enterY = p => { const id = p.g.id || p.g.nick + p.g.ms; if (!seen.has(id)) seen.set(id, t < 1500 ? -1e9 : t); const e = (t - seen.get(id)) / 900;
        if (e >= 1) return 0; p.entering = e; return -Math.round(Math.abs(Math.cos(e * Math.PI * 1.5)) * (1 - e) * 26); };
      const bdaySet = new Set(opts.bdays || []);
      const draw = p => blit(sprite(p.g, !!p.sit, p.g.drink, frameOf(p), p.g.id && bdaySet.has(p.g.id) ? 'party' : costumeFor(th, p.g.nick)), p.x + swayX(p), p.foot + bob(p.i) + enterY(p) + luckyHop(p, lk, t));
      owners.forEach((o, i) => {
        const shaking = (t + i * 7000) % 16000 < 2200, wobble = shaking ? (Math.floor(t / 90) % 2) : 0;
        const fr = shaking ? 'k' : ((t + i * 2100) % 5200 < 140 ? 'b' : 'n');
        const ox = OWNER_X[i] + Math.round(Math.sin(t / 3200 + i * 2) * 6);
        owners[i]._x = ox;
        blit(sprite(o, false, '', fr, (OWNER_COSTUMES[th] || [])[i] || ''), ox, 160 + bob(i + 20) - wobble);
      });
      barFront();
      const lay = (...ls) => placed.filter(p => ls.includes(p.layer)).sort((p, q) => p.foot - q.foot).forEach(draw);
      lay('standBack'); lay('gBack');
      tableBack();
      lay('gIn', 'nIn');
      tableFront();
      SLOTS.stool.forEach(s => stool(s.x));
      lay('stool');
      tNow = t; decorFront(th);
      lay('nLeft', 'nFront', 'standFront');
      ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, cw, ch); ctx.drawImage(buf, 0, 0, cw, ch);
      const s = cw / W;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glowsAt.forEach(([gx0, gy0]) => { const gx = gx0 * s, gy = gy0 * s, gr = 30 * s; const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr); gg.addColorStop(0, 'rgba(255,200,130,.32)'); gg.addColorStop(1, 'rgba(255,200,130,0)'); ctx.fillStyle = gg; ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2); });
      const sg = ctx.createRadialGradient(98 * s, 104 * s, 0, 98 * s, 104 * s, 120 * s); sg.addColorStop(0, 'rgba(255,140,90,.18)'); sg.addColorStop(1, 'rgba(255,140,90,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, 240 * s, 220 * s);
      ctx.restore();
      wallSign(ctx, s, t);
      particles(ctx, s, t, th);
      // 등장 반짝이 + 짠!
      placed.forEach(p => { if (p.entering === undefined) return; const e = p.entering; delete p.entering;
        const cx = (p.x) * s, cy = (p.foot - 30) * s;
        for (let k = 0; k < 6; k++) { const ang = k / 6 * Math.PI * 2 + e * 3, r = (10 + e * 18) * s;
          ctx.fillStyle = `rgba(255,230,160,${1 - e})`; const sx2 = cx + Math.cos(ang) * r, sy2 = cy + Math.sin(ang) * r;
          ctx.fillRect(sx2 - s, sy2 - 3 * s, 2 * s, 6 * s); ctx.fillRect(sx2 - 3 * s, sy2 - s, 6 * s, 2 * s); } });
      const cp = cheerPair(placed, t);
      if (cp) { const mx = (cp[0].x + cp[1].x) / 2 * s, my = (Math.min(cp[0].foot, cp[1].foot) - (cp[0].sit ? 46 : 50)) * s;
        ctx.save(); ctx.font = `${8 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 2.5 * s; ctx.strokeStyle = '#2a1618';
        const jump = Math.abs(Math.sin(t / 160)) * 2 * s; ctx.strokeText('짠!', mx, my - jump); ctx.fillStyle = '#ffd36a'; ctx.fillText('짠!', mx, my - jump); ctx.restore(); }
      // 스크린: 제목/숫자 + QR
      ctx.textAlign = 'center';
      const lx = opts.qr ? 343 : 376;
      const label = { halloween: ['HAPPY HALLOWEEN', '#ff8a1a'], christmas: ['MERRY CHRISTMAS', '#ff5a5a'], summer: ['SUMMER VACANCE', '#4ad0e0'], spring: ['SPRING NIGHT', '#ff9ac0'],
        valentine: ['HAPPY VALENTINE', '#ff6a8a'], white: ['HAPPY WHITE DAY', '#bfe6ff'], rose: ['HAPPY ROSE DAY', '#ff5a6a'], pepero: ['HAPPY PEPERO DAY', '#e8a060'] }[th];
      if (label) { ctx.fillStyle = label[1]; ctx.font = `${6 * s}px "DotGothic16", monospace`; ctx.fillText(label[0], lx * s, 47 * s); }
      ctx.fillStyle = '#f6eee6'; ctx.font = `${9 * s}px "Do Hyeon", sans-serif`; ctx.fillText(opts.screenTitle || '오늘의 낯선 손님들', lx * s, 60 * s);
      ctx.fillStyle = '#ffb27a'; ctx.font = `${30 * s}px "DotGothic16", monospace`; ctx.fillText(String(opts.count).padStart(2, '0'), lx * s, 96 * s);
      ctx.fillStyle = '#b9a59c'; ctx.font = `${5.6 * s}px "DotGothic16", monospace`; ctx.fillText(`${opts.day.replaceAll('-', '.')}  notsun`, lx * s, 114 * s);
      // 대화 아이콘 설명 (스크린 아래쪽)
      { const ly = 124, lc = 376; ctx.save(); ctx.font = `${4.3 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        const parts = [['말 걸어도 돼요', 1], ['오늘은 조용히', 2], ['표시 없음 = 상관없어요', 0]], gap = 7 * s, iw = 9 * s;
        const widths = parts.map(([tx, k]) => ctx.measureText(tx).width + (k ? iw : 0)), total = widths.reduce((a, b2) => a + b2, 0) + gap * 2;
        let x = lc * s - total / 2;
        parts.forEach(([tx, k], i) => { if (k) { ctx.save(); ctx.translate(x + 4 * s, ly * s + 2.6 * s); ctx.scale(.7, .7); talkIcon(ctx, s, 0, 0, k, 0); ctx.restore(); x += iw; }
          ctx.fillStyle = k ? '#d9c8bd' : '#9a857c'; ctx.fillText(tx, x, ly * s); x += ctx.measureText(tx).width + gap; });
        ctx.restore(); }
      if (opts.qr) {
        const q = 62 * s, qx = 392 * s, qy = 44 * s;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(qx - 2 * s, qy - 2 * s, q + 4 * s, q + 4 * s);
        ctx.imageSmoothingEnabled = false; ctx.drawImage(opts.qr, qx, qy, q, q);
        ctx.fillStyle = '#ffb27a'; ctx.font = `${6 * s}px "Do Hyeon", sans-serif`; ctx.fillText('QR 찍고 바에 앉기', qx + q / 2, 118 * s);
      }
      // 이름표
      const many = placed.length > 18;
      const vipSet = new Set(opts.vip || []), bestId = opts.best || null;
      const tag = (txt, x, y, color, badge, o = {}) => {
        ctx.font = `${(many ? 5 : 5.8) * s}px "Do Hyeon", sans-serif`; const tw = ctx.measureText(txt).width;
        const lx0 = x * s - tw / 2 - 4 * s, w0 = tw + 8 * s, y0 = y * s - 6.5 * s, h0 = 9 * s;
        ctx.fillStyle = o.vip ? 'rgba(40,26,8,.88)' : 'rgba(14,10,11,.72)'; ctx.beginPath(); ctx.roundRect(lx0, y0, w0, h0, 4.5 * s); ctx.fill();
        if (o.ring) { ctx.strokeStyle = o.ring; ctx.lineWidth = (o.vip ? 1.3 : 0.9) * s; ctx.stroke(); }
        ctx.fillStyle = o.tcolor || color; ctx.textBaseline = 'alphabetic'; ctx.fillText(txt, x * s, y * s);
        if (o.crown) { const cx0 = lx0 + 1 * s, cy0 = y0 - 3.2 * s; ctx.fillStyle = '#ffd36a';
          ctx.beginPath(); ctx.moveTo(cx0, cy0 + 4 * s); ctx.lineTo(cx0, cy0 + 1 * s); ctx.lineTo(cx0 + 1.6 * s, cy0 + 2.6 * s); ctx.lineTo(cx0 + 2.8 * s, cy0); ctx.lineTo(cx0 + 4 * s, cy0 + 2.6 * s); ctx.lineTo(cx0 + 5.6 * s, cy0 + 1 * s); ctx.lineTo(cx0 + 5.6 * s, cy0 + 4 * s); ctx.closePath(); ctx.fill(); }
        if (o.trophy) { const tx0 = lx0 + w0 - 1.5 * s, ty0 = y0 - 3.5 * s; ctx.fillStyle = '#ffcf4a';
          ctx.fillRect(tx0, ty0, 5 * s, 3 * s); ctx.fillRect(tx0 + 2 * s, ty0 + 3 * s, 1 * s, 1.5 * s); ctx.fillRect(tx0 + 1 * s, ty0 + 4.3 * s, 3 * s, 1 * s);
          ctx.fillRect(tx0 - 1 * s, ty0 + .5 * s, 1 * s, 1.5 * s); ctx.fillRect(tx0 + 5 * s, ty0 + .5 * s, 1 * s, 1.5 * s); }
        if (o.hearts > 0) { const hs = 1.05 * s, hx = lx0 + w0 - 5 * hs, hy = y0 - 4.6 * hs; ctx.fillStyle = '#ff6fa0';
          [[1,0],[2,0],[4,0],[5,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[1,3],[2,3],[3,3],[4,3],[5,3],[2,4],[3,4],[4,4],[3,5]].forEach(([a, b2]) => ctx.fillRect(hx + a * hs, hy + b2 * hs, hs, hs));
          if (o.hearts > 1) { ctx.font = `${4.4 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'left'; ctx.fillStyle = '#ffb3cc'; ctx.fillText(String(o.hearts), hx + 7.6 * hs, hy + 5 * hs); ctx.textAlign = 'center'; } }
        const sub = badge || [o.vip ? 'VIP' : '', o.last && !many ? o.last : ''].filter(Boolean).join(' · ');
        if (o.tier && o.tier.k === 'regular') { const tw2 = Math.sin(performance.now() / 300) > 0.3; if (tw2) { ctx.fillStyle = '#fff6c0'; const sx3 = lx0 + w0 - 2 * s, sy3 = y0 - .5 * s; ctx.fillRect(sx3, sy3 - 1.5 * s, .8 * s, 3.8 * s); ctx.fillRect(sx3 - 1.5 * s, sy3, 3.8 * s, .8 * s); } }
        if (sub) { ctx.font = `${4.4 * s}px "Do Hyeon", sans-serif`; ctx.fillStyle = o.vip ? '#ffd36a' : '#ffc9a0'; ctx.fillText(sub, x * s, (y + 6.5) * s); }
      };
      owners.forEach((o, i) => tag(o.nick, o._x ?? OWNER_X[i], 111, '#ffe2c8'));
      // 이름표: 캐릭터 가슴 높이 (40명이 앉아도 덜 겹치게, 줄마다 살짝 엇갈림)
      placed.forEach((p, k) => { if (p.layer === 'standBack' && many) return;
        const top = p.foot - (p.sit ? 41 : 45);
        const tr = null, vip = !!(p.g.id && vipSet.has(p.g.id));   // 단골 표시는 남에게 보이지 않게 뺌
        const stag = p.layer === 'stool' ? ((+String(p.code).slice(1) || 0) % 2 === 0 ? 10 : 0) : (many ? (k % 2) * 4 : 0);
        tag(p.g.nick, p.x, top + (p.sit ? 30 : 31) + stag, '#f6eee6', !many && p.g.demo ? '예시' : '',
          { tier: tr, ring: vip ? '#ffd36a' : tr && tr.ring, tcolor: vip ? '#ffe9a8' : tr && tr.color, crown: tr && tr.k !== 'silver', vip, trophy: !!(bestId && p.g.id === bestId), talk: p.g.talk, hearts: p.g.noheart ? 0 : (p.g.hearts | 0), last: typeof p.g.last === 'string' && !p.g.nolast ? p.g.last : '' }); });
      if (opts.footer) { ctx.fillStyle = 'rgba(185,165,156,.75)'; ctx.font = `${5 * s}px "Do Hyeon", sans-serif`; ctx.fillText(opts.footer, 100 * s, 262 * s); }
      // 말풍선 우선순위: 사장 실시간 메시지 > 방금 온 손님 > 돌아가며
      const headY = p => p.foot - (p.sit ? 41 : 45) + bob(p.i) - (COSTUMES[th] ? 4 : 0);
      // 대화 아이콘: 머리 위 (💬 말 걸어도 돼요 / 🌙 오늘은 조용히)
      const cheering = new Set((opts.cheers || []).filter(c => Date.now() - c.ms < 5200).map(c => c.to));  // 건배 받는 동안은 그 손님 말풍선 쉬기
      const talkers = placed.filter(p => p.g.msg && !cheering.has(p.g.id));
      const tick = Math.floor(t / 4500);
      let pick = null;
      const live = opts.live;
      const od = opts.order, odOn = od && Date.now() - od.ms < 9000;
      if (od && od.ms && sfxOrderKey !== od.ms) { sfxOrderKey = od.ms; if (odOn) sfxDing(); }
      if (live && live.msg && Date.now() - live.ms < 15000) { const oi = live.who === 1 ? 1 : 0; pick = { key: 'live' + live.ms, x: owners[oi]._x ?? OWNER_X[oi], y: 103, text: live.msg, kind: 'live' }; }
      else if (odOn) { const op = od.gid && placed.find(p => p.g.id === od.gid);
        pick = op ? { key: 'od' + od.ms, x: op.x, y: headY(op), text: '주문 들어갔어요!', kind: 'order' }
                  : { key: 'od' + od.ms, x: owners[0]._x ?? OWNER_X[0], y: 103, text: `${od.nick || '손님'}님 주문 들어갔어요!`, kind: 'order' }; }
      else {
        const fresh = talkers.find(p => p.g.ms && Date.now() - p.g.ms < 8000 && !p.g.demo);
        const bestP = bestId ? talkers.find(p => p.g.id === bestId) : null;
        if (fresh) pick = { key: 'g' + fresh.g.ms, x: fresh.x, y: headY(fresh), text: fresh.g.msg, kind: 'guest' };
        else if (tick % 4 === 2 && placed.some(p => p.g.last && !p.g.nolast)) { const ds = placed.filter(p => p.g.last && !p.g.nolast), dp = ds[Math.floor(tick / 4) % ds.length]; pick = { key: 'd' + tick, x: dp.x, y: headY(dp), text: `${dp.g.last} 마시는 중`, kind: 'drink' }; }
        else if (bestP && tick % 4 === 1) pick = { key: 'b' + tick, x: bestP.x, y: headY(bestP), text: bestP.g.msg, kind: 'best' };
        else if (talkers.length && tick % 4 !== 3) { const p = talkers[tick % talkers.length]; pick = { key: 't' + tick, x: p.x, y: headY(p), text: p.g.msg, kind: 'guest' }; }
        else { const oi = Math.floor(tick / 4) % 2, o = owners[oi], lines = (o.lines || []).filter(Boolean).concat(opts.rec ? [`오늘의 추천은 ${opts.rec}! 한 잔 어때요?`] : []).concat(opts.q ? [`오늘의 질문: ${opts.q}`] : []); if (lines.length) pick = { key: 'o' + tick, x: o._x ?? OWNER_X[oi], y: 103, text: lines[Math.floor(tick / 8) % lines.length], kind: 'owner' }; }
      }
      // 대화 아이콘: 기본은 머리 위. 말풍선과 겹치면 비켜서 그림
      { let br = null;
        if (pick) { ctx.save(); ctx.font = `${7 * s}px "Do Hyeon", sans-serif`; const bw = (ctx.measureText(pick.text).width + 12 * s + (pick.kind === 'live' ? 9 * s : 0)) / s + 10; ctx.restore();
          const bx = Math.max(4, Math.min(W - bw - 4, pick.x - bw / 2)), extra = pick.kind === 'order' || pick.kind === 'best' ? 7 : 0;
          br = { x: bx, y: pick.y - 22 - extra, w: bw, h: 21 + extra }; }
        var pickIcon = 0;
        placed.forEach(p => { const k = p.g.talk; if (k !== 1 && k !== 2) return;
          const hop = luckyHop(p, lk, t), hy = headY(p); let ix = p.x, iy = hy - 4 + hop;
          if (br) {
            const speaker = pick.kind !== 'live' && pick.kind !== 'owner' && Math.abs(pick.x - p.x) < .01 && Math.abs(pick.y - hy) < .01;
            const hit = ix + 6 > br.x && ix - 6 < br.x + br.w && iy + 3 > br.y && iy - 9 < br.y + br.h;
            if (speaker) { pickIcon = k; return; }                                                 // 말하는 사람: 아이콘을 말풍선 안에
            else if (hit) { ix = p.x + (p.x < br.x + br.w / 2 ? -10 : 10); iy = hy + 7 + hop; }  // 말풍선 반대쪽으로                                   // 다른 사람 말풍선에 가리면: 머리 옆으로
          }
          talkIcon(ctx, s, ix, iy, k, t + p.i * 400); }); }
      if (pick && !opts.game) { if (pick.key !== lastKey) { lastKey = pick.key; since = t; } bubble(ctx, s, pick.x, pick.y, pick.text, pick.kind, t - since, pickIcon); }
      luckyFx(ctx, s, t, lk, opts.lucky);
      gameFx(ctx, s, t, placed, opts.game, opts.gameActs || [], headY, opts.qr);
      bdayFx(ctx, s, t, placed, opts.bday, headY);
      cheerFx(ctx, s, t, placed, opts.cheers, headY);
      heartFx(ctx, s, t, placed, headY);
      const bdOn = opts.bday && Date.now() - opts.bday.ms < BD_END;
      if (opts.q && !bdOn && !opts.game) qBanner(ctx, s, t, opts.q);
    }
    // ---------- 게임 화면 ----------
    const GS = { holder: null, from: null, at: 0, tick: 0, boomKey: '', clinkSfx: new Set() };
    function banner(ctx, s, t, title, sub, col) {
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `${9 * s}px "Do Hyeon", sans-serif`; const tw = ctx.measureText(title).width; ctx.font = `${5 * s}px "Do Hyeon", sans-serif`; const sw = sub ? ctx.measureText(sub).width : 0;
      const w = Math.max(tw, sw) + 22 * s, h = (sub ? 26 : 17) * s, x = 240 * s - w / 2, y = 5 * s;
      ctx.fillStyle = 'rgba(14,9,10,.92)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 7 * s); ctx.fill();
      ctx.strokeStyle = col || '#ffb27a'; ctx.lineWidth = 1.2 * s; ctx.stroke();
      ctx.fillStyle = col || '#ffd9b8'; ctx.font = `${9 * s}px "Do Hyeon", sans-serif`; ctx.fillText(title, 240 * s, y + 9.5 * s);
      if (sub) { ctx.fillStyle = '#d9c8bd'; ctx.font = `${5 * s}px "Do Hyeon", sans-serif`; ctx.fillText(sub, 240 * s, y + 20 * s); }
      ctx.restore();
    }
    function bombIcon(ctx, s, x, y, t, hot) {
      const cx = x * s, cy = y * s, sh = hot ? Math.sin(t / 30) * 1.2 * s : 0;
      ctx.save(); ctx.translate(cx + sh, cy); ctx.scale(1.7, 1.7);
      ctx.fillStyle = '#1b1b22'; ctx.beginPath(); ctx.arc(0, 0, 5.5 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3c3c48'; ctx.beginPath(); ctx.arc(-1.8 * s, -1.8 * s, 1.6 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b5a4a'; ctx.fillRect(1.6 * s, -7.6 * s, 2 * s, 3 * s);
      const fl = (Math.sin(t / 60) + 1) / 2; ctx.fillStyle = `rgba(255,${180 + fl * 60},80,1)`; ctx.beginPath(); ctx.arc(3.2 * s, -8.6 * s, (1.4 + fl) * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff6c0'; ctx.fillRect(2.8 * s, -9 * s, .8 * s, .8 * s);
      ctx.restore();
    }
    function gameFx(ctx, s, t, placed, g, acts, headY, qr) {
      if (!g) return; const e = Date.now() - g.ms;
      // 참여 모집 중에는 QR을 반짝이게: 아직 접속 안 한 손님도 바로 찍고 참여
      if (qr && (g.phase === 'join' || (g.type === 'race' && g.phase === 'pick') || (g.type === 'bal' && g.phase === 'play'))) { const q = 62 * s, qx = 392 * s, qy = 44 * s, gl = .55 + Math.sin(t / 220) * .45;
        ctx.save(); ctx.strokeStyle = `rgba(255,211,106,${gl})`; ctx.lineWidth = 2.4 * s; ctx.strokeRect(qx - 5 * s, qy - 5 * s, q + 10 * s, q + 10 * s);
        ctx.font = `${6.4 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 2 * s; ctx.strokeStyle = '#1a0f10'; ctx.strokeText('찍고 바로 참여!', qx + q / 2 + 6 * s, qy - 9 * s); ctx.fillStyle = '#ffd36a'; ctx.fillText('찍고 바로 참여!', qx + q / 2 + 6 * s, qy - 9 * s);
        if (Math.floor(t / 450) % 2 === 0) { const bob = Math.abs(Math.sin(t / 180)) * 4 * s; ctx.font = `${17 * s}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👇', qx + 4 * s, qy - 12 * s + bob); }
        ctx.restore(); }
      const find = gid => placed.find(p => p.g.id === gid);
      if (g.type === 'bomb') {
        if (g.phase === 'join') { const n = new Set(acts.filter(a => a.kind === 'join').map(a => a.gid)).size;
          banner(ctx, s, t, '💣 폭탄 돌리기 참여자 모집!', `휴대폰에서 '참여'를 눌러주세요 · 지금 ${n}명`, '#ff8a5a');
          acts.filter(a => a.kind === 'join').forEach(a => { const p = find(a.gid); if (p) { ctx.save(); ctx.font = `${5 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffb27a'; ctx.fillText('참여!', p.x * s, (headY(p) - 6) * s); ctx.restore(); } });
        }
        if (g.phase === 'play') {
          if (GS.holder !== g.holder) { GS.from = GS.holder; GS.holder = g.holder; GS.at = Date.now(); }
          const to = find(g.holder), fr = GS.from && find(GS.from), k = Math.min(1, (Date.now() - GS.at) / 380);
          if (to) { let x = to.x, y = headY(to) - 20; if (fr && k < 1) { const fy = headY(fr) - 20; x = fr.x + (to.x - fr.x) * k; y = fy + (y - fy) * k - Math.sin(k * Math.PI) * 30; } bombIcon(ctx, s, x, y, t, true); }
          const el = (Date.now() - (g.startMs || g.ms)) / 1000, iv = Math.max(140, 700 - el * 22);
          if (Date.now() - GS.tick > iv) { GS.tick = Date.now(); sfxTick(Math.min(8, el / 3)); }
          banner(ctx, s, t, '💣 폭탄 돌리기', to ? `지금 ${to.g.nick}님 손에! 휴대폰에서 '넘기기'` : '', '#ff8a5a');
        }
        if (g.phase === 'boom') {
          if (GS.boomKey !== g.n + '') { GS.boomKey = g.n + ''; sfxBoom(); }
          const p = find(g.loser); const k = Math.min(1, e / 600);
          if (p) { const cx = p.x * s, cy = (headY(p) - 8) * s; ctx.save();
            const k2 = Math.min(1, e / 1400);
            if (e < 1400) { ctx.fillStyle = `rgba(255,255,220,${Math.max(0, .9 - e / 300)})`; ctx.fillRect(0, 0, 480 * s, 270 * s);
              ctx.fillStyle = `rgba(255,${200 - k2 * 120},60,${1 - k2})`; ctx.beginPath(); ctx.arc(cx, cy, (8 + k2 * 60) * s, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = `rgba(255,240,150,${1 - k2})`; ctx.beginPath(); ctx.arc(cx, cy, (4 + k2 * 30) * s, 0, Math.PI * 2); ctx.fill(); }
            if (e < 4000) { const sc = Math.min(1, e / 200) * (1 + Math.sin(e / 90) * .05); ctx.save(); ctx.translate(cx, cy - 26 * s); ctx.scale(sc, sc); ctx.font = `${16 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3 * s; ctx.strokeStyle = '#2a0d0a'; ctx.strokeText('펑!', 0, 0); ctx.fillStyle = '#ffdf5a'; ctx.fillText('펑!', 0, 0); ctx.restore(); }
            for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, r = (8 + k * 26) * s; ctx.fillStyle = `rgba(80,70,70,${Math.max(0, .7 - e / 3000)})`; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * .6, (3 + k * 3) * s, 0, Math.PI * 2); ctx.fill(); }
            ctx.restore(); }
          banner(ctx, s, t, `펑! ${p ? p.g.nick : ''}님 당첨!`, g.mission ? `미션: ${g.mission}` : '', '#ff5a4a');
        }
      }
      if (g.type === 'ten') {
        const rk = tenRank(acts);
        if (g.phase === 'play') {
          banner(ctx, s, t, '⏱ 10초 맞추기', `휴대폰에서 도전! 정확히 10.00초에 멈추면 우승 · 도전 ${rk.length}명`, '#7ee0c8');
          ctx.save(); ctx.font = `${5.4 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'left';
          rk.slice(0, 5).forEach((r, i) => { const y = (40 + i * 8) * s; ctx.fillStyle = 'rgba(14,9,10,.8)'; ctx.fillRect(176 * s, y - 5.5 * s, 128 * s, 7.4 * s);
            ctx.fillStyle = i ? '#f6eee6' : '#ffd36a'; ctx.fillText(`${i + 1}. ${r.nick}`, 180 * s, y); ctx.textAlign = 'right'; ctx.fillText(`${(r.v / 1000).toFixed(2)}초`, 300 * s, y); ctx.textAlign = 'left'; });
          ctx.restore();
          acts.filter(a => a.kind === 'ten' && Date.now() - (a.ms || 0) < 3000).forEach(a => { const p = find(a.gid); if (p) { ctx.save(); ctx.font = `${6 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 2 * s; ctx.strokeStyle = '#1a1214'; const tx = `${(a.v / 1000).toFixed(2)}초!`; ctx.strokeText(tx, p.x * s, (headY(p) - 14) * s); ctx.fillStyle = '#7ee0c8'; ctx.fillText(tx, p.x * s, (headY(p) - 14) * s); ctx.restore(); } });
        }
        if (g.phase === 'result') { const w = (g.ranks || [])[0];
          banner(ctx, s, t, w ? `🏆 우승 ${w.nick}님 · ${(w.v / 1000).toFixed(2)}초` : '도전한 사람이 없어요', w && g.reward ? `상품: ${g.reward}` : '', '#ffd36a');
          const p = w && find(w.gid); if (p) { const j = Math.abs(Math.sin(t / 200)) * 2; ctx.save(); ctx.fillStyle = '#ffcf4a'; const x = p.x * s, y = (headY(p) - 16 - j) * s;
            ctx.fillRect(x - 4 * s, y, 8 * s, 5 * s); ctx.fillRect(x - 1 * s, y + 5 * s, 2 * s, 2.5 * s); ctx.fillRect(x - 3 * s, y + 7.5 * s, 6 * s, 1.5 * s); ctx.fillRect(x - 6 * s, y + 1 * s, 2 * s, 2.5 * s); ctx.fillRect(x + 4 * s, y + 1 * s, 2 * s, 2.5 * s); ctx.restore(); }
        }
      }
      if (g.type === 'toast') {
        const left = 3 - Math.floor(e / 1000), cl = new Set(acts.filter(a => a.kind === 'clink').map(a => a.gid));
        if (e < 3000) { banner(ctx, s, t, `🥂 다 같이 건배! ${left}`, '휴대폰에서 짠 버튼을 눌러주세요', '#ffd36a'); if (GS.tick !== left) { GS.tick = left; tone(880, .12, .06, 'sine'); } }
        else { banner(ctx, s, t, `짠! 오늘 ${cl.size}명이 같이 건배`, '혼자 와도, 혼자 아니게', '#ffd36a'); if (GS.tick !== -1) { GS.tick = -1; sfxClink(); } }
        placed.forEach(p => { if (!cl.has(p.g.id)) return; const hy = headY(p) - 20 - (e > 3000 ? Math.abs(Math.sin(t / 180)) * 2 : 0); ctx.save(); const x = p.x * s, y = hy * s; ctx.translate(x, y); ctx.scale(1.6, 1.6); ctx.translate(-x, -y);
          ctx.fillStyle = '#fff4d8'; ctx.fillRect(x - 2.4 * s, y - 4.6 * s, 4.8 * s, 6 * s); ctx.fillStyle = '#ffc24a'; ctx.fillRect(x - 1.8 * s, y - 2.4 * s, 3.6 * s, 3.4 * s); ctx.fillStyle = '#fff'; ctx.fillRect(x - 1.8 * s, y - 4 * s, 3.6 * s, 1.2 * s); ctx.restore();
          if (!GS.clinkSfx.has(p.g.id + g.n)) { GS.clinkSfx.add(p.g.id + g.n); if (e > 3000) tone(2093, .2, .04, 'sine'); } });
      }
      // ---------- 새 게임 6종 ----------
      const T = (str, x, y, sz, col, al, st) => { ctx.save(); ctx.font = `${sz * s}px "Do Hyeon", sans-serif`; ctx.textAlign = al || 'center'; ctx.textBaseline = 'middle';
        if (st !== false) { ctx.lineWidth = Math.max(1.5, sz * .28) * s; ctx.strokeStyle = '#1a0f10'; ctx.lineJoin = 'round'; ctx.strokeText(str, x * s, y * s); } ctx.fillStyle = col; ctx.fillText(str, x * s, y * s); ctx.restore(); };
      const box = (x, y, w, h, col, fill) => { ctx.save(); ctx.fillStyle = fill || 'rgba(14,9,10,.9)'; ctx.beginPath(); ctx.roundRect(x * s, y * s, w * s, h * s, 6 * s); ctx.fill(); if (col) { ctx.strokeStyle = col; ctx.lineWidth = 1.2 * s; ctx.stroke(); } ctx.restore(); };
      const left = () => Math.max(0, Math.ceil((g.dur || 0) - e / 1000));
      const joinBanner = (title, col) => { const n = new Set(acts.filter(a => a.kind === 'join').map(a => a.gid)).size;
        banner(ctx, s, t, title, `휴대폰에서 '참여'를 눌러주세요 · 지금 ${n}명 · ${left()}초`, col);
        acts.filter(a => a.kind === 'join').forEach(a => { const p = find(a.gid); if (p) T('참여!', p.x, headY(p) - 6, 5, col); }); };
      const overHead = (gid, str, col, sz) => { const p = find(gid); if (p) T(str, p.x, headY(p) - 8, sz || 6, col); };
      const wrap = (str, max) => { const out = []; let line = ''; for (const ch of String(str)) { if ((line + ch).length > max && ch !== ' ') { out.push(line); line = ch; } else line += ch; } if (line) out.push(line); return out.map(l => l.trim()); };
      if (g.type === 'bal') {
        const votes = {}; acts.filter(a => a.kind === 'vote' && a.gid).forEach(a => { if (!(a.gid in votes)) votes[a.gid] = a.v; });
        const n = Object.keys(votes).length, na = Object.values(votes).filter(v => v === 0).length, nb = n - na, res = g.phase === 'result';
        banner(ctx, s, t, '⚖️ 밸런스 게임', res ? (n ? (na === nb ? '딱 반반! 서로 이야기해 보세요' : '여러분의 선택은?') : '아무도 고르지 않았어요') : `휴대폰에서 골라주세요 · ${n}명 참여 · ${left()}초`, '#ffb3cc');
        const draw = (x, txt, col, cnt, pct, win) => { box(x, 40, 146, 80, col, 'rgba(14,9,10,.95)'); const ls = wrap(txt, 9);
          ls.slice(0, 2).forEach((l, i) => T(l, x + 73, (res ? 60 : 72) + (i - (Math.min(2, ls.length) - 1) / 2) * 11, 10, '#fff4ea'));
          if (res) { ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = .25; ctx.fillRect((x + 10) * s, 84 * s, 126 * s, 9 * s); ctx.globalAlpha = .9; const k = Math.min(1, e / 900) * pct; ctx.fillRect((x + 10) * s, 84 * s, 126 * k * s, 9 * s); ctx.restore();
            T(`${Math.round(pct * 100)}% · ${cnt}명`, x + 73, 106, 8, col); if (win) T('소수 정예!', x + 73, 34, 7.5, '#ffd36a'); } };
        draw(87, g.a || 'A', '#ff8a8a', na, n ? na / n : 0, res && n > 1 && na < nb && na > 0);
        draw(247, g.b || 'B', '#7ab8ff', nb, n ? nb / n : 0, res && n > 1 && nb < na && nb > 0);
        T('VS', 240, 80, 12, '#ffd36a');
        if (!res) Object.keys(votes).forEach(gid => overHead(gid, '✔', '#7ee08a', 6));
      }
      if (g.type === 'nun') {
        if (g.phase === 'join') joinBanner('🙊 눈치게임 참여자 모집!', '#ffd36a');
        else { const calls = g.calls || [], last = calls[calls.length - 1];
          if (g.phase === 'play') { banner(ctx, s, t, `🙊 눈치게임 · ${(g.players || []).length}명`, '눈치껏 휴대폰에서 숫자 외치기! 동시에 외치면 탈락 · 끝까지 못 외쳐도 탈락', '#ffd36a');
            if (last) { const k = Math.min(1, e / 180); box(196, 44, 88, 64, '#ffd36a', 'rgba(14,9,10,.92)'); T(`${last.num}!`, 240, 72, 26 + (1 - k) * 14, '#ffd36a'); T(`${last.nick}`, 240, 99, 7, '#f6eee6'); }
            else { box(196, 44, 88, 64, '#ffd36a', 'rgba(14,9,10,.92)'); T('1부터!', 240, 76, 16, '#ffd36a'); } }
          calls.forEach(c => overHead(c.gid, `${c.num}!`, '#ffd36a', 7));
          if (g.phase === 'result') { const ls = g.losers || [];
            banner(ctx, s, t, ls.length ? `🙊 ${ls.map(l => l.nick).join(', ')}님 탈락!` : '🙊 눈치게임 끝!', g.reason || '', '#ff8a5a');
            if (e < 2500 && g.reason && g.reason.includes('동시')) { const k = Math.min(1, e / 300); T('동시!', 240, 74, 20 * (0.6 + k * 0.4), '#ff5a4a'); }
            ls.forEach(l => overHead(l.gid, '✖', '#ff5a4a', 10)); } }
      }
      if (g.type === 'rou') {
        if (g.phase === 'join') joinBanner('🎡 행운의 룰렛 참여자 모집!', '#ffd36a');
        else { const ps = g.players || [], N2 = Math.max(1, ps.length), wi = Math.max(0, ps.findIndex(p => p.gid === g.winner)), seg = Math.PI * 2 / N2;
          const fin = Math.PI * 2 * 6 + (-Math.PI / 2 - (wi + .5) * seg), dur = 6000, k = g.phase === 'spin' ? Math.min(1, e / dur) : 1, ease = 1 - Math.pow(1 - k, 3), ang = fin * ease;
          const cx = 240 * s, cy = 102 * s, r = 58 * s, cols = ['#c0504d', '#e0a040', '#4f81bd', '#9bbb59', '#8064a2', '#4bacc6', '#f79646', '#d06090'];
          ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.arc(cx + 2 * s, cy + 3 * s, r + 4 * s, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#2a1a14'; ctx.beginPath(); ctx.arc(cx, cy, r + 4 * s, 0, Math.PI * 2); ctx.fill();
          ps.forEach((p, i) => { const a0 = ang + i * seg; ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a0 + seg); ctx.closePath(); ctx.fill();
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(a0 + seg / 2); ctx.font = `${Math.min(7, 40 / N2 + 3.5) * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(p.nick, r - 5 * s, 0); ctx.restore(); });
          for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + t / 300; ctx.fillStyle = (i + Math.floor(t / 200)) % 2 ? '#fff6c0' : '#ffb24a'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * (r + 2 * s), cy + Math.sin(a) * (r + 2 * s), 1.4 * s, 0, Math.PI * 2); ctx.fill(); }
          ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.arc(cx, cy, 6 * s, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff4ea'; ctx.beginPath(); ctx.moveTo(cx - 5 * s, cy - r - 8 * s); ctx.lineTo(cx + 5 * s, cy - r - 8 * s); ctx.lineTo(cx, cy - r + 3 * s); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#1a0f10'; ctx.lineWidth = .8 * s; ctx.stroke();
          ctx.restore();
          if (g.phase === 'spin') { banner(ctx, s, t, '🎡 행운의 룰렛', `${ps.length}명 중 한 명! 두구두구…`, '#ffd36a'); if (k < 1 && Date.now() - GS.tick > 60 + 400 * k * k) { GS.tick = Date.now(); tone(1200, .03, .03, 'square'); } }
          else { banner(ctx, s, t, `🎉 ${g.winnerNick || ''}님 당첨!`, g.reward ? `상품: ${g.reward}` : '축하해요!', '#ffd36a'); if (GS.boomKey !== 'r' + g.n) { GS.boomKey = 'r' + g.n; sfxClink(); }
            const p = find(g.winner); if (p) { const j = Math.abs(Math.sin(t / 200)) * 2; T('🎉', p.x, headY(p) - 12 - j, 9, '#ffd36a', 'center', false); } } }
      }
      if (g.type === 'race') {
        const H5 = RACE_HORSES, picks = {}; acts.filter(a => a.kind === 'horse' && a.gid).forEach(a => { if (!(a.gid in picks)) picks[a.gid] = a.v; });
        const cnt = H5.map((_, i) => Object.values(picks).filter(v => v === i).length);
        const X0 = 52, X1 = 424, Y0 = 136, LH = 17;
        box(30, Y0 - 12, 420, LH * 5 + 18, '#ffb27a', 'rgba(20,40,24,.92)');
        ctx.save(); for (let i = 0; i <= 5; i++) { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(34 * s, (Y0 - 4 + i * LH) * s, 412 * s, .6 * s); }
        for (let y = 0; y < LH * 5; y += 3) { ctx.fillStyle = (y / 3) % 2 ? '#fff' : '#111'; ctx.fillRect((X1 + 8) * s, (Y0 - 4 + y) * s, 3 * s, 3 * s); ctx.fillStyle = (y / 3) % 2 ? '#111' : '#fff'; ctx.fillRect((X1 + 11) * s, (Y0 - 4 + y) * s, 3 * s, 3 * s); }
        ctx.restore();
        const order = g.order || [0, 1, 2, 3, 4], rankOf = i => order.indexOf(i), tt = g.phase === 'run' ? e / 1000 - 2.2 : g.phase === 'result' ? 99 : -1;
        const prog = i => { if (tt <= 0) return 0; const f = 8.2 + rankOf(i) * .45, u = Math.min(1, tt / f), sd = (g.seed || 7) * (i + 3);
          return Math.min(1, Math.max(0, u + .13 * Math.sin(tt * (1.1 + (sd % 5) * .17) + sd) * u * (1 - u) * 4 * (u < 1 ? 1 : 0))); };
        H5.forEach((h, i) => { const y = Y0 + i * LH + 5, x = X0 + (X1 - X0) * prog(i), run = tt > 0 && prog(i) < 1, lg = run ? Math.floor(t / 90) % 2 : 0; ctx.save();
          ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect((x - 9) * s, (y + 5) * s, 18 * s, 2 * s);
          ctx.fillStyle = h.c; ctx.fillRect((x - 8) * s, (y - 4) * s, 13 * s, 6 * s); ctx.fillRect((x + 3) * s, (y - 8) * s, 4 * s, 6 * s); ctx.fillRect((x + 5) * s, (y - 9) * s, 5 * s, 3.5 * s);
          ctx.fillStyle = '#1a0f10'; ctx.fillRect((x + 8) * s, (y - 8.4) * s, 1 * s, 1 * s); ctx.fillRect((x - 9) * s, (y - 4) * s, 2 * s, 4 * s);
          ctx.fillStyle = h.c; [[-7, lg], [-4, 1 - lg], [1, lg], [3.5, 1 - lg]].forEach(([dx, o]) => ctx.fillRect((x + dx + o) * s, (y + 2) * s, 1.4 * s, 4 * s));
          ctx.fillStyle = '#fff4ea'; ctx.fillRect((x - 5) * s, (y - 3) * s, 6 * s, 4 * s); ctx.restore();
          T(String(i + 1), x - 2, y - 1, 4.4, '#1a0f10', 'center', false);
          T(`${i + 1}. ${h.n}`, 36, y - 1, 5, '#fff4ea', 'left');
          if (g.phase === 'pick') T(`${cnt[i]}명`, X1 - 4, y - 1, 5, '#ffd36a', 'right'); });
        if (g.phase === 'pick') banner(ctx, s, t, '🏇 픽셀 경마', `휴대폰에서 우승마를 골라주세요 · ${left()}초`, '#7ee08a');
        if (g.phase === 'run') { if (tt < 0) { const c = Math.ceil(-tt); T(tt > -0.6 ? '출발!' : String(Math.min(3, c)), 240, 80, 22, '#ffd36a'); if (GS.tick !== c) { GS.tick = c; tone(tt > -0.6 ? 1320 : 880, .15, .06, 'square'); } }
          const lead = H5.map((_, i) => i).sort((a, b) => prog(b) - prog(a))[0]; banner(ctx, s, t, '🏇 달려라!', tt > 0 ? `선두: ${lead + 1}번 ${H5[lead].n}` : '곧 출발해요', '#7ee08a'); }
        if (g.phase === 'result') { const w = order[0], hit = Object.entries(picks).filter(([, v]) => v === w).length;
          banner(ctx, s, t, `🏆 ${w + 1}번 ${H5[w].n} 우승!`, `맞힌 손님 ${hit}명` + (g.luckyNick ? ` · 추첨 당첨 ${g.luckyNick}님${g.reward ? ' (' + g.reward + ')' : ''}` : ''), '#ffd36a');
          Object.entries(picks).forEach(([gid, v]) => { if (v === w) overHead(gid, '적중!', '#ffd36a', 6); }); }
      }
      if (g.type === 'rps') {
        const HN = ['가위', '바위', '보'], HE = ['✌️', '✊', '🖐️'];
        if (g.phase === 'join') joinBanner('✊ 사장님과 가위바위보 참여자 모집!', '#7ab8ff');
        else { const alive = g.alive || [];
          if (g.phase === 'pick') { const picked = new Set(acts.filter(a => a.kind === 'rps' && a.k === g.round).map(a => a.gid));
            banner(ctx, s, t, `✊ 사장님과 가위바위보 · ${g.round}라운드`, `살아남은 ${alive.length}명 · 휴대폰에서 골라주세요 · ${left()}초`, '#7ab8ff');
            box(200, 40, 80, 62, '#7ab8ff'); T('사장님', 240, 50, 6, '#b9c8e0'); T(HE[Math.floor(t / 160) % 3], 240, 76, 22, '#fff', 'center', false);
            alive.forEach(gid => overHead(gid, picked.has(gid) ? '✔' : '…', picked.has(gid) ? '#7ee08a' : '#b9a59c', 6)); }
          if (g.phase === 'reveal') { const pk = g.picks || {}, outs = new Set(g.out || []);
            banner(ctx, s, t, `사장님은 ${HN[g.hand]}!`, (g.out || []).length ? `${(g.out || []).length}명 탈락 · 남은 ${alive.length}명` : (g.redo ? '모두 져서 다시 한 판!' : '탈락자 없음!'), '#7ab8ff');
            box(200, 40, 80, 62, '#ffd36a'); T('사장님', 240, 50, 6, '#ffe9b0'); T(HE[g.hand], 240, 76, 24 * Math.min(1, .5 + e / 400), '#fff', 'center', false);
            const cnt = [0, 1, 2].map(h => Object.values(pk).filter(v => v === h).length); T(`가위 ${cnt[0]} · 바위 ${cnt[1]} · 보 ${cnt[2]}`, 240, 112, 6.5, '#f6eee6');
            Object.entries(pk).forEach(([gid, v]) => overHead(gid, HE[v], '#fff', 8)); [...outs].forEach(gid => { const p = find(gid); if (p) T('✖', p.x + 7, headY(p) - 5, 7, '#ff5a4a'); }); }
          if (g.phase === 'result') { const w = g.winners || [];
            banner(ctx, s, t, w.length ? `🏆 ${w.map(x => x.nick).join(', ')}님 생존!` : '사장님 승리! 😎', w.length && g.reward ? `상품: ${g.reward}` : '다음 판에 다시 도전해요', '#ffd36a');
            w.forEach(x => { const p = find(x.gid); if (p) { const j = Math.abs(Math.sin(t / 200)) * 2; T('🏆', p.x, headY(p) - 12 - j, 9, '#ffd36a', 'center', false); } }); } }
      }
      if (g.type === 'ox') {
        if (g.phase === 'join') joinBanner('⭕ OX 서바이벌 참여자 모집!', '#ffb27a');
        else if (g.phase === 'q' || g.phase === 'ans') { const alive = g.alive || [], q = g.q || '', ls = wrap(q, 18);
          banner(ctx, s, t, `⭕❌ OX 서바이벌 · ${g.round}번 문제`, g.phase === 'q' ? `생존 ${alive.length}명 · 휴대폰에서 O 또는 X · ${left()}초` : ((g.out || []).length ? `${(g.out || []).length}명 탈락 · 생존 ${alive.length}명` : (g.redo ? '모두 틀려서 전원 부활!' : '탈락자 없음!')), '#ffb27a');
          box(120, 38, 240, 24 + ls.length * 12, g.phase === 'ans' ? '#ffd36a' : '#ffb27a'); ls.forEach((l, i) => T(l, 240, 50 + i * 12, 9, '#fff4ea'));
          if (g.phase === 'q') { const picked = new Set(acts.filter(a => a.kind === 'ox' && a.k === g.round).map(a => a.gid)); alive.forEach(gid => overHead(gid, picked.has(gid) ? '✔' : '…', picked.has(gid) ? '#7ee08a' : '#b9a59c', 6)); }
          else { const y = 50 + ls.length * 12 + 18; T(`정답 ${g.ans === 0 ? 'O' : 'X'}`, 240, y, 16 * Math.min(1, .5 + e / 400), g.ans === 0 ? '#7ee08a' : '#ff6a5a');
            if (g.why) T(g.why, 240, y + 15, 5.6, '#e0d0c6');
            Object.entries(g.picks || {}).forEach(([gid, v]) => overHead(gid, v === 0 ? 'O' : 'X', v === g.ans ? '#7ee08a' : '#ff6a5a', 9)); } }
        else if (g.phase === 'result') { const w = g.winners || [];
          banner(ctx, s, t, w.length ? `🏆 최후의 생존자 ${w.map(x => x.nick).join(', ')}님!` : 'OX 서바이벌 끝!', w.length && g.reward ? `상품: ${g.reward}` : '', '#ffd36a');
          w.forEach(x => { const p = find(x.gid); if (p) { const j = Math.abs(Math.sin(t / 200)) * 2; T('🏆', p.x, headY(p) - 12 - j, 9, '#ffd36a', 'center', false); } }); }
      }
    }
    // 오늘의 질문 (스크린 위쪽 띠)
    function qBanner(ctx, s, t, q) {
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `${7 * s}px "Do Hyeon", sans-serif`; const txt = 'Q. ' + q, tw = ctx.measureText(txt).width;
      ctx.font = `${4.4 * s}px "Do Hyeon", sans-serif`; const sub = '휴대폰에서 한 줄로 답해주세요', sw = ctx.measureText(sub).width;
      const w = Math.max(tw, sw) + 18 * s, h = 20 * s, x = 240 * s - w / 2, y = 6 * s, glow = 0.5 + Math.sin(t / 600) * 0.2;
      ctx.fillStyle = 'rgba(14,9,10,.88)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 6 * s); ctx.fill();
      ctx.strokeStyle = `rgba(255,178,122,${glow})`; ctx.lineWidth = 1 * s; ctx.stroke();
      ctx.fillStyle = '#ffe2c4'; ctx.font = `${7 * s}px "Do Hyeon", sans-serif`; ctx.fillText(txt, 240 * s, y + 8 * s);
      ctx.fillStyle = '#b9a59c'; ctx.font = `${4.4 * s}px "Do Hyeon", sans-serif`; ctx.fillText(sub, 240 * s, y + 15.5 * s);
      ctx.restore();
    }
    // 익명 건배: 받은 손님 머리 위로 잔 두 개가 '짠' (5초)
    const cheerSfx = new Set();
    // 하트를 받으면 머리 위로 하트가 떠오름 (개수가 늘어난 순간만, 보낸 사람은 표시 안 함)
    const heartSeen = new Map(), heartFloats = [];
    function heartFx(ctx, s, t, placed, headY) {
      const now = Date.now();
      placed.forEach(p => { const id = p.g.id; if (!id) return; const n = p.g.noheart ? 0 : (p.g.hearts | 0);
        if (heartSeen.has(id) && n > heartSeen.get(id)) { heartFloats.push({ to: id, ms: now }); setTimeout(sfxHeart, 200); }
        heartSeen.set(id, n); });
      for (let i = heartFloats.length - 1; i >= 0; i--) { const h = heartFloats[i], e = now - h.ms; if (e > 3600) { heartFloats.splice(i, 1); continue; }
        const p = placed.find(q => q.g.id === h.to); if (!p) continue;
        const k = e / 3600, fade = e > 2800 ? (3600 - e) / 800 : 1, pop = Math.min(1, e / 260), sz = (1.6 + pop * .9) * s;
        const cx = p.x * s, cy = (headY(p) - 12 - k * 22) * s;
        ctx.save(); ctx.globalAlpha = Math.max(0, fade);
        const H = [[1,0],[2,0],[4,0],[5,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[1,3],[2,3],[3,3],[4,3],[5,3],[2,4],[3,4],[4,4],[3,5]];
        ctx.fillStyle = '#7a1e3c'; H.forEach(([a, b]) => ctx.fillRect(cx + (a - 3.5) * sz + .6 * s, cy + (b - 3) * sz + .6 * s, sz, sz));
        ctx.fillStyle = '#ff5c93'; H.forEach(([a, b]) => ctx.fillRect(cx + (a - 3.5) * sz, cy + (b - 3) * sz, sz, sz));
        ctx.fillStyle = '#ffd0e0'; ctx.fillRect(cx - 2.5 * sz, cy - 2 * sz, sz, sz);
        for (let j = 0; j < 3; j++) { const a2 = t / 500 + j * 2.1, r = (8 + k * 6) * s; ctx.fillStyle = '#ffb3cc'; ctx.fillRect(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r * .6, 1.2 * s, 1.2 * s); }
        ctx.font = `${5.6 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 2 * s; ctx.strokeStyle = '#2a1618';
        const msg = '누군가 하트를 보냈어요', mw = ctx.measureText(msg).width, tx = Math.max(mw / 2 + 4 * s, Math.min(480 * s - mw / 2 - 4 * s, cx));
        ctx.strokeText(msg, tx, cy - 7 * sz); ctx.fillStyle = '#ffb3cc'; ctx.fillText(msg, tx, cy - 7 * sz);
        ctx.restore(); }
    }
    function cheerFx(ctx, s, t, placed, list, headY) {
      (list || []).forEach(c => { const e = Date.now() - c.ms; if (e < 0 || e > 5000) return; const p = placed.find(q => q.g.id === c.to); if (!p) return;
        if (!cheerSfx.has(c.id)) { cheerSfx.add(c.id); setTimeout(sfxClink, 350); }
        const cx = p.x * s, top = (headY(p) - 16 - Math.min(1, e / 400) * 6) * s, fade = e > 4300 ? (5000 - e) / 700 : 1;
        const meet = Math.min(1, e / 450), off = (7 - meet * 3.2) * s, tilt = meet * 0.35;
        ctx.save(); ctx.globalAlpha = Math.max(0, fade);
        const glass = (dir) => { ctx.save(); ctx.translate(cx + dir * off, top); ctx.rotate(dir * -tilt);
          ctx.fillStyle = '#fff4d8'; ctx.fillRect(-2.6 * s, -5 * s, 5.2 * s, 6.5 * s); ctx.fillStyle = '#ffc24a'; ctx.fillRect(-2 * s, -2.6 * s, 4 * s, 3.6 * s);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(-2 * s, -4.4 * s, 4 * s, 1.4 * s); ctx.fillStyle = '#fff4d8'; ctx.fillRect(2.6 * s, -3.4 * s, 1.4 * s, 3 * s); ctx.restore(); };
        glass(-1); glass(1);
        if (meet >= 1) { const k = Math.min(1, (e - 450) / 500); ctx.fillStyle = `rgba(255,236,170,${1 - k})`;
          for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, r = (3 + k * 9) * s; ctx.fillRect(cx + Math.cos(a) * r - .7 * s, top - 6 * s + Math.sin(a) * r - .7 * s, 1.4 * s, 1.4 * s); } }
        ctx.font = `${5.6 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 2 * s; ctx.strokeStyle = '#2a1618';
        const msgW = ctx.measureText('누군가 건배를 보냈어요!').width, tx = Math.max(msgW / 2 + 4 * s, Math.min(480 * s - msgW / 2 - 4 * s, cx));  // 화면 밖으로 잘리지 않게
        ctx.strokeText('누군가 건배를 보냈어요!', tx, top - 9 * s); ctx.fillStyle = '#ffd36a'; ctx.fillText('누군가 건배를 보냈어요!', tx, top - 9 * s);
        ctx.restore(); });
    }
    function talkIcon(ctx, s, x, y, kind, t) {
      const fl = Math.sin(t / 700) * 0.8, cx = x * s, cy = (y + fl) * s;
      ctx.save();
      if (kind === 1) {
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.roundRect(cx - 4.5 * s, cy - 6 * s, 10 * s, 6.5 * s, 2.6 * s); ctx.fill();
        ctx.fillStyle = '#7ee08a'; ctx.strokeStyle = '#1b3a20'; ctx.lineWidth = .7 * s;
        ctx.beginPath(); ctx.roundRect(cx - 5 * s, cy - 7 * s, 10 * s, 6.5 * s, 2.6 * s); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - 2.5 * s, cy - 1 * s); ctx.lineTo(cx - 3.2 * s, cy + 1.8 * s); ctx.lineTo(cx - .2 * s, cy - 1 * s); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#1b3a20'; for (let d = -1; d <= 1; d++) ctx.fillRect(cx + (d * 2.4 - .6) * s, cy - 4.4 * s, 1.2 * s, 1.2 * s);
      } else {
        ctx.fillStyle = 'rgba(30,22,40,.85)'; ctx.beginPath(); ctx.arc(cx, cy - 3.6 * s, 4.6 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffe7a0'; ctx.beginPath(); ctx.arc(cx - .4 * s, cy - 3.6 * s, 3.2 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(30,22,40,1)'; ctx.beginPath(); ctx.arc(cx + 1.2 * s, cy - 4.6 * s, 2.7 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffe7a0'; ctx.fillRect(cx + 2.4 * s, cy - 7.6 * s, .8 * s, .8 * s);
      }
      ctx.restore();
    }
    // 생일 축하: 조명 + 생일 축하 노래 + 풍선·꽃가루 + 다른 손님들의 축하 말풍선 (18초)
    const BD_END = 18000, bsfx = { key: '' };
    function bdayFx(ctx, s, t, placed, bd, headY) {
      if (!bd) return; const e = Date.now() - bd.ms; if (e < 0 || e > BD_END) return;
      if (bsfx.key !== bd.id + bd.ms) { bsfx.key = bd.id + bd.ms; sfxBirthday(); }
      const me = placed.find(p => p.g.id === bd.id), fade = e > BD_END - 1500 ? (BD_END - e) / 1500 : Math.min(1, e / 400);
      ctx.save();
      if (me) { const hx = me.x * s, hy = (me.foot - (me.sit ? 22 : 24)) * s, r = 27 * s;
        ctx.fillStyle = `rgba(10,4,8,${.5 * fade})`; ctx.beginPath(); ctx.rect(0, 0, W * s, H * s); ctx.ellipse(hx, hy, r, r * 1.05, 0, 0, Math.PI * 2, true); ctx.fill('evenodd');
        ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 1.3); g.addColorStop(0, `rgba(255,190,220,${.25 * fade})`); g.addColorStop(1, 'rgba(255,190,220,0)'); ctx.fillStyle = g; ctx.fillRect(hx - r * 1.4, hy - r * 1.4, r * 2.8, r * 2.8); ctx.globalCompositeOperation = 'source-over'; }
      // 떠오르는 풍선
      for (let i = 0; i < 12; i++) { const k = ((e / 1000) * (14 + i % 5) + i * 37) % (H + 60), bx = (i * 41 + 13) % W + Math.sin(e / 700 + i) * 4, by = H + 20 - k, c = ['#ff6aa8', '#ffd23a', '#4ad0e0', '#7be06a', '#b88aff'][i % 5];
        ctx.globalAlpha = fade * .95; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(bx * s, by * s, 4.5 * s, 5.5 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect((bx - 2) * s, (by - 3) * s, 1.4 * s, 2 * s);
        ctx.strokeStyle = 'rgba(240,240,240,.6)'; ctx.lineWidth = .6 * s; ctx.beginPath(); ctx.moveTo(bx * s, (by + 5.5) * s); ctx.lineTo((bx + Math.sin(e / 300 + i)) * s, (by + 16) * s); ctx.stroke(); }
      ctx.globalAlpha = 1;
      if (e > 600 && e < 9000) confetti.forEach(c => { const fall = (e - 600) / 1000, y = (fall * 60 * c.d - 20) * s; if (y > H * s) return; const x = (c.x + Math.sin(fall * 3 + c.r) * 8) * s; ctx.globalAlpha = fade; ctx.fillStyle = c.c; ctx.save(); ctx.translate(x, y); ctx.rotate(c.r + fall * 4); ctx.fillRect(-1.6 * s, -.8 * s, 3.2 * s, 1.6 * s); ctx.restore(); });
      ctx.globalAlpha = 1;
      // 다른 손님들의 축하 말풍선
      const others = placed.filter(p => p !== me && !p.g.demo).slice(0, 3);
      others.forEach((p, k) => { const st = 2500 + k * 1600; if (e > st && e < st + 3200) bubble(ctx, s, p.x, headY(p), ['생일 축하해요!', '축하해요 🎉'.replace(' 🎉', '!'), 'Happy Birthday!'][k % 3], 'guest', e - st); });
      if (me && e > 1200 && e < 12000) bubble(ctx, s, me.x, headY(me), '고마워요!', 'best', e - 1200);
      // 배너 + 픽셀 케이크
      const txt = `HAPPY BIRTHDAY ${bd.nick}님!`; ctx.globalAlpha = fade; ctx.font = `${13 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const bw = ctx.measureText(txt).width + 46 * s, bx0 = W * s / 2 - bw / 2, by0 = 16 * s, bh = 26 * s, pulse = 1 + Math.max(0, .15 - e / 2500) + Math.sin(e / 220) * .015;
      ctx.translate(W * s / 2, by0 + bh / 2); ctx.scale(pulse, pulse); ctx.translate(-W * s / 2, -(by0 + bh / 2));
      ctx.fillStyle = 'rgba(40,10,24,.94)'; ctx.beginPath(); ctx.roundRect(bx0, by0, bw, bh, 13 * s); ctx.fill(); ctx.strokeStyle = '#ff8ac0'; ctx.lineWidth = 1.6 * s; ctx.stroke();
      const cx0 = bx0 + 9 * s, cy0 = by0 + 6 * s, q = 1.6 * s; ctx.fillStyle = '#ffe6f0'; ctx.fillRect(cx0, cy0 + 6 * q, 11 * q, 6 * q); ctx.fillStyle = '#ff6aa8'; ctx.fillRect(cx0, cy0 + 8 * q, 11 * q, 1.2 * q); ctx.fillStyle = '#ffd23a';
      [2, 5, 8].forEach((k2, i) => { ctx.fillRect(cx0 + k2 * q, cy0 + 3 * q, q, 3 * q); ctx.fillStyle = (Math.floor(e / 150 + i) % 2) ? '#ffb22a' : '#fff2a0'; ctx.fillRect(cx0 + k2 * q, cy0 + 1.5 * q, q, 1.4 * q); ctx.fillStyle = '#ffd23a'; });
      ctx.fillStyle = '#ffd36a'; ctx.fillText(txt, W * s / 2 + 10 * s, by0 + bh / 2);
      ctx.restore();
    }
    // 럭키 손님 뽑기: 천장 스포트라이트가 손님들을 빠르게 훑다가 점점 느려지며 멈춤 → 번쩍 + 꽃가루 (총 15초)
    const LK_ROLL = 5600, LK_END = 15000, sfx = { key: '', near: null, landed: false, drum: 0, ticks: 0 };
    function luckyState(placed, lucky) {
      if (!lucky) return null; const e = Date.now() - lucky.ms; if (e < 0 || e > LK_END) return null;
      const pool = placed.filter(p => !p.g.demo), n = pool.length, wi = pool.findIndex(p => p.g.id === lucky.id);
      const st = { e, rolling: e < LK_ROLL, pool, win: wi >= 0 ? pool[wi] : null, near: null, x: W / 2, y: 150 };
      if (!n || wi < 0) return st;
      const spot = p => ({ x: p.x, y: p.foot - (p.sit ? 22 : 24) });
      if (st.rolling && n > 1) {
        const pr = e / LK_ROLL, ease = 1 - (1 - pr) ** 3, S = n * 4 + wi, f = ease * S, i0 = Math.floor(f), fr = f - i0;
        const a = pool[i0 % n], b2 = pool[(i0 + 1) % n], k = fr * fr * (3 - 2 * fr);
        const pa = spot(a), pb = spot(b2); st.x = pa.x + (pb.x - pa.x) * k; st.y = pa.y + (pb.y - pa.y) * k; st.near = k < 0.5 ? a : b2;
      } else { const pw = spot(pool[wi]); st.x = pw.x; st.y = pw.y; st.near = pool[wi]; }
      return st;
    }
    function luckyHop(p, st, t) {
      if (!st || st.near !== p) return 0;
      if (st.rolling) return -2;
      const k = (st.e - LK_ROLL) / 1000; return k < 6 ? -Math.round(Math.abs(Math.sin(k * Math.PI * 2.2)) * 6 * Math.max(0, 1 - k / 6)) : 0;
    }
    const confetti = Array.from({ length: 70 }, (_, i) => ({ x: (i * 97) % W, d: 0.6 + ((i * 53) % 40) / 50, w: ((i * 31) % 7) - 3, c: ['#ffd36a', '#ff8a6a', '#ffffff', '#7ee08a', '#ff6aa8', '#7ac8ff'][i % 6], r: (i * 17) % 360 }));
    function luckyFx(ctx, s, t, st, lucky) {
      if (!st) return; const e = st.e, fade = e > LK_END - 1500 ? (LK_END - e) / 1500 : Math.min(1, e / 400);
      // 효과음: 조명이 손님을 지날 때 '틱', 두구두구 드럼, 멈추면 팡파레
      const sk = lucky.id + '|' + lucky.ms;
      if (sfx.key !== sk) { sfx.key = sk; sfx.near = null; sfx.landed = false; sfx.drum = 0; sfx.ticks = 0; }
      if (st.rolling) {
        if (st.near && st.near !== sfx.near) { sfx.near = st.near; sfxTick(Math.min(12, sfx.ticks++ % 13)); }
        if (e - sfx.drum > 90) { sfx.drum = e; sfxDrum(); }
      } else if (!sfx.landed) { sfx.landed = true; sfxFanfare(); }
      ctx.save();
      // 어둡게 + 스포트라이트 구멍
      const hx = st.x * s, hy = st.y * s, r = (st.rolling ? 21 : 25) * s, pivX = W * s / 2, pivY = -6 * s;
      ctx.fillStyle = `rgba(6,3,4,${0.6 * fade})`; ctx.beginPath(); ctx.rect(0, 0, W * s, H * s); ctx.ellipse(hx, hy, r, r * 1.05, 0, 0, Math.PI * 2, true); ctx.fill('evenodd');
      // 천장 조명기 + 빛줄기 (스포트라이트가 손님 쪽으로 회전)
      const ang = Math.atan2(hy - pivY, hx - pivX);
      ctx.globalCompositeOperation = 'lighter';
      const beam = ctx.createLinearGradient(pivX, pivY, hx, hy); beam.addColorStop(0, `rgba(255,240,200,${0.35 * fade})`); beam.addColorStop(1, `rgba(255,236,190,${0.18 * fade})`);
      const nx = -Math.sin(ang), ny = Math.cos(ang);
      ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(pivX + nx * 3 * s, pivY + ny * 3 * s); ctx.lineTo(pivX - nx * 3 * s, pivY - ny * 3 * s);
      ctx.lineTo(hx - nx * r, hy - ny * r); ctx.lineTo(hx + nx * r, hy + ny * r); ctx.closePath(); ctx.fill();
      const pool2 = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 1.2); pool2.addColorStop(0, `rgba(255,236,190,${0.22 * fade})`); pool2.addColorStop(1, 'rgba(255,236,190,0)');
      ctx.fillStyle = pool2; ctx.fillRect(hx - r * 1.3, hy - r * 1.3, r * 2.6, r * 2.6);
      ctx.globalCompositeOperation = 'source-over';
      ctx.save(); ctx.translate(pivX, pivY + 8 * s); ctx.rotate(ang - Math.PI / 2);
      ctx.fillStyle = '#2b2224'; ctx.fillRect(-5 * s, -3 * s, 10 * s, 8 * s); ctx.fillStyle = `rgba(255,240,200,${fade})`; ctx.fillRect(-4 * s, 4.5 * s, 8 * s, 1.2 * s); ctx.restore();
      // 멈추는 순간 번쩍 + 꽃가루
      if (!st.rolling) {
        const k = e - LK_ROLL;
        if (k < 350) { ctx.fillStyle = `rgba(255,248,225,${0.55 * (1 - k / 350)})`; ctx.fillRect(0, 0, W * s, H * s); }
        for (let i = 0; i < 12; i++) { const a2 = i / 12 * Math.PI * 2 + k / 700, rr2 = (16 + ((k / 1000) % 1) * 16) * s;
          ctx.globalAlpha = fade * (1 - ((k / 1000) % 1) * .7); ctx.fillStyle = ['#ffd36a', '#ffffff', '#ff8a6a'][i % 3];
          const sx2 = hx + Math.cos(a2) * rr2, sy2 = hy - 6 * s + Math.sin(a2) * rr2 * .75; ctx.fillRect(sx2 - 1.5 * s, sy2 - .5 * s, 3 * s, 1 * s); ctx.fillRect(sx2 - .5 * s, sy2 - 1.5 * s, 1 * s, 3 * s); }
        if (k < 6000) { const fall = k / 1000;
          confetti.forEach(c => { const y = (fall * 70 * c.d - 20) * s; if (y > H * s) return; const x = (c.x + Math.sin(fall * 3 + c.r) * 8 + c.w * fall * 4) * s;
            ctx.globalAlpha = fade * Math.min(1, (6 - fall)); ctx.fillStyle = c.c; ctx.save(); ctx.translate(x, y); ctx.rotate(c.r + fall * 4 * c.d); ctx.fillRect(-1.6 * s, -.8 * s, 3.2 * s, 1.6 * s); ctx.restore(); }); }
        ctx.globalAlpha = 1;
      }
      // 배너
      const dots = '.'.repeat(1 + Math.floor(e / 300) % 3);
      const txt = st.rolling ? `두구두구${dots} 럭키 손님은?!` : `★ ${lucky.nick}님 당첨! ★`;
      ctx.globalAlpha = fade; ctx.font = `${(st.rolling ? 12 : 15) * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const bw = ctx.measureText(st.rolling ? '두구두구... 럭키 손님은?!' : txt).width + 30 * s, bx = W * s / 2 - bw / 2, by = 18 * s, bh = 24 * s;
      const shake = st.rolling ? Math.sin(e / 40) * 0.8 * s : 0, pulse = st.rolling ? 1 : 1 + Math.max(0, 0.18 - (e - LK_ROLL) / 2000);
      ctx.translate(W * s / 2 + shake, by + bh / 2); ctx.scale(pulse, pulse); ctx.translate(-W * s / 2, -(by + bh / 2));
      ctx.fillStyle = 'rgba(26,10,12,.94)'; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 12 * s); ctx.fill();
      ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 1.5 * s; ctx.stroke();
      ctx.fillStyle = st.rolling ? '#ffe2c8' : '#ffd36a'; ctx.fillText(txt, W * s / 2, by + bh / 2);
      if (!st.rolling && lucky.reward) { ctx.font = `${7.5 * s}px "Do Hyeon", sans-serif`; const sub = `다음 방문 때 ${lucky.reward} 쿠폰 증정!`, sw = ctx.measureText(sub).width + 18 * s;
        ctx.fillStyle = 'rgba(255,211,106,.95)'; ctx.beginPath(); ctx.roundRect(W * s / 2 - sw / 2, by + bh + 4 * s, sw, 13 * s, 6.5 * s); ctx.fill();
        ctx.fillStyle = '#2a1618'; ctx.fillText(sub, W * s / 2, by + bh + 10.5 * s); }
      ctx.restore();
    }
    return { render, capacity: ORDER.length };
  }

  // ---------- 저장소 ----------
  const cfg = global.FIREBASE_CONFIG;
  const LIVE = !!(cfg && cfg.apiKey && !/^여기에/.test(cfg.apiKey) && global.firebase);
  let fs = null;
  let auth = null;
  if (LIVE) { if (!firebase.apps.length) firebase.initializeApp(cfg); fs = firebase.firestore(); auth = firebase.auth ? firebase.auth() : null; }
  // 손님 휴대폰 익명 로그인: 내 캐릭터의 메시지만 고칠 수 있게 하는 열쇠 (실패해도 등록은 됨)
  let authReady = null;
  function guestUid() {
    if (!auth) return Promise.resolve(null);
    if (!authReady) authReady = new Promise(res => { const off = auth.onAuthStateChanged(u => { off(); res(u); }); })
      .then(u => u || auth.signInAnonymously().then(c => c.user)).then(u => u && u.uid).catch(() => { authReady = null; return null; });
    return authReady;
  }
  const DEMO_KEY = d => 'notsun-demo3-' + d;
  const chan = ('BroadcastChannel' in global) ? new BroadcastChannel('notsun-guestbook') : null;
  const ping = () => chan && chan.postMessage('changed');
  const listeners = [];
  if (chan) chan.onmessage = () => listeners.forEach(f => f());
  addEventListener('storage', () => listeners.forEach(f => f()));
  const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  function valid(g) {
    return g && typeof g.nick === 'string' && g.nick.length >= 1 && g.nick.length <= 8 && typeof g.msg === 'string' && g.msg.length <= 24 &&
      DRINKS.some(d => d.k === g.drink) && isHex(g.hair) && isHex(g.skin) && isHex(g.shirt) && isHex(g.pants) && STYLE_RE.test(g.style) &&
      (g.v === undefined || (Number.isInteger(g.v) && g.v >= 1 && g.v <= 999)) && (g.talk === undefined || [0, 1, 2].includes(g.talk)) && (g.bd === undefined || typeof g.bd === 'boolean') && (g.nolast === undefined || typeof g.nolast === 'boolean') && (g.noheart === undefined || typeof g.noheart === 'boolean') && (g.hearts === undefined || (Number.isInteger(g.hearts) && g.hearts >= 0)) && (g.npc === undefined || typeof g.npc === 'boolean');
  }
  async function addGuest(g) {
    const doc = { nick: g.nick, msg: g.msg, drink: g.drink, hair: g.hair, skin: g.skin, shirt: g.shirt, pants: g.pants, style: g.style };
    if (Number.isInteger(g.v)) doc.v = Math.max(1, Math.min(999, g.v));
    if ([1, 2].includes(g.talk)) doc.talk = g.talk;
    if (g.bd === true) doc.bd = true;
    if (!valid(doc)) throw new Error('invalid');
    const day = bizDate();
    if (LIVE) {
      const uid = await guestUid();
      const ref = await fs.collection('days').doc(day).collection('guests').add({ ...doc, ...(uid ? { uid } : {}), ts: firebase.firestore.FieldValue.serverTimestamp() });
      return { day, id: ref.id, editable: !!uid };
    }
    const id = 'd' + Date.now(), list = lsGet(DEMO_KEY(day), []); list.push({ ...doc, uid: demoUid(), ms: Date.now(), id }); lsSet(DEMO_KEY(day), list); ping();
    return { day, id, editable: true };
  }
  // 손님 간단 설정 (대화 아이콘, 술 이름 표시)
  async function updatePrefs(day, id, pr) {
    const up = {};
    if ([0, 1, 2].includes(pr.talk)) up.talk = pr.talk;
    if (typeof pr.nolast === 'boolean') up.nolast = pr.nolast;
    if (typeof pr.noheart === 'boolean') up.noheart = pr.noheart;
    if (!Object.keys(up).length) return;
    if (LIVE) { await guestUid(); await fs.collection('days').doc(day).collection('guests').doc(id).update(up); return; }
    const list = lsGet(DEMO_KEY(day), []), g = list.find(x => x.id === id); if (!g) throw new Error('gone');
    Object.assign(g, up); lsSet(DEMO_KEY(day), list); ping();
  }
  // 손님이 자기 캐릭터의 한 줄만 바꾸기 (같은 영업일, 10초에 한 번)
  async function updateMsg(day, id, msg) {
    msg = String(msg || '').trim().slice(0, 24);
    if (LIVE) {
      await guestUid();
      await fs.collection('days').doc(day).collection('guests').doc(id).update({ msg, mts: firebase.firestore.FieldValue.serverTimestamp() });
      return;
    }
    const list = lsGet(DEMO_KEY(day), []), g = list.find(x => x.id === id); if (!g) throw new Error('gone');
    g.msg = msg; g.ms = Date.now(); lsSet(DEMO_KEY(day), list); ping();
  }
  async function removeGuest(day, id) {
    if (LIVE) { await fs.collection('days').doc(day).collection('guests').doc(id).delete(); return; }
    lsSet(DEMO_KEY(day), lsGet(DEMO_KEY(day), []).filter(g => g.id !== id)); ping();
  }
  function watchGuests(day, cb, all) {
    const keep = l => all ? l : l.filter(g => valid(g) && clean(g.nick) && clean(g.msg));
    if (LIVE) {
      return fs.collection('days').doc(day).collection('guests').orderBy('ts').limit(300).onSnapshot(snap => {
        cb(keep(snap.docs.map(d => { const g = d.data(); return { ...g, id: d.id, ms: g.mts ? g.mts.toMillis() : g.ts ? g.ts.toMillis() : Date.now() }; })));
      }, () => cb(null));
    }
    const read = () => cb(keep(lsGet(DEMO_KEY(day), []))); read(); listeners.push(read);
    return () => { const i = listeners.indexOf(read); if (i >= 0) listeners.splice(i, 1); };
  }
  // 사장 설정/실시간 메시지
  function normOwners(arr) {
    return DEFAULT_OWNERS.map((d, i) => { const o = (arr || [])[i] || {};
      return { nick: typeof o.nick === 'string' && o.nick.trim() ? o.nick.slice(0, 8) : d.nick,
        hair: isHex(o.hair) ? o.hair : d.hair, skin: isHex(o.skin) ? o.skin : d.skin, shirt: isHex(o.shirt) ? o.shirt : d.shirt, pants: isHex(o.pants) ? o.pants : d.pants,
        style: STYLE_RE.test(o.style) ? o.style : d.style, lines: Array.isArray(o.lines) ? o.lines.filter(l => typeof l === 'string').map(l => l.slice(0, 24)).slice(0, 5) : d.lines }; });
  }
  function watchOwner(cb) {
    let state = { owners: normOwners(null), live: null, theme: 'auto', seats: {}, lucky: null, best: null, vip: [] };
    if (LIVE) {
      const u1 = fs.collection('owner').doc('settings').onSnapshot(d => { const v = d.exists ? d.data() : {}; state = { ...state, owners: normOwners(v.owners || null), theme: v.theme || 'auto', seats: cleanSeats(v.seats), ...cleanEvents(v) }; cb(state); }, () => {});
      const u2 = fs.collection('owner').doc('live').onSnapshot(d => { const v = d.exists ? d.data() : null; state = { ...state, live: v && v.ts ? { msg: String(v.msg || '').slice(0, 30), who: v.who, ms: v.ts.toMillis() } : null }; cb(state); }, () => {});
      cb(state); return () => { u1(); u2(); };
    }
    const read = () => { state = { owners: normOwners(lsGet('notsun-owner-settings', null)), live: lsGet('notsun-owner-live', null), theme: lsGet('notsun-owner-theme', 'auto'), seats: cleanSeats(lsGet('notsun-owner-seats', null)), ...cleanEvents(lsGet('notsun-owner-events', {})) }; cb(state); };
    read(); listeners.push(read); return () => {};
  }
  async function saveOwners(owners) {
    const clean2 = normOwners(owners);
    if (LIVE) { await fs.collection('owner').doc('settings').set({ owners: clean2 }, { merge: true }); return; }
    lsSet('notsun-owner-settings', clean2); ping();
  }
  // 자리 지정은 그날 영업일에만 유효
  function cleanSeats(v) {
    if (!v || v.day !== bizDate() || !v.map || typeof v.map !== 'object') return {};
    const out = {}; Object.entries(v.map).forEach(([id, c]) => { if (typeof c === 'string' && SEAT_BY_CODE[c]) out[id] = c; }); return out;
  }
  async function saveSeats(map) {
    const v = { day: bizDate(), map: cleanSeats({ day: bizDate(), map }) };
    if (LIVE) { await fs.collection('owner').doc('settings').set({ seats: v }, { mergeFields: ['seats'] }); return; }
    lsSet('notsun-owner-seats', v); ping();
  }
  // 이벤트: 럭키 손님 / 오늘의 한 줄 / VIP (그날 영업일에만 유효)
  const luckySeen = {};
  const SHOP_WIFI = { s: 'KT_GiGA_B945', p: '3bbbaxe067' };  // 손님용 와이파이 기본값 (사장 리모컨에서 바꿀 수 있음 · 이름은 대소문자 구분)
  const wifiQrText = w => `WIFI:T:WPA;S:${String(w.s).replace(/([\\;,:"])/g, '\\$1')};P:${String(w.p).replace(/([\\;,:"])/g, '\\$1')};;`;
  function cleanEvents(v) {
    const today = bizDate(), out = { lucky: null, best: null, vip: [], order: null, ntfy: '', bday: null, bdays: [], q: '', game: null, npcs: [], wifi: { ...SHOP_WIFI } };
    const wf = v && v.wifi; if (wf && typeof wf.s === 'string') out.wifi = { s: wf.s.slice(0, 32), p: typeof wf.p === 'string' ? wf.p.slice(0, 63) : '' };
    const lk = v && v.lucky;
    if (lk && lk.day === today && typeof lk.id === 'string') {
      // 기기마다 시계가 달라도 애니메이션이 처음부터 보이도록: 이 화면이 '처음 받은 순간'을 시작 시간으로 씀
      const server = lk.at && lk.at.toMillis ? lk.at.toMillis() : (lk.ms || 0), key = lk.id + '|' + (server || 'pending');
      // 페이지를 막 연 순간 이미 있던 지난 뽑기는 다시 틀지 않음. 그 뒤로 새로 들어온 뽑기는 기기 시계와 상관없이 항상 처음부터 재생
      if (!(key in luckySeen)) luckySeen[key] = (performance.now() < 5000 && server && Math.abs(Date.now() - server) > 20000) ? 0 : Date.now();
      if (!server) luckySeen[key] = luckySeen[key] || Date.now();
      out.lucky = { id: lk.id, nick: String(lk.nick || '').slice(0, 8), ms: luckySeen[key], serverMs: server, reward: typeof lk.reward === 'string' ? lk.reward.slice(0, 20) : '' };
    }
    const bs = v && v.best; if (bs && bs.day === today && typeof bs.id === 'string') out.best = bs.id;
    if (v && typeof v.ntfy === 'string') { ntfyTopic = v.ntfy; out.ntfy = v.ntfy; }
    const bdv = v && v.bday;
    if (bdv && bdv.day === today && bdv.n && typeof bdv.id === 'string') { const key = 'b|' + bdv.n; if (!(key in luckySeen)) luckySeen[key] = performance.now() < 5000 ? 0 : Date.now(); out.bday = { id: bdv.id, nick: String(bdv.nick || '').slice(0, 8), ms: luckySeen[key] }; }
    const bdl = v && v.bdays; if (bdl && bdl.day === today && Array.isArray(bdl.ids)) out.bdays = bdl.ids.filter(x => typeof x === 'string').slice(0, 40);
    const od = v && v.order;
    if (od && od.day === today && od.n) { const key = 'o|' + od.n; if (!(key in luckySeen)) luckySeen[key] = performance.now() < 5000 ? 0 : Date.now(); out.order = { gid: od.gid || '', nick: String(od.nick || '').slice(0, 8), icon: od.icon || 'cocktail', ms: luckySeen[key] }; }
    const vp = v && v.vip; if (vp && vp.day === today && Array.isArray(vp.ids)) out.vip = vp.ids.filter(x => typeof x === 'string').slice(0, 40);
    const gm = v && v.game; if (gm && gm.day === today && gm.n && GAME_TYPES.includes(gm.type)) { const key = 'g|' + gm.n + '|' + gm.phase + '|' + (gm.k || 0); if (!(key in luckySeen)) luckySeen[key] = Date.now(); out.game = { ...gm, ms: luckySeen[key] }; }
    const np = v && v.npcs; if (np && np.day === today && Array.isArray(np.list)) out.npcs = np.list.filter(g => g && typeof g.id === 'string' && /^npc/.test(g.id) && valid({ ...g, id: undefined, ms: undefined })).slice(0, NPC_MAX).map(g => ({ ...g, npc: true, noheart: true }));
    const qv = v && v.q; if (qv && qv.day === today && typeof qv.text === 'string' && qv.text.trim()) out.q = qv.text.trim().slice(0, 40);
    return out;
  }
  async function saveEvent(field, value) {
    if (LIVE) {
      const val = field === 'lucky' ? { ...value, at: firebase.firestore.FieldValue.serverTimestamp() } : value;
      await fs.collection('owner').doc('settings').set({ [field]: val }, { mergeFields: [field] }); return;
    }
    const ev = lsGet('notsun-owner-events', {}); ev[field] = field === 'lucky' ? { ...value, ms: Date.now() } : value; lsSet('notsun-owner-events', ev); ping();
    setTimeout(() => listeners.forEach(f => f()), 0);   // 데모: 실제 서버처럼 쓴 화면 자신에게도 알림
  }
  // 촬영용 가상 손님 (사장 설정에만 저장 → 손님 휴대폰의 하트·게임 대상에는 안 나타남)
  const NPC_MAX = 30;
  const NPC_NICKS = ['퇴근한곰', '첫혼술', '야행성', '위스키러버', '밤산책', '교동주민', '하이볼요정', '오늘도야근', '혼술초보', '칵테일덕후', '불금러', '조용히한잔', '월급루팡', '동네한바퀴', '금요일만', '막차탈래', '진토닉', '새벽감성', '혼자왔어요', '대구토박이', '퇴사각', '한잔만', '고양이집사', '출장중', '야근탈출', '동성로', '비오는날', '얼음많이', '첫방문', '단골예정', '낯가림', '말걸어줘요'];
  const NPC_MSGS = ['오늘 퇴사함', '혼술 처음이에요', '한 잔 더?', '분위기 좋다', '', '오늘 너무 피곤', '불금이다', '', '내일 출근 실화?', '', '여기 좋네', ''];
  function makeNpcs(n, have) {
    const pick = a => a[Math.floor(Math.random() * a.length)], now = Date.now(), used = new Set((have || []).map(g => g.nick)), out = [];
    const nicks = NPC_NICKS.filter(x => !used.has(x)).sort(() => Math.random() - 0.5);
    for (let i = 0; i < n; i++) {
      const sx = Math.random() < 0.5 ? 'm' : 'f';
      out.push({ id: 'npc' + now.toString(36) + i, nick: nicks[i] || ('손님' + (i + 1)), msg: pick(NPC_MSGS), drink: pick(DRINKS).k, hair: pick(HAIR_COLORS), skin: pick(SKIN_COLORS), shirt: pick(SHIRT_COLORS), pants: PANTS,
        style: sx + Math.floor(Math.random() * 4) + (sx === 'f' && Math.random() < 0.5 ? 1 : 0) + Math.floor(Math.random() * 4), talk: pick([0, 1, 1, 2]), ms: now - (n - i) * 40000 });
    }
    return out;
  }
  // 사장: 오늘 기록 초기화 (테스트 접속 정리용) — 오늘 손님 캐릭터·주문·게임 참여 기록·가상 손님·오늘 이벤트를 지움
  async function resetDay() {
    const day = bizDate(); let n = { guests: 0, orders: 0, games: 0 };
    if (LIVE) {
      const del = async (snap, key) => { const docs = snap.docs; n[key] += docs.length; for (let i = 0; i < docs.length; i += 400) { const b = fs.batch(); docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); } };
      await del(await fs.collection('days').doc(day).collection('guests').get(), 'guests');
      await del(await fs.collection('orders').where('day', '==', day).get(), 'orders');
      await del(await fs.collection('games').where('day', '==', day).get(), 'games');
      await fs.collection('owner').doc('settings').set({ npcs: null, lucky: null, best: null, vip: null, bday: null, bdays: null, order: null, game: null, seats: {} }, { mergeFields: ['npcs', 'lucky', 'best', 'vip', 'bday', 'bdays', 'order', 'game', 'seats'] });
      return n;
    }
    n.guests = lsGet(DEMO_KEY(day), []).length; lsSet(DEMO_KEY(day), []);
    const od = lsGet('notsun-orders', {}); Object.keys(od).forEach(k => { if (od[k].day === day) { delete od[k]; n.orders++; } }); lsSet('notsun-orders', od);
    const ga = lsGet('notsun-gameacts', []); n.games = ga.filter(a => a.day === day).length; lsSet('notsun-gameacts', ga.filter(a => a.day !== day));
    const ev = lsGet('notsun-owner-events', {}); ['npcs', 'lucky', 'best', 'vip', 'bday', 'bdays', 'order', 'game'].forEach(k => delete ev[k]); lsSet('notsun-owner-events', ev); lsSet('notsun-owner-seats', {});
    ping(); setTimeout(() => listeners.forEach(f => f()), 0); return n;
  }
  const setNpcs = list => saveEvent('npcs', { day: bizDate(), list: (list || []).slice(0, NPC_MAX).map(g => ({ id: g.id, nick: g.nick, msg: g.msg, drink: g.drink, hair: g.hair, skin: g.skin, shirt: g.shirt, pants: g.pants, style: g.style, talk: g.talk, ms: g.ms })) });
  const setWifi = (s, p) => saveEvent('wifi', { s: String(s || '').trim().slice(0, 32), p: String(p || '').slice(0, 63) });
  const setQuestion = text => saveEvent('q', { day: bizDate(), text: String(text || '').trim().slice(0, 40) });
  const drawLucky = (id, nick, reward) => saveEvent('lucky', { day: bizDate(), id, nick: String(nick || '').slice(0, 8), reward: String(reward || '').slice(0, 20) });
  // ---------- 무료 쿠폰 (럭키 손님 당첨 → 다음 방문부터 30일) ----------
  const COUPON_DAYS = 30;
  const addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
  function demoUid() { try { const q = new URLSearchParams(location.search).get('duid'); if (q) return 'demo-' + q.slice(0, 12);  // 데모 시뮬레이션: 한 브라우저에서 손님 여러 명
      let u = localStorage.getItem('notsun-demo-uid'); if (!u) { u = 'demo' + Math.random().toString(36).slice(2, 10); localStorage.setItem('notsun-demo-uid', u); } return u; } catch (e) { return 'demo'; } }
  const myUid = () => LIVE ? guestUid() : Promise.resolve(demoUid());
  function couponCode() { const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 6; i++) c += A[Math.floor(Math.random() * A.length)]; return c; }
  function couponState(c) { const today = bizDate(); if (!c) return 'none'; if (c.status === 'used') return 'used'; if (c.expDay && today > c.expDay) return 'expired'; return c.issuedDay === today ? 'today' : 'ready'; }
  function normCoupon(id, v) { return { code: id, uid: v.uid || '', nick: String(v.nick || ''), reward: String(v.reward || '무료 쿠폰'), status: v.status === 'used' ? 'used' : 'issued', issuedDay: v.issuedDay || '', expDay: v.expDay || '', usedDay: v.usedDay || '', ms: v.issuedAt && v.issuedAt.toMillis ? v.issuedAt.toMillis() : (v.ms || 0) }; }
  async function issueCoupon({ uid, nick, reward }) {
    const code = couponCode(), day = bizDate();
    const doc = { uid: uid || '', nick: String(nick || '').slice(0, 8), reward: String(reward || '칵테일 1잔 무료').slice(0, 20), status: 'issued', issuedDay: day, expDay: addDays(day, COUPON_DAYS) };
    if (LIVE) { await fs.collection('coupons').doc(code).set({ ...doc, issuedAt: firebase.firestore.FieldValue.serverTimestamp() }); return code; }
    const all = lsGet('notsun-coupons', {}); all[code] = { ...doc, ms: Date.now() }; lsSet('notsun-coupons', all); ping(); return code;
  }
  async function useCoupon(code) {
    if (LIVE) { await fs.collection('coupons').doc(code).update({ status: 'used', usedDay: bizDate(), usedAt: firebase.firestore.FieldValue.serverTimestamp() }); return; }
    const all = lsGet('notsun-coupons', {}); if (all[code]) { all[code].status = 'used'; all[code].usedDay = bizDate(); lsSet('notsun-coupons', all); ping(); }
  }
  // 손님: 내 쿠폰 (이 휴대폰의 익명 열쇠 기준)
  function watchMyCoupons(cb) {
    let off = () => {}, dead = false;
    myUid().then(uid => { if (dead || !uid) return cb([]);
      if (LIVE) { off = fs.collection('coupons').where('uid', '==', uid).onSnapshot(sn => cb(sn.docs.map(d => normCoupon(d.id, d.data()))), () => cb([])); return; }
      const read = () => cb(Object.entries(lsGet('notsun-coupons', {})).filter(([, v]) => v.uid === uid).map(([k, v]) => normCoupon(k, v))); read(); listeners.push(read);
      off = () => { const i = listeners.indexOf(read); if (i >= 0) listeners.splice(i, 1); };
    });
    return () => { dead = true; off(); };
  }
  // 사장: 최근 쿠폰 목록
  function watchCoupons(cb) {
    if (LIVE) return fs.collection('coupons').orderBy('issuedAt', 'desc').limit(60).onSnapshot(sn => cb(sn.docs.map(d => normCoupon(d.id, d.data()))), () => cb([]));
    const read = () => cb(Object.entries(lsGet('notsun-coupons', {})).map(([k, v]) => normCoupon(k, v)).sort((a, b) => b.ms - a.ms)); read(); listeners.push(read);
    return () => { const i = listeners.indexOf(read); if (i >= 0) listeners.splice(i, 1); };
  }
  const setBest = id => saveEvent('best', { day: bizDate(), id: id || '' });
  const setVip = ids => saveEvent('vip', { day: bizDate(), ids: (ids || []).slice(0, 40) });
  // ---------- 게임 데이터 ----------
  const GAME_TYPES = ['bomb', 'ten', 'toast', 'bal', 'nun', 'rou', 'race', 'rps', 'ox'];
  const RACE_HORSES = [{ n: '하이볼', c: '#e8c070' }, { n: '소맥', c: '#d9d2c0' }, { n: '막걸리', c: '#f2efe6' }, { n: '위스키', c: '#b06a2c' }, { n: '샴페인', c: '#f0d870' }];
  const BAL_QS = [['평생 소주만', '평생 맥주만'], ['짜장면', '짬뽕'], ['부먹', '찍먹'], ['혼술', '떼술'], ['해장은 국밥', '해장은 라면'], ['여행은 계획파', '여행은 즉흥파'],
    ['10년 전으로 가기', '10년 후로 가기'], ['월급 2배 주6일', '지금 월급 주4일'], ['여름 바다', '겨울 산'], ['민트초코 호', '민트초코 불호'], ['고백은 직접 만나서', '고백은 메시지로'],
    ['첫 잔은 맥주', '첫 잔은 칵테일'], ['아침형 인간', '저녁형 인간'], ['연락 자주 하는 친구', '가끔 만나도 편한 친구'], ['평생 치킨 금지', '평생 라면 금지']];
  const OX_QS = [['모히또는 쿠바에서 시작된 칵테일이다', 0, '쿠바 아바나에서 유래했어요'], ['데킬라는 선인장으로 만든다', 1, '선인장이 아니라 아가베(용설란)로 만들어요'],
    ['샴페인은 프랑스 샹파뉴 지방에서 만든 것만 그렇게 부를 수 있다', 0, '다른 곳 스파클링은 프로세코·카바 등으로 불러요'], ['블러디 메리의 기본 술은 진이다', 1, '보드카가 기본이에요'],
    ['롱아일랜드 아이스티에는 홍차가 들어간다', 1, '차는 없고, 콜라로 홍차 색을 내요'], ['진토닉의 토닉워터에는 원래 말라리아 약 성분이 들어있었다', 0, '퀴닌이라는 성분이 쓴맛을 내요'],
    ['버번 위스키는 미국에서 만든 것만 버번이라고 부른다', 0, '미국 법으로 정해져 있어요'], ['사케는 쌀로 만든다', 0, '쌀과 누룩(코지)으로 빚어요'],
    ['스카치 위스키는 최소 3년 이상 숙성해야 한다', 0, '스코틀랜드 법으로 3년 이상이에요'], ['화이트 러시안은 러시아에서 처음 만들어졌다', 1, '보드카를 써서 붙은 이름일 뿐이에요'],
    ['싱글 몰트는 한 증류소에서 보리 몰트로만 만든 위스키다', 0, '여러 증류소 것을 섞으면 블렌디드예요'], ['맥주의 쓴맛은 홉에서 나온다', 0, '홉이 쓴맛과 향을 내요'],
    ['와인은 오래 둘수록 무조건 맛있어진다', 1, '대부분은 몇 년 안에 마시는 게 좋아요'], ['소맥의 원조는 일본이다', 1, '한국 술자리에서 생긴 문화예요'], ['칵테일 마가리타에는 소금을 잔 테두리에 묻힌다', 0, '솔트 림이라고 해요']];
  // ---------- 메뉴판 (기본값: 매장 메뉴판 기준 · 사장 리모컨에서 수정 가능) ----------
  const M = (name, price, extra) => ({ name, price, ...(extra || {}) });
  const W_ = (name, abv, price, bottle, group) => ({ name, abv, price, bottle, group, whisky: true });
  const DEFAULT_MENU = [
    { k: 'low', name: '칵테일 · 약한 도수', en: 'LOW PROOF', icon: 'cocktail', items: [M('피치크러쉬', 13000), M('미도리사워', 13000), M('준벅', 14000), M('진토닉', 12000), M('데킬라 선라이즈', 13000), M('블루사파이어', 13000), M('스푸모니', 13000), M('말리부 오렌지', 12000), M('깔루아밀크', 12000), M('베일리스 밀크', 12000), M('말리부 밀크', 12000), M('칼리모초', 13000), M('보치볼', 13000), M('요거마신 딸기', 13000), M('요거마신 포도', 13000)] },
    { k: 'mid', name: '칵테일 · 중간 도수', en: 'MEDIUM PROOF', icon: 'cocktail', items: [M('롱아일랜드아이스티', 13000), M('톰콜린스', 13000), M('진피즈', 14000), M('그레이하운드', 13000), M('섹스온더비치', 13000), M('화이트러시안', 13000), M('벤시', 13000), M('오르가즘', 13000), M('샤르도네', 13000), M('잭콕', 13000), M('럼콕', 13000), M('쿠바리브레', 13000)] },
    { k: 'high', name: '칵테일 · 높은 도수', en: 'HIGH PROOF', icon: 'cocktail', items: [M('몽상', 13000), M('마티니', 15000), M('갓파더', 14000), M('파우스트', 13000), M('카타르시스', 13000), M('블랙러시안', 12000), M('잭로즈', 13000)] },
    { k: 'hb', name: '하이볼', en: 'HIGHBALL', icon: 'whisky', items: [M('산토리 하이볼', 12000), M('애플 하이볼', 12000), M('피치 하이볼', 12000), M('생제르맹 하이볼', 13000)] },
    { k: 'whisky', name: '위스키', en: 'WHISKY', icon: 'whisky', note: '잔은 30ml · 하이볼로 변경 +2,000 · 바틀 킵 기간 2달', items: [
      W_('몽키숄더', '40%', 10000, 170000, 'BLENDED & CASUAL'), W_('조니워커 블랙', '40%', 10000, 170000, 'BLENDED & CASUAL'), W_('제임슨', '40%', 9000, 150000, 'BLENDED & CASUAL'),
      W_('잭다니엘 올드 No.7', '40%', 9000, 150000, 'BOURBON'), W_('메이커스 마크', '45%', 10000, 170000, 'BOURBON'), W_('버팔로 트레이스', '45%', 11000, 190000, 'BOURBON'), W_('와일드터키 101 8년', '50.5%', 10000, 170000, 'BOURBON'), W_('러셀 리저브 싱글배럴', '55%', 13000, 250000, 'BOURBON'),
      W_('글렌모렌지 12년 오리지널', '40%', 11000, 210000, 'SINGLE MALT'), W_('글렌피딕 12년', '40%', 12000, 230000, 'SINGLE MALT'), W_('발베니 12년 더블우드', '40%', 14000, 270000, 'SINGLE MALT'),
      W_('글렌드로낙 12년', '43%', 14000, 270000, 'SHERRY CASK'), W_('맥캘란 12년 쉐리오크', '40%', 15000, 280000, 'SHERRY CASK'), W_('글렌알라키 12년', '46%', 15000, 300000, 'SHERRY CASK'),
      W_('탈리스커 10년', '45.8%', 11000, 210000, 'PEAT & SMOKY'), W_('아드벡 10년', '46%', 14000, 270000, 'PEAT & SMOKY'),
      W_('니카 프롬 더 배럴', '51.4%', 13000, 250000, 'JAPANESE'), W_('히비키 저패니즈 하모니', '43%', 16000, 310000, 'JAPANESE'), W_('산토리 야마자키 DR', '43%', 18000, 350000, 'JAPANESE')] },
    { k: 'spk', name: '스파클링 · 샴페인', en: 'SPARKLING', icon: 'champagne', note: '병으로만 판매해요 (잔술 없음)', items: [{ ...M('몬테베르디 프로세코', 59000), abv: '11%' }, { ...M('모엣샹동 임페리얼', 170000), abv: '12%' }] },
    { k: 'shot', name: '샷', en: 'SHOT', icon: 'whisky', items: [M('레몬드랍', 4000), M('데킬라샷', 4000), M('치즈케이크', 8000), M('아이리쉬카밤', 15000), M('소맥드랍 (6잔)', 15000)] },
    { k: 'beer', name: '맥주', en: 'BEER', icon: 'beer', items: [M('블루문', 10000), M('코젤', 10000), M('스텔라', 10000), M('기네스', 12000)] },
    { k: 'na', name: '논알콜', en: 'NON-ALCOHOL', icon: 'cocktail', items: [M('선셋펀치', 11000), M('플로리다', 11000), M('셜리템플', 11000)] },
    { k: 'side', name: '안주', en: 'SIDE DISH', icon: 'food', items: [M('가라아게', 9000), M('나초', 5000), M('아이스크림', 5000)] }
  ];
  // 칵테일 예상 도수 (가게 레시피 술 양 기준 계산 · 얼음 녹는 물 포함 대략값)
  const MENU_ABV = {
    '피치크러쉬': '약 4%', '미도리사워': '약 3%', '준벅': '약 8%', '섹스온더비치': '약 12%', '진토닉': '약 10%', '데킬라 선라이즈': '약 10%', '블루사파이어': '약 6%', '스푸모니': '약 4%',
    '말리부 오렌지': '약 6%', '깔루아밀크': '약 5%', '베일리스 밀크': '약 4%', '말리부 밀크': '약 5%', '칼리모초': '약 6%', '보치볼': '약 4%', '벤시': '약 12%', '요거마신 딸기': '약 3%', '요거마신 포도': '약 6%',
    '롱아일랜드아이스티': '약 15%', '톰콜린스': '약 12%', '진피즈': '약 10%', '그레이하운드': '약 10%', '화이트러시안': '약 12%', '오르가즘': '약 18%', '샤르도네': '약 14%', '잭콕': '약 12%', '럼콕': '약 12%', '쿠바리브레': '약 12%',
    '몽상': '약 26%', '마티니': '약 30%', '갓파더': '약 30%', '파우스트': '약 45%', '카타르시스': '약 40%', '블랙러시안': '약 33%', '잭로즈': '약 18%',
    '산토리 하이볼': '약 10%', '애플 하이볼': '약 5%', '피치 하이볼': '약 5%', '생제르맹 하이볼': '약 5%',
    '레몬드랍': '약 20%', '데킬라샷': '40%', '치즈케이크': '약 8%', '소맥드랍 (6잔)': '약 8%', '선셋펀치': '무알콜', '플로리다': '무알콜', '셜리템플': '무알콜'
  };
  const FIRST_PICKS = ['피치크러쉬', '보치볼', '산토리 하이볼'];  // '처음이라면' 기본 추천 (리모컨에서 바꿀 수 있음)
  // 위스키 한 줄 설명 (주원료 · 맛) — 메뉴에 설명이 따로 저장돼 있지 않으면 이름으로 찾아 보여줌
  const MENU_DESC = {
    // 칵테일·하이볼·샷·논알콜·샴페인: 맛 표현만 (재료는 안 씀)
    '피치크러쉬': '새콤달콤, 가볍게 마시기 좋은 과일맛', '미도리사워': '달콤한 멜론에 새콤한 탄산', '준벅': '트로피컬하고 달콤, 바나나 향', '섹스온더비치': '과일 펀치처럼 상큼달콤',
    '진토닉': '쌉싸름하고 상쾌, 깔끔한 끝맛', '데킬라 선라이즈': '상큼달콤한 오렌지, 노을빛', '블루사파이어': '달콤 상큼한 탄산, 코코넛 향', '스푸모니': '쌉싸름하고 상큼한 자몽맛',
    '말리부 오렌지': '순하고 달콤한 코코넛 오렌지', '깔루아밀크': '달달한 커피우유', '베일리스 밀크': '고소하고 부드러운 크림 단맛', '말리부 밀크': '고소달콤한 코코넛 우유',
    '칼리모초': '달콤하고 청량, 가볍게', '보치볼': '살구·꿀향, 아주 순해요', '벤시': '초코바나나 디저트 같은 맛',
    '요거마신 딸기': '새콤달콤한 딸기 요거트 디저트', '요거마신 포도': '상큼달콤한 포도 요거트 디저트',
    '롱아일랜드아이스티': '아이스티처럼 술술, 도수 높아요', '톰콜린스': '상큼한 탄산 레모네이드', '진피즈': '새콤 산뜻, 부드러운 탄산', '그레이하운드': '쌉싸름 상큼, 깔끔',
    '화이트러시안': '진하고 부드러운 커피우유', '오르가즘': '달콤 고소한 진한 디저트', '샤르도네': '새콤달콤한 멜론맛 (와인 아니에요)',
    '잭콕': '달큰하고 청량', '럼콕': '달콤하고 청량', '쿠바리브레': '라임향이 상쾌한 청량함',
    '몽상': '과일향 깔끔, 은근히 세요', '마티니': '드라이하고 강렬', '갓파더': '아몬드향 달큰, 훈연 시나몬 향',
    '파우스트': '블랙커런트 향, 아주 강해요', '카타르시스': '아몬드향에 새콤함, 아주 강해요', '블랙러시안': '진한 커피향, 묵직해요', '잭로즈': '새콤달콤한 사과맛',
    '산토리 하이볼': '깔끔하고 청량', '애플 하이볼': '상큼달콤한 사과', '피치 하이볼': '달콤 상큼한 복숭아', '생제르맹 하이볼': '꽃향, 은은한 단맛',
    '레몬드랍': '새콤달콤 원샷', '데킬라샷': '강렬한 원샷', '치즈케이크': '진짜 치즈케이크 같은 맛', '아이리쉬카밤': '고소 쌉싸름, 바로 원샷', '소맥드랍 (6잔)': '6잔 한 세트',
    '선셋펀치': '상큼한 과일 탄산', '플로리다': '새콤 상큼한 시트러스', '셜리템플': '달콤한 생강 탄산',
    '몬테베르디 프로세코': '청사과·배 향, 가볍고 상큼', '모엣샹동 임페리얼': '사과·시트러스, 고소한 빵 향',
    '몽키숄더': '보리 몰트 · 바닐라, 꿀, 부드러운 단맛', '조니워커 블랙': '보리·곡물 블렌디드 · 은은한 스모키, 말린 과일', '제임슨': '보리·곡물 (아일랜드) · 부드러움, 바닐라, 고소한 견과',
    '잭다니엘 올드 No.7': '옥수수·호밀 (테네시) · 바나나, 캐러멜, 달큰함', '메이커스 마크': '옥수수·밀 · 캐러멜, 바닐라, 순한 목넘김', '버팔로 트레이스': '옥수수·호밀 · 바닐라, 토피, 흑설탕',
    '와일드터키 101 8년': '옥수수·호밀 · 진한 캐러멜, 후추 같은 스파이시', '러셀 리저브 싱글배럴': '옥수수·호밀 · 오크, 토피, 묵직한 여운',
    '글렌모렌지 12년 오리지널': '보리 몰트 · 시트러스, 꽃향, 가볍고 산뜻', '글렌피딕 12년': '보리 몰트 · 청사과, 배, 상큼함', '발베니 12년 더블우드': '보리 몰트 · 꿀, 바닐라, 은은한 셰리',
    '글렌드로낙 12년': '보리 몰트 · 셰리, 건포도, 다크초콜릿', '맥캘란 12년 쉐리오크': '보리 몰트 · 말린 과일, 생강, 셰리의 단맛', '글렌알라키 12년': '보리 몰트 · 진한 셰리, 초콜릿, 대추',
    '탈리스커 10년': '보리 몰트 · 바닷바람, 후추, 스모키', '아드벡 10년': '보리 몰트 · 강한 피트 훈연, 레몬, 짭짤함',
    '니카 프롬 더 배럴': '보리·곡물 블렌디드 · 진하고 묵직, 스파이스, 과일', '히비키 저패니즈 하모니': '보리·곡물 블렌디드 · 꿀, 오렌지 껍질, 은은한 꽃향', '산토리 야마자키 DR': '보리 몰트 · 체리, 딸기잼, 미즈나라 오크'
  };
  DEFAULT_MENU.forEach(c => c.items.forEach((it, i) => { it.id = c.k + '-' + i; if (MENU_DESC[it.name]) it.desc = MENU_DESC[it.name]; if (!it.abv && MENU_ABV[it.name]) it.abv = MENU_ABV[it.name]; if (FIRST_PICKS.includes(it.name)) it.first = true; }));
  const MENU_NOTES = ['취향에 따라 당도와 도수를 조절해 드려요. 요청사항에 적어주세요.', '메뉴판에 없는 클래식 칵테일도 요청사항에 편하게 적어주세요.'];
  function normMenu(v) {
    if (!v || !Array.isArray(v.cats) || !v.cats.length) return DEFAULT_MENU;
    return v.cats.slice(0, 20).map((c, ci) => ({ k: String(c.k || 'c' + ci).slice(0, 12), name: String(c.name || '').slice(0, 20), en: String(c.en || '').slice(0, 20), icon: c.icon || 'cocktail', note: c.note ? String(c.note).slice(0, 60) : '',
      items: (Array.isArray(c.items) ? c.items : []).slice(0, 60).map((it, i) => ({ id: String(it.id || (c.k + '-' + i)).slice(0, 24), name: String(it.name || '').slice(0, 24), price: Math.max(0, it.price | 0),
        bottle: it.bottle ? Math.max(0, it.bottle | 0) : 0, abv: String(it.abv || MENU_ABV[String(it.name || '')] || '').slice(0, 8), group: it.group ? String(it.group).slice(0, 24) : '', desc: String(it.desc != null ? it.desc : (MENU_DESC[String(it.name || '')] || '')).slice(0, 60), whisky: !!it.whisky, soldout: !!it.soldout, rec: !!it.rec, first: it.first === undefined ? FIRST_PICKS.includes(String(it.name || '')) : !!it.first })).filter(it => it.name) }));
  }
  function watchMenu(cb) {
    if (LIVE) return fs.collection('owner').doc('menu').onSnapshot(d => cb(normMenu(d.exists ? d.data() : null)), () => cb(DEFAULT_MENU));
    const read = () => cb(normMenu(lsGet('notsun-menu', null))); read(); listeners.push(read); return () => {};
  }
  async function saveMenu(cats) {
    const v = { cats: normMenu({ cats }) };
    if (LIVE) { await fs.collection('owner').doc('menu').set(v); return; }
    lsSet('notsun-menu', v); ping();
  }
  // ---------- 주문 (결제는 계산할 때 · 여기서는 주문 전달만) ----------
  async function placeOrder({ gid, nick, items, note, show, kind }) {
    const uid = await myUid(); if (!uid) throw new Error('nokey');
    const clean = items.slice(0, 20).map(it => ({ name: String(it.name).slice(0, 30), qty: Math.max(1, Math.min(20, it.qty | 0)), price: Math.max(0, it.price | 0), icon: it.icon || 'cocktail' }));
    const total = clean.reduce((a, it) => a + it.qty * it.price, 0);
    const doc = { day: bizDate(), uid, gid: String(gid || ''), nick: String(nick || '').slice(0, 8), items: clean, note: String(note || '').slice(0, 60), total, status: 'new', show: show !== false };
    if (kind === 'call') { doc.kind = 'call'; doc.show = false; }
    let id;
    if (LIVE) { const ref = await fs.collection('orders').add({ ...doc, ts: firebase.firestore.FieldValue.serverTimestamp() }); id = ref.id; }
    else { id = 'o' + Date.now(); const all = lsGet('notsun-orders', {}); all[id] = { ...doc, ms: Date.now() }; lsSet('notsun-orders', all); ping(); }
    notifyPhones(doc).catch(() => {});
    return id;
  }
  // 사장님 휴대폰 푸시 (ntfy 앱 · 채널 이름은 사장 리모컨에서 설정)
  let ntfyTopic = '';
  async function notifyPhones(o, topic) {
    const tp = topic || ntfyTopic; if (!tp) return;
    const lines = o.items.map(it => `${it.name} ×${it.qty}`).join(', ');
    const body = o.kind === 'call' ? { topic: tp, title: `🙋 호출 · ${o.nick || '손님'}`, message: o.items.map(it => it.name).join(', ') + (o.note ? `\n${o.note}` : ''), priority: 4, tags: ['raising_hand'] }  // 호출은 '우선순위 높음' 칸 → 휴대폰에서 알림음을 따로 지정
      : { topic: tp, title: `🍸 새 주문 · ${o.nick || '손님'}`, message: lines + (o.note ? `\n요청: ${o.note}` : '') + `\n${(o.total || 0).toLocaleString()}원`, priority: 5, tags: ['bell'] };
    await fetch('https://ntfy.sh/', { method: 'POST', body: JSON.stringify(body) });
  }
  const normOrder = (id, v) => ({ id, day: v.day, uid: v.uid, gid: v.gid || '', nick: v.nick || '', items: Array.isArray(v.items) ? v.items : [], note: v.note || '', total: v.total | 0, status: v.status || 'new', show: v.show !== false, kind: v.kind === 'call' ? 'call' : '', re: !!v.re, ms: v.ts && v.ts.toMillis ? v.ts.toMillis() : (v.ms || Date.now()) });
  function watchOrders(cb) { // 사장: 오늘 주문
    const day = bizDate();
    if (LIVE) return fs.collection('orders').where('day', '==', day).onSnapshot(sn => cb(sn.docs.map(d => normOrder(d.id, d.data())).sort((a, b) => b.ms - a.ms)), () => cb([]));
    const read = () => cb(Object.entries(lsGet('notsun-orders', {})).filter(([, v]) => v.day === day).map(([k, v]) => normOrder(k, v)).sort((a, b) => b.ms - a.ms)); read(); listeners.push(read); return () => {};
  }
  function watchMyOrders(cb) { // 손님: 내 오늘 주문
    let off = () => {}, dead = false; const day = bizDate();
    myUid().then(uid => { if (dead || !uid) return cb([]);
      if (LIVE) { off = fs.collection('orders').where('uid', '==', uid).where('day', '==', day).onSnapshot(sn => cb(sn.docs.map(d => normOrder(d.id, d.data())).sort((a, b) => b.ms - a.ms)), () => cb([])); return; }
      const read = () => cb(Object.entries(lsGet('notsun-orders', {})).filter(([, v]) => v.uid === uid && v.day === day).map(([k, v]) => normOrder(k, v)).sort((a, b) => b.ms - a.ms)); read(); listeners.push(read);
    });
    return () => { dead = true; off(); };
  }
  // 익명 건배 (보낸 사람은 저장하지만 화면·상대에게는 안 보여줌)
  async function sendCheer(to) {
    const uid = await myUid(); if (!uid || !to) throw new Error('nokey');
    const doc = { day: bizDate(), to: String(to).slice(0, 40), uid };
    if (LIVE) { await fs.collection('cheers').add({ ...doc, ts: firebase.firestore.FieldValue.serverTimestamp() }); return; }
    const all = lsGet('notsun-cheers', []); all.push({ ...doc, id: 'c' + Date.now(), ms: Date.now() }); lsSet('notsun-cheers', all.slice(-200)); ping();
  }
  function watchCheers(cb, to) { // to 를 주면 나에게 온 건배만
    const day = bizDate();
    if (LIVE) { let q = fs.collection('cheers').where('day', '==', day); if (to) q = q.where('to', '==', to);
      return q.onSnapshot(sn => cb(sn.docs.map(d => ({ id: d.id, to: d.data().to }))), () => cb([])); }
    const read = () => cb(lsGet('notsun-cheers', []).filter(c => c.day === day && (!to || c.to === to)).map(c => ({ id: c.id, to: c.to }))); read(); listeners.push(read); return () => {};
  }
  // 익명 하트: 하룻밤 3개, 한 사람에게 1번. 보낸 사람 기록은 본인만 읽을 수 있고, 받는 사람에게는 개수만 올라감
  // 서로 하트: 내가 하트를 보낸 사람이 나에게도 보냈을 때만 그 기록을 읽을 수 있음 (규칙에서 보장) → 두 사람 휴대폰에만 표시
  const HEART_MAX = 3;
  const heartId = (day, uid, k) => `${day}_${uid}_${k}`;
  async function sendHeart(fromGid, to, day0) { // to: { id, uid } · day0: 내 손님 기록의 영업일
    const uid = await myUid(), day = day0 || bizDate(); if (!uid || !to || !to.id) throw new Error('nokey');
    if (LIVE) {
      let slot = 0; for (let k = 1; k <= HEART_MAX && !slot; k++) { const d = await fs.collection('hearts').doc(heartId(day, uid, k)).get(); if (!d.exists) slot = k; else if (d.data().to === to.id) throw new Error('dup'); }  // 빈 칸은 규칙에서 읽기 허용 → 오류는 그대로 실패 처리
      if (!slot) throw new Error('max');
      const b = fs.batch();
      b.set(fs.collection('hearts').doc(heartId(day, uid, slot)), { day, from: uid, fromGid, to: to.id, ts: firebase.firestore.FieldValue.serverTimestamp() });
      b.update(fs.collection('days').doc(day).collection('guests').doc(to.id), { hearts: firebase.firestore.FieldValue.increment(1) });
      await b.commit(); return slot;
    }
    const all = lsGet('notsun-hearts', []), mine = all.filter(h => h.day === day && h.from === uid);
    if (mine.some(h => h.to === to.id)) throw new Error('dup'); if (mine.length >= HEART_MAX) throw new Error('max');
    const list = lsGet(DEMO_KEY(day), []), g = list.find(x => x.id === to.id); if (!g || g.noheart || g.talk === 2) throw new Error('closed');
    all.push({ day, from: uid, fromGid, to: to.id, ms: Date.now() }); lsSet('notsun-hearts', all.slice(-300));
    g.hearts = (g.hearts || 0) + 1; lsSet(DEMO_KEY(day), list); ping(); return mine.length + 1;
  }
  async function heartsSent(day0) { // 오늘 내가 보낸 하트 (받는 사람 id 목록)
    const uid = await myUid(), day = day0 || bizDate(); if (!uid) return [];
    if (LIVE) { const out = []; for (let k = 1; k <= HEART_MAX; k++) { try { const d = await fs.collection('hearts').doc(heartId(day, uid, k)).get(); if (d.exists) out.push(d.data().to); } catch (e) { throw e; } } return out; }
    return lsGet('notsun-hearts', []).filter(h => h.day === day && h.from === uid).map(h => h.to);
  }
  async function isMutual(myGid, other, day0) { // other: { id, uid } — 내가 먼저 하트를 보낸 사람만 확인 가능
    const day = day0 || bizDate(); if (!other || !other.uid) return false;
    if (LIVE) { for (let k = 1; k <= HEART_MAX; k++) { try { const d = await fs.collection('hearts').doc(heartId(day, other.uid, k)).get(); if (d.exists && d.data().to === myGid) return true; } catch (e) {} } return false; }
    const uid = await myUid(), all = lsGet('notsun-hearts', []).filter(h => h.day === day);
    if (!all.some(h => h.from === uid && h.to === other.id)) return false;
    return all.some(h => h.from === other.uid && h.to === myGid);
  }
  // 서로 하트 대화: 두 사람만, 한 사람당 하룻밤 20개, 60자, 한쪽이 그만하면 닫힘
  const CHAT_MAX = 20, CHAT_LEN = 60;
  const chatId = (day, a, b) => day + '_' + [a, b].sort().join('_');
  function watchChat(day, myGid, otherGid, cb) {
    const cid = chatId(day, myGid, otherGid);
    if (LIVE) {
      let msgs = [], meta = {}; const emit = () => cb({ msgs, closed: !!meta.closed, closedBy: meta.by || '' });
      const u1 = fs.collection('chats').doc(cid).collection('msgs').orderBy('ts').limit(60).onSnapshot(s => { msgs = s.docs.map(d => { const v = d.data(); return { id: d.id, fromGid: v.fromGid, text: String(v.text || '').slice(0, CHAT_LEN), ms: v.ts ? v.ts.toMillis() : Date.now() }; }); emit(); }, () => {});
      const u2 = fs.collection('chats').doc(cid).onSnapshot(d => { meta = d.exists ? d.data() : {}; emit(); }, () => {});
      return () => { u1(); u2(); };
    }
    const read = () => { const c = lsGet('notsun-chats', {})[cid] || {}; cb({ msgs: c.msgs || [], closed: !!c.closed, closedBy: c.by || '' }); };
    read(); listeners.push(read); return () => { const i = listeners.indexOf(read); if (i >= 0) listeners.splice(i, 1); };
  }
  async function sendChat(day, myGid, otherGid, text, n) {   // n: 오늘 이 대화에서 내 몇 번째 메시지인지 (1~20)
    text = String(text || '').replace(/\s+/g, ' ').trim().slice(0, CHAT_LEN); if (!text) throw new Error('empty'); if (!(n >= 1 && n <= CHAT_MAX)) throw new Error('max');
    const cid = chatId(day, myGid, otherGid), uid = await myUid(); if (!uid) throw new Error('nokey');
    if (LIVE) { await fs.collection('chats').doc(cid).collection('msgs').doc(uid + '_' + n).set({ from: uid, fromGid: myGid, text, ts: firebase.firestore.FieldValue.serverTimestamp() }); return; }
    const all = lsGet('notsun-chats', {}), c = all[cid] || { msgs: [] }; if (c.closed) throw new Error('closed'); const id = uid + '_' + n; if (c.msgs.some(m => m.id === id)) throw new Error('dup');
    c.msgs.push({ id, fromGid: myGid, text, ms: Date.now() }); all[cid] = c; lsSet('notsun-chats', all); ping(); setTimeout(() => listeners.forEach(f => f()), 0);
  }
  async function closeChat(day, myGid, otherGid) {
    const cid = chatId(day, myGid, otherGid);
    if (LIVE) { await fs.collection('chats').doc(cid).set({ closed: true, by: myGid, ts: firebase.firestore.FieldValue.serverTimestamp() }); return; }
    const all = lsGet('notsun-chats', {}), c = all[cid] || { msgs: [] }; c.closed = true; c.by = myGid; all[cid] = c; lsSet('notsun-chats', all); ping(); setTimeout(() => listeners.forEach(f => f()), 0);
  }
  async function markRealert(id) { // 재알림은 주문마다 한 번만 (사장님 기기가 여러 대여도)
    if (LIVE) { await fs.collection('orders').doc(id).update({ re: true }); return; }
    const all = lsGet('notsun-orders', {}); if (all[id]) { all[id].re = true; lsSet('notsun-orders', all); ping(); }
  }
  async function deleteOrder(id) { // 사장: 주문 기록 삭제 (테스트 주문 정리용)
    if (LIVE) { await fs.collection('orders').doc(id).delete(); return; }
    const all = lsGet('notsun-orders', {}); delete all[id]; lsSet('notsun-orders', all); ping();
  }
  async function setOrderStatus(id, status) {
    if (LIVE) { await fs.collection('orders').doc(id).update({ status }); return; }
    const all = lsGet('notsun-orders', {}); if (all[id]) { all[id].status = status; lsSet('notsun-orders', all); ping(); }
  }
  // 접수한 주문의 술 이름을 손님 캐릭터에 표시 (손님이 허용한 경우만)
  // ---------- 게임 (사장 리모컨이 진행, 스크린이 보여주고, 손님 휴대폰으로 참여) ----------
  // owner/settings.game = { day, n, type: 'bomb'|'ten'|'toast', phase, ... }  /  games 컬렉션 = 손님 행동(참여·넘기기·기록·짠)
  const startGame = g => saveEvent('game', g ? { ...g, day: bizDate() } : null);
  // 게임 진행 정보 (사장님만 읽기/쓰기 · OX 정답 등 손님에게 안 보이게) — 진행 기기가 바뀌어도 이어받기
  async function saveGameHost(v) {
    const doc = { n: v.n, h: JSON.stringify(v.h || {}), by: String(v.by || ''), at: Date.now() };
    if (LIVE) { await fs.collection('owner').doc('gamehost').set(doc); return; }
    lsSet('notsun-gamehost', doc);
  }
  // 진행자 전용 쓰기: check(현재 게임)가 참일 때만 게임 상태·진행 정보를 함께 저장 (아니면 'lost' 오류)
  // 트랜잭션은 오프라인이면 실패 → 잠들었던 기기의 묵은 쓰기가 나중에 덮어쓰지 못함
  async function gameTx(check, game, hostDoc) {   // game: 객체 · null(끝) · undefined(그대로) · 함수(서버 현재값 → 새 값)
    const hd = hostDoc ? { n: hostDoc.n, h: JSON.stringify(hostDoc.h || {}), by: String(hostDoc.by || ''), at: Date.now() } : null;
    if (LIVE) {
      return fs.runTransaction(async tx => {
        const sref = fs.collection('owner').doc('settings'); const d = await tx.get(sref); const cur = d.exists ? (d.data().game || null) : null;
        if (!check(cur)) throw new Error('lost');
        const next = typeof game === 'function' ? game(cur) : game;
        if (next !== undefined) tx.set(sref, { game: next ? { ...next, day: bizDate() } : null }, { mergeFields: ['game'] });
        if (hd) tx.set(fs.collection('owner').doc('gamehost'), hd);
        return next;
      });
    }
    const cur = lsGet('notsun-owner-events', {}).game || null; if (!check(cur)) throw new Error('lost');
    const next = typeof game === 'function' ? game(cur) : game;
    if (hd) lsSet('notsun-gamehost', hd);
    if (next !== undefined) await saveEvent('game', next ? { ...next, day: bizDate() } : null);
    return next;
  }
  // 진행 기기 '살아있음' 신호 (사장님만 읽음 · 손님 화면에는 전달 안 됨)
  async function saveGameHb(v) { const d = { id: String(v.id || ''), n: v.n || 0, at: Date.now(), note: String(v.note || '').slice(0, 140), ph: String(v.ph || ''), ua: String(v.ua || '').slice(0, 100) }; if (LIVE) { await fs.collection('owner').doc('gamehb').set(d); return; } lsSet('notsun-gamehb', d); ping(); }
  function watchGameHb(cb) {
    if (LIVE) return fs.collection('owner').doc('gamehb').onSnapshot(d => cb(d.exists ? d.data() : null), () => {});
    const read = () => cb(lsGet('notsun-gamehb', null)); listeners.push(read); return () => {};
  }
  async function loadGameHost() {
    let d = null;
    if (LIVE) { const r = await fs.collection('owner').doc('gamehost').get(); d = r.exists ? r.data() : null; } else d = lsGet('notsun-gamehost', null);
    if (!d) return null; let h = null; try { h = JSON.parse(d.h); } catch (e) {} return { n: d.n, h, by: d.by, at: d.at };
  }
  async function gameAct(n, kind, extra) {
    const uid = await myUid(); if (!uid) throw new Error('nokey');
    const doc = { day: bizDate(), n: n | 0, uid, kind, gid: String(extra.gid || '').slice(0, 40), nick: String(extra.nick || '').slice(0, 8), v: (extra.v | 0), k: (extra.k | 0) };
    if (LIVE) { await fs.collection('games').add({ ...doc, ts: firebase.firestore.FieldValue.serverTimestamp() }); return; }
    const all = lsGet('notsun-gameacts', []); all.push({ ...doc, id: 'a' + Date.now() + Math.random().toString(36).slice(2, 6), ms: Date.now() }); lsSet('notsun-gameacts', all.slice(-400)); ping();
  }
  function watchGameActs(n, cb) {
    const day = bizDate();
    if (LIVE) return fs.collection('games').where('day', '==', day).where('n', '==', n | 0).onSnapshot(sn => cb(sn.docs.map(d => ({ id: d.id, ...d.data() }))), () => cb([]));
    const read = () => cb(lsGet('notsun-gameacts', []).filter(a => a.day === day && a.n === (n | 0))); read(); listeners.push(read); return () => { const i = listeners.indexOf(read); if (i >= 0) listeners.splice(i, 1); };
  }
  function tenRank(acts) { const best = {}; acts.filter(a => a.kind === 'ten' && a.gid).forEach(a => { const d = Math.abs(a.v - 10000); if (!best[a.gid] || d < best[a.gid].d) best[a.gid] = { gid: a.gid, nick: a.nick, v: a.v, d, uid: a.uid }; });
    return Object.values(best).sort((a, b) => a.d - b.d); }
  // ---------- 레시피 (사장님만 보기 · owner/recipes) ----------
  // 기본값 = 사장님이 주신 가게 레시피 문서 (일부 수정 표시). 리모컨에서 고쳐 저장하면 그게 우선이에요.
  const DEFAULT_RECIPES = {
      "갓파더": "스터링 · 온더락\n\n- 잔에 얼음 넣고\n- 스카치 위스키 45ml\n- 디사론노 15ml\n\n가니쉬: 얼음 빼고 훈연 후 시나몬스틱",
      "그레이하운드": "스터링 · 하이볼잔\n\n- 보드카 45ml\n- 자몽주스 가득\n\n가니쉬: 건 오렌지",
      "데킬라 선라이즈": "스터링 · 하이볼잔\n\n- 데킬라 45ml\n- 오렌지주스 가득\n- 그레나딘 15ml 바닥에 깔기\n\n가니쉬: 건 오렌지",
      "레몬드랍": "쉐이킹 · 원샷잔\n\n- 샷잔 슈가림\n- 보드카 : 스윗앤사워믹스 = 1 : 1\n- 설탕시럽 조금",
      "롱아일랜드아이스티": "쉐이킹 · 빌드 · 하이볼잔\n\n- 진 15ml\n- 보드카 15ml\n- 럼 15ml\n- 데킬라 15ml  ← 추가\n- 트리플섹 15ml\n- 스윗앤사워믹스 30ml\n- 쉐이킹\n- 마지막 콜라 빌드\n\n가니쉬: 드라이 오렌지\n\n※ 원래 레시피에 데킬라가 빠져 있어서 넣었어요 (롱아일랜드는 진·보드카·럼·데킬라·트리플섹 5가지가 기본)",
      "마티니": "스터링 · 마티니잔\n\n- 드라이진 60ml\n- 드라이 베르뭇 (마티니 적힌 것) 10ml\n- 얼음컵 안에서 차갑게 스터링\n- 칵테일잔에 얼음 없이 푸어링\n\n가니쉬: 올리브 1개",
      "말리부 밀크": "스터링 · 고양이발잔\n\n- 얼음 가득\n- 말리부 40ml\n- 우유 120ml",
      "말리부 오렌지": "스터링 · 하이볼잔\n\n- 말리부 45ml\n- 오렌지주스 120ml\n\n가니쉬: 드라이 오렌지",
      "몽상": "쉐이킹 · 차가운 마티니잔 · 26%\n\n- 보드카 40ml\n- 피치트리 10ml\n- 그랑 마니에르 10ml\n- 블루큐라소 1티스푼\n- 레몬즙 1티스푼\n- 쉐이킹, 잔에 얼음 X\n\n가니쉬: 돌돌 말은 레몬필",
      "미도리사워": "빌드 · 하이볼잔\n\n- 미도리 30ml\n- 스윗앤사워믹스 30ml\n- 스프라이트 채우기\n\n가니쉬: 핀 + 체리",
      "바이올렛": "쉐이킹 · 둥근잔\n\n- 슈가림\n- 피치 1/2oz\n- 블루큐라소 1/2oz\n- 레몬주스 1/2oz\n- 시럽 1/2oz\n- 그레나딘 1/2oz\n- 쉐이킹 후 나머지 사이다 빌드",
      "벤시": "쉐이킹 (초코바나나맛) · 마티니잔\n\n- 바나나 리큐르 45ml\n- 디카이퍼 크렘 드 카카오 화이트 15ml\n- 우유 30ml",
      "베일리스 밀크": "스터링 · 고양이발잔\n\n- 얼음 가득\n- 베일리스 40ml\n- 우유 120ml",
      "보치볼": "빌드 · 하이볼잔 · 4% · 살구·꿀·오렌지맛\n\n- 디사론노 30ml\n- 오렌지주스 2/3까지 플로팅 (층 나뉘게)\n- 나머지 초정탄산수\n- 색깔 분리\n\n가니쉬: 레몬필",
      "블랙러시안": "스터링 · 온더락 · 33%\n\n- 잔에 얼음\n- 보드카 30ml\n- 깔루아 15ml",
      "화이트러시안": "스터링 · 온더락\n\n- 잔에 얼음\n- 보드카 30ml\n- 깔루아 15ml\n- 우유 60ml\n\n(블랙러시안 + 우유 60ml)",
      "블루사파이어": "쉐이킹 · 비커\n\n- 잔에 얼음 먼저\n- 비커 반만 파란색 슈가림\n- 블루큐라소 15ml\n- 피치트리 15ml\n- 말리부 15ml\n- 라임즙 10ml\n- 쉐이킹 후 사이다",
      "애플 하이볼": "빌드 · 하이볼잔\n\n- 애플트리 40ml\n- 나머지 토닉워터",
      "산토리 하이볼": "빌드 · 하이볼잔\n\n- 산토리 40ml\n- 나머지 탄산수  ← 수정\n\n가니쉬: 생레몬\n\n※ 원래 토닉워터였는데, 산토리 하이볼은 탄산수(소다)가 기본이라 바꿨어요. 토닉을 쓰면 쌉싸름하고 달아져요. 가게 스타일로 토닉을 원하시면 다시 고쳐주세요.",
      "샤르도네": "쉐이킹 · 온더락\n\n- 미도리 1oz\n- 아마레또 1oz\n- 라임주스 3/4oz\n\n가니쉬: 드라이 레몬",
      "섹스온더비치": "쉐이킹 + 빌드 · 하이볼잔\n\n- 보드카 50ml\n- 피치트리 20ml\n- 오렌지주스 50ml\n- 위 3가지 쉐이킹\n- 잔에 크랜베리주스 50ml 먼저 따르고 쉐이킹한 술 붓기\n\n가니쉬: 드라이 오렌지, 핀 + 체리",
      "소맥드랍": "테라 250ml 사용 · 6잔이 한 세트\n\n- 소주 15ml\n- 맥주 42ml",
      "스푸모니": "쉐이킹 · 하이볼잔\n\n- 캄파리 30ml\n- 자몽주스 90ml\n- 그레나딘 15ml\n- 쉐이킹 후 토닉워터\n\n가니쉬: 레몬필",
      "아이리쉬카밤": "빌드 · 샷잔 + 기네스잔\n\n- 베일리스 15ml\n- 아이리시 위스키 15ml (제임슨 등 · 없으면 스카치)  ← 수정\n- 기네스 잔에 50% 채우기\n- 샷잔을 기네스에 떨어뜨려 바로 원샷\n\n※ 이름 그대로 아이리시 위스키가 원래 레시피예요 (원래 적힌 건 스카치)",
      "오르가즘": "쉐이킹 · 볼록한 잔\n\n- 베일리스 30ml\n- 아마레또 30ml\n- 깔루아 30ml\n\n가니쉬: 초콜릿 빻은 것",
      "요거마신 포도": "쉐이킹 · 마티니잔\n\n- 포도 짜요짜요 다 짜기\n- 피스코 (포도 증류주) 25ml\n- 우유 20ml\n- 설탕시럽 10ml\n- 소금 한 꼬집\n- 얼음 쉐이킹\n\n가니쉬: 핀 + 포도젤리",
      "요거마신 딸기": "쉐이킹 · 마티니잔\n\n- 딸기 짜요짜요 다 짜기\n- 디카이퍼 와일드 스트로베리 25ml\n- 우유 20ml\n- 설탕시럽 10ml\n- 소금 한 꼬집\n- 얼음 쉐이킹\n\n가니쉬: 핀 + 딸기젤리",
      "생제르맹 하이볼": "스터링 · 하이볼잔\n\n- 생제르맹 40ml\n- 나머지 진저에일\n\n가니쉬: 로즈마리",
      "잭로즈": "쉐이킹 · 마티니잔\n\n- 잭다니엘 애플 45ml\n- 그레나딘 15ml\n- 라임즙 15ml\n\n가니쉬: 레몬필",
      "잭콕": "스터링 · 온더락\n\n- 잭다니엘 45ml\n- 나머지 콜라\n\n가니쉬: 생레몬",
      "준벅": "쉐이킹 · 하이볼잔\n\n- 미도리 30ml\n- 말리부 30ml\n- 바나나 리큐르 15~20ml\n- 파인애플주스 60ml\n- 스윗앤사워믹스 30ml\n\n가니쉬: 핀 + 체리",
      "진토닉": "스터링 · 하이볼잔\n\n- 진 45ml\n- 레몬즙 15ml\n- 토닉워터 채우기\n\n가니쉬: 생레몬",
      "깔루아밀크": "스터링 · 고양이발잔\n\n- 얼음 가득\n- 깔루아 40ml\n- 우유 120ml",
      "카타르시스": "스터링 · 온더락\n\n- 론디아즈 151 45ml\n- 디사론노 (아마레또) 15ml\n- 라임주스 15ml\n\n가니쉬: 로즈마리",
      "칼리모초": "스터링 · 하이볼잔\n\n- 잔에 얼음 칠링\n- 레드와인 절반\n- 콜라 나머지 가득\n- 레몬웨지 즙 짜서 넣고 스터링",
      "치즈케이크": "빌드 · 45ml 샷잔\n\n- 그레나딘 5ml\n- 그 위에 베일리스 20ml 스푼으로 빌드\n- 파인애플주스 20ml",
      "파우스트": "스터링 · 온더락\n\n- 론디아즈 151 30ml\n- 크렘 드 카시스 15ml\n- 바카디 화이트 30ml",
      "피치크러쉬": "빌드 · 하이볼잔\n\n- 피치트리 45ml\n- 스윗앤사워믹스 60ml\n- 크랜베리주스 가득 (약 120~150ml)\n\n가니쉬: 로즈마리, 건레몬",
      "피치 하이볼": "빌드 · 하이볼잔\n\n- 피치트리 40ml\n- 나머지 토닉워터\n\n가니쉬: 생레몬",
      "톰콜린스": "쉐이킹 · 하이볼잔\n\n- 진 60ml\n- 레몬주스 30ml\n- 설탕시럽 15ml\n- 쉐이킹 후 나머지 탄산수",
      "플라워드랍": "쉐이킹 · 210ml 마티니 크기 잔\n\n- 생제르맹 20ml\n- 보드카 40ml\n- 레몬 착즙 20ml\n- 설탕시럽 10ml\n- 쉐이킹 후 칵테일잔에 서브\n\n가니쉬: 레몬에 픽 꽂고 그 위에 로즈마리",
      "플로리다": "쉐이킹 · 하이볼잔 (논알콜)\n\n- 자몽주스 30ml\n- 오렌지주스 60ml\n- 레몬즙 15ml\n- 설탕시럽 10ml\n- 쉐이킹 후 탄산수 가득\n\n가니쉬: 레몬휠",
      "선셋펀치": "쉐이킹 · 하이볼잔 (논알콜)\n\n- 파인애플주스 45ml\n- 오렌지주스 60ml\n- 레몬 반 개 착즙\n- 그레나딘 10ml\n- 쉐이킹 후 탄산수 가득\n\n가니쉬: 레몬휠",
      "럼콕": "스터링 · 하이볼잔\n\n- 잔에 얼음 가득\n- 럼 45ml\n- 나머지 콜라\n\n가니쉬: 생레몬",
    "쿠바리브레": "스터링 · 하이볼잔\n\n- 잔에 얼음 가득\n- 화이트 럼 45ml\n- 라임즙 10ml (라임 1/4개 짜서 넣기)\n- 나머지 콜라\n\n가니쉬: 라임 웨지\n\n※ 럼콕에 라임이 들어가면 쿠바리브레예요",
    "셜리템플": "스터링 · 하이볼잔 (논알콜)\n\n- 그레나딘 15ml\n- 라임주스 10ml\n- 진저에일 가득\n\n가니쉬: 핀 + 체리 1개"
  };
  const recipeKey = name => String(name || '').replace(/\s*\((잔|하이볼|바틀|6잔)\)\s*$/, '').trim();
  const norm = t => String(t || '').replace(/\s+/g, '').replace(/\(.*?\)/g, '');   // 띄어쓰기·괄호 무시하고 찾기
  const RCP_INDEX = Object.fromEntries(Object.keys(DEFAULT_RECIPES).map(k => [norm(k), k]));
  function recipeFor(map, name) { const k = recipeKey(name); if (map && typeof map[k] === 'string' && map[k].trim()) return { text: map[k], custom: true, key: k };
    const dk = DEFAULT_RECIPES[k] ? k : RCP_INDEX[norm(k)]; if (dk) return { text: DEFAULT_RECIPES[dk], custom: false, key: k }; return { text: '', custom: false, key: k }; }
  function watchRecipes(cb) {
    if (LIVE) return fs.collection('owner').doc('recipes').onSnapshot(d => cb((d.exists && d.data().map) || {}), () => cb({}));
    const read = () => cb(lsGet('notsun-recipes', {})); read(); listeners.push(read); return () => {};
  }
  async function saveRecipe(name, text) {
    const k = recipeKey(name).slice(0, 30), v = String(text || '').slice(0, 800);
    if (!k) return;
    if (LIVE) { await fs.collection('owner').doc('recipes').set({ map: { [k]: v } }, { merge: true }); return; }
    const m = lsGet('notsun-recipes', {}); m[k] = v; lsSet('notsun-recipes', m); ping();
  }
  async function setGuestLast(gid, name) {
    if (!gid) return; const day = bizDate(), last = String(name || '').slice(0, 30);
    if (LIVE) { await fs.collection('days').doc(day).collection('guests').doc(gid).update({ last }); return; }
    const list = lsGet(DEMO_KEY(day), []), g = list.find(x => x.id === gid); if (g) { g.last = last; lsSet(DEMO_KEY(day), list); ping(); }
  }
  const announceOrder = (gid, nick, icon) => saveEvent('order', { day: bizDate(), gid: gid || '', nick: String(nick || '').slice(0, 8), icon: icon || 'cocktail', n: Math.random().toString(36).slice(2, 8) });
  async function celebrateBirthday(id, nick, current) {
    const ids = [...new Set([...(current || []), id])].slice(0, 40);
    await saveEvent('bdays', { day: bizDate(), ids });
    await saveEvent('bday', { day: bizDate(), id, nick: String(nick || '').slice(0, 8), n: Math.random().toString(36).slice(2, 8) });
  }
  const setNtfy = topic => saveEvent('ntfy', String(topic || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64));
  const renotify = o => notifyPhones({ ...o, nick: `⏰ 아직 접수 전 · ${o.nick || '손님'}` });
  const testNtfy = topic => notifyPhones({ nick: '테스트', items: [{ name: '알림 테스트', qty: 1 }], note: '', total: 0 }, topic);
  const onScreen = l => l.filter(g => valid(g) && clean(g.nick) && clean(g.msg));
  async function saveTheme(theme) {
    if (!THEMES.some(t => t.k === theme)) return;
    if (LIVE) { await fs.collection('owner').doc('settings').set({ theme }, { merge: true }); return; }
    lsSet('notsun-owner-theme', theme); ping();
  }
  async function sayLive(who, msg) {
    msg = String(msg || '').slice(0, 30);
    if (LIVE) { await fs.collection('owner').doc('live').set({ who, msg, ts: firebase.firestore.FieldValue.serverTimestamp() }); return; }
    lsSet('notsun-owner-live', { who, msg, ms: Date.now() }); ping();
  }

  global.Notsun = { resetDay, watchChat, sendChat, closeChat, CHAT_MAX, CHAT_LEN, makeNpcs, setNpcs, NPC_MAX, saveGameHost, loadGameHost, gameTx, saveGameHb, watchGameHb, setWifi, wifiQrText, SHOP_WIFI, GAME_TYPES, RACE_HORSES, BAL_QS, OX_QS, sendHeart, heartsSent, isMutual, HEART_MAX, W, H, OWNER_EMAIL, DRINKS, SEXES, HAIR_STYLES, BOTTOMS, ACCS, HAIR_COLORS, SKIN_COLORS, SHIRT_COLORS, PANTS, DEFAULT_OWNERS,
    THEMES, resolveTheme, costumeFor, makeCard, saveTheme, bizDate, colorsFromImage, sprite, drawPreview, createScene, addGuest, updateMsg, updatePrefs, sendCheer, watchCheers, setQuestion, removeGuest, watchGuests, SEATS, placeGuests, saveSeats, onScreen, drawLucky, setBest, setVip, issueCoupon, useCoupon, DEFAULT_MENU, MENU_NOTES, watchMenu, saveMenu, placeOrder, watchOrders, watchMyOrders, setOrderStatus, announceOrder, setGuestLast, celebrateBirthday, setNtfy, testNtfy, renotify, deleteOrder, markRealert, startGame, gameAct, watchGameActs, tenRank, watchRecipes, saveRecipe, recipeFor, enableSound, soundOn: () => SFX.on, watchMyCoupons, watchCoupons, couponState, myUid, makeGroupPhoto, tierOf, watchOwner, saveOwners, sayLive, LIVE };
})(window);
