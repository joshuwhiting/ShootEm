import Phaser from 'phaser';

export default class TurretManager {
    constructor(scene) {
        this.scene = scene;
        this.turrets = null;
        
        // Define different turret types
        this.turretTypes = {
            basic: {
                name: 'Basic Turret',
                cost: 50,
                color: 0x0088ff,
                fireRate: 1000,
                projectileSpeed: 300,
                projectileDamage: 15,
                range: 300,
                description: 'Standard turret with balanced stats'
            },
            rapid: {
                name: 'Rapid Fire',
                cost: 75,
                color: 0xff8800,
                fireRate: 500,
                projectileSpeed: 350,
                projectileDamage: 8,
                range: 250,
                description: 'Fast firing but lower damage'
            },
            heavy: {
                name: 'Heavy Cannon',
                cost: 120,
                color: 0xff0000,
                fireRate: 2000,
                projectileSpeed: 200,
                projectileDamage: 40,
                range: 400,
                description: 'Slow but devastating damage'
            },
            sniper: {
                name: 'Sniper Tower',
                cost: 100,
                color: 0x00ff00,
                fireRate: 1500,
                projectileSpeed: 500,
                projectileDamage: 25,
                range: 500,
                description: 'Long range precision shots'
            }
        };
        
        // Grid settings
        this.GRID_SIZE = 32; // Size of each grid cell
        this.placedPositions = new Set(); // Track occupied grid positions
        
        // Menu state
        this.buyMenu = null;
        this.selectedTurretType = 'basic';
        this.placementMode = false;
        this.sellMode = false;
        this.sellPercentage = 0.75; // 75% refund when selling
    }
    
    create() {
        this.turrets = this.scene.physics.add.staticGroup();
        this.createBuyMenu();
        return this.turrets;
    }
    
