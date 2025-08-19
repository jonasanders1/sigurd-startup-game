const fs = require('fs');
const path = require('path');

// Read the GameManager file
const filePath = path.join(__dirname, 'src/managers/GameManager.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace old manager references with new consolidated ones
const replacements = [
  // AudioManager replacements
  [/this\.audioManager\.isPowerUpMelodyActive\(\)/g, 'this.audioSystemManager.getAudioManager().isPowerUpMelodyActive()'],
  [/this\.audioManager\.stopPowerUpMelody\(\)/g, 'this.audioSystemManager.stopPowerUpMelody()'],
  [/this\.audioManager\.stopBackgroundMusic\(\)/g, 'this.audioSystemManager.stopBackgroundMusic()'],
  [/this\.audioManager\.playSound\(/g, 'this.audioSystemManager.playSound('],
  [/this\.audioManager\.cleanup\(\)/g, 'this.audioSystemManager.cleanup()'],
  [/this\.audioManager\.getPowerUpMelodyStatus\(\)/g, 'this.audioSystemManager.getAudioManager().getPowerUpMelodyStatus()'],
  
  // Monster manager replacements  
  [/this\.scalingManager\.startMap\(\);/g, '// Monster manager now handles difficulty scaling internally'],
  [/this\.monsterSpawnManager\.initializeLevel\(/g, 'this.monsterManager.initializeLevel('],
  [/this\.monsterRespawnManager\.reset\(\);/g, '// Monster manager handles respawn internally now'],
  [/this\.monsterRespawnManager\.killMonster\(/g, 'this.monsterManager.addDeadMonster('],
  [/this\.monsterRespawnManager\.getDeadMonsterCount\(\)/g, '0; // TODO: Add getDeadMonsterCount to MonsterManager if needed'],
  [/this\.scalingManager\.resetOnDeath\(\)/g, 'this.monsterManager.resetOnDeath()'],
  [/this\.monsterSpawnManager\.getSpawnStatus\(\)/g, '{ pendingSpawns: this.monsterManager.getPendingSpawns() }'],
  [/this\.monsterSpawnManager/g, 'this.monsterManager'],
  
  // Pause/resume replacements
  [/if \(!this\.scalingManager\.isCurrentlyPausedByPowerMode\(\)\) \{\s+this\.scalingManager\.resume\(\);\s+\}\s+this\.scalingManager\.resumeAllMonsterScaling\(\);\s+this\.monsterSpawnManager\.resume\(\);\s+this\.monsterRespawnManager\.resume\(\);/g, 
   '// Resume monster activities\n      this.monsterManager.resume();\n      this.audioSystemManager.resume("gameplay");'],
  [/this\.scalingManager\.pause\(\);\s+this\.scalingManager\.pauseAllMonsterScaling\(\);\s+this\.monsterSpawnManager\.pause\(\);\s+this\.monsterRespawnManager\.pause\(\);/g,
   '// Pause monster activities\n      this.monsterManager.pause();\n      this.audioSystemManager.pause("gameplay");'],
   
  // Update spawn manager update call
  [/this\.monsterSpawnManager\.update\(currentTime, deltaTime\);\s+\/\/ Update respawn manager - get any monsters that should respawn\s+const respawnedMonsters = this\.monsterRespawnManager\.update\(\);/g,
   '// Update all monster-related activities (spawning, respawning, behavior, scaling)\n    this.monsterManager.update(currentTime, gameState, deltaTime);'],
   
  // Fix initializeLevel calls to include level parameter
  [/this\.monsterManager\.initializeLevel\(\s+mapDefinition\.monsterSpawnPoints\s+\)/g,
   'this.monsterManager.initializeLevel(\n          mapDefinition.monsterSpawnPoints,\n          currentLevel\n        )'],
  [/this\.monsterManager\.initializeLevel\(\[\]\)/g, 'this.monsterManager.initializeLevel([], currentLevel)'],
  
  // Fix pause status
  [/scalingManager: this\.scalingManager\.getPauseStatus\(\),\s+spawnManager: this\.monsterSpawnManager\.getPauseStatus\(\),\s+respawnManager: \{\s+isPaused: this\.monsterRespawnManager\.isPaused\(\),\s+\}/g,
   'monsterManager: {\n        isPaused: this.audioSystemManager.isPaused(),\n        pauseReasons: this.audioSystemManager.getPauseReasons(),\n      }'],
];

// Apply all replacements
replacements.forEach(([pattern, replacement]) => {
  content = content.replace(pattern, replacement);
});

// Fix any remaining issues with AudioEvent.BACKGROUND_MUSIC
content = content.replace(
  /this\.audioSystemManager\.playSound\(AudioEvent\.BACKGROUND_MUSIC, currentState\)/g,
  'this.audioSystemManager.playBackgroundMusic()'
);

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('GameManager.ts has been updated successfully!');
console.log('Updates applied:');
console.log('- Replaced audioManager with audioSystemManager');
console.log('- Replaced monsterSpawnManager, monsterRespawnManager, scalingManager with monsterManager');
console.log('- Updated all method calls to use the new consolidated managers');