import { by, device, element, expect } from 'detox';
import { loginTestUser, navigateToSkillTree, completeAllExercises } from '../helpers';

describe('Lesson Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await loginTestUser();
  });

  describe('Navigating to a Lesson', () => {
    it('should navigate to Learn tab and see skill tree', async () => {
      await navigateToSkillTree();
    });

    it('should display lesson nodes in the skill tree', async () => {
      await navigateToSkillTree();
      await expect(element(by.id('lesson-node-0'))).toBeVisible();
    });

    it('should tap an available lesson node and see lesson intro', async () => {
      await navigateToSkillTree();

      // Tap the first available (unlocked) lesson node
      await element(by.id('lesson-node-0')).tap();

      await waitFor(element(by.id('lesson-intro-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify lesson intro elements
      await expect(element(by.id('lesson-intro-title'))).toBeVisible();
      await expect(element(by.id('lesson-intro-exercise-count'))).toBeVisible();
      await expect(element(by.id('lesson-intro-start-button'))).toBeVisible();
    });
  });

  describe('Completing a Lesson', () => {
    beforeEach(async () => {
      await navigateToSkillTree();

      await element(by.id('lesson-node-0')).tap();

      await waitFor(element(by.id('lesson-intro-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should start lesson and see the first exercise', async () => {
      await element(by.id('lesson-intro-start-button')).tap();

      await waitFor(element(by.id('exercise-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify exercise UI elements
      await expect(element(by.id('lesson-progress-bar'))).toBeVisible();
      await expect(element(by.id('hearts-display'))).toBeVisible();
      await expect(element(by.id('exercise-renderer'))).toBeVisible();
    });

    it('should answer a multiple choice exercise and see feedback', async () => {
      await element(by.id('lesson-intro-start-button')).tap();

      await waitFor(element(by.id('exercise-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap the first answer option (multiple choice)
      await waitFor(element(by.id('mc-option-0')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('mc-option-0')).tap();

      // Tap Check/Submit button
      await element(by.id('exercise-check-button')).tap();

      // Should see answer feedback (correct or incorrect)
      await waitFor(element(by.id('answer-feedback')))
        .toBeVisible()
        .withTimeout(5000);

      // Feedback should show correct/incorrect state
      await expect(element(by.id('feedback-continue-button'))).toBeVisible();
    });

    it('should continue after feedback and advance to next exercise', async () => {
      await element(by.id('lesson-intro-start-button')).tap();

      await waitFor(element(by.id('exercise-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Answer first exercise
      await waitFor(element(by.id('mc-option-0')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('mc-option-0')).tap();
      await element(by.id('exercise-check-button')).tap();

      await waitFor(element(by.id('answer-feedback')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap continue to advance
      await element(by.id('feedback-continue-button')).tap();

      // Progress bar should have advanced (exercise-screen still visible for next exercise)
      await waitFor(element(by.id('exercise-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should complete all exercises and see results screen with XP', async () => {
      await element(by.id('lesson-intro-start-button')).tap();

      await waitFor(element(by.id('exercise-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await completeAllExercises();

      // Verify results screen
      await waitFor(element(by.id('lesson-results-screen')))
        .toBeVisible()
        .withTimeout(10000);

      await expect(element(by.id('results-xp-earned'))).toBeVisible();
      await expect(element(by.id('results-continue-button'))).toBeVisible();
    });

    it('should return to skill tree after tapping continue on results', async () => {
      await element(by.id('lesson-intro-start-button')).tap();

      await waitFor(element(by.id('exercise-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await completeAllExercises();

      await waitFor(element(by.id('lesson-results-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Tap continue on results to go back
      await element(by.id('results-continue-button')).tap();

      // Should return to skill tree
      await waitFor(element(by.id('skill-tree-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Lesson Close', () => {
    it('should close lesson mid-exercise and return to skill tree', async () => {
      await navigateToSkillTree();

      await element(by.id('lesson-node-0')).tap();

      await waitFor(element(by.id('lesson-intro-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('lesson-intro-start-button')).tap();

      await waitFor(element(by.id('exercise-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap close/X button
      await element(by.id('lesson-close-button')).tap();

      // Should return to skill tree
      await waitFor(element(by.id('skill-tree-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });
});
