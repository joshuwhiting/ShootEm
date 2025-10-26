# ShootEm

A 2D top-down shooter game inspired by Vampire Survivors, built with Phaser 3. Fight waves of enemies, place turrets, gain XP, collect gold, and upgrade your abilities!

## Features

- **Auto-Shooting Combat**: Your character automatically shoots at the nearest enemy
- **Turret System**: Place defensive turrets that automatically target enemies
- **XP & Leveling**: Gain experience from defeated enemies and level up
- **Currency System**: Earn gold to purchase turrets and upgrades
- **Upgrade System**: Improve your damage, fire rate, projectile speed, health, and movement speed
- **Wave-Based Enemies**: Enemies get stronger as you progress
- **Real-time Combat**: Fast-paced action with physics-based projectiles

## Controls

- **WASD / Arrow Keys**: Move your character
- **Auto-Shoot**: Automatically shoots at nearest enemy
- **T**: Place a turret (costs 50 gold)
- **U**: Open upgrade menu
- **ESC**: Close upgrade menu
- **R**: Restart game (after game over)

## Installation

```bash
npm install
```

## Running the Game

### Development Mode (with hot reload)
```bash
npm start
```
Then open your browser to `http://localhost:8080`

### Production Build
```bash
npm run build
```
The built game will be in the `dist/` directory.

## Gameplay Tips

1. **Movement**: Stay mobile to avoid being surrounded by enemies
2. **Turrets**: Place turrets strategically to cover multiple angles
3. **Upgrades**: Balance between damage upgrades and survivability
4. **Gold Management**: Save gold for crucial turret placements or important upgrades
5. **Leveling**: Each level fully heals you and increases your max health

## Game Mechanics

### Player Stats
- **Health**: Start with 100 HP, gain +20 HP per level
- **Damage**: Base 10 damage per projectile
- **Fire Rate**: Shoots every 500ms initially
- **Speed**: Base movement speed of 200 units/sec

### Enemies
- Spawn from screen edges
- Move towards the player
- Health and speed increase with each wave
- Drop XP and gold on death

### Turrets
- Cost: 50 gold each
- Auto-target enemies in range
- Independent fire rate and damage
- Permanent once placed

### Upgrades (Available in Upgrade Menu)
- **Damage +5**: Increase projectile damage (30 gold)
- **Fire Rate +10%**: Shoot more frequently (40 gold)
- **Projectile Speed +20%**: Faster bullets (25 gold)
- **Max Health +30**: Increase max HP and fully heal (50 gold)
- **Movement Speed +10%**: Move faster (35 gold)

## Technologies Used

- **Phaser 3**: Game framework
- **Webpack**: Module bundler
- **JavaScript (ES6+)**: Programming language

## License

MIT