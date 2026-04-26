"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, MapPin, Search, Globe } from "lucide-react";
import { useTribeStore } from "@/store/use-tribe-store";
import { loadCityData } from "@/lib/city-data";
import { cities } from "@/seed/cities";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CitySwitcherProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CitySwitcher({ isOpen, onOpenChange }: CitySwitcherProps) {
    const { currentCity, switchCity } = useTribeStore();
    const [search, setSearch] = useState("");

    const filteredCities = cities.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.country.toLowerCase().includes(search.toLowerCase())
    );

    const handleCitySelect = async (city: typeof cities[0]) => {
        if (city.id === currentCity?.id) {
            onOpenChange(false);
            return;
        }

        try {
            localStorage.setItem("tribe-selected-city", city.id);
            const data = await loadCityData(city);
            switchCity(city, data);
            onOpenChange(false);
        } catch (err) {
            console.error("Failed to switch city:", err);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-[40px] border-none p-0 overflow-hidden bg-[#fcfcfc]">
                <DialogHeader className="p-8 pb-4 bg-white">
                    <DialogTitle className="text-3xl font-black tracking-tighter text-black">
                        Choose your City
                    </DialogTitle>
                    <p className="text-sm font-medium text-muted-foreground mt-2">
                        Explore tribes and pulses in a different neighborhood
                    </p>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search for a city..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-2xl border border-[#f0f0f0] bg-white py-4 pl-12 pr-4 text-[15px] font-bold outline-none transition-all focus:ring-4 focus:ring-primary/5 placeholder:text-[#ccc]"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
                        {filteredCities.map((city) => {
                            const isSelected = city.id === currentCity?.id;
                            return (
                                <button
                                    key={city.id}
                                    onClick={() => handleCitySelect(city)}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-3xl transition-all active:scale-[0.98] text-left group",
                                        isSelected
                                            ? "bg-black text-white shadow-xl shadow-black/10"
                                            : "bg-white border border-[#f0f0f0] hover:bg-[#f9f9f9] hover:border-[#e0e0e0]"
                                    )}
                                >
                                    <div className="relative h-14 w-14 rounded-2xl overflow-hidden shrink-0 shadow-md">
                                        <Image
                                            src={city.imageUrl}
                                            alt={city.name}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className={cn(
                                            "absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity",
                                            isSelected ? "opacity-0" : "opacity-0 group-hover:opacity-100"
                                        )}>
                                            <Globe className="h-6 w-6 text-white animate-pulse" />
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[17px] font-black tracking-tight">{city.name}</p>
                                            {isSelected && <Check className="h-5 w-5" />}
                                        </div>
                                        <p className={cn(
                                            "text-[11px] font-bold uppercase tracking-widest mt-1",
                                            isSelected ? "text-white/60" : "text-muted-foreground"
                                        )}>
                                            {city.country}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}

                        {filteredCities.length === 0 && (
                            <div className="py-20 text-center space-y-4">
                                <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                                    <MapPin className="h-10 w-10 text-muted-foreground/30" />
                                </div>
                                <p className="text-xl font-bold tracking-tight">City not found</p>
                                <p className="text-sm font-medium text-muted-foreground">We&apos;re expanding to new tribes soon!</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
