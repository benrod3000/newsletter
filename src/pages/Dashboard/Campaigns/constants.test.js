import { describe, it, expect } from 'vitest'
import { getAudienceLabel, AUDIENCE_OPTIONS } from './constants'

/**
 * The audience label, which took the Broadcasts page down.
 *
 * `getAudienceLabel(a, lists)` read `lists.find(...)` inside its `list:` branch, and
 * both call sites passed only the audience. That was survivable for as long as no
 * campaign could have a `list:` audience - the database rejected them - so the branch
 * was unreachable and the missing argument invisible.
 *
 * Fixing the constraint made list campaigns saveable. The first one created turned
 * every render of the campaigns list into `undefined is not an object (evaluating
 * 'lists.find')`, which the error boundary showed as "Something went wrong" with no
 * way back.
 *
 * The lesson these pin: a function that reads an argument only in a rare branch is
 * not safe because the branch is rare, it is untested because the branch is rare.
 */

describe('getAudienceLabel', () => {
  it('does not throw when lists is omitted', () => {
    // The crash, exactly. Both call sites called it this way.
    expect(() => getAudienceLabel('list:2b2bbd33-00fe-4de5-bc02-d660080d3fc6')).not.toThrow()
  })

  it('resolves a list audience to that list name', () => {
    const lists = [{ id: '2b2bbd33-00fe-4de5-bc02-d660080d3fc6', name: 'RESUME' }]
    expect(getAudienceLabel('list:2b2bbd33-00fe-4de5-bc02-d660080d3fc6', lists)).toBe('RESUME')
  })

  it('shows the raw value when the list is gone', () => {
    // Deliberately ugly rather than hidden: a campaign aimed at a deleted list is
    // something the operator needs to see, not something to paper over.
    const audience = 'list:2b2bbd33-00fe-4de5-bc02-d660080d3fc6'
    expect(getAudienceLabel(audience, [])).toBe(audience)
    expect(getAudienceLabel(audience, [{ id: 'other', name: 'Other' }])).toBe(audience)
  })

  it('labels every fixed audience the picker offers', () => {
    for (const opt of AUDIENCE_OPTIONS) {
      expect(getAudienceLabel(opt.value, [])).toBe(opt.label)
    }
  })

  it('passes through an unknown audience rather than blanking it', () => {
    expect(getAudienceLabel('something_new', [])).toBe('something_new')
  })

  it('handles a missing audience without throwing', () => {
    // `a?.startsWith` guards this, and a draft can reach the list before the field
    // has been set.
    expect(() => getAudienceLabel(undefined, [])).not.toThrow()
    expect(() => getAudienceLabel(null, [])).not.toThrow()
  })
})
