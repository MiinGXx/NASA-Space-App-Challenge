# Quick Start: AQI Mood-Reactive UI

## ✅ What's Already Done

The mood-reactive UI is **fully implemented and ready to use**! All components are integrated and the system will automatically respond to real-time AQI data.

## 🚀 See It In Action

1. **Run the application**:

    ```bash
    cd WebApp
    npm run dev
    # or
    pnpm dev
    ```

2. **Visit**: http://localhost:3000

3. **Watch the magic happen**:
    - The UI will automatically load AQI data for your current location
    - Colors, gradients, and atmospheric effects will reflect air quality
    - Look at the header for the mood indicator showing current state

## 🎨 How It Works

### Automatic Mode (Default)

-   AQI data is fetched based on your location
-   UI automatically updates when location changes
-   Mood transitions smoothly (1.2 seconds)
-   No configuration needed!

### What Changes Based on AQI:

| AQI Range | Mood Level   | Visual Theme                                   |
| --------- | ------------ | ---------------------------------------------- |
| 0-50      | 🌟 Pristine  | Calming blues with floating particles          |
| 51-100    | 🌤️ Fresh     | Warm yellows with light fog                    |
| 101-150   | 🌫️ Hazy      | Muted oranges with fog                         |
| 151-200   | 🚨 Polluted  | Dark reds with heavy fog                       |
| 201-300   | ☠️ Toxic     | Deep purples with smog + pulsing               |
| 301+      | ☢️ Hazardous | Ominous maroons with intense effects + pulsing |

## 🧪 Testing Different Moods

### Option 1: Change Location

-   Use the location search bar
-   Enter cities with different air quality:
    -   **Good AQI**: "Reykjavik", "Wellington", "Oslo"
    -   **Moderate**: "London", "New York", "Sydney"
    -   **Unhealthy**: "Delhi", "Beijing", "Los Angeles" (on bad days)

### Option 2: Use Demo Component (For Development)

Add to any page:

```tsx
import { MoodThemeDemo } from "@/components/mood-theme-demo";

export default function TestPage() {
    return (
        <div className="container mx-auto p-8">
            <MoodThemeDemo />
        </div>
    );
}
```

This gives you:

-   Manual AQI input (0-500)
-   Quick preset buttons for each mood level
-   Real-time preview of all effects

### Option 3: Programmatic Testing

```tsx
import { useAQIMood } from "@/components/aqi-mood-provider";

function MyComponent() {
    const { updateAQI } = useAQIMood();

    // Test pristine air
    updateAQI(25);

    // Test hazardous conditions
    updateAQI(400);
}
```

## 👀 What to Look For

### 1. **Background Gradients**

-   Radial gradients that shift colors
-   Smooth transitions between mood states
-   Different palettes for light/dark mode

### 2. **Atmospheric Effects**

-   **Pristine/Fresh**: Floating particles across the screen
-   **Hazy/Polluted**: Fog effect with subtle blur
-   **Toxic/Hazardous**: Heavy smog + pulsating glow on cards

### 3. **Color Changes**

-   Header text and icons
-   Card backgrounds and borders
-   All text (primary, secondary, accent)
-   Shadows and glows

### 4. **Mood Indicator** (in header)

-   Shows current mood level
-   Displays AQI value
-   Icon changes per mood
-   Description text

### 5. **Card Effects**

-   Background opacity changes
-   Border colors adapt
-   Shadow colors match mood
-   Pulsating animation for hazardous levels

## 🎯 Key Components Using Mood

All these automatically respond to AQI changes:

-   ✅ Header (with mood indicator)
-   ✅ AQI Status card
-   ✅ Pollutant breakdown cards
-   ✅ All buttons and borders
-   ✅ Background and overlays

## 🛠️ Adding Mood to New Components

Make any component mood-reactive with CSS classes:

```tsx
// Basic card
<Card className="mood-card">
  <CardContent>
    <h3 className="mood-text-primary">Title</h3>
    <p className="mood-text-secondary">Description</p>
  </CardContent>
</Card>

// With borders and icons
<div className="border mood-border rounded-lg p-4">
  <Icon className="mood-accent" />
  <span className="mood-text-primary">Content</span>
</div>

// Access mood data
const { aqiValue, moodTheme } = useAQIMood();
```

## 📱 Responsive Behavior

-   **Desktop**: Full effects (particles, blur, animations)
-   **Mobile**: Optimized effects (reduced blur, lighter overlays)
-   **Dark Mode**: Automatically uses dark mode color palettes
-   **Light Mode**: Uses light mode color palettes

## ⚡ Performance

The system is optimized:

-   GPU-accelerated CSS transitions
-   Minimal JavaScript overhead
-   Efficient particle rendering
-   Responsive to system capabilities

## 🎨 Customization

### Change Transition Speed

Edit `app/globals.css`:

```css
html.aqi-mood-transition {
    transition: background 1.2s ease-in-out; /* Change this */
}
```

### Modify Colors

Edit `components/aqi-mood-provider.tsx`:

```tsx
// Find getMoodTheme function
// Modify colors for any mood level
```

### Add Custom Effects

Edit `components/mood-reactive-wrapper.tsx`:

```tsx
// Add new effects based on moodTheme.level
{
    moodTheme.level === "hazardous" && <div>Custom hazard effect</div>;
}
```

## 🐛 Troubleshooting

### Mood not changing?

-   Check browser console for errors
-   Verify `AQIMoodProvider` is in `layout.tsx`
-   Ensure `handleAQIUpdate` is called in `page.tsx`

### Effects not visible?

-   Check that `MoodReactiveWrapper` wraps your content
-   Verify CSS classes are applied correctly
-   Inspect HTML element for `data-aqi-mood` attribute

### Performance issues?

-   Disable particle effects (comment out in `mood-reactive-wrapper.tsx`)
-   Reduce backdrop-filter values in `globals.css`
-   Test on different devices

## 📚 Documentation

-   **Full Documentation**: `MOOD_REACTIVE_UI.md`
-   **Visual Guide**: `MOOD_THEME_GUIDE.md`
-   **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`

## 🎉 That's It!

The mood-reactive UI is ready to use. Just run your app and watch it automatically adapt to air quality conditions!

For questions or issues, refer to the comprehensive documentation files listed above.

---

**Enjoy your immersive, mood-reactive air quality monitoring experience!** 🌍💨✨
