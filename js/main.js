import { GameApp } from './game/game-app.js';

const screens = new Map(
  [...document.querySelectorAll('.screen')].map((screen) => [screen.id, screen]),
);

const state = {
  playerName: 'ROLLO',
  location: null,
};

function showScreen(id) {
  for (const [screenId, screen] of screens) {
    const active = screenId === id;
    screen.hidden = !active;
    screen.classList.toggle('is-active', active);
  }
}

function normalizeName(value) {
  return value.trim().slice(0, 12) || 'ROLLO';
}

document.querySelector('#start-button').addEventListener('click', () => {
  showScreen('name-screen');
  document.querySelector('#player-name').focus();
});

document.querySelector('#confirm-name-button').addEventListener('click', () => {
  const input = document.querySelector('#player-name');
  state.playerName = normalizeName(input.value);
  input.value = state.playerName;
  showScreen('location-screen');
});

document.querySelector('#player-name').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') document.querySelector('#confirm-name-button').click();
});

for (const card of document.querySelectorAll('.location-card')) {
  card.addEventListener('click', () => {
    state.location = card.dataset.location;
    showScreen('loading-screen');
    document.dispatchEvent(new CustomEvent('rollo:start-location', { detail: { ...state } }));
  });
}

const gameApp = new GameApp({
  showScreen,
  onReady: (session) => {
    document.dispatchEvent(new CustomEvent('rollo:play-ready', { detail: session }));
  },
});

document.addEventListener('rollo:start-location', (event) => {
  gameApp.start(event.detail);
});

document.querySelector('#home-button').addEventListener('click', () => showScreen('title-screen'));
document.querySelector('#retry-button').addEventListener('click', () => {
  showScreen('loading-screen');
  document.dispatchEvent(new CustomEvent('rollo:start-location', { detail: { ...state } }));
});

export { showScreen, state };
