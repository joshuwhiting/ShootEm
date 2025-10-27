import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../index';

export default class Player {
    constructor(scene) {
        this.scene = scene;
        this.sprite = null;
        
        // Player stats
        this.stats = {
            maxHealth: 100,
            health: 100,
            speed: 200,
            fireRate: 500,
            lastFired: 0,
            projectileSpeed: 400,
            projectileDamage: 10,
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            money: 100
        };
        
        this.XP_LEVEL_MULTIPLIER = 1.5;
    }
    
    create() {
        // Create player sprite
        const centerX = Math.round(GAME_WIDTH / 2);
        const centerY = Math.round(GAME_HEIGHT / 2);
        this.sprite = this.scene.add.circle(centerX, centerY, 15, 0x00ff00);
        
        this.scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setCircle(15);
        
        // Ensure sprite starts at pixel-perfect position
        this.sprite.x = Math.round(this.sprite.x);
        this.sprite.y = Math.round(this.sprite.y);
        
        // Health bar background (grey - shows lost health) - draw first
        const healthBarBg = this.scene.add.rectangle(Math.round(centerX), Math.round(centerY + 35), 40, 6, 0x666666);
        healthBarBg.setOrigin(0.5, 0);
        
        // health bar - positioned below player - draw on top
        const healthBar = this.scene.add.rectangle(Math.round(centerX), Math.round(centerY + 35), 40, 6, 0xff0000);
        healthBar.setOrigin(0.5, 0); // Center horizontally, top aligned
        healthBar.setDepth(1); // Ensure red bar is above grey background

        this.healthBar = healthBar;
        this.healthBarBg = healthBarBg;

        return this.sprite;
    }
    
    updateMovement(keys, cursors) {
        if (!this.sprite || this.stats.health <= 0) return;
        
        let velocityX = 0;
        let velocityY = 0;
        
        if (keys.A.isDown || cursors.left.isDown) {
            velocityX = -this.stats.speed;
        } else if (keys.D.isDown || cursors.right.isDown) {
            velocityX = this.stats.speed;
        }
        
        if (keys.W.isDown || cursors.up.isDown) {
            velocityY = -this.stats.speed;
        } else if (keys.S.isDown || cursors.down.isDown) {
            velocityY = this.stats.speed;
        }
        
        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }
        
        this.sprite.body.setVelocity(velocityX, velocityY);
        
        // Force pixel-perfect positioning to prevent blur
        this.sprite.x = Math.round(this.sprite.x);
        this.sprite.y = Math.round(this.sprite.y);
        
        // Update health bar position and size
        this.updateHealthBar();
    }
    
    updateHealthBar() {
        if (this.healthBar && this.healthBarBg && this.sprite) {
            // Use pixel-perfect positioning by rounding coordinates
            const healthBarY = Math.round(this.sprite.y + 35);
            const healthBarX = Math.round(this.sprite.x);
            
            // Update background position (grey - always full width)
            this.healthBarBg.setPosition(healthBarX, healthBarY);
            this.healthBarBg.setSize(40, 6); // Always full width
            
            // Update health bar position and width based on current health percentage
            const healthPercentage = this.stats.health / this.stats.maxHealth;
            const maxWidth = 40;
            const currentWidth = Math.max(0, Math.round(maxWidth * healthPercentage));
            
            // Position red health bar with pixel-perfect coordinates
            this.healthBar.setPosition(healthBarX, healthBarY);
            this.healthBar.setSize(currentWidth, 6); // Width changes based on health
        }
    }
    
    updateShooting(time, findNearestEnemyCallback, shootAtCallback) {
        if (time > this.stats.lastFired + this.stats.fireRate) {
            this.stats.lastFired = time;
            
            // Find nearest enemy
            let nearestEnemy = findNearestEnemyCallback();
            if (nearestEnemy) {
                shootAtCallback(
                    this.sprite.x,
                    this.sprite.y,
                    nearestEnemy.x,
                    nearestEnemy.y,
                    this.stats.projectileSpeed,
                    this.stats.projectileDamage,
                    0x00ffff
                );
            }
        }
    }
    
    takeDamage(amount) {
        this.stats.health -= amount;
        
        // Visual feedback
        this.sprite.setFillStyle(0xffff00);
        this.scene.time.delayedCall(100, () => {
            if (this.sprite && this.sprite.active) {
                this.sprite.setFillStyle(0x00ff00);
            }
        });
        
        // Update health bar
        this.updateHealthBar();
        
        return this.stats.health <= 0;
    }
    
    gainXP(amount) {
        this.stats.xp += amount;
        
        // Check for level up
        while (this.stats.xp >= this.stats.xpToNextLevel) {
            this.stats.xp -= this.stats.xpToNextLevel;
            this.stats.level++;
            this.stats.xpToNextLevel = Math.floor(this.stats.xpToNextLevel * this.XP_LEVEL_MULTIPLIER);
            
            // Level up rewards
            this.stats.maxHealth += 20;
            this.stats.health = this.stats.maxHealth;
            this.stats.projectileDamage += 1;
            
            // Update health bar
            this.updateHealthBar();
            
            // Show level up notification
            const centerX = GAME_WIDTH / 2;
            const centerY = GAME_HEIGHT / 2;
            const text = this.scene.add.text(centerX, centerY, 'LEVEL UP!', {
                fontSize: '48px',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 6
            }).setOrigin(0.5).setDepth(1000);
            
            this.scene.tweens.add({
                targets: text,
                alpha: 0,
                y: 300,
                duration: 2000,
                onComplete: () => text.destroy()
            });
        }
    }
    
    gainMoney(amount) {
        this.stats.money += amount;
    }
    
    canAfford(cost) {
        return this.stats.money >= cost;
    }
    
    spendMoney(amount) {
        if (this.canAfford(amount)) {
            this.stats.money -= amount;
            return true;
        }
        return false;
    }
    
    getPosition() {
        return { x: this.sprite.x, y: this.sprite.y };
    }
    
    getStats() {
        return this.stats;
    }
}