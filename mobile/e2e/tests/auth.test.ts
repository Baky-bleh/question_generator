import { by, device, element, expect } from 'detox';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Login', () => {
    it('should display the login screen on launch', async () => {
      await expect(element(by.id('login-screen'))).toBeVisible();
      await expect(element(by.id('login-email-input'))).toBeVisible();
      await expect(element(by.id('login-password-input'))).toBeVisible();
      await expect(element(by.id('login-submit-button'))).toBeVisible();
    });

    it('should show the mascot on the login screen', async () => {
      await expect(element(by.id('login-mascot'))).toBeVisible();
    });

    it('should show the app title "LinguaLeap"', async () => {
      await expect(element(by.text('LinguaLeap'))).toBeVisible();
    });

    it('should login with valid credentials and navigate to home', async () => {
      await element(by.id('login-email-input')).typeText('testuser@example.com');
      await element(by.id('login-password-input')).typeText('Password123!');
      await element(by.id('login-submit-button')).tap();

      // After successful login, user should land on home screen
      // (assumes user has completed onboarding previously)
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should show error message for invalid credentials', async () => {
      await element(by.id('login-email-input')).typeText('wrong@example.com');
      await element(by.id('login-password-input')).typeText('wrongpassword');
      await element(by.id('login-submit-button')).tap();

      await waitFor(element(by.id('login-error-banner')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show error for empty email', async () => {
      await element(by.id('login-password-input')).typeText('Password123!');
      await element(by.id('login-submit-button')).tap();

      // Form validation should prevent submission or show error
      await waitFor(element(by.id('login-error-banner')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should display social login buttons', async () => {
      await expect(element(by.id('google-login-button'))).toBeVisible();
      // Apple login only on iOS
      if (device.getPlatform() === 'ios') {
        await expect(element(by.id('apple-login-button'))).toBeVisible();
      }
    });
  });

  describe('Sign Up Navigation', () => {
    it('should navigate to signup screen when tapping "Sign Up" link', async () => {
      await element(by.id('login-signup-link')).tap();

      await waitFor(element(by.id('signup-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.text('Create Account'))).toBeVisible();
      await expect(element(by.id('signup-email-input'))).toBeVisible();
      await expect(element(by.id('signup-password-input'))).toBeVisible();
      await expect(element(by.id('signup-name-input'))).toBeVisible();
      await expect(element(by.id('signup-submit-button'))).toBeVisible();
    });

    it('should navigate back to login from signup', async () => {
      await element(by.id('login-signup-link')).tap();

      await waitFor(element(by.id('signup-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('signup-login-link')).tap();

      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Registration', () => {
    it('should register a new user and navigate to onboarding', async () => {
      // Navigate to signup
      await element(by.id('login-signup-link')).tap();

      await waitFor(element(by.id('signup-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Fill registration form
      const uniqueEmail = `e2e_${Date.now()}@test.com`;
      await element(by.id('signup-name-input')).typeText('E2E Test User');
      await element(by.id('signup-email-input')).typeText(uniqueEmail);
      await element(by.id('signup-password-input')).typeText('TestPass123!');
      await element(by.id('signup-submit-button')).tap();

      // After registration, user should be taken to onboarding welcome screen
      await waitFor(element(by.id('onboarding-welcome-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should show error when registering with existing email', async () => {
      await element(by.id('login-signup-link')).tap();

      await waitFor(element(by.id('signup-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('signup-name-input')).typeText('Duplicate User');
      await element(by.id('signup-email-input')).typeText('testuser@example.com');
      await element(by.id('signup-password-input')).typeText('TestPass123!');
      await element(by.id('signup-submit-button')).tap();

      await waitFor(element(by.id('signup-error-banner')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });
});
