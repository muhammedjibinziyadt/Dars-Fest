import { notFound } from "next/navigation";
import { getParticipantProfile } from "@/lib/participant-service";
import { ParticipantProfileDisplay } from "@/components/participant-profile";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ParticipantPageProps {
    params: Promise<{ chestNumber: string }>;
}

export default async function ParticipantPage({ params }: ParticipantPageProps) {
    const { chestNumber } = await params;
    const profile = await getParticipantProfile(chestNumber);

    if (!profile) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#fffcf5] dark:bg-gray-950 pb-20 pt-6">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="flex items-center justify-between mb-6">
                    <Link href="/participant">
                        <Button variant="ghost" className="gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white pl-0 hover:bg-transparent">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="font-medium text-lg">Back</span>
                        </Button>
                    </Link>
                </div>

                <ParticipantProfileDisplay profile={profile} />
            </div>
        </div>
    );
}
