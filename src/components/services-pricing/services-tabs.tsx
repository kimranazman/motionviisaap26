'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ServicesTabsProps {
  allServicesContent: React.ReactNode
  byServiceContent: React.ReactNode
  byClientContent: React.ReactNode
}

export function ServicesTabs({
  allServicesContent,
  byServiceContent,
  byClientContent,
}: ServicesTabsProps) {
  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList>
        <TabsTrigger value="all">All Services</TabsTrigger>
        <TabsTrigger value="by-service">By Service</TabsTrigger>
        <TabsTrigger value="by-client">By Client</TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="mt-4">
        {allServicesContent}
      </TabsContent>
      <TabsContent value="by-service" className="mt-4">
        {byServiceContent}
      </TabsContent>
      <TabsContent value="by-client" className="mt-4">
        {byClientContent}
      </TabsContent>
    </Tabs>
  )
}
