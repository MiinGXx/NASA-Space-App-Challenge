"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { MoodIndicator } from "@/components/mood-indicator";
import { Wind, Gamepad2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { AQIHigherLowerGame } from "@/components/aqi-higher-lower-game";

interface HeaderProps {
    isMuted?: boolean;
    onToggleMute?: () => void;
}

export function Header({ isMuted = true, onToggleMute }: HeaderProps) {
    return (
        <header className="border-b mood-border backdrop-blur-md mood-card">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Wind className="h-8 w-8 mood-accent" />
                    <div>
                        <h1 className="text-2xl font-bold mood-text-primary">
                            AQI Forecast
                        </h1>
                        <p className="text-sm mood-text-secondary">
                            Air Quality Monitoring
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <MoodIndicator />
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                aria-label="Play AQI Game"
                                className="mood-border"
                            >
                                AQhigh?
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mood-card mood-border border">
                            <DialogHeader>
                                <DialogTitle className="mood-text-primary">
                                    AQI Higher or Lower Game
                                </DialogTitle>
                            </DialogHeader>
                            <AQIHigherLowerGame />
                        </DialogContent>
                    </Dialog>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onToggleMute}
                        aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
                        title={
                            isMuted ? "Unmute AQI sounds" : "Mute AQI sounds"
                        }
                        className="mood-border"
                    >
                        {isMuted ? (
                            <VolumeX className="h-4 w-4" />
                        ) : (
                            <Volume2 className="h-4 w-4" />
                        )}
                    </Button>
                    <ModeToggle />
                </div>
            </div>
        </header>
    );
}
