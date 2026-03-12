import { by, element } from 'detox';

/**
 * Log in with the default test user credentials.
 * Waits for the home screen to confirm successful login.
 */
export async function loginTestUser(
  email = 'testuser@example.com',
  password = 'Password123!',
): Promise<void> {
  await element(by.id('login-email-input')).typeText(email);
  await element(by.id('login-password-input')).typeText(password);
  await element(by.id('login-submit-button')).tap();

  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(10000);
}

/**
 * Register a fresh user through the signup flow.
 * Returns on the onboarding welcome screen.
 */
export async function registerFreshUser(
  name = 'Onboard User',
  emailPrefix = 'e2e_onboard',
): Promise<string> {
  await element(by.id('login-signup-link')).tap();
  await waitFor(element(by.id('signup-screen')))
    .toBeVisible()
    .withTimeout(5000);

  const uniqueEmail = `${emailPrefix}_${Date.now()}@test.com`;
  await element(by.id('signup-name-input')).typeText(name);
  await element(by.id('signup-email-input')).typeText(uniqueEmail);
  await element(by.id('signup-password-input')).typeText('TestPass123!');
  await element(by.id('signup-submit-button')).tap();

  await waitFor(element(by.id('onboarding-welcome-screen')))
    .toBeVisible()
    .withTimeout(10000);

  return uniqueEmail;
}

/**
 * Navigate to the skill tree via the Learn tab.
 */
export async function navigateToSkillTree(): Promise<void> {
  await element(by.id('tab-learn')).tap();
  await waitFor(element(by.id('skill-tree-screen')))
    .toBeVisible()
    .withTimeout(5000);
}

/**
 * Navigate to a video lesson from the skill tree.
 */
export async function navigateToVideoLesson(nodeIndex = 0): Promise<void> {
  await navigateToSkillTree();
  await element(by.id(`video-lesson-node-${nodeIndex}`)).tap();
  await waitFor(element(by.id('video-lesson-screen')))
    .toBeVisible()
    .withTimeout(10000);
}

/**
 * Attempt to answer whichever exercise type is currently displayed.
 */
async function attemptCurrentExercise(): Promise<void> {
  try {
    await waitFor(element(by.id('mc-option-0')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.id('mc-option-0')).tap();
    return;
  } catch {
    // Not multiple choice
  }

  try {
    await element(by.id('fill-blank-input')).typeText('answer');
    return;
  } catch {
    // Not fill-in-the-blank
  }

  try {
    await element(by.id('number-input-field')).typeText('42');
  } catch {
    // Other exercise type
  }
}

/**
 * Complete all exercises in the current lesson by answering each one.
 * Loops up to `maxExercises` times and breaks when the results screen appears.
 */
export async function completeAllExercises(maxExercises = 20): Promise<void> {
  for (let i = 0; i < maxExercises; i++) {
    try {
      await expect(element(by.id('lesson-results-screen'))).toBeVisible();
      break;
    } catch {
      // Still in exercise mode
    }

    await attemptCurrentExercise();

    try {
      await element(by.id('exercise-check-button')).tap();
    } catch {
      // Check button not visible
    }

    try {
      await waitFor(element(by.id('feedback-continue-button')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id('feedback-continue-button')).tap();
    } catch {
      // Feedback might not appear if auto-advancing
    }
  }
}
