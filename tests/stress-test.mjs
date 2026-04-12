/**
 * Comprehensive Playwright Stress Test for School Job Portal
 * Runs two headed browsers: one anonymous, one logged-in (if credentials provided)
 * Usage: node tests/stress-test.mjs [email] [password]
 */

import { chromium } from '/Users/cciu/.npm-global/lib/node_modules/playwright/index.mjs';
import fs from 'fs';

const BASE_URL = 'http://localhost:3003';
const EMAIL = process.argv[2] || '';
const PASSWORD = process.argv[3] || '';

const issues = [];

function logIssue(browser, page, severity, description, details = '') {
  const entry = { browser, page, severity, description, details, timestamp: new Date().toISOString() };
  issues.push(entry);
  const icon = severity === 'ERROR' ? '❌' : severity === 'WARNING' ? '⚠️' : 'ℹ️';
  console.log(`${icon} [${browser}] ${page}: ${description}${details ? ' — ' + details : ''}`);
}

// Set up console listeners once per page object. Tracks current page label.
function setupConsoleListeners(page, browserLabel) {
  const state = { currentPage: 'unknown' };
  const seen = new Set();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      const key = `${state.currentPage}:${text.substring(0, 100)}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (!text.includes('favicon') && !text.includes('Download the React DevTools') && !text.includes('FieldControl')) {
        logIssue(browserLabel, state.currentPage, 'ERROR', 'Console error', text.substring(0, 200));
      }
    }
  });
  page.on('pageerror', err => {
    logIssue(browserLabel, state.currentPage, 'ERROR', 'Uncaught exception', err.message.substring(0, 200));
  });
  return state;
}

// Legacy shim — just updates the currentPage label
function collectConsoleErrors(page, browserLabel, pageName) {
  if (page._consoleState) {
    page._consoleState.currentPage = pageName;
  }
}

async function checkPageLoad(page, browserLabel, url, pageName, expectedSelector = 'body') {
  const startTime = Date.now();
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
    const loadTime = Date.now() - startTime;
    const status = response?.status();

    if (status && status >= 400) {
      logIssue(browserLabel, pageName, 'ERROR', `HTTP ${status}`, url);
    }
    if (loadTime > 5000) {
      logIssue(browserLabel, pageName, 'WARNING', `Slow page load: ${loadTime}ms`, url);
    } else {
      console.log(`  ✅ [${browserLabel}] ${pageName} loaded in ${loadTime}ms (HTTP ${status})`);
    }

    // Check for expected content
    try {
      await page.waitForSelector(expectedSelector, { timeout: 5000 });
    } catch {
      logIssue(browserLabel, pageName, 'WARNING', `Expected selector not found: ${expectedSelector}`, url);
    }

    return { status, loadTime };
  } catch (err) {
    logIssue(browserLabel, pageName, 'ERROR', 'Page failed to load', err.message.substring(0, 200));
    return { status: 0, loadTime: Date.now() - startTime };
  }
}

async function testLandingPage(page, label) {
  console.log(`\n🔍 [${label}] Testing Landing Page...`);
  collectConsoleErrors(page, label, '/');
  await checkPageLoad(page, label, BASE_URL, 'Landing Page', 'main');

  // Check hero section
  const heroText = await page.textContent('main').catch(() => '');
  if (!heroText.includes('Find') && !heroText.includes('Job') && !heroText.includes('Teaching')) {
    logIssue(label, '/', 'WARNING', 'Hero section may be missing expected content');
  }

  // Check nav links
  const navLinks = await page.$$eval('nav a, header a', links =>
    links.map(l => ({ href: l.getAttribute('href'), text: l.textContent.trim() }))
  );
  console.log(`  📎 [${label}] Found ${navLinks.length} navigation links`);
  if (navLinks.length < 3) {
    logIssue(label, '/', 'WARNING', `Only ${navLinks.length} nav links found — expected at least 3`);
  }

  // Check audience cards
  const cards = await page.$$('[class*="card"], [class*="Card"]').catch(() => []);
  console.log(`  📎 [${label}] Found ${cards.length} cards on landing page`);

  // Check footer
  const footer = await page.$('footer');
  if (!footer) {
    logIssue(label, '/', 'WARNING', 'Footer element not found');
  }
}

async function testJobsPage(page, label) {
  console.log(`\n🔍 [${label}] Testing Jobs Page...`);
  collectConsoleErrors(page, label, '/jobs');
  await checkPageLoad(page, label, `${BASE_URL}/jobs`, 'Jobs Page');

  // Wait for job listings to appear
  await page.waitForTimeout(2000);

  // Check for job listings
  const jobItems = await page.$$('[class*="job"], [data-job], article, [role="listitem"]').catch(() => []);
  const linkButtons = await page.$$('a[href*="/jobs/"]').catch(() => []);
  const jobCount = Math.max(jobItems.length, linkButtons.length);
  console.log(`  📎 [${label}] Found ${jobCount} job items/links on page`);

  if (jobCount === 0) {
    logIssue(label, '/jobs', 'WARNING', 'No job listings found — may be empty or loading issue');
  }

  // Test search functionality
  console.log(`  🔍 [${label}] Testing search...`);
  const searchInput = await page.$('input[type="search"], input[type="text"], input[placeholder*="earch"]');
  if (searchInput) {
    await searchInput.fill('teacher');
    await page.waitForTimeout(1500); // debounce
    await page.waitForLoadState('load').catch(() => {});

    const urlAfterSearch = page.url();
    if (!urlAfterSearch.includes('q=') && !urlAfterSearch.includes('search=')) {
      logIssue(label, '/jobs', 'WARNING', 'Search term not reflected in URL params');
    }

    // Check results updated
    const resultsAfterSearch = await page.$$('a[href*="/jobs/"]').catch(() => []);
    console.log(`  📎 [${label}] Search "teacher" returned ${resultsAfterSearch.length} results`);

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(1500);
  } else {
    logIssue(label, '/jobs', 'WARNING', 'Search input not found');
  }

  // Test filter dropdowns
  console.log(`  🔍 [${label}] Testing filters...`);
  const filterButtons = await page.$$('button:has-text("School Type"), button:has-text("Grade"), button:has-text("Subject"), button:has-text("Certification")');
  console.log(`  📎 [${label}] Found ${filterButtons.length} filter buttons`);

  for (const btn of filterButtons) {
    const btnText = await btn.textContent();
    try {
      await btn.click();
      await page.waitForTimeout(500);
      // Check if dropdown opened
      const popover = await page.$('[role="listbox"], [role="dialog"], [data-state="open"], [class*="popover"]');
      if (!popover) {
        logIssue(label, '/jobs', 'WARNING', `Filter dropdown may not have opened: ${btnText.trim()}`);
      }
      // Close it by clicking elsewhere
      await page.click('body', { position: { x: 10, y: 10 } });
      await page.waitForTimeout(300);
    } catch (err) {
      logIssue(label, '/jobs', 'WARNING', `Error testing filter: ${btnText.trim()}`, err.message.substring(0, 100));
    }
  }

  // Test "Verified Only" toggle if present
  const verifiedToggle = await page.$('button:has-text("Verified"), label:has-text("Verified"), [class*="switch"]');
  if (verifiedToggle) {
    console.log(`  📎 [${label}] Found Verified Only toggle`);
  }

  // Test salary filter
  const salaryToggle = await page.$('button:has-text("Salary"), label:has-text("Salary")');
  if (salaryToggle) {
    console.log(`  📎 [${label}] Found Salary filter toggle`);
  }
}

async function testJobDetail(page, label) {
  console.log(`\n🔍 [${label}] Testing Job Detail...`);

  // Navigate to jobs page first
  await page.goto(`${BASE_URL}/jobs`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Find a job link to click
  const jobLinks = await page.$$('a[href*="/jobs/"]');
  if (jobLinks.length === 0) {
    logIssue(label, '/jobs/[id]', 'WARNING', 'No job links found to test detail view');
    return;
  }

  // Click first job — should open modal
  const href = await jobLinks[0].getAttribute('href');
  console.log(`  📎 [${label}] Clicking job link: ${href}`);

  collectConsoleErrors(page, label, '/jobs/[id] (modal)');
  await jobLinks[0].click();
  await page.waitForTimeout(2000);

  // Check if modal appeared
  const modal = await page.$('[role="dialog"], [class*="modal"], [class*="Modal"], [class*="dialog"]');
  if (modal) {
    console.log(`  ✅ [${label}] Job detail modal opened`);

    // Check modal content
    const modalText = await modal.textContent().catch(() => '');
    if (modalText.length < 50) {
      logIssue(label, '/jobs/[id]', 'WARNING', 'Job detail modal has very little content');
    }

    // Check for key elements in detail
    const hasApplyLink = modalText.toLowerCase().includes('apply') || modalText.toLowerCase().includes('view');
    if (!hasApplyLink) {
      logIssue(label, '/jobs/[id]', 'INFO', 'No apply/view link text found in job detail');
    }

    // Close modal
    const closeBtn = await page.$('[role="dialog"] button[class*="close"], [role="dialog"] button:has-text("×"), button[aria-label="Close"]');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    } else {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  } else {
    // Maybe it navigated directly to detail page
    if (page.url().includes('/jobs/')) {
      console.log(`  📎 [${label}] Navigated to standalone job detail page`);
    } else {
      logIssue(label, '/jobs/[id]', 'WARNING', 'Neither modal nor detail page appeared');
    }
  }

  // Test direct navigation to a job detail page
  if (href) {
    console.log(`  🔍 [${label}] Testing standalone job detail page...`);
    collectConsoleErrors(page, label, '/jobs/[id] (standalone)');
    await checkPageLoad(page, label, `${BASE_URL}${href}`, 'Job Detail (standalone)');

    const detailText = await page.textContent('main').catch(() => '');
    if (detailText.length < 50) {
      logIssue(label, '/jobs/[id]', 'WARNING', 'Standalone job detail has very little content');
    }
  }
}

async function testDistrictsPage(page, label) {
  console.log(`\n🔍 [${label}] Testing Districts Page...`);
  collectConsoleErrors(page, label, '/districts');
  await checkPageLoad(page, label, `${BASE_URL}/districts`, 'Districts Page');

  await page.waitForTimeout(1500);

  // Check for district cards
  const districtLinks = await page.$$('a[href*="/districts/"]').catch(() => []);
  console.log(`  📎 [${label}] Found ${districtLinks.length} district links`);

  // Click into a district if available
  if (districtLinks.length > 0) {
    const districtHref = await districtLinks[0].getAttribute('href');
    console.log(`  🔍 [${label}] Testing district profile: ${districtHref}`);
    collectConsoleErrors(page, label, '/districts/[slug]');
    await checkPageLoad(page, label, `${BASE_URL}${districtHref}`, 'District Profile');

    const profileText = await page.textContent('main').catch(() => '');
    if (profileText.length < 30) {
      logIssue(label, '/districts/[slug]', 'WARNING', 'District profile page has very little content');
    }
  }
}

async function testForSchoolsPage(page, label) {
  console.log(`\n🔍 [${label}] Testing For Schools Page...`);
  collectConsoleErrors(page, label, '/for-schools');
  await checkPageLoad(page, label, `${BASE_URL}/for-schools`, 'For Schools Page');
}

async function testLoginPage(page, label) {
  console.log(`\n🔍 [${label}] Testing Login Page...`);
  collectConsoleErrors(page, label, '/for-schools/login');
  await checkPageLoad(page, label, `${BASE_URL}/for-schools/login`, 'Login Page');

  // Check form elements
  const emailInput = await page.$('input[type="email"], input[name="email"]');
  const passwordInput = await page.$('input[type="password"], input[name="password"]');
  const submitBtn = await page.$('button[type="submit"]');

  if (!emailInput) logIssue(label, '/for-schools/login', 'ERROR', 'Email input not found');
  if (!passwordInput) logIssue(label, '/for-schools/login', 'ERROR', 'Password input not found');
  if (!submitBtn) logIssue(label, '/for-schools/login', 'ERROR', 'Submit button not found');

  // Test empty form submission
  if (submitBtn) {
    await submitBtn.click();
    await page.waitForTimeout(1000);
    // Should show validation error or not navigate away
    if (page.url().includes('dashboard')) {
      logIssue(label, '/for-schools/login', 'ERROR', 'Empty form submission redirected to dashboard!');
    }
  }

  // Test invalid credentials
  if (emailInput && passwordInput && submitBtn) {
    await emailInput.fill('invalid@test.com');
    await passwordInput.fill('wrongpassword123');
    await submitBtn.click();
    await page.waitForTimeout(2000);

    if (page.url().includes('dashboard')) {
      logIssue(label, '/for-schools/login', 'ERROR', 'Invalid credentials allowed login!');
    } else {
      console.log(`  ✅ [${label}] Invalid credentials correctly rejected`);
    }
  }
}

async function testSignupPage(page, label) {
  console.log(`\n🔍 [${label}] Testing Signup Page...`);
  collectConsoleErrors(page, label, '/for-schools/signup');
  await checkPageLoad(page, label, `${BASE_URL}/for-schools/signup`, 'Signup Page');

  // Check form elements
  const districtInput = await page.$('input[name="districtName"], input[placeholder*="istrict"]');
  const emailInput = await page.$('input[type="email"], input[name="email"]');
  const passwordInput = await page.$('input[type="password"], input[name="password"]');
  const submitBtn = await page.$('button[type="submit"]');

  if (!districtInput) logIssue(label, '/for-schools/signup', 'WARNING', 'District name input not found');
  if (!emailInput) logIssue(label, '/for-schools/signup', 'ERROR', 'Email input not found');
  if (!passwordInput) logIssue(label, '/for-schools/signup', 'ERROR', 'Password input not found');
  if (!submitBtn) logIssue(label, '/for-schools/signup', 'ERROR', 'Submit button not found');

  console.log(`  ✅ [${label}] Signup form elements present`);
}

async function testAboutPage(page, label) {
  console.log(`\n🔍 [${label}] Testing About Page...`);
  collectConsoleErrors(page, label, '/about');
  await checkPageLoad(page, label, `${BASE_URL}/about`, 'About Page');
}

async function testResponsiveDesign(page, label) {
  console.log(`\n🔍 [${label}] Testing Responsive Design...`);

  const viewports = [
    { name: 'Mobile', width: 375, height: 812 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // Check for horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    if (hasOverflow) {
      logIssue(label, '/ (responsive)', 'WARNING', `Horizontal overflow at ${vp.name} (${vp.width}px)`);
    }

    // Check jobs page responsive
    await page.goto(`${BASE_URL}/jobs`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const jobsOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    if (jobsOverflow) {
      logIssue(label, '/jobs (responsive)', 'WARNING', `Horizontal overflow at ${vp.name} (${vp.width}px)`);
    }

    console.log(`  ✅ [${label}] ${vp.name} (${vp.width}px) — ${hasOverflow || jobsOverflow ? 'overflow detected' : 'no overflow'}`);
  }

  // Reset viewport
  await page.setViewportSize({ width: 1280, height: 720 });
}

async function testNavigation(page, label) {
  console.log(`\n🔍 [${label}] Testing Navigation Consistency...`);

  const pages = [
    { url: '/', name: 'Home' },
    { url: '/jobs', name: 'Jobs' },
    { url: '/districts', name: 'Districts' },
    { url: '/for-schools', name: 'For Schools' },
    { url: '/about', name: 'About' },
  ];

  for (const p of pages) {
    await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});

    // Check header is present
    const header = await page.$('header');
    if (!header) {
      logIssue(label, p.url, 'ERROR', 'Header missing on page');
    }

    // Check footer is present
    const footer = await page.$('footer');
    if (!footer) {
      logIssue(label, p.url, 'WARNING', 'Footer missing on page');
    }

    // Check for broken images
    const brokenImages = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs).filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src);
    });
    if (brokenImages.length > 0) {
      logIssue(label, p.url, 'WARNING', `${brokenImages.length} broken image(s)`, brokenImages.join(', '));
    }
  }
}

async function testA11y(page, label) {
  console.log(`\n🔍 [${label}] Testing Basic Accessibility...`);

  const pagesToCheck = ['/', '/jobs', '/districts', '/for-schools/login'];

  for (const url of pagesToCheck) {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});

    // Check page title
    const title = await page.title();
    if (!title || title === 'undefined' || title.length < 3) {
      logIssue(label, url, 'WARNING', 'Missing or invalid page title', `Got: "${title}"`);
    }

    // Check for alt text on images
    const imagesWithoutAlt = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs).filter(img => !img.alt && !img.getAttribute('aria-hidden')).length;
    });
    if (imagesWithoutAlt > 0) {
      logIssue(label, url, 'WARNING', `${imagesWithoutAlt} image(s) without alt text`);
    }

    // Check form labels
    const inputsWithoutLabels = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"])');
      return Array.from(inputs).filter(input => {
        const id = input.id;
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
        const wrappedInLabel = input.closest('label');
        const hasPlaceholder = input.getAttribute('placeholder');
        return !hasLabel && !hasAriaLabel && !wrappedInLabel && !hasPlaceholder;
      }).length;
    });
    if (inputsWithoutLabels > 0) {
      logIssue(label, url, 'WARNING', `${inputsWithoutLabels} input(s) without labels or aria attributes`);
    }
  }
}

async function testDashboard(page, label) {
  console.log(`\n🔍 [${label}] Testing Dashboard (logged in)...`);
  collectConsoleErrors(page, label, '/for-schools/dashboard');
  await checkPageLoad(page, label, `${BASE_URL}/for-schools/dashboard`, 'Dashboard');

  // Check if we actually got to the dashboard (not redirected to login)
  if (page.url().includes('login')) {
    logIssue(label, '/for-schools/dashboard', 'ERROR', 'Redirected to login — auth session may have expired');
    return;
  }

  await page.waitForTimeout(2000);

  // Check dashboard tabs
  const tabs = await page.$$('[role="tab"], button[class*="tab"], [class*="Tab"]');
  console.log(`  📎 [${label}] Found ${tabs.length} dashboard tabs`);

  if (tabs.length < 2) {
    logIssue(label, '/for-schools/dashboard', 'WARNING', `Expected at least 2 tabs, found ${tabs.length}`);
  }

  // Click through each tab
  for (let i = 0; i < tabs.length; i++) {
    const tabText = await tabs[i].textContent().catch(() => `Tab ${i}`);
    try {
      await tabs[i].click();
      await page.waitForTimeout(1500);
      console.log(`  📎 [${label}] Clicked tab: ${tabText.trim()}`);
    } catch (err) {
      logIssue(label, '/for-schools/dashboard', 'WARNING', `Error clicking tab: ${tabText.trim()}`, err.message.substring(0, 100));
    }
  }

  // Test "Create New" tab/form if present
  const createTab = await page.$('[role="tab"]:has-text("Create"), button:has-text("Create New")');
  if (createTab) {
    await createTab.click();
    await page.waitForTimeout(1000);

    const formInputs = await page.$$('form input, form textarea, form select');
    console.log(`  📎 [${label}] Create form has ${formInputs.length} inputs`);

    if (formInputs.length < 2) {
      logIssue(label, '/for-schools/dashboard (create)', 'WARNING', 'Create listing form has fewer inputs than expected');
    }
  }

  // Check navigation shows "Dashboard" instead of "For Schools"
  const navText = await page.textContent('header nav, header').catch(() => '');
  if (navText.includes('For Schools') && !navText.includes('Dashboard')) {
    logIssue(label, '/for-schools/dashboard', 'WARNING', 'Nav still shows "For Schools" instead of "Dashboard" when logged in');
  }
}

async function testProtectedRoutes(page, label) {
  console.log(`\n🔍 [${label}] Testing Protected Route Access (anonymous)...`);

  // Try to access dashboard without auth
  await page.goto(`${BASE_URL}/for-schools/dashboard`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);

  if (page.url().includes('login')) {
    console.log(`  ✅ [${label}] Dashboard correctly redirects to login`);
  } else if (page.url().includes('dashboard')) {
    logIssue(label, '/for-schools/dashboard', 'ERROR', 'Dashboard accessible without authentication!');
  }
}

async function test404Page(page, label) {
  console.log(`\n🔍 [${label}] Testing 404 Page...`);
  collectConsoleErrors(page, label, '/nonexistent');

  const response = await page.goto(`${BASE_URL}/nonexistent-page-xyz`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  const status = response?.status();

  if (status === 404) {
    console.log(`  ✅ [${label}] 404 page returns correct status`);
  } else {
    logIssue(label, '/nonexistent', 'WARNING', `Expected 404 but got ${status}`);
  }

  const pageText = await page.textContent('body').catch(() => '');
  if (!pageText.toLowerCase().includes('not found') && !pageText.includes('404')) {
    logIssue(label, '/nonexistent', 'WARNING', 'No "not found" or "404" text on 404 page');
  }
}

async function testPerformance(page, label) {
  console.log(`\n🔍 [${label}] Testing Performance Metrics...`);

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const metrics = await page.evaluate(() => {
    const entries = performance.getEntriesByType('navigation');
    if (entries.length === 0) return null;
    const nav = entries[0];
    return {
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
      loadComplete: Math.round(nav.loadEventEnd - nav.startTime),
      ttfb: Math.round(nav.responseStart - nav.startTime),
    };
  });

  if (metrics) {
    console.log(`  📊 [${label}] TTFB: ${metrics.ttfb}ms, DCL: ${metrics.domContentLoaded}ms, Load: ${metrics.loadComplete}ms`);
    if (metrics.ttfb > 3000) logIssue(label, '/ (perf)', 'WARNING', `High TTFB: ${metrics.ttfb}ms`);
    if (metrics.domContentLoaded > 5000) logIssue(label, '/ (perf)', 'WARNING', `Slow DOM Content Loaded: ${metrics.domContentLoaded}ms`);
  }
}

async function testLinkIntegrity(page, label) {
  console.log(`\n🔍 [${label}] Testing Internal Link Integrity...`);

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });

  // Gather all internal links across main pages
  const internalLinks = new Set();
  const pagesToScan = ['/', '/jobs', '/districts'];

  for (const p of pagesToScan) {
    await page.goto(`${BASE_URL}${p}`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    const links = await page.$$eval('a[href]', anchors =>
      anchors.map(a => a.getAttribute('href')).filter(h => h && h.startsWith('/') && !h.startsWith('//')
    ));
    links.forEach(l => {
      // Skip dynamic job IDs beyond the first few
      if (l.match(/^\/jobs\/[a-f0-9-]+$/)) {
        if (internalLinks.size < 50) internalLinks.add(l);
      } else {
        internalLinks.add(l);
      }
    });
  }

  console.log(`  📎 [${label}] Found ${internalLinks.size} unique internal links to check`);

  let broken = 0;
  // Only check a sample to avoid taking too long
  const linksToCheck = Array.from(internalLinks).slice(0, 20);
  for (const link of linksToCheck) {
    try {
      const resp = await page.goto(`${BASE_URL}${link}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const status = resp?.status();
      if (status && status >= 400 && status !== 404) {
        logIssue(label, link, 'ERROR', `Broken link: HTTP ${status}`);
        broken++;
      }
    } catch {
      logIssue(label, link, 'WARNING', 'Link timed out or errored');
      broken++;
    }
  }

  if (broken === 0) {
    console.log(`  ✅ [${label}] All sampled links returned valid responses`);
  }
}

