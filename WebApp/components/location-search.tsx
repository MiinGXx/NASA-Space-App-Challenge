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
        <div className="bg-card py-4 w-full">
            <div className="container px-4 py-2 mx-auto">
                <form onSubmit={handleSubmit} className="flex gap-2 w-full">
                    <div className="relative flex-1 bg-muted rounded-md">
                        <Input
                            type="text"
                            placeholder="Search for a location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 w-full bg-transparent"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                    <Button type="submit" className="h-10">
                        Search
                    </Button>
                </form>
            </div>
        </div>
    );
}
