"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListingCard } from "./listing-card";
import { ClaimReview } from "./claim-review";
import { CreateListingForm } from "./create-listing-form";
import { Plus } from "lucide-react";
import type { DistrictJob } from "@/lib/queries/get-district-jobs";
import type { ClaimMatch } from "@/lib/queries/get-claim-matches";

type Props = {
  activeJobs: DistrictJob[];
  delistedJobs: DistrictJob[];
  claimMatches: ClaimMatch[];
  districtId: string;
};

export function DashboardTabs({
  activeJobs,
  delistedJobs,
  claimMatches,
  districtId,
}: Props) {
  const [tab, setTab] = useState("active");

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <div className="flex items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="active">
            Active Listings ({activeJobs.length})
          </TabsTrigger>
          <TabsTrigger value="delisted">
            Delisted ({delistedJobs.length})
          </TabsTrigger>
        </TabsList>

        <button
          type="button"
          onClick={() => setTab("create")}
          className="inline-flex items-center gap-1.5 rounded-md bg-cta px-3 py-1.5 text-sm font-medium text-cta-foreground shadow-sm transition-colors hover:bg-cta/90"
        >
          <Plus className="size-4" />
          Create New
        </button>
      </div>

      <TabsContent value="active" className="mt-4 space-y-4">
        <ClaimReview matches={claimMatches} districtId={districtId} />

        {activeJobs.length === 0 && claimMatches.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No active listings yet. Claim matching jobs above or create a new
            listing.
          </p>
        ) : (
          <div className="space-y-2">
            {activeJobs.map((job) => (
              <ListingCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="delisted" className="mt-4">
        {delistedJobs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No delisted listings.
          </p>
        ) : (
          <div className="space-y-2">
            {delistedJobs.map((job) => (
              <ListingCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="create" className="mt-4">
        <CreateListingForm />
      </TabsContent>
    </Tabs>
  );
}
