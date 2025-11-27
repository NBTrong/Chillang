# Color Palette & Design System Plan
## Tube Study App - Ứng dụng học ngoại ngữ từ YouTube

---

## 1. Tổng quan về Color Palette

### 1.1 Nguyên tắc thiết kế
- **Học tập hiệu quả**: Màu sắc hỗ trợ tập trung, giảm mỏi mắt
- **Khả năng tiếp cận**: Tuân thủ WCAG AA (tỷ lệ tương phản 4.5:1 trở lên)
- **Nhận diện thương hiệu**: Màu sắc tạo cảm giác tin cậy, chuyên nghiệp
- **Tương thích đa nền tảng**: Hoạt động tốt trên cả light mode và dark mode

### 1.2 Phân tích màu sắc cho ứng dụng giáo dục

**Màu chủ đạo được khuyến nghị:**
- **Màu xanh dương (Blue)**: Tin cậy, chuyên nghiệp, tập trung - phù hợp cho background và accent
- **Màu xanh lá (Green)**: Tích cực, tăng trưởng - dùng cho success states, progress indicators
- **Màu cam/vàng (Orange/Amber)**: Năng lượng, sáng tạo - dùng cho warnings, highlights
- **Màu tím (Purple)**: Sáng tạo, học tập - có thể dùng cho accents

---

## 2. Color Palette Đề xuất

### 2.1 Dark Mode Palette (Mặc định)

#### 2.1.1 Background Colors
```
Primary Background:     #0F1117  (Dark navy - tránh đen tuyệt đối #000)
Secondary Background:   #1A1D29  (Card backgrounds, elevated surfaces)
Tertiary Background:    #252937  (Nested cards, modals)
Surface Overlay:        rgba(15, 17, 23, 0.8)  (Backdrop blur)
```

#### 2.1.2 Text Colors
```
Primary Text:           #F3F4F7  (White-ish, high contrast)
Secondary Text:         #B8BCC8  (Muted text, descriptions)
Tertiary Text:          #8B90A0  (Disabled, placeholders)
Inverse Text:           #0F1117  (Text on light backgrounds)
```

#### 2.1.3 Accent Colors
```
Primary Accent:         #4F7CFF  (Blue - main CTA, active states)
Primary Accent Hover:   #6B8EFF  (Lighter blue on hover)
Secondary Accent:       #10B981  (Green - success, progress)
Warning:                #F59E0B  (Amber - warnings, important info)
Error:                  #EF4444  (Red - errors, destructive actions)
Info:                   #3B82F6  (Light blue - information)
```

#### 2.1.4 Border & Divider Colors
```
Border Primary:         rgba(255, 255, 255, 0.1)  (Subtle borders)
Border Secondary:       rgba(255, 255, 255, 0.05) (Very subtle)
Divider:                rgba(255, 255, 255, 0.08)
```

#### 2.1.5 Interactive States
```
Hover Overlay:          rgba(255, 255, 255, 0.05)
Active Overlay:         rgba(255, 255, 255, 0.1)
Focus Ring:             #4F7CFF with 0.2 opacity
Disabled:               rgba(255, 255, 255, 0.2)
```

### 2.2 Light Mode Palette

#### 2.2.1 Background Colors
```
Primary Background:     #FFFFFF  (Pure white)
Secondary Background:   #F8F9FA  (Subtle gray for cards)
Tertiary Background:    #E9ECEF  (Nested elements)
Surface Overlay:        rgba(255, 255, 255, 0.9)  (Backdrop blur)
```

#### 2.2.2 Text Colors
```
Primary Text:           #1A1D29  (Dark navy - high contrast)
Secondary Text:         #4B5563  (Gray - descriptions)
Tertiary Text:          #9CA3AF  (Disabled, placeholders)
Inverse Text:           #FFFFFF  (Text on dark backgrounds)
```

#### 2.2.3 Accent Colors
```
Primary Accent:         #2563EB  (Darker blue - better contrast in light mode)
Primary Accent Hover:   #1D4ED8  (Darker on hover)
Secondary Accent:       #059669  (Green - success, progress)
Warning:                #D97706  (Amber - warnings)
Error:                  #DC2626  (Red - errors)
Info:                   #0284C7  (Blue - information)
```

#### 2.2.4 Border & Divider Colors
```
Border Primary:         rgba(0, 0, 0, 0.1)  (Subtle borders)
Border Secondary:       rgba(0, 0, 0, 0.05) (Very subtle)
Divider:                rgba(0, 0, 0, 0.08)
```

