"use client";

import { useEffect, useState } from "react";
import {
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Clock,
    Server,
    Settings,
    Activity,
} from "lucide-react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackupReport, VMFailoverReport, MonitorResponse } from "@/lib/types";

export default function DashboardPage() {
    const [data, setData] = useState<MonitorResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshInterval, setRefreshInterval] = useState(60);

    const fetchSettings = async () => {
        try {
            const response = await fetch("/api/settings");
            if (response.ok) {
                const settings = await response.json();
                if (settings.refresh_interval?.seconds) {
                    setRefreshInterval(settings.refresh_interval.seconds);
                }
            }
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        }
    };

    const fetchData = async () => {
        try {
            const response = await fetch("/api/monitor");
            if (!response.ok) {
                throw new Error("Failed to fetch data");
            }
            const result = await response.json();
            setData(result);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
        fetchData();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchData();
        }, refreshInterval * 1000);

        return () => clearInterval(interval);
    }, [refreshInterval]);

    // Calculate statistics
    const backupIssues =
        data?.backup.filter(
            (item) =>
                item.backup_status.toLowerCase().includes("stale") ||
                item.backup_status.toLowerCase().includes("failed")
        ).length || 0;

    const activeVMs =
        data?.vm.filter(
            (item) => item.failover_status.toLowerCase() === "active"
        ).length || 0;

    const formatDateTime = (isoString: string | null) => {
        if (!isoString) return "Never";
        return new Date(isoString).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const getBackupStatusBadge = (status: string) => {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes("success")) {
            return <Badge variant="success">Success</Badge>;
        } else if (lowerStatus.includes("stale")) {
            return <Badge variant="error">Stale</Badge>;
        } else if (lowerStatus.includes("failed")) {
            return <Badge variant="error">Failed</Badge>;
        }
        return <Badge variant="default">{status}</Badge>;
    };

    const getVMStatusBadge = (status: string) => {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus === "active") {
            return <Badge variant="success">Active</Badge>;
        } else if (lowerStatus.includes("not found") || !status) {
            return <Badge variant="warning">Not Found</Badge>;
        }
        return <Badge variant="default">{status}</Badge>;
    };

    // Check if ingestion is stale (no data in last 30 minutes)
    const isIngestionStale = (timestamp: string | null) => {
        if (!timestamp) return true;
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        return new Date(timestamp) < thirtyMinutesAgo;
    };

    const backupStale = isIngestionStale(data?.latestBackupIngestion || null);
    const vmStale = isIngestionStale(data?.latestVMIngestion || null);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-slate-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Service Desk Monitor
                        </h1>
                        <p className="text-slate-400 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Last updated:{" "}
                            {data?.lastUpdated ? formatDateTime(data.lastUpdated) : "Never"}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/ingestion">
                            <Badge
                                variant={backupStale || vmStale ? "warning" : "success"}
                                className="text-base px-4 py-2 cursor-pointer hover:opacity-80"
                            >
                                <Activity className="w-4 h-4 mr-2 inline" />
                                {backupStale || vmStale ? "Ingestion Stale" : "Ingestion OK"}
                            </Badge>
                        </Link>
                        <Link href="/settings">
                            <Badge
                                variant="default"
                                className="text-base px-4 py-2 cursor-pointer hover:opacity-80"
                            >
                                <Settings className="w-4 h-4 mr-2 inline" />
                                Settings
                            </Badge>
                        </Link>
                        <Badge variant="default" className="text-base px-4 py-2">
                            <RefreshCw className="w-4 h-4 mr-2 inline" />
                            Auto-refresh: {refreshInterval}s
                        </Badge>
                    </div>
                </div>

                {error && (
                    <Card className="border-red-500/50 bg-red-500/10">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-red-500">
                                <AlertCircle className="w-5 h-5" />
                                <p>{error}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Backup Health Summary */}
                    <Card
                        className={
                            backupIssues > 0
                                ? "border-red-500/50 bg-red-500/5"
                                : "border-green-500/50 bg-green-500/5"
                        }
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {backupIssues > 0 ? (
                                    <AlertCircle className="w-6 h-6 text-red-500" />
                                ) : (
                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                )}
                                Backup Health
                            </CardTitle>
                            <CardDescription>
                                Daily backup status monitoring
                                {backupStale && (
                                    <span className="text-yellow-500 ml-2">(Data stale)</span>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span
                                    className={`text-5xl font-bold ${backupIssues > 0 ? "text-red-500" : "text-green-500"
                                        }`}
                                >
                                    {backupIssues}
                                </span>
                                <span className="text-slate-400">
                                    {backupIssues === 1 ? "issue" : "issues"} detected
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 mt-2">
                                {data?.backup.length || 0} total servers monitored
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                                Last ingestion:{" "}
                                {formatDateTime(data?.latestBackupIngestion || null)}
                            </p>
                        </CardContent>
                    </Card>

                    {/* VM Failover Summary */}
                    <Card className="border-blue-500/50 bg-blue-500/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Server className="w-6 h-6 text-blue-500" />
                                VM Failover
                            </CardTitle>
                            <CardDescription>
                                Active failover VMs
                                {vmStale && (
                                    <span className="text-yellow-500 ml-2">(Data stale)</span>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-bold text-blue-500">
                                    {activeVMs}
                                </span>
                                <span className="text-slate-400">active VMs</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-2">
                                {data?.vm.length || 0} total hosts checked
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                                Last ingestion:{" "}
                                {formatDateTime(data?.latestVMIngestion || null)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Backup Data Grid */}
                <Card>
                    <CardHeader>
                        <CardTitle>Backup Status Details</CardTitle>
                        <CardDescription>
                            Real-time backup status for all monitored servers
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data?.backup && data.backup.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-800">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                                                Server
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                                                Status
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                                                File Age (Days)
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                                                Last Modified
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.backup.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                                            >
                                                <td className="py-3 px-4 text-sm font-medium text-white">
                                                    {item.computer_name}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {getBackupStatusBadge(item.backup_status)}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-400">
                                                    {item.file_age ?? "N/A"}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-400">
                                                    {item.modified_time || "N/A"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                                <p className="text-lg font-semibold text-slate-300">
                                    No Data Available
                                </p>
                                <p className="text-sm text-slate-500 mt-2">
                                    Waiting for backup data ingestion
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* VM Failover Data Grid */}
                <Card>
                    <CardHeader>
                        <CardTitle>VM Failover Status</CardTitle>
                        <CardDescription>Active failover virtual machines</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data?.vm && data.vm.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-800">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                                                Host
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                                                Status
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                                                VM Name
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.vm.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                                            >
                                                <td className="py-3 px-4 text-sm font-medium text-white">
                                                    {item.computer_name}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {getVMStatusBadge(item.failover_status)}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-400">
                                                    {item.vm_name || "N/A"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Server className="w-12 h-12 text-blue-500 mb-4" />
                                <p className="text-lg font-semibold text-slate-300">
                                    Waiting for Data
                                </p>
                                <p className="text-sm text-slate-500 mt-2">
                                    No VM failover information available
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
