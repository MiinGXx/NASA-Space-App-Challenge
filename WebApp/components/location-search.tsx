"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
    onSearch: (location: string) => void;
}

interface LocationSuggestion {
    display_name: string;
    name: string;
    type: string;
    lat: string;
    lon: string;
}

export function LocationSearch({ onSearch }: SearchBarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Fetch location suggestions from Nominatim API
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchQuery.trim().length < 2) {
                setSuggestions([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                        searchQuery
                    )}&limit=5&addressdetails=1`
                );
                const data = await response.json();
                setSuggestions(data);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Error fetching suggestions:", error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchSuggestions();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            onSearch(searchQuery.trim());
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion: LocationSuggestion) => {
        const locationName =
            suggestion.name ||
            suggestion.display_name.split(",")[0] ||
            suggestion.display_name;
        setSearchQuery(locationName);
        onSearch(locationName);
        setShowSuggestions(false);
    };

    return (
        <div className="backdrop-blur-md bg-white/10 border-b border-white/20 dark:border-white/10 py-4 w-full relative z-[100]">
            <div className="container px-4 py-2 mx-auto relative z-[100]">
                <form onSubmit={handleSubmit} className="flex gap-2 w-full">
                    <div
                        ref={searchRef}
                        className="relative flex-1 backdrop-blur-sm bg-white/20 rounded-md border border-white dark:border-white"
                    >
                        <Input
                            type="text"
                            placeholder="Search for a location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() =>
                                suggestions.length > 0 &&
                                setShowSuggestions(true)
                            }
                            className="pl-10 h-10 w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="absolute right-3 top-2.5">
                                <div className="animate-spin h-5 w-5 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
                            </div>
                        )}
                    </div>
                    <Button
                        type="submit"
                        className="h-10 border border-white/50 dark:border-white/20 bg-white/30 hover:bg-white/40 dark:bg-white/10 dark:hover:bg-white/20 text-black dark:text-white"
                    >
                        Search
                    </Button>
                </form>

                {/* Autocomplete Suggestions Dropdown - moved outside form */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-[9999] left-4 right-4 mt-1 !bg-white border border-gray-200 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() =>
                                    handleSuggestionClick(suggestion)
                                }
                                className="w-full px-4 py-3 text-left !bg-white hover:!bg-gray-100 transition-colors flex items-start gap-2 border-b border-gray-200 last:border-b-0"
                            >
                                <MapPin className="h-4 w-4 mt-0.5 !text-gray-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium !text-gray-900 truncate">
                                        {suggestion.name ||
                                            suggestion.display_name.split(
                                                ","
                                            )[0]}
                                    </p>
                                    <p className="text-xs !text-gray-600 truncate">
                                        {suggestion.display_name}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
