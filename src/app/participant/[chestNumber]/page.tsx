import { notFound } from "next/navigation";
import { getParticipantProfile } from "@/lib/participant-service";
import { ParticipantProfileDisplay } from "@/components/participant-profile";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import type { Metadata } from "next";

interface ParticipantPageProps {
    params: Promise<{ chestNumber: string }>;
}

export async function generateMetadata({ params }: ParticipantPageProps): Promise<Metadata> {
    const { chestNumber } = await params;
    const profile = await getParticipantProfile(chestNumber);
    if (!profile) {
        return {
            title: "Participant Not Found - Maerika 2k26",
        };
    }

    const title = `${profile.student.name} (Chest #${profile.student.chest_no}) - Maerika 2k26`;
    const description = `View participant profile, event registrations, and live results for ${profile.student.name} at Maerika 2k26 Arts Fest.`;
    const url = `https://maerika-2k26.jawharathululoomsuffadars.online/participant/${chestNumber}`;

    return {
        title,
        description,
        alternates: {
            canonical: url,
        },
        openGraph: {
            title,
            description,
            url,
            siteName: "Maerika 2k26",
            locale: "ml_IN",
            type: "profile",
        },
    };
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
