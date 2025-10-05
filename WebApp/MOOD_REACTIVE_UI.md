# AQI Mood-Reactive UI

## Overview

The AQI Mood-Reactive UI is an immersive feature that dynamically changes the application's visual theme based on real-time Air Quality Index (AQI) levels. The interface provides visual feedback that reflects the current air quality conditions, creating a more engaging and intuitive user experience.

## Features

### 🎨 Dynamic Color Themes

The UI shifts through six distinct mood states based on AQI levels:

1. **Pristine (AQI 0-50)** - Good Air Quality

    - Colors: Calming blues and cyans
    - Atmosphere: Clear skies with floating particles
    - Mood: Fresh, clean, breathable

2. **Fresh (AQI 51-100)** - Moderate Air Quality

    - Colors: Warm yellows and soft greens
    - Atmosphere: Light fog effect
    - Mood: Acceptable, pleasant

3. **Hazy (AQI 101-150)** - Unhealthy for Sensitive Groups

    - Colors: Muted oranges and amber tones
    - Atmosphere: Fog effect
    - Mood: Cautious, slightly concerning

4. **Polluted (AQI 151-200)** - Unhealthy

    - Colors: Darker oranges and reds
    - Atmosphere: Heavy fog
    - Mood: Concerning, unhealthy

5. **Toxic (AQI 201-300)** - Very Unhealthy

    - Colors: Deep purples and violets
    - Atmosphere: Smog effect
    - Mood: Dangerous, urgent

6. **Hazardous (AQI 301+)** - Hazardous
    - Colors: Ominous maroons and deep reds
    - Atmosphere: Thick smog with pulsating warnings
    - Mood: Emergency, critical

### 🌫️ Atmospheric Effects

-   **Gradient Backgrounds**: Smooth radial gradients that shift based on air quality
-   **Backdrop Filters**: Progressive blur effects that increase with pollution levels
-   **Floating Particles**: Animated particles appear during good air quality (pristine/fresh)
-   **Pulsating Glows**: Warning animations for hazardous conditions
-   **Overlay Effects**: Atmospheric overlays that simulate fog and smog

### 🎯 Visual Feedback

-   **Mood Indicator**: Real-time status badge showing current air quality mood
-   **Color-Coded UI Elements**: Cards, borders, and text adapt to match the mood
-   **Smooth Transitions**: 1.2-second transitions between mood states for seamless experience
-   **Shadow Effects**: Dynamic shadows that reflect the severity of pollution

## How It Works

### Architecture

The mood-reactive UI is built with three core components:

1. **AQIMoodProvider** (`components/aqi-mood-provider.tsx`)

    - React Context provider that manages AQI state
    - Calculates mood themes based on AQI values
    - Supports both light and dark modes
    - Applies CSS custom properties dynamically

2. **MoodReactiveWrapper** (`components/mood-reactive-wrapper.tsx`)

    - Wraps the entire application
    - Applies atmospheric overlays and effects
    - Manages floating particles for clean air conditions
    - Handles transition animations

3. **CSS Variables** (`app/globals.css`)
    - Dynamic CSS custom properties for colors
    - Mood-specific utility classes
    - Smooth transition animations
    - Responsive adjustments

### Integration

The mood-reactive UI integrates with the existing AQI monitoring system:

```tsx
// In page.tsx
const handleAQIUpdate = (aqi: number) => {
    updateAudioAQI(aqi); // Update audio feedback
    updateMoodAQI(aqi); // Update mood theme
};
```

### CSS Classes

Apply mood-reactive styling to any component:

-   `.mood-card` - Card with mood-based background and borders
-   `.mood-text-primary` - Primary text color based on mood
-   `.mood-text-secondary` - Secondary text color based on mood
-   `.mood-accent` - Accent color for icons and highlights
-   `.mood-border` - Border color based on mood
-   `.mood-indicator` - Status badge showing current mood

## Usage

### Basic Implementation

1. The `AQIMoodProvider` is already integrated in `app/layout.tsx`
2. The `MoodReactiveWrapper` wraps the main page content in `app/page.tsx`
3. AQI updates automatically trigger mood changes through the `handleAQIUpdate` function

