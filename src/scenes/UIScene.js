import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../index';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
        this.gameScene = null;
        this.healthText = null;
        this.xpText = null;
        this.moneyText = null;
        this.levelText = null;
        this.upgradeMenu = null;
        this.upgradeMenuVisible = false;
    }
    
    init(data) {
        this.gameScene = data.gameScene;
    }
    
    create() {
        // Create HUD elements
        const padding = 20;
        
        this.levelText = this.add.text(padding, padding, '', {
            fontSize: '24px',
            color: '#ffff00',
            fontStyle: 'bold'
        });
        
        this.healthText = this.add.text(padding, padding + 30, '', {
            fontSize: '20px',
            color: '#00ff00'
        });
        
        this.xpText = this.add.text(padding, padding + 55, '', {
            fontSize: '18px',
            color: '#00aaff'
        });
        
        this.moneyText = this.add.text(padding, padding + 80, '', {
            fontSize: '20px',
            color: '#ffaa00'
        });
        
        // Upgrade button
        const upgradeButton = this.add.text(GAME_WIDTH - padding, padding, '[U] UPGRADES', {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#004400',
            padding: { x: 10, y: 5 }
        }).setOrigin(1, 0).setInteractive();
        
        upgradeButton.on('pointerdown', () => {
            this.toggleUpgradeMenu();
        });
        
        // Keyboard shortcut for upgrades
        const upgradeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U);
        upgradeKey.on('down', () => {
            this.toggleUpgradeMenu();
        });
        
        // Create upgrade menu (hidden initially)
        this.createUpgradeMenu();
    }
    
    update() {
        if (!this.gameScene || !this.gameScene.getPlayerStats()) return;
        
        const stats = this.gameScene.getPlayerStats();
        
        this.levelText.setText(`Level: ${stats.level}`);
        this.healthText.setText(`HP: ${Math.max(0, Math.floor(stats.health))}/${stats.maxHealth}`);
        this.xpText.setText(`XP: ${stats.xp}/${stats.xpToNextLevel}`);
        this.moneyText.setText(`Gold: ${stats.money}`);
    }
    
    createUpgradeMenu() {
        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;
        const menuWidth = 600;
        const menuHeight = 500;
        
        this.upgradeMenu = this.add.container(centerX, centerY);
        this.upgradeMenu.setDepth(1000);
        this.upgradeMenu.setVisible(false);
        
        // Background
        const bg = this.add.rectangle(0, 0, menuWidth, menuHeight, 0x222222, 0.95);
        this.upgradeMenu.add(bg);
        
        // Title
        const title = this.add.text(0, -menuHeight/2 + 30, 'UPGRADES', {
            fontSize: '32px',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.upgradeMenu.add(title);
        
        // Upgrades
        const upgradeData = [
            {
                name: 'Damage +5',
                cost: 30,
                property: 'projectileDamage',
                increase: 5,
                y: -150
            },
            {
                name: 'Fire Rate +10%',
                cost: 40,
                property: 'fireRate',
                increase: -50, // Negative because lower is better
                y: -80
            },
            {
                name: 'Projectile Speed +20%',
                cost: 25,
                property: 'projectileSpeed',
                increase: 80,
                y: -10
            },
            {
                name: 'Max Health +30',
                cost: 50,
                property: 'maxHealth',
                increase: 30,
                y: 60,
                healOnPurchase: true
            },
            {
                name: 'Movement Speed +10%',
                cost: 35,
                property: 'speed',
                increase: 20,
                y: 130
            }
        ];
        
        upgradeData.forEach(upgrade => {
            this.createUpgradeButton(upgrade);
        });
        
        // Close button
        const closeButton = this.add.text(0, menuHeight/2 - 40, 'Close [U or ESC]', {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#440000',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive();
        
        closeButton.on('pointerdown', () => {
            this.toggleUpgradeMenu();
        });
        
        this.upgradeMenu.add(closeButton);
        
        // ESC key to close
        const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        escKey.on('down', () => {
            if (this.upgradeMenuVisible) {
                this.toggleUpgradeMenu();
            }
        });
    }
    
    createUpgradeButton(upgradeData) {
        const container = this.add.container(0, upgradeData.y);
        
        const bg = this.add.rectangle(0, 0, 500, 50, 0x444444);
        bg.setStrokeStyle(2, 0x888888);
        
        const nameText = this.add.text(-230, 0, upgradeData.name, {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);
        
        const costText = this.add.text(180, 0, `Cost: ${upgradeData.cost} gold`, {
            fontSize: '16px',
            color: '#ffaa00'
        }).setOrigin(0, 0.5);
        
        container.add([bg, nameText, costText]);
        container.setInteractive(
            new Phaser.Geom.Rectangle(-250, -25, 500, 50),
            Phaser.Geom.Rectangle.Contains
        );
        
        container.on('pointerover', () => {
            bg.setFillStyle(0x555555);
        });
        
        container.on('pointerout', () => {
            bg.setFillStyle(0x444444);
        });
        
        container.on('pointerdown', () => {
            this.purchaseUpgrade(upgradeData);
        });
        
        this.upgradeMenu.add(container);
    }
    
    purchaseUpgrade(upgradeData) {
        if (!this.gameScene || !this.gameScene.getPlayerStats()) return;
        
        const stats = this.gameScene.getPlayerStats();
        
        if (stats.money >= upgradeData.cost) {
            stats.money -= upgradeData.cost;
            stats[upgradeData.property] += upgradeData.increase;
            
            // Special case: heal when buying max health
            if (upgradeData.healOnPurchase) {
                stats.health = stats.maxHealth;
            }
            
            // Visual feedback
            const centerX = GAME_WIDTH / 2;
            const centerY = GAME_HEIGHT / 2;
            const feedbackText = this.add.text(centerX, 150, `${upgradeData.name} Purchased!`, {
                fontSize: '24px',
                color: '#00ff00',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setDepth(2000);
            
            this.tweens.add({
                targets: feedbackText,
                alpha: 0,
                y: 100,
                duration: 1500,
                onComplete: () => feedbackText.destroy()
            });
            
            // Play sound effect (visual feedback since we don't have sounds)
            const flash = this.add.circle(centerX, centerY, 50, 0x00ff00, 0.3).setDepth(2000);
            this.tweens.add({
                targets: flash,
                scale: 10,
                alpha: 0,
                duration: 500,
                onComplete: () => flash.destroy()
            });
        } else {
            // Not enough money feedback
            const centerX = GAME_WIDTH / 2;
            const feedbackText = this.add.text(centerX, 150, 'Not enough gold!', {
                fontSize: '24px',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setDepth(2000);
            
            this.tweens.add({
                targets: feedbackText,
                alpha: 0,
                y: 100,
                duration: 1500,
                onComplete: () => feedbackText.destroy()
            });
        }
    }
    
    toggleUpgradeMenu() {
        this.upgradeMenuVisible = !this.upgradeMenuVisible;
        this.upgradeMenu.setVisible(this.upgradeMenuVisible);
        
        // Pause/unpause game
        if (this.gameScene) {
            if (this.upgradeMenuVisible) {
                this.gameScene.physics.pause();
            } else {
                this.gameScene.physics.resume();
            }
        }
    }
}