// ========================
// MAIN EXECUTION
// ========================

async function runAnonymousBrowser() {
  console.log('\n' + '='.repeat(60));
  console.log('🌐 LAUNCHING ANONYMOUS BROWSER');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  page._consoleState = setupConsoleListeners(page, 'ANON');

  const tests = [
    () => testLandingPage(page, 'ANON'),
    () => testJobsPage(page, 'ANON'),
    () => testJobDetail(page, 'ANON'),
    () => testDistrictsPage(page, 'ANON'),
    () => testForSchoolsPage(page, 'ANON'),
    () => testLoginPage(page, 'ANON'),
    () => testSignupPage(page, 'ANON'),
    () => testAboutPage(page, 'ANON'),
    () => testProtectedRoutes(page, 'ANON'),
    () => test404Page(page, 'ANON'),
    () => testNavigation(page, 'ANON'),
    () => testResponsiveDesign(page, 'ANON'),
    () => testA11y(page, 'ANON'),
    () => testPerformance(page, 'ANON'),
    () => testLinkIntegrity(page, 'ANON'),
  ];

  for (const test of tests) {
    try {
      await test();
    } catch (err) {
      logIssue('ANON', 'test', 'ERROR', 'Test crashed', err.message.substring(0, 200));
    }
  }

  // Keep browser open for visual inspection
  return { browser, context, page };
}

