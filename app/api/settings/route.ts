import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

// GET - Fetch current settings
export async function GET() {
    try {
        const supabase = createClient();

        const { data: settings, error } = await supabase
            .from("app_settings")
            .select("*");

        if (error) {
            console.error("Error fetching settings:", error);
            return NextResponse.json(
                { error: "Failed to fetch settings" },
                { status: 500 }
            );
        }

        // Convert array to object for easier access
        const settingsObj: Record<string, unknown> = {};
        settings?.forEach((setting) => {
            settingsObj[setting.key] = setting.value;
        });

        return NextResponse.json(settingsObj);
    } catch (error) {
        console.error("Settings error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT - Update settings (requires service role)
export async function PUT(request: NextRequest) {
    try {
        // Verify service role key in Authorization header
        const headersList = await headers();
        const authHeader = headersList.get("authorization");
        const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const supabase = createServiceClient();

        // Update each setting
        const updates = Object.entries(body).map(async ([key, value]) => {
            const { error } = await supabase
                .from("app_settings")
                .upsert({
                    key,
                    value: value as Record<string, unknown>,
                    updated_at: new Date().toISOString(),
                });

            if (error) {
                console.error(`Error updating setting ${key}:`, error);
                throw error;
            }
        });

        await Promise.all(updates);

        return NextResponse.json({ success: true, message: "Settings updated" });
    } catch (error) {
        console.error("Settings update error:", error);
        return NextResponse.json(
            { error: "Failed to update settings" },
            { status: 500 }
        );
    }
}
