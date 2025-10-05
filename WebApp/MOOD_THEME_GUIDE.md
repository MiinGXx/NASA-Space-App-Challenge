# AQI Mood Theme Visual Guide

## Color Palettes by Mood Level

### 🌟 Pristine (AQI 0-50) - "Clear skies and fresh air"

**Light Mode:**

-   Background: Cyan/Sky/Blue gradient (from-cyan-50 via-sky-100 to-blue-50)
-   Cards: White with 80% opacity
-   Text Primary: Deep ocean blue (rgb(12, 74, 110))
-   Accent: Sky blue (rgb(14, 165, 233))
-   Atmosphere: Light blue overlay with floating particles

**Dark Mode:**

-   Background: Deep sky/blue/slate gradient (from-sky-950 via-blue-950 to-slate-900)
-   Cards: Dark slate with 70% opacity
-   Text Primary: Light cyan (rgb(240, 249, 255))
-   Accent: Bright sky blue (rgb(56, 189, 248))
-   Atmosphere: Subtle blue glow with floating particles

**Visual Effects:**

-   ✨ Floating particles animated across screen
-   🌊 Radial gradient: Blue/cyan tones
-   🎨 Clean, breathable aesthetic

---

### 🌤️ Fresh (AQI 51-100) - "Acceptable air quality"

**Light Mode:**

-   Background: Amber/Yellow/Lime gradient (from-amber-50 via-yellow-50 to-lime-50)
-   Cards: White with 75% opacity
-   Text Primary: Warm brown (rgb(113, 63, 18))
-   Accent: Golden yellow (rgb(234, 179, 8))
-   Atmosphere: Light fog effect

**Dark Mode:**

-   Background: Slate/Amber gradient (from-slate-900 via-amber-950 to-slate-900)
-   Cards: Dark slate with 75% opacity
-   Text Primary: Light yellow (rgb(254, 249, 195))
-   Accent: Amber (rgb(251, 191, 36))
-   Atmosphere: Warm amber glow with light fog

**Visual Effects:**

-   💨 Light fog backdrop filter (blur 0.5px on mobile)
-   ☀️ Radial gradient: Warm yellow/amber
-   🍃 Pleasant, comfortable feel

---

### 🌫️ Hazy (AQI 101-150) - "Sensitive groups may experience effects"

**Light Mode:**

-   Background: Orange/Amber/Stone gradient (from-orange-100 via-amber-100 to-stone-100)
-   Cards: White with 70% opacity
-   Text Primary: Deep orange (rgb(124, 45, 18))
-   Accent: Bright orange (rgb(249, 115, 22))
-   Atmosphere: Noticeable fog overlay

**Dark Mode:**

-   Background: Slate/Orange/Stone gradient (from-slate-900 via-orange-950 to-stone-900)
-   Cards: Stone gray with 80% opacity
-   Text Primary: Light peach (rgb(254, 215, 170))
-   Accent: Orange (rgb(249, 115, 22))
-   Atmosphere: Orange-tinted fog

**Visual Effects:**

-   🌁 Fog backdrop filter (blur 0.5px)
-   🍊 Radial gradient: Muted orange tones
-   ⚠️ Cautious, slightly concerning atmosphere

---

### 🚨 Polluted (AQI 151-200) - "Everyone may experience health effects"

**Light Mode:**

-   Background: Red/Orange/Stone gradient (from-red-100 via-orange-100 to-stone-200)
-   Cards: White with 65% opacity
-   Text Primary: Deep red (rgb(127, 29, 29))
-   Accent: Red (rgb(220, 38, 38))
-   Atmosphere: Heavy fog overlay

**Dark Mode:**

-   Background: Stone/Red/Slate gradient (from-stone-950 via-red-950 to-slate-950)
-   Cards: Very dark with 85% opacity
-   Text Primary: Light rose (rgb(254, 202, 202))
-   Accent: Red (rgb(239, 68, 68))
-   Atmosphere: Red-tinted smog

**Visual Effects:**

-   🌫️ Heavy fog backdrop filter (blur 0.5px on desktop, none on mobile)
-   🔴 Radial gradient: Dark red/orange
-   ⚠️ Concerning, unhealthy atmosphere

---

### ☠️ Toxic (AQI 201-300) - "Health alert - everyone at risk"

**Light Mode:**

-   Background: Purple/Violet/Gray gradient (from-purple-200 via-violet-200 to-gray-300)
-   Cards: White with 60% opacity
-   Text Primary: Deep purple (rgb(76, 29, 149))
-   Accent: Purple (rgb(147, 51, 234))
-   Atmosphere: Thick smog overlay

**Dark Mode:**

-   Background: Violet/Purple/Slate gradient (from-violet-950 via-purple-950 to-slate-950)
-   Cards: Near-black with 90% opacity
-   Text Primary: Light lavender (rgb(243, 232, 255))
-   Accent: Bright purple (rgb(168, 85, 247))
-   Atmosphere: Purple smog with heavy blur

