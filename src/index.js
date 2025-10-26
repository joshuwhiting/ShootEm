import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import UIScene from './scenes/UIScene';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
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
