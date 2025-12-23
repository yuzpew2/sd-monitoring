import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);

        // Optional filters
        const sourceType = searchParams.get("source_type");
        const status = searchParams.get("status");
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        let query = supabase
            .from("ingestion_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (sourceType) {
            query = query.eq("source_type", sourceType);
        }

        if (status) {
            query = query.eq("status", status);
        }

        const { data: logs, error } = await query;

        if (error) {
            console.error("Error fetching ingestion logs:", error);
            return NextResponse.json(
                { error: "Failed to fetch logs" },
                { status: 500 }
            );
        }

        // Calculate statistics
        const stats = {
            total: logs?.length || 0,
            success: logs?.filter((l) => l.status === "success").length || 0,
            error: logs?.filter((l) => l.status === "error").length || 0,
            partial: logs?.filter((l) => l.status === "partial").length || 0,
        };

        // Get latest successful ingestion for each type
        const latestBackup = logs?.find(
            (l) => l.source_type === "backup" && l.status === "success"
        );
        const latestVM = logs?.find(
            (l) => l.source_type === "vm_failover" && l.status === "success"
        );

        return NextResponse.json({
            logs: logs || [],
            stats,
            latestSuccessful: {
                backup: latestBackup?.created_at || null,
                vm_failover: latestVM?.created_at || null,
            },
        });
    } catch (error) {
        console.error("Ingestion logs error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
