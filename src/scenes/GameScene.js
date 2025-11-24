import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../index';
import Player from '../entities/Player';
import EnemyManager from '../entities/EnemyManager';
import TurretManager from '../entities/TurretManager';


export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        
        // Game entities
        this.player = null;
        this.enemyManager = null;
        this.turretManager = null;
        this.projectiles = null;
        this.cursors = null;
        this.keys = {};
        
        // Grid settings
        this.TILE_SIZE = 32;
        this.GRID_WIDTH = 40;
        this.GRID_HEIGHT = 25;
    }
    
    preload() {
        // Create a simple tileset texture programmatically
        this.createTilesetTexture();
    }
    
    
    createTilesetTexture() {
        // Create a canvas for our tileset
        const canvas = this.add.graphics();
        
        // Create wall tile (dark gray)
        canvas.fillStyle(0x444444);
        canvas.fillRect(0, 0, this.TILE_SIZE, this.TILE_SIZE);
        canvas.lineStyle(1, 0x666666);
        canvas.strokeRect(0, 0, this.TILE_SIZE, this.TILE_SIZE);
        
        // Create floor tile (light gray)
        canvas.fillStyle(0x888888);
        canvas.fillRect(this.TILE_SIZE, 0, this.TILE_SIZE, this.TILE_SIZE);
        canvas.lineStyle(1, 0xaaaaaa);
        canvas.strokeRect(this.TILE_SIZE, 0, this.TILE_SIZE, this.TILE_SIZE);
        
        // Generate texture from graphics
        canvas.generateTexture('tileset', this.TILE_SIZE * 2, this.TILE_SIZE);
        canvas.destroy();
    }
    
    createTilemapData() {
        // Create tilemap data programmatically
        const mapData = [];
        
        for (let y = 0; y < this.GRID_HEIGHT; y++) {
            const row = [];
            for (let x = 0; x < this.GRID_WIDTH; x++) {
                // Create walls around the border, floor everywhere else
                if (x === 0 || x === this.GRID_WIDTH - 1 || y === 0 || y === this.GRID_HEIGHT - 1) {
                    row.push(1); // Wall tile
                } else {
                    row.push(2); // Floor tile
                }
            }
            mapData.push(row);
        }
        
        return mapData;
    }
    
    create() {
        // For now, let's create a simple world without Grid Engine tilemap collision
        // and use physics collision instead to get the game working
        
        // Create a simple background
        this.createSimpleBackground();
        
        // Create invisible walls for physics collision
        this.createPhysicsWalls();
        
        // Create projectiles group
        this.projectiles = this.physics.add.group();
        
        // Create game entities
        this.player = new Player(this);
        this.enemyManager = new EnemyManager(this);
        this.turretManager = new TurretManager(this);
        
        // Initialize entities
        const playerSprite = this.player.create();
        const enemiesGroup = this.enemyManager.create();
        const turretsGroup = this.turretManager.create();
        
        // Setup controls
        this.setupControls();
        
        // Setup collisions with walls
        this.physics.add.collider(playerSprite, this.walls);
        this.physics.add.collider(enemiesGroup, this.walls);
        
        // Setup collisions with turrets
        this.physics.add.collider(playerSprite, turretsGroup);
        this.physics.add.collider(enemiesGroup, turretsGroup);
        
        // Setup entity collisions
        this.physics.add.overlap(
            this.projectiles,
            enemiesGroup,
            (projectile, enemy) => this.enemyManager.hitEnemy(
                projectile, 
                enemy, 
                (xp, money) => {
                    this.player.gainXP(xp);
                    this.player.gainMoney(money);
                }
            ),
            null,
            this
        );
        
        this.physics.add.overlap(
            playerSprite,
            enemiesGroup,
            (player, enemy) => {
                this.enemyManager.playerHit(player, enemy, (damage) => {
                    const isGameOver = this.player.takeDamage(damage);
                    if (isGameOver) {
                        this.gameOver();
                    }
                });
            },
            null,
            this
        );
        
        // Setup camera to follow player with pixel-perfect positioning
        this.cameras.main.startFollow(playerSprite);
        this.cameras.main.setBounds(0, 0, this.GRID_WIDTH * this.TILE_SIZE, this.GRID_HEIGHT * this.TILE_SIZE);
        this.cameras.main.roundPixels = true; // Force pixel-perfect camera
        
        // Start UI scene
        this.scene.launch('UIScene', { gameScene: this });
        
        // Instructions
        const centerX = GAME_WIDTH / 2;
        this.add.text(centerX, 50, 'WASD: Move | Auto-Shoot | T: Open Turret Shop', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    }
    
    createSimpleBackground() {
        // Create a simple tiled background
        const graphics = this.add.graphics();
        
        for (let x = 0; x < this.GRID_WIDTH; x++) {
            for (let y = 0; y < this.GRID_HEIGHT; y++) {
                const isWall = (x === 0 || x === this.GRID_WIDTH - 1 || y === 0 || y === this.GRID_HEIGHT - 1);
                
                graphics.fillStyle(isWall ? 0x444444 : 0x888888);
                graphics.fillRect(x * this.TILE_SIZE, y * this.TILE_SIZE, this.TILE_SIZE, this.TILE_SIZE);
                
                graphics.lineStyle(1, 0x666666);
                graphics.strokeRect(x * this.TILE_SIZE, y * this.TILE_SIZE, this.TILE_SIZE, this.TILE_SIZE);
            }
        }
    }
    
    createPhysicsWalls() {
        this.walls = this.physics.add.staticGroup();
        
        // Create border walls
        // Top wall
        const topWall = this.add.rectangle(this.GRID_WIDTH * this.TILE_SIZE / 2, this.TILE_SIZE / 2, 
            this.GRID_WIDTH * this.TILE_SIZE, this.TILE_SIZE, 0x444444, 0);
        this.physics.add.existing(topWall, true);
        this.walls.add(topWall);
        
        // Bottom wall
        const bottomWall = this.add.rectangle(this.GRID_WIDTH * this.TILE_SIZE / 2, 
            (this.GRID_HEIGHT - 0.5) * this.TILE_SIZE, 
            this.GRID_WIDTH * this.TILE_SIZE, this.TILE_SIZE, 0x444444, 0);
        this.physics.add.existing(bottomWall, true);
        this.walls.add(bottomWall);
        
        // Left wall
        const leftWall = this.add.rectangle(this.TILE_SIZE / 2, this.GRID_HEIGHT * this.TILE_SIZE / 2, 
            this.TILE_SIZE, this.GRID_HEIGHT * this.TILE_SIZE, 0x444444, 0);
        this.physics.add.existing(leftWall, true);
        this.walls.add(leftWall);
        
        // Right wall
        const rightWall = this.add.rectangle((this.GRID_WIDTH - 0.5) * this.TILE_SIZE, 
            this.GRID_HEIGHT * this.TILE_SIZE / 2, 
            this.TILE_SIZE, this.GRID_HEIGHT * this.TILE_SIZE, 0x444444, 0);
        this.physics.add.existing(rightWall, true);
        this.walls.add(rightWall);
    }
    
    
    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys.W = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keys.A = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keys.S = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keys.D = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keys.T = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
        
        // Turret menu opening
        this.keys.T.on('down', () => {
            // Only open menu if not already in placement mode
            if (!this.turretManager.isInPlacementMode()) {
                this.turretManager.openTurretMenu();
            }
        });
    }
    
    update(time, delta) {
        if (!this.player || this.player.getStats().health <= 0) return;
        
        // Player movement
        this.player.updateMovement(this.keys, this.cursors);
        
        // Update turret placement preview if in placement mode
        this.turretManager.updatePlacementPreview();
        
        // Auto-shoot
        this.player.updateShooting(
            time,
            () => this.enemyManager.findNearestEnemy(this.player.getPosition()),
            (fromX, fromY, toX, toY, speed, damage, color) => this.shootAt(fromX, fromY, toX, toY, speed, damage, color)
        );
        
        // Spawn enemies
        this.enemyManager.updateSpawning(time, delta);
        
        // Update enemies (move towards player)
        this.enemyManager.updateEnemies(this.player.sprite);
        
        // Update turrets
        this.turretManager.updateTurrets(
            time,
            (pos, range) => this.enemyManager.findEnemyInRange(pos, range),
            (fromX, fromY, toX, toY, speed, damage, color) => this.shootAt(fromX, fromY, toX, toY, speed, damage, color)
        );
    }
    
    shootAt(fromX, fromY, toX, toY, speed, damage, color) {
        // Create projectile as a simple circle
        const projectile = this.add.circle(fromX, fromY, 5, color);
        
        // Add physics to the projectile
        this.physics.add.existing(projectile);
        
        // Set projectile data
        projectile.setData('damage', damage);
        
        // Add to projectiles group
        this.projectiles.add(projectile);
        
        // Calculate direction and set velocity
        const angle = Math.atan2(toY - fromY, toX - fromX);
        projectile.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        
        // Make sure projectile can move freely
        projectile.body.setCollideWorldBounds(false);
        
        // Remove projectile after 3 seconds or when it goes off screen
        this.time.delayedCall(3000, () => {
            if (projectile && projectile.active) {
                projectile.destroy();
            }
        });
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
        
        const playerStats = this.player.getStats();
        const statsText = this.add.text(centerX, 380, 
            `Level: ${playerStats.level}\nWave: ${this.enemyManager.getCurrentWave()}\n\nPress R to Restart`, {
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
    
    // Getter methods for UI Scene
    getPlayerStats() {
        return this.player ? this.player.getStats() : null;
    }
    
    getCurrentWave() {
        return this.enemyManager ? this.enemyManager.getCurrentWave() : 1;
    }
    
    getTurretCost() {
        return this.turretManager ? this.turretManager.getTurretCost() : 50;
    }
}
