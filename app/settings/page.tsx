"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Save, RefreshCw, Key, Clock, Trash2 } from "lucide-react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
    const [refreshInterval, setRefreshInterval] = useState(60);
    const [dataRetentionDays, setDataRetentionDays] = useState(90);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    // API endpoint info for display
    const apiEndpoints = {
        backup: "/api/ingest/backup",
        vm: "/api/ingest/vm",
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch("/api/settings");
            if (response.ok) {
                const settings = await response.json();
                if (settings.refresh_interval?.seconds) {
                    setRefreshInterval(settings.refresh_interval.seconds);
                }
                if (settings.data_retention_days?.days) {
                    setDataRetentionDays(settings.data_retention_days.days);
                }
            }
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            // Note: In production, you'd use a proper auth mechanism
            // For now, we'll show a message that settings need service key

            const response = await fetch("/api/settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${(window as any).SUPABASE_SERVICE_ROLE_KEY || ""
                        }`,
                },
                body: JSON.stringify({
                    refresh_interval: { seconds: refreshInterval },
                    data_retention_days: { days: dataRetentionDays },
                }),
            });

            if (response.ok) {
                setMessage({ type: "success", text: "Settings saved successfully!" });
            } else if (response.status === 401) {
                setMessage({
                    type: "error",
                    text: "Unauthorized. Settings can only be changed with service role key.",
                });
            } else {
                setMessage({ type: "error", text: "Failed to save settings" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Error saving settings" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-slate-400">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Badge
                            variant="default"
                            className="text-base px-4 py-2 cursor-pointer hover:opacity-80"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2 inline" />
                            Back
                        </Badge>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-bold text-white">Settings</h1>
                        <p className="text-slate-400">
                            Configure dashboard behavior and data retention
                        </p>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <Card
                        className={
                            message.type === "success"
                                ? "border-green-500/50 bg-green-500/10"
                                : "border-red-500/50 bg-red-500/10"
                        }
                    >
                        <CardContent className="pt-6">
                            <p
                                className={
                                    message.type === "success" ? "text-green-500" : "text-red-500"
                                }
                            >
                                {message.text}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Dashboard Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            Dashboard Settings
                        </CardTitle>
                        <CardDescription>
                            Configure auto-refresh and display preferences
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Refresh Interval */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Auto-Refresh Interval (seconds)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="30"
                                    max="300"
                                    step="30"
                                    value={refreshInterval}
                                    onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-lg font-semibold text-white w-16 text-center">
                                    {refreshInterval}s
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                How often the dashboard fetches new data (30s - 5 minutes)
                            </p>
                        </div>

                        {/* Data Retention */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Data Retention Period (days)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min="7"
                                    max="365"
                                    value={dataRetentionDays}
                                    onChange={(e) =>
                                        setDataRetentionDays(parseInt(e.target.value) || 90)
                                    }
                                    className="w-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-slate-400">days</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                How long to keep historical ingestion data (7 - 365 days)
                            </p>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={saveSettings}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-lg text-white font-medium transition-colors"
                        >
                            {saving ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {saving ? "Saving..." : "Save Settings"}
                        </button>
                    </CardContent>
                </Card>

                {/* API Endpoints Reference */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="w-5 h-5 text-green-500" />
                            API Endpoints
                        </CardTitle>
                        <CardDescription>
                            Endpoints for ingesting data from source server
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-400">
                            Use these endpoints with your Supabase service role key in the
                            Authorization header:
                        </p>

                        <div className="space-y-3">
                            <div className="p-3 bg-slate-800/50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant="success">POST</Badge>
                                    <span className="text-sm text-slate-400">Backup Data</span>
                                </div>
                                <code className="text-sm text-green-400 block">
                                    {typeof window !== "undefined" ? window.location.origin : ""}
                                    {apiEndpoints.backup}
                                </code>
                            </div>

                            <div className="p-3 bg-slate-800/50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant="success">POST</Badge>
                                    <span className="text-sm text-slate-400">VM Failover</span>
                                </div>
                                <code className="text-sm text-green-400 block">
                                    {typeof window !== "undefined" ? window.location.origin : ""}
                                    {apiEndpoints.vm}
                                </code>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                            <p className="text-sm text-slate-300 font-medium mb-2">
                                Request Headers:
                            </p>
                            <code className="text-xs text-slate-400 block">
                                Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
                                <br />
                                Content-Type: application/json
                            </code>
                        </div>

                        <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                            <p className="text-sm text-slate-300 font-medium mb-2">
                                Request Body Example (Backup):
                            </p>
                            <pre className="text-xs text-slate-400 overflow-x-auto">
                                {JSON.stringify(
                                    {
                                        data: [
                                            {
                                                computerName: "SRV-DC01",
                                                backupStatus: "Success",
                                                fileAge: 1,
                                                modifiedTime: "2025-12-22T23:45:00",
                                            },
                                        ],
                                    },
                                    null,
                                    2
                                )}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
