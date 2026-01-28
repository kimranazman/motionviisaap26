'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PricingTabsProps {
  allItemsContent: React.ReactNode
  byItemContent: React.ReactNode
  byClientContent: React.ReactNode
}

export function PricingTabs({
  allItemsContent,
  byItemContent,
  byClientContent,
}: PricingTabsProps) {
  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList>
        <TabsTrigger value="all">All Items</TabsTrigger>
        <TabsTrigger value="by-item">By Item</TabsTrigger>
        <TabsTrigger value="by-client">By Client</TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="mt-4">
        {allItemsContent}
      </TabsContent>
      <TabsContent value="by-item" className="mt-4">
        {byItemContent}
      </TabsContent>
      <TabsContent value="by-client" className="mt-4">
        {byClientContent}
      </TabsContent>
    </Tabs>
  )
}
