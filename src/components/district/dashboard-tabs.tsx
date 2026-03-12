"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListingCard } from "./listing-card";
import { ClaimReview } from "./claim-review";
import { CreateListingForm } from "./create-listing-form";
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
  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList>
        <TabsTrigger value="active">
          Active Listings ({activeJobs.length})
        </TabsTrigger>
        <TabsTrigger value="delisted">
          Delisted ({delistedJobs.length})
        </TabsTrigger>
        <TabsTrigger value="create">Create New</TabsTrigger>
      </TabsList>

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
