import { Router } from 'express';
import { withPage } from '../index.js';

const router = Router();

interface LinkedInRequest {
  url: string;
}

interface LinkedInProfile {
  name: string;
  title: string;
  company: string;
  location: string;
  summary: string;
  experience: string[];
  education: string[];
  skills: string[];
  profileUrl: string;
}

router.post('/', async (req, res) => {
  try {
    const body = req.body as LinkedInRequest;
    const { url } = body;

    if (!url) {
      res.status(400).json({ error: 'url is required' });
      return;
    }

    if (!url.includes('linkedin.com/in/')) {
      res.status(400).json({
        error: 'Invalid LinkedIn URL',
        message: 'URL must be a LinkedIn public profile URL (linkedin.com/in/...)',
      });
      return;
    }

    try {
      new URL(url);
    } catch {
      res.status(400).json({ error: `Invalid URL: ${url}` });
      return;
    }

    const profile = await withPage(async (page) => {
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await page.waitForSelector('h1', { timeout: 10000 }).catch(() => {
        console.log('Profile h1 not found, proceeding anyway...');
      });

      await new Promise((r) => setTimeout(r, 3000));

      // Dismiss any sign-in modal if present
      const closeModal = await page.$('[aria-label="Dismiss"]');
      if (closeModal) {
        await closeModal.click();
        await new Promise((r) => setTimeout(r, 500));
      }

      const profile: LinkedInProfile = await page.evaluate(() => {
        const getText = (selector: string): string => {
          const el = document.querySelector(selector);
          return el?.textContent?.trim() || '';
        };

        const name =
          getText('h1') || getText('.text-heading-xlarge') || getText('h1.text-heading-xlarge');

        const title =
          getText('.text-body-medium') ||
          getText('.text-body-medium-break-words') ||
          getText('div.text-body-medium');

        const company =
          getText('.pv-text-details__right-panel .inline-show-more-text') ||
          getText('[aria-label="Current company"]') ||
          getText('.inline-show-more-text--is-collapsed');

        const location =
          getText('.text-body-small.inline.t-black--light') ||
          getText('[aria-label="Location"]') ||
          getText('.text-body-small:nth-child(2)');

        const summary =
          getText('.pv-about-section .inline-show-more-text') ||
          getText('[data-testid="about-section"] .inline-show-more-text') ||
          getText('.pv-shared-text-for-white-space') ||
          getText('#about + .pv-shared-text-for-white-space') ||
          getText('section.about .display-flex');

        const experienceItems: string[] = [];
        const expSection = document.getElementById('experience');
        if (expSection) {
          const expItems = expSection.querySelectorAll('.pv-entity__summary-info, .t-14.t-normal');
          expItems.forEach((item) => {
            const text = item.textContent?.trim();
            if (text) experienceItems.push(text.replace(/\s+/g, ' '));
          });
        }

        if (experienceItems.length === 0) {
          const expListItems = document.querySelectorAll('#experience ~ div .display-flex.flex-column');
          expListItems.forEach((item) => {
            const text = item.textContent?.trim();
            if (text && text.length > 5) experienceItems.push(text.replace(/\s+/g, ' '));
          });
        }

        const educationItems: string[] = [];
        const eduSection = document.getElementById('education');
        if (eduSection) {
          const eduItems = eduSection.querySelectorAll('.pv-entity__summary-info, .t-14.t-normal');
          eduItems.forEach((item) => {
            const text = item.textContent?.trim();
            if (text) educationItems.push(text.replace(/\s+/g, ' '));
          });
        }

        if (educationItems.length === 0) {
          const eduListItems = document.querySelectorAll('#education ~ div .display-flex.flex-column');
          eduListItems.forEach((item) => {
            const text = item.textContent?.trim();
            if (text && text.length > 5) educationItems.push(text.replace(/\s+/g, ' '));
          });
        }

        const skills: string[] = [];
        const skillElements = document.querySelectorAll('.pv-skill-category-entity__name-text, .t-14.t-bold');
        skillElements.forEach((el) => {
          const text = el.textContent?.trim();
          if (text && text.length < 50) skills.push(text);
        });

        return {
          name,
          title,
          company,
          location,
          summary,
          experience: experienceItems.slice(0, 10),
          education: educationItems.slice(0, 5),
          skills: skills.slice(0, 20),
          profileUrl: window.location.href,
        };
      });

      return profile;
    });

    res.json(profile);
  } catch (error: any) {
    console.error('LinkedIn scraping error:', error);
    res.status(500).json({
      error: 'LinkedIn scraping failed',
      message: error.message || 'An error occurred during LinkedIn profile scraping',
    });
  }
});

export { router as linkedinRouter };
