// 낯선 게임 진행자 (매장 스크린이 우선 · 사장 리모컨은 예비)
// - 리모컨이 게임을 '시작'하면 settings.game(host 비어 있음) + owner/gamehost(진행 정보)를 저장
// - 사장 계정으로 로그인한 스크린이 바로 진행을 맡고, 스크린이 없으면 2.5초 뒤 리모컨이 맡음
// - 진행 중인 기기가 조용하면(화면 꺼짐 등) 다른 기기가 이어받음 (스크린 12초 · 리모컨 16초)
// - 진행 기기의 모든 쓰기는 '내가 아직 진행자일 때만' 저장되는 트랜잭션 → 잠에서 깬 옛 진행자가 덮어쓰지 못함
(function (global) {
  function createGameHost(N, opts) {
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
    async function gEnd(msg){ const n = G && G.n; try { await queued(() => N.gameTx(cur => !!cur && cur.n === n && cur.host === ID, null)); } catch (e) { if (!/lost/.test(String(e && e.message))) throw e; } release(); G = null; gState(msg || '진행 중인 게임이 없어요.'); }
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
      if (G.type === 'ox' && !h.qs) h.bad = true;   // 문제 목록이 없으면 정답을 맞출 수 없음 → 게임 종료
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
    if (G.phase === 'join' && ['nun', 'rou', 'rps', 'ox'].includes(T2)) {
      gState(`${lastText.split('…')[0]}… ${ps.length}명 (${Math.max(0, Math.ceil((H.joinUntil - now) / 1000))}초)`);
      if (now < H.joinUntil) return;
      const min = T2 === 'nun' ? 3 : T2 === 'rou' ? 2 : 1;
      if (ps.length < min) { await gEnd(`참여자가 ${min}명보다 적어서 게임을 취소했어요.`); return; }
      if (T2 === 'nun') { H.players = ps; H.seen = {}; H.done = []; H.endAt = now + 25000; await gSet({ ...G, phase: 'play', players: ps, calls: [], k: 0, dur: 25 }); gState(`🙊 시작! ${ps.length}명`); }
      if (T2 === 'rou') { const w = ps[Math.floor(Math.random() * ps.length)]; H.doneAt = now + 6500; await gSet({ ...G, phase: 'spin', players: ps.slice(0, 16), winner: w.gid, winnerNick: w.nick }); gState(`🎡 룰렛 돌아가는 중… (당첨: ${w.nick}님)`); }
      if (T2 === 'rps') { H.players = ps; H.alive = ps.map(p => p.gid); H.round = 1; H.until = now + 8000; await gSet({ ...G, phase: 'pick', players: ps, alive: H.alive, round: 1, k: 1, dur: 8 }); gState(`✊ 1라운드 · ${ps.length}명`); }
      if (T2 === 'ox') { H.players = ps; H.alive = ps.map(p => p.gid); H.round = 1; H.until = now + 12000; const q = H.qs[0]; await gSet({ ...G, phase: 'q', players: ps, alive: H.alive, round: 1, k: 1, q: q[0], dur: 12 }); gState(`⭕ 1번 문제 · ${ps.length}명`); }
      return;
    }
    const nickOf = gid => (H.players || ps).find(p => p.gid === gid)?.nick || (gActs.find(a => a.gid === gid) || {}).nick || '';
    if (T2 === 'bal') {
      const votes = {}; gActs.filter(a => a.kind === 'vote').forEach(a => { if (!(a.gid in votes)) votes[a.gid] = a.v; }); const n = Object.keys(votes).length, na = Object.values(votes).filter(v => v === 0).length;
      if (G.phase === 'play') { gState(`⚖️ ${G.a} vs ${G.b} · ${n}명 참여 · ${Math.max(0, Math.ceil((H.endAt - now) / 1000))}초`); if (now >= H.endAt) { H.doneAt = now + 12000; await gSet({ ...G, phase: 'result' }); gState(`⚖️ 결과: ${G.a} ${na}명 · ${G.b} ${n - na}명`); } }
      else if (now >= H.doneAt) await gEnd(lastText);
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
      const picks = {}; gActs.filter(a => a.kind === 'horse').forEach(a => { if (!(a.gid in picks)) picks[a.gid] = { v: a.v, nick: a.nick }; });
      if (G.phase === 'pick') { gState(`🏇 ${Object.keys(picks).length}명이 골랐어요 · ${Math.max(0, Math.ceil((H.pickUntil - now) / 1000))}초`);
        if (now >= H.pickUntil) { const order = shuffle([0, 1, 2, 3, 4]); H.doneAt = now + 13500; H.order = order; await gSet({ ...G, phase: 'run', order, seed: 1 + Math.floor(Math.random() * 97) }); gState(`🏇 달리는 중… (우승: ${order[0] + 1}번)`); } }
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
  async function gPass(){ const ps = H.players.filter(p => p.gid !== G.holder); if (!ps.length) return; const nx = ps[Math.floor(Math.random() * ps.length)];
    H.lastPass = gNow(); await gSet({ ...G, holder: nx.gid, holderNick: nx.nick, k: (G.k || 0) + 1 }); gState(`💣 폭탄 → ${nx.nick}님`); }
  async function gStep(){
    if (!G || !H || gBusy) return; gBusy = true; const now = gNow();
    try {
      if (G.type === 'bomb') {
        if (G.phase === 'join') { const ps = gPlayers(); gState(`💣 참여자 모집 중… ${ps.length}명 (${Math.max(0, Math.ceil((H.joinUntil - now) / 1000))}초)`);
          if (now >= H.joinUntil) { if (ps.length < 2) { await gEnd('참여자가 2명보다 적어서 게임을 취소했어요.'); }
            else { const h = ps[Math.floor(Math.random() * ps.length)]; H.players = ps; H.boomAt = now + 18000 + Math.random() * 14000; H.lastPass = now; H.k = 0;
              await gSet({ ...G, phase: 'play', players: ps, holder: h.gid, holderNick: h.nick, k: 0, startMs: now }); gState(`💣 시작! 폭탄 → ${h.nick}님`); } } }
        else if (G.phase === 'play') {
          const passed = gActs.find(a => a.kind === 'pass' && a.gid === G.holder && a.k === (G.k || 0));
          if (now >= H.boomAt) { H.doneAt = now + 9000; await gSet({ ...G, phase: 'boom', loser: G.holder, loserNick: G.holderNick }); gState(`💥 펑! ${G.holderNick}님 당첨 · 미션: ${G.mission || '-'}`); }
          else if (passed || now - H.lastPass > 5000) await gPass(); }
        else if (G.phase === 'boom' && now >= H.doneAt) await gEnd(`지난 게임: ${G.loserNick}님 당첨`);
      }
      if (G && G.type === 'ten') {
        if (G.phase === 'play') { const rk = N.tenRank(gActs); gState(`⏱ 진행 중 · 도전 ${rk.length}명 · ${Math.max(0, Math.ceil((H.endAt - now) / 1000))}초 남음`);
          if (now >= H.endAt) { const top = rk.slice(0, 5).map(r => ({ gid: r.gid, nick: r.nick, v: r.v })); H.doneAt = now + 12000;
            if (G.reward && rk[0] && rk[0].uid) { try { const code = await gPrizeTo(rk[0].gid, rk[0].nick); gState(`🏆 ${rk[0].nick}님 우승 · 쿠폰 ${code} 발급`); } catch (e) {} }
            else gState(rk[0] ? `🏆 ${rk[0].nick}님 우승 (${(rk[0].v / 1000).toFixed(2)}초)` : '도전한 사람이 없었어요.');
            await gSet({ ...G, phase: 'result', ranks: top }); } }
        else if (G.phase === 'result' && now >= H.doneAt) await gEnd(lastText);
      }
      if (G && !['bomb', 'ten', 'toast'].includes(G.type)) await gNewStep(now);
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