**Visual Effects:**

-   💨 Smog backdrop filter (blur 1px)
-   💜 Radial gradient: Deep purple tones
-   ⚠️ Pulsating glow animation (3s cycle)
-   🚨 Dangerous, urgent atmosphere

---

### ☢️ Hazardous (AQI 301+) - "Health emergency - avoid outdoor activity"

**Light Mode:**

-   Background: Gray/Stone/Red gradient (from-gray-400 via-stone-400 to-red-300)
-   Cards: White with 50% opacity
-   Text Primary: Very deep red (rgb(69, 10, 10))
-   Accent: Dark maroon (rgb(153, 27, 27))
-   Atmosphere: Dense smog overlay

**Dark Mode:**

-   Background: Gray/Red/Stone gradient (from-gray-950 via-red-950 to-stone-950)
-   Cards: Almost black with 95% opacity
-   Text Primary: Very light pink (rgb(254, 226, 226))
-   Accent: Crimson (rgb(185, 28, 28))
-   Atmosphere: Thick smog with intense blur

**Visual Effects:**

-   🌫️ Heavy smog backdrop filter (blur 1px on desktop, 0.5px on mobile)
-   🔴 Radial gradient: Ominous maroon/red
-   ⚠️ Strong pulsating glow (hazard-pulse animation)
-   💀 Emergency, critical atmosphere

---

## Transition Behavior

All mood changes animate smoothly over **1.2 seconds**:

-   Background gradients morph
-   Colors blend seamlessly
-   Text colors fade between states
-   Borders and shadows transition
-   Atmospheric effects gradually appear/disappear

## Responsive Design

### Desktop (>768px):

-   Full atmospheric effects
-   Backdrop filters at specified values
-   All particle animations

### Mobile (≤768px):

-   Reduced atmospheric opacity (80%)
-   Minimal backdrop blur
-   Lighter effects for performance

## CSS Classes Reference

| Class                  | Purpose                          |
| ---------------------- | -------------------------------- |
| `.mood-card`           | Card with mood background/border |
| `.mood-text-primary`   | Primary text color               |
| `.mood-text-secondary` | Secondary text color             |
| `.mood-accent`         | Accent color for icons           |
| `.mood-border`         | Mood-based border color          |
| `.mood-indicator`      | Status badge component           |
| `.mood-reactive-bg`    | Main background wrapper          |
| `.mood-atmosphere`     | Atmospheric overlay              |
| `.mood-particles`      | Particle effect container        |

## Data Attributes

The `<html>` element receives:

```html
<html data-aqi-mood="pristine|fresh|hazy|polluted|toxic|hazardous"></html>
```

Use for conditional styling:

```css
[data-aqi-mood="hazardous"] .custom-element {
    /* Hazardous-specific styles */
}
```

## Animation Keyframes

### Float Particle (for Pristine/Fresh)

```css
@keyframes float-particle {
    0%,
    100% {
        transform: translateY(0) translateX(0);
        opacity: 0.3;
    }
    50% {
        transform: translateY(-20px) translateX(10px);
        opacity: 0.6;
    }
}
```

Duration: 8s + random(0-4s)

### Hazard Pulse (for Toxic/Hazardous)

```css
@keyframes hazard-pulse {
    0%,
    100% {
        box-shadow: 0 0 10px accent, 0 0 20px accent;
    }
    50% {
        box-shadow: 0 0 20px accent, 0 0 40px accent;
    }
}
```

Duration: 3s infinite

## Color Accessibility

All mood themes maintain:

-   ✅ WCAG AA contrast ratios
-   ✅ Readable text at all sizes
-   ✅ Distinguishable UI elements
-   ✅ Compatible with both light/dark modes

## Example Usage in Components

```tsx
// Mood-reactive card
<Card className="mood-card">
    <CardHeader>
        <CardTitle className="mood-text-primary">
            <Wind className="mood-accent" />
            Air Quality Status
        </CardTitle>
    </CardHeader>
    <CardContent className="mood-text-secondary">
        <div className="border mood-border p-4 rounded-lg">
            Content adapts to current mood
        </div>
    </CardContent>
</Card>
```

## Testing Each Mood

Use the MoodThemeDemo component or manually set AQI values:

```tsx
import { useAQIMood } from "@/components/aqi-mood-provider";

function TestMoods() {
    const { updateAQI } = useAQIMood();

    return (
        <div>
            <button onClick={() => updateAQI(25)}>Pristine</button>
            <button onClick={() => updateAQI(75)}>Fresh</button>
            <button onClick={() => updateAQI(125)}>Hazy</button>
            <button onClick={() => updateAQI(175)}>Polluted</button>
            <button onClick={() => updateAQI(250)}>Toxic</button>
            <button onClick={() => updateAQI(400)}>Hazardous</button>
        </div>
    );
}
```
