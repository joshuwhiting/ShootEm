import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../index';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        
        // Constants
        this.XP_LEVEL_MULTIPLIER = 1.5;
        
        // Game state
        this.player = null;
        this.enemies = null;
        this.projectiles = null;
        this.turrets = null;
        this.cursors = null;
        this.keys = {};
        
        // Player stats
        this.playerStats = {
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
            money: 0
        };
        
        // Turret stats
        this.turretCost = 50;
        this.turretStats = {
            fireRate: 1000,
            projectileSpeed: 300,
            projectileDamage: 15,
            range: 300
        };
        
        // Enemy spawn
        this.enemySpawnTimer = 0;
        this.enemySpawnRate = 2000;
        this.wave = 1;
    }
    
    create() {
        // Create groups
        this.enemies = this.physics.add.group();
        this.projectiles = this.physics.add.group();
        this.turrets = this.physics.add.group();
        
        // Create player
        this.createPlayer();
        
        // Setup controls
        this.setupControls();
        
        // Setup collisions
        this.physics.add.overlap(
            this.projectiles,
            this.enemies,
            this.hitEnemy,
            null,
            this
        );
        
        this.physics.add.overlap(
            this.player,
            this.enemies,
            this.playerHit,
            null,
            this
        );
        
        // Start UI scene
        this.scene.launch('UIScene', { gameScene: this });
        
        // Instructions
        const centerX = GAME_WIDTH / 2;
        this.add.text(centerX, 50, 'WASD: Move | Auto-Shoot | T: Place Turret (50 gold)', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    }
    
    createPlayer() {
        // Create player sprite
        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;
        this.player = this.add.circle(centerX, centerY, 15, 0x00ff00);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setCircle(15);
    }
    
    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys.W = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keys.A = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keys.S = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keys.D = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keys.T = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
        
        // Turret placement
        this.keys.T.on('down', () => {
            this.placeTurret();
        });
    }
    
    update(time, delta) {
        if (!this.player || this.playerStats.health <= 0) return;
        
        // Player movement
        this.updatePlayerMovement();
        
        // Auto-shoot
        this.updateShooting(time);
        
        // Spawn enemies
        this.updateEnemySpawning(time, delta);
        
        // Update enemies (move towards player)
        this.updateEnemies();
        
        // Update turrets
        this.updateTurrets(time);
    }
    
    updatePlayerMovement() {
        let velocityX = 0;
        let velocityY = 0;
        
        if (this.keys.A.isDown || this.cursors.left.isDown) {
            velocityX = -this.playerStats.speed;
        } else if (this.keys.D.isDown || this.cursors.right.isDown) {
            velocityX = this.playerStats.speed;
        }
        
        if (this.keys.W.isDown || this.cursors.up.isDown) {
            velocityY = -this.playerStats.speed;
        } else if (this.keys.S.isDown || this.cursors.down.isDown) {
            velocityY = this.playerStats.speed;
        }
        
        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }
        
        this.player.body.setVelocity(velocityX, velocityY);
    }
    
    updateShooting(time) {
        if (time > this.playerStats.lastFired + this.playerStats.fireRate) {
            this.playerStats.lastFired = time;
            
            // Find nearest enemy
            let nearestEnemy = this.findNearestEnemy();
            if (nearestEnemy) {
                this.shootAt(
                    this.player.x,
                    this.player.y,
                    nearestEnemy.x,
                    nearestEnemy.y,
                    this.playerStats.projectileSpeed,
                    this.playerStats.projectileDamage,
                    0x00ffff
                );
            }
        }
    }
    
    shootAt(fromX, fromY, toX, toY, speed, damage, color) {
        const projectile = this.add.circle(fromX, fromY, 5, color);
        this.physics.add.existing(projectile);
        projectile.setData('damage', damage);
        
        // Calculate direction
        const angle = Math.atan2(toY - fromY, toX - fromX);
        projectile.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        
        this.projectiles.add(projectile);
        
        // Remove projectile after 3 seconds
        this.time.delayedCall(3000, () => {
            if (projectile && projectile.active) {
                projectile.destroy();
            }
        });
    }
    
    findNearestEnemy() {
        let nearest = null;
        let minDistance = Infinity;
        
        this.enemies.children.entries.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                enemy.x,
                enemy.y
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                nearest = enemy;
            }
        });
        
        return nearest;
    }
    
    updateEnemySpawning(time, delta) {
        this.enemySpawnTimer += delta;
        
        if (this.enemySpawnTimer >= this.enemySpawnRate) {
            this.enemySpawnTimer = 0;
            this.spawnEnemy();
        }
    }
    
    spawnEnemy() {
        // Spawn at random edge of screen
        let x, y;
        const edge = Math.floor(Math.random() * 4);
        const spawnMargin = 20;
        
        switch(edge) {
            case 0: // top
                x = Math.random() * GAME_WIDTH;
                y = -spawnMargin;
                break;
            case 1: // right
                x = GAME_WIDTH + spawnMargin;
                y = Math.random() * GAME_HEIGHT;
                break;
            case 2: // bottom
                x = Math.random() * GAME_WIDTH;
                y = GAME_HEIGHT + spawnMargin;
                break;
            case 3: // left
                x = -spawnMargin;
                y = Math.random() * GAME_HEIGHT;
                break;
        }
        
        const enemy = this.add.circle(x, y, 12, 0xff0000);
        this.physics.add.existing(enemy);
        enemy.body.setCircle(12);
        
        // Enemy stats
        const baseHealth = 30 + (this.wave * 10);
        enemy.setData('health', baseHealth);
        enemy.setData('maxHealth', baseHealth);
        enemy.setData('speed', 50 + (this.wave * 5));
        enemy.setData('xpValue', 10 + (this.wave * 2));
        enemy.setData('moneyValue', 5 + this.wave);
        
        this.enemies.add(enemy);
    }
    
    updateEnemies() {
        this.enemies.children.entries.forEach(enemy => {
            if (!this.player) return;
            
            const speed = enemy.getData('speed');
            this.physics.moveToObject(enemy, this.player, speed);
        });
    }
    
    hitEnemy(projectile, enemy) {
        const damage = projectile.getData('damage');
        let health = enemy.getData('health');
        health -= damage;
        
        if (health <= 0) {
            // Enemy died - grant XP and money
            const xpValue = enemy.getData('xpValue');
            const moneyValue = enemy.getData('moneyValue');
            
            this.gainXP(xpValue);
            this.gainMoney(moneyValue);
            
            // Visual feedback
            const explosion = this.add.circle(enemy.x, enemy.y, 20, 0xff8800, 0.5);
            this.tweens.add({
                targets: explosion,
                alpha: 0,
                scale: 2,
                duration: 300,
                onComplete: () => explosion.destroy()
            });
            
            enemy.destroy();
        } else {
            enemy.setData('health', health);
            // Visual feedback for hit
            enemy.setFillStyle(0xff6666);
            this.time.delayedCall(100, () => {
                if (enemy && enemy.active) {
                    enemy.setFillStyle(0xff0000);
                }
            });
        }
        
        projectile.destroy();
    }
    
    playerHit(player, enemy) {
        // Damage player
        this.playerStats.health -= 5;
        
        // Visual feedback
        player.setFillStyle(0xffff00);
        this.time.delayedCall(100, () => {
            if (player && player.active) {
                player.setFillStyle(0x00ff00);
            }
        });
        
        // Check for game over
        if (this.playerStats.health <= 0) {
            this.gameOver();
        }
        
        // Push enemy back slightly
        const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
        enemy.body.setVelocity(
            Math.cos(angle) * 200,
            Math.sin(angle) * 200
        );
    }
    
    gainXP(amount) {
        this.playerStats.xp += amount;
        
        // Check for level up
        while (this.playerStats.xp >= this.playerStats.xpToNextLevel) {
            this.playerStats.xp -= this.playerStats.xpToNextLevel;
            this.playerStats.level++;
            this.playerStats.xpToNextLevel = Math.floor(this.playerStats.xpToNextLevel * this.XP_LEVEL_MULTIPLIER);
            
            // Level up rewards
            this.playerStats.maxHealth += 20;
            this.playerStats.health = this.playerStats.maxHealth;
            
            // Show level up notification
            const centerX = GAME_WIDTH / 2;
            const centerY = GAME_HEIGHT / 2;
            const text = this.add.text(centerX, centerY, 'LEVEL UP!', {
                fontSize: '48px',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 6
            }).setOrigin(0.5).setDepth(1000);
            
            this.tweens.add({
                targets: text,
                alpha: 0,
                y: 300,
                duration: 2000,
                onComplete: () => text.destroy()
            });
        }
    }
    
    gainMoney(amount) {
        this.playerStats.money += amount;
    }
    
    placeTurret() {
        if (this.playerStats.money < this.turretCost) {
            // Not enough money
            const text = this.add.text(this.player.x, this.player.y - 30, 'Not enough gold!', {
                fontSize: '16px',
                color: '#ff0000'
            }).setOrigin(0.5);
            
            this.tweens.add({
                targets: text,
                alpha: 0,
                y: text.y - 30,
                duration: 1000,
                onComplete: () => text.destroy()
            });
            return;
        }
        
        this.playerStats.money -= this.turretCost;
        
        // Create turret at player position
        const turret = this.add.rectangle(this.player.x, this.player.y, 30, 30, 0x0088ff);
        this.physics.add.existing(turret);
        turret.body.setImmovable(true);
        
        turret.setData('lastFired', 0);
        turret.setData('fireRate', this.turretStats.fireRate);
        turret.setData('range', this.turretStats.range);
        turret.setData('projectileSpeed', this.turretStats.projectileSpeed);
        turret.setData('damage', this.turretStats.projectileDamage);
        
        this.turrets.add(turret);
    }
    
    updateTurrets(time) {
        this.turrets.children.entries.forEach(turret => {
            const lastFired = turret.getData('lastFired');
            const fireRate = turret.getData('fireRate');
            const range = turret.getData('range');
            
            if (time > lastFired + fireRate) {
                // Find enemy in range
                const target = this.findEnemyInRange(turret, range);
                
                if (target) {
                    turret.setData('lastFired', time);
                    
                    this.shootAt(
                        turret.x,
                        turret.y,
                        target.x,
                        target.y,
                        turret.getData('projectileSpeed'),
                        turret.getData('damage'),
                        0x00aaff
                    );
                }
            }
        });
    }
    
    findEnemyInRange(turret, range) {
        let nearest = null;
        let minDistance = Infinity;
        
        this.enemies.children.entries.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(
                turret.x,
                turret.y,
                enemy.x,
                enemy.y
            );
            
            if (distance < range && distance < minDistance) {
                minDistance = distance;
                nearest = enemy;
            }
        });
        
        return nearest;
    }
    
    gameOver() {
        // Stop the game
        this.physics.pause();
        
        // Show game over screen
        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;
        const bg = this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8).setDepth(2000);
        
        const text = this.add.text(centerX, 300, 'GAME OVER', {
            fontSize: '64px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(2001);
        
        const statsText = this.add.text(centerX, 380, 
            `Level: ${this.playerStats.level}\nWave: ${this.wave}\n\nPress R to Restart`, {
            fontSize: '24px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setDepth(2001);
        
        // Restart on R key
        const restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        restartKey.on('down', () => {
            this.scene.restart();
            this.scene.stop('UIScene');
            this.scene.launch('UIScene', { gameScene: this });
        });
    }
}
