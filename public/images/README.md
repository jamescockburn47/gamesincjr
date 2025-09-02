# Images Directory

This directory contains all the images for the Games Inc Jr website.

## How to Add Your Logo

1. **Save your logo file** as one of these formats:
   - `logo.png` (recommended)
   - `logo.jpg`
   - `logo.svg`

2. **Place it in this directory** (`public/images/`)

3. **The logo will automatically appear** on your website!

## Current Image Structure

```
public/images/
├── logo.png              # Your main logo (add this!)
├── logo-placeholder.svg  # Fallback placeholder
└── README.md            # This file
```

## Supported Formats

- **PNG** - Best for logos with transparency
- **JPG** - Good for photos
- **SVG** - Vector graphics, scalable
- **WebP** - Modern format, smaller file sizes

## Image Optimization

The website automatically:
- ✅ Optimizes images for web
- ✅ Provides fallback if image fails to load
- ✅ Uses Next.js Image component for performance
- ✅ Supports responsive sizing

## Adding Other Images

For game screenshots, hero images, etc.:
1. Add them to `public/images/`
2. Reference them as `/images/filename.ext`
3. The site will automatically optimize them

## Example Usage

```jsx
// In your components
<Image 
  src="/images/logo.png" 
  alt="Games Inc Jr Logo"
  width={200}
  height={120}
/>
```
