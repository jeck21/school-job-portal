"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  SCHOOL_TYPES,
  GRADE_BANDS,
  SUBJECT_AREAS,
  CERTIFICATION_TYPES,
} from "@/lib/filter-options";

type FilterValues = {
  q: string;
  type: string[];
  grade: string[];
  subject: string[];
  cert: string[];
  salary: boolean;
  zip: string;
  radius: number;
  unspecified: boolean;
};

interface ActiveFiltersProps {
  filters: FilterValues;
  onRemoveQ: () => void;
  onRemoveType: (value: string) => void;
  onRemoveGrade: (value: string) => void;
  onRemoveSubject: (value: string) => void;
  onRemoveCert: (value: string) => void;
  onRemoveSalary: () => void;
  onRemoveZip: () => void;
}

function findLabel(
  options: readonly { value: string; label: string }[],
  value: string
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function ActiveFilters({
  filters,
  onRemoveQ,
  onRemoveType,
  onRemoveGrade,
  onRemoveSubject,
  onRemoveCert,
  onRemoveSalary,
  onRemoveZip,
}: ActiveFiltersProps) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.q) {
    chips.push({
      key: "q",
      label: `"${filters.q}"`,
      onRemove: onRemoveQ,
    });
  }

  for (const v of filters.type) {
    chips.push({
      key: `type-${v}`,
      label: findLabel(SCHOOL_TYPES, v),
      onRemove: () => onRemoveType(v),
    });
  }

  for (const v of filters.grade) {
    chips.push({
      key: `grade-${v}`,
      label: findLabel(GRADE_BANDS, v),
      onRemove: () => onRemoveGrade(v),
    });
  }

  for (const v of filters.subject) {
    chips.push({
      key: `subject-${v}`,
      label: findLabel(SUBJECT_AREAS, v),
      onRemove: () => onRemoveSubject(v),
    });
  }

  for (const v of filters.cert) {
    chips.push({
      key: `cert-${v}`,
      label: findLabel(CERTIFICATION_TYPES, v),
      onRemove: () => onRemoveCert(v),
    });
  }

  if (filters.salary) {
    chips.push({
      key: "salary",
      label: "Salary Info",
      onRemove: onRemoveSalary,
    });
  }

  if (filters.zip && filters.zip.length === 5) {
    chips.push({
      key: "zip",
      label: `${filters.zip}, ${filters.radius} mi`,
      onRemove: onRemoveZip,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="secondary"
          className="gap-1 pr-1 text-xs"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="rounded-full p-0.5 hover:bg-muted-foreground/20"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