### Adding Mood Styles to Components

To make a component mood-reactive, add the appropriate CSS classes:

```tsx
// Mood-reactive card
<Card className="mood-card">
  <CardTitle className="mood-text-primary">
    <Icon className="mood-accent" />
    Title
  </CardTitle>
  <CardContent className="mood-text-secondary">
    Content
  </CardContent>
</Card>

// Mood-reactive border
<div className="border mood-border">
  Content with mood-reactive border
</div>
```

### Using the Mood Context

Access mood information in any component:

```tsx
import { useAQIMood } from "@/components/aqi-mood-provider";

function MyComponent() {
    const { aqiValue, moodTheme, updateAQI } = useAQIMood();

    return (
        <div>
            <p>Current AQI: {aqiValue}</p>
            <p>Mood Level: {moodTheme.level}</p>
            <p>Description: {moodTheme.description}</p>
            <p>Atmosphere: {moodTheme.atmosphere}</p>
        </div>
    );
}
```

## Customization

### Adjusting Mood Themes

Edit the `getMoodTheme` function in `components/aqi-mood-provider.tsx` to customize:

-   Color schemes for each mood level
-   Gradient patterns
-   Border styles
-   Shadow effects

### Modifying Transitions

Adjust transition speeds in `app/globals.css`:

```css
/* Change mood transition duration */
html.aqi-mood-transition,
html.aqi-mood-transition body,
html.aqi-mood-transition .mood-reactive {
    transition: background 1.2s ease-in-out, /* Modify this */ background-color
            1.2s ease-in-out, color 0.8s ease-in-out;
}
```

### Adding Custom Atmospheric Effects

Add new effects in `MoodReactiveWrapper` component:

```tsx
// Example: Add custom effect for polluted air
{
    moodTheme.level === "polluted" && (
        <div className="custom-pollution-effect">
            {/* Your custom effect */}
        </div>
    );
}
```

## Performance Considerations

-   **CSS Transitions**: All transitions use GPU-accelerated properties (transform, opacity)
-   **Backdrop Filters**: Limited to higher pollution levels to minimize performance impact
-   **Particle Effects**: Only active for good air quality (pristine/fresh) to avoid clutter
-   **Responsive Design**: Atmospheric effects are reduced on mobile devices

## Browser Support

The mood-reactive UI uses modern CSS features:

-   CSS Custom Properties (CSS Variables)
-   Backdrop Filters
-   CSS Transitions and Animations
-   oklch() color space (with fallbacks)

Recommended browsers:

-   Chrome/Edge 88+
-   Firefox 85+
-   Safari 14+

## Accessibility

The mood-reactive UI maintains accessibility:

-   Color contrasts meet WCAG AA standards across all mood levels
-   Theme changes don't affect text readability
-   Visual effects can be disabled via system preferences (prefers-reduced-motion)
-   Status information is available via the MoodIndicator component

## Future Enhancements

Potential improvements:

-   User preference to enable/disable mood effects
-   Custom mood palettes based on user preferences
-   Seasonal theme variations
-   Integration with weather conditions
-   Sound effects synchronized with mood transitions
-   Accessibility mode with high contrast themes

## Troubleshooting

### Mood theme not updating

-   Ensure `AQIMoodProvider` is wrapping your app in `layout.tsx`
-   Check that `handleAQIUpdate` is called when AQI changes
-   Verify the AQI value is a valid number (0-500)

### Transitions too slow/fast

-   Adjust transition durations in `globals.css`
-   Modify the timeout in `MoodReactiveWrapper` useEffect

### Atmospheric effects not visible

-   Check that `data-aqi-mood` attribute is set on `<html>` element
-   Verify CSS classes are correctly applied
-   Ensure z-index stacking is correct

### Performance issues

-   Reduce backdrop-filter blur values
-   Disable particle effects on lower-end devices
-   Simplify gradient backgrounds

## Credits

Designed and implemented for the NASA Space App Challenge project.
Built with React, Next.js, Tailwind CSS, and shadcn/ui components.