#### 2.2.5 Interactive States
```
Hover Overlay:          rgba(0, 0, 0, 0.03)
Active Overlay:         rgba(0, 0, 0, 0.05)
Focus Ring:             #2563EB with 0.2 opacity
Disabled:               rgba(0, 0, 0, 0.2)
```

### 2.3 Semantic Colors (Dùng chung cho cả 2 modes)

#### Success States
```
Dark Mode:  #10B981
Light Mode: #059669
Use for: Progress indicators, completed items, success messages
```

#### Warning States
```
Dark Mode:  #F59E0B
Light Mode: #D97706
Use for: Important notices, caution messages
```

#### Error States
```
Dark Mode:  #EF4444
Light Mode: #DC2626
Use for: Error messages, destructive actions
```

#### Info States
```
Dark Mode:  #3B82F6
Light Mode: #0284C7
Use for: Information badges, tooltips
```

---

## 3. Color Usage Guidelines

### 3.1 Components Specific Colors

#### Buttons
- **Primary Button**: Primary Accent color
- **Secondary Button**: Transparent with border
- **Success Button**: Secondary Accent (Green)
- **Danger Button**: Error color
- **Ghost Button**: Transparent, hover shows overlay

#### Cards & Surfaces
- **Card Background**: Secondary Background
- **Card Border**: Border Primary
- **Elevated Card**: Add subtle shadow/glow
- **Active Card**: Primary Accent with low opacity overlay

#### Input Fields
- **Background**: Secondary Background (dark) / White (light)
- **Border**: Border Primary
- **Focus Border**: Primary Accent
- **Placeholder**: Tertiary Text
- **Error Border**: Error color

#### Progress Indicators
- **Progress Bar Fill**: Secondary Accent (Green)
- **Progress Bar Track**: Tertiary Background
- **Completion Badge**: Secondary Accent background

#### Status Badges
- **Processing**: Primary Accent
- **Completed**: Secondary Accent
- **Pending**: Tertiary Text
- **Error**: Error color

---

## 4. Kế hoạch Triển khai

### Phase 1: Thiết lập Design Tokens (Week 1)

#### 4.1.1 Cập nhật Tailwind Config
- [ ] Tạo custom color tokens trong `tailwind.config.js`
- [ ] Định nghĩa màu sắc cho dark mode và light mode
- [ ] Thêm semantic color names (success, warning, error, info)
- [ ] Cấu hình CSS variables cho dynamic theme switching

#### 4.1.2 Tạo CSS Variables System
- [ ] Định nghĩa CSS custom properties trong `index.css`
- [ ] Sử dụng `:root` cho light mode
- [ ] Sử dụng `.dark` class cho dark mode
- [ ] Đảm bảo tất cả màu sắc sử dụng variables

#### 4.1.3 Tạo Theme Hook/Context
- [ ] Tạo `ThemeContext` trong React
- [ ] Implement `useTheme` hook
- [ ] Lưu theme preference trong localStorage
- [ ] Detect system preference (prefers-color-scheme)
- [ ] Toggle function để chuyển đổi theme

### Phase 2: Cập nhật Core Styles (Week 1-2)

#### 4.2.1 Update Global Styles (`index.css`)
- [ ] Áp dụng background colors mới
- [ ] Cập nhật text colors
- [ ] Thêm transition cho theme switching
- [ ] Đảm bảo font rendering tốt trên cả 2 modes

#### 4.2.2 Update Layout Component
- [ ] Áp dụng màu sắc mới cho sidebar
- [ ] Cập nhật navigation colors
- [ ] Thêm theme toggle button
- [ ] Style footer và header

### Phase 3: Cập nhật Components (Week 2-3)

#### 4.3.1 HomeScreen
- [ ] Cập nhật background và text colors
- [ ] Style input field với màu sắc mới
- [ ] Update button styles
- [ ] Thêm focus states với Primary Accent

#### 4.3.2 VideoDashboard
- [ ] Cập nhật card styles
- [ ] Style mode selection cards
- [ ] Update progress indicators với Secondary Accent
- [ ] Thêm hover states

#### 4.3.3 ReadingScreen
- [ ] Style transcript area
- [ ] Update highlight colors
- [ ] Style translation tooltips
- [ ] Update player controls

#### 4.3.4 ListeningScreen
- [ ] Style quiz cards
- [ ] Update answer options với interactive states
- [ ] Style score display
- [ ] Update hint buttons

#### 4.3.5 DictationScreen
- [ ] Style waveform display
- [ ] Update input field
- [ ] Style error highlighting
- [ ] Update control buttons

