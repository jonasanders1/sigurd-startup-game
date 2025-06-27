import { GAME_CONFIG } from '@/types/constants'
import React from 'react'

const Menu = ({children, transparent}: {children: React.ReactNode, transparent?: boolean}) => {
  return (
    <div className={`absolute inset-0 flex items-center justify-center z-50 ${transparent ? 'bg-transparent' : 'bg-background/80 backdrop-blur-sm'}`}
    style={{
        width: GAME_CONFIG.CANVAS_WIDTH,
        height: GAME_CONFIG.CANVAS_HEIGHT,
      }}>
        {children}
    </div>
  )
}

export default Menu