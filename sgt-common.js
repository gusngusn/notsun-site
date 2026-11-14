// 낯선 평일 소개팅 지원 — 공통(저장소 연결). 방명록과 같은 파이어베이스(notsun-guestbook)를 쓰고, 컬렉션은 sgt_ 로 시작하는 것만 씀
// 연습 모드: config.js가 없거나 주소에 ?demo 가 있으면 이 기기 브라우저 저장소에만 저장(실제 서버에 안 붙음)
(function () {
  const cfg = window.FIREBASE_CONFIG;
  const DEMO = !cfg || !cfg.apiKey || /[?&]demo\b/.test(location.search);
  const OWNER_EMAIL = 'owner@notsun.bar';
  let fs = null, auth = null;
  if (!DEMO) {
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    fs = firebase.firestore(); auth = firebase.auth();
  }
  const L = {   // 연습 모드 저장
    get(k, d) { try { return JSON.parse(localStorage.getItem('sgt-demo-' + k)) ?? d; } catch (e) { return d; } },
    set(k, v) { localStorage.setItem('sgt-demo-' + k, JSON.stringify(v)); }
  };
  const newId = () => DEMO ? 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) : fs.collection('sgt_apps').doc().id;

  const SGT = {
    DEMO, OWNER_EMAIL,
    // 회차(수요일): { date:'2026-11-19', open:true, capM:10, capF:10, note:'' }
    async openRounds() {
      if (DEMO) return L.get('rounds', []).filter(r => r.open).sort((a, b) => a.date.localeCompare(b.date));
      const s = await fs.collection('sgt_rounds').where('open', '==', true).get();
      return s.docs.map(d => d.data()).sort((a, b) => a.date.localeCompare(b.date));
    },
    async allRounds() {
      if (DEMO) return L.get('rounds', []).sort((a, b) => b.date.localeCompare(a.date));
      const s = await fs.collection('sgt_rounds').get();
      return s.docs.map(d => d.data()).sort((a, b) => b.date.localeCompare(a.date));
    },
    async saveRound(r) {
      if (DEMO) { const rs = L.get('rounds', []).filter(x => x.date !== r.date); rs.push(r); L.set('rounds', rs); return; }
      await fs.collection('sgt_rounds').doc(r.date).set(r);
    },
    async deleteRound(date) {
      if (DEMO) { L.set('rounds', L.get('rounds', []).filter(x => x.date !== date)); return; }
      await fs.collection('sgt_rounds').doc(date).delete();
    },
    // 지원서 제출: 지원서 + 사진(따로 저장, 사장만 읽음)을 한 번에
    async submit(app, photoData) {
      const id = newId();
      const doc = Object.assign({}, app, { status: 'new', hasPhoto: !!photoData });
      if (DEMO) {
        const apps = L.get('apps', []); apps.push(Object.assign({ id, ts: Date.now() }, doc)); L.set('apps', apps);
        if (photoData) { const ph = L.get('photos', {}); ph[id] = photoData; L.set('photos', ph); }
        return id;
      }
      const b = fs.batch();
      b.set(fs.collection('sgt_apps').doc(id), Object.assign(doc, { ts: firebase.firestore.FieldValue.serverTimestamp() }));
      if (photoData) b.set(fs.collection('sgt_photos').doc(id), { data: photoData, ts: firebase.firestore.FieldValue.serverTimestamp() });
      await b.commit();
      return id;
    },
    // ---- 사장 전용 ----
    async apps(date) {
      if (DEMO) return L.get('apps', []).filter(a => a.round === date).sort((a, b) => a.ts - b.ts);
      const s = await fs.collection('sgt_apps').where('round', '==', date).get();
      return s.docs.map(d => Object.assign({ id: d.id }, d.data(), { ts: d.data().ts ? d.data().ts.toMillis() : 0 })).sort((a, b) => a.ts - b.ts);
    },
    async photo(id) {
      if (DEMO) return L.get('photos', {})[id] || null;
      const d = await fs.collection('sgt_photos').doc(id).get();
      return d.exists ? d.data().data : null;
    },
    async setStatus(id, status, memo) {
      if (DEMO) { const apps = L.get('apps', []); const a = apps.find(x => x.id === id); if (a) { a.status = status; if (memo !== undefined) a.memo = memo; } L.set('apps', apps); return; }
      const u = { status }; if (memo !== undefined) u.memo = memo;
      await fs.collection('sgt_apps').doc(id).update(u);
    },
    async update(id, u) {   // 사장 전용: 입금 확인 등
      if (DEMO) { const apps = L.get('apps', []); const a = apps.find(x => x.id === id); if (a) Object.assign(a, u); L.set('apps', apps); return; }
      await fs.collection('sgt_apps').doc(id).update(u);
    },
    async removeApp(id) {
      if (DEMO) { L.set('apps', L.get('apps', []).filter(a => a.id !== id)); const ph = L.get('photos', {}); delete ph[id]; L.set('photos', ph); return; }
      const b = fs.batch(); b.delete(fs.collection('sgt_apps').doc(id)); b.delete(fs.collection('sgt_photos').doc(id)); await b.commit();
    },
    // 로그인(사장 계정). 비밀번호는 사장님이 직접 입력
    onAuth(cb) { if (DEMO) { cb(L.get('demoLogin', false) ? { email: OWNER_EMAIL } : null); return; } auth.onAuthStateChanged(u => cb(u && u.email === OWNER_EMAIL ? u : null)); },
    async login(pw) { if (DEMO) { L.set('demoLogin', true); return; } await auth.signInWithEmailAndPassword(OWNER_EMAIL, pw); },
    async logout() { if (DEMO) { L.set('demoLogin', false); return; } await auth.signOut(); },
  };
  // 날짜 표시: 2026-11-19 → 11월 19일 (수)
  SGT.dateLabel = d => { const t = new Date(d + 'T00:00:00'); return `${t.getMonth() + 1}월 ${t.getDate()}일 (${'일월화수목금토'[t.getDay()]})`; };
  window.SGT = SGT;
})();
