const STORAGE_KEY = 'rollo.rankings.v1';

export class RankingStore {
  load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? { yard: [], house: [] };
    } catch {
      return { yard: [], house: [] };
    }
  }

  save(record) {
    const rankings = this.load();
    const list = rankings[record.locationId] ?? [];
    list.push(record);
    list.sort((a, b) => b.score - a.score
      || Number(b.cleared) - Number(a.cleared)
      || b.remainingSeconds - a.remainingSeconds
      || a.savedAt - b.savedAt);
    rankings[record.locationId] = list.slice(0, 10);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rankings)); } catch { /* 저장 불가 환경 */ }
    return rankings[record.locationId];
  }
}
