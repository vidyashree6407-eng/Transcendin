<!-- ========================================
     TranscendIN Design System
     Brand Guidelines & Specifications
     ======================================== -->

# TranscendIN Design System

## Brand Identity

### Logo & Branding
- **Logo Icon**: Graduation Cap (Font Awesome: `fa-graduation-cap`)
- **Brand Name**: TranscendIN
- **Tagline**: "Transcending potential through learning"
- **Font**: Segoe UI, Tahoma, Geneva, Verdana, sans-serif

---

## 🎨 Color Palette

### Primary Colors
```
PRIMARY BLUE:        #0052CC
  - Primary brand color
  - Buttons, links, highlights
  - Text emphasis

PRIMARY ORANGE:      #FF6B35
  - Accent color
  - Borders, secondary CTAs
  - Hover states

PRIMARY WHITE:       #FFFFFF
  - Background
  - Text on dark backgrounds
  - Card backgrounds
```

### Secondary Colors
```
DARK TEXT:           #1a1a1a
  - Body text
  - Headings
  - High contrast text

LIGHT TEXT:          #666666
  - Secondary text
  - Descriptions
  - Meta information

LIGHT BG:            #f8f9fa
  - Section backgrounds
  - Card backgrounds
  - Alternative sections
```

### Gradients
```
BLUE-ORANGE GRADIENT:
  linear-gradient(135deg, #0052CC 0%, #FF6B35 100%)
  - Hero sections
  - CTA buttons
  - Featured elements

BLUE GRADIENT:
  linear-gradient(135deg, #0052CC 0%, #0066FF 100%)
  - Feature sections
  - Image placeholders

ORANGE GRADIENT:
  linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)
  - Accent sections
  - Secondary features
```

### Utility Colors
```
BORDER COLOR:        #e8e8e8
  - Dividers
  - Form borders
  - Card separators

HOVER STATE:         rgba(0, 82, 204, 0.1)
  - Light blue overlay
  - Focus states
  - Hover backgrounds
```

---

## 📐 Typography

### Font Families
- **Primary Font**: Segoe UI, Tahoma, Geneva, Verdana (System Fonts)
- **Fallback**: sans-serif

### Font Sizes
```
h1:   3.5rem (56px)  - Hero titles
h2:   2.5rem (40px)  - Section titles
h3:   1.5rem (24px)  - Subsection titles
h4:   1.1rem (18px)  - Card titles
p:    1rem   (16px)  - Body text
small: 0.9rem (14px) - Meta text
```

### Font Weights
- **Light**: 300
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

### Line Heights
- **Headings**: 1.2
- **Body**: 1.6
- **Large**: 1.8 - 1.9 (for paragraphs)

### Letter Spacing
- **Headings**: -0.5px (tighter)
- **Body**: Normal
- **Labels**: 0px (normal)

---

## 🔘 Button Styles

### Button Types

#### Primary Button
```
Background:  #0052CC (Blue)
Text Color:  #FFFFFF (White)
Padding:     12px 32px
Border:      None
Border-Radius: 50px
Shadow:      0 4px 15px rgba(0, 82, 204, 0.3)
Hover:       #0041a3 (darker blue)
Active:      Scale down slightly
```

#### Secondary Button
```
Background:  Transparent
Text Color:  #0052CC (Blue)
Border:      2px solid #0052CC
Padding:     12px 32px
Border-Radius: 50px
Hover:       Background: #0052CC, Color: White
```

#### Button Sizes
- Small:  10px 24px, font-size 0.95rem
- Medium: 12px 32px, font-size 1rem
- Large:  16px 48px, font-size 1.1rem

---

## 📦 Spacing System

### Spacing Scale
```
xs: 0.5rem  (8px)
sm: 1rem    (16px)
md: 1.5rem  (24px)
lg: 2rem    (32px)
xl: 3rem    (48px)
2xl: 4rem   (64px)
3xl: 5rem   (80px)
```

### Margin & Padding
- Sections: 80px - 100px vertical padding
- Cards: 2rem padding
- Buttons: 12px - 16px padding
- Forms: 1.5rem gap between elements

---

## 📱 Responsive Breakpoints

```css
/* Desktop */
1200px and above

/* Tablet */
768px - 1024px
- Adjust: Grid columns, Font sizes, Spacing
- Hide: Some visual effects on older devices

/* Mobile */
Below 768px
- Stack: All multi-column layouts
- Reduce: Font sizes, Spacing, Padding
- Optimize: Touch targets (min 44px)

/* Small Mobile */
Below 480px
- Minimal: Reduced all sizing
- Stack: All content vertically
- Simplify: Hide non-essential decorative elements
```

---

## 🎬 Animation & Transition

### Transition Timing
```
Smooth Transitions:  all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
Ease Transitions:    all 0.4s ease-in-out
Fast Transitions:    all 0.2s ease-out
```

### Animation Types

#### Fade In (Elements appearing)
```
Duration: 0.8s
From: opacity 0, transform translateY(30px)
To: opacity 1, transform translateY(0)
```

#### Slide Up (Cards entering)
```
Duration: 0.6s
From: opacity 0, transform translateY(20px)
To: opacity 1, transform translateY(0)
Stagger: 0.1s between elements
```

#### Slide In (Sidebar effects)
```
Duration: 0.3s
From: left -100%
To: left 0
```

#### Hover Effects
```
Scale: 1.02 - 1.05
Translate: translateY(-3px to -10px)
Shadow increase: Subtle to prominent
Duration: 0.3s - 0.4s
```

