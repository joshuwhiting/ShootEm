import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import UIScene from './scenes/UIScene';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#2d2d2d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [GameScene, UIScene]
};

const game = new Phaser.Game(config);
