import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { VMIngestRequest, IngestResponse } from "@/lib/types";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        // Verify service role key in Authorization header
        const headersList = await headers();
        const authHeader = headersList.get("authorization");
        const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse request body
        const body: VMIngestRequest = await request.json();

        if (!body.data || !Array.isArray(body.data) || body.data.length === 0) {
            return NextResponse.json(
                { success: false, message: "Invalid data format. Expected { data: [...] }" },
                { status: 400 }
            );
        }

        const supabase = createServiceClient();

        // Get source IP
        const forwardedFor = headersList.get("x-forwarded-for");
        const sourceIp = forwardedFor?.split(",")[0] || "unknown";

        // Create ingestion log entry
        const { data: ingestionLog, error: logError } = await supabase
            .from("ingestion_logs")
            .insert({
                source_type: "vm_failover",
                status: "success",
                records_count: body.data.length,
                source_ip: sourceIp,
            })
            .select()
            .single();

        if (logError) {
            console.error("Error creating ingestion log:", logError);
            return NextResponse.json(
                { success: false, message: "Failed to create ingestion log" },
                { status: 500 }
            );
        }

        // Transform and insert VM records
        const records = body.data.map((item) => ({
            computer_name: item.computerName,
            failover_status: item.failoverStatus,
            vm_name: item.vmName || null,
            ingestion_id: ingestionLog.id,
        }));

        const { error: insertError } = await supabase
            .from("vm_failover_reports")
            .insert(records);

        if (insertError) {
            // Update ingestion log with error
            await supabase
                .from("ingestion_logs")
                .update({
                    status: "error",
                    error_message: insertError.message,
                })
                .eq("id", ingestionLog.id);

            console.error("Error inserting VM records:", insertError);
            return NextResponse.json(
                { success: false, message: "Failed to insert records", error: insertError.message },
                { status: 500 }
            );
        }

        const response: IngestResponse = {
            success: true,
            ingestionId: ingestionLog.id,
            recordsCount: body.data.length,
            message: `Successfully ingested ${body.data.length} VM failover records`,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Ingestion error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
