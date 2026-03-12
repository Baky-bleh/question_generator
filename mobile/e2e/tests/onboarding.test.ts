import { by, device, element, expect } from 'detox';
import { registerFreshUser } from '../helpers';

describe('Onboarding Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Welcome Screen', () => {
    it('should display welcome screen with mascot and "Get Started" button', async () => {
      await registerFreshUser();

      await expect(element(by.id('onboarding-welcome-screen'))).toBeVisible();
      await expect(element(by.id('onboarding-mascot'))).toBeVisible();
      await expect(element(by.text('LinguaLeap'))).toBeVisible();
      await expect(element(by.id('onboarding-get-started-button'))).toBeVisible();
    });

    it('should navigate to subject selection after tapping "Get Started"', async () => {
      await registerFreshUser();

      await element(by.id('onboarding-get-started-button')).tap();

      await waitFor(element(by.id('onboarding-subject-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.text('What do you want to learn?'))).toBeVisible();
    });
  });

  describe('English Path', () => {
    it('should select English and navigate to goal selection', async () => {
      await registerFreshUser();

      // Welcome -> Subject selection
      await element(by.id('onboarding-get-started-button')).tap();
      await waitFor(element(by.id('onboarding-subject-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap "English" subject card
      await element(by.id('subject-english-card')).tap();

      // Should navigate to goal selection screen
      await waitFor(element(by.id('onboarding-goal-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should select a goal and reach home screen', async () => {
      await registerFreshUser();

      // Welcome -> Subject
      await element(by.id('onboarding-get-started-button')).tap();
      await waitFor(element(by.id('onboarding-subject-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Subject -> English -> Goal
      await element(by.id('subject-english-card')).tap();
      await waitFor(element(by.id('onboarding-goal-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Select a goal option (e.g., "Regular" 10 min/day)
      await element(by.id('goal-regular-option')).tap();

      // Should navigate to home/tabs
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('Math Path', () => {
    it('should select Math and navigate to math category selection', async () => {
      await registerFreshUser();

      // Welcome -> Subject
      await element(by.id('onboarding-get-started-button')).tap();
      await waitFor(element(by.id('onboarding-subject-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap "Math" subject card
      await element(by.id('subject-math-card')).tap();

      // Should show math category selection (SAT, Olympiad, EYESH, Class)
      await waitFor(element(by.id('math-category-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.text('Choose Math Track'))).toBeVisible();
      await expect(element(by.id('math-category-sat'))).toBeVisible();
      await expect(element(by.id('math-category-olympiad'))).toBeVisible();
      await expect(element(by.id('math-category-eyesh'))).toBeVisible();
      await expect(element(by.id('math-category-class'))).toBeVisible();
    });

    it('should select SAT Prep and navigate to goal selection', async () => {
      await registerFreshUser();

      await element(by.id('onboarding-get-started-button')).tap();
      await waitFor(element(by.id('onboarding-subject-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('subject-math-card')).tap();
      await waitFor(element(by.id('math-category-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('math-category-sat')).tap();

      await waitFor(element(by.id('onboarding-goal-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should select Class track and show class grade selection', async () => {
      await registerFreshUser();

      await element(by.id('onboarding-get-started-button')).tap();
      await waitFor(element(by.id('onboarding-subject-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('subject-math-card')).tap();
      await waitFor(element(by.id('math-category-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('math-category-class')).tap();

      // Should show class/grade selection (1-12)
      await waitFor(element(by.id('class-select-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.text('Select Your Class'))).toBeVisible();
      await expect(element(by.id('class-grade-1'))).toBeVisible();
      await expect(element(by.id('class-grade-12'))).toBeVisible();
    });

    it('should select a class grade and proceed to goal selection', async () => {
      await registerFreshUser();

      await element(by.id('onboarding-get-started-button')).tap();
      await waitFor(element(by.id('onboarding-subject-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('subject-math-card')).tap();
      await waitFor(element(by.id('math-category-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('math-category-class')).tap();
      await waitFor(element(by.id('class-select-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap Class 7
      await element(by.id('class-grade-7')).tap();

      await waitFor(element(by.id('onboarding-goal-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should navigate back from math categories to subject selection', async () => {
      await registerFreshUser();

      await element(by.id('onboarding-get-started-button')).tap();
      await waitFor(element(by.id('onboarding-subject-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('subject-math-card')).tap();
      await waitFor(element(by.id('math-category-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap back button
      await element(by.id('math-category-back-button')).tap();

      await waitFor(element(by.id('onboarding-subject-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });
});
