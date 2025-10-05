"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { Wind, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { AQIHigherLowerGame } from "@/components/aqi-higher-lower-game";

export function Header() {
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
                    <ModeToggle />
                </div>
            </div>
        </header>
    );
}
