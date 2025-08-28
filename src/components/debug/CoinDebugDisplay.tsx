import React from 'react';
import { useCoinStore } from '../../stores/entities/coinStore';
import { useGameStore } from '../../stores/gameStore';
import { useStateStore } from '../../stores/game/stateStore';
import { useLevelStore } from '../../stores/game/levelStore';
import { GAME_CONFIG } from '../../types/constants';

export const CoinDebugDisplay: React.FC = () => {
  const { coinManager, coins } = useCoinStore();
  const { score, multiplier, lives, totalBonusMultiplierCoinsCollected } = useGameStore.getState();
  const currentState = useStateStore(state => state.currentState);
  const { currentLevel } = useLevelStore();
  
  // Only show in game state
  if (currentState !== 'PLAYING') return null;

  // Get coin manager data
  const firebombCount = coinManager?.getFirebombCount() || 0;
  const bombAndMonsterPoints = coinManager?.getBombAndMonsterPoints() || 0;
  
  // Calculate spawn thresholds
  const nextPCoinAt = Math.ceil((firebombCount + 1) / GAME_CONFIG.POWER_COIN_SPAWN_INTERVAL) * GAME_CONFIG.POWER_COIN_SPAWN_INTERVAL;
  const pCoinProgress = firebombCount % GAME_CONFIG.POWER_COIN_SPAWN_INTERVAL;
  
  const nextBCoinAt = Math.ceil((bombAndMonsterPoints + 1) / GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL) * GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL;
  const bCoinProgress = bombAndMonsterPoints % GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL;
  
  const nextECoinAt = Math.ceil((totalBonusMultiplierCoinsCollected + 1) / GAME_CONFIG.EXTRA_LIFE_COIN_RATIO) * GAME_CONFIG.EXTRA_LIFE_COIN_RATIO;
  const eCoinProgress = totalBonusMultiplierCoinsCollected % GAME_CONFIG.EXTRA_LIFE_COIN_RATIO;
  
  // Count active coins by type
  const activePCoins = coins.filter(c => c.type === 'POWER' && !c.isCollected).length;
  const activeBCoins = coins.filter(c => c.type === 'BONUS_MULTIPLIER' && !c.isCollected).length;
  const activeECoins = coins.filter(c => c.type === 'EXTRA_LIFE' && !c.isCollected).length;

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      minWidth: '300px',
      zIndex: 1000,
      border: '2px solid #00ff00'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#00ff00', fontSize: '14px' }}>
        🎮 COIN SPAWN DEBUG
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ color: '#ffff00', fontWeight: 'bold', marginBottom: '5px' }}>
          📊 GAME STATE
        </div>
        <div>Score: {score}</div>
        <div>Bomb/Monster Points: {bombAndMonsterPoints}</div>
        <div>Multiplier: {multiplier}x</div>
        <div>Lives: {lives}</div>
        <div>Level: {currentLevel}</div>
      </div>

      <div style={{ marginBottom: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}>
        <div style={{ color: '#ff0000', fontWeight: 'bold', marginBottom: '5px' }}>
          🔴 P-COIN (POWER)
        </div>
        <div>Firebombs: {firebombCount}</div>
        <div>Progress: {pCoinProgress}/{GAME_CONFIG.POWER_COIN_SPAWN_INTERVAL}</div>
        <div>Next spawn at: {nextPCoinAt} firebombs</div>
        <div>Active: {activePCoins}</div>
        <div style={{ 
          width: '100%', 
          height: '10px', 
          backgroundColor: '#333',
          borderRadius: '5px',
          marginTop: '5px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(pCoinProgress / GAME_CONFIG.POWER_COIN_SPAWN_INTERVAL) * 100}%`,
            height: '100%',
            backgroundColor: '#ff0000',
            transition: 'width 0.3s'
          }}/>
        </div>
      </div>

      <div style={{ marginBottom: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}>
        <div style={{ color: '#e9b300', fontWeight: 'bold', marginBottom: '5px' }}>
          🟡 B-COIN (BONUS MULTIPLIER)
        </div>
        <div>B/M Points: {bombAndMonsterPoints}</div>
        <div>Progress: {bCoinProgress}/{GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL}</div>
        <div>Next spawn at: {nextBCoinAt} points</div>
        <div>Active: {activeBCoins}</div>
        <div>Total collected: {totalBonusMultiplierCoinsCollected}</div>
        <div style={{ 
          width: '100%', 
          height: '10px', 
          backgroundColor: '#333',
          borderRadius: '5px',
          marginTop: '5px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(bCoinProgress / GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL) * 100}%`,
            height: '100%',
            backgroundColor: '#e9b300',
            transition: 'width 0.3s'
          }}/>
        </div>
      </div>

      <div style={{ marginBottom: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}>
        <div style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '5px' }}>
          ❤️ E-COIN (EXTRA LIFE)
        </div>
        <div>B-coins collected: {totalBonusMultiplierCoinsCollected}</div>
        <div>Progress: {eCoinProgress}/{GAME_CONFIG.EXTRA_LIFE_COIN_RATIO}</div>
        <div>Next spawn at: {nextECoinAt} B-coins</div>
        <div>Active: {activeECoins}</div>
        <div style={{ 
          width: '100%', 
          height: '10px', 
          backgroundColor: '#333',
          borderRadius: '5px',
          marginTop: '5px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(eCoinProgress / GAME_CONFIG.EXTRA_LIFE_COIN_RATIO) * 100}%`,
            height: '100%',
            backgroundColor: '#ef4444',
            transition: 'width 0.3s'
          }}/>
        </div>
      </div>

      <div style={{ 
        marginTop: '10px', 
        paddingTop: '10px', 
        borderTop: '1px solid #444',
        fontSize: '10px',
        color: '#888'
      }}>
        Press F12 for console logs
      </div>
    </div>
  );
};