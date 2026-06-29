import { useEffect } from 'react';
import client from '../api/client';

// Polls the public theme endpoint once on load and injects PETITI's current
// custom CSS as a <style> tag appended after theme.css, so any override
// PETITI applies through the Site Editor takes effect immediately for every
// visitor — no rebuild/redeploy required. Mount this once near the app root.
export default function PetitiStyleInjector() {
  useEffect(() => {
    client.get('/site/theme')
      .then(({ data }) => {
        const css = data?.theme?.custom_css;
        if (!css) return;
        const styleTag = document.createElement('style');
        styleTag.id = 'petiti-custom-css';
        styleTag.innerHTML = css;
        document.head.appendChild(styleTag);
      })
      .catch(() => {}); // non-fatal: app works fine with zero overrides
  }, []);

  return null;
}
