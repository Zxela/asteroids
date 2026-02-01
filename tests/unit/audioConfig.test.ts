import { audioConfig } from '../../src/config/audioConfig'
import { describe, it, expect } from 'vitest'

describe('audioConfig', () => {
  describe('sfx.ufoLoop', () => {
    it('should exist with correct properties', () => {
      expect(audioConfig.sfx.ufoLoop).toEqual({
        id: 'ufoLoop',
        path: '/assets/audio/ufo_loop.mp3',
        volume: 0.4,
        preload: true
      })
    })
  })
})
