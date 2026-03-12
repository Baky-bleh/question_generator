import { by, device, element, expect } from 'detox';
import { loginTestUser } from '../helpers';

describe('Tab Navigation', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await loginTestUser();
  });

  describe('Tab Bar', () => {
    it('should display all main tabs', async () => {
      await expect(element(by.id('tab-home'))).toBeVisible();
      await expect(element(by.id('tab-learn'))).toBeVisible();
      await expect(element(by.id('tab-profile'))).toBeVisible();
      await expect(element(by.id('tab-review'))).toBeVisible();
    });

    it('should show tab labels', async () => {
      await expect(element(by.text('Home'))).toBeVisible();
      await expect(element(by.text('Learn'))).toBeVisible();
      await expect(element(by.text('Profile'))).toBeVisible();
      await expect(element(by.text('Review'))).toBeVisible();
    });
  });

  describe('Home Tab', () => {
    beforeEach(async () => {
      await element(by.id('tab-home')).tap();
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should display the home screen', async () => {
      await expect(element(by.id('home-screen'))).toBeVisible();
    });

    it('should show greeting text', async () => {
      await expect(element(by.id('home-greeting'))).toBeVisible();
    });

    it('should show the mascot', async () => {
      await expect(element(by.id('home-mascot'))).toBeVisible();
    });

    it('should show daily progress section', async () => {
      await expect(element(by.id('home-daily-progress'))).toBeVisible();
    });

    it('should show streak widget', async () => {
      await expect(element(by.id('home-streak-widget'))).toBeVisible();
    });

    it('should show continue learning button', async () => {
      await expect(element(by.id('home-continue-button'))).toBeVisible();
    });
  });

  describe('Learn Tab', () => {
    it('should navigate to Learn tab and display skill tree', async () => {
      await element(by.id('tab-learn')).tap();

      await waitFor(element(by.id('skill-tree-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should display unit cards in the skill tree', async () => {
      await element(by.id('tab-learn')).tap();

      await waitFor(element(by.id('skill-tree-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // At least one unit card should be visible
      await expect(element(by.id('unit-card-0'))).toBeVisible();
    });
  });

  describe('Profile Tab', () => {
    beforeEach(async () => {
      await element(by.id('tab-profile')).tap();
      await waitFor(element(by.id('profile-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should display the profile screen', async () => {
      await expect(element(by.id('profile-screen'))).toBeVisible();
    });

    it('should show user display name', async () => {
      await expect(element(by.id('profile-display-name'))).toBeVisible();
    });

    it('should show user stats section', async () => {
      await expect(element(by.id('profile-stats'))).toBeVisible();
    });

    it('should show user level and XP', async () => {
      await expect(element(by.id('profile-level-indicator'))).toBeVisible();
      await expect(element(by.id('profile-xp-badge'))).toBeVisible();
    });

    it('should show settings navigation', async () => {
      await expect(element(by.id('profile-settings-button'))).toBeVisible();
    });
  });

  describe('Review Tab', () => {
    it('should navigate to Review tab', async () => {
      await element(by.id('tab-review')).tap();

      await waitFor(element(by.id('review-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Tab Switching', () => {
    it('should switch between tabs and maintain state', async () => {
      // Start on Home
      await element(by.id('tab-home')).tap();
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Go to Learn
      await element(by.id('tab-learn')).tap();
      await waitFor(element(by.id('skill-tree-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Go to Profile
      await element(by.id('tab-profile')).tap();
      await waitFor(element(by.id('profile-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Go back to Home — should still be home screen
      await element(by.id('tab-home')).tap();
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should go to settings from profile', async () => {
      await element(by.id('tab-profile')).tap();
      await waitFor(element(by.id('profile-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('profile-settings-button')).tap();

      await waitFor(element(by.id('settings-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });
});
