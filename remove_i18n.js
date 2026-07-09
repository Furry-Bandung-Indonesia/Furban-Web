const fs = require('fs');

let i18nContent = fs.readFileSync('frontend/src/i18n/index.js', 'utf8');

// The easiest way is to use regex to remove the `privacy: { ... },` and `terms: { ... },` blocks
// Since they are well-defined, we can match from `privacy: {` to the next property `terms: {`
// and from `terms: {` to `faq: {`.

i18nContent = i18nContent.replace(/privacy:\s*\{[\s\S]*?terms:\s*\{/, 'terms: {');
i18nContent = i18nContent.replace(/terms:\s*\{[\s\S]*?faq:\s*\{/, 'faq: {');

fs.writeFileSync('frontend/src/i18n/index.js', i18nContent);
console.log('Removed privacy and terms from i18n/index.js');
