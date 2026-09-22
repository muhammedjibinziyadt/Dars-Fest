"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, QrCode, Loader2, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QRScanner } from "./qr-scanner";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
    id: string;
    name: string;
    chest_no: string;
    team_id: string;
}

export function ParticipantSearch() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/participants/search?q=${encodeURIComponent(searchQuery)}`);
            if (response.ok) {
                const data = await response.json();
                setResults(data);
            } else {
                setResults([]);
            }
        } catch (error) {
            console.error("Search error:", error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleInputChange = (value: string) => {
        setQuery(value);
        if (value.trim().length >= 2) {
            handleSearch(value);
        } else {
            setResults([]);
        }
    };

    const handleSelectParticipant = (chestNumber: string) => {
        startTransition(() => {
            router.push(`/participant/${chestNumber}`);
        });
    };

    const handleQRScan = (chestNumber: string) => {
        setShowScanner(false);
        startTransition(() => {
            router.push(`/participant/${chestNumber}`);
        });
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-2 flex items-center gap-2 border border-gray-100 dark:border-gray-700">
                    <div className="flex-1 flex items-center gap-3 px-3">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or chest number..."
                            value={query}
                            onChange={(e) => handleInputChange(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder:text-gray-400 h-10"
                        />
                        {isSearching && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
                    </div>
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
                    <Button
                        onClick={() => setShowScanner(true)}
                        className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-xl px-4 py-2 h-auto shadow-none"
                    >
                        <QrCode className="w-4 h-4 mr-2" />
                        Scan
                    </Button>
                </div>
            </div>

            <AnimatePresence>
                {results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                    >
                        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Found {results.length} participants
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
                            {results.map((result) => (
                                <div
                                    key={result.id}
                                    onClick={() => handleSelectParticipant(result.chest_no)}
                                    className="p-4 hover:bg-purple-50 dark:hover:bg-purple-900/10 cursor-pointer transition-colors flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 group-hover:text-purple-600 transition-colors">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                                                {result.name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge className="text-[10px] px-1.5 py-0 h-5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                    {result.chest_no}
                                                </Badge>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Team ID: {result.team_id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {query.trim().length >= 2 && !isSearching && results.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 text-center"
                >
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-gray-900 dark:text-white font-medium">No participants found</h3>
                    <p className="text-sm text-gray-500 mt-1">Try searching for a different name or chest number</p>
                </motion.div>
            )}

            {showScanner && (
                <QRScanner
                    onScan={handleQRScan}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}
