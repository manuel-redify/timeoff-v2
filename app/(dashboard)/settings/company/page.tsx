import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompanySettingsForm } from "./company-form"
import { CompanyScheduleForm } from "./company-schedule-form"

export default function SettingsCompanyPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Company Profile</h3>
                <p className="text-sm text-muted-foreground">
                    Update your company details and core configuration.
                </p>
            </div>
            <Separator />

            <Tabs defaultValue="details" className="w-full">
                <TabsList>
                    <TabsTrigger value="details">General Details</TabsTrigger>
                    <TabsTrigger value="schedule">Default Schedule</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="pt-4">
                    <CompanySettingsForm />
                </TabsContent>
                <TabsContent value="schedule" className="pt-4">
                    <CompanyScheduleForm />
                </TabsContent>
            </Tabs>
        </div>
    )
}
