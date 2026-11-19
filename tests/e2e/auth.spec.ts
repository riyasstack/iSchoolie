import { expect, test } from '@playwright/test';

/**
 * Public authentication surface.
 *
 * These tests need no fixture data: they cover rendering, validation, keyboard
 * access and open-redirect protection. Flows that require an identity (signup,
 * verification, onboarding) run against the emulator in onboarding.spec.ts.
 */
test.describe('login page', () => {
  test('renders the premium split layout with both brand and form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByText('Sign in to your iSchoolie account.')).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create account' })).toBeVisible();
  });

  test('shows inline validation instead of submitting an empty form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByText('Enter your email address')).toBeVisible();
    await expect(page.getByText('Enter your password')).toBeVisible();
  });

  test('rejects a malformed email address', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('not-an-email');
    await page.getByLabel('Password', { exact: true }).fill('something1');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByText('Enter a valid email address')).toBeVisible();
  });

  test('toggles password visibility with an accessible control', async ({ page }) => {
    await page.goto('/login');
    const password = page.getByLabel('Password', { exact: true });
    await password.fill('supersecret1');
    await expect(password).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(password).toHaveAttribute('type', 'password');
  });

  test('is reachable by keyboard with a visible focus ring', async ({ page }) => {
    await page.goto('/login');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName ?? '');
    expect(focused.length).toBeGreaterThan(0);
    await page.getByLabel('Email address').focus();
    const outline = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      const styles = window.getComputedStyle(element);
      return `${styles.outlineStyle} ${styles.outlineWidth}`;
    });
    expect(outline).not.toBe('none 0px');
  });

  test('ignores an external redirect target', async ({ page }) => {
    await page.goto('/login?next=https://evil.example/steal');
    const createAccount = page.getByRole('link', { name: 'Create account' });
    await expect(createAccount).toHaveAttribute('href', /^\/signup\?next=%2Fdashboard$/);
  });
});

test.describe('signup page', () => {
  test('collects only the minimum fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByLabel('Full name')).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Confirm password')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /Terms and Conditions/ })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /Privacy Policy/ })).toBeVisible();
  });

  test('requires both consents', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Full name').fill('Aisha Rahman');
    await page.getByLabel('Email address').fill('aisha@example.test');
    await page.getByLabel('Password', { exact: true }).fill('longenough1');
    await page.getByLabel('Confirm password').fill('longenough1');
    await page.getByRole('button', { name: 'Create iSchoolie account' }).click();
    await expect(page.getByText('Accept the Terms and Conditions to continue')).toBeVisible();
    await expect(page.getByText('Acknowledge the Privacy Policy to continue')).toBeVisible();
  });

  test('flags a password confirmation mismatch', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Password', { exact: true }).fill('longenough1');
    await page.getByLabel('Confirm password').fill('different1');
    await page.getByLabel('Full name').click();
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('shows password strength guidance', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Password', { exact: true }).fill('abc');
    await expect(page.getByText('Use at least 8 characters.')).toBeVisible();
    await page.getByLabel('Password', { exact: true }).fill('CorrectHorse-Battery-9');
    await expect(page.getByText('Strong')).toBeVisible();
  });
});

test.describe('recovery pages', () => {
  test('forgot password validates the address', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  });

  test('an invalid recovery link is handled honestly', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByRole('heading', { name: 'Link not valid' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Request a new reset link' })).toBeVisible();
  });

  test('the auth error page explains provider failures', async ({ page }) => {
    await page.goto('/auth/error?message=This%20domain%20is%20not%20authorised');
    await expect(page.getByRole('heading', { name: 'Sign-in was interrupted' })).toBeVisible();
    await expect(page.getByText('This domain is not authorised')).toBeVisible();
  });
});

test.describe('layout integrity', () => {
  test('does not scroll horizontally on a small screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of ['/', '/login', '/signup', '/help']) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} overflows horizontally`).toBeLessThanOrEqual(1);
    }
  });

  test('keeps headings in a sensible order', async ({ page }) => {
    await page.goto('/login');
    const levels = await page.$$eval('h1, h2, h3', (nodes) =>
      nodes.map((node) => Number(node.tagName.slice(1))),
    );
    expect(levels[0]).toBe(1);
  });
});
