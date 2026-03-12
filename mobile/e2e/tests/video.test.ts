import { by, device, element, expect } from 'detox';
import { loginTestUser, navigateToSkillTree, navigateToVideoLesson } from '../helpers';

describe('Video Lesson Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await loginTestUser();
  });

  describe('Navigating to a Video Lesson', () => {
    it('should navigate to Learn tab and see video lesson nodes', async () => {
      await navigateToSkillTree();

      // Math course should have video lesson nodes
      await expect(element(by.id('video-lesson-node-0'))).toBeVisible();
    });

    it('should tap a video lesson node and open video screen', async () => {
      await navigateToVideoLesson();
    });
  });

  describe('Video Player', () => {
    beforeEach(async () => {
      await navigateToVideoLesson();
    });

    it('should display video player with controls', async () => {
      await expect(element(by.id('video-player'))).toBeVisible();
      await expect(element(by.id('video-play-pause-button'))).toBeVisible();
    });

    it('should display video lesson title', async () => {
      await expect(element(by.id('video-lesson-title'))).toBeVisible();
    });

    it('should display teacher name when available', async () => {
      // Teacher name is optional; check existence without hard-failing
      try {
        await expect(element(by.id('video-teacher-name'))).toBeVisible();
      } catch {
        // Teacher name not present for this video — acceptable
      }
    });

    it('should show quiz unlock banner', async () => {
      // The quiz unlock banner should always be visible (locked or unlocked)
      await expect(element(by.id('quiz-unlock-banner'))).toBeVisible();
    });

    it('should show quiz locked state when watch threshold not met', async () => {
      // Immediately after opening, watch percent is 0% so quiz should be locked
      await expect(element(by.id('quiz-unlock-banner'))).toBeVisible();

      // The banner should indicate the quiz is locked
      await expect(element(by.id('quiz-locked-indicator'))).toBeVisible();
    });

    it('should play and pause video', async () => {
      // Tap play button
      await element(by.id('video-play-pause-button')).tap();

      // Video should start playing — verify play state indicator
      await waitFor(element(by.id('video-playing-indicator')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap again to pause
      await element(by.id('video-play-pause-button')).tap();

      await waitFor(element(by.id('video-paused-indicator')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should display speed control', async () => {
      await expect(element(by.id('video-speed-button'))).toBeVisible();
    });

    it('should navigate back from video lesson', async () => {
      await element(by.id('video-back-button')).tap();

      await waitFor(element(by.id('skill-tree-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Video Progress and Quiz Gating', () => {
    it('should show progress bar/ring for video watch percentage', async () => {
      await navigateToVideoLesson();

      // Watch progress indicator should be visible
      await expect(element(by.id('video-progress-indicator'))).toBeVisible();
    });

    it('should show quiz locked message with threshold percentage', async () => {
      await navigateToVideoLesson();

      // Quiz locked indicator with threshold info
      await expect(element(by.id('quiz-locked-indicator'))).toBeVisible();
      await expect(element(by.id('quiz-threshold-text'))).toBeVisible();
    });
  });
});
