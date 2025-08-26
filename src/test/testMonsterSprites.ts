// Test script to verify all monster sprites load correctly
import { getMonsterAnimations } from "../config/monsterAnimations";
import { MonsterType } from "../types/enums";
import { MonsterSpriteInstance } from "../lib/MonsterSpriteInstance";

export function testMonsterSprites() {
  console.log("🧪 Testing Monster Sprite Loading...");
  
  const monsterTypes = [
    { type: MonsterType.FLOATER, name: "Skatte-Spøkelset (Tax Ghost)" },
    { type: MonsterType.VERTICAL_PATROL, name: "Vertikal-Byråkrat (Vertical Bureaucrat)" },
    { type: MonsterType.CHASER, name: "Hodeløs-Konsulent (Headless Consultant)" },
    { type: MonsterType.AMBUSHER, name: "Regel-Robot (Rule Robot)" },
    { type: MonsterType.HORIZONTAL_PATROL, name: "Byråkrat-Klonen (Bureaucrat Clone)" },
  ];

  monsterTypes.forEach(({ type, name }) => {
    console.log(`\n📦 Testing ${name} (${type}):`);
    
    try {
      const animations = getMonsterAnimations(type);
      const sprite = new MonsterSpriteInstance(animations, "idle");
      
      console.log(`  ✅ Created sprite instance`);
      console.log(`  📋 Animations available:`);
      
      animations.forEach(anim => {
        console.log(`    - ${anim.name}: ${anim.frames.length} frames`);
        
        // Check if images are loading
        anim.frames.forEach((img, index) => {
          if (img.src) {
            console.log(`      Frame ${index + 1}: ${img.src.substring(img.src.lastIndexOf('/') + 1)}`);
          } else {
            console.log(`      ❌ Frame ${index + 1}: No source`);
          }
        });
      });
      
      // Test animation switching
      if (type === MonsterType.HORIZONTAL_PATROL) {
        sprite.setAnimation("walk-right");
        console.log(`  ✅ Can switch to walk-right animation`);
        sprite.setAnimation("walk-left");
        console.log(`  ✅ Can switch to walk-left animation`);
      } else {
        sprite.setAnimation("move");
        console.log(`  ✅ Can switch to move animation`);
      }
      
    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
    }
  });
  
  console.log("\n✨ Monster sprite test complete!");
}

// Run the test if this file is executed directly
if (import.meta.url === import.meta.url) {
  testMonsterSprites();
}