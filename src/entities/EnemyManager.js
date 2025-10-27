import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../index';

export default class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        this.enemies = null;
        this.spawnTimer = 0;
        this.spawnRate = 2000;
        this.wave = 1;
        this.enemyCounter = 0; // For unique enemy IDs
    }
    
    create() {
        this.enemies = this.scene.physics.add.group();
        return this.enemies;
    }
    
    updateSpawning(time, delta) {
        this.spawnTimer += delta;
        
        if (this.spawnTimer >= this.spawnRate) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }
    }
    
    spawnEnemy() {
        // Spawn at random edge of the arena (avoiding walls)
        let x, y;
        const spawnMargin = 50; // Margin from walls
        const arenaWidth = 40 * 32; // GRID_WIDTH * TILE_SIZE
        const arenaHeight = 25 * 32; // GRID_HEIGHT * TILE_SIZE
        
        const edge = Math.floor(Math.random() * 4);
        
        switch(edge) {
            case 0: // top
                x = spawnMargin + Math.random() * (arenaWidth - spawnMargin * 2);
                y = spawnMargin;
                break;
            case 1: // right
                x = arenaWidth - spawnMargin;
                y = spawnMargin + Math.random() * (arenaHeight - spawnMargin * 2);
                break;
            case 2: // bottom
                x = spawnMargin + Math.random() * (arenaWidth - spawnMargin * 2);
                y = arenaHeight - spawnMargin;
                break;
            case 3: // left
                x = spawnMargin;
                y = spawnMargin + Math.random() * (arenaHeight - spawnMargin * 2);
                break;
        }
        
        const enemy = this.scene.add.circle(x, y, 12, 0xff0000);
        this.scene.physics.add.existing(enemy);
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
    
    updateEnemies(playerSprite) {
        if (!playerSprite) return;
        
        this.enemies.children.entries.forEach(enemy => {
            const speed = enemy.getData('speed');
            this.scene.physics.moveToObject(enemy, playerSprite, speed);
        });
    }
    
    findNearestEnemy(playerPosition) {
        let nearest = null;
        let minDistance = Infinity;
        
        this.enemies.children.entries.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(
                playerPosition.x,
                playerPosition.y,
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
    
    findEnemyInRange(position, range) {
        let nearest = null;
        let minDistance = Infinity;
        
        this.enemies.children.entries.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(
                position.x,
                position.y,
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
    
    hitEnemy(projectile, enemy, onEnemyKilled) {
        const damage = projectile.getData('damage');
        let health = enemy.getData('health');
        health -= damage;
        
        if (health <= 0) {
            // Enemy died - grant XP and money
            const xpValue = enemy.getData('xpValue');
            const moneyValue = enemy.getData('moneyValue');
            
            // Call callback for rewards
            if (onEnemyKilled) {
                onEnemyKilled(xpValue, moneyValue);
            }
            
            // Visual feedback
            const explosion = this.scene.add.circle(enemy.x, enemy.y, 20, 0xff8800, 0.5);
            this.scene.tweens.add({
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
            this.scene.time.delayedCall(100, () => {
                if (enemy && enemy.active) {
                    enemy.setFillStyle(0xff0000);
                }
            });
        }
        
        projectile.destroy();
    }
    
    playerHit(playerSprite, enemy, onPlayerHit) {
        // Call callback for player damage
        if (onPlayerHit) {
            onPlayerHit(5);
        }
        
        // Push enemy back slightly
        const angle = Math.atan2(enemy.y - playerSprite.y, enemy.x - playerSprite.x);
        enemy.body.setVelocity(
            Math.cos(angle) * 200,
            Math.sin(angle) * 200
        );
    }
    
    getEnemiesGroup() {
        return this.enemies;
    }
    
    getCurrentWave() {
        return this.wave;
    }
    
    setWave(wave) {
        this.wave = wave;
    }
}