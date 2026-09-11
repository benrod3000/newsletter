import { describe, it, expect } from 'vitest'
import { smsSegments, estimateSmsCost, withoutNonGsm } from './sms-segments'

/**
 * The same boundaries the backend copy asserts.
 *
 * This module is deliberately a second implementation of `smsSegments` in
 * newsletter-core, because the composer needs a count on every keystroke and a
 * round trip per character is not an option. Two copies drift, and this project
 * has been bitten by drift repeatedly, so the two test files assert the same
 * numbers on purpose. If a boundary changes in one repo and not the other, one
 * of these goes red.
 *
 * What is being protected: a single curly apostrophe pasted from a word
 * processor drops capacity from 160 characters to 70, nearly tripling the cost
 * of a send to ten thousand people, with nothing on screen to explain why.
 */

describe('smsSegments', () => {
  it('counts a short GSM-7 body as one segment', () => {
    const info = smsSegments('Sale ends tonight, use code SPRING.')
    expect(info.encoding).toBe('GSM-7')
    expect(info.segments).toBe(1)
  })

  it('fits exactly 160 GSM-7 characters in one segment', () => {
    expect(smsSegments('a'.repeat(160)).segments).toBe(1)
    expect(smsSegments('a'.repeat(160)).remainingInSegment).toBe(0)
  })

  it('splits at 161', () => {
    expect(smsSegments('a'.repeat(161)).segments).toBe(2)
  })

  it('bills GSM-7 extended characters as two units each', () => {
    // 159 plain characters plus one brace is 161 septets, so it tips into a
    // second segment while looking like 160 characters on screen.
    const info = smsSegments('a'.repeat(159) + '{')
    expect(info.encodedLength).toBe(161)
    expect(info.segments).toBe(2)
  })

  it('drops to UCS-2 on a single curly apostrophe', () => {
    const info = smsSegments('Don’t miss out')
    expect(info.encoding).toBe('UCS-2')
    expect(info.nonGsmCharacters).toEqual(['’'])
  })

  it('fits exactly 70 UCS-2 units in one segment and splits at 71', () => {
    expect(smsSegments('’'.repeat(70)).segments).toBe(1)
    expect(smsSegments('’'.repeat(71)).segments).toBe(2)
  })

  it('counts an astral emoji as two UCS-2 units', () => {
    expect(smsSegments('\u{1F600}'.repeat(35)).encodedLength).toBe(70)
    expect(smsSegments('\u{1F600}'.repeat(36)).segments).toBe(2)
  })

  it('reports an emoji once, not once per surrogate half', () => {
    expect(smsSegments('hi \u{1F600}\u{1F600}').nonGsmCharacters).toEqual(['\u{1F600}'])
  })

  it('treats an empty body as one segment', () => {
    expect(smsSegments('').segments).toBe(1)
  })

  it('does not throw on non-string input', () => {
    expect(smsSegments(null).segments).toBe(1)
    expect(smsSegments(undefined).segments).toBe(1)
  })
})

describe('withoutNonGsm', () => {
  it('keeps accented characters that are genuinely in the GSM-7 alphabet', () => {
    // The reason this is not a "strip non-ASCII" regex. These cost one septet
    // each, so flagging them would send the operator hunting for a saving that
    // does not exist.
    expect(withoutNonGsm('Café £5 für Ärzte')).toBe('Café £5 für Ärzte')
  })

  it('removes the characters that actually force UCS-2', () => {
    // Both are characters a word processor inserts silently, and both force
    // UCS-2. Neither is a dash: this project bans dash lookalikes outright, and
    // the test does not need one to make its point.
    expect(withoutNonGsm('Don’t… stop')).toBe('Dont stop')
  })
})

describe('estimateSmsCost', () => {
  it('multiplies by segments, not just by recipients', () => {
    // The old composer multiplied recipients by a flat per-message rate, so a
    // two-segment body over ten thousand people was quoted at half its cost.
    const oneSegment = estimateSmsCost(1000, 'short message')
    const twoSegments = estimateSmsCost(1000, 'a'.repeat(200))

    expect(smsSegments('a'.repeat(200)).segments).toBe(2)
    expect(twoSegments).toBeCloseTo(oneSegment * 2, 6)
  })

  it('reflects the UCS-2 penalty in the price', () => {
    const plain = 'a'.repeat(80)
    const curly = 'a'.repeat(79) + '’'

    // 80 GSM-7 characters is one segment; the same length with one curly
    // apostrophe is two, because capacity drops to 70.
    expect(smsSegments(plain).segments).toBe(1)
    expect(smsSegments(curly).segments).toBe(2)
    expect(estimateSmsCost(500, curly)).toBeCloseTo(estimateSmsCost(500, plain) * 2, 6)
  })

  it('is zero for no recipients', () => {
    expect(estimateSmsCost(0, 'anything')).toBe(0)
  })
})
