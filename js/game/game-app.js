import { OBJECT_SPRITE_PATHS, PERFORMANCE, SPRITE_PATHS } from '../config.js';
import { AssetLoader } from '../core/asset-loader.js';
import { RankingStore } from '../core/ranking-store.js';
import { getLocation } from '../data/locations.js';
import { getObjectDefinitions } from '../data/objects.js';
import { PlaySession } from './play-session.js';

export class GameApp {
  #loader = new AssetLoader({ concurrency: PERFORMANCE.decodeConcurrency });
  #showScreen;
  #onReady;
  #session = null;
  #rankings = new RankingStore();

  constructor({ showScreen, onReady }) {
    this.#showScreen = showScreen;
    this.#onReady = onReady;
  }

  async start({ playerName, location: locationId }) {
    const location = getLocation(locationId);
    const spritePaths = Object.values(SPRITE_PATHS).flat();
    const objectPaths = getObjectDefinitions(location.id)
      .flatMap((object) => OBJECT_SPRITE_PATHS[object.id] ?? []);
    const paths = [...spritePaths, ...location.tilePaths, ...objectPaths];
    const progress = document.querySelector('#loading-progress');
    const status = document.querySelector('#loading-status');

    progress.value = 0;
    status.textContent = `${location.label} 에셋을 준비하는 중...`;

    try {
      await this.#loader.load(paths, (completed, total) => {
        progress.value = total === 0 ? 1 : completed / total;
        status.textContent = `이미지 디코딩 ${completed} / ${total}`;
      });
      this.#session?.stop();
      this.#showScreen('play-screen');
      this.#session = new PlaySession({
        canvas: document.querySelector('#game-canvas'),
        playerName,
        location,
        assets: this.#loader,
        onEnd: (record) => this.#showResult(record),
      });
      this.#session.start();
      this.#onReady({ playerName, location, assets: this.#loader, session: this.#session });
    } catch (error) {
      console.error(error);
      status.textContent = `로딩 실패: ${error.message}`;
    }
  }

  #showResult(record) {
    const rankings = this.#rankings.save(record);
    const rank = rankings.findIndex((item) => item.savedAt === record.savedAt) + 1;
    const summary = document.querySelector('#result-summary');
    summary.replaceChildren();
    const lines = [
      `${record.playerName} · ${record.locationLabel}`,
      record.cleared ? '완전 파괴 성공!' : '도전 종료',
      `파괴 ${record.destroyedCount} / ${record.totalObjects}`,
      `파괴 EXP ${record.destroyedExp}`,
      `시간 보너스 ${record.bonusExp}`,
      `최종 점수 ${record.score}`,
      rank > 0 ? `로컬 랭킹 ${rank}위` : '상위 10위 밖',
    ];
    for (const line of lines) {
      const row = document.createElement('div');
      row.textContent = line;
      summary.append(row);
    }
    this.#showScreen('result-screen');
  }
}
