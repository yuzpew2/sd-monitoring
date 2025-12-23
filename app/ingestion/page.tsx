"use client";

import { useEffect, useState } from "react";
import {
    ArrowLeft,
    RefreshCw,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Activity,
    Database,
    Server,
    Clock,
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
import { IngestionLog } from "@/lib/types";

interface IngestionStats {
    total: number;
    success: number;
    error: number;
    partial: number;
}

interface IngestionResponse {
    logs: IngestionLog[];
    stats: IngestionStats;
    latestSuccessful: {
        backup: string | null;
        vm_failover: string | null;
    };
}

export default function IngestionPage() {
    const [data, setData] = useState<IngestionResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>("all");

    const fetchData = async () => {
        try {
            const params = new URLSearchParams();
            if (filter !== "all") {
                if (filter === "backup" || filter === "vm_failover") {
                    params.set("source_type", filter);
                } else {
                    params.set("status", filter);
                }
            }
            params.set("limit", "100");

            const response = await fetch(`/api/ingestion/logs?${params}`);
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
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [filter]);

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

    const getTimeSince = (isoString: string | null) => {
        if (!isoString) return "N/A";
        const diff = Date.now() - new Date(isoString).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "success":
                return <Badge variant="success">Success</Badge>;
            case "error":
                return <Badge variant="error">Error</Badge>;
            case "partial":
                return <Badge variant="warning">Partial</Badge>;
            default:
                return <Badge variant="default">{status}</Badge>;
        }
    };

    const getSourceBadge = (sourceType: string) => {
        switch (sourceType) {
            case "backup":
                return (
                    <Badge variant="default" className="bg-purple-500/20 text-purple-400">
                        <Database className="w-3 h-3 mr-1 inline" />
                        Backup
                    </Badge>
                );
            case "vm_failover":
                return (
                    <Badge variant="default" className="bg-blue-500/20 text-blue-400">
                        <Server className="w-3 h-3 mr-1 inline" />
                        VM
                    </Badge>
                );
            default:
                return <Badge variant="default">{sourceType}</Badge>;
        }
    };

    // Check if ingestion is healthy (within last 30 minutes)
    const isHealthy = (timestamp: string | null) => {
        if (!timestamp) return false;
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        return new Date(timestamp) > thirtyMinutesAgo;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-slate-400">Loading ingestion logs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
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
                        <h1 className="text-4xl font-bold text-white">
                            Ingestion Monitoring
                        </h1>
                        <p className="text-slate-400">
                            Monitor data ingestion status and health
                        </p>
                    </div>
                    <div className="ml-auto">
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {error && (
                    <Card className="border-red-500/50 bg-red-500/10">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-red-500">
                                <XCircle className="w-5 h-5" />
                                <p>{error}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Health Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Backup Ingestion Health */}
                    <Card
                        className={
                            isHealthy(data?.latestSuccessful.backup || null)
                                ? "border-green-500/50 bg-green-500/5"
                                : "border-yellow-500/50 bg-yellow-500/5"
                        }
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Database className="w-5 h-5 text-purple-500" />
                                Backup Ingestion
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 mb-2">
                                {isHealthy(data?.latestSuccessful.backup || null) ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                )}
                                <span
                                    className={
                                        isHealthy(data?.latestSuccessful.backup || null)
                                            ? "text-green-500"
                                            : "text-yellow-500"
                                    }
                                >
                                    {isHealthy(data?.latestSuccessful.backup || null)
                                        ? "Healthy"
                                        : "Stale"}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Last success:{" "}
                                {getTimeSince(data?.latestSuccessful.backup || null)}
                            </p>
                        </CardContent>
                    </Card>

                    {/* VM Ingestion Health */}
                    <Card
                        className={
                            isHealthy(data?.latestSuccessful.vm_failover || null)
                                ? "border-green-500/50 bg-green-500/5"
                                : "border-yellow-500/50 bg-yellow-500/5"
                        }
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Server className="w-5 h-5 text-blue-500" />
                                VM Ingestion
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 mb-2">
                                {isHealthy(data?.latestSuccessful.vm_failover || null) ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                )}
                                <span
                                    className={
                                        isHealthy(data?.latestSuccessful.vm_failover || null)
                                            ? "text-green-500"
                                            : "text-yellow-500"
                                    }
                                >
                                    {isHealthy(data?.latestSuccessful.vm_failover || null)
                                        ? "Healthy"
                                        : "Stale"}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Last success:{" "}
                                {getTimeSince(data?.latestSuccessful.vm_failover || null)}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Success Rate */}
                    <Card className="border-slate-700">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="w-5 h-5 text-green-500" />
                                Success Rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-500">
                                {data?.stats.total
                                    ? Math.round((data.stats.success / data.stats.total) * 100)
                                    : 0}
                                %
                            </div>
                            <p className="text-xs text-slate-500">
                                {data?.stats.success || 0} of {data?.stats.total || 0}{" "}
                                successful
                            </p>
                        </CardContent>
                    </Card>

                    {/* Error Count */}
                    <Card
                        className={
                            (data?.stats.error || 0) > 0
                                ? "border-red-500/50 bg-red-500/5"
                                : "border-slate-700"
                        }
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-red-500" />
                                Errors
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-3xl font-bold ${(data?.stats.error || 0) > 0
                                        ? "text-red-500"
                                        : "text-slate-400"
                                    }`}
                            >
                                {data?.stats.error || 0}
                            </div>
                            <p className="text-xs text-slate-500">
                                Failed ingestion attempts
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    {["all", "backup", "vm_failover", "success", "error"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                }`}
                        >
                            {f === "all"
                                ? "All"
                                : f === "vm_failover"
                                    ? "VM Failover"
                                    : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Logs Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ingestion Logs</CardTitle>
                        <CardDescription>
                            Recent data ingestion activity ({data?.logs.length || 0} records)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data?.logs && data.logs.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-800">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                                                Timestamp
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                                                Source
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                                                Status
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                                                Records
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                                                Source IP
                                            </th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                                                Error
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.logs.map((log) => (
                                            <tr
                                                key={log.id}
                                                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                                            >
                                                <td className="py-3 px-4 text-sm text-slate-400">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        {formatDateTime(log.created_at)}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {getSourceBadge(log.source_type)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {getStatusBadge(log.status)}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-white font-medium">
                                                    {log.records_count}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-400">
                                                    {log.source_ip || "N/A"}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-red-400 max-w-xs truncate">
                                                    {log.error_message || "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Activity className="w-12 h-12 text-slate-500 mb-4" />
                                <p className="text-lg font-semibold text-slate-300">
                                    No Ingestion Logs
                                </p>
                                <p className="text-sm text-slate-500 mt-2">
                                    Waiting for data ingestion from source server
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
