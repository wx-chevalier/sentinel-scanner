/** 在页面内执行的脚本函数 */
/**
 * Executed on the page after the page has loaded. Strips script and
 * import tags to prevent further loading of resources.
 */
export function stripPage() {
  // Strip only script tags that contain JavaScript (either no type attribute or one that contains "javascript")
  const elements = document.querySelectorAll(
    'script:not([type]), script[type*="javascript"], link[rel=import]'
  );
  for (const e of Array.from(elements)) {
    e.remove();
  }
}

/**
 * Injects a <base> tag which allows other resources to load. This
 * has no effect on serialised output, but allows it to verify render
 * quality.
 */
export function injectBaseHref(origin: string) {
  const base = document.createElement('base');
  base.setAttribute('href', origin);

  const bases = document.head!.querySelectorAll('base');
  if (bases.length) {
    // Patch existing <base> if it is relative.
    const existingBase = bases[0].getAttribute('href') || '';
    if (existingBase.startsWith('/')) {
      bases[0].setAttribute('href', origin + existingBase);
    }
  } else {
    // Only inject <base> if it doesn't already exist.
    document.head!.insertAdjacentElement('afterbegin', base);
  }
}
