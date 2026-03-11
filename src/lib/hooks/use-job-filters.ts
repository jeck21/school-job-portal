"use client";

import {
  useQueryStates,
  parseAsArrayOf,
  parseAsString,
  parseAsBoolean,
  parseAsInteger,
} from "nuqs";

const filterParsers = {
  q: parseAsString.withDefault(""),
  type: parseAsArrayOf(parseAsString, ",").withDefault([]),
  grade: parseAsArrayOf(parseAsString, ",").withDefault([]),
  subject: parseAsArrayOf(parseAsString, ",").withDefault([]),
  cert: parseAsArrayOf(parseAsString, ",").withDefault([]),
  salary: parseAsBoolean.withDefault(false),
  zip: parseAsString.withDefault(""),
  radius: parseAsInteger.withDefault(25),
  unspecified: parseAsBoolean.withDefault(false),
};

export function useJobFilters() {
  return useQueryStates(filterParsers, { shallow: true });
}

export function getDefaultFilters() {
  return {
    q: "",
    type: [] as string[],
    grade: [] as string[],
    subject: [] as string[],
    cert: [] as string[],
    salary: false,
    zip: "",
    radius: 25,
    unspecified: false,
  };
}

export { filterParsers };
