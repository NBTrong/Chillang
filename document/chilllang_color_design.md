# chillLang – Color Palette & Design System
## "Chill your way to fluency" – Màu sắc & Phong cách UI

---

## 🎨 1. Đề xuất Màu sắc Chủ đạo

### 1.1 Concept & Tinh thần
Với slogan **"Chill your way to fluency"**, chillLang hướng đến một trải nghiệm học tập **thư giãn, thoải mái, không áp lực**. Màu sắc được chọn để tạo cảm giác:

- 🌊 **Thư giãn & Mát mẻ**: Màu xanh dương nhẹ nhàng như bầu trời, đại dương
- 🌿 **Tươi mới & Tích cực**: Màu xanh lá mint/sage tạo cảm giác tươi mát
- ✨ **Sáng tạo & Năng động**: Màu tím lavender nhẹ nhàng cho accents
- ☀️ **Ấm áp & Thân thiện**: Màu cam/peach nhẹ cho highlights

### 1.2 Màu chủ đạo được đề xuất

**Primary Color (Màu chính):**
- **Sky Blue / Ocean Blue** (#5B9BD5 → #7BB3E8)
  - Tạo cảm giác thư giãn, tin cậy
  - Dễ nhìn, không gây mỏi mắt
  - Phù hợp cho CTA buttons, links, active states

**Secondary Color (Màu phụ):**
- **Mint Green / Sage Green** (#6BC4A6 → #7DD3B0)
  - Tích cực, tươi mới
  - Dùng cho success states, progress bars, completed items

**Accent Colors (Màu nhấn):**
- **Lavender Purple** (#A78BFA → #C4B5FD)
  - Sáng tạo, thú vị
  - Dùng cho special features, AI highlights

- **Peach / Soft Orange** (#F9A8D4 → #FBBF24)
  - Ấm áp, thân thiện
  - Dùng cho warnings, important notices

---

## 🎨 2. Color Palette Chi tiết

### 2.1 Dark Mode Palette (Mặc định - "Chill Night")

#### 2.1.1 Background Colors
```
Primary Background:     #0A0E1A  (Deep navy với hint xanh - như bầu trời đêm)
Secondary Background:   #141B2D  (Card backgrounds - xanh navy nhẹ)
Tertiary Background:    #1E2A3F  (Nested cards, modals - xanh dương đậm)
Surface Overlay:        rgba(10, 14, 26, 0.85)  (Backdrop blur với tint xanh)
Gradient Overlay:       linear-gradient(135deg, #0A0E1A 0%, #141B2D 100%)
```

#### 2.1.2 Text Colors
```
Primary Text:           #F0F4F8  (Off-white với hint xanh nhẹ - dễ đọc)
Secondary Text:         #B8C5D6  (Muted blue-gray - descriptions)
Tertiary Text:          #7A8FA3  (Disabled, placeholders - blue-gray nhạt)
Inverse Text:           #0A0E1A  (Text on light backgrounds)
```

#### 2.1.3 Accent Colors (Chill Theme)
```
Primary Accent:         #5B9BD5  (Sky Blue - main CTA, active states)
Primary Accent Hover:   #7BB3E8  (Lighter sky blue on hover)
Primary Accent Light:   #A8D0E6  (Very light blue for subtle highlights)

Secondary Accent:       #6BC4A6  (Mint Green - success, progress)
Secondary Accent Hover: #7DD3B0  (Lighter mint on hover)

Accent Purple:          #A78BFA  (Lavender - special features, AI)
Accent Purple Hover:    #C4B5FD  (Lighter lavender)

Accent Peach:           #F9A8D4  (Soft peach - warnings, highlights)
Accent Amber:           #FBBF24  (Warm amber - important notices)

Error:                  #EF6B6B  (Soft red - errors, destructive)
Error Hover:            #FF8A8A  (Lighter red)
```

#### 2.1.4 Border & Divider Colors
```
Border Primary:         rgba(91, 155, 213, 0.2)  (Sky blue tint - subtle)
Border Secondary:       rgba(91, 155, 213, 0.1)  (Very subtle blue)
Border Accent:          rgba(107, 196, 166, 0.3)  (Mint green for active cards)
Divider:                rgba(184, 197, 214, 0.15)  (Blue-gray divider)
```

#### 2.1.5 Interactive States
```
Hover Overlay:          rgba(91, 155, 213, 0.08)  (Sky blue tint)
Active Overlay:         rgba(91, 155, 213, 0.15)  (More visible blue)
Focus Ring:             #5B9BD5 with 0.3 opacity + glow
Disabled:               rgba(122, 143, 163, 0.3)  (Muted blue-gray)
```

### 2.2 Light Mode Palette (Chill Day)

#### 2.2.1 Background Colors
```
Primary Background:     #F8FAFC  (Off-white với hint xanh nhẹ - như bầu trời sáng)
Secondary Background:   #F1F5F9  (Light blue-gray - card backgrounds)
Tertiary Background:    #E2E8F0  (Nested elements - slate blue)
Surface Overlay:        rgba(248, 250, 252, 0.95)  (Backdrop blur)
Gradient Overlay:       linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)
```

#### 2.2.2 Text Colors
```
Primary Text:           #0F172A  (Dark slate - high contrast)
Secondary Text:         #475569  (Slate gray - descriptions)
Tertiary Text:          #94A3B8  (Light slate - disabled, placeholders)
Inverse Text:           #F8FAFC  (Text on dark backgrounds)
```

#### 2.2.3 Accent Colors (Chill Theme)
```
Primary Accent:         #3B82F6  (Bright blue - main CTA)
Primary Accent Hover:   #2563EB  (Darker blue on hover)
Primary Accent Light:   #DBEAFE  (Very light blue for backgrounds)

Secondary Accent:       #10B981  (Emerald green - success, progress)
Secondary Accent Hover: #059669  (Darker emerald)

Accent Purple:          #8B5CF6  (Violet - special features)
Accent Purple Hover:    #7C3AED  (Darker violet)

Accent Peach:           #FB7185  (Rose - warnings)
Accent Amber:           #F59E0B  (Amber - important notices)

Error:                  #EF4444  (Red - errors)
Error Hover:            #DC2626  (Darker red)
```

#### 2.2.4 Border & Divider Colors
```
Border Primary:         rgba(59, 130, 246, 0.2)  (Blue tint)
Border Secondary:       rgba(59, 130, 246, 0.1)  (Very subtle)
Border Accent:          rgba(16, 185, 129, 0.3)  (Green for active)
Divider:                rgba(148, 163, 184, 0.2)  (Slate divider)
```

#### 2.2.5 Interactive States
```
Hover Overlay:          rgba(59, 130, 246, 0.05)  (Light blue tint)
Active Overlay:         rgba(59, 130, 246, 0.1)  (More visible)
Focus Ring:             #3B82F6 with 0.2 opacity
Disabled:               rgba(148, 163, 184, 0.4)  (Muted slate)
```

---

## 🎨 3. Phong cách UI Design

### 3.1 Design Principles (Nguyên tắc thiết kế)

#### 3.1.1 "Chill" Aesthetic
- **Rounded Corners**: Bo góc lớn (16px-32px) tạo cảm giác mềm mại, thân thiện
- **Soft Shadows**: Bóng đổ nhẹ nhàng, không quá nổi bật
- **Smooth Animations**: Chuyển động mượt mà, không giật cục (ease-in-out, spring animations)
- **Breathing Space**: Khoảng trắng rộng rãi, không chật chội
- **Gradient Accents**: Gradient nhẹ nhàng cho backgrounds và buttons

#### 3.1.2 Typography
- **Font Family**: Inter, SF Pro, hoặc system sans-serif
- **Font Sizes**: 
  - Display: 2.5rem (40px)
  - Title: 1.875rem (30px)
  - Subtitle: 1.25rem (20px)
  - Body: 1rem (16px) - minimum 14px
  - Caption: 0.875rem (14px)
- **Line Height**: 1.6-1.7 cho body text (dễ đọc, thoáng)
- **Letter Spacing**: -0.02em cho headings, 0 cho body

#### 3.1.3 Spacing System
```
Base unit: 4px
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px
```

#### 3.1.4 Border Radius
```
- sm: 8px (small elements)
- md: 12px (buttons, inputs)
- lg: 16px (cards)
- xl: 24px (large cards, modals)
- 2xl: 32px (hero sections, special cards)
- full: 9999px (pills, badges)
```

### 3.2 Component Styles

#### 3.2.1 Buttons
```css
/* Primary Button - Sky Blue */
- Background: Primary Accent với gradient nhẹ
- Border radius: 12px-16px
- Padding: 12px 24px
- Shadow: 0 4px 12px rgba(91, 155, 213, 0.3)
- Hover: Lighter shade + scale(1.02)
- Active: Slight scale down

/* Secondary Button */
- Transparent background
- Border: 1.5px solid Primary Accent
- Text: Primary Accent
- Hover: Background với Primary Accent opacity 0.1

/* Ghost Button */
- Transparent
- Text: Primary Accent
- Hover: Background với Primary Accent opacity 0.08
```

#### 3.2.2 Cards
```css
/* Standard Card */
- Background: Secondary Background
- Border: 1px solid Border Primary
- Border radius: 16px-20px
- Padding: 24px
- Shadow: 0 2px 8px rgba(0, 0, 0, 0.1) (light) / 0 4px 16px rgba(0, 0, 0, 0.3) (dark)
- Hover: Slight elevation + border color change

/* Elevated Card (Active/Selected) */
- Background: Secondary Background với Primary Accent tint
- Border: 2px solid Border Accent
- Shadow: 0 8px 24px rgba(91, 155, 213, 0.2)
```

#### 3.2.3 Input Fields
```css
/* Text Input */
- Background: Secondary Background
- Border: 1.5px solid Border Primary
- Border radius: 12px
- Padding: 12px 16px
- Focus: Border color → Primary Accent + glow effect
- Placeholder: Tertiary Text
```

#### 3.2.4 Progress Indicators
```css
/* Progress Bar */
- Track: Tertiary Background
- Fill: Secondary Accent (Mint Green) với gradient
- Border radius: full (pill shape)
- Height: 8px-12px
- Animation: Smooth width transition

/* Completion Badge */
- Background: Secondary Accent với opacity
- Border radius: full
- Icon: Checkmark trong circle
```

### 3.3 Visual Effects

#### 3.3.1 Gradients
```css
/* Primary Gradient (Sky Blue) */
background: linear-gradient(135deg, #5B9BD5 0%, #7BB3E8 100%);

/* Success Gradient (Mint) */
background: linear-gradient(135deg, #6BC4A6 0%, #7DD3B0 100%);

/* Background Gradient (Subtle) */
background: linear-gradient(180deg, 
  var(--bg-primary) 0%, 
  var(--bg-secondary) 100%);
```

#### 3.3.2 Glows & Shadows
```css
/* Primary Accent Glow */
box-shadow: 0 0 20px rgba(91, 155, 213, 0.4);

/* Card Shadow (Light) */
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

/* Card Shadow (Dark) */
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
```

#### 3.3.3 Animations
```css
/* Smooth Transitions */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Hover Scale */
transform: scale(1.02);
transition: transform 0.2s ease-out;

/* Pulse Animation (for loading) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## 🎨 4. Color Usage Guidelines

### 4.1 Semantic Colors

#### Success States
- **Dark Mode**: `#6BC4A6` (Mint Green)
- **Light Mode**: `#10B981` (Emerald)
- **Use for**: Progress bars, completed items, success messages, checkmarks

#### Warning States
- **Dark Mode**: `#FBBF24` (Amber)
- **Light Mode**: `#F59E0B` (Amber)
- **Use for**: Important notices, caution messages, pending states

#### Error States
- **Dark Mode**: `#EF6B6B` (Soft Red)
- **Light Mode**: `#EF4444` (Red)
- **Use for**: Error messages, destructive actions, failed states

#### Info States
- **Dark Mode**: `#5B9BD5` (Sky Blue)
- **Light Mode**: `#3B82F6` (Blue)
- **Use for**: Information badges, tooltips, neutral highlights

### 4.2 Component-Specific Colors

#### Buttons
- **Primary**: Primary Accent (Sky Blue)
- **Success**: Secondary Accent (Mint Green)
- **Danger**: Error color
- **Ghost**: Transparent với Primary Accent text

#### Cards & Surfaces
- **Default Card**: Secondary Background
- **Active Card**: Secondary Background với Primary Accent border
- **Elevated Card**: Add subtle glow với Primary Accent tint

#### Input Fields
- **Background**: Secondary Background
- **Border**: Border Primary
- **Focus Border**: Primary Accent với glow
- **Error Border**: Error color

#### Progress Indicators
- **Track**: Tertiary Background
- **Fill**: Secondary Accent (Mint Green) với gradient
- **Completion Badge**: Secondary Accent background

---

## 🎨 5. Brand Identity Colors

### 5.1 Logo & Branding
- **Primary Brand Color**: `#5B9BD5` (Sky Blue)
- **Secondary Brand Color**: `#6BC4A6` (Mint Green)
- **Accent Brand Color**: `#A78BFA` (Lavender)

### 5.2 Usage in Marketing
- Logo có thể sử dụng gradient từ Sky Blue → Mint Green
- Icons và illustrations sử dụng palette này
- Social media graphics: Sky Blue làm base, Mint Green làm accent

---

## 🎨 6. Accessibility & Contrast

### 6.1 WCAG Compliance
- **Text on Background**: Tỷ lệ tương phản ≥ 4.5:1 (AA)
- **Large Text**: Tỷ lệ tương phản ≥ 3:1 (AA)
- **Interactive Elements**: Tỷ lệ tương phản ≥ 3:1
- **Focus Indicators**: Visible với 2px+ outline

### 6.2 Color Blindness Considerations
- Không chỉ dựa vào màu sắc để truyền đạt thông tin
- Sử dụng icons, patterns, text labels kèm theo
- Test với color blindness simulators

---

## 🎨 7. Implementation Plan

### 7.1 CSS Variables Structure
```css
:root {
  /* Chill Theme - Light Mode */
  --bg-primary: #F8FAFC;
  --bg-secondary: #F1F5F9;
  --bg-tertiary: #E2E8F0;
  
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-tertiary: #94A3B8;
  
  --accent-primary: #3B82F6;
  --accent-primary-hover: #2563EB;
  --accent-secondary: #10B981;
  --accent-secondary-hover: #059669;
  --accent-purple: #8B5CF6;
  --accent-peach: #FB7185;
  
  --border-primary: rgba(59, 130, 246, 0.2);
  --border-accent: rgba(16, 185, 129, 0.3);
}

.dark {
  /* Chill Theme - Dark Mode */
  --bg-primary: #0A0E1A;
  --bg-secondary: #141B2D;
  --bg-tertiary: #1E2A3F;
  
  --text-primary: #F0F4F8;
  --text-secondary: #B8C5D6;
  --text-tertiary: #7A8FA3;
  
  --accent-primary: #5B9BD5;
  --accent-primary-hover: #7BB3E8;
  --accent-secondary: #6BC4A6;
  --accent-secondary-hover: #7DD3B0;
  --accent-purple: #A78BFA;
  --accent-peach: #F9A8D4;
  
  --border-primary: rgba(91, 155, 213, 0.2);
  --border-accent: rgba(107, 196, 166, 0.3);
}
```

### 7.2 Tailwind Config Updates
Cần cập nhật `tailwind.config.js` với các màu mới này.

### 7.3 Component Updates
- Update tất cả components để sử dụng màu mới
- Thêm gradient effects cho buttons và cards
- Implement smooth transitions
- Add glow effects cho focus states

---

## 🎨 8. Inspiration & References

### 8.1 Design Inspiration
- **Linear**: Modern, clean, với blue accents
- **Notion**: Friendly, approachable, với rounded corners
- **Duolingo**: Playful, encouraging colors
- **Calm App**: Relaxing, peaceful color palette
- **Headspace**: Soft, friendly, rounded design

### 8.2 Color Tools
- [Coolors.co](https://coolors.co) - Palette generator
- [Adobe Color](https://color.adobe.com) - Color wheel
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## 🎨 9. Summary

### Màu chủ đạo: Sky Blue (#5B9BD5)
- Tạo cảm giác thư giản, tin cậy
- Phù hợp với "chill" theme
- Dễ nhìn, không gây mỏi mắt

### Màu phụ: Mint Green (#6BC4A6)
- Tích cực, tươi mới
- Dùng cho success và progress

### Phong cách UI:
- **Rounded & Soft**: Bo góc lớn, shadows nhẹ
- **Smooth Animations**: Chuyển động mượt mà
- **Breathing Space**: Khoảng trắng rộng rãi
- **Gradient Accents**: Gradient nhẹ nhàng

---

**Tài liệu này định nghĩa color palette và design system cho chillLang, phù hợp với tinh thần "Chill your way to fluency".**

