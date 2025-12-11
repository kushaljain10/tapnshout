import React from 'react'

export default function VictoryOverlay({ winner, onRestart }) {
  if (!winner) return null
  return (
    <div className="victory-overlay" role="dialog" aria-live="polite">
      <div className="victory-card">
        <h2 className="victory-title">{winner} Wins!</h2>
        <button className="restart-btn" onClick={onRestart} aria-label="Restart game">
          Restart
        </button>
      </div>
    </div>
  )
}