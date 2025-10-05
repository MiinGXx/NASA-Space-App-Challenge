# 🌍 AQhigh - NASA Space App Challenge

A comprehensive AI-powered real-time air quality monitoring application with an innovative user interface that visually adapts to air quality conditions.

## 🚀 Project Overview

**AQhigh** is an interactive web application developed for the NASA Space App Challenge that provides real-time air quality monitoring, forecasting, and environmental data visualization. The application features a unique **mood-reactive UI** that dynamically changes its visual theme, colors, and atmospheric effects based on current air quality index (AQI) levels, creating an immersive and intuitive user experience.

### 🌟 Key Features

- **Real-time Air Quality Monitoring** - Live AQI data with detailed pollutant breakdowns
- **Mood-Reactive UI** - Dynamic visual themes that adapt to air quality conditions
- **Interactive Pollution Maps** - Heatmap visualization of pollution data
- **Weather Integration** - Comprehensive weather forecasting with air quality correlation
- **Location-based Services** - Automatic geolocation and manual location search
- **AI-Powered Chatbot** - Intelligent assistant for air quality and weather queries
- **Audio Feedback System** - Sound alerts based on AQI levels
- **Push Notifications** - Real-time alerts for air quality changes
- **Health Guidance** - Personalized recommendations based on current conditions
- **Forecast Panel** - Multi-day air quality and weather predictions
- **Gamification** - AQI Higher/Lower game for environmental awareness
- **Responsive Design** - Optimized for desktop and mobile devices

## 🏗️ Architecture

```
NASA-Space-App-Challenge/
WebApp/                    # Next.js Frontend Application
├── app/                   # App Router (Next.js 13+)
│   ├── api/               # API Routes
│   │   ├── chat/          # AI Chatbot API
│   │   ├── pollution/     # Air Quality Data API
│   │   └── weather/       # Weather Data API
│   ├── globals.css        # Global styles with mood theming
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main application page
│   ├── components/            # Reusable React Components
│   ├── ui/                # shadcn/ui components
│   ├── aqi-status.tsx     # Air quality status display
│   ├── pollution-map.tsx  # Interactive pollution heatmap
│   ├── mood-reactive-wrapper.tsx  # Mood UI wrapper
│   ├── aqi-mood-provider.tsx      # Mood state management
│   └── ...               # Other feature components
└── ...                   # Configuration files
```

## 🛠️ Tech Stack

### Frontend (WebApp)
- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom mood theming
- **Maps**: React Leaflet with heatmap layers
- **Charts**: Recharts for data visualization

### Backend APIs
- **Runtime**: Node.js (Next.js API routes)
- **AI Integration**: Azure AI Foundry
- **Data Sources**: 
  - Open-Meteo Weather API
  - Open-Meteo Air Quality API
  - OpenStreetMap Geocoding API

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/MiinGXx/NASA-Space-App-Challenge.git
cd NASA-Space-App-Challenge
```

2. **Setup the WebApp**
```bash
cd WebApp
npm install
```

3. **Environment Configuration** (optional, for AI features)
Create `.env.local` in the WebApp directory:
```env
AZURE_AI_ENDPOINT=your_azure_ai_endpoint
AZURE_AI_API_KEY=your_azure_ai_api_key
AZURE_AI_MODEL=your_model_name
```

4. **Run the application**
```bash
cd WebApp
npm run dev
```

5. **Access the application**
```
Open "http://localhost:3000" in your browser
```

## 📱 Features Deep Dive

### 🎨 Mood-Reactive UI System

The application's most innovative feature is its mood-reactive UI that dynamically adapts to air quality conditions:

#### Visual Effects:
- Dynamic background gradients that shift with AQI
- Color-coded text and UI elements
- Audio feedback synchronized with visual changes

### 📊 Air Quality Monitoring

- **Real-time AQI Data**: Current air quality index with detailed breakdown
- **Pollutant Analysis**: PM2.5, PM10, O3, NO2, CO measurements
- **Health Impact Indicators**: Color-coded severity levels

### 🗺️ Interactive Pollution Maps

- **Heatmap Visualization**: Color-coded pollution intensity
- **Multiple Pollutants**: Switch between different pollutant types
- **Location-based**: Centered on user's current or selected location
- **Real-time Updates**: Live data integration with smooth animations

### 🤖 AI-Powered Chatbot

- **Natural Conversations**: Ask questions about air quality and weather
- **Contextual Responses**: Uses current location and conditions data
- **Azure AI Integration**: Powered by Azure AI Foundry
- **Floating Interface**: Accessible from anywhere in the app

### 🎵 Audio Feedback System

- **AQI-based Sounds**: Different audio cues for each air quality level
- **Mute Toggle**: User-controllable audio preferences
- **Immersive Experience**: Synchronized with visual mood changes

### 📍 Location Services

- **Auto-detection**: Automatic geolocation on first visit
- **Manual Search**: Search and select any global location
- **Global Coverage**: Support for cities worldwide

## 🎮 Interactive Features

### AQI Higher/Lower Game
Test your knowledge of air quality levels across different cities.

### Push Notifications
Real-time alerts for significant air quality changes.

### Health Guidance
Personalized recommendations based on current air quality:
- Outdoor activity suggestions
- Health precautions for sensitive groups
- Protective measures for high pollution days

## 📱 Responsive Design

- **Adaptive Layouts**: Components adjust to screen sizes
- **Touch-Friendly**: Optimized interactions for touch devices
- **Performance**: Reduced effects on mobile for better performance

**Experience air quality like never before with AQhigh's mood-reactive interface!** 🌍💨✨

*Making environmental data beautiful, intuitive, and actionable.*
