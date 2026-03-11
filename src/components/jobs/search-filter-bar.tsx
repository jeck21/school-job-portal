"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FilterDropdown } from "@/components/jobs/filter-dropdown";
import { RadiusFilter } from "@/components/jobs/radius-filter";
import { ActiveFilters } from "@/components/jobs/active-filters";
import { useJobFilters } from "@/lib/hooks/use-job-filters";
import {
  SCHOOL_TYPES,
  GRADE_BANDS,
  SUBJECT_AREAS,
  CERTIFICATION_TYPES,
} from "@/lib/filter-options";

export function SearchFilterBar() {
  const [filters, setFilters] = useJobFilters();
  const searchRef = useRef<HTMLInputElement>(null);

  const debouncedSetQ = useDebouncedCallback((value: string) => {
    setFilters({ q: value || null });
  }, 300);

  const hasActiveFilters =
    filters.q !== "" ||
    filters.type.length > 0 ||
    filters.grade.length > 0 ||
    filters.subject.length > 0 ||
    filters.cert.length > 0 ||
    filters.salary !== false ||
    (filters.zip !== "" && filters.zip.length === 5) ||
    filters.unspecified !== true;

  function clearAll() {
    setFilters({
      q: null,
      type: null,
      grade: null,
      subject: null,
      cert: null,
      salary: null,
      zip: null,
      radius: null,
      unspecified: null,
    });
    if (searchRef.current) {
      searchRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchRef}
          type="text"
          placeholder="Search by title, school, or location..."
          defaultValue={filters.q}
          onChange={(e) => debouncedSetQ(e.target.value)}
          className="h-10 pl-9 pr-9"
        />
        {filters.q && (
          <button
            type="button"
            onClick={() => {
              setFilters({ q: null });
              if (searchRef.current) searchRef.current.value = "";
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Type"
          options={SCHOOL_TYPES}
          selected={filters.type}
          onChange={(values) => setFilters({ type: values.length > 0 ? values : null })}
        />

        <FilterDropdown
          label="Grade"
          options={GRADE_BANDS}
          selected={filters.grade}
          onChange={(values) => setFilters({ grade: values.length > 0 ? values : null })}
        />

        <RadiusFilter
          zip={filters.zip}
          radius={filters.radius}
          onZipChange={(zip) => setFilters({ zip: zip || null })}
          onRadiusChange={(radius) => setFilters({ radius })}
        />

        <FilterDropdown
          label="Subject"
          options={SUBJECT_AREAS}
          selected={filters.subject}
          onChange={(values) => setFilters({ subject: values.length > 0 ? values : null })}
        />

        <FilterDropdown
          label="Certification"
          options={CERTIFICATION_TYPES}
          selected={filters.cert}
          onChange={(values) => setFilters({ cert: values.length > 0 ? values : null })}
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Salary toggle */}
        <div className="flex items-center gap-1.5">
          <Switch
            id="salary-toggle"
            checked={filters.salary}
            onCheckedChange={(checked) =>
              setFilters({ salary: checked || null })
            }
            className="scale-75"
          />
          <Label
            htmlFor="salary-toggle"
            className="cursor-pointer text-xs text-muted-foreground"
          >
            Salary Info
          </Label>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Include unspecified toggle */}
        <div className="flex items-center gap-1.5">
          <Switch
            id="unspecified-toggle"
            checked={filters.unspecified}
            onCheckedChange={(checked) =>
              setFilters({ unspecified: checked ? null : false })
            }
            className="scale-75"
          />
          <Label
            htmlFor="unspecified-toggle"
            className="cursor-pointer text-xs text-muted-foreground"
          >
            Include Unspecified
          </Label>
        </div>

        {/* Clear all */}
        {hasActiveFilters && (
          <>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          </>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <ActiveFilters
          filters={filters}
          onRemoveQ={() => {
            setFilters({ q: null });
            if (searchRef.current) searchRef.current.value = "";
          }}
          onRemoveType={(v) =>
            setFilters({
              type: filters.type.filter((t) => t !== v).length > 0
                ? filters.type.filter((t) => t !== v)
                : null,
            })
          }
          onRemoveGrade={(v) =>
            setFilters({
              grade: filters.grade.filter((g) => g !== v).length > 0
                ? filters.grade.filter((g) => g !== v)
                : null,
            })
          }
          onRemoveSubject={(v) =>
            setFilters({
              subject: filters.subject.filter((s) => s !== v).length > 0
                ? filters.subject.filter((s) => s !== v)
                : null,
            })
          }
          onRemoveCert={(v) =>
            setFilters({
              cert: filters.cert.filter((c) => c !== v).length > 0
                ? filters.cert.filter((c) => c !== v)
                : null,
            })
          }
          onRemoveSalary={() => setFilters({ salary: null })}
          onRemoveZip={() => setFilters({ zip: null, radius: null })}
        />
      )}
    </div>
  );
}
