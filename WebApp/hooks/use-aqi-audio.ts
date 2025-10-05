"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Custom hook to manage background audio based on AQI levels
 * Maps AQI thresholds to different sound categories
 */
export function useAQIAudio() {
    const [isMuted, setIsMuted] = useState(true); // Start muted by default
    const [currentAQI, setCurrentAQI] = useState<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const currentSoundCategory = useRef<string | null>(null);

    /**
     * Get the sound category based on AQI value
     * AQI Ranges:
     * 0-50: Good
     * 51-100: Moderate
     * 101-150: Unhealthy for Sensitive Groups
     * 151-200: Unhealthy
     * 201-300: Very Unhealthy
     * 301+: Hazardous
     */
    const getSoundCategory = useCallback((aqi: number): string => {
        if (aqi <= 50) return "good"; // Good - calm, peaceful sounds
        if (aqi <= 100) return "moderate"; // Moderate - neutral ambient sounds
        if (aqi <= 150) return "unhealthy-sensitive"; // Unhealthy for Sensitive Groups - slightly tense
        if (aqi <= 200) return "unhealthy"; // Unhealthy - concerning sounds
        if (aqi <= 300) return "very-unhealthy"; // Very Unhealthy - alert sounds
        return "hazardous"; // Hazardous - urgent/alarm sounds
    }, []);

    /**
     * Get the audio file path for a given sound category
     * These paths are placeholders - replace with actual audio files
     */
    const getAudioPath = useCallback((category: string): string => {
        const audioMap: Record<string, string> = {
            good: "/sounds/aqi-good.mp3",
            moderate: "/sounds/aqi-moderate.mp3",
            "unhealthy-sensitive": "/sounds/aqi-unhealthy-sensitive.mp3",
            unhealthy: "/sounds/aqi-unhealthy.mp3",
            "very-unhealthy": "/sounds/aqi-very-unhealthy.mp3",
            hazardous: "/sounds/aqi-hazardous.mp3",
        };
        return audioMap[category] || "";
    }, []);

    /**
     * Play or switch to a new sound based on the category
     */
    const playSound = useCallback(
        (category: string) => {
            if (isMuted) return;

            const audioPath = getAudioPath(category);
            if (!audioPath) return;

            // If same category is already playing, don't restart
            if (currentSoundCategory.current === category && audioRef.current) {
                return;
            }

            // Stop current audio if playing
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            // Create and play new audio
            try {
                const audio = new Audio(audioPath);
                audio.loop = true;
                audio.volume = 0.3; // Set volume to 30%

                // Fade in effect
                audio.volume = 0;
                audio
                    .play()
                    .then(() => {
                        let vol = 0;
                        const fadeIn = setInterval(() => {
                            if (vol < 0.3) {
                                vol += 0.05;
                                audio.volume = Math.min(vol, 0.3);
                            } else {
                                clearInterval(fadeIn);
                            }
                        }, 100);
                    })
                    .catch((error) => {
                        console.warn("Audio playback failed:", error);
                    });

                audioRef.current = audio;
                currentSoundCategory.current = category;
            } catch (error) {
                console.error("Error creating audio:", error);
            }
        },
        [isMuted, getAudioPath]
    );

    /**
     * Stop all audio playback
     */
    const stopSound = useCallback(() => {
        if (audioRef.current) {
            // Fade out effect
            const fadeOut = setInterval(() => {
                if (audioRef.current && audioRef.current.volume > 0.05) {
                    audioRef.current.volume -= 0.05;
                } else {
                    clearInterval(fadeOut);
                    if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current = null;
                    }
                    currentSoundCategory.current = null;
                }
            }, 50);
        }
    }, []);

    /**
     * Toggle mute/unmute
     */
    const toggleMute = useCallback(() => {
        setIsMuted((prev) => !prev);
    }, []);

    /**
     * Update the current AQI value
     */
    const updateAQI = useCallback((aqi: number) => {
        setCurrentAQI(aqi);
    }, []);

    // Effect to handle audio playback based on AQI changes
    useEffect(() => {
        if (currentAQI === null) return;

        const category = getSoundCategory(currentAQI);

        if (isMuted) {
            stopSound();
        } else {
            playSound(category);
        }
    }, [currentAQI, isMuted, getSoundCategory, playSound, stopSound]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    return {
        isMuted,
        toggleMute,
        updateAQI,
        currentAQI,
    };
}
