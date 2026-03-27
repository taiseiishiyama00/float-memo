import { test, expect, _electron as electron } from 'playwright/test';

test('app launches and shows editor', async () => {
  const app = await electron.launch({ args: ['.'] });
  const window = await app.firstWindow();
  await expect(window.locator('#editor')).toBeVisible();
  await app.close();
});
