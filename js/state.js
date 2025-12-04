import { LEVELS } from './constants.js';

export const state = {
    grid: [],
    items: [],
    bombs: [],
    particles: [],
    players: [],
    currentLevel: LEVELS.hell,
    selectedCharIndex: 0,
    selectedLevelKey: 'hell',
    menuState: 0,
    isGameOver: false,
    isPaused: false,
    hellFireTimer: 0,
    hellFirePhase: 'IDLE', 
    hellFireActive: false,
    // NEU: Timer für das Zufrieren im Eis-Level
    iceRespawnTimer: 0,
    keys: {}
};
