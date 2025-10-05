"use client";

import { ModeToggle } from "@/components/mode-toggle";
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
        <header className="border-b border-white/20 backdrop-blur-md bg-white/10">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Wind className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            AQI Forecast
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Air Quality Monitoring
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                aria-label="Play AQI Game"
                            >
                                AQhigh?
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-200/10 text-white border-white/20">
                            <DialogHeader>
                                <DialogTitle className="text-white">
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