    createBuyMenu() {
        // Create the buy menu container (initially hidden)
        this.buyMenu = this.scene.add.container(0, 0).setDepth(2000); // Increased depth to ensure it's on top
        this.buyMenu.setVisible(false);
        this.buyMenu.setScrollFactor(0); // Keep it on screen regardless of camera
        
        // Menu background
        const menuWidth = 400;
        const turretTypeKeys = Object.keys(this.turretTypes);
        const turretButtonHeight = 60;
        const menuHeight = 150 + (turretTypeKeys.length * (turretButtonHeight + 10)) + 80; // Dynamic height based on turret count
        const menuX = this.scene.cameras.main.width / 2;
        const menuY = this.scene.cameras.main.height / 2;
        
        const background = this.scene.add.rectangle(0, 0, menuWidth, menuHeight, 0x000000, 0.9);
        background.setStrokeStyle(3, 0xffffff);
        this.buyMenu.add(background);
        
        // Title
        const title = this.scene.add.text(0, -140, 'Turret Shop', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.buyMenu.add(title);
        
        // Create turret option buttons
        const typeKeys = Object.keys(this.turretTypes);
        const buttonHeight = 60;
        const startY = -80;
        
        this.turretButtons = [];
        
        typeKeys.forEach((typeKey, index) => {
            const turretType = this.turretTypes[typeKey];
            const buttonY = startY + (index * (buttonHeight + 10));
            
            // Button background
            const button = this.scene.add.rectangle(0, buttonY, 350, buttonHeight, 0x333333);
            button.setStrokeStyle(2, typeKey === this.selectedTurretType ? 0x00ff00 : 0x666666);
            button.setInteractive({ useHandCursor: true });
            
            // Turret preview (small colored square)
            const preview = this.scene.add.rectangle(-150, buttonY, 20, 20, turretType.color);
            
            // Turret info text
            const infoText = this.scene.add.text(-120, buttonY - 15, 
                `${turretType.name} - ${turretType.cost}g`, {
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);
            
            const descText = this.scene.add.text(-120, buttonY + 5, 
                turretType.description, {
                fontSize: '12px',
                color: '#cccccc'
            }).setOrigin(0, 0.5);
            
            const statsText = this.scene.add.text(-120, buttonY + 20, 
                `DMG: ${turretType.projectileDamage} | Range: ${turretType.range} | Rate: ${(1000/turretType.fireRate).toFixed(1)}/s`, {
                fontSize: '10px',
                color: '#aaaaaa'
            }).setOrigin(0, 0.5);
            
            // Button click handler
            button.on('pointerdown', (pointer, localX, localY, event) => {
                console.log(`Button clicked for turret type: ${typeKey}`);
                event.stopPropagation(); // Prevent event bubbling
                this.selectTurretType(typeKey);
            });
            
            // Hover effects
            button.on('pointerover', () => {
                console.log(`Hovering over ${typeKey} button`);
                button.setFillStyle(0x444444);
            });
            
            button.on('pointerout', () => {
                button.setFillStyle(0x333333);
            });
            
            this.buyMenu.add([button, preview, infoText, descText, statsText]);
            this.turretButtons.push({ button, typeKey });
        });
        
        // Calculate close button position below all turret options
        const closeButtonY = startY + (typeKeys.length * (buttonHeight + 10)) + 30;
        
        // Close button
        const closeButton = this.scene.add.rectangle(0, closeButtonY, 100, 30, 0x666666);
        closeButton.setStrokeStyle(2, 0xffffff);
        closeButton.setInteractive({ useHandCursor: true });
        
        const closeText = this.scene.add.text(0, closeButtonY, 'Close', {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        closeButton.on('pointerdown', (pointer, localX, localY, event) => {
            console.log('Close button clicked');
            event.stopPropagation(); // Prevent event bubbling
            this.closeBuyMenu();
        });
        
        closeButton.on('pointerover', () => {
            console.log('Hovering over close button');
            closeButton.setFillStyle(0x888888);
        });
        
        closeButton.on('pointerout', () => {
            closeButton.setFillStyle(0x666666);
        });
        
        this.buyMenu.add([closeButton, closeText]);
        
        // Don't position the menu here - we'll do it when opening
        console.log('Buy menu created successfully');
    }
    
    openBuyMenu() {
        console.log('Opening buy menu...');
        
        // Close any sell dialogs first
        this.hideSellDialog();
        
        if (this.buyMenu) {
            this.buyMenu.setVisible(true);
            // Position the menu in the center of the camera view
            const camera = this.scene.cameras.main;
            this.buyMenu.setPosition(camera.scrollX + camera.width / 2, camera.scrollY + camera.height / 2);
            console.log('Buy menu should now be visible');
        } else {
            console.log('Buy menu is null!');
        }
    }
    
    closeBuyMenu() {
        console.log('Closing buy menu...');
        if (this.buyMenu) {
            this.buyMenu.setVisible(false);
        }
    }
    
    selectTurretType(typeKey) {
        this.selectedTurretType = typeKey;
        
        // Update button highlights
        this.turretButtons.forEach(({ button, typeKey: btnTypeKey }) => {
            const strokeColor = btnTypeKey === typeKey ? 0x00ff00 : 0x666666;
            button.setStrokeStyle(2, strokeColor);
        });
        
        // Close menu and enter placement mode
        this.closeBuyMenu();
        this.enterPlacementMode();
    }
    
    enterPlacementMode() {
        this.placementMode = true;
        
        // Show instruction text
        const instruction = this.scene.add.text(
            this.scene.cameras.main.width / 2, 
            50, 
            `Click to place ${this.turretTypes[this.selectedTurretType].name} | ESC to cancel`, 
            {
                fontSize: '16px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
        
        this.placementInstruction = instruction;
        
        // Set up click handler for placement
        this.scene.input.on('pointerdown', this.handlePlacementClick, this);
        
        // Set up ESC key to cancel
        this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey.on('down', () => {
            this.exitPlacementMode();
        });
    }
    
    exitPlacementMode() {
        this.placementMode = false;
        
        // Remove instruction text
        if (this.placementInstruction) {
            this.placementInstruction.destroy();
            this.placementInstruction = null;
        }
        
        // Remove click handler
        this.scene.input.off('pointerdown', this.handlePlacementClick, this);
        
        // Remove ESC key handler
        if (this.escKey) {
            this.escKey.off('down');
            this.escKey = null;
        }
        
        // Hide preview and range indicator
        this.hidePlacementPreview();
    }
    
    handlePlacementClick(pointer) {
        if (!this.placementMode) return;
        
        // Close any sell dialogs
        this.hideSellDialog();
        
        // Convert screen coordinates to world coordinates
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        
        // Try to place turret
        const placed = this.placeTurret(
            worldPoint.x,
            worldPoint.y,
            (cost) => this.scene.player.canAfford(cost),
            (cost) => this.scene.player.spendMoney(cost)
        );
        
        // Always exit placement mode after attempting to place (whether successful or not)
        this.exitPlacementMode();
    }
    
    // Convert world coordinates to grid coordinates
    worldToGrid(x, y) {
        return {
            gridX: Math.floor(x / this.GRID_SIZE),
            gridY: Math.floor(y / this.GRID_SIZE)
        };
    }
    
    // Convert grid coordinates to world coordinates (centered in grid cell)
    gridToWorld(gridX, gridY) {
        return {
            x: gridX * this.GRID_SIZE + this.GRID_SIZE / 2,
            y: gridY * this.GRID_SIZE + this.GRID_SIZE / 2
        };
    }
    
    // Create a position key for tracking occupied positions
    getPositionKey(gridX, gridY) {
        return `${gridX},${gridY}`;
    }
    
    // Check if a grid position is valid for turret placement
    isValidGridPosition(gridX, gridY, playerPosition = null) {
        // Check if position is within arena bounds (avoiding walls)
        const minGrid = 2; // Stay away from walls
        const maxGridX = 38; // 40 - 2
        const maxGridY = 23; // 25 - 2
        
        if (gridX < minGrid || gridX > maxGridX || gridY < minGrid || gridY > maxGridY) {
            return false;
        }
        
        // Check if turret would be placed on or too close to player
        if (playerPosition) {
            const { x: worldX, y: worldY } = this.gridToWorld(gridX, gridY);
            const distanceToPlayer = Phaser.Math.Distance.Between(
                worldX, worldY, 
                playerPosition.x, playerPosition.y
            );
            
            // Prevent placement if too close to player (within 40 pixels)
            if (distanceToPlayer < 40) {
                return false;
            }
        }
        
        // Check if position is already occupied
        const positionKey = this.getPositionKey(gridX, gridY);
        if (this.placedPositions.has(positionKey)) {
            return false;
        }
        
        // Double-check by looking for existing turrets at this world position
        const { x: worldX, y: worldY } = this.gridToWorld(gridX, gridY);
        const existingTurret = this.turrets.children.entries.find(turret => {
            const distance = Phaser.Math.Distance.Between(turret.x, turret.y, worldX, worldY);
            return distance < 16; // Within half a grid cell
        });
        
        if (existingTurret) {
            return false;
        }
        
        return true;
    }
    
    // Find the nearest valid position around a given grid position
    findNearestValidPosition(centerGridX, centerGridY, playerPosition) {
        // Search in expanding circles around the center position
        for (let radius = 2; radius <= 5; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    // Skip positions that are not on the edge of the current radius
                    if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) {
                        continue;
                    }
                    
                    const testGridX = centerGridX + dx;
                    const testGridY = centerGridY + dy;
                    
                    if (this.isValidGridPosition(testGridX, testGridY, playerPosition)) {
                        return { gridX: testGridX, gridY: testGridY };
                    }
                }
            }
        }
        
        return null; // No valid position found
    }
    
    placeTurret(x, y, canAfford, spendMoney) {
        const turretType = this.turretTypes[this.selectedTurretType];
        
        if (!canAfford(turretType.cost)) {
            // Not enough money - show message
            const text = this.scene.add.text(x, y - 30, 'Not enough gold!', {
                fontSize: '16px',
                color: '#ff0000'
            }).setOrigin(0.5);
            
            this.scene.tweens.add({
                targets: text,
                alpha: 0,
                y: text.y - 30,
                duration: 1000,
                onComplete: () => text.destroy()
            });
            return false;
        }
        
        const playerPosition = this.scene.player ? this.scene.player.getPosition() : { x, y };
        
        // Convert world position to grid position
        let { gridX, gridY } = this.worldToGrid(x, y);
        
        // If the initial position is too close to player, find nearest valid position
        if (!this.isValidGridPosition(gridX, gridY, playerPosition)) {
            const nearestPosition = this.findNearestValidPosition(gridX, gridY, playerPosition);
            
            if (nearestPosition) {
                gridX = nearestPosition.gridX;
                gridY = nearestPosition.gridY;
            } else {
                // No valid position found around the player
                const text = this.scene.add.text(x, y - 30, 'No valid position nearby!', {
                    fontSize: '16px',
                    color: '#ff0000'
                }).setOrigin(0.5);
                
                this.scene.tweens.add({
                    targets: text,
                    alpha: 0,
                    y: text.y - 30,
                    duration: 1000,
                    onComplete: () => text.destroy()
                });
                return false;
            }
        }
        
        // Spend money
        if (!spendMoney(turretType.cost)) {
            return false;
        }
        
        // Convert grid position back to world position (centered in grid cell)
        const { x: snapX, y: snapY } = this.gridToWorld(gridX, gridY);
        
        // Create turret at grid-aligned position with turret type color
        const turret = this.scene.add.rectangle(snapX, snapY, 30, 30, turretType.color);
        this.scene.physics.add.existing(turret, true); // true makes it static
        
        // Set a slightly smaller collision box for better movement feel
        turret.body.setSize(28, 28);
        
        // Make turret interactive for selling
        turret.setInteractive({ useHandCursor: true });
        
        // Store turret data including type
        turret.setData('lastFired', 0);
        turret.setData('fireRate', turretType.fireRate);
        turret.setData('range', turretType.range);
        turret.setData('projectileSpeed', turretType.projectileSpeed);
        turret.setData('damage', turretType.projectileDamage);
        turret.setData('gridX', gridX);
        turret.setData('gridY', gridY);
        turret.setData('type', this.selectedTurretType);
        turret.setData('color', turretType.color);
        turret.setData('originalCost', turretType.cost);
        
        // Add click handler for selling
        turret.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            this.showSellConfirmation(turret);
        });
        
        // Add hover effects for selling indication
        turret.on('pointerover', () => {
            // Show sell price on hover
            const sellPrice = Math.floor(turret.getData('originalCost') * this.sellPercentage);
            turret.sellHoverText = this.scene.add.text(turret.x, turret.y - 40, `Sell for ${sellPrice}g`, {
                fontSize: '12px',
                color: '#ffff00',
                backgroundColor: '#000000',
                padding: { x: 5, y: 2 }
            }).setOrigin(0.5).setDepth(1001);
            
            // Slightly highlight the turret
            turret.setAlpha(0.8);
        });
        
        turret.on('pointerout', () => {
            // Remove sell price text
            if (turret.sellHoverText) {
                turret.sellHoverText.destroy();
                turret.sellHoverText = null;
            }
            
            // Reset turret appearance
            turret.setAlpha(1);
        });
        
        // Mark this position as occupied
        const positionKey = this.getPositionKey(gridX, gridY);
        this.placedPositions.add(positionKey);
        
        // Add visual feedback for successful placement
        const successText = this.scene.add.text(snapX, snapY - 40, `${turretType.name} placed!`, {
            fontSize: '14px',
            color: '#00ff00'
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: successText,
            alpha: 0,
            y: successText.y - 20,
            duration: 1000,
            onComplete: () => successText.destroy()
        });
        
        this.turrets.add(turret);
        return true;
    }
    
    updateTurrets(time, findEnemyInRangeCallback, shootAtCallback) {
        this.turrets.children.entries.forEach(turret => {
            const lastFired = turret.getData('lastFired');
            const fireRate = turret.getData('fireRate');
            const range = turret.getData('range');
            
            if (time > lastFired + fireRate) {
                // Find enemy in range
                const target = findEnemyInRangeCallback({ x: turret.x, y: turret.y }, range);
                
                if (target) {
                    turret.setData('lastFired', time);
                    
                    shootAtCallback(
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
    
    // Method to remove a turret (for future features like selling/destroying)
    removeTurret(turret) {
        const gridX = turret.getData('gridX');
        const gridY = turret.getData('gridY');
        
        if (gridX !== undefined && gridY !== undefined) {
            const positionKey = this.getPositionKey(gridX, gridY);
            this.placedPositions.delete(positionKey);
        }
        
        turret.destroy();
    }
    
    // Show a preview of where the turret will be placed
    showPlacementPreview(x, y) {
        // Remove existing preview
        if (this.placementPreview) {
            this.placementPreview.destroy();
            this.placementPreview = null;
        }
        
        // Remove existing range indicator
        if (this.rangeIndicator) {
            this.rangeIndicator.destroy();
            this.rangeIndicator = null;
        }
        
        if (!this.placementMode) return;
        
        const turretType = this.turretTypes[this.selectedTurretType];
        const playerPosition = this.scene.player ? this.scene.player.getPosition() : { x, y };
        let { gridX, gridY } = this.worldToGrid(x, y);
        
        // If the initial position is invalid, try to find a nearby valid one
        if (!this.isValidGridPosition(gridX, gridY, playerPosition)) {
            const nearestPosition = this.findNearestValidPosition(gridX, gridY, playerPosition);
            if (nearestPosition) {
                gridX = nearestPosition.gridX;
                gridY = nearestPosition.gridY;
            }
        }
        
        const { x: snapX, y: snapY } = this.gridToWorld(gridX, gridY);
        
        // Determine preview color based on validity and affordability
        const isValid = this.isValidGridPosition(gridX, gridY, playerPosition);
        const canAfford = this.scene.player ? this.scene.player.canAfford(turretType.cost) : true;
        const canPlace = isValid && canAfford;
        
        let color, alpha;
        if (!canAfford) {
            color = 0xff0000; // Red for can't afford
            alpha = 0.3;
        } else if (!isValid) {
            color = 0xff8800; // Orange for invalid position
            alpha = 0.3;
        } else {
            color = turretType.color; // Turret's actual color for valid placement
            alpha = 0.6;
        }
        
        // Create preview rectangle
        this.placementPreview = this.scene.add.rectangle(snapX, snapY, 30, 30, color, alpha);
        this.placementPreview.setStrokeStyle(2, canPlace ? 0x00ff00 : 0xff0000);
        this.placementPreview.setDepth(1000); // Ensure it's on top
        
        // Add range indicator for valid placements
        if (canPlace) {
            this.rangeIndicator = this.scene.add.circle(snapX, snapY, turretType.range, 0x00ff00, 0.1);
            this.rangeIndicator.setStrokeStyle(1, 0x00ff00, 0.3);
            this.rangeIndicator.setDepth(999);
        }
    }
    
    // Hide the placement preview
    hidePlacementPreview() {
        if (this.placementPreview) {
            this.placementPreview.destroy();
            this.placementPreview = null;
        }
        if (this.rangeIndicator) {
            this.rangeIndicator.destroy();
            this.rangeIndicator = null;
        }
    }
    
    // Show sell confirmation dialog
    showSellConfirmation(turret) {
        const turretType = this.turretTypes[turret.getData('type')];
        const sellPrice = Math.floor(turret.getData('originalCost') * this.sellPercentage);
        
        // Remove any existing sell dialog
        this.hideSellDialog();
        
        // Create sell dialog container
        this.sellDialog = this.scene.add.container(0, 0).setDepth(2500);
        this.sellDialog.setScrollFactor(0);
        
        // Position relative to camera
        const camera = this.scene.cameras.main;
        this.sellDialog.setPosition(camera.scrollX + camera.width / 2, camera.scrollY + camera.height / 2);
        
        // Dialog background
        const dialogBg = this.scene.add.rectangle(0, 0, 300, 150, 0x000000, 0.9);
        dialogBg.setStrokeStyle(3, 0xffffff);
        
        // Title
        const title = this.scene.add.text(0, -50, 'Sell Turret?', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Info text
        const infoText = this.scene.add.text(0, -20, `${turretType.name}`, {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        const priceText = this.scene.add.text(0, 0, `Sell for ${sellPrice} gold`, {
            fontSize: '14px',
            color: '#ffff00'
        }).setOrigin(0.5);
        
        // Yes button
        const yesButton = this.scene.add.rectangle(-60, 40, 80, 30, 0x00aa00);
        yesButton.setStrokeStyle(2, 0xffffff);
        yesButton.setInteractive({ useHandCursor: true });
        
        const yesText = this.scene.add.text(-60, 40, 'Sell', {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // No button
        const noButton = this.scene.add.rectangle(60, 40, 80, 30, 0xaa0000);
        noButton.setStrokeStyle(2, 0xffffff);
        noButton.setInteractive({ useHandCursor: true });
        
        const noText = this.scene.add.text(60, 40, 'Cancel', {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Button handlers
        yesButton.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            this.sellTurret(turret, sellPrice);
            this.hideSellDialog();
        });
        
        noButton.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            this.hideSellDialog();
        });
        
        // Hover effects
        yesButton.on('pointerover', () => yesButton.setFillStyle(0x00dd00));
        yesButton.on('pointerout', () => yesButton.setFillStyle(0x00aa00));
        noButton.on('pointerover', () => noButton.setFillStyle(0xdd0000));
        noButton.on('pointerout', () => noButton.setFillStyle(0xaa0000));
        
        this.sellDialog.add([dialogBg, title, infoText, priceText, yesButton, yesText, noButton, noText]);
    }
    
    // Hide sell confirmation dialog
    hideSellDialog() {
        if (this.sellDialog) {
            this.sellDialog.destroy();
            this.sellDialog = null;
        }
    }
    
    // Sell a turret and give money back
    sellTurret(turret, sellPrice) {
        console.log(`Selling turret for ${sellPrice} gold`);
        
        // Give money to player
        if (this.scene.player) {
            this.scene.player.gainMoney(sellPrice);
        }
        
        // Remove from grid tracking
        const gridX = turret.getData('gridX');
        const gridY = turret.getData('gridY');
        
        if (gridX !== undefined && gridY !== undefined) {
            const positionKey = this.getPositionKey(gridX, gridY);
            this.placedPositions.delete(positionKey);
        }
        
        // Clean up hover text if it exists
        if (turret.sellHoverText) {
            turret.sellHoverText.destroy();
        }
        
        // Show sell feedback
        const sellText = this.scene.add.text(turret.x, turret.y - 40, `+${sellPrice}g`, {
            fontSize: '16px',
            color: '#ffff00'
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: sellText,
            alpha: 0,
            y: sellText.y - 30,
            duration: 1000,
            onComplete: () => sellText.destroy()
        });
        
        // Remove turret from physics group and destroy
        this.turrets.remove(turret);
        turret.destroy();
    }
    
    // Update method to handle mouse tracking during placement
    updatePlacementPreview() {
        if (this.placementMode) {
            const pointer = this.scene.input.activePointer;
            const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.showPlacementPreview(worldPoint.x, worldPoint.y);
        }
    }
    
    getTurretsGroup() {
        return this.turrets;
    }
    
    // Get the cost of the currently selected turret type
    getTurretCost() {
        return this.turretTypes[this.selectedTurretType].cost;
    }
    
    // Get all turret types for UI display
    getTurretTypes() {
        return this.turretTypes;
    }
    
    // Get currently selected turret type
    getSelectedTurretType() {
        return this.selectedTurretType;
    }
    
    // Public method to open the buy menu (called from GameScene)
    openTurretMenu() {
        console.log('openTurretMenu called');
        this.openBuyMenu();
    }
    
    // Check if currently in placement mode
    isInPlacementMode() {
        return this.placementMode;
    }
    
    // Debug method to test menu visibility
    toggleMenuForDebug() {
        if (this.buyMenu) {
            const isVisible = this.buyMenu.visible;
            console.log(`Menu is currently: ${isVisible ? 'visible' : 'hidden'}`);
            if (isVisible) {
                this.closeBuyMenu();
            } else {
                this.openBuyMenu();
            }
        }
    }
}