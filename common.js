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
  // 꾸미기 확장 (look.ex = 5글자: 머리·상의·눈·소품·신발)
  const EX_RE = /^[0-9a-z]{5}$/;
  const HAIR_X = ['펌', '똥머리', '투블럭', '웨이브', '포니테일', '단정 앞머리', '바가지 머리', '스파이키', '양갈래 번', '집게핀 반묶음', '샤기컷', '크롭컷', '가르마펌', '댄디컷', '올백', '아이비리그컷', '리프컷', '예수컷'];   // 1~18 (7~11: 레트로·트렌드 · 12~18: 남자 트렌드 컷)
  const TOPS = ['티셔츠', '후드티', '셔츠·넥타이', '니트', '재킷', '멜빵·원피스', '트랙 져지', '하트 프린트 티', '야구 져지', '청재킷', '크롭 티', '오버핏 셋업'];   // 0~11 (6~11: 레트로·트렌드)
  const EYES = ['반짝 눈', '웃는 눈', '또렷한 눈', '졸린 눈'];                    // 0~3
  const ACC_X = ['선글라스', '비니', '귀걸이', '헤어밴드', '꽃핀', '틴트 선글라스', '버킷햇', '헤드폰', '반다나', '나비핀'];   // 1~10 (6~10: 레트로)
  const SHOES = ['흰 운동화', '검정 구두', '갈색 부츠', '빨간 운동화', '청키 스니커즈', '통굽 운동화', '어그 부츠'];   // 0~6 (4~6: 레트로)
  // 컨셉 테마: 2000년대 레트로 아이템 묶음 (꾸미기 화면에서 테마로 골라 보기)
  // 바지 핏: 신발 칸에 같이 저장 (신발 + 7 × 핏) → 0 기본 · 1 와이드 · 2 스키니
  const FITS = ['기본 핏', '와이드', '스키니'];
  const LOOK_THEMES = [{ k: 'trend', name: '🔥 요즘 핏', hx: [11, 3, 4], hxM: [16, 17, 18, 13, 14, 15, 12, 3], tp: [10, 11, 4, 3], ax2: [2, 7, 3], sh: [4, 0], fit: [1], hair: ['#1c1416', '#4a2e1f', '#c99a5b', '#e8e2da'], shirt: ['#f2ede6', '#1e1e24', '#c8b8a0', '#6b5a4a', '#8a9a7a'], pants: ['#1e1e24', '#c8b8a0', '#5a7ab0', '#6b5a4a'] },
    { k: 'y2k', name: '✨ 2000년대 레트로', hx: [7, 8, 9, 10, 11], hxM: [8, 7, 16, 3], tp: [6, 7, 8, 9], ax2: [6, 7, 8, 9, 10], sh: [4, 5, 6], fit: [2], hair: ['#1c1416', '#c99a5b', '#9c3f2a', '#e8e2da', '#5a4a8a'], shirt: ['#ef9fbf', '#6b8fd6', '#f2ede6', '#d99a3a', '#7a1f22'], pants: ['#5a7ab0', '#2a2f45', '#c8b8a0', '#f2ede6'] }];
  const SHOE_PAL = [['#f4f0ea', '#b9ada4'], ['#1e1a1e', '#3a3238'], ['#7a4a2a', '#4a2a16'], ['#e0303a', '#f4f0ea'], ['#f8f6f2', '#7ab8ff'], ['#1e1a1e', '#f4f0ea'], ['#c8a07a', '#8a6a4a']];
  const PANTS_COLORS = ['#2a2f45', '#1e1e24', '#5a7ab0', '#c8b8a0', '#5a4030', '#7a1f22', '#f2ede6'];
  const exOf = look => { const e = String(look && look.ex || ''); return EX_RE.test(e) ? [...e].map(c => parseInt(c, 36)) : [0, 0, 0, 0, 0]; };
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
    { k: 'valentine', name: '발렌타인데이' }, { k: 'white', name: '화이트데이' }, { k: 'rose', name: '로즈데이' }, { k: 'pepero', name: '빼빼로데이' },
    { k: 'seollal', name: '설날' }, { k: 'chuseok', name: '추석' }
  ];
  // 설날·추석은 음력이라 해마다 날짜가 달라요 (당일 기준 4일 전 ~ 2일 후 자동 적용)
  const LUNAR = { seollal: ['2027-02-07', '2028-01-27', '2029-02-13', '2030-02-03'], chuseok: ['2026-09-25', '2027-09-15', '2028-10-03', '2029-09-22', '2030-09-12'] };
  function resolveTheme(setting) {
    if (setting && setting !== 'auto' && THEMES.some(t => t.k === setting)) return setting;
    const d = new Date(Date.now() + 9 * 3600e3), m = d.getUTCMonth() + 1, day = d.getUTCDate();
    for (const [k, list] of Object.entries(LUNAR)) for (const ds of list) { const diff = (Date.UTC(d.getUTCFullYear(), m - 1, day) - Date.parse(ds + 'T00:00:00Z')) / 864e5; if (diff >= -4 && diff <= 2) return k; }
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
  const OWNER_COSTUMES = { halloween: ['vampire', 'witch'], christmas: ['santasuit', 'elf'], summer: ['shades+lei', 'lei+straw'], spring: ['flower', 'flower'],
    valentine: ['heartband', 'rosehair'], white: ['candy', 'heartband'], rose: ['rosehair', 'rosehair'], pepero: ['pepero', 'heartband'], seollal: ['hanbok3', 'hanbok'], chuseok: ['hanbok3', 'hanbok2'] };
  // 코스튬 뽑기: 손님마다 그날 한 번 (기기 uid + 영업일 기준, 닉네임을 바꿔도 그대로) · 일반 80% / 레어 17% / 시크릿 3%
  // 성별(캐릭터 체형) 맞춤: f=여성용, m=남성용, u=공용
  const LEGEND = [['idolm', 'm'], ['idolm2', 'm'], ['idolf', 'f'], ['idolf2', 'f'], ['king', 'm'], ['admiral', 'm'], ['silla', 'f'], ['nile', 'f'], ['bicorne', 'm'], ['caesar', 'm'], ['painter', 'm'], ['hwarang', 'm'], ['gwanggaeto', 'm'], ['genghis', 'm'], ['mozart', 'm'], ['shakespeare', 'm'], ['saimdang', 'f'], ['antoinette', 'f'], ['joan', 'f'], ['elizabeth', 'f']];   // 레전드 1%: 아이돌 무대의상 + 역사 속 인물 (실명 대신 별칭)
  const SECRET = [['goldking', 'm'], ['goldqueen', 'f'], ['lincoln', 'm'], ['gogh', 'm'], ['beethoven', 'm'], ['jangys', 'm'], ['nightingale', 'f'], ['curie', 'f'], ['yanggf', 'f'], ['nanseol', 'f']];   // 시크릿 3%: 황금 왕·여왕 + 역사 인물 (쿠폰 없음)   // 유니콘은 뺌 (2026-10-26)
  const STAR_R = [['trot', 'u'], ['rock', 'u'], ['rapper', 'u'], ['topstar', 'u']];   // 연예인 '컨셉' 레어 (실존 인물 아님)
  const GACHA = {
    default: { n: [['', 'u']], r: [['shades', 'u'], ['flower', 'f'], ['cat', 'f'], ['hero', 'm'], ['heartband', 'f'], ['straw', 'u'], ['scarf', 'u'], ['horns', 'm']] },
    halloween: { n: [['vampire', 'u'], ['witch', 'f'], ['mummy', 'u'], ['ghost', 'u'], ['pumpkinhead', 'u'], ['frank', 'm'], ['skeleton', 'u'], ['zombie', 'u'], ['werewolf', 'm'], ['devil', 'u'], ['reaper', 'u'], ['jiangshi', 'u'], ['cat', 'f'], ['pirate', 'u']],
      r: [['hero', 'm'], ['villain', 'u'], ['starhero', 'u'], ['plague', 'u'], ['gwishin', 'f'], ['astronaut', 'u'], ['robot', 'u'], ['alien', 'u']] },
    christmas: { n: [['santasuit', 'u'], ['antler', 'u'], ['elf', 'u'], ['sweater', 'u'], ['earmuff', 'f'], ['scarf', 'u']], r: [['snowman', 'u'], ['ginger', 'u'], ['xtree', 'u']] },
    summer: { n: [['swim+shades', 'u'], ['swim+straw', 'u'], ['swim+lei', 'u'], ['swim', 'u']], r: [['swim+shades+lei', 'u'], ['swim+straw+lei', 'u']] },
    spring: { n: [['flower', 'u'], ['lei', 'u']], r: [['wings', 'f'], ['heartband', 'f'], ['straw', 'u'], ['shades', 'm']] },
    valentine: { n: [['heartband', 'u'], ['rosehair', 'f']], r: [['wings', 'u'], ['flower', 'f'], ['shades', 'm']] },
    white: { n: [['candy', 'u'], ['heartband', 'u']], r: [['wings', 'u'], ['shades', 'm']] },
    rose: { n: [['rosehair', 'u'], ['heartband', 'u']], r: [['wings', 'u'], ['flower', 'f']] },
    pepero: { n: [['pepero', 'u'], ['heartband', 'u']], r: [['wings', 'u'], ['shades', 'm']] },
    seollal: { n: [['hanbok', 'u'], ['hanbok2', 'u'], ['hanbok3', 'u'], ['bokjumeoni+hanbok', 'u']], r: [['gat', 'm'], ['jokduri', 'f'], ['bokjumeoni+hanbok3', 'u']] },
    chuseok: { n: [['hanbok', 'u'], ['hanbok2', 'u'], ['hanbok3', 'u']], r: [['gat', 'm'], ['jokduri', 'f'], ['rabbit+hanbok2', 'u']] }
  };
  const COSTUMES = Object.fromEntries(Object.entries(GACHA).filter(([k]) => k !== 'default').map(([k, v]) => [k, v.n.map(x => x[0])]));
  // 코스튬 설명 (뽑기 카드에 표시)
  const COS_DESC = { king: '한글을 만든 세종대왕처럼 곤룡포에 익선관을 썼어요', admiral: '바다를 지킨 이순신 장군처럼 갑옷에 붉은 망토를 둘렀어요', silla: '신라의 선덕여왕처럼 나뭇가지 금관을 썼어요',
    nile: '이집트의 클레오파트라처럼 황금 머리장식과 목걸이를 했어요', bicorne: '유럽을 호령한 나폴레옹처럼 이각모에 견장 군복을 입었어요', caesar: '로마의 율리우스 카이사르처럼 월계관을 쓰고 토가를 둘렀어요',
    painter: '모나리자를 그린 레오나르도 다빈치처럼 베레모에 팔레트를 들었어요', hwarang: '화랑 출신 신라 명장 김유신처럼 깃털 머리띠에 칼을 찼어요',
    gwanggaeto: '고구려 땅을 넓힌 광개토대왕처럼 금관에 붉은 갑옷을 입었어요', genghis: '초원을 하나로 묶은 칭기즈칸처럼 털모자에 전통 옷을 입었어요',
    mozart: '천재 음악가 모차르트처럼 흰 가발에 붉은 연미복을 입었어요', shakespeare: '대문호 셰익스피어처럼 주름 칼라에 깃펜을 들었어요',
    saimdang: '시와 그림에 뛰어났던 신사임당처럼 쪽머리에 비녀를 꽂고 한복을 입었어요', antoinette: '프랑스의 마리 앙투아네트처럼 높이 올린 머리에 분홍 드레스를 입었어요',
    joan: '프랑스를 구한 잔 다르크처럼 은빛 갑옷에 깃발을 들었어요', elizabeth: '영국의 엘리자베스 1세처럼 레이스 칼라에 진주 드레스를 입었어요',
    idolm: '무대 조명을 받는 아이돌 무대의상이에요', idolf: '무대 조명을 받는 아이돌 무대의상이에요', idolm2: '벨벳 무대의상의 아이돌이에요', idolf2: '벨벳 무대의상의 아이돌이에요', goldking: '온몸이 금빛인 황금 왕이에요', goldqueen: '다이아처럼 반짝이는 황금 여왕이에요' };
  const COS_NAME = { lincoln: '에이브러햄 링컨', gogh: '빈센트 반 고흐', beethoven: '베토벤', jangys: '장영실', nightingale: '나이팅게일', curie: '마리 퀴리', yanggf: '양귀비', nanseol: '허난설헌', king: '세종대왕', admiral: '이순신 장군', silla: '선덕여왕', nile: '클레오파트라', bicorne: '나폴레옹', caesar: '율리우스 카이사르', painter: '레오나르도 다빈치', hwarang: '김유신', gwanggaeto: '광개토대왕', genghis: '칭기즈칸', mozart: '모차르트', shakespeare: '셰익스피어', saimdang: '신사임당', antoinette: '마리 앙투아네트', joan: '잔 다르크', elizabeth: '엘리자베스 1세', idolm: '아이돌 (블랙·남)', idolf: '아이돌 (블랙·여)', idolm2: '아이돌 (벨벳·남)', idolf2: '아이돌 (벨벳·여)', trot: '트로트 스타', rock: '록스타', rapper: '래퍼', topstar: '톱배우', goldking: '황금 왕', goldqueen: '황금 여왕', unicorn: '유니콘', hero: '가면 히어로', villain: '마왕', starhero: '별 히어로', plague: '역병 의사', gwishin: '처녀귀신', astronaut: '우주비행사', robot: '로봇', alien: '외계인',
    vampire: '뱀파이어', witch: '마녀', mummy: '미라', ghost: '유령', pumpkinhead: '호박머리', frank: '괴물', skeleton: '해골', zombie: '좀비', werewolf: '늑대인간', devil: '꼬마 악마', reaper: '저승사자', jiangshi: '강시', cat: '고양이', pirate: '해적',
    shades: '선글라스', flower: '꽃핀', heartband: '하트 머리띠', straw: '밀짚모자', scarf: '목도리', horns: '뿔', snowman: '눈사람', ginger: '진저브레드', xtree: '트리', wings: '천사 날개', santasuit: '산타', antler: '루돌프', elf: '요정', sweater: '스웨터', earmuff: '귀마개', swim: '수영복', hanbok: '색동 한복', hanbok2: '파스텔 한복', hanbok3: '단아한 한복', bokjumeoni: '복주머니', gat: '선비 (갓·도포)', jokduri: '족두리 신부', rabbit: '달토끼', lei: '꽃목걸이', rosehair: '장미', candy: '막대사탕', pepero: '빼빼로', party: '고깔모자' };
  // 사장 코스튬 고르기: '' = 시즌 기본(바텐더 복장 + 시즌 의상), 'none' = 바텐더 복장만, 그 외 = 고른 코스튬
  const OWNER_COS = (() => { const seen = new Set(), out = []; const add = (tier, l) => l.forEach(([k]) => { if (!k || seen.has(k) || k.includes('+')) return; seen.add(k); out.push({ k, tier, name: COS_NAME[k] || k }); });
    add('레전드', LEGEND); add('시크릿', SECRET); add('레어', STAR_R); add('레어', GACHA.halloween.r); add('할로윈', GACHA.halloween.n); add('크리스마스', GACHA.christmas.n.concat(GACHA.christmas.r)); add('설날·추석', GACHA.seollal.n.concat(GACHA.seollal.r, GACHA.chuseok.r));
    Object.entries(GACHA).forEach(([th, g]) => add('소품', g.r.concat(g.n))); return out; })();
  const OWNER_COS_SET = new Set(OWNER_COS.map(x => x.k));
  function ownerCostume(o, i, th) { const pick = o && o.cos; if (pick && pick !== 'none' && OWNER_COS_SET.has(pick)) return pick;
    return [pick === 'none' ? '' : (OWNER_COSTUMES[th] || [])[i] || '', String((o && o.style) || '')[0] === 'f' ? 'barapron' : 'barvest'].filter(Boolean).join('+'); }
  const fnv = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };
  function drawCostume(theme, seed, style) {
    const g = GACHA[theme] || GACHA.default, sex = String(style || 'm')[0] === 'f' ? 'f' : 'm';
    const ok = l => l.filter(x => x[1] === 'u' || x[1] === sex), roll = fnv(seed + '|rar') % 1000;
    const rar = roll < 10 ? 'L' : roll < 40 ? 's' : 'n', pool = rar === 'L' ? ok(LEGEND) : rar === 's' ? ok(SECRET) : [];   // 뽑기는 레전드·시크릿만 (나머지는 꽝 → 시즌 코스튬은 주사위로)
    const k = pool.length ? pool[fnv(seed + '|pick') % pool.length][0] : '';
    const base = k.replace('swim+', '').split('+')[0];
    return { k, rar: k ? rar : 'n', name: COS_NAME[base] || (k ? '시즌 코스튬' : ''), desc: COS_DESC[base] || '' };
  }
  // 시즌 코스튬 주사위: n(1~99)번째 시즌 의상 (성별에 맞는 것만)
  function seasonPool(theme, style) { const g = GACHA[theme] || GACHA.default, sex = String(style || 'm')[0] === 'f' ? 'f' : 'm', seen = new Set();
    return g.n.concat(g.r).filter(x => (x[1] === 'u' || x[1] === sex) && x[0] && !seen.has(x[0]) && seen.add(x[0])).map(x => x[0]); }
  function seasonCostume(theme, n, style) { const pool = seasonPool(theme, style); if (!pool.length || !(n >= 1)) return { k: '', rar: 'n', name: '' };
    const k = pool[(n - 1) % pool.length], base = k.replace('swim+', '').split('+')[0]; return { k, rar: 'n', name: COS_NAME[base] || '시즌 코스튬', dice: true }; }
  function rollSeason(theme, style, cur) { const pool = seasonPool(theme, style); if (!pool.length) return 0; let n; do { n = 1 + Math.floor(Math.random() * pool.length); } while (pool.length > 1 && n === cur); return n; }
  function cosOf(theme, g, day) { if (g.cos === true) return drawCostume(theme, cosSeed(g, day), g.style); if (Number.isInteger(g.cos) && g.cos > 0) return seasonCostume(theme, g.cos, g.style);
    if (g.npc) { const d = drawCostume(theme, cosSeed(g, day), g.style); return d.k ? d : seasonCostume(theme, 1 + fnv(cosSeed(g, day) + '|npc') % 97, g.style); } return { k: '', rar: 'n', name: '' }; }
  const cosSeed = (g, day) => g.uid ? g.uid + '|' + (day || bizDate()) : (g.id || g.nick || '');
  const costumeFor = (theme, seed, style) => drawCostume(theme, seed, style).k;
  const BLOCK = ['시발', '씨발', 'ㅅㅂ', '병신', 'ㅂㅅ', '좆', '개새', '섹스', '꺼져', '죽어'];
  const clean = s => { const t = String(s || '').replace(/\s/g, '').replace(/섹스온더비치/g, ''); return !BLOCK.some(w => t.includes(w)); };
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
      if (on('villain')) { shirt = '#3a1a4a'; pants = '#1a1020'; }
      if (on('starhero')) { shirt = '#1f7a8a'; pants = '#1f7a8a'; }
      if (on('plague')) { shirt = '#1a1614'; pants = '#1a1614'; }
      if (on('gwishin')) { skin = '#e8e6e2'; shirt = '#f2f0ea'; pants = '#f2f0ea'; hair = '#0e0c10'; }
      if (on('astronaut')) { shirt = '#eef0f4'; pants = '#e2e6ec'; }
      if (on('robot')) { shirt = '#9aa4b0'; pants = '#7a8490'; }
      if (on('goldking')) { shirt = '#e0a828'; pants = '#5a1018'; }
      if (on('goldqueen')) { shirt = '#f06aa8'; }
      const fs0 = style[0] === 'f';
      if (on('idolm')) { shirt = '#1c1c24'; pants = '#141418'; }
      if (on('idolf')) { shirt = '#18181e'; pants = '#18181e'; }
      if (on('barvest')) { shirt = '#f4f2ee'; }
      if (on('hanbok')) { shirt = fs0 ? '#f6cc4a' : '#3a7ad0'; pants = fs0 ? '#d6262e' : '#f2e8d0'; }
      if (on('hanbok2')) { shirt = fs0 ? '#ffd6e4' : '#c8e8dc'; pants = fs0 ? '#8ad4c4' : '#f4ead8'; }
      if (on('hanbok3')) { shirt = '#f4ecdc'; pants = '#2a3a6a'; }
      if (on('gat')) { shirt = '#f6f2ea'; pants = '#f6f2ea'; }
      if (on('jokduri')) { shirt = '#2a8a5a'; pants = '#c8202a'; }
      if (on('idolm2') || on('idolf2')) { shirt = '#55642c'; pants = '#7a9ac8'; }
      if (on('trot')) { shirt = '#e8b830'; pants = '#e8b830'; }
      if (on('rock')) { shirt = '#1c1c22'; pants = '#2a2a3a'; }
      if (on('rapper')) { shirt = '#f2f2f2'; pants = '#3a5a8a'; }
      if (on('topstar')) { shirt = fs0 ? '#c8102a' : '#16161c'; pants = fs0 ? '#c8102a' : '#16161c'; }
      if (on('unicorn')) { shirt = '#f4ecff'; pants = '#b8a8f0'; }
      if (on('alien')) { skin = '#8fd47a'; hair = '#8fd47a'; shirt = '#4a4a5a'; }
      if (on('santasuit')) { shirt = '#d6262e'; pants = '#d6262e'; }
      if (on('elf')) { shirt = '#2a8a4a'; pants = '#d6262e'; }
      if (on('snowman')) { shirt = '#f6f8fc'; pants = '#e8ecf4'; }
      if (on('ginger')) { skin = '#c8844a'; shirt = '#b8743c'; pants = '#a8662e'; }
      if (on('sweater')) { shirt = '#c8262e'; }
      if (on('xtree')) { shirt = '#2a8a4a'; } }
    const dk = DRINKS.some(d => d.k === drink) ? drink : '';
    const exA = exOf(look), key = [hair, skin, shirt, pants, style, exA.join(''), sit ? 1 : 0, dk, frame, costume].join('|');
    if (cache.has(key)) return cache.get(key);
    const fem = style[0] === 'f', [hx, tp, ey, ax2, shRaw] = exA, sh = shRaw % 7, hs = hx ? ([0, 0, 0, 0, 2, 0, 1, 0, 0, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0][hx] || 0) : +style[1], bt = +style[2], ac = ax2 ? 0 : +style[3];
    let fit = Math.floor(shRaw / 7) % 3;
    if (tp === 9 && !costume) shirt = '#4f6f9f';   // 청재킷: 데님 색 고정
    if (tp === 11 && !costume) { pants = shade(shirt, .92); fit = 1; }   // 오버핏 셋업: 같은 색 와이드 바지
    const cw = 30, ch = sit ? 48 : 52, c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const x = c.getContext('2d');
    const P = (px, py, w, h, col) => { x.fillStyle = col; x.fillRect(px + 2, py + 8, w, h); };
    const inHead = (px, py) => ((px - 9.5) / 8.6) ** 2 + ((py - 9) / 7.9) ** 2 <= 1;
    const G = (gx, gy, rows, pal) => rows.forEach((r, j) => [...r].forEach((ch, i) => { if (pal[ch]) P(gx + i, gy + j, 1, 1, pal[ch]); }));   // 픽셀 도안 찍기
    const GOLD = { Y: '#ffd84a', H: '#fff6c0', D: '#c48a1a', d: '#8a5a10', R: '#e0203a', r: '#ff9aa8', B: '#2a6ae0', b: '#a8d0ff', E: '#18b060', e: '#9af0c0', W: '#fffdf4', K: '#2a2226', w: '#fff8e0', P: '#ff5ab0', p: '#ffd0ec' };
    const sd = shade(shirt, .78), pd = shade(pants, .8);
    if (hs === 2) P(2, 6, 16, fem ? 20 : 16, hair);                       // 뒷머리
    const parts = costume.split('+'), has = k => parts.includes(k), swim = has('swim');
    const csAll = parts.filter(k => k !== 'swim');
    // 뒤쪽 망토·장비 (주름·안감·외곽 명암)
    const cape = (C, c, L, inner, flare) => { for (let yy = 16; yy <= 36; yy++) { const sp = flare ? Math.min(2, (yy - 16) >> 3) : 0, x0 = -1 - sp, w = 22 + sp * 2; P(x0, yy, w, 1, C); P(x0, yy, 1, 1, L); P(x0 + w - 1, yy, 1, 1, c); if (yy > 19 && yy % 2) { P(2, yy, 1, 1, c); P(17, yy, 1, 1, c); } } if (inner) { P(0, 16, 3, 4, inner); P(17, 16, 3, 4, inner); } };
    if (has('cape') || has('vampire')) cape('#1e1420', '#0c080e', '#3a2a40', '#a0202a', true);
    if (has('reaper')) { for (let yy = 14; yy <= 37; yy++) { const sp = (yy - 14) >> 3; P(-sp, yy, 20 + sp * 2, 1, '#1a161e'); P(-sp, yy, 1, 1, '#2e2834'); P(19 + sp, yy, 1, 1, '#0c0a0e'); if (yy % 3 === 0) P(9, yy, 1, 1, '#0c0a0e'); } }
    if (has('goldking') || has('goldqueen')) { const q = has('goldqueen'), C = q ? '#7a34c0' : '#b81828', c = q ? '#4e1a86' : '#760c18', L = q ? '#a868ec' : '#ee4a50';   // 망토: 주름 + 금테
      for (let yy = 16; yy <= 37; yy++) { const sp = Math.min(3, (yy - 16) >> 2), x0 = -1 - sp, w = 22 + sp * 2; P(x0, yy, w, 1, C); P(x0, yy, 1, 1, L); P(x0 + w - 1, yy, 1, 1, c); if (yy > 20) { P(1 - (sp >> 1), yy, 1, 1, c); P(18 + (sp >> 1), yy, 1, 1, c); } }
      P(-4, 37, 28, 1, '#ffd84a'); P(-4, 38, 28, 1, '#c48a1a'); }
    if (has('unicorn')) { const M = ['#ff7aa8', '#ffb46a', '#ffe46a', '#6ae0a8', '#6ab8ff', '#b48aff'];   // 뒤로 흐르는 무지개 갈기
      M.forEach((col, i) => { P(0, 4 + i * 3, 2, 3, col); P(18, 4 + i * 3, 2, 3, col); P(-1, 6 + i * 3, 1, 2, col); P(20, 6 + i * 3, 1, 2, col); }); }
    if (has('villain')) cape('#2a1036', '#16081e', '#5a2a7a', '#a01a30', true);
    if (has('starhero')) { cape('#ff8a2a', '#c85a10', '#ffb46a', '', false); }
    if (has('gwishin')) { P(2, 6, 16, 24, '#0c0a10'); P(4, 12, 1, 14, '#2a3a5a'); P(15, 10, 1, 16, '#2a3a5a'); }
    if (has('astronaut')) { G(1, 18, ['.SSSSSSSSSSSSSSSS.', 'SsSSSSSSSSSSSSSSsS', 'SsSSSSSSSSSSSSSSsS', 'SsSSSSSSSSSSSSSSsS', 'SsSSSSSSSSSSSSSSsS', 'SsSSSSSSSSSSSSSSsS', 'SsSSSSSSSSSSSSSSsS', 'SsSSSSSSSSSSSSSSsS', '.ssssssssssssssss.'], { S: '#c8ccd4', s: '#8a90a0' }); }
    if (has('hero')) cape('#d6262e', '#8a1018', '#ff5a5a', '#ffd23a', true);
    if (has('admiral')) cape('#a81c22', '#6a0c10', '#d8403a', '', true);
    if (has('wings')) { G(-2, 15, ['.WW', 'WWw', 'WWw', 'WWw', 'WWw', '.Ww', '..W'], { W: '#ffffff', w: '#d6def0' }); G(19, 15, ['WW.', 'wWW', 'wWW', 'wWW', 'wWW', 'wW.', 'W..'], { W: '#ffffff', w: '#d6def0' }); }
    P(8, 16, 4, 2, skin);                                                  // 목
    // 상체 (수영복이면 피부 + 비키니/수영바지)
    const top = swim ? skin : shirt, topD = swim ? shade(skin, .9) : sd, sw = shirt, swd = shade(shirt, .75);
    if (fem) { P(5, 18, 10, 6, top); P(6, 24, 8, 4, top); P(12, 18, 3, 6, topD); P(12, 24, 2, 4, topD); }
    else { P(4, 18, 12, 10, top); P(13, 18, 3, 10, topD); }
    if (swim && fem) { P(6, 20, 3, 3, sw); P(11, 20, 3, 3, sw); P(9, 21, 2, 1, swd); P(6, 19, 1, 1, swd); P(13, 19, 1, 1, swd); }
    if (swim && !fem) { P(7, 21, 1, 1, shade(skin, .82)); P(12, 21, 1, 1, shade(skin, .82)); P(9, 25, 2, 1, shade(skin, .85)); }
    const dress = fem && tp === 5 && !swim, cw2 = fem ? [5, 14] : [4, 15];
    if (!swim && tp !== 1 && tp !== 3) { P(8, 18, 4, 1, skin); P(9, 19, 2, 1, skin); }             // 깃
    const noCos = !csAll.some(Boolean);
    if (!swim && noCos) {
      if (tp === 1) { P(6, 17, 8, 2, sd); P(7, 17, 6, 1, shade(shirt, .65)); P(8, 19, 1, 3, '#f4f0ea'); P(11, 19, 1, 3, '#f4f0ea'); P(fem ? 7 : 6, 24, fem ? 6 : 8, 3, sd); P(fem ? 7 : 6, 24, fem ? 6 : 8, 1, shade(shirt, .65)); }   // 후드티: 모자·끈·주머니
      if (tp === 2) { const tie = /^#(?:[c-f][0-9a-f]|b[89a-f])[0-6]/i.test(shirt) ? '#2a3a6a' : '#c8303a'; P(7, 18, 2, 2, '#f8f6f2'); P(11, 18, 2, 2, '#f8f6f2'); P(9, 18, 2, 1, shade(tie, .8)); P(9, 19, 2, 5, tie); P(10, 20, 1, 3, shade(tie, 1.25)); P(9, 24, 2, 1, shade(tie, .7)); }   // 셔츠 깃 + 넥타이
      if (tp === 3) { P(7, 18, 6, 1, shade(shirt, .8)); for (let yy = 20; yy < 27; yy += 2) for (let xx = cw2[0] + 1; xx < cw2[1]; xx += 2) P(xx, yy, 1, 1, shade(shirt, .88)); P(cw2[0], 27, cw2[1] - cw2[0] + 1, 1, shade(shirt, .75)); }   // 니트: 짜임 + 밑단
      if (tp === 4) { P(8, 18, 4, 10, '#f4f0ea'); P(7, 18, 1, 5, shade(shirt, .6)); P(12, 18, 1, 5, shade(shirt, .6)); P(8, 18, 1, 2, shade(shirt, .75)); P(11, 18, 1, 2, shade(shirt, .75)); P(fem ? 6 : 5, 25, 2, 1, shade(shirt, .7)); }   // 재킷: 안에 흰 티 + 라펠
      if (tp === 5 && !fem) { P(6, 21, 8, 7, pants); P(6, 18, 1, 3, pants); P(13, 18, 1, 3, pants); P(7, 21, 1, 1, '#e0b040'); P(12, 21, 1, 1, '#e0b040'); P(8, 23, 4, 2, pd); }   // 멜빵
      if (tp === 6) { P(7, 17, 6, 1, shade(shirt, .6)); P(10, 18, 1, 10, '#f4f0ea'); P(10, 19, 1, 1, '#c8c0b8'); P(cw2[0], 18, 1, 10, '#f4f0ea'); P(cw2[1], 18, 1, 10, '#f4f0ea'); P(cw2[0], 27, cw2[1] - cw2[0] + 1, 1, shade(shirt, .7)); }   // 트랙 져지: 지퍼 + 옆선
      if (tp === 7) { const hc = /^#(?:e|f)[0-9a-f]9/i.test(shirt) ? '#ffffff' : '#ff5a8a'; G(7, 20, ['.H.H.', 'HHHHH', '.HHH.', '..H..'], { H: hc }); }   // 하트 프린트 티
      if (tp === 8) { for (let xx = cw2[0] + 1; xx < cw2[1]; xx += 2) P(xx, 18, 1, 10, shade(shirt, .84)); P(7, 18, 6, 1, '#f4f0ea'); [20, 23, 26].forEach(yy => P(10, yy, 1, 1, '#f4f0ea')); P(6, 21, 2, 2, '#f4f0ea'); }   // 야구 져지: 핀스트라이프 + 단추
      if (tp === 9) { P(8, 18, 4, 10, '#f4f0ea'); P(7, 18, 1, 9, '#3a5680'); P(12, 18, 1, 9, '#3a5680'); P(fem ? 6 : 5, 21, 2, 2, '#6a8ab8'); P(fem ? 12 : 13, 21, 2, 2, '#6a8ab8'); P(fem ? 6 : 5, 21, 2, 1, '#2e4466'); P(fem ? 12 : 13, 21, 2, 1, '#2e4466'); P(cw2[0], 27, cw2[1] - cw2[0] + 1, 1, '#e0b040'); }   // 청재킷: 흰 티 + 가슴 주머니 + 스티치
      if (tp === 10 && fem) { const sk2 = shade(skin, .95); P(6, 24, 8, 4, skin); P(12, 24, 2, 4, sk2); P(6, 23, 8, 1, shade(shirt, .8)); P(9, 26, 2, 1, shade(skin, .85)); }   // 크롭 티 (여자): 배꼽 위까지
      if (tp === 10 && !fem) { P(3, 18, 14, 11, shirt); P(14, 18, 3, 11, sd); P(7, 18, 6, 1, shade(shirt, .8)); P(3, 28, 14, 1, shade(shirt, .82)); }   // 오버핏 반팔 티 (남자): 박시하고 길게
      if (tp === 11) { const sd2 = shade(shirt, .8); if (fem) { P(4, 18, 12, 11, shirt); P(13, 18, 3, 11, sd2); } else { P(3, 18, 14, 11, shirt); P(14, 18, 3, 11, sd2); } P(8, 18, 4, 9, '#f4f0ea'); P(7, 18, 1, 6, shade(shirt, .62)); P(12, 18, 1, 6, shade(shirt, .62)); P(10, 23, 1, 1, shade(shirt, .5)); P(10, 26, 1, 1, shade(shirt, .5)); }   // 오버핏 셋업: 박시한 재킷
    }
    const ax = fem ? 3 : 2;
    const raise = frame === 's' || frame === 'k';
    const arm = swim ? skin : shirt, armD = swim ? shade(skin, .9) : sd;
    const clap = frame === 'c' || frame === 'C';
    if (clap) { const hx = frame === 'c' ? 0 : 2;   // 박수: 두 손을 가슴 앞에서 모았다 폈다
      P(ax, 19, 2, 4, arm); P(ax + 1, 23, 6 - hx - ax + 2, 2, arm); P(8 - hx, 21, 2, 3, skin);
      P(19 - ax - 1, 19, 2, 4, armD); P(11 + hx, 23, 19 - ax - 12 - hx, 2, armD); P(10 + hx, 21, 2, 3, skin); }
    else P(ax, 19, 2, 8, arm), P(ax, 27, 2, 2, skin);                       // 왼팔
    if (clap) {} else if (!raise) { P(19 - ax - 1, 19, 2, 8, armD); P(19 - ax - 1, 27, 2, 2, skin); }   // 오른팔
    else { P(19 - ax - 1, 19, 2, 3, armD); P(19 - ax, 17, 2, 3, armD); P(19 - ax, 15, 2, 2, skin); }
    if (!swim && noCos && tp === 6 && !clap) { P(ax, 19, 1, 8, '#f4f0ea'); if (!raise) P(19 - ax, 19, 1, 8, '#f4f0ea'); }   // 트랙 져지 소매 줄
    if (!swim && noCos && tp === 10 && !clap) { if (fem) { P(ax, 23, 2, 4, skin); if (!raise) P(19 - ax - 1, 23, 2, 4, shade(skin, .95)); } else { P(ax - 1, 19, 3, 5, arm); P(ax, 24, 2, 3, skin); if (!raise) { P(19 - ax - 1, 19, 3, 5, armD); P(19 - ax - 1, 24, 2, 3, shade(skin, .95)); } } }   // 반팔: 여자 크롭 · 남자 오버핏 (넓은 소매)
    if (!swim && noCos && tp === 11 && !clap) { P(ax - 1, 19, 3, 9, arm); P(ax - 1, 28, 3, 1, shade(arm, .75)); if (!raise) { P(19 - ax - 1, 19, 3, 9, armD); P(19 - ax - 1, 28, 3, 1, shade(armD, .75)); } }   // 오버핏 셋업: 넉넉한 소매
    // 하체
    if (swim) {
      const legTop = sit ? 28 : 28;
      if (fem) { P(6, 28, 8, 2, sw); P(7, 30, 6, 1, sw); }
      else { P(5, 28, 10, 5, sw); P(5, 30, 10, 1, '#ffffff'); P(10, 31, 1, 2, swd); }
      if (!sit) { const ly = fem ? 30 : 33; P(6, ly, 3, 40 - ly, skin); P(11, ly, 3, 40 - ly, shade(skin, .92)); P(5, 40, 4, 1, '#ffffff'); P(11, 40, 4, 1, '#ffffff'); P(5, 41, 4, 1, sw); P(11, 41, 4, 1, sw); }
      else { P(5, fem ? 30 : 33, 10, 1, skin); P(6, 31, 3, 6, skin); P(11, 31, 3, 6, shade(skin, .92)); P(5, 37, 4, 1, sw); P(11, 37, 4, 1, sw); if (!fem) { P(5, 28, 10, 4, sw); P(5, 30, 10, 1, '#ffffff'); } }
    } else if (!sit) {
      const [SH1, SH2] = SHOE_PAL[sh] || SHOE_PAL[0];
      if (dress) { P(5, 28, 10, 2, shirt); P(4, 30, 12, 3, shirt); P(3, 33, 14, 2, shirt); P(3, 34, 14, 1, sd); P(7, 35, 2, 4, skin); P(11, 35, 2, 4, shade(skin, .92)); }
      else if (bt === 0 && fit === 1) { P(5, 28, 10, 2, pants); P(4, 30, 6, 10, pants); P(10, 30, 6, 10, pd); P(10, 29, 1, 11, shade(pants, .65)); P(4, 39, 12, 1, shade(pants, .75)); }   // 와이드 바지
      else if (bt === 0 && fit === 2) { P(6, 28, 8, 2, pants); P(7, 30, 3, 10, pants); P(10, 30, 3, 10, pd); P(10, 29, 1, 11, shade(pants, .65)); }   // 스키니
      else if (bt === 0) { P(6, 28, 4, 12, pants); P(10, 28, 4, 12, pd); P(10, 28, 1, 12, shade(pants, .65)); }
      else { P(5, 28, 10, 3, pants); P(4, 31, 12, 3, pants); P(4, 33, 12, 1, pd); P(7, 34, 2, 6, skin); P(11, 34, 2, 6, skin); }
      if (bt === 0 && fit === 1) { P(5, 40, 4, 1, SH1); P(11, 40, 4, 1, SH1); P(5, 41, 5, 1, SH2); P(10, 41, 5, 1, SH2); } else {
      P(5, 39, 5, 2, SH1); P(10, 39, 5, 2, SH1); P(5, 41, 5, 1, SH2); P(10, 41, 5, 1, SH2); if (sh === 0 || sh === 3) { P(7, 39, 1, 1, shade(shirt, .9)); P(12, 39, 1, 1, shade(shirt, .9)); }
      if (sh === 4) { P(4, 40, 6, 2, SH1); P(10, 40, 6, 2, SH1); P(4, 41, 6, 1, SH2); P(10, 41, 6, 1, SH2); P(6, 39, 2, 1, '#ff8ab0'); P(12, 39, 2, 1, '#ff8ab0'); }   // 청키
      if (sh === 5) { P(5, 41, 5, 1, SH2); P(10, 41, 5, 1, SH2); P(5, 40, 5, 1, SH2); P(10, 40, 5, 1, SH2); }   // 통굽
      if (sh === 6) { P(5, 36, 5, 4, SH1); P(10, 36, 5, 4, SH1); P(5, 36, 5, 1, '#efe2cc'); P(10, 36, 5, 1, '#efe2cc'); }   // 어그 부츠
      }
    } else {
      const [SH1, SH2] = SHOE_PAL[sh] || SHOE_PAL[0];
      if (dress) { P(4, 28, 12, 4, shirt); P(4, 31, 12, 1, sd); P(6, 32, 3, 5, skin); P(11, 32, 3, 5, skin); }
      else if (bt === 0 && fit === 1) { P(4, 28, 12, 4, pants); P(5, 32, 4, 5, pants); P(11, 32, 4, 5, pd); }
      else if (bt === 0 && fit === 2) { P(5, 28, 10, 4, pants); P(6, 32, 2, 5, pants); P(12, 32, 2, 5, pd); }
      else if (bt === 0) { P(5, 28, 10, 4, pants); P(6, 32, 3, 5, pants); P(11, 32, 3, 5, pd); }
      else { P(4, 28, 12, 4, pants); P(6, 32, 3, 5, skin); P(11, 32, 3, 5, skin); }
      P(5, 37, 4, 2, SH1); P(11, 37, 4, 2, SH1); P(5, 38, 4, 1, SH2); P(11, 38, 4, 1, SH2);
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
    const hD = shade(hair, .8), hL = shade(hair, 1.3);
    if (hx === 1) { for (let an = 0; an < Math.PI * 2; an += Math.PI / 9) { const cx = 9.5 + Math.cos(an) * 10.2, cy = 7.5 + Math.sin(an) * 9.4; if (cy > 13) continue; P(Math.round(cx) - 1, Math.round(cy) - 1, 3, 3, hair); P(Math.round(cx), Math.round(cy) - 1, 1, 1, hL); } [[3, 2], [7, 1], [11, 2], [15, 3], [5, 4], [9, 3], [13, 4]].forEach(([a, b2]) => { P(a, b2, 1, 1, hD); P(a + 1, b2, 1, 1, hL); }); }   // 펌: 머리 둘레를 따라 뽀글뽀글
    if (hx === 2) { P(7, -4, 6, 4, hair); P(8, -5, 4, 1, hair); P(8, -4, 2, 1, hL); P(7, 0, 6, 1, shade(hair, .65)); }   // 똥머리
    // 남자 컷 공통: 머리 볼륨을 줄여 두상에 붙이고(tight), 귀가 보이게 옆머리 정리(ears), 앞머리를 지우고 이마 보이기(brow)
    const skinPx = (px, py) => { if (inHead(px, py)) P(px, py, 1, 1, (py >= 16 || !inHead(px + 2, py)) ? shade(skin, .93) : skin); else clr(px, py); };
    const tight = () => { for (let py = -2; py <= 9; py++) for (let px = -2; px < 22; px++) if (!inHead(px, py)) clr(px, py); [[0, 6, 13], [1, 3, 16], [2, 2, 17], [3, 1, 18]].forEach(([py, a2, b2]) => { for (let px = a2; px <= b2; px++) if (!inHead(px, py)) P(px, py, 1, 1, py === 0 ? hD : hair); }); };
    const ears = top => { for (let py = top; py <= 12; py++) for (const px of [0, 1, 2, 17, 18, 19]) skinPx(px, py); P(0, 10, 1, 2, shade(skin, .86)); P(19, 10, 1, 2, shade(skin, .86)); P(2, top, 1, 2, hD); P(17, top, 1, 2, hD); };
    const brow = (a, b2) => { for (let px = 3; px <= 16; px++) for (let py = a; py <= b2; py++) skinPx(px, py); };
    const mCut = !fem && [3, 11, 12, 13, 14, 15, 16].includes(hx);
    if (mCut) tight();
    if (hx === 3 && !fem) { brow(6, 7); for (let px = 0; px <= 19; px++) for (let py = 5; py <= 12; py++) if ((px <= 2 || px >= 17)) skinPx(px, py); P(0, 6, 3, 5, shade(skin, .8)); P(17, 6, 3, 5, shade(skin, .8)); P(3, -1, 14, 2, hair); P(4, -2, 11, 1, hair); P(4, 5, 12, 1, hair); P(6, 5, 2, 1, hD); P(11, 5, 2, 1, hD); P(5, -1, 5, 1, hL); }   // 남자 투블럭: 옆은 밀고 위는 볼륨, 이마 보이게
    else if (hx === 3) { P(0, 7, 2, 6, shade(skin, .82)); P(18, 7, 2, 6, shade(skin, .82)); P(0, 7, 1, 6, shade(hair, .75)); P(19, 7, 1, 6, shade(hair, .75)); P(2, -2, 16, 3, hair); P(3, -3, 13, 1, hair); P(4, -2, 6, 1, hL); }   // 투블럭: 옆은 짧게 밀고, 위는 볼륨
    if (hx === 4) { for (let yy = 8; yy < 22; yy++) { const o = (yy >> 1) % 2; P(-1 + o, yy, 2, 1, hair); P(19 - o, yy, 2, 1, hair); } P(0, 21, 2, 1, hD); P(18, 21, 2, 1, hD); }   // 긴 웨이브
    if (hx === 5) { P(17, 4, 3, 3, hair); P(19, 7, 2, 9, hair); P(18, 16, 2, 2, hair); P(19, 8, 1, 6, hD); P(17, 5, 2, 1, '#e23b4a'); }   // 포니테일
    if (hx === 6) { P(1, 6, 18, 2, hair); P(1, 8, 18, 1, hD); P(0, 8, 2, 7, hair); P(18, 8, 2, 7, hair); }   // 단정한 일자 앞머리
    const hatOn = ac === 2 || ax2 === 2 || ax2 === 7;   // 모자를 쓰면 정수리 장식(스파이키·번·집게핀)은 숨김
    if (hx === 7) { P(0, 4, 20, 4, hair); P(0, 8, 3, 5, hair); P(17, 8, 3, 5, hair); P(1, 7, 18, 1, hD); P(3, 4, 6, 1, hL); }   // 바가지 머리
    if (!hatOn && hx === 8) { for (let i = 0; i < 6; i++) { P(1 + i * 3, -2, 3, 3, hair); P(2 + i * 3, -4, 1, 2, hair); P(2 + i * 3, -2, 1, 1, hL); } }   // 스파이키 (젤 머리)
    if (!hatOn && hx === 9) { [[0, -3], [15, -3]].forEach(([bx, by]) => { P(bx, by + 1, 5, 4, hair); P(bx + 1, by, 3, 6, hair); P(bx + 1, by + 1, 2, 1, hL); P(bx + 1, by + 5, 3, 1, '#ff7ab0'); }); }   // 양갈래 번
    if (hx === 11 && !fem) { brow(6, 7); for (let px = 3; px <= 16; px += 2) P(px, 5, 1, 2 - (px % 4 === 1 ? 1 : 0), px % 4 === 1 ? hD : hair); ears(9); P(1, 8, 2, 4, hair); P(17, 8, 2, 4, hair); P(1, 11, 1, 1, hD); P(18, 11, 1, 1, hD); P(3, 0, 3, 1, hL); }   // 남자 샤기: 짧은 레이어 + 목선 살짝
    else if (hx === 11) { for (let yy = 6; yy <= 16; yy++) { const j = (yy * 7) % 3; P(-1 + (j === 0 ? 1 : 0), yy, 2 + (j === 2 ? 1 : 0), 1, yy % 2 ? hair : hD); P(19 - (j === 2 ? 1 : 0), yy, 2 + (j === 0 ? 0 : 1) - 1, 1, yy % 2 ? hair : hD); } for (let xx = 2; xx < 18; xx += 2) P(xx, 6, 1, 2 + ((xx >> 1) % 3 === 0 ? 1 : 0), hD); P(1, 1, 3, 2, hair); P(16, 1, 3, 2, hair); P(4, 0, 2, 1, hL); P(13, 0, 2, 1, hL); }   // 샤기컷: 층을 낸 거친 레이어
    if (hx === 12) { brow(6, 7); for (let px = 3; px <= 16; px++) P(px, 5, 1, px % 3 === 0 ? 2 : 1, px % 2 ? hair : hD); ears(7); for (let px = 3; px <= 16; px += 3) P(px, 1, 2, 1, hL); }   // 크롭컷: 짧은 직선 앞머리 + 아주 짧은 옆
    if (hx === 13) { brow(6, 7); P(7, 0, 1, 5, shade(skin, .9)); P(8, 4, 9, 2, hair); P(12, 6, 5, 1, hair); P(3, 4, 4, 1, hair); [[9, 2], [12, 2], [15, 3], [4, 2]].forEach(([a2, b2]) => P(a2, b2, 2, 1, hL)); ears(8); }   // 가르마펌: 옆 가르마 + 볼륨
    if (hx === 14) { brow(6, 7); for (let i = 0; i < 9; i++) P(4 + i, 5 + (i >> 2), 2, 1, i % 2 ? hair : hD); P(11, 7, 3, 1, hD); ears(8); P(4, 2, 4, 1, hL); }   // 댄디컷: 한쪽으로 내린 앞머리
    if (hx === 15) { brow(4, 7); for (let px = 3; px <= 16; px++) P(px, 3, 1, 1, hD); for (let px = 4; px <= 15; px += 3) P(px, 1, 2, 1, hL); ears(7); }   // 올백: 이마를 시원하게
    if (hx === 16) { brow(5, 7); P(6, 0, 1, 4, shade(skin, .9)); P(7, 3, 9, 2, hair); P(13, 4, 4, 1, hD); P(3, 3, 3, 1, hair); P(8, 1, 6, 1, hL); for (let px = 0; px <= 19; px++) for (let py = 5; py <= 11; py++) if (px <= 2 || px >= 17) skinPx(px, py); P(0, 6, 3, 4, shade(skin, .84)); P(17, 6, 3, 4, shade(skin, .84)); }   // 아이비리그컷: 짧은 옆가르마 + 아주 짧은 옆
    if (hx === 17) { brow(6, 8); for (let py = 6; py <= 11; py++) { P(0, py, 3, 1, hair); P(17, py, 3, 1, hair); } P(-1, 11, 2, 1, hD); P(19, 11, 2, 1, hD); P(-1, 10, 1, 1, hair); P(20, 10, 1, 1, hair);   // 리프컷: 앞머리를 가운데서 살짝 갈라 양옆으로 흘리고 끝을 바깥으로 말아 올림
      P(3, 5, 6, 1, hair); P(2, 6, 6, 1, hair); P(2, 7, 4, 1, hD); P(1, 8, 2, 1, hD); P(1, 7, 1, 1, hair); P(11, 5, 6, 1, hair); P(12, 6, 6, 1, hair); P(14, 7, 4, 1, hD); P(17, 8, 2, 1, hD); P(18, 7, 1, 1, hair); P(9, 4, 2, 2, shade(skin, .92)); P(4, 2, 3, 1, hL); P(13, 2, 3, 1, hL); P(7, 5, 1, 1, hL); P(12, 5, 1, 1, hL); }
    if (hx === 18) { brow(5, 7); P(9, 0, 2, 6, shade(skin, .9)); for (let i = 0; i < 6; i++) { P(8 - i, 4 + i, 2, 1, hair); P(10 + i, 4 + i, 2, 1, hair); } for (let yy = 8; yy <= 21; yy++) { P(-1, yy, 3, 1, yy % 3 ? hair : hD); P(18, yy, 3, 1, yy % 3 ? hair : hD); } P(0, 21, 2, 1, hD); P(18, 21, 2, 1, hD); P(4, 1, 3, 1, hL); P(13, 1, 3, 1, hL); }   // 예수컷: 가운데 가르마 + 어깨까지 오는 긴 머리
    if (!hatOn && hx === 10) { P(6, -2, 8, 3, hair); P(7, -3, 6, 1, hair); P(5, -1, 10, 1, '#b48aff'); [6, 8, 10, 12, 14].forEach(xx => P(xx, -2, 1, 1, '#d6c0ff')); }   // 집게핀 반묶음
    const hl = shade(hair, 1.45);
    P(5, 2, 4, 1, hl); P(4, 3, 1, 1, hl); P(12, 2, 2, 1, hl);                // 머리 윤기 (천사 링)
    // 눈: 크고 반짝이게 (3x4 + 하이라이트 2개)
    const eyeD = '#2a1618', iris = '#6a3e2e';
    if (ey === 1 && frame !== 'y') { [[4, 11], [5, 10], [6, 11], [13, 11], [14, 10], [15, 11]].forEach(([ex2, ey2]) => P(ex2, ey2, 1, 1, eyeD)); }   // 웃는 눈 ^^
    else if (ey === 3 && frame !== 'b' && frame !== 'y') { P(4, 11, 3, 2, eyeD); P(13, 11, 3, 2, eyeD); P(4, 10, 3, 1, shade(skin, .82)); P(13, 10, 3, 1, shade(skin, .82)); P(5, 11, 1, 1, '#ffffff'); P(14, 11, 1, 1, '#ffffff'); }   // 졸린 눈
    else if (frame === 'b' || frame === 'y') { [[4, 11], [5, 12], [6, 11], [13, 11], [14, 12], [15, 11]].forEach(([ex, ey]) => P(ex, ey, 1, 1, eyeD)); if (frame === 'y') P(16, 12, 1, 1, '#9ad8ff'); }
    else {
      P(4, 9, 3, 4, eyeD); P(13, 9, 3, 4, eyeD);
      P(5, 11, 1, 2, iris); P(14, 11, 1, 2, iris);
      P(4, 10, 1, 1, '#ffffff'); P(13, 10, 1, 1, '#ffffff'); P(6, 12, 1, 1, '#ffe8ec'); P(15, 12, 1, 1, '#ffe8ec');
      clr(4, 9); clr(15, 9); P(4, 9, 1, 1, skin); P(15, 9, 1, 1, skin);
    }
    if (ey === 2 && ey !== 1) { P(4, 8, 3, 1, eyeD); P(13, 8, 3, 1, eyeD); P(3, 8, 1, 1, eyeD); P(16, 8, 1, 1, eyeD); P(3, 10, 1, 1, eyeD); P(16, 10, 1, 1, eyeD); }   // 또렷한 눈: 속눈썹
    if (fem && ey !== 1 && ey !== 3) { P(3, 9, 1, 1, eyeD); P(16, 9, 1, 1, eyeD); P(4, 8, 2, 1, eyeD); P(14, 8, 2, 1, eyeD); }
    else { P(4, 7, 3, 1, shade(hair, .75)); P(13, 7, 3, 1, shade(hair, .75)); }
    // 볼터치 + 웃는 입
    const blush = fem ? '#ff9aac' : '#f5aaa6';
    P(2, 13, 3, 1, blush); P(15, 13, 3, 1, blush); P(3, 14, 1, 1, shade(blush, 1.05)); P(16, 14, 1, 1, shade(blush, 1.05));
    const mouthC = fem ? '#d4505c' : '#a8463c';
    if (frame === 'y') { P(8, 13, 4, 4, '#5a1a22'); P(9, 15, 2, 1, '#e0606a'); P(8, 13, 1, 1, skin); P(11, 13, 1, 1, skin); P(8, 16, 1, 1, skin); P(11, 16, 1, 1, skin); }   // 하품
    else { P(8, 14, 1, 1, mouthC); P(9, 15, 2, 1, mouthC); P(11, 14, 1, 1, mouthC); }
    // 둥근 어깨 + 단추
    if (!swim) { if (fem) { clr(5, 18); clr(14, 18); } else { clr(4, 18); clr(15, 18); } if (tp === 0 || !noCos) { P(10, 21, 1, 1, shade(shirt, .6)); P(10, 24, 1, 1, shade(shirt, .6)); } }
    // 소품
    if (ac === 1) { x.strokeStyle = '#2a1e1e'; x.lineWidth = 1; x.strokeRect(3.5 + 2, 8.5 + 8, 5, 5); x.strokeRect(12.5 + 2, 8.5 + 8, 5, 5); P(8, 10, 4, 1, '#2a1e1e'); }
    if (ac === 2) { const capc = shade(shirt, .7); for (let py = 1; py <= 5; py++) for (let px = 0; px < 20; px++) if (inHead(px, py)) P(px, py, 1, 1, capc); P(1, 5, 12, 2, capc); P(8, 2, 3, 2, shade(capc, 1.4)); }
    if (ac === 3) { P(13, 0, 2, 3, '#e23b4a'); P(17, 0, 2, 3, '#e23b4a'); P(15, 1, 2, 1, '#b5202f'); }
    if (ax2 === 1) { const g2 = '#141018'; P(3, 9, 5, 3, g2); P(12, 9, 5, 3, g2); P(8, 10, 4, 1, g2); P(2, 9, 1, 1, g2); P(17, 9, 1, 1, g2); P(4, 9, 2, 1, '#6a7a96'); P(13, 9, 2, 1, '#6a7a96'); }   // 선글라스
    if (ax2 === 2) { const bc = shade(shirt, .85); for (let py = -1; py <= 5; py++) for (let px = -1; px < 21; px++) if ((((px - 9.5) / 9.8) ** 2 + ((py - 6) / 7.2) ** 2) <= 1 && py <= 5) P(px, py, 1, 1, (px % 2) ? bc : shade(bc, .9)); P(0, 5, 20, 2, shade(bc, .75)); P(8, -3, 4, 2, '#f4f0ea'); P(9, -4, 2, 1, '#f4f0ea'); }   // 비니
    if (ax2 === 3) { P(0, 13, 1, 1, '#ffd84a'); P(0, 14, 1, 2, '#fff2a0'); P(19, 13, 1, 1, '#ffd84a'); P(19, 14, 1, 2, '#fff2a0'); }   // 귀걸이
    if (ax2 === 4) { P(1, 4, 18, 1, '#ff7ab0'); P(2, 3, 16, 1, '#ff7ab0'); P(4, 3, 4, 1, '#ffb0d0'); }   // 헤어밴드
    if (ax2 === 5) { G(14, 1, ['.p.', 'pYp', '.p.'], { p: '#ff8ac0', Y: '#ffe060' }); }   // 꽃핀
    if (ax2 === 6) { const k2 = '#2a1e1e', t2 = '#ff9ac0'; P(3, 10, 5, 3, t2); P(12, 10, 5, 3, t2); P(3, 10, 5, 1, k2); P(12, 10, 5, 1, k2); P(8, 10, 4, 1, k2); P(4, 11, 1, 1, '#ffe0ec'); P(13, 11, 1, 1, '#ffe0ec'); }   // 틴트 선글라스
    if (ax2 === 7) { const bc = shade(shirt, .9), bd = shade(bc, .75); for (let py = -2; py <= 5; py++) for (let px = 0; px < 20; px++) if ((((px - 9.5) / 9.2) ** 2 + ((py - 5.5) / 7.5) ** 2) <= 1) P(px, py, 1, 1, bc); P(-2, 5, 24, 2, bd); P(-1, 4, 22, 1, bc); P(3, 0, 5, 1, shade(bc, 1.25)); }   // 버킷햇
    if (ax2 === 8) { const hp = '#2a2a32', ha = '#ff7ab0'; P(2, -3, 16, 1, hp); P(1, -2, 1, 2, hp); P(18, -2, 1, 2, hp); P(0, 0, 1, 8, hp); P(19, 0, 1, 8, hp); P(-2, 8, 3, 6, hp); P(19, 8, 3, 6, hp); P(-2, 9, 1, 4, ha); P(21, 9, 1, 4, ha); }   // 헤드폰
    if (ax2 === 9) { const bd2 = '#d6262e'; P(1, 3, 18, 3, bd2); P(1, 5, 18, 1, '#a01a20'); [3, 7, 11, 15].forEach(xx => P(xx, 4, 1, 1, '#ffffff')); P(19, 4, 3, 2, bd2); P(20, 6, 2, 2, bd2); }   // 반다나
    if (ax2 === 10) { G(0, 2, ['b.b', 'bbb', '.b.'], { b: '#9ad0ff' }); G(16, 3, ['p.p', 'ppp', '.p.'], { p: '#ffb0d8' }); P(1, 3, 1, 1, '#ffffff'); P(17, 4, 1, 1, '#ffffff'); }   // 나비핀
    // 시즌 코스튬 (픽셀 도안: 외곽선 · 기본색 · 밝은면 · 그림자)
    for (const cs of csAll) {
    if (cs === 'king') {   // 성군: 붉은 곤룡포 + 금색 용 흉배 + 익선관
      const R = '#c0262e', Rd = '#8a1820', Y = '#ffd84a';
      P(1, 19, 4, 10, R); P(15, 19, 4, 10, Rd); P(3, 18, 14, 11, R); P(13, 18, 4, 11, Rd); P(8, 18, 4, 2, '#f4f0ea'); P(9, 18, 2, 1, skin);
      G(7, 20, ['.YYYY.', 'YRYYRY', 'YYRRYY', '.YRRY.', '..YY..'], { Y, R }); P(3, 26, 14, 1, '#2a3a8a'); P(9, 26, 2, 1, Y);
      P(4, 28, 12, 11, R); P(11, 28, 5, 11, Rd); P(4, 38, 12, 1, Rd); P(2, 28, 2, 2, skin); P(16, 28, 2, 2, skin);
      G(2, -4, ['...KKKKKKKKKKK...', '..KKKKKKKKKKKKK..', '.KKKKKKKKKKKKKKK.', 'KKKKKKKKKKKKKKKKK'], { K: '#18161c' }); P(-1, -4, 3, 2, '#18161c'); P(18, -4, 3, 2, '#18161c'); P(5, -3, 4, 1, '#3a3640'); }
    if (cs === 'admiral') {   // 바다의 장군: 철 투구 + 비늘 갑옷 + 장군 칼 (뒤에 붉은 망토)
      const A = '#3a3a48', a = '#5a5a6a', Y = '#ffd84a';
      P(1, 19, 4, 9, A); P(15, 19, 4, 9, A); P(3, 18, 14, 11, A); for (let yy = 19; yy < 29; yy += 2) for (let xx = 3 + (yy % 4 === 1 ? 1 : 0); xx < 17; xx += 2) P(xx, yy, 1, 1, a);
      P(3, 25, 14, 1, '#8a1a20'); P(9, 25, 2, 1, Y); P(4, 28, 12, 5, A); P(4, 32, 12, 1, a); P(2, 28, 2, 2, skin); P(16, 28, 2, 2, skin);
      P(18, 18, 1, 15, '#d8dce4'); P(17, 18, 3, 1, Y); P(18, 16, 1, 2, '#6a4a2a');
      G(1, -6, ['........YY........', '.......YYYY.......', '....AAAAAAAAAA....', '..AAAAAAAAAAAAAA..', '.AAAAAAAAAAAAAAAA.', 'AAaaaaaaaaaaaaaaAA'], { A, a, Y }); P(0, 0, 2, 9, A); P(18, 0, 2, 9, A); P(0, 8, 2, 1, a); P(18, 8, 2, 1, a); }
    if (cs === 'silla') {   // 선덕 여왕: 신라 금관(나뭇가지 장식 + 곡옥) + 왕실 의복
      const Y = '#ffd84a', g = '#3ac080', V = '#7a34c0', R = '#c0262e';
      P(2, 19, 3, 9, V); P(15, 19, 3, 9, V); P(5, 18, 10, 7, V); P(8, 18, 4, 1, Y); P(7, 19, 1, 4, Y); P(12, 19, 1, 4, Y); P(5, 24, 10, 1, Y);
      P(3, 25, 14, 15, R); P(3, 39, 14, 1, Y); P(12, 25, 5, 15, '#9a1a22'); P(2, 28, 2, 2, skin); P(16, 28, 2, 2, skin);
      G(1, -7, ['.Y...Y..Y..Y...Y.', '.YY..YY.YY.YY..YY', '..Y..Y...Y..Y..Y.', 'YYYYYYYYYYYYYYYYY', 'YgYYgYYgYYgYYgYYY'], { Y, g }); P(0, -2, 1, 6, Y); P(18, -2, 1, 6, Y); P(0, 4, 1, 1, g); P(18, 4, 1, 1, g); }
    if (cs === 'nile') {   // 나일의 여왕: 줄무늬 황금 머리장식 + 코브라 + 넓은 목걸이 + 흰 드레스
      const Y = '#ffd84a', B = '#2a5ab0';
      P(4, 18, 12, 11, '#f4f0ea'); P(3, 28, 14, 12, '#f4f0ea'); P(12, 28, 5, 12, '#e0dcd4'); P(3, 27, 14, 1, Y); P(2, 19, 2, 8, skin); P(16, 19, 2, 8, skin);
      G(4, 17, ['BYBYBYBYBYBY', '.YBYBYBYBYB.', '..YYYYYYYY..'], { B, Y }); P(2, 21, 2, 1, Y); P(16, 21, 2, 1, Y);
      for (let yy = 0; yy <= 18; yy++) { const c2 = yy % 2 ? Y : B; P(-1, yy, 3, 1, c2); P(18, yy, 3, 1, c2); } P(1, -1, 18, 2, Y); P(2, -2, 16, 1, B); P(9, -4, 2, 3, Y); P(9, -4, 1, 1, '#c8302a');
      P(3, 11, 1, 1, '#141018'); P(16, 11, 1, 1, '#141018'); P(4, 8, 3, 1, B); P(13, 8, 3, 1, B); }
    if (cs === 'bicorne') {   // 황제의 이각모: 가로로 긴 모자 + 견장 군복 + 흰 바지와 승마 부츠
      const N2 = '#1e2a5a', Y = '#ffd84a';
      P(1, 19, 4, 9, N2); P(15, 19, 4, 9, N2); P(3, 18, 14, 11, N2); P(8, 18, 4, 10, '#f4f0ea'); [20, 22, 24, 26].forEach(yy => { P(7, yy, 1, 1, Y); P(12, yy, 1, 1, Y); });
      P(1, 18, 4, 2, Y); P(15, 18, 4, 2, Y); P(1, 20, 4, 1, '#c8a030'); P(15, 20, 4, 1, '#c8a030'); P(3, 27, 14, 1, '#f4f0ea');
      P(5, 28, 10, 8, '#f4f0ea'); P(10, 28, 1, 8, '#d8d4cc'); P(5, 35, 10, 6, '#151518'); P(5, 35, 10, 1, '#3a3438'); P(2, 28, 2, 2, skin); P(16, 28, 2, 2, skin);
      G(-2, 0, ['........KKKKK........', '......KKKKKKKKK......', '....KKKKKKKKKKKKK....', '..KKKKKKKKKKKKKKKKK..', 'KKKKKKKKKKKKKKKKKKKKK', '.YYYYYYYYYYYYYYYYYYY.'], { K: '#151518', Y }); P(8, 1, 3, 3, '#3a5ad0'); P(9, 2, 1, 1, '#ffffff'); P(8, 1, 1, 1, '#e0303a'); }
    if (cs === 'caesar') {   // 로마 황제: 월계관 + 흰 토가 + 보라 띠 + 샌들
      const W = '#f4f0ea', w = '#d8d4cc', V = '#7a2a8a', L = '#4a9a3a', l = '#7ac860';
      P(2, 19, 3, 9, skin); P(15, 19, 3, 9, skin); P(3, 18, 14, 12, W); P(12, 18, 5, 12, w); for (let i = 0; i < 11; i++) P(4 + i, 18 + i, 2, 1, V);
      P(4, 28, 12, 9, W); P(11, 28, 5, 9, w); P(4, 36, 12, 1, V); P(6, 37, 3, 3, skin); P(11, 37, 3, 3, shade(skin, .92)); P(6, 38, 3, 1, '#7a4a2a'); P(11, 38, 3, 1, '#7a4a2a');
      for (let px = 1; px <= 18; px += 2) { const yy = px < 5 || px > 14 ? 5 : px < 8 || px > 11 ? 3 : 2; P(px, yy, 2, 1, L); P(px, yy - 1, 1, 1, l); } P(9, 1, 2, 1, '#ffd84a'); }
    if (cs === 'painter') {   // 천재 화가: 베레모 + 물감 묻은 작업복 + 팔레트와 붓 (남자는 흰 수염)
      const Bm = '#7a1f22', S = '#e8e0d0';
      P(1, 19, 4, 9, S); P(15, 19, 4, 9, S); P(3, 18, 14, 11, S); P(12, 18, 5, 11, '#d0c8b8'); [[5, 21, '#e0303a'], [11, 23, '#3a6ae0'], [7, 26, '#ffd84a'], [13, 20, '#3ab060']].forEach(([a2, b2, c2]) => P(a2, b2, 2, 1, c2)); P(8, 18, 4, 2, '#2a2a30');
      P(2, 28, 2, 2, skin); P(16, 28, 2, 2, skin); G(14, 23, ['.DDDD.', 'DRDBDD', 'DYDGD.', '.DDD..'], { D: '#d8b88a', R: '#e0303a', B: '#3a6ae0', Y: '#ffd84a', G: '#3ab060' }); P(1, 20, 1, 7, '#8a5a2a'); P(1, 19, 1, 1, '#e0303a');
      if (!fem) { P(5, 14, 10, 3, '#d8d4cc'); P(6, 17, 8, 3, '#d8d4cc'); P(8, 20, 4, 2, '#d8d4cc'); P(8, 14, 4, 1, shade(skin, .8)); }
      G(0, -2, ['...BBBBBBBBBBB....', '.BBBBBBBBBBBBBBB..', 'BBBBBBBBBBBBBBBBBB'], { B: Bm }); P(9, -3, 2, 1, Bm); P(2, -1, 5, 1, '#9a3a3a'); }
    if (cs === 'hwarang') {   // 화랑: 깃털 머리띠 + 푸른 저고리 + 흰 바지·행전 + 칼
      const Bl = '#2a5ab0', bl = '#1e4488', W = '#f4f0ea';
      P(1, 19, 4, 9, Bl); P(15, 19, 4, 9, bl); P(3, 18, 14, 10, Bl); P(12, 18, 5, 10, bl); for (let i = 0; i < 6; i++) P(7 + i, 18 + i, 1, 1, W); P(3, 26, 14, 1, '#c0262e'); P(14, 26, 2, 3, '#c0262e');
      P(4, 27, 12, 9, W); P(10, 27, 1, 9, '#d8d4cc'); P(5, 35, 4, 4, '#2a2a30'); P(11, 35, 4, 4, '#2a2a30'); P(2, 28, 2, 2, skin); P(16, 28, 2, 2, skin);
      P(18, 21, 1, 12, '#c8ccd4'); P(17, 21, 3, 1, '#ffd84a'); P(1, 3, 18, 2, Bl); P(1, 4, 18, 1, bl); P(15, -4, 2, 7, '#ffffff'); P(16, -5, 1, 2, '#ffffff'); P(14, 1, 1, 2, '#e8e8f0'); }
    if (cs === 'gwanggaeto') {   // 광개토대왕: 불꽃 금관 + 붉은 찰갑 + 창
      const R = '#a8282a', r = '#d04a3a', Y = '#ffd84a', y = '#c8a030';
      P(1, 19, 4, 9, R); P(15, 19, 4, 9, R); P(3, 18, 14, 11, R); for (let yy = 19; yy < 28; yy += 2) for (let xx = 4; xx < 16; xx += 2) P(xx + (yy % 4 === 1 ? 1 : 0), yy, 1, 1, r);
      P(3, 18, 14, 1, Y); P(3, 26, 14, 1, Y); P(4, 27, 12, 6, R); P(4, 32, 12, 1, Y); P(5, 33, 10, 6, '#3a2a22'); P(2, 28, 2, 2, skin); P(16, 28, 2, 2, skin);
      P(0, 6, 1, 28, '#6a4a2a'); G(-1, 2, ['.W.', 'WWW', 'WWW'], { W: '#d8dce4' }); P(-1, 5, 3, 1, '#c0262e');
      G(1, -6, ['..Y.....Y.....Y..', '.YY....YYY....YY.', '.Y.Y..Y.Y.Y..Y.Y.', 'YYYYYYYYYYYYYYYYY', 'yYgYyYgYyYgYyYgYy'], { Y, y, g: '#3ac080' }); }
    if (cs === 'genghis') {   // 칭기즈칸: 털 테두리 모자 + 델(몽골 전통옷) + 띠 + 수염
      const D = '#2a4a8a', d = '#1e3666', F = '#8a6a4a', f = '#b89a72', S = '#e0a030';
      P(1, 19, 4, 9, D); P(15, 19, 4, 9, d); P(3, 18, 14, 11, D); P(12, 18, 5, 11, d); for (let i = 0; i < 7; i++) P(10 + i, 18 + i, 1, 1, S); P(3, 26, 14, 2, '#c0262e');
      P(4, 28, 12, 9, D); P(11, 28, 5, 9, d); P(5, 37, 4, 3, '#4a2a1a'); P(11, 37, 4, 3, '#4a2a1a'); P(1, 27, 4, 1, F); P(15, 27, 4, 1, F); P(2, 28, 2, 2, skin); P(16, 28, 2, 2, skin);
      if (!fem) { P(7, 14, 1, 2, '#2a1e1e'); P(12, 14, 1, 2, '#2a1e1e'); P(8, 13, 4, 1, '#2a1e1e'); P(9, 16, 2, 3, '#2a1e1e'); }
      G(1, -5, ['.....RRRRRRR.....', '...RRRRRRRRRRR...', '..RRRRRRRRRRRRR..', 'FfFfFfFfFfFfFfFfF', 'fFfFfFfFfFfFfFfFf'], { R: '#c0262e', F, f }); P(9, -7, 2, 2, S); }
    if (cs === 'mozart') {   // 모차르트: 흰 말린 가발 + 붉은 연미복 + 레이스 자보 + 흰 스타킹
      const R = '#b0283a', r = '#801a2a', Y = '#ffd84a', W = '#f4f0ea', w = '#d8d4cc';
      P(1, 19, 4, 9, R); P(15, 19, 4, 9, r); P(3, 18, 14, 12, R); P(13, 18, 4, 12, r); P(7, 18, 6, 10, '#f0e0b0'); G(7, 18, ['WWWWWW', '.WwWW.', '..WW..', '..Ww..'], { W, w }); P(6, 18, 1, 12, Y); P(13, 18, 1, 12, Y);
      P(3, 28, 3, 6, R); P(14, 28, 3, 6, r); P(6, 28, 8, 4, '#f0e0b0'); P(6, 32, 3, 6, W); P(11, 32, 3, 6, W); P(6, 38, 3, 2, '#151518'); P(11, 38, 3, 2, '#151518'); P(1, 28, 3, 1, W); P(16, 28, 3, 1, W); P(2, 29, 2, 2, skin); P(16, 29, 2, 2, skin);
      for (let py = -2; py <= 5; py++) for (let px = 0; px < 20; px++) if ((((px - 9.5) / 9.6) ** 2 + ((py - 5) / 7) ** 2) <= 1) P(px, py, 1, 1, (px + py) % 3 ? W : w);
      P(0, 4, 3, 10, W); P(17, 4, 3, 10, W); P(1, 6, 1, 6, w); P(18, 6, 1, 6, w); [7, 10, 13].forEach(yy => { G(-2, yy, ['WWW', 'WwW', '.W.'], { W, w }); G(19, yy, ['WWW', 'WwW', '.W.'], { W, w }); }); P(19, 16, 2, 4, '#1a1a1e'); P(21, 18, 2, 2, '#1a1a1e'); }
    if (cs === 'shakespeare') {   // 셰익스피어: 흰 주름 칼라 + 검은 더블릿 + 깃펜 + 콧수염
      const K = '#1e1c24', k = '#34303c', W = '#f4f0ea', w = '#c8c4bc';
      P(1, 19, 4, 9, K); P(15, 19, 4, 9, K); P(3, 18, 14, 11, K); for (let yy = 20; yy < 28; yy += 2) P(9, yy, 2, 1, '#c8a030'); P(4, 19, 2, 8, k); P(14, 19, 2, 8, k);
      P(4, 28, 12, 5, K); P(5, 33, 4, 7, '#2a2a30'); P(11, 33, 4, 7, '#2a2a30'); P(2, 28, 2, 2, skin); P(16, 28, 2, 2, skin);
      for (let px = 1; px < 19; px++) { P(px, 17, 1, 2, px % 2 ? W : w); } P(2, 16, 16, 1, W);
      if (!fem) { P(7, 13, 6, 1, shade(hair, .9)); P(9, 16, 2, 1, shade(hair, .9)); }
      P(18, 19, 1, 9, '#f4f0ea'); P(19, 17, 1, 6, '#f4f0ea'); P(20, 16, 1, 4, '#d8d4cc'); P(18, 28, 1, 2, '#2a2a30'); }
    if (cs === 'saimdang') {   // 신사임당: 쪽머리 + 비녀 + 연두 저고리 + 남색 치마 + 붓
      const G2 = '#8ac890', g2 = '#5aa060', Nv = '#2a3a6a', nv = '#1e2a50', Y = '#ffd84a';
      P(2, 19, 3, 8, G2); P(15, 19, 3, 8, g2); P(5, 18, 10, 6, G2); P(12, 18, 3, 6, g2); for (let i = 0; i < 4; i++) P(8 + i, 18 + i, 1, 1, '#ffffff'); P(10, 22, 1, 4, '#a0283a'); P(9, 22, 1, 3, '#a0283a');
      P(3, 24, 14, 16, Nv); P(12, 24, 5, 16, nv); P(2, 26, 2, 2, skin); P(16, 26, 2, 2, skin); P(2, 27, 2, 1, '#6a3a8a'); P(16, 27, 2, 1, '#6a3a8a');
      P(19, 22, 1, 7, '#8a5a2a'); P(19, 29, 1, 2, '#1a1a1e');
      G(14, 6, ['.HHH..', 'HHHHH.', 'HHHHH.', '.HHH..'], { H: shade(hair, .9) }); P(12, 7, 9, 1, Y); P(20, 6, 1, 3, Y); P(12, 7, 1, 1, '#3ac080'); }
    if (cs === 'antoinette') {   // 마리 앙투아네트: 높이 올린 흰 머리 + 리본 + 분홍 드레스
      const Pk = '#f4a0c0', pk = '#d878a0', W = '#f4f0ea', w = '#d8d4cc', Rb = '#ff6aa0';
      P(2, 19, 3, 7, pk); P(15, 19, 3, 7, pk); P(5, 18, 10, 7, Pk); P(7, 18, 6, 2, skin); P(5, 18, 10, 1, W); for (let yy = 20; yy < 25; yy += 2) P(9, yy, 2, 1, Rb);
      for (let yy = 25; yy < 40; yy++) { const hw = Math.min(10, 5 + (yy - 25)); P(10 - hw, yy, hw * 2, 1, yy % 4 === 3 ? W : Pk); P(10, yy, hw, 1, yy % 4 === 3 ? w : pk); }
      P(1, 25, 2, 2, skin); P(17, 25, 2, 2, skin); G(-1, 26, ['.YY.', 'YYYY', 'YrrY'], { Y: '#ffe0f0', r: Rb });
      for (let py = -12; py <= 5; py++) for (let px = 1; px < 19; px++) if ((((px - 9.5) / 8) ** 2 + ((py + 3) / 9) ** 2) <= 1) P(px, py, 1, 1, (px + py) % 3 ? W : w);
      P(0, 4, 3, 12, W); P(17, 4, 3, 12, W); P(1, 7, 1, 7, w); P(18, 7, 1, 7, w); G(12, -10, ['RR.RR', '.RRR.', 'RR.RR'], { R: Rb }); P(4, -6, 1, 1, '#ffd0e0'); P(7, -10, 1, 1, '#ffd0e0'); P(6, -3, 2, 1, '#ffd0e0'); }
    if (cs === 'joan') {   // 잔 다르크: 은빛 판금 갑옷 + 흰 겉옷에 금 백합 + 깃발
      const S = '#c8ccd8', s2 = '#8a90a0', W = '#f4f0ea', Y = '#ffd84a';
      P(1, 19, 4, 9, S); P(15, 19, 4, 9, s2); P(1, 18, 4, 2, s2); P(15, 18, 4, 2, s2); P(3, 18, 14, 11, W); P(3, 18, 2, 11, S); P(15, 18, 2, 11, S); G(8, 20, ['.Y..', 'YYY.', '.Y..', 'Y.Y.'], { Y }); P(9, 20, 1, 4, Y); P(8, 21, 3, 1, Y);
      P(4, 28, 12, 3, W); P(5, 31, 4, 8, S); P(11, 31, 4, 8, s2); P(5, 34, 4, 1, s2); P(11, 34, 4, 1, '#6a707e'); P(5, 39, 4, 1, '#4a4e5a'); P(11, 39, 4, 1, '#4a4e5a'); P(2, 28, 2, 2, S); P(16, 28, 2, 2, s2);
      P(0, -4, 1, 36, '#6a4a2a'); P(1, -4, 7, 5, W); P(1, -4, 7, 1, Y); G(2, -3, ['.Y.', 'YYY', '.Y.'], { Y }); }
    if (cs === 'elizabeth') {   // 엘리자베스 1세: 부채꼴 레이스 칼라 + 작은 왕관 + 진주 박힌 드레스
      const K = '#2a1e34', k = '#3e2e4c', Y = '#ffd84a', W = '#f4f0ea', w = '#c8c4bc';
      P(2, 19, 3, 8, K); P(15, 19, 3, 8, K); P(5, 18, 10, 8, K); G(6, 18, ['YWYWYWYW', '.YWYWYW.', '..YWYW..', '...YY...'], { Y, W });
      for (let yy = 26; yy < 40; yy++) { const hw = Math.min(9, 5 + ((yy - 26) >> 1)); P(10 - hw, yy, hw * 2, 1, K); P(10, yy, hw, 1, k); } [[5, 29], [14, 29], [4, 34], [15, 34], [9, 32], [10, 37], [7, 37], [12, 37]].forEach(([a2, b2]) => P(a2, b2, 1, 1, W));
      P(2, 27, 2, 2, skin); P(16, 27, 2, 2, skin);
      for (let px = -4; px < 24; px++) { if (px > 1 && px < 18) continue; const h2 = 9 - Math.round(Math.abs(px - 9.5) / 2.5); if (h2 > 0) P(px, 18 - h2, 1, h2, px % 2 ? W : w); } for (let px = 2; px < 18; px++) P(px, 17, 1, 1, px % 2 ? W : w);
      G(5, -4, ['Y.Y.Y.Y.Y.', 'YYYYYYYYYY', 'YrYYwYYrYY'], { Y, r: '#c0262e', w: W }); }
    if (cs === 'lincoln') {   // 링컨: 높은 실크햇 + 검은 프록코트 + 나비 넥타이 + 턱수염
      const K = '#1a181e', k = '#2e2a34', W = '#f4f0ea';
      P(1, 19, 4, 9, K); P(15, 19, 4, 9, K); P(3, 18, 14, 12, K); P(7, 18, 6, 9, W); P(8, 18, 4, 1, K); G(8, 19, ['KK.KK', '.KKK.'], { K }); P(7, 18, 1, 9, k); P(12, 18, 1, 9, k);
      P(3, 29, 3, 5, K); P(14, 29, 3, 5, K); P(6, 29, 8, 10, '#26242c'); P(10, 29, 1, 10, '#1a181e'); P(5, 39, 4, 1, '#0e0e10'); P(11, 39, 4, 1, '#0e0e10'); P(2, 28, 2, 2, skin); P(16, 28, 2, 2, skin);
      if (!fem) { const bd = shade(hair, .85); P(1, 12, 2, 4, bd); P(17, 12, 2, 4, bd); P(2, 15, 16, 2, bd); P(4, 17, 12, 1, bd); P(8, 14, 4, 1, skin); }
      P(4, -11, 12, 12, K); P(4, -3, 12, 2, '#3a3440'); P(2, 1, 16, 2, K); P(5, -10, 2, 8, k); }
    if (cs === 'gogh') {   // 반 고흐: 밀짚모자 + 파란 작업복 + 주황 수염 + 해바라기
      const B = '#2a5ab0', b = '#1e4488', Y = '#e8c860', y = '#b8983a', O = '#d8702a';
      P(1, 19, 4, 9, B); P(15, 19, 4, 9, b); P(3, 18, 14, 11, B); P(12, 18, 5, 11, b); P(8, 18, 4, 2, '#e8e0d0'); P(4, 21, 1, 1, '#6aa0e0'); P(14, 24, 1, 1, '#6aa0e0');
      P(4, 29, 12, 6, '#5a4a3a'); P(5, 35, 4, 4, '#5a4a3a'); P(11, 35, 4, 4, '#4a3a2e'); P(5, 39, 4, 1, '#2a1e18'); P(11, 39, 4, 1, '#2a1e18'); P(2, 28, 2, 2, skin); P(16, 28, 2, 2, skin);
      if (!fem) { P(2, 13, 2, 3, O); P(16, 13, 2, 3, O); P(3, 15, 14, 2, O); P(5, 17, 10, 1, O); P(8, 14, 4, 1, skin); }
      G(-3, -2, ['........YYYYYYYY......', '.......YyYYYYYYyY.....', '.......YYYYYYYYYY.....', '.......OOOOOOOOOO.....', 'YYYYYYYYYYYYYYYYYYYYYYYY', '.YyYYyYYyYYyYYyYYyYYyY.'], { Y, y, O: '#3a5ab0' });
      G(-3, 22, ['.YYY.', 'YYOYY', '.YYY.', '..G..', '..G..', '..G..'], { Y: '#ffd03a', O: '#6a3a1a', G: '#3a8a3a' }); }
    if (cs === 'beethoven') {   // 베토벤: 부스스한 머리 + 진회색 코트 + 흰 크라바트 + 악보
      const C = '#2e2a36', c2 = '#423c4c', W = '#f4f0ea', Hh = shade(hair, 1.1);
      P(1, 19, 4, 9, C); P(15, 19, 4, 9, C); P(3, 18, 14, 11, C); P(4, 19, 2, 9, c2); P(14, 19, 2, 9, c2); G(7, 18, ['WWWWWW', '.WWWW.', '..WW..'], { W }); P(7, 21, 6, 6, '#8a2a2a'); P(9, 22, 2, 1, '#ffd84a');
      P(4, 29, 12, 4, C); P(5, 33, 4, 6, '#2a2830'); P(11, 33, 4, 6, '#2a2830'); P(5, 39, 4, 1, '#0e0e10'); P(11, 39, 4, 1, '#0e0e10'); P(2, 28, 2, 2, skin); P(16, 28, 2, 2, skin);
      [[-2, 2], [-1, 0], [1, -2], [4, -3], [8, -4], [12, -3], [15, -2], [18, 0], [20, 2], [-2, 6], [20, 6], [-1, 10], [19, 10]].forEach(([a2, b2]) => P(a2, b2, 3, 3, Hh));
      G(16, 22, ['WWWWW', 'W.W.W', 'WWWWW', 'W..WW', 'WWWWW'], { W: '#f0e8d0' }); P(17, 23, 1, 1, '#1a1a1e'); P(19, 25, 1, 1, '#1a1a1e'); }
    if (cs === 'jangys') {   // 장영실: 사모(관모) + 녹색 관복 + 흉배 + 해시계
      const Gn = '#2a7a5a', gn = '#1e5a42', Y = '#ffd84a', K = '#1a181e';
      P(1, 19, 4, 10, Gn); P(15, 19, 4, 10, gn); P(3, 18, 14, 11, Gn); P(12, 18, 5, 11, gn); P(8, 18, 4, 2, '#f4f0ea'); P(9, 18, 2, 1, skin); G(7, 21, ['YYYYYY', 'YbWWbY', 'YWbbWY', 'YYYYYY'], { Y, b: '#3a6ae0', W: '#f4f0ea' }); P(3, 26, 14, 1, '#c0262e');
      P(4, 28, 12, 11, Gn); P(11, 28, 5, 11, gn); P(2, 28, 2, 2, skin); P(16, 28, 2, 2, skin);
      G(-4, 24, ['.GGGG.', 'GYYYYG', 'GY.KYG', 'GYYYYG', '.GGGG.'], { G: '#8a6a3a', Y: '#e8d8a8', K });
      G(2, -5, ['....KKKKKKKK....', '..KKKKKKKKKKKK..', '.KKKKKKKKKKKKKK.', 'KKKKKKKKKKKKKKKK'], { K }); P(-2, -2, 4, 3, K); P(18, -2, 4, 3, K); P(-1, -1, 2, 1, '#3a3640'); P(19, -1, 2, 1, '#3a3640'); }
    if (cs === 'nightingale') {   // 나이팅게일: 흰 간호 모자 + 남색 드레스 + 흰 앞치마 + 등불
      const Nv = '#2a3460', nv = '#1e2648', W = '#f4f0ea', w = '#d8d4cc';
      P(2, 19, 3, 8, Nv); P(15, 19, 3, 8, nv); P(5, 18, 10, 8, Nv); P(8, 18, 4, 1, W); P(6, 19, 8, 7, W); P(6, 19, 1, 7, w);
      for (let yy = 26; yy < 40; yy++) { const hw = Math.min(8, 5 + ((yy - 26) >> 2)); P(10 - hw, yy, hw * 2, 1, Nv); P(10, yy, hw, 1, nv); } P(6, 26, 8, 12, W); P(12, 26, 2, 12, w);
      P(2, 27, 2, 2, skin); P(16, 27, 2, 2, skin);
      G(16, 26, ['.KK.', 'KYYK', 'KyYK', 'KYYK', '.KK.'], { K: '#3a2e22', Y: '#ffe07a', y: '#fff6c0' }); P(17, 24, 2, 2, '#3a2e22');
      G(2, -3, ['....WWWWWWWW....', '..WWWWWWWWWWWW..', 'WWWWwwwwwwwwWWWW', '.wwwwwwwwwwwwww.'], { W, w }); }
    if (cs === 'curie') {   // 마리 퀴리: 올림머리 + 검은 드레스 + 흰 실험복 + 빛나는 플라스크
      const K = '#26222c', W = '#f4f0ea', w = '#d0ccc4';
      P(1, 19, 4, 9, W); P(15, 19, 4, 9, w); P(3, 18, 14, 12, W); P(12, 18, 5, 12, w); P(7, 18, 6, 10, K); P(8, 18, 4, 1, '#f4f0ea'); P(7, 18, 1, 10, w); P(12, 18, 1, 10, w); P(5, 23, 2, 1, '#3a6ae0');
      for (let yy = 29; yy < 40; yy++) P(4, yy, 12, 1, yy < 33 ? W : K); P(10, 33, 6, 7, '#1a161e'); P(2, 28, 2, 2, skin); P(16, 28, 2, 2, skin);
      G(16, 22, ['.WW.', '.WW.', 'WggW', 'WggW', 'gGGg', '.gg.'], { W: '#d8eef0', g: '#7af0a0', G: '#c8ffd8' });
      G(5, -4, ['..HHHHHH..', '.HHHHHHHH.', 'HHHHHHHHHH'], { H: shade(hair, .95) }); }
    if (cs === 'yanggf') {   // 양귀비: 당나라 높은 올림머리 + 꽃 장식 + 붉은 비단옷 + 긴 소매 + 부채
      const R = '#c8283a', r = '#901a2a', Pk = '#ffb0c8', Y = '#ffd84a';
      P(0, 19, 5, 10, Pk); P(15, 19, 5, 10, '#e890b0'); P(5, 18, 10, 6, Pk); P(7, 18, 6, 2, skin); P(5, 24, 10, 2, Y);
      for (let yy = 26; yy < 40; yy++) { const hw = Math.min(9, 6 + ((yy - 26) >> 2)); P(10 - hw, yy, hw * 2, 1, R); P(10, yy, hw, 1, r); } [[6, 30], [12, 33], [7, 36], [13, 28]].forEach(([a2, b2]) => P(a2, b2, 2, 2, Y));
      P(1, 29, 2, 1, skin); P(17, 29, 2, 1, skin); P(-2, 20, 3, 12, '#ffd0e0');
      G(3, -6, ['...HHHH.HHHH...', '..HHHHHHHHHHHH..', '...HHHHHHHHHH...', '....HHHHHHHH....', '...HHHHHHHHHH...'], { H: shade(hair, .9) }); G(1, -1, ['.R.', 'RYR', '.R.'], { R: '#ff4a6a', Y }); G(15, -3, ['.R.', 'RYR', '.R.'], { R: '#ff4a6a', Y }); P(8, -2, 4, 1, Y);
      G(15, 23, ['.YYYY', 'YRRRY', 'YRRY.', '.YY..'], { Y, R: '#ff7aa0' }); }
    if (cs === 'nanseol') {   // 허난설헌: 쪽머리 + 노랑 저고리 + 다홍 치마 + 시를 쓴 두루마리
      const Y = '#f4d860', y = '#d0b040', R = '#d8384a', r = '#a82a3a';
      P(2, 19, 3, 8, Y); P(15, 19, 3, 8, y); P(5, 18, 10, 6, Y); P(12, 18, 3, 6, y); for (let i = 0; i < 4; i++) P(8 + i, 18 + i, 1, 1, '#ffffff'); P(10, 22, 1, 4, '#7a2a8a'); P(9, 22, 1, 3, '#7a2a8a'); P(2, 25, 3, 2, '#7a2a8a'); P(15, 25, 3, 2, '#7a2a8a');
      P(3, 24, 14, 16, R); P(12, 24, 5, 16, r); P(2, 27, 2, 2, skin); P(16, 27, 2, 2, skin);
      G(16, 22, ['B....B', 'WWWWWW', 'WkWkWW', 'WWkWkW', 'WWWWWW', 'B....B'], { B: '#8a5a2a', W: '#f4ecd8', k: '#2a2a30' });
      G(14, 6, ['.HHH..', 'HHHHH.', 'HHHHH.', '.HHH..'], { H: shade(hair, .9) }); P(12, 7, 9, 1, '#e8e8f0'); P(20, 6, 1, 3, '#e8e8f0'); P(12, 7, 1, 1, '#ff6a8a'); }
    if (cs === 'witch') {
      G(2, -8, ['...........kk.....', '..........hKk.....', '.........hKKk.....', '........hKKKk.....', '.......hKSKKk.....', '......hKKKKKKk....', '.....hKKKKKKKk....', '....hKKKKKKKKKk...', '...pppppYYppppp...', '..hKKKKKKKKKKKKk..'], { K: '#2e2440', k: '#181222', h: '#54467a', p: '#8a4ad0', Y: '#ffd84a', S: '#ffe46a' });
      G(-2, 2, ['hhhhhhhhhhhhhhhhhhhhhhhh', 'kKKKKKKKKKKKKKKKKKKKKKKk'], { K: '#2e2440', k: '#181222', h: '#54467a' }); }
    if (cs === 'horns' || cs === 'devil') { const pal = { R: '#e0303a', r: '#ff8a8a', d: '#8a1018' };
      G(2, -3, ['d...', 'Rd..', 'rRd.', '.rRd'], pal); G(14, -3, ['...d', '..dR', '.dRr', 'dRr.'], pal); }
    if (cs === 'devil') { G(15, 19, ['.....dRd', '......R.', '.....R..', '....R...', '...R....', 'RRR.....'], { R: '#e0303a', d: '#8a1018' });   // 화살촉 꼬리
      G(-2, 14, ['Y.Y.Y', 'YYYYY', '..D..', '..Y..', '..Y..', '..D..', '..Y..', '..Y..', '..D..', '..Y..', '..d..'], { Y: '#c8c8d0', D: '#7a7a88', d: '#4a4a58' }); }   // 삼지창
    if (cs === 'cat') { const pal = { K: '#2a2226', p: '#ff9ab8', h: '#5a4e56' };
      G(2, -3, ['K....', 'hK...', 'hpK..', 'hppK.', 'KKKKK'], pal); G(13, -3, ['....K', '...Kh', '..Kph', '.Kpph', 'KKKKK'], pal);
      P(0, 13, 3, 1, '#4a3e46'); P(17, 13, 3, 1, '#4a3e46'); P(0, 14, 2, 1, '#4a3e46'); P(18, 14, 2, 1, '#4a3e46'); P(9, 12, 2, 1, '#ff8aa8'); }
    if (cs === 'santa') { for (let py = -1; py <= 3; py++) for (let px = 0; px < 20; px++) if (py < 1 || inHead(px, py)) if (px >= 3 + Math.max(0, -py) * 2 && px <= 16) P(px, py, 1, 1, '#d6262e'); P(14, -3, 4, 2, '#d6262e'); P(17, -2, 3, 3, '#ffffff'); P(1, 3, 18, 2, '#ffffff'); }
    if (cs === 'antler') { const pal = { B: '#9a6a34', b: '#c89458', d: '#5e3a18' };
      G(0, -6, ['b....', 'B..b.', 'Bb.B.', '.BBd.', '..Bd.', '..Bd.'], pal); G(15, -6, ['....b', '.b..B', '.B.bB', '.dBB.', '.dB..', '.dB..'], pal);
      G(8, 11, ['.rr.', 'rRRr', 'rRRr', '.rr.'], { R: '#ff3a3a', r: '#ff9a8a' }); }
    if (cs === 'scarf') { const pal = { R: '#d6262e', r: '#9a1820', w: '#fff4f0', h: '#ff6a6a' };
      G(3, 16, ['.hRhRhRhRhRhR.', 'RRwwRRwwRRwwRR', 'rRRRRRRRRRRRRr'], pal); G(12, 19, ['RhR', 'RwR', 'RRr', 'RhR', 'RwR', 'RRr', 'w.w'], pal); }
    if (cs === 'shades') { G(3, 9, ['KKKKKKKKKKKKKK', 'KwbBBK..KwbBBK', 'KbBBBK..KbBBBK', '.KKKK....KKKK.'], { K: '#151518', b: '#6a8ac8', B: '#24304a', w: '#e8f4ff' }); }
    if (cs === 'straw') { const Y = '#ecc878', y = '#c8a050', l = '#fbe4a8';
      for (let px = -2; px <= 21; px++) { P(px, 3, 1, 1, px % 2 ? Y : y); } for (let px = 0; px <= 19; px++) { P(px, 2, 1, 1, l); P(px, 4, 1, 1, y); }
      G(4, -2, ['..llllllll..', '.lYYyYYyYYY.', 'lYyYYyYYyYYy', 'RRRRRRRRRRRR'], { l, Y, y, R: '#d6262e' }); G(13, 0, ['dRd', 'RdR'], { R: '#d6262e', d: '#9a1820' }); }
    if (cs === 'lei') { [[3, 17, 'P'], [6, 18, 'Y'], [9, 18, 'W'], [12, 18, 'Y'], [15, 17, 'P']].forEach(([fx, fy, c]) => G(fx, fy, [c + c, c + 'o'], { P: '#ff6aa8', Y: '#ffd23a', W: '#fff6fa', o: '#ff9a3a' })); [[5, 18], [8, 19], [11, 19], [14, 18]].forEach(([lx, ly]) => P(lx, ly, 1, 1, '#3aa04a')); }
    if (cs === 'flower') { const F = (fx, fy, c, d) => G(fx, fy, ['.c.', 'cyc', '.d.'], { c, d, y: '#ffd84a' }); F(2, 0, '#ff8ab8', '#d85a8a'); F(5, -2, '#ffffff', '#e0d8e8'); F(8, -1, '#ffb0d0', '#e07aa0'); P(4, 2, 1, 1, '#4aa04a'); P(7, 1, 1, 1, '#4aa04a'); }
    // 오리지널 할로윈 코스튬
    if (cs === 'hero') { G(2, 9, ['.KKKKKKKKKKKKKK.', 'KKwwKKKKKKKKwwKK', 'KKwkKKhKKKKKwkKK', '.KKKK......KKKK.'], { K: '#1e1e30', h: '#3e3e5a', w: '#ffffff', k: '#1a1010' });
      G(7, 20, ['.YYYY.', 'YYRRYY', 'YRrRRY', 'YYRRYY', '.YYYY.', '..YY..'], { Y: '#ffd23a', R: '#d6262e', r: '#ff7a7a' }); G(2, 16, ['RR..............RR'], { R: '#a01a20' }); }
    if (cs === 'pirate') { for (let py = 1; py <= 5; py++) for (let px = 0; px < 20; px++) if (inHead(px, py)) P(px, py, 1, 1, py === 1 ? '#e8404a' : '#c8262e'); P(1, 5, 18, 1, '#9a1820');
      [[3, 2], [7, 3], [11, 2], [15, 3], [5, 4], [13, 4]].forEach(([dx, dy]) => P(dx, dy, 1, 1, '#ffffff')); G(17, 3, ['RR.', '.RR', '.RRr', '..rR'], { R: '#c8262e', r: '#9a1820' });
      G(11, 8, ['K.....', '.KKKK.', '.KkKK.', '.KKKK.'], { K: '#151515', k: '#3a3a3a' }); P(3, 8, 8, 1, '#151515'); G(18, 13, ['Y', 'y'], { Y: '#ffd84a', y: '#c48a1a' }); }
    if (cs === 'mummy') { for (let py = 1; py <= 17; py++) for (let px = 0; px < 20; px++) if (inHead(px, py)) P(px, py, 1, 1, (py + (px >> 2)) % 3 === 0 ? '#c8bea4' : '#f0eadc');
      for (let py = 18; py <= 39; py++) if (!sit || py < 33) P(4, py, 12, 1, (py + 1) % 3 === 0 ? '#c8bea4' : '#f0eadc'); G(15, 6, ['ww', '.ww', '..w'], { w: '#f0eadc' });
      G(4, 10, ['KKK.....KKK', 'KyK.....KyK'], { K: '#1a1010', y: '#ffe46a' }); }
    if (cs === 'pumpkinhead') { for (let py = 0; py <= 17; py++) for (let px = 0; px < 20; px++) if (((px - 9.5) / 9) ** 2 + ((py - 9) / 8.2) ** 2 <= 1) { const rid = [3, 7, 12, 16].includes(px); P(px, py, 1, 1, rid ? '#c8601a' : (px < 7 && py < 7 ? '#ffaa3a' : '#f08a1a')); }
      G(8, -3, ['.gG.', '..Gg', 'LGG.'], { G: '#3a6a2a', g: '#5a9a3a', L: '#6aba4a' });
      G(4, 8, ['.K.....K..', 'KYK...KYK.', 'KKKK.KKKK.'], { K: '#2a1408', Y: '#ffd84a' }); G(5, 13, ['KYKYKYKYK.', '.KKYKYKK..'], { K: '#2a1408', Y: '#ffd84a' }); }
    // 장르 코스튬 (악당·히어로·호러·SF) — 특정 작품 캐릭터가 아닌 오리지널 디자인
    if (cs === 'villain') { G(4, -3, ['.D...DE...D.', '.Y..YYY..Y..', 'YHY.YEY.YHY.', 'YYYYYYYYYYYY', 'DDDDDDDDDDDD'], { Y: '#e8c050', H: '#fff0b0', D: '#9a7020', E: '#4aff8a' });
      G(4, 9, ['KKKK....KKKK'], { K: '#151018' }); G(4, 11, ['.ge......eg.'.slice(0, 12)], { g: '#2aff7a', e: '#bfffd0' });
      G(1, 10, ['PP................PP', 'PpP..............PpP', 'PrpP............PrpP', 'PrrP............PrrP', 'PrrP............PrrP', '.PPP............PPP.', '..PP............PP..'], { P: '#4a1a66', p: '#7a3aa0', r: '#a01a30' }); }
    if (cs === 'starhero') { G(2, 9, ['KKKKKKKKKKKKKKKK', 'K.OwOOK..KOwOOK.', 'K.OOOOK..KOOOOK.', '.KKKKK....KKKKK.'], { K: '#2a2a2a', O: '#ffb43a', w: '#ffffff' });
      G(6, 19, ['...WW...', '..WYYW..', 'WWYYYYWW', '.WYYYYW.', '.WY..YW.', 'W......W'], { W: '#ffffff', Y: '#ffe46a' }); G(4, 27, ['OOOOOYYOOOOO'], { O: '#ffb43a', Y: '#fff0a0' }); }
    if (cs === 'plague') { G(-2, 2, ['....kkkkkkkkkkkkkkk.....', 'hhhhhhhhhhhhhhhhhhhhhhhh', 'kKKKKKKKKKKKKKKKKKKKKKKk'], { K: '#1e1a16', k: '#0e0c0a', h: '#3a342c' });
      G(3, -3, ['.KKKKKKKKKKKK.', 'KhKKKKKKKKKKKK', 'KhKKKKKKKKKKKK', 'KKKKKKKKKKKKKK', 'bbbbbbbbbbbbbb'], { K: '#1e1a16', h: '#3a342c', b: '#6a5040' });
      G(4, 9, ['.LLL...LLL.', 'LgwgL.LgwgL', '.LLL...LLL.'], { L: '#3a2a20', g: '#7ab8d0', w: '#e0f4ff' });
      G(6, 12, ['MMMMMMMM', 'MmMMMMMMM', '.MMmMMMMMm', '..MMMmMMMM', '...MMMMmMM', '.....MMMMm'], { M: '#d8c8a0', m: '#a89870' }); G(4, 16, ['KKK......KKK'], { K: '#1e1a16' }); }
    if (cs === 'gwishin') { G(1, 0, ['..KKKKKKKKKKKKKK..', '.KKbKKKKKKKKKbKKK.', 'KKKKKKKKKKKKKKKKKK', 'KKbKKKKKKKKKKKKbKK', 'KKKKKK.....KKKKKKK', 'KKKKK.......KKKKKK'], { K: '#0c0a10', b: '#2a3a5a' });
      for (let py = 6; py <= 22; py++) { P(1, py, 5, 1, '#0c0a10'); P(13, py, 6, 1, '#0c0a10'); if (py % 4 === 0) { P(2, py, 1, 1, '#2a3a5a'); P(16, py, 1, 1, '#2a3a5a'); } }
      P(8, 11, 2, 1, '#151515'); P(9, 14, 2, 1, '#9a1a2a'); P(9, 15, 1, 1, '#c03040'); P(6, 20, 1, 7, '#d8d4cc'); P(12, 22, 1, 5, '#d8d4cc'); }
    if (cs === 'astronaut') { for (let py = -2; py <= 19; py++) for (let px = -2; px < 22; px++) { const d = ((px - 9.5) / 11) ** 2 + ((py - 9) / 10.4) ** 2; if (d <= 1 && !inHead(px, py)) P(px, py, 1, 1, d > .86 ? '#9aa2b0' : (px < 5 && py < 6 ? '#ffffff' : '#e8ecf4')); }
      for (let py = 6; py <= 15; py++) for (let px = 3; px <= 16; px++) { const tt = (py - 6) / 9; P(px, py, 1, 1, `rgba(${Math.round(80 + 160 * tt)},${Math.round(150 + 40 * tt)},${Math.round(230 - 150 * tt)},.42)`); }
      P(4, 7, 3, 1, 'rgba(255,255,255,.9)'); P(4, 8, 1, 2, 'rgba(255,255,255,.7)'); P(17, -2, 1, 3, '#9aa2b0'); P(17, -3, 1, 1, '#ff4a4a');
      G(5, 20, ['KKKKKKKKKK', 'KrKgKbKyyK', 'KKKKKKKKKK'], { K: '#7a8090', r: '#ff4a5a', g: '#4aff8a', b: '#4aa0ff', y: '#ffd84a' }); P(4, 24, 12, 1, '#3a7aff'); }
    if (cs === 'robot') { G(1, -6, ['........RR........', '........Rr........', '........dd........', '........dd........', '........dd........', '.......dddd.......'], { R: '#ff4a4a', r: '#ffb0b0', d: '#6a7480' });
      for (let py = 0; py <= 16; py++) for (let px = 1; px <= 18; px++) P(px, py, 1, 1, px === 1 || py === 0 ? '#d0d8e2' : (px >= 16 || py >= 15 ? '#7a8490' : '#a8b2be'));
      [[3, 2], [16, 2], [3, 14], [16, 14]].forEach(([rx, ry]) => P(rx, ry, 1, 1, '#5a6470'));
      G(3, 6, ['KKKKKKKKKKKKKK', 'KCcCCCCCCCCcCK', 'KccCCCCCCCCccK', 'KKKKKKKKKKKKKK'], { K: '#151a20', C: '#5ae0ff', c: '#bff6ff' }); G(6, 12, ['GGGGGGGG', 'G.G.G.G.', 'GGGGGGGG'], { G: '#4a5460' });
      G(-1, 7, ['dd', 'Dd', 'dd'], { d: '#6a7480', D: '#9aa4b0' }); G(19, 7, ['dd', 'dD', 'dd'], { d: '#6a7480', D: '#9aa4b0' });
      G(5, 19, ['KKKKKKKKKK', 'KYK.GGG.CK', 'KKK.....KK', 'K.rrr.bbbK', 'KKKKKKKKKK'], { K: '#5a6470', Y: '#ffd23a', G: '#4aff8a', C: '#5ae0ff', r: '#ff5a5a', b: '#4a8aff' }); }
    if (cs === 'alien') { G(3, -6, ['.Y........Y.', 'YyY......YyY', '.Y........Y.', '..g......g..', '..g......g..', '...g....g...'], { Y: '#c8ff5a', y: '#f4ffc0', g: '#5aa04a' });
      G(3, 8, ['.KKKK..KKKK.', 'KKwKKK.KKwKK', 'KKKKKK.KKKKK', 'KKKKKK.KKKKK', '.KKKK..KKKK.'].map(r => r.slice(0, 12)), { K: '#0a0a0e', w: '#ffffff' }); P(5, 9, 1, 1, '#9af0ff'); P(11, 9, 1, 1, '#9af0ff');
      P(3, 4, 2, 1, '#6aba5a'); P(14, 5, 2, 1, '#6aba5a'); G(4, 17, ['SSSSSSSSSSSS', 'sSSSSSSSSSSs'], { S: '#c0c8d8', s: '#8a92a4' }); }
    // 할로윈 단골 캐릭터 (특정 작품 캐릭터가 아닌 누구나 아는 유형)
    if (cs === 'vampire') { G(6, 3, ['KKKKKKKK', '.KKKKKK.', '..KKKK..', '...KK...'], { K: hair }); P(8, 15, 1, 2, '#ffffff'); P(11, 15, 1, 2, '#ffffff'); if (frame !== 'b') { P(5, 11, 2, 1, '#e0202a'); P(13, 11, 2, 1, '#e0202a'); P(5, 11, 1, 1, '#ff8a8a'); P(13, 11, 1, 1, '#ff8a8a'); }
      G(1, 13, ['KK................KK', 'KrK..............KrK', 'KrrK............KrrK', 'KrrK............KrrK', '.KKK............KKK.'], { K: '#1a1016', r: '#b0202a' }); G(8, 19, ['.YY.', 'YRRY', '.YY.'], { Y: '#ffd84a', R: '#c0202a' }); }
    if (cs === 'frank') { G(1, -1, ['KKKKKKKKKKKKKKKKKK', 'KhKKKhKKKhKKKhKKKK', 'KKKKKKKKKKKKKKKKKK', 'KKKKKKKKKKKKKKKKKK', 'KKKKKKKKKKKKKKKKKK', '.KKKKKKKKKKKKKKKK.'], { K: '#151515', h: '#3a3a3a' });
      G(5, 5, ['sssssssss', '.s.s.s.s.'], { s: '#3a4a30' }); G(-2, 14, ['MMm', 'MDm', 'MMm'], { M: '#b0b8c0', D: '#7a828a', m: '#5a6268' }); G(19, 14, ['mMM', 'mDM', 'mMM'], { M: '#b0b8c0', D: '#7a828a', m: '#5a6268' }); P(4, 13, 3, 1, '#6a8a5a'); P(13, 13, 3, 1, '#6a8a5a'); }
    if (cs === 'skeleton') { for (let py = 8; py <= 16; py++) for (let px = 2; px < 18; px++) if (inHead(px, py)) P(px, py, 1, 1, px > 14 ? '#d8d4cc' : '#f6f4ee');
      G(4, 9, ['KKKK....KKKK', 'KKwK....KwKK', 'KKKK....KKKK', '.KK......KK.'], { K: '#151515', w: '#9af0ff' }); G(8, 13, ['.KK.', 'K..K'], { K: '#151515' }); G(6, 15, ['KKKKKKKK', 'K.K.K.KK'], { K: '#151515' });
      [20, 22, 24, 26].forEach(y => { P(6, y, 8, 1, '#ece8e0'); P(6, y + 1, 8, 1, 'rgba(0,0,0,.25)'); }); P(9, 19, 2, 9, '#f6f4ee'); P(fem ? 3 : 2, 21, 1, 7, '#ece8e0'); P(fem ? 15 : 16, 21, 1, 7, '#ece8e0'); if (!sit) { P(7, 30, 1, 9, '#ece8e0'); P(12, 30, 1, 9, '#ece8e0'); } }
    if (cs === 'zombie') { P(4, 13, 3, 1, '#6a7a5a'); P(13, 12, 3, 2, '#6a7a5a'); G(12, 3, ['K.K.K', 'KKKKK', 'K.K.K'], { K: '#5a2a2a' }); P(5, 6, 3, 2, '#8a9a6e'); P(14, 16, 2, 1, '#8a9a6e');
      G(5, 21, ['r.....', 'r...KK', 'R..K..', '...K..'], { r: '#8a1a1a', R: '#b02020', K: '#1a1414' }); [5, 8, 12].forEach(k => { P(k, 27, 2, 1, '#1a1414'); P(k + 1, 28, 1, 1, '#1a1414'); }); P(4, 19, 2, 2, '#5a6a7a'); }
    if (cs === 'werewolf') { const pal = { F: '#5e5048', f: '#8a7a6e', p: '#f39ab0', K: '#2a1e18' };
      G(0, -4, ['F....', 'FF...', 'FpF..', 'fFpF.', 'fFFFF'], pal); G(15, -4, ['....F', '...FF', '..FpF', '.FpFf', 'FFFFf'], pal);
      G(-1, 9, ['FF', 'fF', 'FF', 'fFF', '.FF', '.fF'], pal); G(19, 9, ['FF', 'Ff', 'FF', 'FFf', 'FF.', 'Ff.'], pal);
      P(9, 12, 2, 1, '#2a1a1a'); P(8, 15, 1, 2, '#ffffff'); P(11, 15, 1, 2, '#ffffff'); G(5, 20, ['K.K.K.K.K.', '.K.K.K.K.K'], pal); P(1, 28, 1, 1, '#f0f0f0'); P(3, 28, 1, 1, '#f0f0f0'); P(16, 28, 1, 1, '#f0f0f0'); P(18, 28, 1, 1, '#f0f0f0'); }
    if (cs === 'reaper') { for (let py = -1; py <= 17; py++) for (let px = -1; px < 21; px++) { const inH = ((px - 9.5) / 10.4) ** 2 + ((py - 8.6) / 10) ** 2 <= 1; if (inH && (py < 6 || px <= 2 || px >= 17)) P(px, py, 1, 1, (px <= 0 || py <= 0) ? '#2e2834' : (px >= 18 ? '#0c0a0e' : '#1a161e')); }
      P(3, 6, 14, 1, '#0c0a0e'); P(3, 7, 2, 10, '#0c0a0e'); P(15, 7, 2, 10, '#0c0a0e');
      G(21, -6, ['.', '.', 'W'], { W: '#ffffff' }); for (let py = -4; py <= 38; py++) P(21, py, 1, 1, py % 5 ? '#7a5634' : '#5a3a1e');
      G(12, -6, ['..WWWWWWWW', '.WSSSSSSSSS', 'WSSSssss..S', 'Ss........', 's.........'], { W: '#ffffff', S: '#c8d0d8', s: '#7a828c' }); }
    if (cs === 'jiangshi') { G(1, -2, ['......RR......', '.....RrR......', '.KKKKKKKKKKKKKK.', 'KhKKKKKKKKKKKKKK', 'KKKKKKKKKKKKKKKK', 'YYYYYYYYYYYYYYYY', 'KKKKKKKKKKKKKKKKKK'], { K: '#1a1a2a', h: '#3a3a52', R: '#d02030', r: '#ff8a8a', Y: '#d8b040' });
      G(8, 4, ['YYYY', 'YRRY', 'YYRY', 'YRRY', 'YYRY', 'YRYY', 'YRRY', 'YYRY', 'YYYY', '.YY.'], { Y: '#f6e05a', R: '#c0202a' });
      G(3, 18, ['YYYYYYYYYYYYYY', '......YY......', '......YY......', '......YY......', '......YY......', '......YY......', '......YY......', '......YY......', '......YY......', 'YYYYYYYYYYYYYY'], { Y: '#d8b040' }); }
    // 크리스마스
    if (cs === 'santasuit') { for (let py = -2; py <= 3; py++) for (let px = 0; px < 20; px++) if (py < 1 || inHead(px, py)) if (px >= 3 + Math.max(0, -py) * 2 && px <= 16) P(px, py, 1, 1, px < 6 ? '#ee3a40' : '#d6262e');
      G(14, -5, ['.RR..', 'RRRR.', '..RWW', '..WWW', '..WWw'], { R: '#d6262e', W: '#ffffff', w: '#dfe4ec' }); G(1, 3, ['wWWWWWWWWWWWWWWWWw', 'WWwWWWwWWWwWWWwWWW'], { W: '#ffffff', w: '#dfe4ec' });
      G(3, 12, ['W............W', 'WW..WWWWWW..WW', 'WWWWWwWWwWWWWW', '.WWWWWWWWWWWW.', '..WWWWwWWWWW..', '...WWWWWWWW...', '....WWWWWW....', '.....WWWW.....'], { W: '#ffffff', w: '#dfe4ec' });
      G(4, 25, ['KKKKKYYKKKKK', 'KKKKKYYKKKKK', 'WWWWWWWWWWWW'], { K: '#151515', Y: '#ffd23a', W: '#ffffff' }); P(9, 19, 2, 6, '#ffffff'); }
    if (cs === 'elf') { for (let k = 0; k < 8; k++) { const w2 = 14 - k * 2 > 1 ? 14 - k * 2 : 2; P(3 + k, 4 - k, w2, 1, '#2a8a4a'); P(3 + k, 4 - k, 1, 1, '#4ab06a'); }
      G(15, -5, ['GGGG.', '...GY', '...YH'], { G: '#2a8a4a', Y: '#ffd23a', H: '#fff2a0' }); G(1, 4, ['RRWRRWRRWRRWRRWRRW', 'rrrrrrrrrrrrrrrrrr'], { R: '#d6262e', W: '#ffffff', r: '#9a1820' });
      G(-2, 8, ['s...', 'sss.', '.ss.'], { s: skin }); G(18, 8, ['...s', '.sss', '.ss.'], { s: skin }); G(4, 25, ['KKKKKYYKKKKK'], { K: '#151515', Y: '#ffd23a' }); }
    if (cs === 'snowman') { G(4, -5, ['.KKKKKKKKKK.', '.KhKKKKKKKK.', '.KhKKKKKKKK.', '.KKKKKKKKKK.', '.RRRRRRRRRR.', 'KKKKKKKKKKKKKK'], { K: '#151515', h: '#3a3a3a', R: '#d6262e' }); P(2, 1, 16, 1, '#151515');
      G(10, 11, ['OOOo', 'Oo..'], { O: '#f08a1a', o: '#c8601a' }); G(3, 16, ['RRhRRhRRhRRhRR', 'RRRRRRRRRRRRRR'], { R: '#d6262e', h: '#ff6a6a' }); G(12, 18, ['RRR', 'RhR', 'RRR', 'RhR', 'w.w'], { R: '#d6262e', h: '#ff6a6a', w: '#ffffff' }); [21, 24, 27].forEach(y => G(9, y, ['Kk', 'KK'], { K: '#151515', k: '#4a4a4a' })); }
    if (cs === 'ginger') { G(3, 8, ['WW.WW.WW.WW.WW'], { W: '#ffffff' }); G(6, 14, ['W......W', '.WWWWWW.'], { W: '#ffffff' }); [[9, 20, '#e23b4a'], [9, 23, '#4fd36a'], [9, 26, '#3a7aff']].forEach(([gx, gy, c]) => G(gx, gy, ['cc', 'cw'], { c, w: '#ffffff' })); for (let k = 0; k < 7; k++) P(3 + k * 2, 28 + (k % 2), 1, 1, '#ffffff'); P(2, 22, 1, 1, '#ffffff'); P(17, 22, 1, 1, '#ffffff'); }
    if (cs === 'sweater') { G(4, 19, ['WGWGWGWGWGWG', 'GWGWGWGWGWGW', '....YY......', '...GGGG.....', '..GGRGGG....', '.GGGGGRGG...', '.....KK.....', 'WGWGWGWGWGWG'], { W: '#ffffff', G: '#2a8a4a', Y: '#ffd23a', R: '#e23b4a', K: '#6a4020' }); }
    if (cs === 'xtree') { G(7, -6, ['..YY..', '.YHHY.', 'YHHHHY', '.YHHY.', 'Y.YY.Y'], { Y: '#ffd23a', H: '#fff6c0' });
      for (let k = 0; k < 13; k++) { const w2 = 6 + k; P(10 - Math.ceil(w2 / 2), 17 + k, w2, 1, k % 4 === 3 ? '#1a5a30' : (k % 2 ? '#2a8a4a' : '#3aa05a')); }
      [[6, 21, '#e23b4a'], [12, 23, '#ffd23a'], [8, 26, '#3a7aff'], [14, 28, '#e23b4a'], [5, 28, '#ffd23a'], [10, 19, '#ff8ad8']].forEach(([a2, b2, c2]) => { P(a2, b2, 2, 2, c2); P(a2, b2, 1, 1, '#ffffff'); }); }
    if (cs === 'earmuff') { G(1, 1, ['..RRRRRRRRRRRRRR..', '.RhhhhhhhhhhhhhhR.', 'R................R'], { R: '#c82a3a', h: '#ff5a6a' });
      G(-3, 7, ['.WWW.', 'WWwWW', 'WwWWW', 'WWWwW', '.WWW.'], { W: '#ffffff', w: '#e6e8f2' }); G(18, 7, ['.WWW.', 'WWwWW', 'WWWwW', 'WwWWW', '.WWW.'], { W: '#ffffff', w: '#e6e8f2' }); P(4, 16, 12, 2, '#3a7aff'); P(4, 16, 12, 1, '#6aa0ff'); }
    // 생일 고깔모자
    if (cs === 'party') { for (let k = 0; k < 9; k++) P(9 - Math.floor(k / 1.6), -6 + k, 2 + Math.floor(k / 1.6) * 2, 1, k % 3 === 0 ? '#ffd23a' : (k % 3 === 1 ? '#ff6aa8' : '#4ad0e0')); P(9, -8, 2, 2, '#ffffff'); P(10, -8, 1, 1, '#ffd23a'); }
    // 기념일 코스튬
    if (cs === 'heartband') { P(2, 4, 16, 1, '#e23b6a'); P(2, 3, 16, 1, '#ff7aa0'); G(6, -2, ['.RR.RR.', 'RwRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'], { R: '#ff3a6a', w: '#ffd0e0' }); }
    if (cs === 'rosehair') { G(14, 1, ['.RRR.', 'RrRdR', 'RdrRR', 'RRdRR', '.RRR.', 'GG.GG'], { R: '#d6202e', r: '#ff6a7a', d: '#8a1020', G: '#3a8a3a' }); }
    if (cs === 'pepero') { G(11, 9, ['.....c', '....c.', '...c..', '..B...', '.B....', 'B.....'], { c: '#ecc878', B: '#5a3020' }); }
    if (cs === 'candy') { G(-2, 15, ['.PWP.', 'PWPWP', 'WPWPW', 'PWPWP', '.PWP.', '..w..', '..w..', '..w..', '..w..', '..w..', '..w..'], { P: '#ff6ab0', W: '#ffffff', w: '#e8e8f0' }); }
    // 시크릿 코스튬
    // 한복 (여: 저고리 + 치마 / 남: 저고리 + 바지 · 조끼 · 두루마기)
    if (cs === 'hanbok' || cs === 'hanbok2' || cs === 'hanbok3') {
      const v = cs === 'hanbok' ? 0 : cs === 'hanbok2' ? 1 : 2, J = shirt, j = shade(shirt, .8), C = pants, c = shade(pants, .78), cl = shade(pants, 1.2);
      const SAEK = ['#e23b4a', '#f6cc4a', '#3aa05a', '#3a7ad0', '#ff8ab8'], gor = ['#c0203a', '#d8507a', '#b8902a'][v];
      if (v === 0) for (let yy = 19; yy <= 26; yy++) { P(ax, yy, 2, 1, SAEK[(yy - 19) % 5]); if (!(frame === 's' || frame === 'k' || frame === 'c' || frame === 'C')) P(19 - ax - 1, yy, 2, 1, SAEK[(yy - 19) % 5]); }   // 색동 소매
      if (fem) { P(5, 18, 10, 4, J); P(12, 18, 3, 4, j); G(7, 18, ['WW..WW', '.WWWW.'], { W: '#ffffff' }); G(10, 21, ['GG', '.G', '.G', '.G', 'G.'], { G: gor });   // 짧은 저고리 + 동정 + 고름
        const top = 22, bot = sit ? 36 : 40; for (let yy = top; yy <= bot; yy++) { const sp = Math.min(4, (yy - top) >> 2), x0 = 5 - sp, w = 10 + sp * 2; P(x0, yy, w, 1, C); P(x0, yy, 1, 1, cl); P(x0 + w - 1, yy, 1, 1, c); if ((yy - top) % 3 === 2) { P(x0 + 3, yy, 1, 1, c); P(x0 + w - 4, yy, 1, 1, c); } }
        if (v === 2) { P(1, bot - 1, 18, 1, '#e8c060'); P(3, bot - 3, 14, 1, '#e8c060'); } }
      else { P(4, 18, 12, 10, J); P(13, 18, 3, 10, j); G(7, 18, ['WW..WW', '.WWWW.', '..WW..'], { W: '#ffffff' }); G(10, 21, ['GGG', '.G.', '.G.', 'G..'], { G: gor });
        if (v === 1) G(5, 19, ['VVVV..VVVV', 'VVVVV.VVVV', 'VVVVVVVVVV', 'VVVVYVVVVV', 'VVVVVVVVVV', 'VVVVYVVVVV', 'VVVVVVVVVV'], { V: '#e89ab0', Y: '#ffd84a' });   // 조끼
        if (v === 2) { for (let yy = 18; yy <= (sit ? 34 : 38); yy++) { P(3, yy, 14, 1, '#2a3a6a'); P(3, yy, 1, 1, '#4a5a8a'); P(16, yy, 1, 1, '#1a2448'); } G(7, 18, ['WW..WW', '.WWWW.', '..WW..'], { W: '#ffffff' }); G(10, 21, ['GGG', '.G.', '.G.', '.G.', 'G..'], { G: '#b8902a' }); }   // 두루마기
        else if (!sit) { for (let yy = 28; yy <= 38; yy++) { const puff = yy > 30 && yy < 36 ? 1 : 0; P(4 - puff, yy, 5 + puff, 1, C); P(11, yy, 5 + puff, 1, C); P(4 - puff, yy, 1, 1, cl); P(15 + puff, yy, 1, 1, c); } P(4, 37, 5, 1, '#5a4a6a'); P(11, 37, 5, 1, '#5a4a6a'); } } }
    if (cs === 'bokjumeoni') G(-1, 24, ['.YY.', 'RRRR', 'RyRR', 'RRRR', '.RR.'], { R: '#d6262e', y: '#ffd84a', Y: '#ffd84a' });   // 복주머니
    if (cs === 'gat') { G(-1, 1, ['......KKKKKKKK......', '.....KKkKKKKKKK.....', '.....KKKKKKKKKK.....', 'kKKKKKKKKKKKKKKKKKKk', '.kkkkkkkkkkkkkkkkkk.'], { K: '#1a1a1e', k: '#3a3a44' }); for (let yy = 6; yy <= 16; yy++) { P(2, yy, 1, 1, yy % 2 ? '#c8a050' : '#e0c080'); P(17, yy, 1, 1, yy % 2 ? '#c8a050' : '#e0c080'); }   // 갓 + 갓끈
      for (let yy = 18; yy <= (sit ? 34 : 39); yy++) { const sp = (yy - 18) >> 3; P(3 - sp, yy, 14 + sp * 2, 1, '#f6f2ea'); P(3 - sp, yy, 1, 1, '#ffffff'); P(16 + sp, yy, 1, 1, '#d8d0c0'); } P(4, 26, 12, 1, '#c0203a'); G(12, 27, ['R.', 'R.', '.R'], { R: '#c0203a' }); G(7, 18, ['DD..DD', '.DDDD.'], { D: '#2a3a6a' }); }   // 도포 + 세조대
    if (cs === 'jokduri') { G(5, -3, ['..Y..Y..Y..', '.KKKKKKKKK.', 'KKRKKBKKRKK', '.KKKKKKKKK.'], { K: '#1a1a20', Y: '#ffd84a', R: '#e0203a', B: '#3a8ae0' }); P(3, 13, 2, 2, '#e8303a'); P(15, 13, 2, 2, '#e8303a'); P(9, 7, 2, 2, '#e8303a');   // 족두리 + 연지곤지
      P(5, 18, 10, 4, '#2a8a5a'); for (let yy = 19; yy <= 26; yy++) { P(ax, yy, 2, 1, ['#e23b4a', '#f6cc4a', '#3aa05a', '#3a7ad0', '#ffffff'][(yy - 19) % 5]); }
      const bot = sit ? 36 : 40; for (let yy = 22; yy <= bot; yy++) { const sp = Math.min(4, (yy - 22) >> 2), x0 = 5 - sp, w = 10 + sp * 2; P(x0, yy, w, 1, '#c8202a'); P(x0, yy, 1, 1, '#ff5a5a'); if (yy % 4 === 0) P(9, yy, 2, 1, '#e8c060'); } P(1, bot - 1, 18, 1, '#e8c060'); G(7, 18, ['WW..WW', '.WWWW.'], { W: '#ffffff' }); }
    if (cs === 'rabbit') { G(3, -9, ['WW......WW', 'WpW....WpW', 'WpW....WpW', 'WpW....WpW', 'WpW....WpW', '.WW....WW.', '.WW....WW.'], { W: '#ffffff', p: '#ffb0c8' }); P(3, 13, 2, 1, '#ff9ab8'); P(15, 13, 2, 1, '#ff9ab8'); G(-1, 22, ['.GG.', 'GWWG', 'GWWG', '.GG.'], { G: '#7ac07a', W: '#ffffff' }); }   // 달토끼 귀 + 송편
    // 사장 전용 바텐더 복장 (낯 사장 = 조끼·보타이·소매 걷기 / 선 사장 = 와인 앞치마·스카프) + 셰이커
    if (cs === 'barvest') { const ra = frame === 's' || frame === 'k' || frame === 'c' || frame === 'C';
      if (frame !== 'c' && frame !== 'C') { P(ax, 24, 2, 3, skin); P(ax, 21, 2, 1, '#2a2a30'); } if (!ra) { P(19 - ax - 1, 24, 2, 3, shade(skin, .92)); P(19 - ax - 1, 21, 2, 1, '#2a2a30'); }
      G(4, 18, ['VVVW....WVVV', 'VvVVW..WVVvV', 'VvVVVWWVVVvV', 'VvVVVYVVVNNV', 'VvVVVVVVVVvV', 'VvVVVYVVVVvV', 'VVVVVVVVVVVV', 'VvVVVYVVVVvV', 'VVVVVVVVVVVV', '.VVVV..VVVV.'], { V: '#1e1e24', v: '#3a3a46', W: '#f4f2ee', Y: '#ffd84a', N: '#e8c060' });
      G(7, 17, ['KK..KK', 'KKkKKK', 'KK..KK'], { K: '#151518', k: '#3a3a46' }); G(2, 17, ['WW', 'Ww', '.W', '.w', '.W'], { W: '#ffffff', w: '#d8d8e0' });
      if (!ra && frame !== 'c' && frame !== 'C') G(-1, 25, ['G..G', 'GaaG', 'GAaG', 'GGGG'], { G: '#d8eef8', a: '#e8a040', A: '#c87a20' }); }
    if (cs === 'barapron') { const ra = frame === 's' || frame === 'k';
      G(7, 17, ['MMMMMM', '.MmmM.', '..MM..'], { M: '#e0a030', m: '#ffd070' });
      if (!sit) for (let yy = 20; yy <= 38; yy++) { const x0 = yy < 28 ? 5 : 5 - ((yy - 28) >> 3), w = 10 + (5 - x0) * 2; P(x0, yy, w, 1, '#6a1a2a'); P(x0, yy, 1, 1, '#8a2a3a'); P(x0 + w - 1, yy, 1, 1, '#4a0e1a'); }
      P(5, 19, 1, 1, '#6a1a2a'); P(14, 19, 1, 1, '#6a1a2a'); G(6, 28, ['aaaa', 'aSaa', 'aaaa'], { a: '#8a2a3a', S: '#d8dce6' }); P(4, 27, 12, 1, '#4a0e1a'); P(1, 13, 1, 1, '#ffd84a'); P(18, 13, 1, 1, '#ffd84a');
      if (!ra && frame !== 'c' && frame !== 'C') G(-2, 21, ['GGGGG', '.GPG.', '..G..', '..G..', '.GGG.'], { G: '#d8eef8', P: '#ff6aa8' }); }
    // 레전드: 아이돌 무대의상 (스팽글 재킷 + 헤드셋 마이크)
    if (cs === 'idolm') {   // 오버핏 블랙 레더 재킷 + 은사 자수 + 흰 이너 드레이프 + 레이어드 체인 + 와이드 레더 팬츠 + 부츠
      G(1, 18, ['LKKKKKKWWKKKKKKKL.', 'LKhKKKKWWWKKKKhKKL', '.KhKsKKWWWWKKsKhK.', '.KhKKsKWWWWKsKKhK.', '.KhKKKKKWWWWKKKhK.', '.KhKsKKKKWWWWsKhK.', '.KKKKsKKKKWwWKKKK.', '.KhKKKKKKKKWwKKhK.', '.KKKKKsKKKKKWKKKK.', '.KKKKKKKKKKKKKKKK.'], { K: '#1c1c24', h: '#3e3e4c', L: '#2a2a34', W: '#f4f2ee', w: '#cfcac0', s: '#c8ccd8' });
      G(6, 19, ['S......S', '.S....S.', '..SSSS..', '.S....S.', '..SSSS..', '....T...'], { S: '#d8dce6', T: '#9aa0b0' });   // 레이어드 은 체인
      if (!sit) { G(4, 28, ['KKKKKKKKKKKK', 'KhKKKKKKKKhK', 'KhKKK..KKKhK', 'KhKKK..KKKhK', 'KhKKK..KKKhK', 'KKKKK..KKKKK', 'KhKKK..KKKhK', 'KhKKK..KKKhK', 'KKKKK..KKKKK', 'BBBBB..BBBBB', 'BBBBBB.BBBBBB', 'bbbbbb.bbbbbb'], { K: '#141418', h: '#34343e', B: '#0c0c10', b: '#2a2a30' }); }
      G(0, 8, ['KK...', 'Kw...', '.K...', '.K...', '..K..', '..KK.', '...KKm'], { K: '#2a2a30', w: '#c8ccd8', m: '#c8c8d0' }); P(18, 11, 1, 2, '#c8ccd8'); }   // 인이어 + 헤드셋 마이크 + 피어싱
    if (cs === 'idolf') {   // 파워숄더 크롭 블레이저 + 올블랙 + 링 벨트 + 싸이하이 부츠
      G(2, 18, ['LLKKKKKKKKKKKKLL', 'LKhKK.KKKK.KKhKL', '.KhK..KhhK..KhK.', '.KhK..KKKK..KhK.', '.KhK..KKKK..KhK.', '.KKKK.KKKK.KKKK.'], { K: '#18181e', h: '#3a3a46', L: '#26262e' });
      G(8, 19, ['.ss.', 's..s', '.ss.'], { s: '#f0d0b8' });   // 키홀 디테일
      if (!sit) { G(5, 27, ['KKKKKKKKKK', 'KKKKKKKKSK', 'KKKKKKKKKK', 'KKKKKKKKKK'], { K: '#18181e', S: '#d8dce6' });
        P(6, 31, 3, 2, skin); P(11, 31, 3, 2, skin); G(5, 33, ['BBBB..BBBB', 'BhBB..BhBB', 'BhBB..BhBB', 'BBBB..BBBB', 'BhBB..BhBB', 'BBBB..BBBB', 'BBBBB.BBBBB', 'bbbbb.bbbbb', '...........'], { B: '#0e0e12', h: '#3a3a46', b: '#2a2a30' }); }
      else { P(4, 28, 12, 4, '#18181e'); P(6, 32, 3, 5, '#0e0e12'); P(11, 32, 3, 5, '#0e0e12'); }
      G(0, 8, ['KK...', 'Kw...', '.K...', '.K...', '..K..', '..KK.', '...KKm'], { K: '#2a2a30', w: '#e8ecf4', m: '#e8e8f0' }); P(1, 13, 1, 2, '#d8dce6'); P(18, 13, 1, 2, '#d8dce6'); }   // 인이어 + 헤드셋 마이크 + 은 귀걸이
    if (cs === 'idolm2' || cs === 'idolf2') {   // 올리브 벨벳 재킷(광택) + 금사 자수 + 레이어드 비즈 목걸이 + 와이드 데님 + 부츠
      const f2 = cs === 'idolf2', pal = { V: '#55642c', v: '#7d8c44', d: '#2e3a18', g: '#d8b050', W: '#f4f2ee', T: '#e8d8bc', R: '#c8302a', Q: '#3ab0a8', Y: '#ffd84a', s: skin };
      if (!f2) G(1, 18, ['.VVVVVVWWVVVVVVVV.', 'VvVgVVVWWWVVVgVvVV', 'VvVgVVWWWWVVVgVvV.', '.vVVgVVWWWVVgVVvV.', '.vVVVVVVWWVVVVVvV.', '.VVVgVVVVWVVVgVVV.', '.vVVVVVVVVVVVVVvV.', '.VVVVVVVVVVVVVVVV.', '.vVVVVVVVVVVVVVvV.', '.dVVVVVVVVVVVVVVd.', '.dVVVVVd..dVVVVVd.', '.dVVVVd....dVVVVd.'], pal);
      else G(3, 18, ['VVVVVVTTVVVVVV', 'VvVgVTTTTVgVvV', 'VvVgVTTTTVgVvV', '.vVVVTTTTVVVv.', '.VVVVTTTTVVVV.', '.dVVVTTTTVVVd.'], pal);
      G(6, 19, ['Y.R..Q.Y', '.Y.QR.Y.', '..YRQY..', '..Q..R..', '...YY...'], pal);   // 비즈 목걸이 겹쳐 걸기
      if (!sit) { G(f2 ? 4 : 4, 28, ['JJJJJJJJJJJJ', 'JjJJJJJJJJjJ', 'JjJJJ..JJJjJ', 'JjJJJ..JJJjJ', 'JjJss..JJJjJ', 'JjJJJ..JJJjJ', 'JjJJJ..JJJjJ', 'JJJJJ..JJJJJ', 'JJJJJJ.JJJJJJ', 'BBBBBB.BBBBBB', 'bbbbbb.bbbbbb'], { J: '#7a9ac8', j: '#b0c8e8', s: skin, B: '#1a1414', b: '#3a3030' }); }
      G(0, 8, ['KK...', 'Kw...', '.K...', '.K...', '..K..', '..KK.', '...KKm'], { K: '#2a2a30', w: '#d8b050', m: '#c8c8d0' }); }
    // 연예인 컨셉 레어
    if (cs === 'trot') { for (let yy = 18; yy <= 27; yy++) for (let xx = 4; xx <= 15; xx++) if ((xx + yy * 2) % 4 === 0) P(xx, yy, 1, 1, '#fff2a0'); P(4, 18, 1, 10, '#c48a1a'); P(15, 18, 1, 10, '#c48a1a');
      G(7, 18, ['RR.RR', 'RRRRR', 'RR.RR'], { R: '#d6262e' }); G(-1, 22, ['SSS', 'SsS', 'SSS', '.K.', '.K.', '.K.'], { S: '#e4e8f0', s: '#8a90a0', K: '#202024' }); }   // 반짝이 정장 + 나비넥타이 + 핸드마이크
    if (cs === 'rock') { P(9, 18, 1, 10, '#c8ccd4'); [[5, 19], [14, 19], [5, 22], [14, 22]].forEach(([sx, sy]) => P(sx, sy, 1, 1, '#d8dce4'));
      G(0, 15, ['............HH', '...........HHw', '..........NN..', '.........NN...', '........NN....', '.......NN.....', '..RRR.NN......', '.RRRRNN.......', 'RRrRRRR.......', 'RRKWKRR.......', 'RRRRRRR.......', '.RRRRR........', '..RRR.........'], { R: '#d6262e', r: '#ff7a7a', W: '#f4f4f4', K: '#1a1a1a', N: '#d8a060', H: '#2a2a2a', w: '#c8c8d0' }); }   // 가죽 재킷 + 일렉 기타
    if (cs === 'rapper') { for (let py = 1; py <= 6; py++) for (let px = 0; px < 20; px++) if (inHead(px, py)) P(px, py, 1, 1, py === 1 ? '#5a6aff' : '#3a4ad0'); G(0, 6, ['KKKKKKKKKKKKKKKKKKKKKK'], { K: '#2a3290' }); P(8, 3, 4, 2, '#ffd84a');
      G(4, 17, ['Y..........Y', '.Y........Y.', '..Y......Y..', '...YYYYYY...', '.....YY.....', '....YHHY....', '....YYYY....'], { Y: '#ffd84a', H: '#fff6c0' }); }
    if (cs === 'topstar') { G(3, 2, ['KKKKKK..KKKKKK', 'KbbBBK..KbbBBK'], { K: '#151518', b: '#7a8ab8', B: '#24304a' });   // 머리 위 선글라스
      if (fem) { if (!sit) for (let yy = 27; yy <= 40; yy++) { const sp = (yy - 27) >> 2; P(5 - sp, yy, 10 + sp * 2, 1, '#c8102a'); P(6 - sp, yy, 1, 1, '#ff5a6a'); if ((yy * 3) % 5 === 0) P(9, yy, 1, 1, '#ffd0d8'); }
        G(6, 18, ['W.W.W.W.', '.W.W.W.W'], { W: '#ffffff' }); }
      else { G(7, 18, ['.WWWWW.', '.WWKWW.', '..WKW..', '..WKW..', '..WKW..'], { W: '#ffffff', K: '#151518' }); G(8, 18, ['KRRK'], { K: '#151518', R: '#c8102a' }); G(5, 19, ['L', 'L', 'L'], { L: '#3a3a44' }); G(14, 19, ['L', 'L', 'L'], { L: '#3a3a44' }); } }
    if (cs === 'goldking') {
      G(3, -7, ['w.....w.....w', 'Y....YRY....Y', 'YY..YYrYY..YY', 'YHYYYHYHYYYHY', 'YYYYYYYYYYYYY', 'YRYDBYEYBDYRY', 'DDDDDDDDDDDDD', 'WKWWWKWWWKWWW'], GOLD);   // 보석 왕관 + 털 장식
      G(2, 16, ['WWKW..........WKWW', '.WWW..........WWW.'], GOLD);   // 어깨 털 망토깃
      G(6, 19, ['Y......Y', '.Y....Y.', '..Y..Y..', '...YY...', '...RR...', '...DD...'], GOLD);   // 금목걸이 + 루비 메달
      G(-1, 12, ['.YRY.', 'YRrRY', '.YRY.', '..H..', '..Y..', '..Y..', '..D..', '..Y..', '..Y..', '..D..', '..Y..', '..Y..', '..D..', '..Y..', '..d..'], GOLD);   // 왕홀
    }
    if (cs === 'goldqueen') {
      G(4, -4, ['.....P.....', '..w.PpP.w..', '.YwYYPYYwY.', 'YYHYYYYYHYY', 'DwDwDwDwDwD'], GOLD);   // 티아라
      G(1, 12, ['Y', 'P'], GOLD); G(18, 12, ['Y', 'P'], GOLD);   // 귀걸이
      G(2, 16, ['WWKW..........WKWW', '.WWW..........WWW.'], GOLD);
      G(6, 18, ['w.w.w.w.', '.w.w.w.w', '...PP...'], GOLD);   // 진주 목걸이
      if (!sit) for (let yy = 27; yy <= 39; yy++) { const sp = (yy - 27) >> 2, x0 = 5 - sp, w = 10 + sp * 2; P(x0, yy, w, 1, '#f06aa8'); P(x0 + 2, yy, 1, 1, '#ffb0d8'); P(x0 + w - 3, yy, 1, 1, '#c04a88'); if (yy % 3 === 0) P(9, yy, 2, 1, '#c04a88'); }
      else { P(4, 27, 12, 6, '#f06aa8'); P(5, 27, 1, 6, '#ffb0d8'); P(13, 27, 1, 6, '#c04a88'); }
      P(5, 27, 10, 1, '#ffd84a'); P(9, 27, 2, 1, '#ff5ab0');   // 금 허리띠
      if (!sit) { P(3, 39, 14, 1, '#ffd84a'); }
      G(-1, 15, ['..Y..', '.YHY.', 'YHHHY', '.YHY.', 'Y.Y.Y', '..D..', '..Y..', '..Y..', '..D..', '..Y..', '..Y..', '..d..'], GOLD);   // 별 지팡이
    }
    if (cs === 'unicorn') {
      G(8, -8, ['.w.', '.wY', 'Yw.', '.wY', 'Yww', 'wwY', 'Yww', 'wwY'], { w: '#fffaf0', Y: '#ffd84a' });   // 나선 뿔
      G(3, -3, ['W.', 'WW', 'pW', 'WW'], GOLD); G(15, -3, ['.W', 'WW', 'Wp', 'WW'], GOLD);   // 귀
      G(4, 1, ['..ppPP..PPpp..', '.PPbbBBbbPPP..', '..BBeeEEee.....'], { p: '#ffb0cc', P: '#ff7aa8', b: '#ffe46a', B: '#ffb46a', e: '#9af0c0', E: '#6ae0a8' });   // 무지개 앞머리
      P(15, 12, 1, 1, '#ffe46a'); P(14, 12, 1, 1, '#fff6c0'); P(16, 12, 1, 1, '#fff6c0'); P(15, 11, 1, 1, '#fff6c0'); P(15, 13, 1, 1, '#fff6c0');   // 볼 별
      [[6, 21], [12, 24], [8, 26]].forEach(([sx, sy]) => P(sx, sy, 1, 1, '#ffd84a'));   // 옷 별무늬
    }
    }
    if (clap) { const hx = frame === 'c' ? 0 : 2, sl = shade(shirt, .85);   // 박수 손은 옷·소품 위에
      P(ax + 1, 23, 7 - hx - ax, 2, sl); P(11 + hx, 23, 7 - hx - ax, 2, sl); P(8 - hx, 20, 2, 4, skin); P(10 + hx, 20, 2, 4, skin); P(8 - hx, 20, 1, 1, shade(skin, 1.08)); if (!hx) { P(7, 18, 1, 1, '#fff6c0'); P(12, 18, 1, 1, '#fff6c0'); } }
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
  // 시크릿 광채: 뒤에서 도는 빛줄기 + 은은한 후광
  const SECRET_KEYS = new Set(SECRET.map(x => x[0]));
  const LEGEND_KEYS = new Set(LEGEND.map(x => x[0]));
  function radiance(c, cx, cy, r, t, a, stage) {
    const cols = stage ? ['255,110,200', '110,220,255', '190,130,255', '255,240,140'] : ['255,214,90', '255,240,170'];
    c.save(); c.translate(cx, cy); c.rotate((t || 0) / (stage ? 1600 : 2600));
    for (let i = 0; i < 10; i++) { c.rotate(Math.PI / 5); c.fillStyle = `rgba(${cols[i % cols.length]},${(i % 2 ? .35 : .5) * a})`; c.beginPath(); c.moveTo(0, 0); c.lineTo(r, -r * .16); c.lineTo(r, r * .16); c.closePath(); c.fill(); }
    c.restore(); const g = c.createRadialGradient(cx, cy, 0, cx, cy, r * .7); g.addColorStop(0, `rgba(255,248,210,${.75 * a})`); g.addColorStop(1, 'rgba(255,214,90,0)'); c.fillStyle = g; c.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  // 코스튬별 광채: 황금왕=태양 광선+금화 / 여왕=로즈골드 후광+다이아 반짝 / 유니콘=무지개 링+별
  //               아이돌(블랙)=흰 핀조명+은빛 글리터 / 아이돌(벨벳)=금빛 무대조명+컨페티
  function aura(c, key, cx, cy, r, t, a) {
    t = t || 0; const u = Math.max(1, Math.round(r / 30)), sq = (x, y, col, k) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), u * (k || 1), u * (k || 1)); };
    const h01 = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
    const glow = (col, k) => { const g = c.createRadialGradient(cx, cy, 0, cx, cy, r * (k || .7)); g.addColorStop(0, `rgba(${col},${.7 * a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(cx - r, cy - r, r * 2, r * 2); };
    const star = (x, y, col, big) => { sq(x, y, col); sq(x - u, y, col); sq(x + u, y, col); sq(x, y - u, col); sq(x, y + u, col); if (big) { sq(x - 2 * u, y, col); sq(x + 2 * u, y, col); sq(x, y - 2 * u, col); sq(x, y + 2 * u, col); } };
    const beam = (x0, y0, x1, x2, y1, col) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, `rgba(${col},${.05 * a})`); g.addColorStop(.7, `rgba(${col},${.42 * a})`); g.addColorStop(1, `rgba(${col},${.12 * a})`); c.fillStyle = g; c.beginPath(); c.moveTo(x0 - u, y0); c.lineTo(x0 + u, y0); c.lineTo(x2, y1); c.lineTo(x1, y1); c.closePath(); c.fill(); };
    if (key === 'goldking') { radiance(c, cx, cy, r, t, a, false);
      for (let i = 0; i < 6; i++) { const p = ((t / 2600) + h01(i)) % 1, x = cx + (h01(i + 9) - .5) * r * 1.3, y = cy + r * .7 - p * r * 1.6, al = Math.sin(p * Math.PI) * a;
        sq(x, y, `rgba(255,200,60,${al})`, 2); sq(x, y, `rgba(255,250,200,${al})`); } return; }
    if (key === 'goldqueen') { glow('255,170,200', .85); glow('255,230,240', .45);
      c.strokeStyle = `rgba(255,190,215,${.55 * a})`; c.lineWidth = u; c.beginPath(); c.ellipse(cx, cy, r * .78, r * .9, 0, 0, Math.PI * 2); c.stroke();
      for (let i = 0; i < 7; i++) { const an = t / 1400 + i * Math.PI * 2 / 7, x = cx + Math.cos(an) * r * .78, y = cy + Math.sin(an) * r * .9, tw = (Math.sin(t / 180 + i * 2) + 1) / 2;
        star(x, y, `rgba(255,${200 + 55 * tw | 0},${230 + 25 * tw | 0},${(.45 + .55 * tw) * a})`, tw > .75); } return; }
    if (key === 'unicorn') { const R = ['255,122,168', '255,180,106', '255,228,106', '106,224,168', '106,184,255', '180,138,255'];
      glow('240,220,255', .6); c.lineWidth = u * 1.5;
      R.forEach((col, i) => { const rr = r * (.45 + i * .085) + Math.sin(t / 300 - i * .8) * u * 1.5; c.strokeStyle = `rgba(${col},${.42 * a})`; c.beginPath(); c.arc(cx, cy, rr, Math.PI * 1.02, Math.PI * 1.98); c.stroke(); });
      for (let i = 0; i < 8; i++) { const ph = (t / 900 + h01(i) * 7), tw = (Math.sin(ph * 2) + 1) / 2, x = cx + (h01(i + 3) - .5) * r * 1.8, y = cy + (h01(i + 5) - .5) * r * 1.7;
        if (tw > .35) star(x, y, `rgba(${R[i % 6]},${tw * a})`, tw > .85); } return; }
    if (key === 'idolm' || key === 'idolf') { const top = cy - r * 1.9, bot = cy + r * .95, sw = Math.sin(t / 900) * r * .25, col = key === 'idolf' ? '255,150,215' : '235,240,255';
      beam(cx - r * 1.1, top, cx - r * .55 + sw, cx + r * .15 + sw, bot, col); beam(cx + r * 1.1, top, cx - r * .15 - sw, cx + r * .55 - sw, bot, key === 'idolf' ? '200,150,255' : '150,200,255');
      glow(key === 'idolf' ? '255,120,200' : '140,160,255', .55);
      if (key === 'idolf') for (let i = 0; i < 5; i++) { const p = ((t / 2200) + h01(i)) % 1, x = cx + (h01(i + 4) - .5) * r * 1.4 + Math.sin(p * 9 + i) * u * 2, y = cy + r * .5 - p * r * 1.5, al = Math.sin(p * Math.PI) * a, cc = `rgba(255,${110 + i * 20},${190 + i * 10},${al})`;
        sq(x - u, y, cc); sq(x + u, y, cc); sq(x - 2 * u, y + u, cc); sq(x - u, y + u, cc); sq(x, y + u, cc); sq(x + u, y + u, cc); sq(x + 2 * u, y + u, cc); sq(x - u, y + 2 * u, cc); sq(x, y + 2 * u, cc); sq(x + u, y + 2 * u, cc); sq(x, y + 3 * u, cc); sq(x, y, cc); }
      else for (let i = 0; i < 10; i++) { const tw = (Math.sin(t / 140 + i * 2.7) + 1) / 2; if (tw > .6) sq(cx + (h01(i + 1) - .5) * r * 1.5, cy + (h01(i + 7) - .5) * r * 1.6, `rgba(230,240,255,${tw * a})`, tw > .92 ? 2 : 1); }
      return; }
    if (key === 'idolm2' || key === 'idolf2') { const top = cy - r * 1.9, bot = cy + r * .95, sw = Math.sin(t / 1100) * r * .2;
      beam(cx, top, cx - r * .55 + sw, cx + r * .55 + sw, bot, '255,215,130'); glow('255,190,90', .6);
      const CF = ['255,90,90', '90,200,255', '255,220,80', '120,230,140', '255,140,220'];
      for (let i = 0; i < 12; i++) { const p = ((t / 2400) + h01(i)) % 1, x = cx + (h01(i + 2) - .5) * r * 1.8 + Math.sin(p * 8 + i) * u * 2, y = cy - r * 1.1 + p * r * 2, al = Math.min(1, (1 - p) * 2) * a;
        c.fillStyle = `rgba(${CF[i % 5]},${al})`; c.fillRect(Math.round(x), Math.round(y), u * (Math.floor(t / 160 + i) % 2 ? 2 : 1), u); } return; }
    radiance(c, cx, cy, r, t, a, LEGEND_KEYS.has(key));
  }
  // 코스튬별 연출 정보 (스크린 배너 · 폰 카드 공용)
  const AURA_FX = { goldking: { t: '★ 황금 왕 강림! ★', c: '#ffd23a', d: '금빛 햇살·금화와 함께 등장' }, goldqueen: { t: '★ 황금 여왕 등장! ★', c: '#ffb0d8', d: '다이아 반짝이와 함께 등장' },
    unicorn: { t: '★ 유니콘 등장! ★', c: '#c8b0ff', d: '무지개 타고 등장' }, idolm: { t: '★ LEGEND 아이돌 데뷔! ★', c: '#cfe0ff', d: '핀조명 받으며 등장' },
    idolf: { t: '★ LEGEND 아이돌 데뷔! ★', c: '#ff9ad8', d: '하트 날리며 등장' }, idolm2: { t: '★ LEGEND 아이돌 데뷔! ★', c: '#ffc860', d: '컨페티 무대로 등장' }, idolf2: { t: '★ LEGEND 아이돌 데뷔! ★', c: '#ffc860', d: '컨페티 무대로 등장' } };
  function cardAura(canvas, key, t) { const c = canvas.getContext('2d'); c.clearRect(0, 0, canvas.width, canvas.height); c.imageSmoothingEnabled = false; c.save(); c.globalCompositeOperation = 'lighter'; aura(c, key, canvas.width / 2, canvas.height * .36, canvas.width * .5, t, 1); c.restore(); }
  function sfxCos(k) { if (LEGEND_KEYS.has(k)) { noiseHit(1.3, .12, 1200); sfxFanfare(); } else if (k === 'unicorn') [1047, 1319, 1568, 2093, 2637, 3136].forEach((f, i) => tone(f, .18, .06, 'triangle', i * .07)); else sfxFanfare(); }
  function drawPreview(canvas, look, drink, costume, t, noAura) {
    const ctx = canvas.getContext('2d'), s = sprite(look, false, drink, 'n', costume);
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.imageSmoothingEnabled = false;
    if (!noAura && (SECRET_KEYS.has(costume) || LEGEND_KEYS.has(costume))) aura(ctx, costume, canvas.width / 2, canvas.height * .42, canvas.width * .62, t == null ? 1800 : t, 1);
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
    if (!SFX.on || SFX.mute || !SFX.ac) return; const ac = SFX.ac, t0 = ac.currentTime + (when || 0);
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.08, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noiseHit(dur, vol, hp, when) {
    if (!SFX.on || SFX.mute || !SFX.ac) return; const ac = SFX.ac, t0 = ac.currentTime + (when || 0), n = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); src.buffer = buf; f.type = 'highpass'; f.frequency.value = hp || 800;
    g.gain.value = vol || 0.15; src.connect(f).connect(g).connect(ac.destination); src.start(t0);
  }
  const sfxBoom = () => { noiseHit(0.9, 0.35, 120); tone(70, 0.6, 0.12, 'sine'); tone(110, 0.4, 0.08, 'square'); };
  const sfxTick = k => { tone(520 + k * 40, 0.05, 0.05, 'square'); noiseHit(0.03, 0.06, 2500); };
  const sfxDrum = () => noiseHit(0.06, 0.09, 300);
  const sfxHeart = () => { tone(1319, 0.18, 0.05, 'sine'); tone(1760, 0.3, 0.05, 'sine', 0.1); };
  const sfxClink = () => { tone(2093, 0.25, 0.06, 'sine'); tone(2637, 0.35, 0.05, 'sine', 0.06); tone(3136, 0.4, 0.035, 'sine', 0.12); };
  // 술 이름으로 잔 색 고르기 (메뉴판 이름 기준, 모르는 술은 분홍)
  const DRINK_COL = [[/블루|사파이어/, '#3aa8ff'], [/미도리|준벅|멜론|그린|모히또/, '#7ae07a'], [/피치|복숭아/, '#ffb08a'], [/선라이즈|오렌지|스크류|퍼지/, '#ffa040'],
    [/밀크|깔루아|베일리스|화이트러시안|요거/, '#f2e4cc'], [/블랙러시안|갓파더|콕|리브레|롱아일랜드|위스키|잭|버번|하이볼/, '#c8782a'], [/진토닉|진피즈|톰콜린스|토닉|스푸모니|사이다|소다/, '#e6f6ff'],
    [/와인|칼리모초|상그리아|레드/, '#a01e3c'], [/샤르도네|화이트와인|샴페인|스파클/, '#f2e48a'], [/맥주|비어|라거|에일/, '#f0c040'], [/딸기|섹스온더비치|잭로즈|체리|라즈베리|코스모/, '#ff4a7a'], [/마티니|드라이/, '#f4f8ec'], [/보치볼|아마레또/, '#e8a050']];
  function drinkColor(name) { const n = String(name || ''); for (const [re, c] of DRINK_COL) if (re.test(n)) return c; return '#ff6a9a'; }
  const sfxDing = () => { tone(1319, 0.5, 0.09, 'sine'); tone(1047, 0.7, 0.09, 'sine', 0.32); };
  function sfxBirthday() {
    const N2 = { G4: 392, A4: 440, B4: 494, C5: 523, D5: 587, E5: 659, F5: 698, G5: 784 }, b = 0.36;
    const song = [['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2], ['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2], ['G4', .75], ['G4', .25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2], ['F5', .75], ['F5', .25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2.5]];
    let at = 0.3; song.forEach(([n, d]) => { tone(N2[n], d * b * .95, .07, 'triangle', at); tone(N2[n] * 2, d * b * .6, .025, 'sine', at); at += d * b; });
    noiseHit(.8, .12, 4000, at); tone(1047, .5, .06, 'triangle', at); tone(1319, .7, .05, 'triangle', at + .1);
  }
  function sfxIce() { noiseHit(0.035, 0.05, 3500); tone(2400 + Math.random() * 900, 0.03, 0.015, 'triangle'); }
  const sfxTing = () => { tone(2093, 0.25, 0.05, 'sine'); tone(2637, 0.35, 0.04, 'sine', 0.06); };
  function sfxFanfare() {
    noiseHit(0.9, 0.18, 4000); [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 0.09, 'square', i * 0.11));
    [784, 1047].forEach((f, i) => tone(f, 0.6, 0.07, 'triangle', 0.5 + i * 0.02)); tone(1319, 0.8, 0.05, 'triangle', 0.5);
  }
  // ---------- 인스타 스토리용 캐릭터 카드 (1080x1920) ----------
  function makeCard(look, drink, costume, nick, msg, themeKey, visits) {
    const W2 = 1080, H2 = 1920, c = document.createElement('canvas'); c.width = W2; c.height = H2;
    const g = c.getContext('2d'), floorY = 1220;   // 인스타 스토리 아래쪽 답장창(약 250px)에 글자가 가리지 않게 위로
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
      seollal: ['HAPPY NEW YEAR', '#ff6a6a'], chuseok: ['HAPPY CHUSEOK', '#ffd36a'], valentine: ['HAPPY VALENTINE', '#ff7a95'], white: ['HAPPY WHITE DAY', '#bfe6ff'], rose: ['HAPPY ROSE DAY', '#ff6a7a'], pepero: ['HAPPY PEPERO DAY', '#e8a060'] }[themeKey];
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
      const sp = sprite(gu, false, gu.drink, 'n', cosOf(th, gu).k);
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
    stool: L('stool', [20, 45, 70, 95, 120, 145, 170], 210, { sit: true, zone: 'bar' }),
    gBack: L('gBack', [232, 262, 292, 322, 352, 382, 412], 180, { zone: 'g' }),
    gIn: L('gIn', [262, 318, 374], 216, { zone: 'g' }),
    // ㄴ은 ㄱ을 180° 돌린 모양 (가운데 x=337 기준 대칭) → 자리도 ㄱ과 같은 7+3
    nFront: L('nFront', [262, 292, 322, 352, 382, 412, 442], 268, { zone: 'n' }),
    nLeft: [],
    nIn: L('nIn', [300, 356, 412], 246, { zone: 'n' }),
    standBack: L('standBack', [247, 287, 327, 367, 407, 447], 162, { zone: 'stand' }),
    standFront: L('standFront', [20, 47, 74, 101, 128, 155, 182], 266, { zone: 'stand' })
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
  // 자리 배정: 온 순서대로 빈자리에 앉고, 계산하고 나간 손님 자리는 '나간 뒤에 온' 손님부터 씀 → 누가 나가도 다른 손님 자리가 바뀌지 않음
  // (모든 기기가 같은 기록으로 같은 결과를 얻음 · 사장님이 지정한 자리는 우선)
  const msOf = v => v && v.toMillis ? v.toMillis() : (+v || 0);
  function placeGuests(guests, seats) {
    const arrOf = g => msOf(g.ts) || msOf(g.ms0) || (g.npc ? msOf(g.ms) : 0);
    guests = guests.map((g, i) => [g, i]).sort((a, b) => (arrOf(a[0]) || 9e15) - (arrOf(b[0]) || 9e15) || a[1] - b[1]).map(x => x[0]);   // 한 줄 바꿔도 순서 그대로
    const map = seats || {}, present = guests.filter(g => !g.left), fixed = new Map(), fixedCodes = new Set();
    present.forEach(g => { const c = g.id && map[g.id]; if (c && SEAT_BY_CODE[c] && !fixedCodes.has(c)) { fixedCodes.add(c); fixed.set(g, SEAT_BY_CODE[c]); } });
    const occ = new Map(), at = new Map();   // 자리코드 → 손님, 손님 → 자리
    guests.forEach(g => { if (fixed.has(g)) return; const arr = arrOf(g);
      for (const [code, o] of occ) if (o.left && arr && msOf(o.lts) && msOf(o.lts) <= arr) { occ.delete(code); at.delete(o); }
      const fc = g.left && g.id && map[g.id]; if (fc && SEAT_BY_CODE[fc] && !fixedCodes.has(fc) && !occ.has(fc)) { occ.set(fc, g); at.set(g, SEAT_BY_CODE[fc]); return; }   // 지정석에 있다 나간 손님: 그 자리를 나간 시각까지 붙잡아 둠
      let slot = ORDER.find(x => !fixedCodes.has(x.code) && !occ.has(x.code));
      if (!slot) { const old = [...occ.entries()].find(([, o]) => !o.left) || [...occ.entries()][0]; if (!old) return; slot = SEAT_BY_CODE[old[0]]; at.delete(old[1]); occ.delete(old[0]); }
      occ.set(slot.code, g); at.set(g, slot); });
    return present.filter(g => fixed.has(g) || at.has(g)).map(g => ({ g, slot: fixed.get(g) || at.get(g) }));
  }
  // 창밖 날씨: 대구 실제 날씨(Open-Meteo, 무료·키 없음)를 10분마다 · ?wx=rain|snow|storm|cloud|fog|clear 로 시험 가능
  const WX = { kind: 'clear', amt: 0, day: 0, at: 0 };
  function wxFromCode(c) { c = c | 0; if (c >= 95) return ['storm', 3]; if ((c >= 71 && c <= 77) || c === 85 || c === 86) return ['snow', c === 75 || c === 86 ? 3 : c === 73 ? 2 : 1];
    if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return ['rain', [65, 67, 82].includes(c) ? 3 : [53, 63, 81].includes(c) ? 2 : 1]; if (c === 45 || c === 48) return ['fog', 1]; if (c === 2 || c === 3) return ['cloud', c === 3 ? 2 : 1]; return ['clear', 0]; }
  function startWeather() {
    try { const q = (location.search.match(/[?&]wx=(\w+)/) || [])[1]; if (q) { WX.kind = q; WX.amt = q === 'clear' ? 0 : 2; WX.at = Date.now(); return; } } catch (e) {}
    if (WX.started) return; WX.started = true;
    const go = () => fetch('https://api.open-meteo.com/v1/forecast?latitude=35.8714&longitude=128.6014&current=weather_code,is_day&timezone=Asia%2FSeoul', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null).then(j => { if (!j || !j.current) return; const [k, a] = wxFromCode(j.current.weather_code); WX.kind = k; WX.amt = a; WX.day = j.current.is_day | 0; WX.at = Date.now(); }).catch(() => {});
    go(); setInterval(go, 10 * 60 * 1000); }
  try { window.__notsunWx = (k, a) => { WX.kind = k; WX.amt = a == null ? 2 : a; }; } catch (e) {}
  function createScene() {
    startWeather();
    // 고해상도 모드(시험용): ?hires=1 이면 버퍼를 2배로 → 캐릭터를 Scale2x로 다듬어 고양이와 같은 잔 픽셀로
    const HIRES = (() => { try { return /[?&]hires=1/.test(location.search) || localStorage.getItem('notsun-hires') === '1'; } catch (e) { return false; } })(), HK = HIRES ? 2 : 1;
    const buf = document.createElement('canvas'); buf.width = W * HK; buf.height = H * HK;
    const b = buf.getContext('2d'); b.setTransform(HK, 0, 0, HK, 0, 0); b.imageSmoothingEnabled = false;
    const hiCache = new WeakMap();
    function hiSprite(sp) {   // Scale2x(EPX): 계단을 매끈하게
      let h = hiCache.get(sp); if (h) return h;
      const w = sp.width, hh = sp.height, src = sp.getContext('2d').getImageData(0, 0, w, hh), s32 = new Uint32Array(src.data.buffer);
      h = document.createElement('canvas'); h.width = w * 2; h.height = hh * 2; const hx = h.getContext('2d'), out = hx.createImageData(w * 2, hh * 2), o32 = new Uint32Array(out.data.buffer);
      const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= hh) ? 0 : s32[y * w + x];
      for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) { const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1), i = (y * 2) * w * 2 + x * 2;
        o32[i] = C === A && C !== D && A !== B ? A : P; o32[i + 1] = A === B && A !== C && B !== D ? B : P; o32[i + w * 2] = D === C && D !== B && C !== A ? C : P; o32[i + w * 2 + 1] = B === D && B !== A && D !== C ? D : P; }
      hx.putImageData(out, 0, 0); hiCache.set(sp, h); return h; }
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const noise = Array.from({ length: W / 2 }, () => rnd() * 8 - 4);
    const bottles = Array.from({ length: 12 }, () => Array.from({ length: 4 }, () => ({ h: 7 + Math.floor(rnd() * 5), c: ['#7a3a12', '#c98a2a', '#3a5a2a', '#e8d8b0', '#5a1f1a', '#2a2a40'][Math.floor(rnd() * 6)] })));
    const px = (x, y, w, h, c) => { b.fillStyle = c; b.fillRect(x, y, w, h); }, pxB = px;
    const OWNER_X = [62, 128];
    // 백바 위 유리창: 나무 창틀 + 6칸 유리 + 밤하늘·별·멀리 보이는 동네 불빛 + 유리 반사 + 실내 조명 비침
    const WIN = (() => { let sd = 77; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647, bld = [], lit = [], stars = [];
      for (let x = 73; x < 137;) { const w = 4 + Math.floor(r() * 6), h = 6 + Math.floor(r() * 12); bld.push([x, w, h]); for (let yy = 56 - h + 2; yy < 55; yy += 2) for (let xx = x + 1; xx < x + w - 1; xx += 2) if (r() < .32) lit.push([xx, yy, r() < .7 ? '#ffd27a' : '#ffefb8', r()]); x += w + (r() < .3 ? 1 : 0); }
      for (let i = 0; i < 14; i++) { const sx = 73 + Math.floor(r() * 64), sy = 33 + Math.floor(r() * 12), sp = r(); if (!(sx > 121 && sx < 134 && sy < 42)) stars.push([sx, sy, sp]); }
      return { bld, lit, stars }; })();
    const hiFx = [];
    function nightWindow() {
      hiFx.length = 0;
      const X = 68, Y = 27, Wd = 74, Hd = 32, t2 = typeof tNow === 'number' ? tNow : 0, wk = WX.kind, wa = WX.amt, wet = wk === 'rain' || wk === 'storm', gx0 = X + 3, gx1 = X + Wd - 3, gy0 = Y + 3, gy1 = Y + Hd - 3;
      px(X - 1, Y - 1, Wd + 2, Hd + 2, '#140d0a');                                          // 벽 그림자
      for (let y = Y + 3; y < Y + Hd - 3; y++) { const k = (y - Y) / Hd; px(X + 3, y, Wd - 6, 1, WX.day ? `rgb(${Math.round(70 + k * 120)},${Math.round(96 + k * 60)},${Math.round(150 + k * 10)})` : wk === 'clear' ? `rgb(${Math.round(16 + k * 26)},${Math.round(22 + k * 22)},${Math.round(48 + k * 30)})` : `rgb(${Math.round(26 + k * 22)},${Math.round(30 + k * 20)},${Math.round(44 + k * 22)})`); }   // 하늘 (낮·맑은 밤·흐린 밤)
      if (wk === 'clear' && !WX.day) WIN.stars.forEach(([x, y, p]) => { const tw = (Math.sin(t2 / 900 + p * 40) + 1) / 2; if (tw > .25) px(x, y, 1, 1, `rgba(220,230,255,${.35 + tw * .6})`); });
      if (wk === 'clear' || (wk === 'cloud' && wa < 2)) px(124, 32, 8, 8, 'rgba(240,230,190,.05)'); if (wk === 'clear' || (wk === 'cloud' && wa < 2)) { px(123, 34, 10, 4, 'rgba(240,230,190,.05)'); px(126, 31, 4, 10, 'rgba(240,230,190,.05)'); } if (wk === 'clear' || (wk === 'cloud' && wa < 2)) ['..MMM.', '.MMm..', 'MMm...', 'MMm...', '.MMm..', '..MMM.'].forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') px(125 + i, 33 + j, 1, 1, ch === 'M' ? '#f6eecb' : '#d8cc9c'); }));   // 초승달 + 달무리
      WIN.bld.forEach(([x, w, h]) => { px(x, Y + Hd - 3 - h, w, h, '#121726'); px(x, Y + Hd - 3 - h, w, 1, '#1d2438'); });   // 멀리 건물
      WIN.lit.forEach(([x, y, c, p]) => { if (Math.sin(t2 / 2600 + p * 60) > -.85) px(x, y, 1, 1, c); });
      px(X + 3, Y + Hd - 7, Wd - 6, 4, 'rgba(255,150,90,.10)');                              // 실내 조명이 유리에 비침
      if (wk === 'cloud' || wet || wk === 'snow') for (let i = 0; i < 4; i++) { const cx = gx0 + ((i * 23 + t2 / 400) % (Wd + 20)) - 10, cy = gy0 + 2 + (i % 2) * 4;   // 구름
        for (let d = 0; d < 12; d++) { const xx = Math.round(cx + d); if (xx >= gx0 && xx < gx1) px(xx, cy + (d > 2 && d < 9 ? -1 : 0), 1, d > 1 && d < 10 ? 3 : 2, wet ? 'rgba(70,76,92,.85)' : 'rgba(96,104,124,.7)'); } }
      if (wk === 'fog') for (let y = gy0 + 4; y < gy1; y += 3) px(gx0, y, gx1 - gx0, 2, 'rgba(190,196,210,.18)');
      if (wet) { const n = [0, 14, 24, 36][wa] || 18, panes = [[gx0, gy0, X + 25 - gx0, Y + 16 - gy0], [X + 27, gy0, 20, Y + 16 - gy0], [X + 49, gy0, gx1 - X - 49, Y + 16 - gy0], [gx0, Y + 18, X + 25 - gx0, gy1 - Y - 18], [X + 27, Y + 18, 20, gy1 - Y - 18], [X + 49, Y + 18, gx1 - X - 49, gy1 - Y - 18]];
        hiFx.push((c, s) => { c.save(); c.beginPath(); panes.forEach(([x, y, w, h]) => c.rect(x * s, y * s, w * s, h * s)); c.clip(); c.lineCap = 'round';   // 가는 빗줄기 (고운 해상도 · 천천히)
          for (let i = 0; i < n; i++) { const hr = k => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); }, sp = .8 + hr(1) * .4, x0 = gx0 + hr(2) * (gx1 - gx0 + 6), y0 = gy0 - 4 + ((t2 * .028 * sp + hr(3) * 400) % (gy1 - gy0 + 8)), xx = x0 - (y0 - gy0) * .22;
            c.strokeStyle = `rgba(190,212,240,${.28 + (i % 3) * .08})`; c.lineWidth = Math.max(1, s * .22); c.beginPath(); c.moveTo(xx * s, y0 * s); c.lineTo((xx - .7) * s, (y0 + 3.2) * s); c.stroke(); }
          for (let i = 0; i < 9; i++) { const x = gx0 + 2 + ((i * 29) % (gx1 - gx0 - 4)), y = gy0 + ((t2 / (1400 + i * 160) * 6 + i * 11) % (gy1 - gy0));   // 유리 물방울이 천천히 흘러내림
            c.fillStyle = 'rgba(205,228,255,.45)'; c.beginPath(); c.arc((x + .5) * s, y * s, s * .32, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(205,228,255,.14)'; c.fillRect((x + .4) * s, (y - 2.2) * s, s * .2, s * 2); }
          c.restore(); });
        if (wk === 'storm') { const ph = (t2 % 11000) / 11000; if (ph < .03 || (ph > .05 && ph < .065)) px(gx0, gy0, gx1 - gx0, gy1 - gy0, 'rgba(235,240,255,.55)'); } }   // 번개
      if (wk === 'snow') { const n = [0, 18, 30, 46][wa] || 24;   // 눈송이 (살랑살랑)
        for (let i = 0; i < n; i++) { const sp = .6 + (i % 4) * .18, x = gx0 + ((i * 41) % (gx1 - gx0)) + Math.sin(t2 / 700 + i) * 2, y = gy0 + ((t2 / (60 / sp) + i * 47) % (gy1 - gy0));
          const xx = Math.round(x); if (xx >= gx0 && xx < gx1) px(xx, Math.round(y), i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1, 'rgba(250,252,255,.9)'); } }
      for (let k = 0; k < 3; k++) { const sx = X + 6 + k * 22; for (let d = 0; d < 6; d++) { px(sx + d, Y + 5 + d, 1, 1, 'rgba(255,255,255,.12)'); if (d < 4) px(sx + d + 3, Y + 5 + d, 1, 1, 'rgba(255,255,255,.07)'); } }   // 유리 반사 (짧은 사선)
      // 창틀 (어두운 나무 · 위쪽 하이라이트 · 안쪽 그림자)
      px(X, Y, Wd, 3, '#4a3020'); px(X, Y, Wd, 1, '#6a4a32'); px(X, Y + Hd - 3, Wd, 3, '#4a3020'); px(X, Y, 3, Hd, '#4a3020'); px(X + Wd - 3, Y, 3, Hd, '#3a2418'); px(X, Y, 1, Hd, '#6a4a32');
      px(X + 3, Y + 3, Wd - 6, 1, 'rgba(0,0,0,.35)'); px(X + 3, Y + 3, 1, Hd - 6, 'rgba(0,0,0,.25)');
      [X + 26, X + 48].forEach(mx => { px(mx - 1, Y + 3, 2, Hd - 6, '#4a3020'); px(mx - 1, Y + 3, 1, Hd - 6, '#5e4030'); });   // 세로 살
      px(X + 3, Y + 16, Wd - 6, 2, '#4a3020'); px(X + 3, Y + 16, Wd - 6, 1, '#5e4030');       // 가로 살
      px(X - 3, Y + Hd, Wd + 6, 2, '#5a3a26'); px(X - 3, Y + Hd, Wd + 6, 1, '#7a5638'); px(X - 2, Y + Hd + 2, Wd + 4, 1, 'rgba(0,0,0,.35)');   // 창턱
      if (wk === 'snow') { for (let x = gx0; x < gx1; x++) { const bump = Math.sin(x * .45) + Math.sin(x * .17) > .9 ? 1 : 0; px(x, gy1 - 1 - bump, 1, 1 + bump, 'rgba(245,248,255,.95)'); px(x, Y + 15 - (Math.sin(x * .6 + 1) > .7 ? 1 : 0), 1, 1 + (Math.sin(x * .6 + 1) > .7 ? 1 : 0), 'rgba(245,248,255,.92)'); } }   // 유리 아래·가로살 위 눈
      px(X + 10, Y + Hd - 4, 3, 2, '#2a5a2a'); px(X + 11, Y + Hd - 6, 1, 2, '#3a7a3a'); px(X + 9, Y + Hd - 5, 1, 1, '#3a7a3a'); px(X + 13, Y + Hd - 5, 1, 1, '#3a7a3a');   // 창가 작은 화분
      px(X + 58, Y + Hd - 5, 2, 3, '#cfe4f0'); px(X + 58, Y + Hd - 6, 2, 1, '#e8f4fa'); px(X + 61, Y + Hd - 4, 2, 2, '#d9902a');   // 빈 병 · 잔
    }
    function room() {
      px(0, 0, W, H, '#0e0a0b');
      for (let x = 0; x < W; x += 2) { const v = noise[x / 2]; px(x, 26, 2, 128, `rgb(${108 + v},${26 + v / 2},${28 + v / 2})`); }
      px(0, 0, W, 26, '#120c0d'); px(0, 18, 210, 8, '#5a1416'); px(0, 25, 210, 1, '#ff6a5a'); px(0, 26, 210, 2, 'rgba(255,90,80,.35)');
      px(180, 26, 18, 9, '#1a1a1e'); px(186, 22, 2, 4, '#2a2a2e'); px(181, 33, 2, 1, '#3a7aff');
      px(232, 22, 2, 6, '#2a2a2e'); px(220, 28, 26, 2, '#d9dde3'); px(230, 27, 6, 3, '#eef0f2');
      nightWindow();
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
    // 가게 고양이 두 마리 (러시안블루 · 샴): 백바 위·선반·바 카운터를 오가며 자고, 기지개 켜고, 걷고, 그루밍
    const CAT_POSES = [   // [말숙(배 뽈록), 록] · O 외곽선 · B 몸 · S 그림자 · L 밝은 배털 · M 포인트/짙은털 · I 귀 안 · W 눈 반짝 · E 눈 · C 감은 눈 · N 코 · r 혀 · K 목줄 · G/g 방울
      {"sit": ["..........OO....OO.", ".........OMIO..OIMO", ".........OMBBBBBBMO", "........OBBBBBBBBBO", "........OFWPFFFWPFO", "........OFPEFFFPEFO", "........OFFFMNMFFFO", ".........OBBMMMBBO.", ".........OKKKGKKKO.", "........OBBBBgBBBO.", ".......OBBLLLLLBBBO", "......OBBLLLLLLLBBO", ".....OBBLLLLLLLLBBO", ".OOO.OSBBLLLLLLBBSO", "OMMMOOSSBBBBBBBBSO.", "OMMMMOOMMMOOOOMMMO.", ".OMMMMMMOO........."], "groom": ["...................", "..........OO....OO.", ".........OMIO..OIMO", ".........OMBBBBBBMO", "........OBBBBBBBBBO", "........OFCCFFFCCFO", "........OFFFMNrFFFO", ".........OBBMMMMMO.", ".........OKKKGKMMMO", "........OBBBBgBMMO.", ".......OBBLLLLLBBBO", "......OBBLLLLLLLBBO", ".OOO.OSBBLLLLLLBBSO", "OMMMOOSSBBBBBBBBSO.", "OMMMMOOMMMOOOOMMMO.", ".OMMMMMMOO.........", "..................."], "sleep": ["...................", "...................", "...................", "...................", "...................", "...................", "...................", "...................", "............O..O...", "...........OMOOMO..", "...OOOOOOOOBBBBBO..", "..OBBBBBBBBFCCFCCO.", ".OBBBLLLLBBFFMNMFO.", "OBBBLLLLLLBBBKGKO..", "OSBBBLLLLBBBBBBO...", "OMMSSSBBBBBBBMMO...", ".OMMMMMMMMMMMMO...."], "stretch": ["...................", "...................", "...................", "...................", "...................", "...................", "...................", "...................", "OM.................", ".OM..OOOO..........", "..OMOBBBBOO........", "...OBBBBBBBOO.O...O", "...OSBBBBBBBBOMO.OM", "....OSBBBBBBBBBBBBO", "....OSO..OKGKFPEPEO", "....OMO.OMMMFFMNMFO", "....OO..OOOOOOOOOO."], "walk1": ["...................", "...................", "...................", "...................", "...................", ".............O...O.", "M...........OMO.OMO", "OM..........OBBBBBO", ".OM........OFWPFWPO", "..OM.......OFPEFPEO", "...OOOOOOOOOFFMNMFO", "...OBBBBBBBBKKGKKO.", "..OBBLLLLLLLBBgBBO.", "..OSBBLLLLLBBBBBO..", "...OSBBBBBBBBBO....", "....OSMO...OSMO....", "....OMMO...OMMO...."], "walk2": ["...................", "...................", "...................", "...................", "...................", ".............O...O.", "M...........OMO.OMO", "OM..........OBBBBBO", ".OM........OFWPFWPO", "..OM.......OFPEFPEO", "...OOOOOOOOOFFMNMFO", "...OBBBBBBBBKKGKKO.", "..OBBLLLLLLLBBgBBO.", "..OSBBLLLLLBBBBBO..", "...OSBBBBBBBBBO....", "...OSMO.....OSMO...", "...OMMO.....OMMO..."]},
      {"sit": ["..........OO....OO.", ".........OMIO..OIMO", ".........OMBBBBBBMO", "........OBBBBBBBBBO", "........OFWPFFFWPFO", "........OFPEFFFPEFO", "........OFFFMNMFFFO", ".........OBBMMMBBO.", ".........OKKKGKKKO.", "........OBBBBgBBBO.", ".......OBBBLLLBBBO.", "......OBBBLLLLBBBO.", "......OBBBLLLLBBBO.", ".OOO..OSBBBLLBBBSO.", "OMMMO.OSSBBBBBBSSO.", "OMMMMOOMMMOOOMMMO..", ".OMMMMMMOO........."], "groom": ["...................", "..........OO....OO.", ".........OMIO..OIMO", ".........OMBBBBBBMO", "........OBBBBBBBBBO", "........OFCCFFFCCFO", "........OFFFMNrFFFO", ".........OBBMMMMMO.", ".........OKKKGKMMMO", "........OBBBBgBMMO.", ".......OBBBLLLBBBO.", "......OBBBLLLLBBBO.", ".OOO..OSBBBLLBBBSO.", "OMMMO.OSSBBBBBBSSO.", "OMMMMOOMMMOOOMMMO..", ".OMMMMMMOO.........", "..................."], "sleep": ["...................", "...................", "...................", "...................", "...................", "...................", "...................", "...................", "............O..O...", "...........OMOOMO..", "....OOOOOOOBBBBBO..", "...OBBBBBBBFCCFCCO.", "..OBBBLLLBBFFMNMFO.", ".OBBBLLLLBBBBKGKO..", ".OSBBBBBBBBBBBBO...", "OMMSSSBBBBBBBMMO...", ".OMMMMMMMMMMMMO...."], "stretch": ["...................", "...................", "...................", "...................", "...................", "...................", "...................", "...................", "OM.................", ".OM..OOOO..........", "..OMOBBBBOO........", "...OBBBBBBBOO.O...O", "...OSBBBBBBBBOMO.OM", "....OSBBBBBBBBBBBBO", "....OSO..OKGKFPEPEO", "....OMO.OMMMFFMNMFO", "....OO..OOOOOOOOOO."], "walk1": ["...................", "...................", "...................", "...................", "...................", ".............O...O.", "M...........OMO.OMO", "OM..........OBBBBBO", ".OM........OFWPFWPO", "..OM.......OFPEFPEO", "...OOOOOOOOOFFMNMFO", "...OBBBBBBBBKKGKKO.", "...OBBLLLLLBBBgBBO.", "...OSBBBBBBBBBBBO..", "....OSMO...OSMO....", "....OMMO...OMMO....", "..................."], "walk2": ["...................", "...................", "...................", "...................", "...................", ".............O...O.", "M...........OMO.OMO", "OM..........OBBBBBO", ".OM........OFWPFWPO", "..OM.......OFPEFPEO", "...OOOOOOOOOFFMNMFO", "...OBBBBBBBBKKGKKO.", "...OBBLLLLLBBBgBBO.", "...OSBBBBBBBBBBBO..", "...OSMO.....OSMO...", "...OMMO.....OMMO...", "..................."]}
    ];
    const CAT_PAL = [
      { O: '#323a4a', B: '#8a9ab2', S: '#66768f', L: '#b4c2d4', M: '#6c7c96', F: '#8a9ab2', I: '#e8a8b8', W: '#c8f5d4', P: '#1c222a', E: '#5cc87c', C: '#2a3242', N: '#e898b0', r: '#ff8aa8', K: '#d6262e', G: '#ffd23a', g: '#c8901a' },    // 말숙: 러시안블루 · 빨간 목줄
      { O: '#3a2a20', B: '#f6ead2', S: '#dcc8a4', L: '#fffaf0', M: '#4e3628', F: '#6a4c3a', I: '#e8a8b8', W: '#c8e6ff', P: '#141a2c', E: '#4a9eef', C: '#2a1a14', N: '#2a1810', r: '#ff8aa8', K: '#2a6ad6', G: '#ffd23a', g: '#c8901a' }     // 록: 샴 · 파란 목줄
    ];
    // 고해상도 변환: Scale2x로 2배 키워 대각선을 부드럽게 → 외곽선은 1칸 두께로 얇게 → 눈 반짝임은 한 점만
    function catHi(rows) {
      const H = rows.length, W2 = Math.max(...rows.map(r => r.length)), at = (x, y) => (y < 0 || y >= H || x < 0 || x >= W2) ? '.' : (rows[y][x] || '.');
      const out = Array.from({ length: H * 2 }, () => Array(W2 * 2).fill('.'));
      for (let y = 0; y < H; y++) for (let x = 0; x < W2; x++) { const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
        out[y * 2][x * 2] = C === A && C !== D && A !== B ? A : P; out[y * 2][x * 2 + 1] = A === B && A !== C && B !== D ? B : P;
        out[y * 2 + 1][x * 2] = D === C && D !== B && C !== A ? C : P; out[y * 2 + 1][x * 2 + 1] = B === D && B !== A && D !== C ? D : P; }
      const g = (x, y) => (out[y] && out[y][x]) || '.';
      const thin = out.map((r, y) => r.map((ch, x) => { if (ch !== 'O') return ch; const n4 = [g(x, y - 1), g(x + 1, y), g(x, y + 1), g(x - 1, y)]; if (n4.includes('.')) return ch;
        const cnt = {}; [g(x - 1, y - 1), g(x + 1, y - 1), g(x - 1, y + 1), g(x + 1, y + 1), ...n4].forEach(c => { if (c !== 'O' && c !== '.') cnt[c] = (cnt[c] || 0) + 1; }); const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]; return best ? best[0] : 'S'; }));
      return thin.map((r, y) => r.map((ch, x) => ch === 'W' && (g(x - 1, y) === 'W' || g(x, y - 1) === 'W') ? 'P' : ch).join(''));
    }
    const catBlink = rows => { let last = -1; rows.forEach((r, y) => { if (/[WEP]/.test(r)) last = y; }); return rows.map((r, y) => r.replace(/[WEP]/g, y === last ? 'C' : 'F')); };
    const CAT_HI = CAT_POSES.map(set => { const o = {}; Object.entries(set).forEach(([k, rows]) => { o[k] = catHi(rows); }); o.blink = catBlink(o.sit); return o; });
    const PERCH = [{ y: 62, x0: 20, x1: 176 }, { y: 100, x0: 154, x1: 170 }, { y: 146, x0: 14, x1: 182 }];   // 백바 상단 · 오른쪽 선반 · 바 카운터
    const cats = [{ name: '말숙', p: 0, x: 40, dir: 1, st: 'sleep', until: 0, tx: 0 }, { name: '록', p: 2, x: 96, dir: -1, st: 'sit', until: 0, tx: 0 }];
    try { window.__notsunCats = cats; } catch (e) {}   // 촬영·테스트용 (고양이 행동 지정)
    const rr = (a, b2) => a + Math.random() * (b2 - a);
    function catNext(c, now) {
      if (c.visit && c.p < 0) { c.st = c.st === 'sit' ? 'groom' : 'sit'; c.until = now + (c.st === 'sit' ? 6000 : 3000); return; }
      const pick = { sleep: ['stretch'], stretch: ['walk', 'sit', 'groom'], sit: ['groom', 'walk', 'sleep', 'jump', 'sit'], groom: ['sit', 'sleep', 'walk'], walk: ['sit', 'groom', 'sleep', 'jump'], jump: ['sit', 'groom'] }[c.st] || ['sit'];
      let st = pick[Math.floor(Math.random() * pick.length)];
      if (st === 'jump') { const others = [0, 1, 2].filter(i => i !== c.p || c.p < 0); const np = others[Math.floor(Math.random() * others.length)], P2 = PERCH[np]; c.jp = { from: { x: c.x, y: PERCH[c.p].y }, to: { x: rr(P2.x0, P2.x1), y: P2.y }, np, t0: now }; c.dir = c.jp.to.x >= c.x ? 1 : -1; c.until = now + 900; }
      else if (st === 'walk') { const P2 = PERCH[c.p]; c.tx = rr(P2.x0, P2.x1); if (Math.abs(c.tx - c.x) < 10) st = 'sit'; else c.dir = c.tx > c.x ? 1 : -1; c.until = now + 30000; }
      if (st !== 'jump' && st !== 'walk') c.until = now + { sleep: rr(25000, 60000), stretch: 2400, sit: rr(5000, 11000), groom: rr(4000, 7000) }[st];
      c.st = st; }
    let catLast = 0;
    let catHostOn = false, nextVisit = Date.now() + 30000; const catVisited = new Map();
    const petFx = [];
    try { window.__notsunCatVisitNow = () => { nextVisit = 0; }; } catch (e) {}   // 테스트·촬영용
    function catVisitTick(placed, opts) {
      catHostOn = !!opts.catHost; const now = Date.now();
      (opts.catPets || []).forEach(pe => { if (!pe._seen) { pe._seen = true; petFx.push({ cat: pe.cat, ms: now }); sfxHeart(); const cv = cats[pe.cat] && cats[pe.cat].visit; if (cv) { cv.pet = now; cv.mad = 0; } } });
      if (opts.game && catHostOn) cats.forEach(c => { if (c.visit && c.visit.until > now) { c.visit.until = now - 1; c.visit.quiet = 1; } });
      if (!catHostOn || now < nextVisit || cats.some(c => c.visit)) return;
      if (opts.game) { nextVisit = now + 20000; return; }

      nextVisit = now + 45000 + 35000 + Math.random() * 35000;   // 방문 45초 + 쉬는 35~70초 → 1분 반~2분마다 한 번
      const cand = placed.filter(p => p.g.id && !p.g.npc && p.g.uid); if (!cand.length) return;
      const oldest = Math.min(...cand.map(q => catVisited.get(q.g.id) || 0)), pool = cand.filter(q => (catVisited.get(q.g.id) || 0) === oldest);   // 아직 못 만난 손님부터 골고루
      const p = pool[Math.floor(Math.random() * pool.length)], ci = Math.random() < .5 ? 0 : 1, c = cats[ci]; if (c.st === 'jump') return; catVisited.set(p.g.id, now);
      const tx = Math.max(14, Math.min(W - 14, p.x + (p.x > W / 2 ? -24 : 24))), ty = p.foot;
      c.visit = { gid: p.g.id, until: now + 45000, t0: now + 900, pet: 0 }; c.jp = { from: { x: c.x, y: c.p >= 0 ? PERCH[c.p].y : c.vy }, to: { x: tx, y: ty }, np: -1, t0: now }; c.dir = tx >= c.x ? 1 : -1; c.st = 'jump'; c.until = now + 900;
      setCatVisit({ gid: p.g.id, cat: ci, name: c.name, until: now + 45000 }).catch(() => {});
    }
    function drawCats(cx2, cs) {
      const now = Date.now(), dt = catLast ? Math.min(.2, (now - catLast) / 1000) : 0; catLast = now;
      cats.forEach((c, ci) => {
        if (!c.until) c.until = now + (ci ? 6000 : 20000);
        if (c.st === 'walk') { c.x += c.dir * 9 * dt; if ((c.dir > 0 && c.x >= c.tx) || (c.dir < 0 && c.x <= c.tx)) { c.x = c.tx; catNext(c, now); } }
        let y = c.p >= 0 ? PERCH[c.p].y : c.vy, x = c.x;
        if (c.st === 'jump') { const e = Math.min(1, (now - c.jp.t0) / 900); x = c.jp.from.x + (c.jp.to.x - c.jp.from.x) * e; y = c.jp.from.y + (c.jp.to.y - c.jp.from.y) * e - Math.sin(e * Math.PI) * 18; if (e >= 1) { c.p = c.jp.np; c.x = c.jp.to.x; if (c.p < 0) c.vy = c.jp.to.y; y = c.p >= 0 ? PERCH[c.p].y : c.vy; x = c.x; if (c.visit && c.p < 0) { c.st = 'sit'; c.until = c.visit.until; } else catNext(c, now); } }
        else if (c.visit && now > c.visit.until) { const v = c.visit; c.visit = null; if (catHostOn) setCatVisit(null).catch(() => {}); const P2 = PERCH[2]; c.jp = { from: { x: c.x, y }, to: { x: rr(P2.x0, P2.x1), y: P2.y }, np: 2, t0: now }; c.dir = c.jp.to.x >= c.x ? 1 : -1; c.st = 'jump'; c.until = now + 900; }
        else if (now > c.until) catNext(c, now);
        const idle = c.visit && c.p < 0 && c.st !== 'jump' ? now - Math.max(c.visit.t0, c.visit.pet || 0) : 0, mad = idle > 18000;
        if (mad && !c.visit.mad) { c.visit.mad = 1; noiseHit(.35, .05, 2600); tone(180, .2, .04, 'sawtooth'); }
        if (mad && idle > 33000 && catHostOn && !c.visit.quiet) { c.huff = now; c.visit.until = now - 1; }
        if (mad) x += Math.floor(now / 60) % 2 ? .4 : -.4;
        const pose = c.st === 'walk' ? (Math.floor(now / 220) % 2 ? 'walk1' : 'walk2') : c.st === 'jump' ? 'stretch' : c.st === 'groom' ? (Math.floor(now / 380) % 2 ? 'groom' : 'sit') : c.st === 'stretch' ? 'stretch' : c.st === 'sleep' ? 'sleep' : 'sit';
        const petting = petFx.some(f => f.cat === ci && now - f.ms < 1600);
        const blink = petting || mad || (c.st === 'sit' && Math.floor((now + ci * 777) / 160) % 23 === 0);
        const rows = CAT_HI[ci][blink ? 'blink' : pose], pal = CAT_PAL[ci], w = Math.max(...rows.map(r => r.length)), h = rows.length;
        const u = Math.max(1, Math.round(.75 * cs)), ox = Math.round(x * cs - w * u / 2), oy = Math.round(y * cs - h * u) + 1, breathe = c.st === 'sleep' && Math.floor(now / 900) % 2 ? u : 0;
        const top = Math.max(0, rows.findIndex(r => [...r].some(ch => pal[ch]))); c.lx = x; c.ly = (oy + top * u) / cs;
        rows.forEach((r, j) => [...r].forEach((ch, i) => { const col = pal[ch]; if (!col) return; cx2.fillStyle = col; cx2.fillRect(ox + (c.dir > 0 ? i : w - 1 - i) * u, oy + j * u + (j < h * .55 ? breathe : 0), u, u); }));
        petFx.forEach(f => { if (f.cat !== ci) return; const e = (now - f.ms) / 1600; if (e > 1) return; const hx = ox + w * u / 2 + Math.sin(e * 9 + f.ms) * 4 * u, hy = oy - e * 18 * u, k2 = u; cx2.globalAlpha = 1 - e; cx2.fillStyle = '#ff5a8a';   // 하트 뿅
          [[1, 0], [2, 0], [4, 0], [5, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [2, 3], [3, 3], [4, 3], [3, 4]].forEach(([a2, b2]) => cx2.fillRect(hx + a2 * k2, hy + b2 * k2, k2, k2)); cx2.globalAlpha = 1; });
        if (mad && Math.floor(now / 300) % 3) { const mx = ox + (c.dir > 0 ? w * u - 2 * u : -2 * u), my = oy + 2 * u, R = '#ff3a3a';   // 💢 화남 표시
          [[1, 0], [1, 1], [0, 1], [3, 0], [3, 1], [4, 1], [0, 3], [1, 3], [1, 4], [4, 3], [3, 3], [3, 4]].forEach(([a2, b2]) => { cx2.fillStyle = R; cx2.fillRect(mx + a2 * u, my + b2 * u, u, u); }); }
        if (c.huff && now - c.huff < 1600) { const k = (now - c.huff) / 1600; cx2.save(); cx2.globalAlpha = 1 - k; cx2.font = `${6.5 * cs}px "Do Hyeon", sans-serif`; cx2.textAlign = 'center'; cx2.lineWidth = 1.2 * cs; cx2.strokeStyle = '#1a0f10'; cx2.strokeText('흥!', ox + w * u / 2, oy - k * 10 * cs); cx2.fillStyle = '#ff6a6a'; cx2.fillText('흥!', ox + w * u / 2, oy - k * 10 * cs); cx2.restore(); }
        if (c.st === 'sleep') { const k = (now / 1400 + ci) % 1; cx2.fillStyle = `rgba(255,255,255,${1 - k})`; const zx = ox + (c.dir > 0 ? w * u : -6 * u) + k * 8 * u, zy = oy + h * u * .4 - k * 14 * u; cx2.fillRect(zx, zy, 4 * u, u); cx2.fillRect(zx + 2 * u, zy + u, u, u); cx2.fillRect(zx + u, zy + 2 * u, u, u); cx2.fillRect(zx, zy + 3 * u, 4 * u, u); }   // z
      });
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
    // ㄱ과 ㄴ은 (337, 209) 기준 180° 대칭: 윗판·아랫판은 같은 길이, 다리도 같은 길이
    const A = [214, 168, 460, 184], B = [440, 184, 460, 226];   // ㄱ
    const C = [214, 192, 234, 234], D = [214, 234, 460, 250];   // ㄴ
    const lamp = (lx, ly) => { px(lx - 4, ly - 12, 9, 2, '#efe2c0'); px(lx, ly - 10, 1, 9, '#c9b48a'); px(lx - 3, ly - 1, 7, 2, '#c9b48a'); };
    const card = (mx, my) => { px(mx, my - 7, 6, 8, '#efe9de'); px(mx + 1, my - 6, 4, 3, '#3a3a3a'); };
    function tableBack() {
      slab(A, [216, 456]); slab(B, [442, 456]); slab(C, [216, 230]);
      lamp(276, 178); lamp(396, 178); lamp(450, 210); lamp(224, 218);
      card(334, 180); card(445, 196); card(223, 230);
    }
    function tableFront() { slab(D, [216, 290, 382, 456]); lamp(278, 244); lamp(398, 244); card(340, 246); }
    const glowsAt = [[44, 133], [150, 133], [276, 167], [396, 167], [450, 199], [224, 207], [278, 233], [398, 233]];
    const blit = (sp, cx, foot) => HIRES ? b.drawImage(hiSprite(sp), Math.round(cx - CX - 2), Math.round(foot - sp.height + 1), sp.width, sp.height) : b.drawImage(sp, Math.round(cx - CX - 2), Math.round(foot - sp.height + 1));
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
    const seen = new Map(), lastSeat = new Map(), lastPos = new Map(), leftAt = new Map(), secretSeen = new Set(), cosSeen = new Map(), poofAt = new Map(); let secretAnn = null;
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
      } else if (th === 'seollal' || th === 'chuseok') {
        const OB = ['#e23b4a', '#f6cc4a', '#3a7ad0', '#ffffff', '#1a1a1e'];   // 오방색 줄 장식
        for (let x = 4; x < 206; x += 6) { px(x, 26, 4, 1, '#c8a050'); px(x + 1, 27, 3, 4, OB[(x / 6 | 0) % 5]); px(x + 2, 31, 1, 1, OB[(x / 6 | 0) % 5]); }
        bunting(200, 288, 34, OB.slice(0, 4));
        if (th === 'seollal') { [[222, 44], [252, 52], [278, 42], [470, 60]].forEach(([x, y], k) => { const c = ['#e23b4a', '#ff7ab8', '#3a7ad0', '#f6cc4a'][k]; px(x + 2, y - 6, 1, 6, '#c8a050'); px(x, y, 6, 6, c); px(x - 1, y + 1, 8, 4, c); px(x + 1, y, 4, 1, shade(c, 1.3)); px(x + 1, y + 2, 4, 1, '#ffd84a'); });   // 복주머니
          px(300, 40, 1, 1, '#000'); for (let k = 0; k < 10; k++) px(462 - k, 90 + k * 3, 1, 3, 'rgba(255,255,255,.4)'); px(456, 76, 14, 16, '#ffffff'); px(456, 76, 14, 2, '#e23b4a'); px(456, 90, 14, 2, '#3a7ad0'); px(462, 80, 2, 8, '#f6cc4a'); }   // 방패연
        else { const mx = 212, my = 50; for (let yy = -11; yy <= 11; yy++) for (let xx = -11; xx <= 11; xx++) if (xx * xx + yy * yy <= 121) px(mx + xx, my + yy, 1, 1, (xx + yy) % 7 === 0 && xx * xx + yy * yy < 70 ? '#f0d890' : '#fff0b8');   // 보름달 + 토끼
          px(mx - 4, my + 2, 6, 4, '#e8d498'); px(mx - 3, my - 3, 2, 5, '#e8d498'); px(mx - 1, my - 4, 1, 4, '#e8d498'); px(mx + 3, my + 4, 3, 2, '#e8d498');
          for (let k = 0; k < 16; k++) { px(476 - k * 2, 30 + k, 2, 1, '#5a3a2a'); if (k % 4 === 1) { px(470 - k * 2, 32 + k, 4, 4, '#f08a1a'); px(471 - k * 2, 32 + k, 2, 1, '#3a7a2a'); } } }   // 감 가지
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
      if (th === 'seollal') { [[6, 146], [184, 146], [222, 168], [446, 168]].forEach(([x, y]) => { px(x, y - 4, 8, 4, '#f4f0e8'); px(x + 1, y - 5, 6, 1, '#ffffff'); px(x + 2, y - 4, 1, 1, '#f6cc4a'); px(x + 5, y - 4, 1, 1, '#3aa05a'); px(x, y - 1, 8, 1, '#c84a3a'); }); }   // 떡국
      if (th === 'chuseok') { [[6, 146], [184, 146], [222, 168], [446, 168], [244, 234]].forEach(([x, y]) => { px(x - 1, y - 1, 10, 1, '#c8a060'); [[0, '#ffffff'], [3, '#ffb0c8'], [6, '#9ad87a']].forEach(([dx, c]) => { px(x + dx, y - 3, 3, 2, c); px(x + dx + 1, y - 4, 1, 1, c); }); }); }   // 송편
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
      if (th === 'seollal') { for (let i = 0; i < 22; i++) { const x = ((i * 131) % W + Math.sin(t / 900 + i) * 12 + t / 300) % W, y = ((t / 1000 * (9 + i % 6)) + i * 41) % (H + 10) - 5; ctx.fillStyle = i % 3 ? 'rgba(230,60,80,.85)' : 'rgba(255,214,90,.9)'; ctx.fillRect(x * s, y * s, 2 * s, 2 * s); } }   // 매화 · 금가루
      if (th === 'chuseok') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(212 * s, 50 * s, 0, 212 * s, 50 * s, 34 * s); g.addColorStop(0, `rgba(255,240,170,${.22 + .05 * Math.sin(t / 700)})`); g.addColorStop(1, 'rgba(255,240,170,0)'); ctx.fillStyle = g; ctx.fillRect(176 * s, 14 * s, 72 * s, 72 * s); ctx.restore();
        for (let i = 0; i < 18; i++) { const x = ((i * 113) % W + Math.sin(t / 1000 + i) * 14 + t / 260) % W, y = ((t / 1000 * (8 + i % 5)) + i * 53) % (H + 10) - 5; ctx.fillStyle = i % 2 ? 'rgba(240,138,26,.9)' : 'rgba(230,190,60,.9)'; ctx.fillRect(x * s, y * s, 2.6 * s, 1.6 * s); ctx.fillRect((x + .6) * s, (y - .6) * s, 1.4 * s, 2.8 * s); } }   // 단풍잎
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
      // 계산 완료한 손님: 화면에 앉아 있던 걸 본 경우에만 퇴장 연출 (새로고침 때 다시 재생 안 함)
      const leaving = []; guests.forEach(g => { if (!g.left || !g.id) return; if (!leftAt.has(g.id)) leftAt.set(g.id, lastPos.has(g.id) ? Date.now() : 0); const ms = leftAt.get(g.id); if (ms) leaving.push({ id: g.id, nick: g.nick, ms }); });
      guests.forEach(g => { if (g.id && !g.left && leftAt.has(g.id)) leftAt.delete(g.id); });
      const allG = guests; guests = guests.filter(g => !g.left);
      const placed = placeGuests(allG, opts.seats).map(({ g, slot }, i) => ({ g, ...slot, i }));
      placed.forEach(p => { const id = p.g.id; if (!id) return; const was = lastSeat.get(id); if (was && was !== p.code && seen.has(id)) seen.set(id, t); lastSeat.set(id, p.code); lastPos.set(id, { x: p.x, foot: p.foot, sit: p.sit }); });
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
      const draw = p => { const bd = p.g.id && bdaySet.has(p.g.id), dc = bd ? { k: 'party', rar: 'n' } : cosOf(th, p.g, opts.day); p._cs = dc.k; p._rar = dc.rar;
        const ey = enterY(p);
        if (p.g.id && cosSeen.has(p.g.id) && cosSeen.get(p.g.id) !== dc.k && t > 4000) poofAt.set(p.g.id, t); if (p.g.id) cosSeen.set(p.g.id, dc.k);   // 코스튬을 입거나 벗으면 '펑' 반짝
        if ((dc.rar === 's' || dc.rar === 'L') && p.g.id && !secretSeen.has(p.g.id)) { secretSeen.add(p.g.id); if (t > 4000) { secretAnn = { nick: p.g.nick, name: dc.name, ms: Date.now(), L: dc.rar === 'L', k: dc.k }; setTimeout(() => sfxCos(dc.k), 300); } }
        if (dc.rar === 's' || dc.rar === 'L') { b.save(); b.globalCompositeOperation = 'lighter'; aura(b, dc.k, p.x + swayX(p), p.foot + bob(p.i) + ey - (p.sit ? 24 : 27), dc.rar === 'L' ? 34 : 30, t, .6 + Math.sin(t / 420) * .15); b.restore(); }
        blit(sprite(p.g, !!p.sit, p.g.drink, frameOf(p), dc.k), p.x + swayX(p), p.foot + bob(p.i) + ey + luckyHop(p, lk, t));
        const pa = p.g.id && poofAt.get(p.g.id); if (pa && t - pa < 800) { const k = (t - pa) / 800, cx = p.x + swayX(p), cy = p.foot + bob(p.i) - (p.sit ? 22 : 26); for (let a = 0; a < 8; a++) { const an = a * Math.PI / 4, r = 6 + k * 14; b.fillStyle = `rgba(255,${a % 2 ? 240 : 200},${a % 2 ? 200 : 255},${1 - k})`; b.fillRect(Math.round(cx + Math.cos(an) * r), Math.round(cy + Math.sin(an) * r * .8), 2, 2); } b.fillStyle = `rgba(255,255,255,${(1 - k) * .5})`; b.beginPath(); b.arc(cx, cy, 10 * (1 - k * .5), 0, Math.PI * 2); b.fill(); } };
      // 사장 반응: 주문 → 셰이킹 · 시크릿/레전드 등장·생일·하트 → 박수 · 새벽 1~6시 → 가끔 하품
      const nowMs = Date.now(), hr = new Date().getHours();
      const orderOn = opts.order && opts.order.ms && nowMs - opts.order.ms < 6000;
      const clapOn = (secretAnn && nowMs - secretAnn.ms < 3800) || (opts.bday && opts.bday.ms && nowMs - opts.bday.ms > 600 && nowMs - opts.bday.ms < 5000) || heartFloats.some(h => nowMs - h.ms >= 0 && nowMs - h.ms < 1800);
      const late = hr >= 1 && hr < 6;
      // 셰이커: 픽셀 회전 (u,v = 4x9 원본)
      const shakerAt = (cx2, cy2, ang) => { const co = Math.cos(ang), si = Math.sin(ang);
        for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const u2 = dx * co + dy * si + 2, v2 = -dx * si + dy * co + 4.5; if (u2 < 0 || u2 >= 4 || v2 < 0 || v2 >= 9) continue;
          const uu = Math.floor(u2), vv = Math.floor(v2); if (vv < 2 && (uu < 1 || uu > 2)) continue;
          px(Math.round(cx2 + dx), Math.round(cy2 + dy), 1, 1, vv < 2 ? '#eef1f4' : vv === 4 ? '#8a939a' : uu === 0 ? '#f6f8fa' : uu === 3 ? '#9aa3aa' : '#cfd5da'); } };
      const sparkle = (x, y, k, P2) => { const q = P2 || px, c2 = `rgba(255,250,200,${k})`; q(x, y - 2, 1, 5, c2); q(x - 2, y, 5, 1, c2); q(x, y, 1, 1, '#ffffff'); };
      const martini = (gx, fill, col, garnish, P2, gy0) => { const px = P2 || pxB, gy = gy0 || 136, rows = [9, 7, 5, 3, 1];
        rows.forEach((w, j) => { const x0 = gx - (w >> 1); px(x0, gy + j, 1, 1, 'rgba(220,240,255,.9)'); px(x0 + w - 1, gy + j, 1, 1, 'rgba(220,240,255,.9)'); if (w > 2 && (4 - j) < fill * 5) px(x0 + 1, gy + j, w - 2, 1, col); });
        px(gx - 4, gy, 9, 1, 'rgba(230,245,255,.95)'); px(gx, gy + 5, 1, 4, 'rgba(220,240,255,.9)'); px(gx - 2, gy + 9, 5, 1, 'rgba(220,240,255,.95)');
        if (garnish) { px(gx + 3, gy - 2, 2, 2, '#ffd84a'); px(gx + 2, gy - 1, 1, 1, '#7ac04a'); } };
      // 주문 들어오면 6초 루틴: 머리 위 셰이킹 → 공중 던지기/어깨 셰이킹 → 다른 셰이킹 → 잔에 따르기 (주문마다 순서가 바뀜)
      const styleOf = i => {
        if (orderOn) { const e = nowMs - opts.order.ms, sd = Math.floor(opts.order.ms / 1000) + i * 5, first = sd % 2 ? 'over' : 'side', mid = ['toss', 'spin', first === 'over' ? 'side' : 'over'][Math.floor(sd / 2) % 3];
          const seq = [[first, 1500], [mid, 1500], [first === 'over' ? 'side' : 'over', 1100], ['pour', 1900]]; let acc = 0;
          for (const [k, d] of seq) { if (e < acc + d) return { k, e: e - acc, d, sd }; acc += d; } return null; }
        const cyc = (t + i * 7000) % 16000; if (cyc < 2400) return { k: ['over', 'side', 'toss', 'spin'][Math.floor((t + i * 7000) / 16000) % 4], e: cyc, d: 2400, sd: 0 };
        return null; };
      const COCK = ['#ff6a9a', '#ffb43a', '#6ad0ff', '#c07aff', '#7ae07a'], frontFx = [];
      if (orderOn && !clapOn && t - (GS.iceT || 0) > 115) { const e0 = nowMs - opts.order.ms; if (e0 < 4100) { GS.iceT = t; sfxIce(); } else if (e0 > 5700 && GS.tingK !== opts.order.ms) { GS.tingK = opts.order.ms; sfxTing(); } }
      const sv = opts.served, svE = sv && sv.ms ? nowMs - sv.ms : 1e9, svT = svE < 3400 && sv.gid ? placed.find(p => p.g.id === sv.gid) : null;
      owners.forEach((o, i) => {
        const lift = i === 0 && svE < 1100 && !clapOn, st = clapOn || lift ? null : styleOf(i), yawn = late && (t + i * 17000) % 38000 < 2600;
        let wobble = 0, jx = 0, fr;
        if (clapOn) fr = Math.floor(t / 170) % 2 ? 'c' : 'C';
        else if (lift) fr = 's';
        else if (st) { fr = st.k === 'over' ? 'k' : 's'; if (st.k === 'over') wobble = Math.floor(t / 90) % 2; if (st.k === 'side') jx = Math.floor(t / 75) % 2 ? 1 : -1; }
        else fr = yawn ? 'y' : ((t + i * 2100) % 5200 < 140 ? 'b' : 'n');
        const ox = OWNER_X[i] + Math.round(Math.sin(t / 3200 + i * 2) * 6) + jx, foot = 160 + bob(i + 20) - wobble;
        owners[i]._x = ox;
        const oc = ownerCostume(o, i, th);
        if (SECRET_KEYS.has(oc) || LEGEND_KEYS.has(oc)) { b.save(); b.globalCompositeOperation = 'lighter'; aura(b, oc, ox, 160 + bob(i + 20) - 27, 30, t, .5 + Math.sin(t / 420) * .15); b.restore(); }
        blit(sprite(o, false, '', fr, oc), ox, foot);
        if (lift) { const fem = String(o.style || '')[0] === 'f', hx = ox + (fem ? 5.5 : 6.5), hy = foot - 28, col = drinkColor(sv.dr), tw3 = Math.floor(t / 120) % 2;
          frontFx.push(P2 => { martini(Math.round(hx + 1), 1, col, true, P2, hy - 10); if (tw3) sparkle(Math.round(hx + 7), hy - 13, .9, P2); }); }
        if (st && st.k !== 'over') { const fem = String(o.style || '')[0] === 'f', hx = ox + (fem ? 5.5 : 6.5), hy = foot - 28, k = st.k, p = st.e / st.d;
          if (k === 'side') { const a2 = Math.floor(t / 75) % 2 ? .55 : -.25; shakerAt(hx + 4, hy - 6, a2);
            px(hx - 1, hy - 8, 2, 1, 'rgba(255,255,255,.5)'); px(hx - 2, hy - 5, 2, 1, 'rgba(255,255,255,.35)'); px(hx + 9, hy - 8, 2, 1, 'rgba(255,255,255,.5)'); px(hx + 10, hy - 5, 2, 1, 'rgba(255,255,255,.35)'); }
          if (k === 'toss') { const q = (st.e % 1150) / 1150;
            if (q < .72) { const hh = Math.sin(q / .72 * Math.PI) * 26; shakerAt(hx + 4, hy - 6 - hh, q / .72 * Math.PI * 4); if (hh > 6) px(hx + 3, hy - hh + 3, 1, 3, 'rgba(255,255,255,.25)'); }
            else { shakerAt(hx + 4, hy - 6, 0); if (q < .9) sparkle(hx + 8, hy - 12, 1 - (q - .72) / .18); } }
          if (k === 'spin') { const sp = (st.e / 260) * Math.PI; shakerAt(hx + 4, hy - 6, sp); if (Math.floor(t / 120) % 2) sparkle(hx + 4 + Math.round(Math.cos(sp) * 7), hy - 6 + Math.round(Math.sin(sp) * 7), .7); }
          if (k === 'pour') { const col = orderOn && opts.order.dr ? drinkColor(opts.order.dr) : COCK[(st.sd + i) % 5], gx = ox + 19, tilt = Math.min(1, st.e / 300), ang = tilt * 2.35, mcx = hx + 6, mcy = hy - 3;
            shakerAt(mcx, mcy, ang); const mx = Math.round(mcx + 4.5 * Math.sin(ang)), my = Math.round(mcy - 4.5 * Math.cos(ang)), fill = Math.max(0, Math.min(1, (st.e - 350) / 1150));
            if (tilt >= 1 && fill < 1) { for (let yy = my + 1; yy < 136 + 4 - fill * 4; yy++) px(mx + ((yy + Math.floor(t / 60)) % 3 === 0 ? 1 : 0), yy, 1, 1, col); }
            const gX = Math.max(gx, mx), tw2 = fill >= 1 && Math.floor(t / 110) % 2; frontFx.push(P2 => { martini(gX, fill, col, fill >= 1, P2); if (tw2) sparkle(gX + 6, 133, .9, P2); }); } }
      });
      if (svE >= 1100 && svE < 2900 && svT) { const col = drinkColor(sv.dr), sx = owners[0]._x + 8, sy = 160 - 28 - 10, tx = svT.x + 6, ty = svT.foot - (svT.sit ? 41 : 45) + 6;
        if (svE < 2000) { const q = (svE - 1100) / 900, e2 = q * q * (3 - 2 * q), x = Math.round(sx + (tx - sx) * e2), y = Math.round(sy + (ty - sy) * e2 - Math.sin(q * Math.PI) * 34);
          frontFx.push(P2 => { martini(x, 1, col, true, P2, y); P2(x - 1 - Math.round(q * 4), y + 4, 1, 1, 'rgba(255,250,200,.6)'); }); }
        else { const k = 1 - (svE - 2000) / 900; frontFx.push(P2 => { martini(tx, 1, col, true, P2, ty); for (let a = 0; a < 6; a++) { const r = 6 + (1 - k) * 8, an = a * Math.PI / 3 + svE / 400; sparkle(Math.round(tx + Math.cos(an) * r), Math.round(ty + 4 + Math.sin(an) * r), k, P2); } }); }
        if (GS.svK !== sv.ms && svE > 2000) { GS.svK = sv.ms; sfxTing(); } }
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
      catVisitTick(placed, opts); for (let i = petFx.length - 1; i >= 0; i--) if (Date.now() - petFx[i].ms > 1700) petFx.splice(i, 1);
      const s = cw / W;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glowsAt.forEach(([gx0, gy0]) => { const gx = gx0 * s, gy = gy0 * s, gr = 30 * s; const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr); gg.addColorStop(0, 'rgba(255,200,130,.32)'); gg.addColorStop(1, 'rgba(255,200,130,0)'); ctx.fillStyle = gg; ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2); });
      const sg = ctx.createRadialGradient(98 * s, 104 * s, 0, 98 * s, 104 * s, 120 * s); sg.addColorStop(0, 'rgba(255,140,90,.18)'); sg.addColorStop(1, 'rgba(255,140,90,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, 240 * s, 220 * s);
      ctx.restore();
      drawCats(ctx, s);   // 고양이는 고해상도로 화면에 직접 (조명 효과 뒤에)
      if (hiFx.length) { hiFx.forEach(fn => fn(ctx, s)); hiFx.length = 0; }
      if (frontFx.length) { ctx.save(); const P2 = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x * s, y * s, w * s, h * s); }; frontFx.forEach(fn => fn(P2)); ctx.restore(); }   // 잔·반짝임은 고양이보다 앞에
      wallSign(ctx, s, t);
      cats.forEach((c, ci) => { if (c.st === 'jump' || c.lx === undefined) return; ctx.save(); ctx.font = `${6.4 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';   // 고양이 이름표 (머리 바로 위, 목걸이 색 테두리)
        const tw = ctx.measureText(c.name).width + 5 * s, th = 8.4 * s, cy = Math.max(th / 2 + s, (c.ly - 6.2) * s), cx = Math.max(tw / 2 + 2 * s, Math.min(W * s - tw / 2 - 2 * s, c.lx * s)), kc = CAT_PAL[ci].K;
        ctx.fillStyle = 'rgba(20,12,14,.78)'; ctx.beginPath(); ctx.roundRect(cx - tw / 2, cy - th / 2, tw, th, 4 * s); ctx.fill(); ctx.strokeStyle = kc; ctx.lineWidth = .8 * s; ctx.stroke();
        const ax = Math.max(cx - tw / 2 + 3 * s, Math.min(cx + tw / 2 - 3 * s, c.lx * s)); ctx.beginPath(); ctx.moveTo(ax - 1.6 * s, cy + th / 2); ctx.lineTo(ax + 1.6 * s, cy + th / 2); ctx.lineTo(ax, cy + th / 2 + 2 * s); ctx.closePath(); ctx.fillStyle = kc; ctx.fill();
        ctx.fillStyle = '#fff2e0'; ctx.fillText(c.name, cx, cy + .3 * s); ctx.restore(); });
      // 시크릿 = 황금 오라 + 도는 별, 레어 = 가끔 반짝
      placed.forEach(p => { if (!p._rar || p._rar === 'n') return; const cx = p.x * s, cy = (p.foot - (p.sit ? 22 : 24)) * s;
        if (p._rar === 's' || p._rar === 'L') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const pulse = .55 + Math.sin(t / 380) * .2, gr = 26 * s, gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr); gg.addColorStop(0, `rgba(255,214,90,${.42 * pulse})`); gg.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = gg; ctx.fillRect(cx - gr, cy - gr, gr * 2, gr * 2);
          for (let k = 0; k < 4; k++) { const a = t / 700 + k * Math.PI / 2, r = 15 * s, sx2 = cx + Math.cos(a) * r, sy2 = cy + Math.sin(a) * r * .6; ctx.fillStyle = 'rgba(255,236,150,.95)'; ctx.fillRect(sx2 - .6 * s, sy2 - 2.2 * s, 1.2 * s, 4.4 * s); ctx.fillRect(sx2 - 2.2 * s, sy2 - .6 * s, 4.4 * s, 1.2 * s); } ctx.restore(); }
        else { const ph2 = (t + ph(p) * 997) % 2600; if (ph2 < 500) { const a = ph2 / 500, sx2 = cx + 9 * s, sy2 = cy - 16 * s; ctx.fillStyle = `rgba(190,230,255,${1 - a})`; ctx.fillRect(sx2 - .5 * s, sy2 - 2 * s, 1 * s, 4 * s); ctx.fillRect(sx2 - 2 * s, sy2 - .5 * s, 4 * s, 1 * s); } } });
      particles(ctx, s, t, th);
      // 등장 반짝이 + 짠!
      placed.forEach(p => { if (p.entering === undefined) return; const e = p.entering; delete p.entering;
        const cx = (p.x) * s, cy = (p.foot - 30) * s;
        for (let k = 0; k < 6; k++) { const ang = k / 6 * Math.PI * 2 + e * 3, r = (10 + e * 18) * s;
          ctx.fillStyle = `rgba(255,230,160,${1 - e})`; const sx2 = cx + Math.cos(ang) * r, sy2 = cy + Math.sin(ang) * r;
          ctx.fillRect(sx2 - s, sy2 - 3 * s, 2 * s, 6 * s); ctx.fillRect(sx2 - 3 * s, sy2 - s, 6 * s, 2 * s); } });
      // 퇴장 인사: 자리에서 반짝이며 사라지고 '또 오세요!'가 떠오름
      leaving.forEach(lv => { const pos = lastPos.get(lv.id); if (!pos) return; const e = (Date.now() - lv.ms) / 2600; if (e < 0 || e > 1) return;
        const cx = pos.x * s, cy = (pos.foot - 24) * s;
        for (let k = 0; k < 8; k++) { const ang = k / 8 * Math.PI * 2 + e * 2, r = (6 + e * 22) * s; ctx.fillStyle = `rgba(255,214,140,${1 - e})`; const sx2 = cx + Math.cos(ang) * r, sy2 = cy + Math.sin(ang) * r; ctx.fillRect(sx2 - s, sy2 - 3 * s, 2 * s, 6 * s); ctx.fillRect(sx2 - 3 * s, sy2 - s, 6 * s, 2 * s); }
        ctx.save(); ctx.globalAlpha = Math.min(1, (1 - e) * 2); ctx.font = `${7 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 2.4 * s; ctx.strokeStyle = '#2a1618'; const ty = cy - (8 + e * 16) * s;
        ctx.strokeText('또 오세요!', cx, ty); ctx.fillStyle = '#ffd36a'; ctx.fillText('또 오세요!', cx, ty); ctx.restore(); });
      // 시크릿 등장 배너 (4초)
      if (secretAnn && Date.now() - secretAnn.ms < 4200) { const e = (Date.now() - secretAnn.ms) / 4200, a = Math.min(1, e * 6, (1 - e) * 5);
        ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; const by = 92 * s, bw = 230 * s, bh = 34 * s;
        ctx.fillStyle = 'rgba(20,12,4,.88)'; ctx.beginPath(); ctx.roundRect(240 * s - bw / 2, by - bh / 2, bw, bh, 8 * s); ctx.fill(); const fx = AURA_FX[secretAnn.k] || { t: secretAnn.L ? '★ LEGEND 아이돌 등장! ★' : '★ SECRET 코스튬 등장! ★', c: '#ffd23a' };
        ctx.save(); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; aura(ctx, secretAnn.k, 240 * s, by, bw * .55, Date.now(), .55); ctx.restore();
        ctx.beginPath(); ctx.roundRect(240 * s - bw / 2, by - bh / 2, bw, bh, 8 * s); ctx.strokeStyle = fx.c; ctx.globalAlpha = a * (.6 + Math.sin(Date.now() / 120) * .4); ctx.lineWidth = 1.6 * s; ctx.stroke(); ctx.globalAlpha = a;
        ctx.font = `${11 * s}px "Do Hyeon", sans-serif`; ctx.fillStyle = fx.c; ctx.fillText(fx.t, 240 * s, by - 4 * s);
        ctx.font = `${7 * s}px "Do Hyeon", sans-serif`; ctx.fillStyle = '#fff2d0'; ctx.fillText(`${secretAnn.nick}님이 '${secretAnn.name}' 뽑음!`, 240 * s, by + 10 * s); ctx.restore(); }
      const cp = cheerPair(placed, t);
      if (cp) { const mx = (cp[0].x + cp[1].x) / 2 * s, my = (Math.min(cp[0].foot, cp[1].foot) - (cp[0].sit ? 46 : 50)) * s;
        ctx.save(); ctx.font = `${8 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 2.5 * s; ctx.strokeStyle = '#2a1618';
        const jump = Math.abs(Math.sin(t / 160)) * 2 * s; ctx.strokeText('짠!', mx, my - jump); ctx.fillStyle = '#ffd36a'; ctx.fillText('짠!', mx, my - jump); ctx.restore(); }
      // 스크린: 제목/숫자 + QR
      ctx.textAlign = 'center';
      const lx = opts.qr ? 343 : 376;
      const label = { halloween: ['HAPPY HALLOWEEN', '#ff8a1a'], christmas: ['MERRY CHRISTMAS', '#ff5a5a'], summer: ['SUMMER VACANCE', '#4ad0e0'], spring: ['SPRING NIGHT', '#ff9ac0'],
        seollal: ['HAPPY NEW YEAR', '#ff6a6a'], chuseok: ['HAPPY CHUSEOK', '#ffd36a'], valentine: ['HAPPY VALENTINE', '#ff6a8a'], white: ['HAPPY WHITE DAY', '#bfe6ff'], rose: ['HAPPY ROSE DAY', '#ff5a6a'], pepero: ['HAPPY PEPERO DAY', '#e8a060'] }[th];
      if (label) { ctx.fillStyle = label[1]; ctx.font = `${6 * s}px "DotGothic16", monospace`; ctx.fillText(label[0], lx * s, 47 * s); }
      ctx.fillStyle = '#f6eee6'; ctx.font = `${9 * s}px "Do Hyeon", sans-serif`; ctx.fillText(opts.screenTitle || '오늘의 낯선 손님들', lx * s, 60 * s);
      ctx.fillStyle = '#ffb27a'; ctx.font = `${30 * s}px "DotGothic16", monospace`; ctx.fillText(String(opts.count).padStart(2, '0'), lx * s, 96 * s);
      ctx.fillStyle = '#b9a59c'; ctx.font = `${5.6 * s}px "DotGothic16", monospace`; ctx.fillText(`${opts.day.replaceAll('-', '.')}  notsun`, lx * s, 114 * s);
      // 대화 아이콘 설명 (스크린 아래쪽)
      { const ly = 124, lc = 376; ctx.save(); ctx.font = `${5.4 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        const parts = [['말 걸어도 돼요', 1], ['오늘은 조용히', 2]], gap = 9 * s, iw = 10 * s;
        const widths = parts.map(([tx, k]) => ctx.measureText(tx).width + (k ? iw : 0)), total = widths.reduce((a, b2) => a + b2, 0) + gap * (parts.length - 1);
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
          if (o.hearts > 1) { ctx.font = `${5.4 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'left'; ctx.fillStyle = '#ffb3cc'; ctx.fillText(String(o.hearts), hx + 7.6 * hs, hy + 5 * hs); ctx.textAlign = 'center'; } }
        const sub = badge || [o.vip ? 'VIP' : '', o.last && !many ? o.last : ''].filter(Boolean).join(' · ');
        if (o.tier && o.tier.k === 'regular') { const tw2 = Math.sin(performance.now() / 300) > 0.3; if (tw2) { ctx.fillStyle = '#fff6c0'; const sx3 = lx0 + w0 - 2 * s, sy3 = y0 - .5 * s; ctx.fillRect(sx3, sy3 - 1.5 * s, .8 * s, 3.8 * s); ctx.fillRect(sx3 - 1.5 * s, sy3, 3.8 * s, .8 * s); } }
        if (sub) { ctx.font = `${5.2 * s}px "Do Hyeon", sans-serif`; ctx.fillStyle = o.vip ? '#ffd36a' : '#ffc9a0'; ctx.fillText(sub, x * s, (y + 6.5) * s); }
      };
      owners.forEach((o, i) => tag(o.nick, o._x ?? OWNER_X[i], 111, '#ffe2c8'));
      // 이름표: 캐릭터 가슴 높이 (40명이 앉아도 덜 겹치게, 줄마다 살짝 엇갈림)
      placed.forEach((p, k) => { if (p.layer === 'standBack' && many) return;
        const top = p.foot - (p.sit ? 41 : 45);
        const tr = null, vip = !!(p.g.id && vipSet.has(p.g.id));   // 단골 표시는 남에게 보이지 않게 뺌
        const stag = p.layer === 'stool' ? ((+String(p.code).slice(1) || 0) % 2 === 0 ? 10 : 0) : (many ? (k % 2) * 4 : 0);
        tag(p.g.nick, p.x, top + (p.sit ? 30 : 31) + stag, '#f6eee6', !many && p.g.demo ? '예시' : '',
          { tier: tr, ring: vip ? '#ffd36a' : tr && tr.ring, tcolor: vip ? '#ffe9a8' : tr && tr.color, crown: tr && tr.k !== 'silver', vip, trophy: !!(bestId && p.g.id === bestId), talk: p.g.talk, hearts: p.g.noheart ? 0 : Math.min(p.g.hearts | 0, heartShown.has(p.g.id) ? heartShown.get(p.g.id) : (p.g.hearts | 0)), last: typeof p.g.last === 'string' && !p.g.nolast ? p.g.last : '' }); });
      if (opts.footer) { ctx.fillStyle = 'rgba(185,165,156,.75)'; ctx.font = `${5 * s}px "Do Hyeon", sans-serif`; ctx.fillText(opts.footer, 100 * s, 262 * s); }
      // 말풍선 우선순위: 사장 실시간 메시지 > 방금 온 손님 > 돌아가며
      const headY = p => p.foot - (p.sit ? 41 : 45) + bob(p.i) - (p._cs ? 4 : 0);
      // 대화 아이콘: 머리 위 (💬 말 걸어도 돼요 / 🌙 오늘은 조용히)
      const cheering = new Set((opts.cheers || []).filter(c => Date.now() - c.ms < 5200).map(c => c.to));  // 건배 받는 동안은 그 손님 말풍선 쉬기
      const talkers = placed.filter(p => p.g.msg && !cheering.has(p.g.id));
      const tick = Math.floor(t / 4500);
      let pick = null;
      const live = opts.live;
      const od = opts.order, odOn = od && Date.now() - od.ms < 9000;
      if (od && od.ms && sfxOrderKey !== od.ms) { sfxOrderKey = od.ms; if (odOn) sfxDing(); }
      const bye = leaving.filter(lv => Date.now() - lv.ms < 4000).pop();
      if (live && live.msg && Date.now() - live.ms < 15000) { const oi = live.who === 1 ? 1 : 0; pick = { key: 'live' + live.ms, x: owners[oi]._x ?? OWNER_X[oi], y: 103, text: live.msg, kind: 'live' }; }
      else if (bye) pick = { key: 'bye' + bye.id + bye.ms, x: owners[0]._x ?? OWNER_X[0], y: 103, text: `${bye.nick}님, 안녕히 가세요!`, kind: 'live' };
      else if (opts.served && Date.now() - opts.served.ms > 1900 && Date.now() - opts.served.ms < 5500 && opts.served.gid && placed.find(p => p.g.id === opts.served.gid)) { const sp = placed.find(p => p.g.id === opts.served.gid); pick = { key: 'sv' + opts.served.ms, x: sp.x, y: headY(sp), text: '한 잔 나왔어요! 🍸', kind: 'order' }; }
      else if (opts.served && Date.now() - opts.served.ms < 3000) pick = { key: 'sv' + opts.served.ms, x: owners[0]._x ?? OWNER_X[0], y: 103, text: '한 잔 완성! 🍸', kind: 'live' };
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
      if (opts.q && !bdOn && !opts.game && !(opts.lucky && opts.lucky.ms && Date.now() - opts.lucky.ms < 16000)) qBanner(ctx, s, t, opts.q);
      // 스토리 공유 안내: 8분마다 25초, 화면 아래 가운데에 은은하게 (게임·추첨·생일·주문 연출 중에는 쉼)
      if (opts.storyTip && STORY.on && !opts.game && !bdOn && !(opts.lucky && opts.lucky.ms && Date.now() - opts.lucky.ms < 16000) && !(opts.order && opts.order.ms && Date.now() - opts.order.ms < 9000)) {
        const ph = Date.now() % 480000; if (ph < 25000) { const a = Math.min(1, ph / 1500, (25000 - ph) / 1500); ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
          ctx.font = `${5.2 * s}px "Do Hyeon", sans-serif`; const l1 = `📸 ${STORY.screen}`, l2 = STORY.tag; ctx.font = `${5.2 * s}px "Do Hyeon", sans-serif`; const w1 = ctx.measureText(l1).width; ctx.font = `${6 * s}px "Do Hyeon", sans-serif`; const w = Math.max(w1, ctx.measureText(l2).width) + 16 * s, h = 18 * s, x = 240 * s - w / 2, y = (H - 22) * s;
          ctx.fillStyle = 'rgba(34,8,10,.78)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 5 * s); ctx.fill(); ctx.strokeStyle = `rgba(255,128,104,${.25 + Math.sin(t / 900) * .12})`; ctx.lineWidth = .7 * s; ctx.stroke();
          ctx.font = `${5.2 * s}px "Do Hyeon", sans-serif`; ctx.fillStyle = '#f3d6c8'; ctx.fillText(l1, 240 * s, y + 5.6 * s); ctx.font = `${6 * s}px "Do Hyeon", sans-serif`; ctx.fillStyle = '#ff9f86'; ctx.fillText(l2, 240 * s, y + 12.8 * s); ctx.restore(); } }
      // 손님 게임 신청 현황 (왼쪽 위, 정각 예고 아래)
      const rq = opts.reqs && opts.reqs[0]; if (rq && !opts.game) { ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; const txt = `🙋 ${rq.label} 신청 ${rq.n}/${REQ_NEED} · 폰에서 '나도!'를 누르면 바로 시작`;
        ctx.font = `${5.6 * s}px "Do Hyeon", sans-serif`; const w = ctx.measureText(txt).width + 8 * s, y = (opts.auto && opts.auto.left <= 300000 ? 25 : 15) * s;
        ctx.fillStyle = 'rgba(20,30,16,.9)'; ctx.beginPath(); ctx.roundRect(4 * s, y, w, 10 * s, 4 * s); ctx.fill(); ctx.strokeStyle = `rgba(126,224,138,${.5 + Math.sin(t / 260) * .4})`; ctx.lineWidth = .8 * s; ctx.stroke();
        ctx.fillStyle = '#b8f0a0'; ctx.fillText(txt, 8 * s, y + 5.2 * s); ctx.restore(); }
      // 매시 정각 게임 카운트다운 (왼쪽 위 작은 알림 → 5분 전부터 크게 → 1분 전 가운데 큰 숫자)
      const au = opts.auto; if (au && !opts.game && (opts.count || 0) > 0) { const left = Math.max(0, au.at - Date.now()), mm = Math.floor(left / 60000), ss = Math.floor(left / 1000) % 60;
        ctx.save(); ctx.textBaseline = 'middle';
        if (left > 60000) { const big = left <= 300000, txt = `🎮 ${String(au.hr).padStart(2, '0')}:00 ${au.label} · ${mm + (ss ? 1 : 0)}분 뒤`, fs = big ? 6.4 : 5.2;
          ctx.font = `${fs * s}px "Do Hyeon", sans-serif`; const w = ctx.measureText(txt).width + 8 * s, h = (big ? 19 : 9) * s, x = 4 * s, y = 3 * s;
          ctx.fillStyle = big ? `rgba(30,14,10,${.9})` : 'rgba(14,9,10,.78)'; ctx.beginPath(); ctx.roundRect(x, y, Math.max(w, big ? 120 * s : 0), h, 4 * s); ctx.fill();
          if (big) { ctx.strokeStyle = `rgba(255,211,106,${.55 + Math.sin(t / 240) * .4})`; ctx.lineWidth = 1 * s; ctx.stroke(); }
          ctx.fillStyle = big ? '#ffd36a' : '#ffe2c4'; ctx.textAlign = 'left'; ctx.fillText(txt, x + 4 * s, y + (big ? 6 : 4.6) * s);
          if (big) { ctx.font = `${5 * s}px "Do Hyeon", sans-serif`; ctx.fillStyle = '#fff2e0'; ctx.fillText('📱 폰에서 낯선 화면을 열어두세요 · 시작하면 바로 참여!', x + 4 * s, y + 14 * s); } }
        else { const k = (left % 1000) / 1000; ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(14,9,10,.9)'; ctx.beginPath(); ctx.roundRect(150 * s, 64 * s, 180 * s, 50 * s, 8 * s); ctx.fill(); ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 1.4 * s; ctx.stroke();
          ctx.font = `${8 * s}px "Do Hyeon", sans-serif`; ctx.fillStyle = '#ffd36a'; ctx.fillText(`${au.label} 곧 시작!`, 240 * s, 74 * s);
          ctx.font = `${(20 + (1 - k) * 4) * s}px "Do Hyeon", sans-serif`; ctx.fillStyle = '#ffffff'; ctx.fillText(String(Math.ceil(left / 1000)), 240 * s, 92 * s);
          ctx.font = `${5.6 * s}px "Do Hyeon", sans-serif`; ctx.fillStyle = '#fff2e0'; ctx.fillText('📱 폰에서 낯선 화면을 열어두세요', 240 * s, 107 * s);
          if (GS.cdK !== Math.ceil(left / 1000) && left < 10000) { GS.cdK = Math.ceil(left / 1000); tone(left < 1000 ? 1320 : 880, .12, .05, 'square'); } }
        ctx.restore(); }
    }
    // ---------- 게임 화면 ----------
    const GS = { holder: null, from: null, at: 0, tick: 0, boomKey: '', clinkSfx: new Set(), shkU: 0, shkA: 0, shkD: 1, shkOn: 0, parts: [], hb: '', fx: {} };
    // ---- 박진감 레이어: 화면 흔들림 · 폭죽 파편 · 효과음 ----
    const CONF = ['#ffd36a', '#ff8a6a', '#ffffff', '#7ee08a', '#ff6aa8', '#7ac8ff'], FIRE = ['#ffdf5a', '#ff8a3a', '#ff5a4a', '#8a7a7a', '#fff2c0'];
    const shake = (ms, amp) => { const n = Date.now(); if (GS.shkU > n && GS.shkA * (GS.shkU - n) / GS.shkD > amp) return; GS.shkU = n + ms; GS.shkD = ms; GS.shkA = amp; };
    const once = (k, fn) => { if (GS.fx[k]) return false; GS.fx[k] = 1; const ks = Object.keys(GS.fx); if (ks.length > 80) delete GS.fx[ks[0]]; fn(); return true; };
    function burst(x, y, n, cols, pow) { const n0 = Date.now(); for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = (.35 + Math.random()) * (pow || 1); GS.parts.push({ x, y, vx: Math.cos(a) * v * 70, vy: Math.sin(a) * v * 60 - 45, c: cols[i % cols.length], ms: n0, life: 900 + Math.random() * 800, r: Math.random() * 6 }); } if (GS.parts.length > 260) GS.parts.splice(0, GS.parts.length - 260); }
    function drawParts(ctx, s, n) { for (let i = GS.parts.length - 1; i >= 0; i--) { const p = GS.parts[i], ms = n - p.ms; if (ms > p.life) { GS.parts.splice(i, 1); continue; } const k = ms / 1000;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - ms / p.life); ctx.fillStyle = p.c; ctx.translate((p.x + p.vx * k) * s, (p.y + p.vy * k + 110 * k * k) * s); ctx.rotate(p.r + k * 9); ctx.fillRect(-1.6 * s, -.8 * s, 3.2 * s, 1.6 * s); ctx.restore(); } }
    const sfxBeat = () => { tone(62, .13, .2, 'sine'); tone(55, .16, .16, 'sine', .16); };
    const sfxRoll = () => { noiseHit(.04, .07, 420); tone(150 + Math.random() * 30, .03, .03, 'triangle'); };
    const sfxSlam = big => { noiseHit(big ? .5 : .25, big ? .2 : .12, 160); tone(big ? 70 : 110, .35, .13, 'sine'); tone(big ? 220 : 660, .18, .06, 'square', .02); };
    const sfxRoar = v => noiseHit(.16, v, 700);
    function banner(ctx, s, t, title, sub, col) {
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `${9 * s}px "Do Hyeon", sans-serif`; const tw = ctx.measureText(title).width; ctx.font = `${6 * s}px "Do Hyeon", sans-serif`; const sw = sub ? ctx.measureText(sub).width : 0;
      const w = Math.max(tw, sw) + 22 * s, h = (sub ? 28 : 17) * s, x = 240 * s - w / 2, y = 5 * s;
      ctx.fillStyle = 'rgba(14,9,10,.92)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 7 * s); ctx.fill();
      ctx.strokeStyle = col || '#ffb27a'; ctx.lineWidth = 1.2 * s; ctx.stroke();
      ctx.fillStyle = col || '#ffd9b8'; ctx.font = `${9 * s}px "Do Hyeon", sans-serif`; ctx.fillText(title, 240 * s, y + 9.5 * s);
      if (sub) { ctx.fillStyle = '#ece0d6'; ctx.font = `${6 * s}px "Do Hyeon", sans-serif`; ctx.fillText(sub, 240 * s, y + 21 * s); }
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
      const n0 = Date.now(), stg = ctx.canvas.parentElement;
      if (stg) { if (GS.shkU > n0) { const a = GS.shkA * (GS.shkU - n0) / GS.shkD; stg.style.transform = `translate(${((Math.random() * 2 - 1) * a).toFixed(1)}px, ${((Math.random() * 2 - 1) * a).toFixed(1)}px)`; GS.shkOn = 1; } else if (GS.shkOn) { GS.shkOn = 0; stg.style.transform = ''; } }
      if (GS.parts.length) drawParts(ctx, s, n0);
      if (!g) return; const e = n0 - g.ms;
      // 막판 5초: 심장박동 + 붉은 테두리 + 큰 숫자
      const clutch = col => { const rem = (g.dur || 0) - e / 1000; if (!(g.dur > 0) || rem > 5.02 || rem <= 0) return; const c = Math.ceil(rem), pu = Math.max(0, 1 - (c - rem) * 2.4), hk = g.n + g.phase + (g.round || 0) + c;
        if (GS.hb !== hk) { GS.hb = hk; sfxBeat(); if (c <= 3) tone(c === 1 ? 1320 : 990, .09, .05, 'square', .02); }
        ctx.save(); const gr = ctx.createRadialGradient(240 * s, 135 * s, 95 * s, 240 * s, 135 * s, 290 * s); gr.addColorStop(0, 'rgba(255,40,40,0)'); gr.addColorStop(1, `rgba(255,40,40,${(.1 + pu * .28 + (5 - c) * .04).toFixed(3)})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, W * s, H * s);
        ctx.font = `${(24 + pu * 14) * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4 * s; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1a0f10'; ctx.strokeText(String(c), 40 * s, 40 * s); ctx.fillStyle = c <= 3 ? '#ff5a4a' : (col || '#ffd36a'); ctx.fillText(String(c), 40 * s, 40 * s); ctx.restore(); };
      // 참여 모집 중에는 QR을 반짝이게: 아직 접속 안 한 손님도 바로 찍고 참여
      if (qr && (g.phase === 'join' || (g.type === 'race' && g.phase === 'pick') || (g.type === 'bal' && g.phase === 'play'))) { const q = 62 * s, qx = 392 * s, qy = 44 * s, gl = .55 + Math.sin(t / 220) * .45;
        ctx.save(); ctx.strokeStyle = `rgba(255,211,106,${gl})`; ctx.lineWidth = 2.4 * s; ctx.strokeRect(qx - 5 * s, qy - 5 * s, q + 10 * s, q + 10 * s);
        ctx.font = `${6.4 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 2 * s; ctx.strokeStyle = '#1a0f10'; ctx.strokeText('찍고 바로 참여!', qx + q / 2 + 6 * s, qy - 9 * s); ctx.fillStyle = '#ffd36a'; ctx.fillText('찍고 바로 참여!', qx + q / 2 + 6 * s, qy - 9 * s);
        if (Math.floor(t / 450) % 2 === 0) { const bob = Math.abs(Math.sin(t / 180)) * 4 * s; ctx.font = `${17 * s}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👇', qx + 4 * s, qy - 12 * s + bob); }
        ctx.restore(); }
      const find = gid => placed.find(p => p.g.id === gid);
      const T = (str, x, y, sz, col, al, st) => { ctx.save(); ctx.font = `${sz * s}px "Do Hyeon", sans-serif`; ctx.textAlign = al || 'center'; ctx.textBaseline = 'middle';
        if (st !== false) { ctx.lineWidth = Math.max(1.5, sz * .28) * s; ctx.strokeStyle = '#1a0f10'; ctx.lineJoin = 'round'; ctx.strokeText(str, x * s, y * s); } ctx.fillStyle = col; ctx.fillText(str, x * s, y * s); ctx.restore(); };
      const box = (x, y, w, h, col, fill) => { ctx.save(); ctx.fillStyle = fill || 'rgba(14,9,10,.9)'; ctx.beginPath(); ctx.roundRect(x * s, y * s, w * s, h * s, 6 * s); ctx.fill(); if (col) { ctx.strokeStyle = col; ctx.lineWidth = 1.2 * s; ctx.stroke(); } ctx.restore(); };
      if (g.type === 'bomb') {
        if (g.phase === 'join') { const n = new Set(acts.filter(a => a.kind === 'join').map(a => a.gid)).size;
          banner(ctx, s, t, '💣 폭탄 돌리기 참여자 모집!', `휴대폰에서 '참여'를 눌러주세요 · 지금 ${n}명`, '#ff8a5a'); clutch('#ff8a5a');
          acts.filter(a => a.kind === 'join').forEach(a => { const p = find(a.gid); if (p) { ctx.save(); ctx.font = `${5 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffb27a'; ctx.fillText('참여!', p.x * s, (headY(p) - 6) * s); ctx.restore(); } });
        }
        if (g.phase === 'play') {
          if (GS.holder !== g.holder) { if (GS.holder) shake(160, 3); GS.from = GS.holder; GS.holder = g.holder; GS.at = Date.now(); }
          const to = find(g.holder), fr = GS.from && find(GS.from), k = Math.min(1, (Date.now() - GS.at) / 380);
          if (to) { let x = to.x, y = headY(to) - 20; if (fr && k < 1) { const fy = headY(fr) - 20; x = fr.x + (to.x - fr.x) * k; y = fy + (y - fy) * k - Math.sin(k * Math.PI) * 30; } bombIcon(ctx, s, x, y, t, true); }
          const el = (Date.now() - (g.startMs || g.ms)) / 1000, iv = Math.max(140, 700 - el * 22);
          if (Date.now() - GS.tick > iv) { GS.tick = Date.now(); sfxTick(Math.min(8, el / 3)); if (el > 8 && iv < 400) sfxBeat(); }
          { const hp = Math.max(0, 1 - (Date.now() - GS.tick) / iv), hot = Math.min(1, el / 25); ctx.save(); const gr = ctx.createRadialGradient(240 * s, 135 * s, 90 * s, 240 * s, 135 * s, 290 * s); gr.addColorStop(0, 'rgba(255,60,30,0)'); gr.addColorStop(1, `rgba(255,60,30,${(hot * (.12 + hp * .22)).toFixed(3)})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, W * s, H * s); ctx.restore(); }
          banner(ctx, s, t, '💣 폭탄 돌리기', to ? `지금 ${to.g.nick}님 손에! 휴대폰에서 '넘기기'` : '', '#ff8a5a');
        }
        if (g.phase === 'boom') {
          const p = find(g.loser); const k = Math.min(1, e / 600);
          if (GS.boomKey !== g.n + '') { GS.boomKey = g.n + ''; sfxBoom(); shake(1100, 16); if (p) burst(p.x, headY(p) - 8, 60, FIRE, 1.6); }
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
          acts.filter(a => a.kind === 'ten' && Math.abs(a.v - 10000) <= 100 && Date.now() - (a.ms || 0) < 4000).forEach(a => { once('ten' + g.n + a.gid, () => { GS.wow = { nick: a.nick, v: a.v, ms: Date.now() }; shake(500, 7); sfxFanfare(); const p = find(a.gid); burst(p ? p.x : 240, p ? headY(p) - 14 : 80, 40, CONF, 1.2); }); });
          if (GS.wow && Date.now() - GS.wow.ms < 2200) { const k = Math.min(1, (Date.now() - GS.wow.ms) / 220); T('소름!', 240, 110, 30 * (.5 + k * .5), '#ff6aa8'); T(`${GS.wow.nick}님 ${(GS.wow.v / 1000).toFixed(2)}초`, 240, 132, 9, '#fff4ea'); }
          acts.filter(a => a.kind === 'ten' && Date.now() - (a.ms || 0) < 3000).forEach(a => { const p = find(a.gid); if (p) { ctx.save(); ctx.font = `${6 * s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 2 * s; ctx.strokeStyle = '#1a1214'; const tx = `${(a.v / 1000).toFixed(2)}초!`; ctx.strokeText(tx, p.x * s, (headY(p) - 14) * s); ctx.fillStyle = '#7ee0c8'; ctx.fillText(tx, p.x * s, (headY(p) - 14) * s); ctx.restore(); } });
        }
        if (g.phase === 'result') { const w = (g.ranks || [])[0];
          banner(ctx, s, t, w ? `🏆 우승 ${w.nick}님 · ${(w.v / 1000).toFixed(2)}초` : '도전한 사람이 없어요', w && g.reward ? `상품: ${g.reward}` : '', '#ffd36a');
          if (w) once('tw' + g.n, () => { sfxFanfare(); shake(350, 5); const p = find(w.gid); burst(p ? p.x : 240, p ? headY(p) - 14 : 60, 50, CONF, 1.3); });
          const p = w && find(w.gid); if (p) { const j = Math.abs(Math.sin(t / 200)) * 2; ctx.save(); ctx.fillStyle = '#ffcf4a'; const x = p.x * s, y = (headY(p) - 16 - j) * s;
            ctx.fillRect(x - 4 * s, y, 8 * s, 5 * s); ctx.fillRect(x - 1 * s, y + 5 * s, 2 * s, 2.5 * s); ctx.fillRect(x - 3 * s, y + 7.5 * s, 6 * s, 1.5 * s); ctx.fillRect(x - 6 * s, y + 1 * s, 2 * s, 2.5 * s); ctx.fillRect(x + 4 * s, y + 1 * s, 2 * s, 2.5 * s); ctx.restore(); }
        }
      }
      if (g.type === 'toast') {
        const left = 3 - Math.floor(e / 1000), cl = new Set(acts.filter(a => a.kind === 'clink').map(a => a.gid));
        if (e < 3000) { banner(ctx, s, t, `🥂 다 같이 건배! ${left}`, '휴대폰에서 짠 버튼을 눌러주세요', '#ffd36a'); if (GS.tick !== left) { GS.tick = left; tone(880, .12, .06, 'sine'); } }
        else { banner(ctx, s, t, `짠! 오늘 ${cl.size}명이 같이 건배`, '혼자 와도, 혼자 아니게', '#ffd36a'); if (GS.tick !== -1) { GS.tick = -1; sfxClink(); shake(260, 4); placed.forEach(p => { if (cl.has(p.g.id)) burst(p.x, headY(p) - 20, 10, CONF, .8); }); } }
        placed.forEach(p => { if (!cl.has(p.g.id)) return; const hy = headY(p) - 20 - (e > 3000 ? Math.abs(Math.sin(t / 180)) * 2 : 0); ctx.save(); const x = p.x * s, y = hy * s; ctx.translate(x, y); ctx.scale(1.6, 1.6); ctx.translate(-x, -y);
          ctx.fillStyle = '#fff4d8'; ctx.fillRect(x - 2.4 * s, y - 4.6 * s, 4.8 * s, 6 * s); ctx.fillStyle = '#ffc24a'; ctx.fillRect(x - 1.8 * s, y - 2.4 * s, 3.6 * s, 3.4 * s); ctx.fillStyle = '#fff'; ctx.fillRect(x - 1.8 * s, y - 4 * s, 3.6 * s, 1.2 * s); ctx.restore();
          if (!GS.clinkSfx.has(p.g.id + g.n)) { GS.clinkSfx.add(p.g.id + g.n); if (e > 3000) tone(2093, .2, .04, 'sine'); } });
      }
      // ---------- 새 게임 6종 ----------
      const left = () => Math.max(0, Math.ceil((g.dur || 0) - e / 1000));
      const joinBanner = (title, col) => { const n = new Set(acts.filter(a => a.kind === 'join').map(a => a.gid)).size;
        banner(ctx, s, t, title, `휴대폰에서 '참여'를 눌러주세요 · 지금 ${n}명 · ${left()}초`, col); clutch(col);
        acts.filter(a => a.kind === 'join').forEach(a => { const p = find(a.gid); if (p) T('참여!', p.x, headY(p) - 6, 5, col); }); };
      const overHead = (gid, str, col, sz) => { const p = find(gid); if (p) T(str, p.x, headY(p) - 8, sz || 6, col); };
      const wrap = (str, max) => { const out = []; let line = ''; for (const ch of String(str)) { if ((line + ch).length > max && ch !== ' ') { out.push(line); line = ch; } else line += ch; } if (line) out.push(line); return out.map(l => l.trim()); };
      if (g.type === 'bal') {
        const votes = {}; acts.filter(a => a.kind === 'vote' && a.gid && (!g.round || a.k === g.round)).forEach(a => { if (!(a.gid in votes)) votes[a.gid] = a.v; });
        const n = Object.keys(votes).length, na = Object.values(votes).filter(v => v === 0).length, nb = n - na, res = g.phase === 'result';
        banner(ctx, s, t, `⚖️ 밸런스 게임${g.round ? ` ${g.round}/${g.total}` : ''}`, res ? (n ? (na === nb ? '딱 반반! 서로 이야기해 보세요' : '여러분의 선택은?') : '아무도 고르지 않았어요') : `휴대폰에서 골라주세요 · ${n}명 참여 · ${left()}초`, '#ffb3cc');
        const draw = (x, txt, col, cnt, pct, win) => { box(x, 40, 146, 80, col, 'rgba(14,9,10,.95)'); const ls = wrap(txt, 9);
          ls.slice(0, 2).forEach((l, i) => T(l, x + 73, (res ? 60 : 72) + (i - (Math.min(2, ls.length) - 1) / 2) * 11, 10, '#fff4ea'));
          if (res) { ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = .25; ctx.fillRect((x + 10) * s, 84 * s, 126 * s, 9 * s); ctx.globalAlpha = .9; const k = Math.min(1, e / 900) * pct; ctx.fillRect((x + 10) * s, 84 * s, 126 * k * s, 9 * s); ctx.restore();
            T(`${Math.round(pct * 100)}% · ${cnt}명`, x + 73, 106, 8, col); if (win) T('소수 정예!', x + 73, 34, 7.5, '#ffd36a'); } };
        draw(87, g.a || 'A', '#ff8a8a', na, n ? na / n : 0, res && n > 1 && na < nb && na > 0);
        draw(247, g.b || 'B', '#7ab8ff', nb, n ? nb / n : 0, res && n > 1 && nb < na && nb > 0);
        T('VS', 240, 80, 12 + (res ? 0 : Math.sin(t / 160) * 1.5), '#ffd36a'); if (!res) clutch('#ffb3cc');
        if (res && n > 1) once('bal' + g.n + '|' + (g.round || 0), () => { sfxSlam(false); shake(300, 5); burst(na >= nb ? 160 : 320, 60, 30, CONF, 1); });
        if (!res) Object.keys(votes).forEach(gid => overHead(gid, '✔', '#7ee08a', 6));
      }
      if (g.type === 'nun') {
        if (g.phase === 'join') joinBanner('🙊 눈치게임 참여자 모집!', '#ffd36a');
        else { const calls = g.calls || [], last = calls[calls.length - 1];
          if (g.phase === 'play') { banner(ctx, s, t, `🙊 눈치게임 · ${(g.players || []).length}명`, '눈치껏 휴대폰에서 숫자 외치기! 동시에 외치면 탈락 · 끝까지 못 외쳐도 탈락', '#ffd36a');
            clutch('#ffd36a'); if (last) once('nun' + g.n + '|' + last.num, () => { shake(140, 2.5); tone(440 + last.num * 70, .1, .07, 'square'); });
            if (last) { const k = Math.min(1, e / 180); box(196, 44, 88, 64, '#ffd36a', 'rgba(14,9,10,.92)'); T(`${last.num}!`, 240, 72, 26 + (1 - k) * 14, '#ffd36a'); T(`${last.nick}`, 240, 99, 7, '#f6eee6'); }
            else { box(196, 44, 88, 64, '#ffd36a', 'rgba(14,9,10,.92)'); T('1부터!', 240, 76, 16, '#ffd36a'); } }
          calls.forEach(c => overHead(c.gid, `${c.num}!`, '#ffd36a', 7));
          if (g.phase === 'result') { const ls = g.losers || [];
            banner(ctx, s, t, ls.length ? `🙊 ${ls.map(l => l.nick).join(', ')}님 탈락!` : '🙊 눈치게임 끝!', g.reason || '', '#ff8a5a');
            if (e < 2500 && g.reason && g.reason.includes('동시')) { const k = Math.min(1, e / 300); T('동시!', 240, 74, 20 * (0.6 + k * 0.4), '#ff5a4a'); }
            once('nunr' + g.n, () => { if (ls.length) { sfxSlam(true); shake(650, 10); ls.forEach(l => { const p = find(l.gid); if (p) burst(p.x, headY(p) - 8, 18, FIRE, 1); }); } });
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
          if (g.phase === 'spin') { banner(ctx, s, t, '🎡 행운의 룰렛', `${ps.length}명 중 한 명! 두구두구…`, '#ffd36a'); if (k < 1 && Date.now() - GS.tick > 60 + 400 * k * k) { GS.tick = Date.now(); tone(1200, .03, .03, 'square'); if (k > .7) sfxBeat(); }
            if (k > .45 && k < 1 && ps.length) { const TAU = Math.PI * 2, idx = Math.floor((((-Math.PI / 2 - ang) % TAU) + TAU) % TAU / seg) % N2, cur = ps[idx]; if (cur) { const z = (k - .45) / .55; box(190, 166, 100, 18, '#ffd36a', 'rgba(14,9,10,.92)'); T(`▶ ${cur.nick}`, 240, 175, 8 + z * 4, cols[idx % cols.length] === '#4f81bd' ? '#9cc4ff' : '#fff4ea'); } }
            if (k >= 1) once('rl' + g.n, () => { sfxSlam(false); shake(380, 7); const p = find(g.winner); burst(p ? p.x : 240, p ? headY(p) - 12 : 44, 50, CONF, 1.3); }); }
          else { banner(ctx, s, t, `🎉 ${g.winnerNick || ''}님 당첨!`, g.reward ? `상품: ${g.reward}` : '축하해요!', '#ffd36a'); if (GS.boomKey !== 'r' + g.n) { GS.boomKey = 'r' + g.n; sfxClink(); once('rl' + g.n, () => { sfxSlam(false); shake(380, 7); const p = find(g.winner); burst(p ? p.x : 240, p ? headY(p) - 12 : 44, 50, CONF, 1.3); }); }
            const p = find(g.winner); if (p) { const j = Math.abs(Math.sin(t / 200)) * 2; T('🎉', p.x, headY(p) - 12 - j, 9, '#ffd36a', 'center', false); } } }
      }
      if (g.type === 'race') {
        const H5 = RACE_HORSES, picks = {}; if (g.phase !== 'pick' && g.pk && typeof g.pk === 'object') Object.entries(g.pk).forEach(([gid, v]) => { picks[gid] = v | 0; }); else acts.filter(a => a.kind === 'horse' && a.gid && (g.phase === 'pick' || (a.ms || 0) <= g.ms)).forEach(a => { if (!(a.gid in picks)) picks[a.gid] = a.v; });
        const cnt = H5.map((_, i) => Object.values(picks).filter(v => v === i).length);
        const X0 = 96, X1 = 414, Y0 = 128, LH = 21, RI = raceInfo(g), order = RI.order, tt = g.phase === 'run' ? e / 1000 - RACE_T0 : g.phase === 'result' ? 99 : -1;
        const wk = g.n + '|' + g.phase; if (GS.winK !== wk) { GS.winK = wk; const day = bizDate(); GS.wins = g.phase === 'result' && g.n ? raceWinAdd(day, g.n, order[0]) : raceWins(day); } const wins = GS.wins;
        box(30, Y0 - 12, 420, LH * 5 + 18, '#ffb27a', 'rgba(20,40,24,.88)');
        ctx.save(); for (let i = 0; i <= 5; i++) { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(34 * s, (Y0 - 4 + i * LH) * s, 412 * s, .6 * s); }
        for (let y = 0; y < LH * 5; y += 3) { ctx.fillStyle = (y / 3) % 2 ? '#fff' : '#111'; ctx.fillRect((X1 + 8) * s, (Y0 - 4 + y) * s, 3 * s, 3 * s); ctx.fillStyle = (y / 3) % 2 ? '#111' : '#fff'; ctx.fillRect((X1 + 11) * s, (Y0 - 4 + y) * s, 3 * s, 3 * s); }
        ctx.restore();
        const prog = i => raceProg(g, i, tt, RI), P = H5.map((_, i) => prog(i));
        const say = (x, y, txt, col) => { ctx.save(); ctx.font = `${5.4 * s}px "Do Hyeon", sans-serif`; const w = ctx.measureText(txt).width + 5 * s; ctx.fillStyle = col || 'rgba(255,248,238,.95)'; ctx.beginPath(); ctx.roundRect(x * s, (y - 4.6) * s, w, 8.4 * s, 3 * s); ctx.fill();
          ctx.beginPath(); ctx.moveTo((x - 2) * s, (y - .5) * s); ctx.lineTo(x * s, (y - 2) * s); ctx.lineTo(x * s, (y + 1) * s); ctx.fill(); ctx.fillStyle = '#2a1a14'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(txt, (x + 2.5) * s, (y - .4) * s); ctx.restore(); };
        H5.forEach((h, i) => { const y = Y0 + i * LH + 5, pr = P[i], x = X0 + (X1 - X0) * pr, run = tt > 0 && pr < 1, win = g.phase === 'result' && order[0] === i, f = run ? Math.floor(t / 85 + i) % 4 : win ? (Math.floor(t / 300) % 2 ? 0 : 2) : 2, bobY = run && (f === 1 || f === 3) ? -1 : win ? -Math.round(Math.abs(Math.sin(t / 260)) * 3) : 0;
          if (win) { ctx.fillStyle = `rgba(255,211,106,${.16 + Math.sin(t / 250) * .07})`; ctx.fillRect(34 * s, (Y0 - 4 + i * LH) * s, 412 * s, LH * s); }
          ctx.save(); ctx.imageSmoothingEnabled = false;
          ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect((x - 11) * s, (y + 9) * s, 22 * s, 2 * s);
          if (run) { ctx.fillStyle = 'rgba(230,210,170,.45)'; for (let k = 0; k < 3; k++) { const dx = ((t / 40 + k * 5 + i * 3) % 14); ctx.fillRect((x - 14 - dx) * s, (y + 8 - (k % 2)) * s, 2 * s, 1 * s); } }
          ctx.drawImage(horseSprite(i, f), Math.round((x - 14) * s), Math.round((y - 10 + bobY) * s), 26 * s, 20 * s);
          ctx.restore();
          T(String(i + 1), x - 5, y + 1.8 + bobY, 2.8, '#1a0f10', 'center', false);
          T(`${win ? '🏆 ' : ''}${i + 1}. ${h.n}`, 36, y - 1, 5, win ? '#ffd36a' : h.c, 'left');
          if (wins.w[i]) T(`오늘 ${wins.w[i]}승`, 36, y + 5.4, 3.6, '#ffd36a', 'left');
          const fans = g.phase === 'pick' ? Object.entries(picks).filter(([, v]) => v === i).map(([gid]) => (placed.find(p => p.g.id === gid) || { g: {} }).g.nick).filter(Boolean) : []; if (fans.length) T(fans.slice(0, 3).join(' · ') + (fans.length > 3 ? ` +${fans.length - 3}` : ''), X1 - 4, y + 5.6, 4.2, 'rgba(255,226,196,.85)', 'right');
          if (g.phase === 'pick') { T(`${cnt[i]}명`, X1 - 4, y - 1, 5, '#ffd36a', 'right'); const ph = (t / 2600 + i * .37) % 1; if (ph < .78) say(x + 13, y - 4, h.ln[Math.floor(t / 2600 + i * .37) % h.ln.length]); }
          if (win) say(150, y - 1, h.win, 'rgba(255,230,150,.97)'); });
        if (g.phase === 'pick') { banner(ctx, s, t, '🏇 픽셀 경마', `휴대폰에서 우승마를 골라주세요 · ${left()}초`, '#7ee08a'); clutch('#7ee08a'); }
        if (g.phase === 'run') { if (tt < 0) { const c = Math.ceil(-tt); T(tt > -0.6 ? '출발!' : String(Math.min(3, c)), 240, 80, 22, '#ffd36a'); if (GS.tick !== c) { GS.tick = c; tone(tt > -0.6 ? 1320 : 880, .15, .06, 'square'); } }
          const lead = H5.map((_, i) => i).sort((a, b) => P[b] - P[a])[0], F0 = RI.F[0];
          // 말발굽 소리 · 역전 · 결승
          if (tt > 0 && tt < RI.end && t - (GS.hoofT || 0) > 110) { GS.hoofT = t; GS.hoofK = (GS.hoofK || 0) + 1; noiseHit(.025, GS.hoofK % 2 ? .05 : .035, 260); tone(GS.hoofK % 2 ? 95 : 120, .05, .03, 'triangle'); }
          if (GS.raceN !== g.n) { GS.raceN = g.n; GS.lead = -1; GS.flipT = 0; GS.finK = 0; }
          if (tt > 3 && tt < F0 && lead !== GS.lead) { if (GS.lead >= 0) { GS.flipT = t; GS.flipH = lead; tone(660, .08, .05, 'square'); tone(990, .12, .05, 'square', .08); shake(220, 3); } GS.lead = lead; }
          // 막판 스퍼트: 함성이 커지고, 속도선 · 간발의 차
          { const srt = P.slice().sort((a, b) => b - a), top = srt[0], gap = srt[0] - srt[1];
            if (tt > 0 && tt < F0 && top > .72) { const z = Math.min(1, (top - .72) / .28);
              if (t - (GS.roarT || 0) > 130) { GS.roarT = t; sfxRoar(.03 + z * .09); }
              ctx.save(); ctx.fillStyle = `rgba(255,255,255,${(.12 + z * .2).toFixed(3)})`; for (let k2 = 0; k2 < 14; k2++) { const yy = Y0 - 4 + ((k2 * 37 + Math.floor(t / 30) * 11) % (LH * 5)), xx = 40 + ((k2 * 53 + t * .9) % 380); ctx.fillRect(xx * s, yy * s, (18 + z * 20) * s, .7 * s); } ctx.restore();
              T(gap < .03 ? (Math.floor(t / 180) % 2 ? '간발의 차!' : '간발의 차!!') : '막판 스퍼트!', 240, 104, 13 + z * 4 + (gap < .03 ? Math.sin(t / 60) * 1.2 : 0), gap < .03 ? '#ff6a5a' : '#ffd36a'); } }
          if (tt <= 3) GS.lead = lead;
          if (GS.flipT && t - GS.flipT < 1000) { const k = (t - GS.flipT) / 1000, ly = Y0 + GS.flipH * LH + 5; T('역전!', X0 + (X1 - X0) * P[GS.flipH] + 4, ly - 12 - k * 6, 8 - k * 2, `rgba(255,90,90,${1 - k})`); }
          if (tt >= F0 && !GS.finK) { GS.finK = 1; noiseHit(1.4, .1, 900); shake(500, 8); burst(X1 + 8, Y0 + order[0] * LH + 5, 46, CONF, 1.3); if (RI.photo) noiseHit(.08, .14, 5000); else sfxFanfare(); }
          let sub = tt > 0 ? `선두: ${lead + 1}번 ${H5[lead].n}` : '곧 출발해요';
          if (tt >= F0) { const w = order[0];
            if (RI.photo) { if (tt < F0 + .18) { ctx.fillStyle = `rgba(255,255,255,${.85 * (1 - (tt - F0) / .18)})`; ctx.fillRect(0, 0, W * s, H * s); }
              if (tt < F0 + 1.5) { sub = '거의 동시에 들어왔어요!'; box(160, 87, 160, 18, '#ffffff', 'rgba(20,14,16,.88)'); T(Math.floor(t / 250) % 2 ? '📸 사진판정 중…' : '📸 사진판정 중', 240, 96, 13, '#ffffff'); }
              else { sub = `코 차이로 ${w + 1}번 ${H5[w].n}!`; box(150, 87, 180, 18, '#ffd36a', 'rgba(20,14,16,.88)'); T(`${w + 1}번 ${H5[w].n} 코 차이 1착!`, 240, 96, 12, '#ffd36a'); if (GS.finK === 1) { GS.finK = 2; sfxFanfare(); } } }
            else { sub = `${w + 1}번 ${H5[w].n} 1착!`; box(160, 87, 160, 18, '#ffd36a', 'rgba(20,14,16,.88)'); T(`🏁 ${w + 1}번 ${H5[w].n} 1착!`, 240, 96, 12, '#ffd36a'); } }
          banner(ctx, s, t, '🏇 달려라!', sub, '#7ee08a'); }
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
          if (g.phase === 'pick') clutch('#7ab8ff');
          if (g.phase === 'reveal' && e < 1400) { banner(ctx, s, t, '🥁 두구두구…', '사장님은 과연?', '#7ab8ff'); box(200, 40, 80, 62, '#7ab8ff'); T('사장님', 240, 50, 6, '#b9c8e0'); T(HE[Math.floor(t / 70) % 3], 240, 76, 22 + Math.sin(t / 50) * 1.5, '#fff', 'center', false);
            if (t - (GS.rollT || 0) > 65) { GS.rollT = t; sfxRoll(); } Object.entries(g.picks || {}).forEach(([gid, v]) => overHead(gid, HE[v], '#fff', 8)); }
          else if (g.phase === 'reveal') { const pk = g.picks || {}, outs = new Set(g.out || []), e = n0 - g.ms - 1400;
            once('rv' + g.n + '|' + g.k, () => { sfxSlam(outs.size > 0); shake(outs.size ? 450 : 200, outs.size ? 9 : 3); [...outs].forEach(gid => { const p = find(gid); if (p) burst(p.x, headY(p) - 6, 12, FIRE, .8); }); });
            banner(ctx, s, t, `사장님은 ${HN[g.hand]}!`, (g.out || []).length ? `${(g.out || []).length}명 탈락 · 남은 ${alive.length}명` : (g.redo ? '모두 져서 다시 한 판!' : '탈락자 없음!'), '#7ab8ff');
            box(200, 40, 80, 62, '#ffd36a'); T('사장님', 240, 50, 6, '#ffe9b0'); T(HE[g.hand], 240, 76, 24 * Math.min(1, .5 + e / 400), '#fff', 'center', false);
            const cnt = [0, 1, 2].map(h => Object.values(pk).filter(v => v === h).length); T(`가위 ${cnt[0]} · 바위 ${cnt[1]} · 보 ${cnt[2]}`, 240, 112, 6.5, '#f6eee6');
            Object.entries(pk).forEach(([gid, v]) => overHead(gid, HE[v], '#fff', 8)); [...outs].forEach(gid => { const p = find(gid); if (p) T('✖', p.x + 7, headY(p) - 5, 7, '#ff5a4a'); }); }
          if (g.phase === 'result') { const w = g.winners || [];
            once('rpsw' + g.n, () => { if (w.length) { sfxFanfare(); shake(350, 5); w.forEach(x => { const p = find(x.gid); if (p) burst(p.x, headY(p) - 12, 30, CONF, 1.2); }); } else sfxSlam(true); });
            banner(ctx, s, t, w.length ? `🏆 ${w.map(x => x.nick).join(', ')}님 생존!` : '사장님 승리! 😎', w.length && g.reward ? `상품: ${g.reward}` : '다음 판에 다시 도전해요', '#ffd36a');
            w.forEach(x => { const p = find(x.gid); if (p) { const j = Math.abs(Math.sin(t / 200)) * 2; T('🏆', p.x, headY(p) - 12 - j, 9, '#ffd36a', 'center', false); } }); } }
      }
      if (g.type === 'ox') {
        if (g.phase === 'join') joinBanner('⭕ OX 서바이벌 참여자 모집!', '#ffb27a');
        else if (g.phase === 'ans' && e < 1400) { const ls = wrap(g.q || '', 18); banner(ctx, s, t, `⭕❌ ${g.round}번 문제`, '🥁 정답은…', '#ffb27a');
          box(120, 38, 240, 24 + ls.length * 12, '#ffb27a'); ls.forEach((l, i) => T(l, 240, 50 + i * 12, 9, '#fff4ea')); T(Math.floor(t / 110) % 2 ? 'O' : 'X', 240, 50 + ls.length * 12 + 18, 14 + Math.sin(t / 50) * 1.5, '#fff4ea');
          if (t - (GS.rollT || 0) > 65) { GS.rollT = t; sfxRoll(); } Object.entries(g.picks || {}).forEach(([gid, v]) => overHead(gid, v === 0 ? 'O' : 'X', '#fff4ea', 9)); }
        else if (g.phase === 'q' || g.phase === 'ans') { const alive = g.alive || [], q = g.q || '', ls = wrap(q, 18), e = g.phase === 'ans' ? n0 - g.ms - 1400 : n0 - g.ms;
          if (g.phase === 'q') clutch('#ffb27a'); else once('oa' + g.n + '|' + g.k, () => { const no = (g.out || []).length; sfxSlam(no > 0); shake(no ? 450 : 200, no ? 9 : 3); (g.out || []).forEach(gid => { const p = find(gid); if (p) burst(p.x, headY(p) - 6, 12, FIRE, .8); }); });
          banner(ctx, s, t, `⭕❌ OX 서바이벌 · ${g.round}번 문제`, g.phase === 'q' ? `생존 ${alive.length}명 · 휴대폰에서 O 또는 X · ${left()}초` : ((g.out || []).length ? `${(g.out || []).length}명 탈락 · 생존 ${alive.length}명` : (g.redo ? '모두 틀려서 전원 부활!' : '탈락자 없음!')), '#ffb27a');
          box(120, 38, 240, 24 + ls.length * 12, g.phase === 'ans' ? '#ffd36a' : '#ffb27a'); ls.forEach((l, i) => T(l, 240, 50 + i * 12, 9, '#fff4ea'));
          if (g.phase === 'q') { const picked = new Set(acts.filter(a => a.kind === 'ox' && a.k === g.round).map(a => a.gid)); alive.forEach(gid => overHead(gid, picked.has(gid) ? '✔' : '…', picked.has(gid) ? '#7ee08a' : '#b9a59c', 6)); }
          else { const y = 50 + ls.length * 12 + 18; T(`정답 ${g.ans === 0 ? 'O' : 'X'}`, 240, y, 16 * Math.min(1, .5 + e / 400), g.ans === 0 ? '#7ee08a' : '#ff6a5a');
            if (g.why) T(g.why, 240, y + 15, 5.6, '#e0d0c6');
            Object.entries(g.picks || {}).forEach(([gid, v]) => overHead(gid, v === 0 ? 'O' : 'X', v === g.ans ? '#7ee08a' : '#ff6a5a', 9)); } }
        else if (g.phase === 'result') { const w = g.winners || [];
          once('oxw' + g.n, () => { if (w.length) { sfxFanfare(); shake(350, 5); w.forEach(x => { const p = find(x.gid); if (p) burst(p.x, headY(p) - 12, 30, CONF, 1.2); }); } });
          banner(ctx, s, t, w.length ? `🏆 최후의 생존자 ${w.map(x => x.nick).join(', ')}님!` : 'OX 서바이벌 끝!', w.length && g.reward ? `상품: ${g.reward}` : '', '#ffd36a');
          w.forEach(x => { const p = find(x.gid); if (p) { const j = Math.abs(Math.sin(t / 200)) * 2; T('🏆', p.x, headY(p) - 12 - j, 9, '#ffd36a', 'center', false); } }); }
      }
    }
    // 오늘의 질문 (스크린 위쪽 띠)
    function qBanner(ctx, s, t, q) {
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const txt = 'Q. ' + q; let fs = 11; ctx.font = `${fs * s}px "Do Hyeon", sans-serif`;
      while (fs > 7 && ctx.measureText(txt).width > 300 * s) { fs -= 0.5; ctx.font = `${fs * s}px "Do Hyeon", sans-serif`; }   // 긴 질문은 글자를 줄여 한 줄에
      const tw = ctx.measureText(txt).width;
      ctx.font = `${5.6 * s}px "Do Hyeon", sans-serif`; const sub = '휴대폰에서 한 줄로 답해주세요', sw = ctx.measureText(sub).width;
      const w = Math.max(tw, sw) + 26 * s, h = 30 * s, x = 240 * s - w / 2, y = 3 * s, glow = 0.6 + Math.sin(t / 600) * 0.25;
      ctx.fillStyle = 'rgba(14,9,10,.88)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 6 * s); ctx.fill();
      ctx.strokeStyle = `rgba(255,178,122,${glow})`; ctx.lineWidth = 1.4 * s; ctx.stroke();
      ctx.fillStyle = '#ffe2c4'; ctx.font = `${fs * s}px "Do Hyeon", sans-serif`; ctx.fillText(txt, 240 * s, y + 11.5 * s);
      ctx.fillStyle = '#d2bfb4'; ctx.font = `${5.6 * s}px "Do Hyeon", sans-serif`; ctx.fillText(sub, 240 * s, y + 23 * s);
      ctx.restore();
    }
    // 익명 건배: 받은 손님 머리 위로 잔 두 개가 '짠' (5초)
    const cheerSfx = new Set();
    // 하트를 받으면 머리 위로 하트가 떠오름 (개수가 늘어난 순간만, 보낸 사람은 표시 안 함)
    const heartSeen = new Map(), heartFloats = [], heartShown = new Map();
    function heartFx(ctx, s, t, placed, headY) {
      const now = Date.now();
      placed.forEach(p => { const id = p.g.id; if (!id) return; const n = p.g.noheart ? 0 : (p.g.hearts | 0);
        if (heartSeen.has(id) && n > heartSeen.get(id)) for (let k = heartSeen.get(id); k < n; k++) heartFloats.push({ to: id, ms: now + 40000 + Math.random() * 80000 });
        else if (!heartSeen.has(id) || n < heartSeen.get(id)) heartShown.set(id, n);
        heartSeen.set(id, n); });
      for (let i = heartFloats.length - 1; i >= 0; i--) { const h = heartFloats[i], e = now - h.ms; if (e < 0) continue; if (!h.on) { h.on = 1; heartShown.set(h.to, (heartShown.get(h.to) || 0) + 1); setTimeout(sfxHeart, 200); } if (e > 3600) { heartFloats.splice(i, 1); continue; }
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
  // App Check: 우리 사이트에서 온 요청만 받도록 (Fraud Defense = reCAPTCHA Enterprise 사이트 키 · 공개용 값)
  const APPCHECK_SITE_KEY = '6LdEMf4tAAAAAJ5Lnj8ZboMJtRatnzw51W_-CRkc';
  if (LIVE) { if (!firebase.apps.length) firebase.initializeApp(cfg); try { if (APPCHECK_SITE_KEY && firebase.appCheck && location.protocol === 'https:' && !/^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname)) firebase.appCheck().activate(new firebase.appCheck.ReCaptchaEnterpriseProvider(APPCHECK_SITE_KEY), true); } catch (e) {} fs = firebase.firestore(); auth = firebase.auth ? firebase.auth() : null; }
  // 손님 휴대폰 익명 로그인: 내 캐릭터의 메시지만 고칠 수 있게 하는 열쇠 (실패해도 등록은 됨)
  let authReady = null;
  const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => { const e = new Error('timeout'); e.code = 'timeout'; e.what = what; rej(e); }, ms))]);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function guestUid() {   // 익명 로그인: 인터넷이 느리면 8초씩 기다리며 3번까지 다시 시도
    if (!auth) return Promise.resolve(null);
    if (!authReady) authReady = (async () => {
      const u0 = await withTimeout(new Promise(res => { const off = auth.onAuthStateChanged(u => { off(); res(u); }); }), 6000, 'auth').catch(() => auth.currentUser);
      if (u0) return u0.uid;
      for (let i = 0; i < 3; i++) { try { const c = await withTimeout(auth.signInAnonymously(), 8000, 'auth'); if (c && c.user) return c.user.uid; } catch (e) {} if (auth.currentUser) return auth.currentUser.uid; await sleep(1000 + i * 2000); }
      return null; })().then(uid => { if (!uid) authReady = null; return uid; });
    return authReady;
  }
  const netErr = e => !!(e && (e.code === 'timeout' || e.code === 'unavailable' || e.code === 'deadline-exceeded' || e.message === 'auth' || (typeof navigator !== 'undefined' && navigator.onLine === false)));
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
      DRINKS.some(d => d.k === g.drink) && isHex(g.hair) && isHex(g.skin) && isHex(g.shirt) && isHex(g.pants) && STYLE_RE.test(g.style) && (g.ex === undefined || EX_RE.test(g.ex)) && (g.cos === undefined || typeof g.cos === 'boolean' || (Number.isInteger(g.cos) && g.cos >= 1 && g.cos <= 99)) &&
      (g.v === undefined || (Number.isInteger(g.v) && g.v >= 1 && g.v <= 999)) && (g.talk === undefined || [0, 1, 2].includes(g.talk)) && (g.bd === undefined || typeof g.bd === 'boolean') && (g.nolast === undefined || typeof g.nolast === 'boolean') && (g.noheart === undefined || typeof g.noheart === 'boolean') && (g.hearts === undefined || (Number.isInteger(g.hearts) && g.hearts >= 0)) && (g.npc === undefined || typeof g.npc === 'boolean') && (g.left === undefined || typeof g.left === 'boolean');
  }
  async function addGuest(g) {
    const doc = { nick: g.nick, msg: g.msg, drink: g.drink, hair: g.hair, skin: g.skin, shirt: g.shirt, pants: g.pants, style: g.style };
    if (EX_RE.test(g.ex || '') && g.ex !== '00000') doc.ex = g.ex;
    if (Number.isInteger(g.v)) doc.v = Math.max(1, Math.min(999, g.v));
    if ([1, 2].includes(g.talk)) doc.talk = g.talk;
    if (g.bd === true) doc.bd = true;
    if (!valid(doc)) throw new Error('invalid');
    const day = bizDate();
    if (LIVE) {
      const uid = await guestUid(); if (!uid) { const e = new Error('auth'); e.code = 'timeout'; throw e; }
      const col = fs.collection('days').doc(day).collection('guests'), key = 'notsun-pending-guest';
      let pend = null; try { pend = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
      if (pend && pend.day === day && pend.uid === uid && Date.now() - pend.at < 10 * 60000) {   // 전에 보내다 끊긴 등록이 실제로는 됐는지 먼저 확인
        const snap = await withTimeout(col.doc(pend.id).get(), 8000, 'get').catch(() => null);
        if (snap && snap.exists && snap.data().uid === uid) { try { localStorage.removeItem(key); } catch (e) {} return { day, id: pend.id, editable: true }; } }
      const ref = pend && pend.day === day && pend.uid === uid && Date.now() - pend.at < 10 * 60000 ? col.doc(pend.id) : col.doc();
      try { localStorage.setItem(key, JSON.stringify({ day, uid, id: ref.id, at: Date.now() })); } catch (e) {}
      await withTimeout(ref.set({ ...doc, uid, ts: firebase.firestore.FieldValue.serverTimestamp() }), 12000, 'add');
      try { localStorage.removeItem(key); } catch (e) {}
      return { day, id: ref.id, editable: true };
    }
    const id = 'd' + Date.now(), list = lsGet(DEMO_KEY(day), []); list.push({ ...doc, uid: demoUid(), ms: Date.now(), ms0: Date.now(), id }); lsSet(DEMO_KEY(day), list); ping();
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
  function relisten(start) { let off = () => {}, dead = false, tries = 0;
    const go = () => { if (dead) return; try { off = start(() => { try { off(); } catch (e) {} if (!dead) setTimeout(go, [5000, 30000, 120000][Math.min(tries++, 2)]); }, () => { tries = 0; }); } catch (e) { setTimeout(go, 30000); } };
    go(); return () => { dead = true; try { off(); } catch (e) {} }; }
  // 안전한 새로고침: 사이트가 정상으로 열릴 때만 (인터넷이 불안할 때 브라우저 오류 화면에 멈추지 않게)
  async function safeReload(page) { try { const r = await fetch((page || location.pathname.split('/').pop() || 'index.html') + '?ping=' + Date.now(), { cache: 'no-store' }); const t = r.ok ? await r.text() : ''; if (r.ok && /common\.js/.test(t)) { location.reload(); return true; } } catch (e) {} return false; }
  function watchGuests(day, cb, all) {
    const keep = l => all ? l : l.filter(g => valid(g) && clean(g.nick) && clean(g.msg));
    if (LIVE) {
      return relisten((err, ok) => fs.collection('days').doc(day).collection('guests').orderBy('ts').limit(300).onSnapshot(snap => { ok();
        cb(keep(snap.docs.map(d => { const g = d.data(); return { ...g, id: d.id, ms: g.mts ? g.mts.toMillis() : g.ts ? g.ts.toMillis() : Date.now() }; })));
      }, () => { cb(null); err(); }));
    }
    const read = () => cb(keep(lsGet(DEMO_KEY(day), []))); read(); listeners.push(read);
    return () => { const i = listeners.indexOf(read); if (i >= 0) listeners.splice(i, 1); };
  }
  // 사장 설정/실시간 메시지
  function normOwners(arr) {
    return DEFAULT_OWNERS.map((d, i) => { const o = (arr || [])[i] || {};
      return { nick: typeof o.nick === 'string' && o.nick.trim() ? o.nick.slice(0, 8) : d.nick,
        hair: isHex(o.hair) ? o.hair : d.hair, skin: isHex(o.skin) ? o.skin : d.skin, shirt: isHex(o.shirt) ? o.shirt : d.shirt, pants: isHex(o.pants) ? o.pants : d.pants,
        style: STYLE_RE.test(o.style) ? o.style : d.style, cos: o.cos === 'none' || OWNER_COS_SET.has(o.cos) ? o.cos : '', lines: Array.isArray(o.lines) ? o.lines.filter(l => typeof l === 'string').map(l => l.slice(0, 24)).slice(0, 5) : d.lines }; });
  }
  // 고양이 방문 · 쓰다듬기: 스크린(사장 로그인)이 방문을 정하고, 그 손님 폰에 쓰다듬기 버튼이 떠요
  let catLastGid = '';
  async function setCatVisit(v) { const gid = v && v.gid ? String(v.gid).slice(0, 40) : catLastGid; if (!gid) return; catLastGid = v && v.gid ? gid : '';
    const d = v && v.gid ? { gid, cat: v.cat ? 1 : 0, name: String(v.name || '').slice(0, 8), until: Math.floor(+v.until || 0), ms: Date.now() } : { gid, cat: 0, name: '', until: 0, ms: Date.now() };
    if (LIVE) { await fs.collection('catvisits').doc(gid).set({ ...d, ts: firebase.firestore.FieldValue.serverTimestamp() }); return; } lsSet('notsun-catvisit', d); ping(); }
  function watchCatVisit(gid, cb) {   // 내 자리(gid)에 온 고양이만 · lu = 이 기기 시계 기준 끝나는 시각
    const loc = v => { if (!(v && v.gid === gid && v.until)) return null; const dur = Math.max(0, Math.min(60000, (v.until - v.ms) || 0)), age = v.ts && v.ts.toMillis ? Math.max(0, Date.now() - v.ts.toMillis()) : 0; return age > dur + 15000 ? null : { ...v, lu: Date.now() + Math.max(0, dur - age) }; };
    if (LIVE) return relisten((err, ok) => fs.collection('catvisits').doc(String(gid)).onSnapshot(d => { ok(); cb(loc(d.exists ? d.data() : null)); }, err));
    let key = ''; const read = () => { const v = lsGet('notsun-catvisit', null), k = v ? v.gid + '|' + v.ms : ''; if (k === key) return; key = k; cb(loc(v)); }; read(); listeners.push(read); return () => { const i = listeners.indexOf(read); if (i >= 0) listeners.splice(i, 1); }; }
  async function petCat(gid, cat) {
    const day = bizDate();
    if (LIVE) { const uid = await guestUid(); if (!uid) return; const ref = fs.collection('catpets').doc(uid); const cur = await ref.get().catch(() => null);
      const n = cur && cur.exists && cur.data().day === day ? (cur.data().n | 0) + 1 : 1;
      await ref.set({ gid: String(gid), cat: cat ? 1 : 0, day, n, ts: firebase.firestore.FieldValue.serverTimestamp() }); return n; }
    const l = lsGet('notsun-catpets', []); l.push({ gid, cat: cat ? 1 : 0, day, ms: Date.now() }); lsSet('notsun-catpets', l.slice(-30)); ping(); setTimeout(() => listeners.forEach(f => f()), 0); return l.length; }
  function watchCatPets(day, cb) {   // 새 쓰다듬기만 알려줌
    if (LIVE) return relisten((err, ok) => { let first = true; return fs.collection('catpets').where('day', '==', day).onSnapshot(sn => { ok(); if (first) { first = false; return; } sn.docChanges().forEach(ch => { if (ch.type !== 'removed') { const v = ch.doc.data(); cb({ gid: v.gid, cat: v.cat | 0, ms: Date.now() }); } }); }, err); });
    let seenN = lsGet('notsun-catpets', []).length; const read = () => { const l = lsGet('notsun-catpets', []); if (l.length > seenN) l.slice(seenN - l.length).forEach(v => cb({ gid: v.gid, cat: v.cat | 0, ms: Date.now() })); seenN = l.length; }; listeners.push(read); return () => {}; }
  function watchOwner(cb) {
    let state = { owners: normOwners(null), live: null, theme: 'auto', seats: {}, lucky: null, best: null, vip: [] };
    if (LIVE) {
      const u1 = relisten((err, ok) => fs.collection('owner').doc('settings').onSnapshot(d => { ok(); const v = d.exists ? d.data() : {}; state = { ...state, owners: normOwners(v.owners || null), theme: v.theme || 'auto', seats: cleanSeats(v.seats), ...cleanEvents(v) }; cb(state); }, err));
      const u2 = relisten((err, ok) => fs.collection('owner').doc('live').onSnapshot(d => { ok(); const v = d.exists ? d.data() : null; state = { ...state, live: v && v.ts ? { msg: String(v.msg || '').slice(0, 30), who: v.who, ms: v.ts.toMillis() } : null }; cb(state); }, err));
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
  const luckySeen = {}; let evBooted = false;
  const SHOP_WIFI = { s: 'KT_GiGA_B945', p: '3bbbaxe067' };  // 손님용 와이파이 기본값 (사장 리모컨에서 바꿀 수 있음 · 이름은 대소문자 구분)
  const wifiQrText = w => `WIFI:T:WPA;S:${String(w.s).replace(/([\\;,:"])/g, '\\$1')};P:${String(w.p).replace(/([\\;,:"])/g, '\\$1')};;`;
  function cleanEvents(v) {
    // 페이지를 연 뒤 '처음 받은' 데이터에 이미 있던 이벤트는 지난 것: 다시 틀지 않음 (네트워크가 느려 5초 넘게 걸려도)
    const boot = !evBooted; if (v) evBooted = true;
    const today = bizDate(), out = { lucky: null, best: null, vip: [], order: null, served: null, gend: null, rqdone: {}, auto: { on: true, req: true, next: '', slot: 0 }, ntfy: '', bday: null, bdays: [], q: '', game: null, npcs: [], wifi: { ...SHOP_WIFI } };
    const wf = v && v.wifi; if (wf && typeof wf.s === 'string') out.wifi = { s: wf.s.slice(0, 32), p: typeof wf.p === 'string' ? wf.p.slice(0, 63) : '' };
    const lk = v && v.lucky;
    if (lk && lk.day === today && typeof lk.id === 'string') {
      // 기기마다 시계가 달라도 애니메이션이 처음부터 보이도록: 이 화면이 '처음 받은 순간'을 시작 시간으로 씀
      const server = lk.at && lk.at.toMillis ? lk.at.toMillis() : (lk.ms || 0), key = lk.id + '|' + (server || 'pending');
      // 페이지를 막 연 순간 이미 있던 지난 뽑기는 다시 틀지 않음. 그 뒤로 새로 들어온 뽑기는 기기 시계와 상관없이 항상 처음부터 재생
      if (!(key in luckySeen)) luckySeen[key] = ((boot && server && Math.abs(Date.now() - server) > 20000) || (server && Math.abs(Date.now() - server) > 600000)) ? 0 : Date.now();
      if (!server) luckySeen[key] = luckySeen[key] || Date.now();
      out.lucky = { id: lk.id, nick: String(lk.nick || '').slice(0, 8), ms: luckySeen[key], serverMs: server, reward: typeof lk.reward === 'string' ? lk.reward.slice(0, 20) : '' };
    }
    const bs = v && v.best; if (bs && bs.day === today && typeof bs.id === 'string') out.best = bs.id;
    if (v && typeof v.ntfy === 'string') { ntfyTopic = v.ntfy; out.ntfy = v.ntfy; }
    const bdv = v && v.bday;
    if (bdv && bdv.day === today && bdv.n && typeof bdv.id === 'string') { const key = 'b|' + bdv.n; if (!(key in luckySeen)) luckySeen[key] = boot ? 0 : Date.now(); out.bday = { id: bdv.id, nick: String(bdv.nick || '').slice(0, 8), ms: luckySeen[key] }; }
    const bdl = v && v.bdays; if (bdl && bdl.day === today && Array.isArray(bdl.ids)) out.bdays = bdl.ids.filter(x => typeof x === 'string').slice(0, 40);
    const od = v && v.order;
    if (od && od.day === today && od.n) { const key = 'o|' + od.n; if (!(key in luckySeen)) luckySeen[key] = boot ? 0 : Date.now(); out.order = { gid: od.gid || '', nick: String(od.nick || '').slice(0, 8), icon: od.icon || 'cocktail', dr: typeof od.dr === 'string' ? od.dr.slice(0, 30) : '', ms: luckySeen[key] }; }
    const au = v && v.auto; if (au && typeof au === 'object') out.auto = { on: au.on !== false, req: au.req !== false, next: AUTO_ORDER.includes(au.next) ? au.next : '', slot: +au.slot || 0 };
    const rd = v && v.rqdone; if (rd && rd.day === today && rd.m && typeof rd.m === 'object') AUTO_ORDER.forEach(k => { if (+rd.m[k]) out.rqdone[k] = +rd.m[k]; });
    const ge = v && v.gend; if (ge && ge.day === today && ge.k && typeof ge.msg === 'string') { const key = 'e|' + ge.k; if (!(key in luckySeen)) luckySeen[key] = boot ? 0 : Date.now(); out.gend = { n: +ge.n || 0, msg: ge.msg.slice(0, 80), ms: luckySeen[key] }; }
    const sv = v && v.served;
    if (sv && sv.day === today && sv.n) { const key = 's|' + sv.n; if (!(key in luckySeen)) luckySeen[key] = boot ? 0 : Date.now(); out.served = { gid: typeof sv.gid === 'string' ? sv.gid : '', dr: typeof sv.dr === 'string' ? sv.dr.slice(0, 30) : '', ms: luckySeen[key] }; }
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
      await fs.collection('owner').doc('settings').set({ npcs: null, lucky: null, best: null, vip: null, bday: null, bdays: null, order: null, served: null, gend: null, q: null, game: null, seats: {} }, { mergeFields: ['npcs', 'lucky', 'best', 'vip', 'bday', 'bdays', 'order', 'served', 'gend', 'q', 'game', 'seats'] });
      return n;
    }
    n.guests = lsGet(DEMO_KEY(day), []).length; lsSet(DEMO_KEY(day), []);
    const od = lsGet('notsun-orders', {}); Object.keys(od).forEach(k => { if (od[k].day === day) { delete od[k]; n.orders++; } }); lsSet('notsun-orders', od);
    const ga = lsGet('notsun-gameacts', []); n.games = ga.filter(a => a.day === day).length; lsSet('notsun-gameacts', ga.filter(a => a.day !== day));
    const ev = lsGet('notsun-owner-events', {}); ['npcs', 'lucky', 'best', 'vip', 'bday', 'bdays', 'order', 'served', 'gend', 'q', 'game'].forEach(k => delete ev[k]); lsSet('notsun-owner-live', null); lsSet('notsun-catvisit', null); lsSet('notsun-owner-events', ev); lsSet('notsun-owner-seats', {});
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
  function couponState(c) { const today = bizDate(); if (!c) return 'none'; if (c.status === 'used') return 'used'; if (c.expDay && today > c.expDay) return 'expired'; if (c.kind === 'legend' || c.kind === 'secret') return 'ready'; return c.issuedDay === today ? 'today' : 'ready'; }
  // 레전드 뽑기 보상: 당일만 쓰는 칵테일 1잔 쿠폰 (손님 휴대폰이 직접 발급 · 하루 1장 · 직원이 레전드 카드를 확인하고 사용 처리)
  async function issueLegendCoupon(nick, secret) { const uid = await myUid(); if (!uid) throw new Error('auth'); const day = bizDate(), code = `${secret ? 'S' : 'L'}-${day}-${uid}`;   // 레전드=칵테일 1잔 · 시크릿=서비스 안주
    const doc = { uid, nick: String(nick || '').slice(0, 8), reward: secret ? '서비스 안주 1개' : '칵테일 1잔 무료', status: 'issued', issuedDay: day, expDay: day, kind: secret ? 'secret' : 'legend' };
    if (LIVE) { const ref = fs.collection('coupons').doc(code); try { const d = await ref.get(); if (d.exists) return code; } catch (e) {} await ref.set({ ...doc, issuedAt: firebase.firestore.FieldValue.serverTimestamp() }); return code; }
    const all = lsGet('notsun-coupons', {}); if (!all[code]) { all[code] = { ...doc, ms: Date.now() }; lsSet('notsun-coupons', all); ping(); } return code; }
  function normCoupon(id, v) { return { show: /^L-/.test(id) ? 'LG-' + id.slice(-4).toUpperCase() : /^S-/.test(id) ? 'SC-' + id.slice(-4).toUpperCase() : id, kind: ['legend', 'secret'].includes(v.kind) ? v.kind : '', code: id, uid: v.uid || '', nick: String(v.nick || ''), reward: String(v.reward || '무료 쿠폰'), status: v.status === 'used' ? 'used' : 'issued', issuedDay: v.issuedDay || '', expDay: v.expDay || '', usedDay: v.usedDay || '', ms: v.issuedAt && v.issuedAt.toMillis ? v.issuedAt.toMillis() : (v.ms || 0) }; }
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
  // 매시 정각 자동 게임: 스크린이 진행 · 사장님이 리모컨에서 다음 게임을 고를 수 있음 (안 고르면 순서대로)
  const AUTO_ORDER = ['race', 'bal', 'rou', 'ox', 'rps', 'bomb', 'nun', 'ten'];   // 다 같이 건배는 뺌 (2026-10-26)
  const AUTO_LABEL = { race: '🏇 픽셀 경마', bal: '⚖️ 밸런스 게임', rou: '🎡 행운의 룰렛', ox: '⭕ OX 서바이벌', toast: '🥂 다 같이 건배', rps: '✊ 사장님과 가위바위보', bomb: '💣 폭탄 돌리기', nun: '🙊 눈치게임', ten: '⏱ 10초 맞추기' };
  const HOUR = 3600000;
  function autoInfo(auto, now) {
    if (auto && auto.on === false) return null; now = now || Date.now();
    const at = Math.floor(now / HOUR) * HOUR + HOUR, hr = new Date(at + 9 * HOUR).getUTCHours();
    if (LIVE && !shopOpen(at, true).open) return null;   // 영업시간(마감 정각 제외)에만 정각 게임·사장님 알림
    const chosen = auto && auto.slot === at && AUTO_ORDER.includes(auto.next);
    const type = chosen ? auto.next : AUTO_ORDER[hr % AUTO_ORDER.length];
    return { at, hr, type, label: AUTO_LABEL[type], chosen: !!chosen, left: at - now }; }
  // 밸런스 게임: 한 판에 3문제 (문제마다 20초 고르기 → 6초 결과)
  const BAL_N = 3, BAL_SEC = 20;
  function balSet(first){ const pool = BAL_QS.filter(q => !first || q[0] !== first[0]), out = first ? [first] : []; const a = pool.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } while (out.length < BAL_N && a.length) out.push(a.pop()); return out.map(q => [String(q[0]).slice(0, 16), String(q[1]).slice(0, 16)]); }
  function autoSpec(type) {
    const sh = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const q = BAL_QS[Math.floor(Math.random() * BAL_QS.length)];
    return ({
      race: [{ phase: 'pick', dur: 20 }, n => ({ pickUntil: n + 20000 }), '🏇 경마 우승마 고르는 중 (20초)…'],
      bal: (() => { const qs = balSet(); return [{ phase: 'play', a: qs[0][0], b: qs[0][1], qs, round: 1, total: qs.length, dur: BAL_SEC }, n => ({ endAt: n + BAL_SEC * 1000 }), `⚖️ 밸런스 게임 ${qs.length}문제 진행 중…`]; })(),
      rou: [{ phase: 'join', dur: 20 }, n => ({ joinUntil: n + 20000 }), '🎡 룰렛 참여자 모집 (20초)…'],
      ox: [{ phase: 'join', dur: 20 }, n => ({ joinUntil: n + 20000, qs: sh(OX_QS).slice(0, 5) }), '⭕ OX 서바이벌 참여자 모집 (20초)…'],
      toast: [{ phase: 'count' }, n => ({ endAt: n + 13000 }), '🥂 건배 타임!'],
      rps: [{ phase: 'join', dur: 20 }, n => ({ joinUntil: n + 20000 }), '✊ 가위바위보 참여자 모집 (20초)…'],
      bomb: [{ phase: 'join', mission: '', dur: 20 }, n => ({ joinUntil: n + 20000 }), '💣 참여자 모집 중 (20초)…'],
      nun: [{ phase: 'join', dur: 20 }, n => ({ joinUntil: n + 20000 }), '🙊 눈치게임 참여자 모집 (20초)…'],
      ten: [{ phase: 'play' }, n => ({ endAt: n + 60000 }), '⏱ 10초 맞추기 진행 중 (60초)…'] })[type]; }
  const saveAuto = v => saveEvent('auto', { on: v.on !== false, req: v.req !== false, next: AUTO_ORDER.includes(v.next) ? v.next : '', slot: +v.slot || 0 });
  // 손님 게임 신청: games 컬렉션(n=0, kind='req', v=게임 번호) · 20분 안에 다른 손님 3명이 모이면 스크린이 자동 시작
  const REQ_NEED = 3, REQ_WINDOW = 20 * 60000;
  const actMs = a => a.ms || (a.ts && a.ts.toMillis ? a.ts.toMillis() : Date.now());
  function reqTally(acts, done) {   // → [{ type, label, n, gids:Set, first }] 표가 많은 순
    const now = Date.now(), by = {};
    (acts || []).forEach(a => { if (a.kind !== 'req' || !a.gid) return; const type = AUTO_ORDER[a.v | 0]; if (!type) return; const ms = actMs(a);
      if (now - ms > REQ_WINDOW || ms <= ((done || {})[type] || 0)) return; const t = by[type] = by[type] || { type, label: AUTO_LABEL[type], gids: new Set(), first: a.nick, at: ms, last: ms };
      if (ms < t.at) { t.at = ms; t.first = a.nick; } if (ms > t.last) t.last = ms; t.gids.add(a.gid); });
    return Object.values(by).map(t => ({ ...t, n: t.gids.size })).sort((a, b) => b.n - a.n || a.at - b.at); }
  const requestGame = (gid, nick, type) => gameAct(0, 'req', { gid, nick, v: AUTO_ORDER.indexOf(type) });
  const markReqDone = (type, cur, upto) => saveEvent('rqdone', { day: bizDate(), m: { ...(cur || {}), [type]: Math.max(+upto || 0, (cur || {})[type] || 0) || Date.now() } });   // 그때까지 들어온 신청(가장 늦은 시각)까지 정리 → 기기 시계가 달라도 안전
  async function notifyOwner(title, message) { if (!ntfyTopic) return; try { await fetch('https://ntfy.sh/', { method: 'POST', body: JSON.stringify({ topic: ntfyTopic, title, message, priority: 4, tags: ['alarm_clock'] }) }); } catch (e) {} }
  // c = 기수 옷 색(휴대폰 버튼 색), coat/sh/mane = 말 털색, sock = 흰 양말
  const RACE_HORSES = [
    { n: '당근이', c: '#ff8a2a', coat: '#c8743a', sh: '#94501f', mane: '#6a2e12', sock: 0, ln: ['당근 주면 뛴다 🥕', '오늘 컨디션 최상!', '1등 하면 당근 두 개'], win: '당근 파티다 🥕' },
    { n: '말랑이', c: '#ff7ab0', coat: '#f0cf8a', sh: '#c8a05a', mane: '#fff6e0', sock: 0, ln: ['말랑말랑 달려볼게', '응원하면 힘나요 💗', '살살 뛰어도 1등?'], win: '말랑하게 이겼지롱' },
    { n: '구름이', c: '#4ab0ff', coat: '#f2f4f8', sh: '#b8c2d0', mane: '#c6cfdc', sock: 0, ln: ['구름처럼 날아갈게 ☁️', '바람이 좋다~', '하얀 번개 간다'], win: '구름 위를 달렸어 ☁️' },
    { n: '초코볼', c: '#b07aff', coat: '#6e4228', sh: '#48281a', mane: '#24140c', sock: 1, ln: ['달달하게 이겨줄게 🍫', '막판에 강해요', '초코는 진리'], win: '달콤한 승리 🍫' },
    { n: '히힝이', c: '#5ad87a', coat: '#3a343c', sh: '#221e26', mane: '#121014', sock: 1, ln: ['히히힝~!', '나 진짜 빨라', '어제 푹 잤음 😎'], win: '히히히힝! 내가 1등!' }];
  // 픽셀 말 (26x20, 오른쪽을 봄) · 4프레임 갤럽 · 기수 포함
  const HORSE_TOP = [
    '...................oo.oo..',
    '...................ocmco..',
    '.........kkk.....mcccccco.',
    '........kkkkK...mmcWccccco',
    '........kGff...mmccEEcccco',
    '.......SSSf...mmcccEecccco',
    '......SSSSSsf.mmccccrcccNo',
    '.....SSSSSs..mmcccccooooo.',
    '......sPPP..mmcccccco.....',
    '..ttt.ooPbbmmccccccco.....',
    '.ttttttnnnnbcccccccco.....',
    'tttt..onnnnccccccccco.....',
    'ttt...oBBBBccccccccco.....',
    'tt...odccccccccccccdo.....',
    't....oddcccccccccddo......',
    '......oddddddddddddo......'];
  const HORSE_LEGS = [
    ['......dd..........cc......', '.....dd............cc.....', '....ww..............ww....', '...hh................hh...'],
    ['......dd...dd...cc..cc....', '......dd....dd..cc...cc...', '.......ww...ww...ww..ww...', '.......hh...hh...hh..hh...'],
    ['.......dd.dd.....cc.cc....', '........dddd......cccc....', '.........ww.......ww.ww...', '.........hh.......hh.hh...'],
    ['.......dd.dd....cc.cc.....', '......dd...dd..cc...cc....', '.....ww.....ww.ww...ww....', '.....hh.....hhhh....hh....']];
  // 경마 진행도: 1착은 중반에 뒤처졌다가 막판 역전, 하위권 한 마리는 초반 선두 후 지침, 절반은 1·2착이 코 차이(사진판정)
  const RACE_T0 = 2.2;
  function raceInfo(g) { const order = g.order || [0, 1, 2, 3, 4], sd = g.seed || 7, photo = sd % 2 === 0;
    const F = order.map((_, r) => 8 + (r === 1 && photo ? .07 : r * .38 + (r > 1 && photo ? .1 : 0)));
    return { order, sd, photo, F, fake: order[3 + (sd % 2)], end: F[4] }; }
  function raceProg(g, i, tt, info) {
    if (tt <= 0) return 0; const I = info || raceInfo(g), r = I.order.indexOf(i), u = Math.min(1, tt / I.F[r]); if (u >= 1) return 1;
    const bump = Math.sin(Math.PI * u), A = r === 0 ? -.11 : i === I.fake ? .15 : ((I.sd * (i + 3)) % 7 - 3) * .015, wob = .018 * Math.sin(tt * (2.2 + ((I.sd + i) % 4) * .4) + i * 1.7) * bump;
    return Math.max(0, Math.min(.999, u + A * bump + wob)); }
  // 오늘 우승 기록 (스크린 기기에 저장)
  function raceWins(day) { try { const v = JSON.parse(localStorage.getItem('notsun-racewins') || 'null'); return v && v.day === day ? v : { day, w: [0, 0, 0, 0, 0], seen: {} }; } catch (e) { return { day, w: [0, 0, 0, 0, 0], seen: {} }; } }
  function raceWinAdd(day, n, w) { const v = raceWins(day); if (v.seen[n]) return v; v.seen[n] = 1; v.w[w] = (v.w[w] || 0) + 1; try { localStorage.setItem('notsun-racewins', JSON.stringify(v)); } catch (e) {} return v; }
  const horseCache = {};
  function horseSprite(i, f) {
    const key = i + '|' + f; if (horseCache[key]) return horseCache[key];
    const h = RACE_HORSES[i], c = document.createElement('canvas'); c.width = 26; c.height = 20; const x = c.getContext('2d');
    const pal = { o: '#1a0f10', c: h.coat, d: h.sh, m: h.mane, t: h.mane, E: '#140c0c', e: '#ffffff', W: shade(h.coat, 1.15), r: '#ff9aa8', N: '#3a2020', n: '#fff6ec', B: shade(h.c, .8),
      h: '#2a2024', w: h.sock ? '#ffffff' : h.coat, k: h.c, K: shade(h.c, .6), G: '#2a2030', f: '#ffd2b0', S: h.c, s: shade(h.c, .72), P: '#f4f0e8', b: '#1a1214' };
    HORSE_TOP.concat(HORSE_LEGS[f]).forEach((r, j) => [...r].forEach((ch, k) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(k, j, 1, 1); } }));
    return (horseCache[key] = c);
  }
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
      W_('몽키숄더', '40%', 10000, 170000, 'BLENDED & CASUAL'), W_('조니워커 블랙', '40%', 10000, 140000, 'BLENDED & CASUAL'), W_('제임슨', '40%', 9000, 120000, 'BLENDED & CASUAL'),
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
  async function placeOrder({ gid, nick, items, note, show, kind, rid }) {
    const uid = await myUid(); if (!uid) { const e = new Error('auth'); e.code = 'timeout'; throw e; }
    const clean = items.slice(0, 20).map(it => ({ name: String(it.name).slice(0, 30), qty: Math.max(1, Math.min(20, it.qty | 0)), price: Math.max(0, it.price | 0), icon: it.icon || 'cocktail' }));
    const total = clean.reduce((a, it) => a + it.qty * it.price, 0);
    const doc = { day: bizDate(), uid, gid: String(gid || ''), nick: String(nick || '').slice(0, 8), items: clean, note: String(note || '').slice(0, 60), total, status: 'new', show: show !== false };
    if (kind === 'call') { doc.kind = 'call'; doc.show = false; }
    let id;
    if (LIVE) { const ref = rid ? fs.collection('orders').doc(rid) : fs.collection('orders').doc(); id = ref.id;
      if (rid) { const snap = await withTimeout(ref.get(), 8000, 'get').catch(() => null); if (snap && snap.exists) return id; }   // 전에 보낸 게 이미 들어갔으면 다시 안 보냄
      await withTimeout(ref.set({ ...doc, ts: firebase.firestore.FieldValue.serverTimestamp() }), 12000, 'order'); }
    else { id = 'o' + Date.now(); const all = lsGet('notsun-orders', {}); all[id] = { ...doc, ms: Date.now() }; lsSet('notsun-orders', all); ping(); setTimeout(() => listeners.forEach(f => f()), 0); }
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
  const normItems = l => (Array.isArray(l) ? l : []).slice(0, 20).map(it => ({ name: String((it && it.name) || '').slice(0, 30), qty: Math.max(1, Math.min(20, (it && it.qty) | 0)), price: Math.max(0, (it && it.price) | 0), icon: typeof (it && it.icon) === 'string' ? it.icon.slice(0, 12) : 'cocktail' }));
  const normOrder = (id, v) => ({ id, day: v.day, uid: v.uid, gid: String(v.gid || '').slice(0, 40), nick: String(v.nick || '').slice(0, 8), items: normItems(v.items), note: v.note || '', total: v.total | 0, status: v.status || 'new', show: v.show !== false, kind: v.kind === 'call' ? 'call' : '', re: !!v.re, ms: v.ts && v.ts.toMillis ? v.ts.toMillis() : (v.ms || Date.now()) });
  function watchOrders(cb) { // 사장: 오늘 주문
    const day = bizDate();
    if (LIVE) return relisten((err, ok) => fs.collection('orders').where('day', '==', day).onSnapshot(sn => { ok(); cb(sn.docs.map(d => normOrder(d.id, d.data())).sort((a, b) => b.ms - a.ms)); }, err));
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
  const saveGameEnd = (n, msg) => saveEvent('gend', { day: bizDate(), n: +n || 0, msg: String(msg || '').replace(/\s*·?\s*쿠폰\s+[A-Z0-9-]+(\s*,\s*[A-Z0-9-]+)*/g, '').replace(/\b[A-Z0-9]{6,}\b/g, '').slice(0, 80), k: Math.random().toString(36).slice(2, 8) });
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
    const all = lsGet('notsun-gameacts', []); all.push({ ...doc, id: 'a' + Date.now() + Math.random().toString(36).slice(2, 6), ms: Date.now() }); lsSet('notsun-gameacts', all.slice(-400)); ping(); setTimeout(() => listeners.forEach(f => f()), 0);
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
  // 사장: 계산 완료 → 캐릭터 퇴장 (기록은 남김, 실수하면 다시 앉히기)
  async function updateLook(day, id, lk) {
    const up = { hair: lk.hair, skin: lk.skin, shirt: lk.shirt, pants: lk.pants, style: lk.style, ex: EX_RE.test(lk.ex || '') ? lk.ex : '00000', drink: lk.drink };
    if (!isHex(up.hair) || !isHex(up.skin) || !isHex(up.shirt) || !isHex(up.pants) || !STYLE_RE.test(up.style) || !DRINKS.some(d => d.k === up.drink)) throw new Error('invalid');
    if (LIVE) { await fs.collection('days').doc(day).collection('guests').doc(id).update(up); return; }
    const list = lsGet(DEMO_KEY(day), []), g = list.find(x => x.id === id); if (g) { Object.assign(g, up); lsSet(DEMO_KEY(day), list); ping(); setTimeout(() => listeners.forEach(f => f()), 0); } }
  const cosVal = on => Number.isInteger(on) && on >= 1 && on <= 99 ? on : !!on;
  async function setGuestCos(gid, on) {
    if (!gid) return; const day = bizDate();
    if (LIVE) { await fs.collection('days').doc(day).collection('guests').doc(gid).update({ cos: cosVal(on) }); return; }
    const list = lsGet(DEMO_KEY(day), []), g = list.find(x => x.id === gid); if (g) { g.cos = cosVal(on); lsSet(DEMO_KEY(day), list); ping(); setTimeout(() => listeners.forEach(f => f()), 0); } }
  async function setGuestLeft(gid, left) {
    if (!gid) return; const day = bizDate(), v = !!left;
    if (LIVE) { await fs.collection('days').doc(day).collection('guests').doc(gid).update(v ? { left: true, lts: firebase.firestore.FieldValue.serverTimestamp() } : { left: false }); return; }
    const list = lsGet(DEMO_KEY(day), []), g = list.find(x => x.id === gid); if (g) { g.left = v; if (v) g.lts = Date.now(); lsSet(DEMO_KEY(day), list); ping(); setTimeout(() => listeners.forEach(f => f()), 0); }
  }
  async function setGuestLast(gid, name) {
    if (!gid) return; const day = bizDate(), last = String(name || '').slice(0, 30);
    if (LIVE) { await fs.collection('days').doc(day).collection('guests').doc(gid).update({ last }); return; }
    const list = lsGet(DEMO_KEY(day), []), g = list.find(x => x.id === gid); if (g) { g.last = last; lsSet(DEMO_KEY(day), list); ping(); }
  }
  const announceOrder = (gid, nick, icon, dr) => saveEvent('order', { day: bizDate(), gid: gid || '', nick: String(nick || '').slice(0, 8), icon: icon || 'cocktail', dr: String(dr || '').slice(0, 30), n: Math.random().toString(36).slice(2, 8) });
  const announceServed = (gid, dr) => saveEvent('served', { day: bizDate(), gid: gid || '', dr: String(dr || '').slice(0, 30), n: Math.random().toString(36).slice(2, 8) });
  async function celebrateBirthday(id, nick, current) {
    const ids = [...new Set([...(current || []), id])].slice(0, 40);
    await saveEvent('bdays', { day: bizDate(), ids });
    await saveEvent('bday', { day: bizDate(), id, nick: String(nick || '').slice(0, 8), n: Math.random().toString(36).slice(2, 8) });
  }
  const setNtfy = topic => saveEvent('ntfy', String(topic || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64));
  const renotify = o => notifyPhones({ ...o, nick: `⏰ 아직 접수 전 · ${o.nick || '손님'}` });
  const testNtfy = topic => notifyPhones({ nick: '테스트', items: [{ name: '알림 테스트', qty: 1 }], note: '', total: 0 }, topic);
  // 스토리 공유 안내 (2주 테스트) · 문구·해시태그는 여기 한 곳에서만 바꾸면 손님 화면과 스크린에 같이 바뀜
  const STORY = { tag: '#낯선아바타', offer: '이 카드를 인스타 스토리에 올리고 직원에게 보여주시면 서비스를 드려요 🍸', note: '계정 태그는 안 해도 괜찮아요 · 친한 친구 공개 스토리도 인정돼요', screen: '캐릭터 카드를 스토리에 올리고 직원에게 보여주시면 작은 서비스를 드려요', on: true };
  // 영업시간 (한국 시간): 금·토 19:00~03:00, 그 외 19:00~01:00 · 앞뒤 30분 여유 (새벽 6시 전은 전날 영업으로 봄)
  const SHOP_HOURS_TEXT = '오후 7시 ~ 새벽 1시 (금·토는 새벽 3시까지)';
  function shopOpen(now, strict){ const k = new Date((now || Date.now()) + 9 * 3600e3), h = k.getUTCHours() + k.getUTCMinutes() / 60; let dow = k.getUTCDay(); if (h < 6) dow = (dow + 6) % 7;
    const close = dow === 5 || dow === 6 ? 3 : 1, pad = strict ? 0 : 0.5; return { open: h >= 19 - pad || (h < 6 && h < close + pad), text: SHOP_HOURS_TEXT }; }
  const onScreen = (l, keepLeft) => l.filter(g => valid(g) && clean(g.nick) && clean(g.msg) && (keepLeft || !g.left));   // 계산 완료(퇴장)한 손님은 자리에서 뺌
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

  global.Notsun = { setGuestLeft, resetDay, watchChat, sendChat, closeChat, CHAT_MAX, CHAT_LEN, makeNpcs, setNpcs, NPC_MAX, saveGameHost, loadGameHost, gameTx, saveGameHb, watchGameHb, setWifi, wifiQrText, SHOP_WIFI, GAME_TYPES, RACE_HORSES, horseSprite, raceProg, raceInfo, RACE_T0, BAL_QS, OX_QS, sendHeart, heartsSent, isMutual, HEART_MAX, W, H, OWNER_EMAIL, DRINKS, SEXES, HAIR_STYLES, LOOK_THEMES, FITS, COS_DESC, issueLegendCoupon, BOTTOMS, ACCS, HAIR_X, TOPS, EYES, ACC_X, SHOES, PANTS_COLORS, EX_RE, setGuestCos, HAIR_COLORS, SKIN_COLORS, SHIRT_COLORS, PANTS, DEFAULT_OWNERS,
    shopOpen, STORY, balSet, muteSfx: v => { SFX.mute = !!v; }, BAL_SEC, setCatVisit, watchCatVisit, petCat, safeReload, netErr, newOrderId: () => LIVE ? fs.collection('orders').doc().id : 'o' + Date.now(), watchCatPets, THEMES, resolveTheme, costumeFor, drawCostume, cosSeed, seasonCostume, rollSeason, cosOf, OWNER_COS, ownerCostume, cardAura, AURA_FX, makeCard, saveTheme, bizDate, colorsFromImage, sprite, drawPreview, createScene, addGuest, updateMsg, updatePrefs, sendCheer, watchCheers, setQuestion, removeGuest, watchGuests, SEATS, placeGuests, saveSeats, onScreen, drawLucky, setBest, setVip, issueCoupon, useCoupon, DEFAULT_MENU, MENU_NOTES, watchMenu, saveMenu, placeOrder, watchOrders, watchMyOrders, setOrderStatus, announceOrder, announceServed, drinkColor, setGuestLast, celebrateBirthday, setNtfy, testNtfy, renotify, deleteOrder, markRealert, startGame, saveGameEnd, REQ_NEED, reqTally, requestGame, markReqDone, AUTO_ORDER, AUTO_LABEL, autoInfo, autoSpec, saveAuto, notifyOwner, updateLook, gameAct, watchGameActs, tenRank, watchRecipes, saveRecipe, recipeFor, enableSound, soundOn: () => SFX.on, watchMyCoupons, watchCoupons, couponState, myUid, makeGroupPhoto, tierOf, watchOwner, saveOwners, sayLive, LIVE };
})(window);
