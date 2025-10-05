"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, RefreshCw, TrendingUp, Trophy } from "lucide-react";

interface PollutionPoint {
    lat: number;
    lng: number;
    value: number; // AQI
    pollutantType: string;
    location?: string;
    timestamp: string;
}

interface CityAQI {
    name: string;
    aqi: number;
}

const POLLUTANT = "aqi";
const BATCH_SIZE = 40; // how many cities per fetch
const REFILL_THRESHOLD = 6; // when remaining unique cities < threshold, fetch more
const MAX_POOL = 200; // cap pool size

export function AQIHigherLowerGame() {
    const [cities, setCities] = useState<CityAQI[]>([]);
    const [current, setCurrent] = useState<CityAQI | null>(null);
    const [nextCity, setNextCity] = useState<CityAQI | null>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [status, setStatus] = useState<
        "playing" | "reveal" | "gameover" | "loading" | "error"
    >("loading");
    const [message, setMessage] = useState<string>("");
    const [fetchingMore, setFetchingMore] = useState(false);

    // Deduplicate & merge new cities into pool
    const mergeCities = useCallback((incoming: CityAQI[]) => {
        setCities((prev) => {
            const seen = new Set(prev.map((c) => c.name));
            const filtered = incoming.filter((c) => !seen.has(c.name));
            const merged = [...prev, ...filtered];
            // Shuffle lightly after merge to keep variety
            for (let i = merged.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [merged[i], merged[j]] = [merged[j], merged[i]];
            }
            return merged.slice(0, MAX_POOL);
        });
    }, []);

    const fetchRandomCities = useCallback(
        async (initial = false) => {
            try {
                if (!initial) setFetchingMore(true);
                const url = `/api/pollution?pollutant=${POLLUTANT}&random=true&count=${BATCH_SIZE}`;
                const res = await fetch(url, { cache: "no-store" });
                if (!res.ok) throw new Error("Fetch failed");
                const data = await res.json();
                const points: PollutionPoint[] = data.pollutionData || [];
                const newCities: CityAQI[] = points
                    .filter(
                        (p) =>
                            typeof p.location === "string" &&
                            p.location.trim().length > 0 &&
                            typeof p.value === "number"
                    )
                    .map((p) => ({
                        name: p.location as string,
                        aqi: Math.round(p.value),
                    }));
                mergeCities(newCities);
            } catch (e) {
                if (initial) {
                    setStatus("error");
                    setMessage("Unable to load AQI data.");
                }
                console.error(e);
            } finally {
                if (!initial) setFetchingMore(false);
            }
        },
        [mergeCities]
    );

    // Initial load
    useEffect(() => {
        (async () => {
            setStatus("loading");
            await fetchRandomCities(true);
        })();
    }, [fetchRandomCities]);

    // Initialize first pair once pool populated
    useEffect(() => {
        if (status === "loading" && cities.length >= 2) {
            setCurrent(cities[0]);
            setNextCity(cities[1]);
            setScore(0);
            setStatus("playing");
            setMessage("");
        }
    }, [cities, status]);

    const remainingCities = useMemo(() => {
        if (!current) return [];
        return cities.filter(
            (c) => c.name !== current.name && c.name !== nextCity?.name
        );
    }, [cities, current, nextCity]);

    async function ensurePool() {
        if (remainingCities.length < REFILL_THRESHOLD && !fetchingMore) {
            await fetchRandomCities();
        }
    }

    function pickNewNext(exclude: Set<string>): CityAQI | null {
        const candidates = cities.filter((c) => !exclude.has(c.name));
        if (candidates.length === 0) return null;
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    const handleGuess = async (guess: "higher" | "lower") => {
        if (!current || !nextCity || status !== "playing") return;
        const isHigher = nextCity.aqi > current.aqi;
        const correct =
            (guess === "higher" && isHigher) ||
            (guess === "lower" && !isHigher);
        if (correct) {
            setScore((s) => s + 1);
            setStatus("reveal");
            setMessage(
                `Correct! ${nextCity.name} has an AQI of ${nextCity.aqi}.`
            );
            setTimeout(async () => {
                await ensurePool();
                const used = new Set([current.name, nextCity.name]);
                const newCurrent = nextCity;
                const newNext = pickNewNext(used);
                if (!newNext) {
                    setStatus("gameover");
                    setMessage("Amazing! You exhausted the current pool.");
                    setHighScore((h) => Math.max(h, score + 1));
                    return;
                }
                setCurrent(newCurrent);
                setNextCity(newNext);
                setStatus("playing");
                setMessage("");
            }, 1200);
        } else {
            setStatus("gameover");
            setMessage(`Game Over! ${nextCity.name} AQI was ${nextCity.aqi}.`);
            setHighScore((h) => Math.max(h, score));
        }
    };

    const restart = async () => {
        setStatus("loading");
        setCities([]);
        setCurrent(null);
        setNextCity(null);
        setScore(0);
        setMessage("");
        await fetchRandomCities(true);
    };

    return (
        <div className="space-y-4">
            <Card className="bg-gradient-to-br from-background/80 to-background/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-4 w-4" /> AQI Higher / Lower
                    </CardTitle>
                    <CardDescription>
                        Endless mode (Curated Static List)
                    </CardDescription>
                    <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={restart}
                            disabled={status === "loading"}
                        >
                            Refresh Pool
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status === "loading" && (
                        <div className="flex flex-col items-center py-10 gap-3 text-sm text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" /> Loading
                            city AQI data...
                        </div>
                    )}
                    {status === "error" && (
                        <div className="flex flex-col items-center py-10 gap-4">
                            <p className="text-sm text-destructive">
                                {message}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={restart}
                            >
                                <RefreshCw className="h-4 w-4 mr-1" /> Retry
                            </Button>
                        </div>
                    )}
                    {current &&
                        nextCity &&
                        status !== "loading" &&
                        status !== "error" && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-lg border bg-card/40">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                                            Current City
                                        </p>
                                        <p className="font-semibold">
                                            {current.name}
                                        </p>
                                        <p className="text-3xl font-bold mt-2">
                                            {current.aqi}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            AQI
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-lg border bg-card/40 relative">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                                            Next City
                                        </p>
                                        <p className="font-semibold">
                                            {nextCity.name}
                                        </p>
                                        <p className="text-3xl font-bold mt-2">
                                            {status === "reveal" ||
                                            status === "gameover"
                                                ? nextCity.aqi
                                                : "?"}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            AQI
                                        </p>
                                        {status === "playing" && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur rounded-lg" />
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-center text-xs text-muted-foreground">
                                    <div className="flex gap-4 items-center">
                                        {fetchingMore && (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        )}
                                        <span>
                                            Score:{" "}
                                            <span className="font-medium text-foreground">
                                                {score}
                                            </span>
                                        </span>
                                        <span className="hidden sm:inline">
                                            |
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Trophy className="h-3.5 w-3.5" />{" "}
                                            High: {highScore}
                                        </span>
                                    </div>
                                </div>

                                <Separator />

                                {status === "playing" && (
                                    <div className="flex gap-3">
                                        <Button
                                            className="flex-1"
                                            onClick={() =>
                                                handleGuess("higher")
                                            }
                                        >
                                            Higher
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            variant="secondary"
                                            onClick={() => handleGuess("lower")}
                                        >
                                            Lower
                                        </Button>
                                    </div>
                                )}

                                {status === "reveal" && (
                                    <div className="text-center text-sm font-medium text-emerald-500 animate-pulse">
                                        {message}
                                    </div>
                                )}

                                {status === "gameover" && (
                                    <div className="flex flex-col items-center gap-4">
                                        <p className="text-sm font-medium">
                                            {message}
                                        </p>
                                        <Button size="sm" onClick={restart}>
                                            <RefreshCw className="h-4 w-4 mr-1" />{" "}
                                            Play Again
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                </CardContent>
            </Card>
        </div>
    );
}