#### Float Animation (Continuous)
```
Duration: 3s
Keyframes: translateY(0) -> translateY(-20px) -> translateY(0)
Infinite, ease-in-out
```

### Parallax Effects
- Hero section blobs move with mouse
- Subtle, non-distracting
- Desktop only (disabled on mobile)

---

## 🎯 Component Specifications

### Navigation Bar
```
Height: 70px (fixed)
Background: #FFFFFF with subtle shadow
Logo Size: 1.5rem
Gap between nav items: 2.5rem
Mobile: Hamburger menu (480px below)
Sticky: Yes, on scroll
```

### Hero Section
```
Padding: 100px vertical (80px on mobile)
Height: Full viewport (adjusted for header)
Background: Light background with gradient blobs
Max Width: 1200px
Content Grid: 2 columns (1 column on tablet)
Gap: 4rem (2rem on mobile)
```

### Card Components
```
Border Radius: 15px
Padding: 2rem
Box Shadow: 0 5px 20px rgba(0, 0, 0, 0.08)
Hover Shadow: 0 15px 40px rgba(0, 82, 204, 0.15)
Hover Transform: translateY(-10px)
Transition: 0.4s ease-in-out
```

### Course Cards
```
Image Height: 200px
Price: 1.5rem, bold, blue color
Rating: Top right, semi-transparent background
Level Badge: Top left, white background
```

### Form Elements
```
Input/Textarea:
  Padding: 12px 16px
  Border: 2px solid #e8e8e8
  Border-Radius: 8px
  Focus: Border color changes to blue, subtle shadow
  Transition: 0.3s smooth

Label:
  Font-Weight: 600
  Margin-Bottom: 0.5rem
  Color: Dark text
```

---

## 🎨 Visual Elements

### Icons
- **Source**: Font Awesome 6.4.0
- **Sizes**: 1rem - 4rem (varies by context)
- **Colors**: Inherited from text or specified

### Decorative Elements
```
Gradient Blobs:
  - Size: 200px - 300px
  - Filter: blur(100px)
  - Opacity: 0.15
  - Animation: Continuous floating motion

Borders:
  - Color: #e8e8e8
  - Width: 1px - 2px
  - Radius: 8px - 20px
  - Usage: Cards, form fields, dividers

Shadows:
  - Subtle: 0 2px 10px rgba(0, 0, 0, 0.05)
  - Medium: 0 5px 20px rgba(0, 0, 0, 0.08)
  - Prominent: 0 15px 40px rgba(0, 82, 204, 0.15)
```

---

## 📊 Grid System

### Desktop Grid
- Max width: 1200px
- Columns: 12-column implied
- Gap: 2rem - 4rem
- Padding: 20px on sides

### Auto-fill Grids (Responsive)
```css
grid-template-columns: repeat(auto-fit, minmax(280px-320px, 1fr));
gap: 2rem - 2.5rem;
```

### Two-Column Layout
- Desktop: 1fr 1fr (equal)
- Tablet: 1fr (stacked)
- Gap: 4rem (reduced on mobile)

---

## 🎭 Visual Hierarchy

### Emphasis Levels
```
Level 1: Large headings (h1, h2)
         - Size: 2.5rem+
         - Color: Dark or Gradient
         - Weight: 700

Level 2: Medium headings (h3)
         - Size: 1.5rem
         - Color: Dark
         - Weight: 600

Level 3: Body text (p)
         - Size: 1rem
         - Color: Light text
         - Weight: 400

Level 4: Small text (small, meta)
         - Size: 0.85rem - 0.9rem
         - Color: Light text
         - Weight: 400
```

### Contrast
- Text on White: Dark text (#1a1a1a)
- Text on Light BG: Dark text (#1a1a1a)
- Text on Blue: White text (#FFFFFF)
- Text on Orange: White text (#FFFFFF)

---

## 📱 Mobile-First Design

### Mobile Optimizations
1. Hamburger navigation (< 768px)
2. Single column layouts
3. Reduced padding & margins
4. Simplified animations
5. Larger touch targets (44px minimum)
6. Optimized form inputs
7. Stack vertically all sections

### Tablet Considerations
- 2-column grids where appropriate
- Slightly reduced fonts
- Adjusted spacing
- Most animations active

### Desktop Features
- Full multi-column layouts
- All animations enabled
- Parallax effects active
- Optimized spacing
- Maximum visual polish

---

## ✅ Quality Checklist

- [ ] Colors match brand guidelines
- [ ] Typography follows specifications
- [ ] Spacing is consistent
- [ ] Animations are smooth (60fps)
- [ ] Responsive on all breakpoints
- [ ] Contrast ratios meet WCAG standards
- [ ] Mobile touch targets are 44px+
- [ ] No layout shifts on interaction
- [ ] Buttons provide clear feedback
- [ ] Forms are easy to use

---

## 🚀 Deployment Considerations

### Performance
- Minify CSS & JavaScript
- Optimize images
- Use CDN for assets
- Enable compression
- Lazy load images

### Security
- Use HTTPS
- Validate all forms
- Sanitize user input
- Content Security Policy headers
- Regular security updates

### Analytics
- Google Analytics
- Conversion tracking
- User behavior analysis
- A/B testing ready
- Heat mapping

---

## 📝 Notes for Designers & Developers

1. **Consistency**: Maintain spacing ratios and color usage
2. **Scalability**: Design with future expansion in mind
3. **Accessibility**: Always ensure WCAG 2.1 AA compliance
4. **Performance**: Test animations on slower devices
5. **Testing**: Test on real devices, not just browser emulation

---

**Design System Version**: 1.0  
**Last Updated**: 2024  
**Status**: Active & Maintained
