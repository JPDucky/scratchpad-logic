import { describe, it, expect } from 'vitest'

describe('Vitest Setup', () => {
  it('should pass a basic arithmetic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should verify vitest is working', () => {
    const result = true
    expect(result).toBe(true)
  })
})