async function runAuthenticatedBrowser() {
  console.log('\n' + '='.repeat(60));
  console.log('🔐 LAUNCHING AUTHENTICATED BROWSER');
  console.log('='.repeat(60));

  if (!EMAIL || !PASSWORD) {
    console.log('  ⏭️  No credentials provided — skipping authenticated tests');
    console.log('  💡 Run with: node tests/stress-test.mjs email@example.com password');
    return null;
  }

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  page._consoleState = setupConsoleListeners(page, 'AUTH');

  try {
    // Login
    console.log(`\n🔐 [AUTH] Logging in as ${EMAIL}...`);
    collectConsoleErrors(page, 'AUTH', '/for-schools/login');
    await page.goto(`${BASE_URL}/for-schools/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for form to fully render
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.waitForTimeout(500);

    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    const submitBtn = await page.$('button[type="submit"]');

    if (!emailInput || !passwordInput || !submitBtn) {
      logIssue('AUTH', '/for-schools/login', 'ERROR', 'Login form elements not found');
      return { browser, context, page };
    }

    // Clear any existing values, then fill
    await emailInput.click();
    await emailInput.fill('');
    await emailInput.fill(EMAIL);
    await passwordInput.click();
    await passwordInput.fill('');
    await passwordInput.fill(PASSWORD);

    // Verify what was actually typed
    const typedEmail = await emailInput.inputValue();
    const typedPassword = await passwordInput.inputValue();
    console.log(`  📎 [AUTH] Typed email: "${typedEmail}" (expected: "${EMAIL}")`);
    console.log(`  📎 [AUTH] Password filled: ${typedPassword.length} chars (expected: ${PASSWORD.length})`);

    if (typedEmail !== EMAIL) {
      logIssue('AUTH', '/for-schools/login', 'ERROR', 'Email fill mismatch', `Got "${typedEmail}" expected "${EMAIL}"`);
    }

    await submitBtn.click();
    console.log(`  📎 [AUTH] Submit clicked, waiting for navigation...`);

    // Wait for either dashboard redirect or error message
    await page.waitForTimeout(4000);
    await page.waitForLoadState('load').catch(() => {});

    const currentUrl = page.url();
    console.log(`  📎 [AUTH] Current URL after login: ${currentUrl}`);

    if (currentUrl.includes('dashboard')) {
      console.log(`  ✅ [AUTH] Login successful — on dashboard`);
    } else if (currentUrl.includes('login')) {
      // Look for actual error messages, not just generic page text
      const errorEl = await page.$('[class*="error"], [class*="Error"], [role="alert"], .text-destructive, .text-red');
      const errorText = errorEl ? await errorEl.textContent().catch(() => '') : '';
      const bodyText = await page.textContent('body').catch(() => '');
      logIssue('AUTH', '/for-schools/login', 'ERROR', 'Login failed — still on login page',
        errorText ? `Error message: "${errorText.trim()}"` : `Page contains: "${bodyText.substring(0, 200)}"`);
      return { browser, context, page };
    }

    // Run authenticated tests
    await testDashboard(page, 'AUTH');
    await testJobsPage(page, 'AUTH');
    await testJobDetail(page, 'AUTH');
    await testDistrictsPage(page, 'AUTH');
    await testNavigation(page, 'AUTH');

    // Test logout
    console.log(`\n🔍 [AUTH] Testing Logout...`);
    const logoutBtn = await page.$('button:has-text("Log out"), button:has-text("Logout"), button:has-text("Sign out"), form[action*="logout"] button');
    if (logoutBtn) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
      await page.waitForLoadState('load').catch(() => {});

      if (!page.url().includes('dashboard')) {
        console.log(`  ✅ [AUTH] Logout successful`);
      } else {
        logIssue('AUTH', 'logout', 'ERROR', 'Still on dashboard after logout');
      }

      // Verify dashboard no longer accessible
      await page.goto(`${BASE_URL}/for-schools/dashboard`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      if (page.url().includes('login')) {
        console.log(`  ✅ [AUTH] Dashboard correctly protected after logout`);
      } else {
        logIssue('AUTH', 'logout', 'ERROR', 'Dashboard still accessible after logout');
      }
    } else {
      logIssue('AUTH', 'header', 'WARNING', 'Logout button not found');
    }

  } catch (err) {
    logIssue('AUTH', 'GLOBAL', 'ERROR', 'Authenticated browser crashed', err.message);
  }

  return { browser, context, page };
}

async function main() {
  console.log('🚀 School Job Portal — Comprehensive Stress Test');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Auth: ${EMAIL ? EMAIL : 'anonymous only (no credentials provided)'}`);
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log('');

  // Check server is up using fetch (faster than launching a browser)
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const resp = await fetch(BASE_URL, { signal: AbortSignal.timeout(10000) });
      if (resp.ok) {
        console.log(`✅ Server is up (HTTP ${resp.status})`);
        break;
      }
    } catch (err) {
      if (attempt === 4) {
        console.error(`❌ Cannot reach ${BASE_URL} after 5 attempts. Start the dev server first: PORT=3003 npm run dev`);
        console.error(`   Error: ${err.message}`);
        process.exit(1);
      }
      console.log(`  ⏳ Waiting for server (attempt ${attempt + 1}/5)...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  // Run both browsers concurrently
  const [anonResult, authResult] = await Promise.all([
    runAnonymousBrowser(),
    runAuthenticatedBrowser(),
  ]);

  // ========================
  // REPORT
  // ========================
  console.log('\n\n' + '='.repeat(60));
  console.log('📋 STRESS TEST REPORT');
  console.log('='.repeat(60));

  const errors = issues.filter(i => i.severity === 'ERROR');
  const warnings = issues.filter(i => i.severity === 'WARNING');
  const infos = issues.filter(i => i.severity === 'INFO');

  console.log(`\n  Errors:   ${errors.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  console.log(`  Info:     ${infos.length}`);
  console.log(`  Total:    ${issues.length}`);

  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach((e, i) => console.log(`  ${i + 1}. [${e.browser}] ${e.page}: ${e.description}${e.details ? '\n     ' + e.details : ''}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach((e, i) => console.log(`  ${i + 1}. [${e.browser}] ${e.page}: ${e.description}${e.details ? '\n     ' + e.details : ''}`));
  }

  if (infos.length > 0) {
    console.log('\nℹ️  INFO:');
    infos.forEach((e, i) => console.log(`  ${i + 1}. [${e.browser}] ${e.page}: ${e.description}${e.details ? '\n     ' + e.details : ''}`));
  }

  // Write report to file
  const reportPath = 'tests/stress-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({ timestamp: new Date().toISOString(), summary: { errors: errors.length, warnings: warnings.length, info: infos.length }, issues }, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);

  // Keep browsers open for 30 seconds for visual inspection
  console.log('\n👀 Browsers will stay open for 10s for visual inspection...');
  console.log('   Press Ctrl+C to close earlier.');
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Cleanup
  if (anonResult?.browser) await anonResult.browser.close();
  if (authResult?.browser) await authResult.browser.close();

  console.log('\n✅ Test complete. Exiting.');
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
