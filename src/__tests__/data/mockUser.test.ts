import { describe, expect, it } from 'vitest'
import { reviewsForSkill } from '../../data/mockUser'

describe('reviewsForSkill', () => {
  it('finds the reviews left for a skill that has some', () => {
    const reviews = reviewsForSkill('skill-1') // Web design
    expect(reviews).toHaveLength(1)
    expect(reviews[0].author).toBe('Lena K.')
  })

  it('returns an empty list for a skill with no reviews yet', () => {
    expect(reviewsForSkill('skill-4')).toEqual([]) // Gardening
  })

  it('returns an empty list for an id that matches no skill', () => {
    expect(reviewsForSkill('not-a-real-skill')).toEqual([])
  })
})
