import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MonitorResponse } from "@/lib/types";

export async function GET() {
    try {
        const supabase = createClient();

        // Get the latest ingestion IDs for each type
        const { data: latestBackupIngestion } = await supabase
            .from("ingestion_logs")
            .select("id, created_at")
            .eq("source_type", "backup")
            .eq("status", "success")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        const { data: latestVMIngestion } = await supabase
            .from("ingestion_logs")
            .select("id, created_at")
            .eq("source_type", "vm_failover")
            .eq("status", "success")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        // Fetch latest backup records (from the most recent successful ingestion)
        let backupData: any[] = [];
        if (latestBackupIngestion) {
            const { data } = await supabase
                .from("backup_reports")
                .select("*")
                .eq("ingestion_id", latestBackupIngestion.id)
                .order("computer_name", { ascending: true });

            backupData = data || [];
        }

        // Fetch latest VM records (from the most recent successful ingestion)
        let vmData: any[] = [];
        if (latestVMIngestion) {
            const { data } = await supabase
                .from("vm_failover_reports")
                .select("*")
                .eq("ingestion_id", latestVMIngestion.id)
                .order("computer_name", { ascending: true });

            vmData = data || [];
        }

        const response: MonitorResponse = {
            backup: backupData.map((item) => ({
                id: item.id,
                computer_name: item.computer_name,
                backup_status: item.backup_status,
                file_age: item.file_age,
                modified_time: item.modified_time,
                ingestion_id: item.ingestion_id,
                created_at: item.created_at,
            })),
            vm: vmData.map((item) => ({
                id: item.id,
                computer_name: item.computer_name,
                failover_status: item.failover_status,
                vm_name: item.vm_name,
                ingestion_id: item.ingestion_id,
                created_at: item.created_at,
            })),
            lastUpdated: new Date().toISOString(),
            latestBackupIngestion: latestBackupIngestion?.created_at || null,
            latestVMIngestion: latestVMIngestion?.created_at || null,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching monitor data:", error);
        return NextResponse.json(
            {
                backup: [],
                vm: [],
                lastUpdated: new Date().toISOString(),
                latestBackupIngestion: null,
                latestVMIngestion: null,
                error: "Failed to fetch data",
            },
            { status: 500 }
        );
    }
}