### Phase 4: Polishing & Testing (Week 3-4)

#### 4.4.1 Accessibility Testing
- [ ] Kiểm tra contrast ratios (WCAG AA)
- [ ] Test với screen readers
- [ ] Verify focus indicators visible
- [ ] Test color blindness compatibility

#### 4.4.2 Cross-browser Testing
- [ ] Test trên Chrome, Firefox, Safari, Edge
- [ ] Verify CSS variables support
- [ ] Test theme switching performance
- [ ] Check for visual inconsistencies

#### 4.4.3 User Experience Testing
- [ ] Test theme persistence
- [ ] Verify smooth transitions
- [ ] Test trong điều kiện ánh sáng khác nhau
- [ ] Collect feedback về màu sắc

### Phase 5: Documentation & Handoff (Week 4)

#### 4.5.1 Tạo Style Guide
- [ ] Document tất cả color tokens
- [ ] Tạo component examples
- [ ] Document usage guidelines
- [ ] Tạo Figma/Sketch tokens (optional)

#### 4.5.2 Code Documentation
- [ ] Comment các color decisions
- [ ] Document theme system architecture
- [ ] Update README với theme info
- [ ] Create migration guide cho future changes

---

## 5. Implementation Details

### 5.1 Tailwind Config Structure

```javascript
// tailwind.config.js structure sẽ có:
theme: {
  extend: {
    colors: {
      // Semantic colors
      primary: { ... },
      secondary: { ... },
      success: { ... },
      warning: { ... },
      error: { ... },
      // Background colors
      bg: { primary, secondary, tertiary },
      // Text colors
      text: { primary, secondary, tertiary },
      // Border colors
      border: { primary, secondary }
    }
  }
}
```

### 5.2 CSS Variables Approach

```css
:root {
  /* Light mode */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8F9FA;
  --text-primary: #1A1D29;
  /* ... */
}

.dark {
  /* Dark mode */
  --bg-primary: #0F1117;
  --bg-secondary: #1A1D29;
  --text-primary: #F3F4F7;
  /* ... */
}
```

### 5.3 Theme Context Structure

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark';
}
```

---

## 6. Migration Strategy

### 6.1 Phương pháp Migration
1. **Incremental**: Từng component một, không phá vỡ UI hiện tại
2. **Backward Compatible**: Giữ dark mode làm mặc định, thêm light mode dần dần
3. **Feature Flag**: Có thể dùng feature flag để toggle theme system

### 6.2 Risk Mitigation
- Test thoroughly trên staging trước khi deploy
- Có rollback plan nếu có vấn đề
- Monitor user feedback sau khi deploy
- A/B testing theme preference nếu cần

---

## 7. Resources & References

### 7.1 Color Tools
- [Coolors.co](https://coolors.co) - Color palette generator
- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - WCAG compliance
- [Color Oracle](https://colororacle.org/) - Color blindness simulator

### 7.2 Inspiration
- Duolingo - Education app color scheme
- Notion - Note-taking app (light/dark mode)
- Linear - Modern SaaS design system
- Raycast - macOS productivity app

### 7.3 Design Systems
- Tailwind CSS default palette
- Radix UI color system
- Shadcn/ui color tokens

---

## 8. Success Metrics

### 8.1 Quantitative Metrics
- WCAG AA compliance: 100% color combinations
- Theme switch performance: < 100ms
- User theme preference distribution
- Accessibility score improvements

### 8.2 Qualitative Metrics
- User satisfaction với màu sắc
- Reduction trong user complaints về readability
- Positive feedback về visual design
- Improved perceived quality

---

## 9. Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Setup | 3-5 days | Design tokens, CSS variables, Theme context |
| Phase 2: Core Styles | 3-5 days | Global styles, Layout updates |
| Phase 3: Components | 5-7 days | All components updated |
| Phase 4: Testing | 3-5 days | Accessibility, cross-browser testing |
| Phase 5: Documentation | 2-3 days | Style guide, documentation |
| **Total** | **16-25 days** | **Complete theme system** |

---

## 10. Next Steps

1. ✅ **Hoàn thành**: Research và tạo color palette plan
2. ⏭️ **Tiếp theo**: Review và approve color palette
3. ⏭️ **Sau đó**: Bắt đầu Phase 1 - Setup design tokens
4. ⏭️ **Parallel**: Tạo Figma design system (optional)

---

**Tài liệu này sẽ được cập nhật khi triển khai và có feedback từ team/users.**

