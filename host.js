// 낯선 게임 진행자 (매장 스크린이 우선 · 사장 리모컨은 예비)
// - 리모컨이 게임을 '시작'하면 settings.game(host 비어 있음) + owner/gamehost(진행 정보)를 저장
// - 사장 계정으로 로그인한 스크린이 바로 진행을 맡고, 스크린이 없으면 2.5초 뒤 리모컨이 맡음
// - 진행 중인 기기가 조용하면(화면 꺼짐 등) 다른 기기가 이어받음 (스크린 12초 · 리모컨 16초)
// - 진행 기기의 모든 쓰기는 '내가 아직 진행자일 때만' 저장되는 트랜잭션 → 잠에서 깬 옛 진행자가 덮어쓰지 못함
(function (global) {
  function createGameHost(N, opts) {
    const LIAR_MAX = 8;   // 라이어게임 최대 인원(11월 12일 사장님)
    const bombFuse = () => 15000 + Math.random() * 30000;   // 폭탄: 안 보이는 도화선 15~45초(11월 12일)
    const FACE_SEC = 10, FACE_GRACE   /* 11월 12일 사장님(매장 시험): 5초는 너무 짧음 → 10초 */ = 1500, FACE_MS = FACE_SEC * 1000 + FACE_GRACE;
    const qSec = id => (G && G.type === 'cho' && N.choSec) ? N.choSec(id) : FACE_SEC, qMs = id => qSec(id) * 1000 + FACE_GRACE;   // 초성퀴즈는 10초(명대사 15초)   // 인물퀴즈: 5초 + 인터넷으로 답이 도착하는 여유 1.5초
    const ID = opts.id, IS_SCREEN = /^screen/.test(ID), TAKEOVER = IS_SCREEN ? 9000 : 12000, HB_EVERY = 3000, SLEEP_GAP = 8000, TX_LIMIT = 8000;
    let G = null, gActs = [], gOff = null, H = null, lastText = '', confirmed = false, busy = false, gBusy = false;
    let lastSig = '', lastChange = 0, lastTick = 0, hbAt = 0, errs = 0, lastHs = '', hbSeen = { id: '', at: 0 };
    const seenAt = {};
    const gNow = () => Date.now();
    // 서버 저장이 멈춰도 게임 전체가 멈추지 않게: 8초 넘으면 실패로 처리 (다음 단계에서 다시 시도)
    const limit = (p, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => { const e = new Error('timeout:' + what); e.code = 'timeout'; rej(e); }, TX_LIMIT))]);
    let note = '';   // 문제 기록 (살아있음 신호에 같이 저장 → 원격으로 원인 확인)
    const mark = t => { note = new Date().toTimeString().slice(0, 8) + ' ' + String(t).slice(0, 120); };
    const gState = t => { lastText = t; if (opts.onState) opts.onState(t); };
    const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const calls0 = g => (g.calls || []).length;
    const clean = g => { if (!g) return null; const x = { ...g }; delete x.ms; delete x.day; return x; };
    // 진행자 쓰기: 지금도 내가 이 게임의 진행자일 때만 저장 (게임 상태 + 진행 정보를 한 번에)
    // 쓰기는 한 줄로 차례대로 (오래된 진행 정보가 새 것을 덮어쓰지 않게)
    let txq = Promise.resolve();
    const queued = (fn, what) => { const p = txq.then(() => limit(fn(), what || 'tx')); txq = p.catch(() => {}); return p; };
    // 서버가 '내가 아는 바로 그 단계'일 때만 다음 단계로 (시간 초과된 저장이 늦게 반영돼도 두 번 진행되지 않게)
    const sameStep = (cur, prev) => !!cur && !!prev && cur.n === prev.n && cur.host === ID && cur.phase === prev.phase && (cur.k || 0) === (prev.k || 0) && (cur.round || 0) === (prev.round || 0);
    async function gSet(g){ const prev = G, next = clean(g), hs = JSON.stringify(H); await queued(() => N.gameTx(cur => sameStep(cur, prev), next, { n: next.n, h: JSON.parse(hs), by: ID }), 'set'); G = next; lastChange = gNow(); lastHs = hs; }
    function gWatch(n){ gOff && gOff(); gActs = []; gOff = N.watchGameActs(n, l => { gActs = l; stepSafe(); }); }
    function gPlayers(){ const m = new Map(); gActs.filter(a => a.kind === 'join' && a.gid).forEach(a => m.set(a.gid, a.nick)); return [...m].map(([gid, nick]) => ({ gid, nick })); }
    function release(){ gOff && gOff(); gOff = null; H = null; confirmed = false; lastHs = ''; }
    async function gEnd(msg){ const n = G && G.n; if (msg && n && N.saveGameEnd) N.saveGameEnd(n, msg).catch(() => {}); try { await queued(() => N.gameTx(cur => !!cur && cur.n === n && cur.host === ID, null)); } catch (e) { if (!/lost/.test(String(e && e.message))) throw e; } release(); G = null; gState(msg || '진행 중인 게임이 없어요.'); }
    const paid = new Set();   // 같은 게임·같은 손님에게 쿠폰이 두 번 나가지 않게 (실패 후 재시도 포함)
    async function gPrizeTo(gid, nick){ if (!G.reward || paid.has(G.n + '|' + gid)) return ''; paid.add(G.n + '|' + gid); const a = gActs.find(x => x.gid === gid && x.uid); if (!a) return ''; try { return await N.issueCoupon({ uid: a.uid, nick, reward: G.reward }); } catch (e) { return ''; } }
    const isHost = () => !!(G && confirmed && G.host === ID && H);
    // 이어받은 진행 정보 보정: 빠진 값은 게임 상태(G)에서 채우고, 없는 시간은 새로 잡음 · 기기 시계 차이 보정
    function normalizeH(doc, now){
      const h = doc.h || {};
      if (doc.by !== ID && typeof doc.at === 'number') { const sh = now - doc.at; if (Math.abs(sh) < 4000) ['joinUntil', 'endAt', 'pickUntil', 'until', 'doneAt', 'boomAt', 'lastPass'].forEach(k => { if (typeof h[k] === 'number') h[k] += sh; }); }
      if (!h.players && G.players) h.players = G.players;
      if (!h.alive && G.alive) h.alive = G.alive.slice();
      if (!h.round && G.round) h.round = G.round;
      if (G.type === 'nun') { h.seen = h.seen || {}; h.done = h.done || (G.calls || []).map(c => c.gid); }
      if ((G.type === 'face' || G.type === 'cho') && !h.qs && Array.isArray(G.qs)) h.qs = G.qs.slice();
      if (G.type === 'face' || G.type === 'cho') h.tsum = h.tsum || {};
      if (G.type === 'img') { h.total = h.total || {}; if (!h.qs) h.bad = true; }
      if (G.type === 'liar' && (!h.word || !h.cat)) h.bad = true;
      if ((G.type === 'img' || G.type === 'liar') && !['join', 'result'].includes(G.phase) && typeof h.until !== 'number') h.until = now + 6000;
      if (G.type === 'liar' && typeof h.turn !== 'number') h.turn = Math.max(0, G.turn | 0);
      if ((G.type === 'ox' || G.type === 'face' || G.type === 'cho') && !h.qs) h.bad = true;   // 문제 목록이 없으면 정답을 맞출 수 없음 → 게임 종료
      const D = (k, ms) => { if (typeof h[k] !== 'number') h[k] = now + ms; }, P = G.phase;
      if (P === 'join') D('joinUntil', 5000);
      if (G.type === 'bomb' && P === 'play') { D('boomAt', 8000); D('lastPass', 0); }
      if (['boom', 'result', 'spin', 'run'].includes(P)) D('doneAt', 8000);
      if (['pick', 'reveal', 'q', 'ans'].includes(P) && G.type !== 'race') D('until', 6000);
      if (G.type === 'race' && P === 'pick') D('pickUntil', 8000);
      if ((G.type === 'ten' && P === 'play') || (G.type === 'bal' && P === 'play') || G.type === 'toast' || (G.type === 'nun' && P === 'play')) D('endAt', 10000);
      return h;
    }
  async function gNewStep(now){
    const T2 = G.type, ps = gPlayers();
    if (G.phase === 'join' && ['nun', 'rou', 'rps', 'ox', 'face', 'cho'].includes(T2)) {
      gState(`${({ nun: '🙊 눈치게임', rou: '🎡 행운의 룰렛', rps: '✊ 가위바위보', ox: '⭕ OX 서바이벌', face: '🧑 인물퀴즈', cho: '🔤 초성퀴즈' })[T2]} 참여 모집 중… ${ps.length}명 (${Math.max(0, Math.ceil((H.joinUntil - now) / 1000))}초)`);
      if (now < H.joinUntil) return;
      const min = T2 === 'nun' ? 3 : T2 === 'rou' ? 2 : 1;
      if (ps.length < min) { await gEnd(`참여자가 ${min}명보다 적어서 게임을 취소했어요.`); return; }
      if (T2 === 'nun') { H.players = ps; H.seen = {}; H.done = []; H.endAt = now + 25000; await gSet({ ...G, phase: 'play', players: ps, calls: [], k: 0, dur: 25 }); gState(`🙊 시작! ${ps.length}명`); }
      if (T2 === 'rou') { const w = ps[Math.floor(Math.random() * ps.length)]; H.doneAt = now + 6500; await gSet({ ...G, phase: 'spin', players: ps.slice(0, 16), winner: w.gid, winnerNick: w.nick }); gState(`🎡 룰렛 돌아가는 중… (당첨: ${w.nick}님)`); }
      if (T2 === 'rps') { H.players = ps; H.alive = ps.map(p => p.gid); H.round = 1; H.until = now + 8000; await gSet({ ...G, phase: 'pick', players: ps, alive: H.alive, round: 1, k: 1, dur: 8 }); gState(`✊ 1라운드 · ${ps.length}명`); }
      if (T2 === 'face' || T2 === 'cho') { H.players = ps; H.alive = ps.map(p => p.gid); H.round = 1; H.tsum = {}; H.until = now + qMs(H.qs[0]); await gSet({ ...G, phase: 'q', players: ps, alive: H.alive, round: 1, k: 1, img: H.qs[0], dur: qSec(H.qs[0]) }); gState(`${T2 === 'cho' ? '🔤 1번 초성' : '🧑 1번 인물'} · ${ps.length}명`); }
      if (T2 === 'ox') { H.players = ps; H.alive = ps.map(p => p.gid); H.round = 1; H.until = now + 12000; const q = H.qs[0]; await gSet({ ...G, phase: 'q', players: ps, alive: H.alive, round: 1, k: 1, q: q[0], dur: 12 }); gState(`⭕ 1번 문제 · ${ps.length}명`); }
      return;
    }
    const nickOf = gid => (H.players || ps).find(p => p.gid === gid)?.nick || (gActs.find(a => a.gid === gid) || {}).nick || '';
    if (T2 === 'bal') {
      const rd = G.round || 0, tot = G.total || 1, more = rd && rd < tot && Array.isArray(G.qs) && G.qs[rd];
      const votes = {}; gActs.filter(a => a.kind === 'vote' && (!rd || a.k === rd)).forEach(a => { if (!(a.gid in votes)) votes[a.gid] = a.v; }); const n = Object.keys(votes).length, na = Object.values(votes).filter(v => v === 0).length;
      const tag = rd ? ` (${rd}/${tot})` : '';
      if (G.phase === 'play') { gState(`⚖️${tag} ${G.a} vs ${G.b} · ${n}명 참여 · ${Math.max(0, Math.ceil((H.endAt - now) / 1000))}초`); if (now >= H.endAt) { H.doneAt = now + (more ? 7000 : 12000); await gSet({ ...G, phase: 'result' }); gState(`⚖️${tag} 결과: ${G.a} ${na}명 · ${G.b} ${n - na}명`); } }
      else if (now >= H.doneAt) { if (more) { const q = G.qs[rd]; H.endAt = now + 20000; delete H.doneAt; await gSet({ ...G, phase: 'play', round: rd + 1, a: q[0], b: q[1], dur: 20 }); gState(`⚖️ ${rd + 1}/${tot}번째 질문`); } else await gEnd(lastText); }
    }
    if (T2 === 'nun') {
      if (G.phase === 'play') {
        gActs.filter(a => a.kind === 'num').forEach(a => { if (!(a.id in H.seen)) H.seen[a.id] = { gid: a.gid, nick: a.nick, at: now }; });
        const pend = Object.values(H.seen).filter(x => !H.done.includes(x.gid) && !x.used).sort((a, b) => a.at - b.at);
        if (pend.length && now - pend[0].at >= 700) { const grp = pend.filter(x => x.at - pend[0].at < 700); grp.forEach(x => x.used = true);
          if (grp.length > 1) { const num = (G.calls || []).length + 1; H.doneAt = now + 9000; await gSet({ ...G, phase: 'result', calls: [...(G.calls || []), ...grp.map(x => ({ gid: x.gid, nick: x.nick, num }))], losers: grp.map(x => ({ gid: x.gid, nick: x.nick })), reason: `${num}! 동시에 외쳤어요` }); gState(`🙊 ${grp.map(x => x.nick).join(', ')}님 동시 탈락`); return; }
          const x = grp[0]; H.done.push(x.gid); const calls = [...(G.calls || []), { gid: x.gid, nick: x.nick, num: calls0(G) + 1 }];
          const rest = H.players.filter(p => !H.done.includes(p.gid));
          if (rest.length === 1) { H.doneAt = now + 9000; await gSet({ ...G, phase: 'result', calls, losers: rest, reason: '마지막까지 못 외쳤어요' }); gState(`🙊 ${rest[0].nick}님 탈락 (마지막)`); return; }
          await gSet({ ...G, calls, k: calls.length }); gState(`🙊 ${calls.length}! ${x.nick}님`); return; }
        if (now >= H.endAt) { const rest = H.players.filter(p => !H.done.includes(p.gid)); H.doneAt = now + 9000; await gSet({ ...G, phase: 'result', losers: rest, reason: '시간 안에 못 외쳤어요' }); gState('🙊 시간 종료'); }
      } else if (now >= H.doneAt) await gEnd(lastText);
    }
    if (T2 === 'rou') {
      if (G.phase === 'spin' && now >= H.doneAt) { const code = await gPrizeTo(G.winner, G.winnerNick); H.doneAt = now + 10000; await gSet({ ...G, phase: 'result' }); gState(`🎡 ${G.winnerNick}님 당첨${code ? ' · 쿠폰 ' + code : ''}`); }
      else if (G.phase === 'result' && now >= H.doneAt) await gEnd(lastText);
    }
    if (T2 === 'race') {
      let picks = {}; if (G.phase === 'pick') gActs.filter(a => a.kind === 'horse').forEach(a => { if (!(a.gid in picks)) picks[a.gid] = { v: a.v, nick: a.nick }; }); else picks = H.picks || {};   // 출발 뒤에 고른 건 무효
      if (G.phase === 'pick') { gState(`🏇 ${Object.keys(picks).length}명이 골랐어요 · ${Math.max(0, Math.ceil((H.pickUntil - now) / 1000))}초`);
        if (now >= H.pickUntil) { const order = shuffle([0, 1, 2, 3, 4]); H.doneAt = now + 13500; H.order = order; H.picks = picks; const pk = {}; Object.entries(picks).slice(0, 60).forEach(([gid, p]) => { pk[gid] = p.v | 0; }); await gSet({ ...G, phase: 'run', order, pk, seed: 1 + Math.floor(Math.random() * 97) }); gState(`🏇 달리는 중… (우승: ${order[0] + 1}번)`); } }
      else if (G.phase === 'run' && now >= H.doneAt) { const hit = Object.entries(picks).filter(([, p]) => p.v === G.order[0]); let lucky = null, code = '';
        if (hit.length && G.reward) { const [gid, p] = hit[Math.floor(Math.random() * hit.length)]; lucky = { gid, nick: p.nick }; code = await gPrizeTo(gid, p.nick); }
        H.doneAt = now + 12000; await gSet({ ...G, phase: 'result', ...(lucky ? { lucky: lucky.gid, luckyNick: lucky.nick } : {}) }); gState(`🏆 ${G.order[0] + 1}번 ${N.RACE_HORSES[G.order[0]].n} 우승 · 맞힌 손님 ${hit.length}명${lucky ? ' · 추첨 ' + lucky.nick + '님' + (code ? ' 쿠폰 ' + code : '') : ''}`); }
      else if (G.phase === 'result' && now >= H.doneAt) await gEnd(lastText);
    }
    if (T2 === 'rps' || T2 === 'ox') {
      const kind = T2 === 'rps' ? 'rps' : 'ox', NM = T2 === 'rps' ? '✊' : '⭕';
      if (G.phase === 'pick' || G.phase === 'q') {
        const picks = {}; gActs.filter(a => a.kind === kind && a.k === H.round && H.alive.includes(a.gid)).forEach(a => { if (!(a.gid in picks)) picks[a.gid] = a.v; });
        gState(`${NM} ${H.round}라운드 · ${Object.keys(picks).length}/${H.alive.length}명 선택 · ${Math.max(0, Math.ceil((H.until - now) / 1000))}초`);
        if (now < H.until && Object.keys(picks).length < H.alive.length) return;
        let out, extra = {};
        if (T2 === 'rps') { const hand = Math.floor(Math.random() * 3); out = H.alive.filter(gid => !(gid in picks) || picks[gid] === (hand + 2) % 3); extra = { hand }; }   // 사장님을 이기거나 비기면 생존
        else { const q = H.qs[H.round - 1]; out = H.alive.filter(gid => picks[gid] !== q[1]); extra = { ans: q[1], why: q[2] }; }
        let redo = false; if (out.length === H.alive.length && H.alive.length > 1) { out = []; redo = true; }
        H.alive = H.alive.filter(gid => !out.includes(gid)); H.until = now + 5000;
        await gSet({ ...G, phase: T2 === 'rps' ? 'reveal' : 'ans', alive: H.alive, picks, out, redo, ...extra, k: H.round * 10 + 1 });
        gState(`${NM} ${H.round}라운드 결과 · 탈락 ${out.length}명 · 생존 ${H.alive.length}명`); return;
      }
      if ((G.phase === 'reveal' || G.phase === 'ans') && now >= H.until) {
        const last = T2 === 'rps' ? 6 : H.qs.length;
        if (H.alive.length <= 1 || H.round >= last || (T2 === 'rps' && H.alive.length === 0)) {
          const winners = H.alive.map(gid => ({ gid, nick: nickOf(gid) })); const codes = [];
          if (winners.length && winners.length <= 3) for (const w of winners) { const c = await gPrizeTo(w.gid, w.nick); if (c) codes.push(c); }
          H.doneAt = now + 10000; await gSet({ ...G, phase: 'result', winners, k: 999 }); gState(winners.length ? `🏆 ${winners.map(w => w.nick).join(', ')}님 우승${codes.length ? ' · 쿠폰 ' + codes.join(', ') : ''}` : '우승자 없음'); return; }
        H.round++; H.until = now + (T2 === 'rps' ? 8000 : 12000);
        const ex = T2 === 'rps' ? { phase: 'pick', dur: 8 } : { phase: 'q', q: H.qs[H.round - 1][0], dur: 12 };
        await gSet({ ...G, ...ex, round: H.round, alive: H.alive, picks: {}, out: [], redo: false, k: H.round }); gState(`${NM} ${H.round}라운드 · 생존 ${H.alive.length}명`); return;
      }
      if (G.phase === 'result' && now >= H.doneAt) await gEnd(lastText);
    }
  }
  // ---------- 인물퀴즈(11월 12일): 사진이 뜨고 5초 안에 휴대폰에 이름을 맞게 쓴 사람만 생존 → 1명 남거나 문제가 끝나면 1등 ----------
  //  손님 휴대폰이 정답을 확인하고 맞았을 때만 kind 'ox'·v 1·k 라운드로 보냄(OX와 같은 모양이라 파이어베이스 규칙 그대로)
  //  여러 명이 끝까지 남으면 매 문제 '가장 먼저 맞힌 사람과의 시간 차'를 더한 값이 가장 작은 사람이 1등
  async function faceStep(now){
    const nickOf = gid => (H.players || []).find(p => p.gid === gid)?.nick || (gActs.find(a => a.gid === gid) || {}).nick || '';
    const tsOf = a => (a.ts && typeof a.ts.toMillis === 'function') ? a.ts.toMillis() : (a.ms || now);
    if (G.phase === 'q') {
      const ok = {}; gActs.filter(a => a.kind === 'ox' && a.k === H.round && a.v === 1 && H.alive.includes(a.gid)).forEach(a => { const t = tsOf(a); if (!(a.gid in ok) || t < ok[a.gid]) ok[a.gid] = t; });
      gState(`🧑 ${H.round}번 인물 · 맞힌 사람 ${Object.keys(ok).length}/${H.alive.length}명 · ${Math.max(0, Math.ceil((H.until - FACE_GRACE - now) / 1000))}초`);
      if (now < H.until && Object.keys(ok).length < H.alive.length) return;
      const ts = Object.values(ok), t0 = ts.length ? Math.min(...ts) : 0; Object.entries(ok).forEach(([gid, t]) => { H.tsum[gid] = (H.tsum[gid] || 0) + (t - t0); });
      let out = H.alive.filter(gid => !(gid in ok)), redo = false; if (out.length === H.alive.length && H.alive.length > 1) { out = []; redo = true; }
      H.alive = H.alive.filter(gid => !out.includes(gid)); H.until = now + 4500;
      const fast = ts.length ? Object.keys(ok).sort((a, b) => ok[a] - ok[b])[0] : '';
      await gSet({ ...G, phase: 'ans', alive: H.alive, out, ok: Object.keys(ok), fast, fastNick: fast ? nickOf(fast) : '', redo, k: H.round * 10 + 1 });
      gState(`🧑 ${H.round}번 결과 · 탈락 ${out.length}명 · 생존 ${H.alive.length}명`); return; }
    if (G.phase === 'ans' && now >= H.until) {
      if (H.alive.length <= 1 || H.round >= H.qs.length) {
        const rank = H.alive.slice().sort((a, b) => (H.tsum[a] || 0) - (H.tsum[b] || 0)), w = rank[0];
        const winners = w ? [{ gid: w, nick: nickOf(w) }] : [], code = w ? await gPrizeTo(w, winners[0].nick) : '';
        H.doneAt = now + 11000; await gSet({ ...G, phase: 'result', winners, rest: rank.slice(1, 4).map(gid => ({ gid, nick: nickOf(gid) })), k: 999 });
        gState(w ? `🏆 ${G.type === 'cho' ? '초성퀴즈' : '인물퀴즈'} 1등 ${winners[0].nick}님${code ? ' · 쿠폰 ' + code : ''}` : (G.type === 'cho' ? '초성퀴즈' : '인물퀴즈') + ' 끝 · 1등 없음'); return; }
      H.round++; H.until = now + qMs(H.qs[H.round - 1]);
      await gSet({ ...G, phase: 'q', round: H.round, img: H.qs[H.round - 1], dur: qSec(H.qs[H.round - 1]), alive: H.alive, out: [], ok: [], redo: false, k: H.round }); gState(`🧑 ${H.round}번 인물 · 생존 ${H.alive.length}명`); return; }
    if (G.phase === 'result' && now >= H.doneAt) await gEnd(lastText);
  }
  // ---------- 이미지게임(11월 12일): 질문마다 참여자 중 한 명 몰래 뽑기(kind 'vote', k=문제 번호, v=참여자 순번) → 가장 많이 뽑힌 사람 공개 · 3문제 ----------
  const voteMap = k => { const m = {}; gActs.filter(a => a.kind === 'vote' && a.k === k && (H.players || []).some(p => p.gid === a.gid)).forEach(a => { if (!(a.gid in m)) m[a.gid] = a.v | 0; }); return m; };
  const tally = (m, ps) => { const c = {}; Object.values(m).forEach(v => { const p = ps[v]; if (p) c[p.gid] = (c[p.gid] || 0) + 1; }); return ps.map(p => ({ gid: p.gid, nick: p.nick, n: c[p.gid] || 0 })).filter(x => x.n).sort((a, b) => b.n - a.n); };
  async function imgStep(now){
    if (G.phase === 'join') { const ps = gPlayers(); gState(`🙋 이미지게임 참여 모집 중… ${ps.length}명 (${Math.max(0, Math.ceil((H.joinUntil - now) / 1000))}초)`);
      if (now < H.joinUntil) return; if (ps.length < 3) { await gEnd('참여자가 3명보다 적어서 이미지게임을 취소했어요.'); return; }
      H.players = ps.slice(0, 16); H.round = 1; H.until = now + 20000; H.total = {};
      await gSet({ ...G, phase: 'vote', players: H.players, round: 1, total: H.qs.length, q: H.qs[0], k: 1, dur: 20 }); gState(`🙋 1번 질문 · ${H.players.length}명`); return; }
    if (G.phase === 'vote') { const m = voteMap(H.round), n = Object.keys(m).length; gState(`🙋 ${H.round}번 질문 · ${n}/${H.players.length}명 뽑음 · ${Math.max(0, Math.ceil((H.until - now) / 1000))}초`);
      if (now < H.until && n < H.players.length) return;
      const tl = tally(m, H.players); tl.forEach(x => { H.total[x.gid] = (H.total[x.gid] || 0) + x.n; }); H.until = now + 8000;
      await gSet({ ...G, phase: 'reveal', tally: tl.slice(0, 5), voters: n, k: H.round * 10 + 1 }); gState(tl[0] ? `🙋 ${H.round}번: ${tl[0].nick}님 ${tl[0].n}표` : `🙋 ${H.round}번: 아무도 안 뽑았어요`); return; }
    if (G.phase === 'reveal' && now >= H.until) {
      if (H.round >= H.qs.length) { const best = H.players.map(p => ({ gid: p.gid, nick: p.nick, n: H.total[p.gid] || 0 })).filter(x => x.n).sort((a, b) => b.n - a.n).slice(0, 3); H.doneAt = now + 11000;
        await gSet({ ...G, phase: 'result', best, k: 999 }); gState(best[0] ? `🙋 오늘의 주인공 ${best[0].nick}님 (${best[0].n}표)` : '🙋 이미지게임 끝'); return; }
      H.round++; H.until = now + 20000; await gSet({ ...G, phase: 'vote', round: H.round, q: H.qs[H.round - 1], tally: [], k: H.round, dur: 20 }); gState(`🙋 ${H.round}번 질문`); return; }
    if (G.phase === 'result' && now >= H.doneAt) await gEnd(lastText);
  }
  // ---------- 라이어게임(11월 12일): 제시어 확인 → 차례대로 휴대폰 한 줄 힌트(말풍선 '🕵️ ') → 라이어 투표 → 걸리면 라이어가 제시어 맞히기 ----------
  async function liarStep(now){
    const ps = H.players || [];
    if (G.phase === 'join') {   // 11월 12일 사장님: 먼저 참여한 8명까지만 · 8명이 차면 바로 시작
      const tsJ = a => (a.ts && typeof a.ts.toMillis === 'function') ? a.ts.toMillis() : (a.ms || now), seen = new Set();
      const j = gActs.filter(a => a.kind === 'join' && a.gid).slice().sort((a, b) => tsJ(a) - tsJ(b)).filter(a => !seen.has(a.gid) && seen.add(a.gid)).map(a => ({ gid: a.gid, nick: a.nick })).slice(0, LIAR_MAX);
      gState(`🕵️ 라이어게임 참여 모집 중… ${j.length}/${LIAR_MAX}명 (${Math.max(0, Math.ceil((H.joinUntil - now) / 1000))}초)`);
      if (now < H.joinUntil && j.length < LIAR_MAX) return; if (j.length < 3) { await gEnd('참여자가 3명보다 적어서 라이어게임을 취소했어요.'); return; }
      H.players = shuffle(j); const liar = H.players[Math.floor(Math.random() * H.players.length)].gid; H.liar = liar; H.until = now + 9000;
      await gSet({ ...G, phase: 'word', players: H.players, cat: H.cat, sec: N.liarPack({ w: H.word, l: liar }), turn: -1, k: 1, dur: 9 }); gState(`🕵️ 제시어 확인 중 · ${H.players.length}명 (라이어·제시어는 끝나면 공개)`); return; }
    if (G.phase === 'word' && now >= H.until) { H.turn = 0; H.until = now + 20000; await gSet({ ...G, phase: 'hint', turn: 0, k: 100, dur: 20 }); gState(`🕵️ ${ps[0].nick}님 힌트 차례`); return; }
    if (G.phase === 'hint') { const done = gActs.some(a => a.kind === 'vote' && a.k === 100 + H.turn && a.gid === ps[H.turn].gid);
      gState(`🕵️ ${ps[H.turn].nick}님 힌트 차례 · ${Math.max(0, Math.ceil((H.until - now) / 1000))}초`);
      if (now < H.until && !done) return;
      if (H.turn + 1 < ps.length) { H.turn++; H.until = now + (done ? 20000 : 20000); await gSet({ ...G, turn: H.turn, k: 100 + H.turn, dur: 20 }); gState(`🕵️ ${ps[H.turn].nick}님 힌트 차례`); return; }
      H.until = now + 30000; await gSet({ ...G, phase: 'vote', turn: -1, k: 1, dur: 30 }); gState('🕵️ 라이어 투표 시작'); return; }
    if (G.phase === 'vote') { const m = voteMap(1), n = Object.keys(m).length; gState(`🕵️ 라이어 투표 · ${n}/${ps.length}명 · ${Math.max(0, Math.ceil((H.until - now) / 1000))}초`);
      if (now < H.until && n < ps.length) return;
      const tl = tally(m, ps), top = tl[0], tie = top && tl[1] && tl[1].n === top.n, caught = !!(top && !tie && top.gid === H.liar);
      H.caught = caught; H.until = now + 6000;
      if (caught) { const cat = (N.LIAR_CATS.find(c => c[0] === H.cat) || [, []])[1], opts = shuffle([H.word].concat(shuffle(cat.filter(w => w !== H.word)).slice(0, 5))); H.opts = opts; H.until = now + 6000 + 15000;
        await gSet({ ...G, phase: 'guess', tally: tl.slice(0, 5), pick: top.gid, pickNick: top.nick, opts, k: 2, dur: 15 }); gState(`🕵️ 라이어 ${top.nick}님 걸림! 제시어 맞히기 중`); return; }
      H.doneAt = now + 14000; await gSet({ ...G, phase: 'result', tally: tl.slice(0, 5), pick: top ? top.gid : '', pickNick: top ? top.nick : '', tie: !!tie, liar: H.liar, liarNick: nickOf2(H.liar), word: H.word, win: 'liar', k: 999 });
      gState(`🕵️ 라이어 승리 · 라이어 ${nickOf2(H.liar)}님 · 제시어 ${H.word}`); return; }
    if (G.phase === 'guess') { const a = gActs.find(x => x.kind === 'vote' && x.k === 2 && x.gid === H.liar);
      if (!a && now < H.until) return; const got = !!(a && H.opts[a.v | 0] === H.word); H.doneAt = now + 14000;
      await gSet({ ...G, phase: 'result', liar: H.liar, liarNick: nickOf2(H.liar), word: H.word, guess: a ? H.opts[a.v | 0] : '', win: got ? 'liar' : 'citizen', k: 999 });
      gState(got ? `🕵️ 라이어가 제시어를 맞혀서 역전승!` : `🕵️ 시민 승리! 라이어 ${nickOf2(H.liar)}님`); return; }
    if (G.phase === 'result' && now >= H.doneAt) await gEnd(lastText);
  }
  const nickOf2 = gid => (H.players || []).find(p => p.gid === gid)?.nick || (gActs.find(a => a.gid === gid) || {}).nick || '';
  async function gPass(){ const ps = H.players.filter(p => p.gid !== G.holder); if (!ps.length) return; const nx = ps[Math.floor(Math.random() * ps.length)];
    H.lastPass = gNow(); await gSet({ ...G, holder: nx.gid, holderNick: nx.nick, from: G.holder, k: (G.k || 0) + 1 }); gState(`💣 폭탄 → ${nx.nick}님`); }
  async function gStep(){
    if (!G || !H || gBusy) return; gBusy = true; const now = gNow();
    try {
      if (G.type === 'bomb') {
        if (G.phase === 'join') { const ps = gPlayers(); gState(`💣 참여자 모집 중… ${ps.length}명 (${Math.max(0, Math.ceil((H.joinUntil - now) / 1000))}초)`);
          if (now >= H.joinUntil) { if (ps.length < 2) { await gEnd('참여자가 2명보다 적어서 게임을 취소했어요.'); }
            else { const h = ps[Math.floor(Math.random() * ps.length)]; H.players = ps; H.boomAt = now + bombFuse(); H.lastPass = now; H.k = 0; H.round = 1; H.board = {}; H.cats = shuffle(N.BOMB_CATS || ['아무거나']).slice(0, N.BOMB_ROUNDS || 3);
              await gSet({ ...G, phase: 'play', players: ps, holder: h.gid, holderNick: h.nick, k: 0, startMs: now, round: 1, rounds: H.cats.length, cat: H.cats[0] }); gState(`💣 1판 시작! 주제 '${H.cats[0]}' · 폭탄 → ${h.nick}님`); } } }
        else if (G.phase === 'play') {
          const passed = gActs.find(a => a.kind === 'pass' && a.gid === G.holder && a.k === (G.k || 0));
          if (now >= H.boomAt) { H.doneAt = now + 9000; H.board = H.board || {}; H.board[G.holder] = (H.board[G.holder] || 0) + 1; await gSet({ ...G, phase: 'boom', loser: G.holder, loserNick: G.holderNick }); gState(`💥 펑! ${G.holderNick}님 당첨 · 미션: ${G.mission || '-'}`); }
          else if (passed || now - H.lastPass > 20000) await gPass(); }   // 답을 쓰면 넘어감 · 20초 동안 아무것도 안 하면(자리 비움) 자동으로 넘김
        else if (G.phase === 'boom' && now >= H.doneAt) {
          const rounds = G.rounds || 1, round = G.round || 1;
          if (round < rounds) { const cats = H.cats || shuffle(N.BOMB_CATS || ['아무거나']), cat = cats[round] || cats[0]; H.boomAt = now + bombFuse(); H.lastPass = now;   // 다음 판: 터진 사람부터 · 새 주제
            await gSet({ ...G, phase: 'play', round: round + 1, cat, holder: G.loser, holderNick: G.loserNick, k: (G.k || 0) + 1, startMs: now }); gState(`💣 ${round + 1}판 시작! 주제 '${cat}' · 폭탄 → ${G.loserNick}님`); }
          else if (rounds > 1) { const nick = gid => (H.players || []).find(p => p.gid === gid)?.nick || ''; const board = Object.entries(H.board || {}).map(([gid, n]) => ({ gid, nick: nick(gid), n })).sort((a, b) => b.n - a.n).slice(0, 5); H.doneAt = now + 10000;
            await gSet({ ...G, phase: 'result', board, k: 999 }); gState(board[0] ? `💣 끝! 제일 많이 터진 사람 ${board[0].nick}님 (${board[0].n}번)` : '💣 끝!'); }
          else await gEnd(`지난 게임: ${G.loserNick}님 당첨`); }
        else if (G.phase === 'result' && now >= H.doneAt) await gEnd(lastText);
      }
      if (G && G.type === 'ten') {
        if (G.phase === 'play') { const rk = N.tenRank(gActs); gState(`⏱ 진행 중 · 도전 ${rk.length}명 · ${Math.max(0, Math.ceil((H.endAt - now) / 1000))}초 남음`);
          if (now >= H.endAt) { const top = rk.slice(0, 5).map(r => ({ gid: r.gid, nick: r.nick, v: r.v })); H.doneAt = now + 12000;
            if (G.reward && rk[0] && rk[0].uid) { try { const code = await gPrizeTo(rk[0].gid, rk[0].nick); gState(`🏆 ${rk[0].nick}님 우승 · 쿠폰 ${code} 발급`); } catch (e) {} }
            else gState(rk[0] ? `🏆 ${rk[0].nick}님 우승 (${(rk[0].v / 1000).toFixed(2)}초)` : '도전한 사람이 없었어요.');
            await gSet({ ...G, phase: 'result', ranks: top }); } }
        else if (G.phase === 'result' && now >= H.doneAt) await gEnd(lastText);
      }
      if (G && G.type === 'img') await imgStep(now);
      else if (G && G.type === 'liar') await liarStep(now);
      else if (G && (G.type === 'face' || G.type === 'cho') && G.phase !== 'join') await faceStep(now);
      else if (G && !['bomb', 'ten', 'toast'].includes(G.type)) await gNewStep(now);
      if (G && G.type === 'toast') { const c = new Set(gActs.filter(a => a.kind === 'clink').map(a => a.gid)).size; gState(`🥂 건배 타임 · ${c}명 짠!`);
        if (now >= H.endAt) await gEnd(`지난 건배: ${c}명이 같이 짠!`); }
    } finally { gBusy = false; }
  }

    // 한 단계 진행 (실패하면 진행 정보를 되돌림 · 진행자를 빼앗겼으면 손 뗌)
    async function stepSafe(){
      if (!isHost() || gBusy) return;
      const backup = JSON.stringify(H);
      try { await gStep(); errs = 0; }
      catch (e) { H = JSON.parse(backup); gBusy = false; mark('step ' + G.type + '/' + G.phase + ' ' + (e && (e.code || e.message))); if (/lost/.test(String(e && e.message))) { release(); return; }
        if (!(e && e.code) && ++errs >= 3) { try { await gEnd('게임 진행에 계속 실패해서 멈췄어요.'); } catch (e2) {} return; } return; }   // 인터넷 끊김(Firestore 오류)은 다시 시도만
      if (isHost()) { const hs = JSON.stringify(H), n = G.n; if (hs !== lastHs) { lastHs = hs; queued(() => N.gameTx(cur => !!cur && cur.n === n && cur.host === ID, undefined, { n, h: JSON.parse(hs), by: ID })).catch(e => { if (/lost/.test(String(e && e.message))) release(); else lastHs = ''; }); } }
    }
    // 스냅샷 받기 (watchOwner에서 호출)
    function feed(game){
      const now = gNow();
      if (!game) { if (G) { release(); G = null; } return; }
      const sig = JSON.stringify({ ...game, ms: 0, hb: 0 }); if (sig !== lastSig) { lastSig = sig; lastChange = now; }
      if (!seenAt[game.n]) seenAt[game.n] = now;
      if (game.host === ID) { if (!G || G.n !== game.n || !confirmed) G = game; confirmed = true; }
      else { if (confirmed) release(); G = game; }
    }
    let hbKey = '';
    function feedHb(hb){ if (!hb || !hb.id) return; const key = hb.id + '|' + (hb.at && hb.at.seconds != null ? hb.at.seconds + '.' + hb.at.nanoseconds : String(hb.at)); if (key === hbKey) return; hbKey = key; hbSeen = { id: hb.id, at: gNow() }; }   // 같은 신호가 다시 와도 무시 (새로 보낸 신호만 '살아있음')
    async function tick(){
      const now = gNow(), gap = lastTick ? now - lastTick : 0; lastTick = now;
      if (gap > SLEEP_GAP && confirmed) { release(); mark('sleep ' + Math.round(gap / 1000) + 's'); }   // 잠들었다 깨어남 → 진행자 자격을 내려놓고 서버 기준으로 다시 판단
      if (busy || !G) return;
      const alive = Math.max(lastChange, hbSeen.id && hbSeen.id === G.host ? hbSeen.at : 0);
      if (G.host !== ID || !confirmed) {
        if (opts.canHost && !opts.canHost()) return;
        let claim = false;
        if (!G.host) claim = IS_SCREEN || now - (seenAt[G.n] || now) > 2500;
        else if (G.host === ID) claim = true;   // 내가 진행자였는데 잠깐 멈췄다 깨어남 → 서버가 아직 나라고 하면 바로 다시 맡음
        else if (now - alive > TAKEOVER) claim = true;   // 진행하던 기기가 멈춤 → 이어받기
        if (!claim) return;
        busy = true; const was = G.host || '';
        try { const n = G.n; const g2 = await queued(() => N.gameTx(cur => !!cur && cur.n === n && (cur.host || '') === was, cur => ({ ...clean(cur), host: ID }))); lastChange = gNow(); if (g2) feed(g2); } catch (e) {}   // 서버에 있는 최신 상태 그대로 이어받음
        busy = false; return;
      }
      if (opts.canHost && !opts.canHost()) { release(); return; }   // 리모컨 화면이 가려짐 → 손 뗌 (스크린이 이어받음)
      if (!H) {   // 진행 정보 불러오기
        busy = true; let doc = null; try { doc = await limit(N.loadGameHost(), 'load'); } catch (e) { mark('load ' + (e.code || e.message)); }
        if (doc && doc.n === G.n && doc.h && !(H = normalizeH(doc, gNow())).bad) { lastHs = ''; gWatch(G.n); gState(IS_SCREEN ? '🎮 매장 스크린이 진행 중이에요' : '🎮 이 리모컨이 진행 중이에요'); }
        else { H = H && H.bad ? H : null; try { await gEnd('진행 정보를 찾지 못해 게임을 멈췄어요.'); } catch (e) { H = null; } }
        busy = false; return;
      }
      if (!gOff) gWatch(G.n);
      if (now - hbAt > HB_EVERY) { hbAt = now; N.saveGameHb({ id: ID, n: G.n, note, ph: G.phase, ua: (navigator.userAgent || '').slice(0, 90) }).catch(() => {}); }
      busy = true; await stepSafe(); busy = false;
    }
    async function start(type, extra, hostState, msg){
      if (G) return false;
      const n = gNow(); await N.saveGameHost({ n, h: hostState(n), by: ID });
      seenAt[n] = n; lastText = msg; const g0 = { type, n, ...extra, host: '' }; await N.startGame(g0); feed({ ...g0 }); gState(msg); return true;
    }
    async function stop(msg){ release(); G = null; try { await N.startGame(null); } catch (e) {} gState(msg || '게임을 멈췄어요.'); }
    if (opts.watchHb !== false && N.watchGameHb) N.watchGameHb(feedHb);
    const timer = setInterval(tick, 300);
    return { feed, start, stop, isHost, game: () => G, state: () => lastText, stopTimer: () => clearInterval(timer), debug: { h: () => H, acts: () => gActs, set: g => gSet(g) } };
  }
  global.createGameHost = createGameHost;
})(window);
