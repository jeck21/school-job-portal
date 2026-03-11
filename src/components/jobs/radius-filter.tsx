"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RADIUS_OPTIONS } from "@/lib/filter-options";
import { cn } from "@/lib/utils";

interface RadiusFilterProps {
  zip: string;
  radius: number;
  onZipChange: (zip: string) => void;
  onRadiusChange: (radius: number) => void;
}

export function RadiusFilter({
  zip,
  radius,
  onZipChange,
  onRadiusChange,
}: RadiusFilterProps) {
  const [open, setOpen] = useState(false);
  const [zipInput, setZipInput] = useState(zip);

  const isActive = zip.length === 5;
  const buttonLabel = isActive
    ? `${zip}, ${radius} mi`
    : "Location";

  function handleZipChange(value: string) {
    // Only allow digits, max 5
    const digits = value.replace(/\D/g, "").slice(0, 5);
    setZipInput(digits);
    if (digits.length === 5) {
      onZipChange(digits);
    } else if (digits.length === 0) {
      onZipChange("");
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md border border-input bg-background px-3 text-xs font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground h-8",
          isActive && "border-primary/50 text-primary"
        )}
      >
        <MapPin className="size-3" />
        {buttonLabel}
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zip-input" className="text-xs font-medium">
              PA Zip Code
            </Label>
            <Input
              id="zip-input"
              placeholder="e.g. 19103"
              value={zipInput}
              onChange={(e) => handleZipChange(e.target.value)}
              className="h-8 text-sm"
              inputMode="numeric"
              maxLength={5}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Radius</Label>
              <span className="text-xs text-muted-foreground">
                {radius} mi
              </span>
            </div>
            <Slider
              min={RADIUS_OPTIONS.min}
              max={RADIUS_OPTIONS.max}
              step={RADIUS_OPTIONS.step}
              value={[radius]}
              onValueChange={(value) => {
                const v = Array.isArray(value) ? value[0] : value;
                onRadiusChange(v);
              }}
              className="py-1"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{RADIUS_OPTIONS.min} mi</span>
              <span>{RADIUS_OPTIONS.max} mi</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
