"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FilterDropdown } from "@/components/jobs/filter-dropdown";
import { RadiusFilter } from "@/components/jobs/radius-filter";
import { useJobFilters } from "@/lib/hooks/use-job-filters";
import {
  SCHOOL_TYPES,
  GRADE_BANDS,
  SUBJECT_AREAS,
  CERTIFICATION_TYPES,
} from "@/lib/filter-options";

interface MobileFilterDrawerProps {
  count: number;
}

export function MobileFilterDrawer({ count }: MobileFilterDrawerProps) {
  const [filters, setFilters] = useJobFilters();

  const hasActiveFilters =
    filters.type.length > 0 ||
    filters.grade.length > 0 ||
    filters.subject.length > 0 ||
    filters.cert.length > 0 ||
    filters.salary !== false ||
    (filters.zip !== "" && filters.zip.length === 5) ||
    filters.unspecified !== false ||
    filters.verified !== false;

  const activeCount = [
    filters.type.length > 0,
    filters.grade.length > 0,
    filters.subject.length > 0,
    filters.cert.length > 0,
    filters.salary,
    filters.zip.length === 5,
    filters.unspecified,
    filters.verified,
  ].filter(Boolean).length;

  function clearAll() {
    setFilters({
      type: null,
      grade: null,
      subject: null,
      cert: null,
      salary: null,
      zip: null,
      radius: null,
      unspecified: null,
      verified: null,
    });
  }

  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger
        className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
      >
        <SlidersHorizontal className="size-4" />
        Filters
        {activeCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-cta text-[10px] font-bold text-cta-foreground">
            {activeCount}
          </span>
        )}
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-background ring-1 ring-foreground/10 data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <DialogPrimitive.Title className="text-base font-semibold">
              Filters
            </DialogPrimitive.Title>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </button>
              )}
              <DialogPrimitive.Close className="rounded-md p-1.5 text-muted-foreground hover:text-foreground">
                <X className="size-5" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Filter controls */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-5">
              {/* Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">School Type</Label>
                <FilterDropdown
                  label="Type"
                  options={SCHOOL_TYPES}
                  selected={filters.type}
                  onChange={(values) =>
                    setFilters({ type: values.length > 0 ? values : null })
                  }
                />
              </div>

              {/* Grade */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Grade Level</Label>
                <FilterDropdown
                  label="Grade"
                  options={GRADE_BANDS}
                  selected={filters.grade}
                  onChange={(values) =>
                    setFilters({ grade: values.length > 0 ? values : null })
                  }
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Location</Label>
                <RadiusFilter
                  zip={filters.zip}
                  radius={filters.radius}
                  onZipChange={(zip) => setFilters({ zip: zip || null })}
                  onRadiusChange={(radius) => setFilters({ radius })}
                />
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Subject Area</Label>
                <FilterDropdown
                  label="Subject"
                  options={SUBJECT_AREAS}
                  selected={filters.subject}
                  onChange={(values) =>
                    setFilters({ subject: values.length > 0 ? values : null })
                  }
                />
              </div>

              {/* Certification */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Certification</Label>
                <FilterDropdown
                  label="Certification"
                  options={CERTIFICATION_TYPES}
                  selected={filters.cert}
                  onChange={(values) =>
                    setFilters({ cert: values.length > 0 ? values : null })
                  }
                />
              </div>

              {/* Toggles */}
              <div className="space-y-4 rounded-lg border border-border/50 p-3">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="mobile-salary-toggle"
                    className="cursor-pointer text-sm"
                  >
                    Has Salary Info
                  </Label>
                  <Switch
                    id="mobile-salary-toggle"
                    checked={filters.salary}
                    onCheckedChange={(checked) =>
                      setFilters({ salary: checked || null })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="mobile-unspecified-toggle"
                    className="cursor-pointer text-sm"
                  >
                    Include Unspecified
                  </Label>
                  <Switch
                    id="mobile-unspecified-toggle"
                    checked={filters.unspecified}
                    onCheckedChange={(checked) =>
                      setFilters({ unspecified: checked ? null : false })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="mobile-verified-toggle"
                    className="cursor-pointer text-sm"
                  >
                    Verified Only
                  </Label>
                  <Switch
                    id="mobile-verified-toggle"
                    checked={filters.verified}
                    onCheckedChange={(checked) =>
                      setFilters({ verified: checked || null })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky footer with result count */}
          <div className="border-t border-border/50 px-4 py-3">
            <DialogPrimitive.Close
              render={
                <Button className="w-full bg-cta text-cta-foreground hover:bg-cta/90" />
              }
            >
              Show {count} Result{count !== 1 ? "s" : ""}
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
