"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
    onSearch: (location: string) => void;
}

export function LocationSearch({ onSearch }: SearchBarProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            onSearch(searchQuery.trim());
        }
    };

    return (
        <div className="backdrop-blur-md bg-white/10 border-b border-white/20 dark:border-white/10 py-4 w-full">
            <div className="container px-4 py-2 mx-auto">
                <form onSubmit={handleSubmit} className="flex gap-2 w-full">
                    <div className="relative flex-1 backdrop-blur-sm bg-white/20  rounded-md border border-white/30 dark:border-white/20">
                        <Input
                            type="text"
                            placeholder="Search for a location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 w-full bg-transparent border-0"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                    <Button
                        type="submit"
                        className="h-10 border border-white/50 dark:border-white/20 bg-white/30 hover:bg-white/40 dark:bg-white/10 dark:hover:bg-white/20 text-black dark:text-white"
                    >
                        Search
                    </Button>
                </form>
            </div>
        </div>
    );
}
