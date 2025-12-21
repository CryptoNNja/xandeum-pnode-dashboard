"use client"

import React, { memo } from "react";
import { DataDistributionChart } from "@/components/Dashboard/DataDistributionChart";

type ChartsSectionProps = {
    pagesDistribution: any[];
    isLight: boolean;
};

const ChartsSectionComponent = ({
    pagesDistribution,
    isLight
}: ChartsSectionProps) => {
    return (
        <div className="space-y-6">
        {/* Distribution chart */}
        <div className="grid grid-cols-1 gap-6">

        {/* DATA DISTRIBUTION */}
        <DataDistributionChart pagesDistribution={pagesDistribution} isLight={isLight} />
      </div>

    </div>
    )
}

export const ChartsSection = memo(ChartsSectionComponent);
ChartsSection.displayName = "ChartsSection";
