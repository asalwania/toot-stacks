export interface Tool {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  longDescription: string;
  icon: string;
  category: 'dev' | 'media' | 'text' | 'design' | 'security' | 'utility';
  categoryLabel: string;
  keywords: string[];
  color: string;
  isNew?: boolean;
}

export const tools: Tool[] = [
  {
    id: 'json-formatter',
    slug: 'json-formatter',
    name: 'JSON Formatter & Validator',
    shortName: 'JSON Formatter',
    description: 'Format, validate, and minify JSON data with syntax highlighting.',
    longDescription:
      'Instantly format, validate, and beautify your JSON data with our free online JSON formatter and validator. Detect syntax errors in real time, minify JSON for production, and explore nested structures with collapsible tree view. Perfect for developers working with APIs, configuration files, and data pipelines.',
    icon: '{ }',
    category: 'dev',
    categoryLabel: 'Developer Tools',
    keywords: ['json', 'formatter', 'validator', 'beautify', 'minify', 'parser', 'syntax', 'api'],
    color: 'blue',
  },
  {
    id: 'image-compressor',
    slug: 'image-compressor',
    name: 'Image Compressor',
    shortName: 'Compressor',
    description: 'Compress images without losing visual quality.',
    longDescription:
      'Reduce image file sizes by up to 80% while preserving visual quality using advanced lossy and lossless compression algorithms. Supports JPEG, PNG, and WebP formats with adjustable quality settings and batch processing. Ideal for optimizing web assets, improving page load speed, and saving storage space.',
    icon: '🗜️',
    category: 'media',
    categoryLabel: 'Media Tools',
    keywords: ['image', 'compress', 'optimize', 'resize', 'webp', 'jpeg', 'png', 'file size'],
    color: 'emerald',
  },
  {
    id: 'image-converter',
    slug: 'image-converter',
    name: 'Image Format Converter',
    shortName: 'Converter',
    description: 'Convert images between PNG, JPEG, WebP, and AVIF formats.',
    longDescription:
      'Convert images between all major formats including PNG, JPEG, WebP, and AVIF right in your browser with zero server uploads. Adjust output quality, preview results side by side, and batch-convert multiple files at once. A must-have tool for designers and developers optimizing images for the modern web.',
    icon: '🔄',
    category: 'media',
    categoryLabel: 'Media Tools',
    keywords: ['image', 'convert', 'format', 'png', 'jpeg', 'webp', 'avif', 'batch'],
    color: 'teal',
    isNew: true,
  },
  {
    id: 'pdf-tools',
    slug: 'pdf-tools',
    name: 'PDF Merge, Compress & Split',
    shortName: 'PDF Tools',
    description: 'Merge, compress, and split PDF files in the browser.',
    longDescription:
      'Merge multiple PDFs into one, split large documents into individual pages, and compress file sizes — all processed locally in your browser for maximum privacy. Rearrange pages with drag-and-drop, set custom page ranges for splitting, and achieve significant compression ratios. No file uploads or server-side processing required.',
    icon: '📄',
    category: 'utility',
    categoryLabel: 'Utilities',
    keywords: ['pdf', 'merge', 'split', 'compress', 'combine', 'pages', 'document'],
    color: 'orange',
  },
  {
    id: 'password-generator',
    slug: 'password-generator',
    name: 'Password Generator',
    shortName: 'Passwords',
    description: 'Generate strong, cryptographically secure passwords.',
    longDescription:
      'Generate strong, unique passwords using the Web Crypto API for true cryptographic randomness. Customize length, character sets, and exclusion rules while viewing real-time entropy and strength analysis. Supports passphrase generation, bulk creation, and one-click copy for effortless security hygiene.',
    icon: '🔐',
    category: 'security',
    categoryLabel: 'Security',
    keywords: ['password', 'generator', 'secure', 'random', 'crypto', 'entropy', 'passphrase'],
    color: 'red',
  },
  {
    id: 'word-counter',
    slug: 'word-counter',
    name: 'Word & Character Counter',
    shortName: 'Word Counter',
    description: 'Count words, characters, sentences, and estimate reading time.',
    longDescription:
      'Count words, characters, sentences, and paragraphs in real time with detailed readability statistics and estimated reading time. Analyze keyword density, detect repeated phrases, and export detailed reports for SEO auditing. An essential writing companion for bloggers, copywriters, and content strategists.',
    icon: '📝',
    category: 'text',
    categoryLabel: 'Text Tools',
    keywords: ['word', 'counter', 'character', 'count', 'reading time', 'seo', 'copywriting'],
    color: 'violet',
  },
  {
    id: 'css-gradient',
    slug: 'css-gradient',
    name: 'CSS Gradient Generator',
    shortName: 'Gradients',
    description: 'Design beautiful CSS gradients with a visual editor.',
    longDescription:
      'Create stunning linear, radial, and conic CSS gradients with an intuitive visual editor and live preview. Fine-tune color stops, angles, and positions, then copy production-ready CSS code with a single click. Browse a curated gallery of trending gradient presets to kickstart your next design.',
    icon: '🎨',
    category: 'design',
    categoryLabel: 'Design Tools',
    keywords: ['css', 'gradient', 'generator', 'linear', 'radial', 'color', 'design', 'background'],
    color: 'pink',
  },
  {
    id: 'cron-builder',
    slug: 'cron-builder',
    name: 'Cron Expression Builder',
    shortName: 'Cron Builder',
    description: 'Build and decode cron expressions with a visual interface.',
    longDescription:
      'Build, validate, and decode cron expressions using an interactive visual interface that shows upcoming execution times. Translate complex schedules into plain English descriptions and vice versa with support for standard cron and extended Quartz syntax. Save your frequently used expressions and share them with teammates.',
    icon: '⏰',
    category: 'dev',
    categoryLabel: 'Developer Tools',
    keywords: ['cron', 'schedule', 'expression', 'builder', 'job', 'timer', 'quartz'],
    color: 'amber',
  },
  {
    id: 'qr-code-generator',
    slug: 'qr-code-generator',
    name: 'QR Code Generator',
    shortName: 'QR Codes',
    description: 'Generate customizable QR codes for URLs, text, and more.',
    longDescription:
      'Generate high-quality QR codes for URLs, plain text, Wi-Fi credentials, vCards, and more with full customization of colors, size, and error correction levels. Embed logos, adjust corner styles, and download in SVG or PNG formats for print and digital use. All processing happens client-side so your data never leaves the browser.',
    icon: '📱',
    category: 'utility',
    categoryLabel: 'Utilities',
    keywords: ['qr', 'code', 'generator', 'barcode', 'url', 'scan', 'wifi', 'vcard'],
    color: 'cyan',
    isNew: true,
  },
  {
    id: 'regex-tester',
    slug: 'regex-tester',
    name: 'Regex Tester & Explainer',
    shortName: 'Regex Tester',
    description: 'Test regular expressions with real-time matching and explanations.',
    longDescription:
      'Test and debug regular expressions in real time with instant match highlighting, capture group extraction, and plain-English explanations of every token. Supports JavaScript, Python, and Go regex flavors with a built-in cheat sheet and common pattern library. Save and share your expressions with permanent links for easy collaboration.',
    icon: '🔍',
    category: 'dev',
    categoryLabel: 'Developer Tools',
    keywords: ['regex', 'regular expression', 'tester', 'pattern', 'match', 'replace', 'debug'],
    color: 'lime',
  },
];

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(category: Tool['category']): Tool[] {
  return tools.filter((tool) => tool.category === category);
}

export function getAllCategories(): { category: Tool['category']; label: string; count: number }[] {
  const categoryMap = new Map<Tool['category'], { label: string; count: number }>();

  for (const tool of tools) {
    const existing = categoryMap.get(tool.category);
    if (existing) {
      existing.count += 1;
    } else {
      categoryMap.set(tool.category, { label: tool.categoryLabel, count: 1 });
    }
  }

  return Array.from(categoryMap.entries()).map(([category, { label, count }]) => ({
    category,
    label,
    count,
  }));
}
