// Database types for SD-Monitoring

export interface BackupReport {
    id: string;
    computer_name: string;
    backup_status: string;
    file_age: number | null;
    modified_time: string | null;
    ingestion_id: string | null;
    created_at: string;
}

export interface VMFailoverReport {
    id: string;
    computer_name: string;
    failover_status: string;
    vm_name: string | null;
    ingestion_id: string | null;
    created_at: string;
}

export interface IngestionLog {
    id: string;
    source_type: "backup" | "vm_failover";
    status: "success" | "error" | "partial";
    records_count: number;
    error_message: string | null;
    source_ip: string | null;
    created_at: string;
}

export interface AppSetting {
    key: string;
    value: Record<string, unknown>;
    updated_at: string;
}

// API Request/Response types
export interface BackupIngestRequest {
    data: Array<{
        computerName: string;
        backupStatus: string;
        fileAge?: number | string;
        modifiedTime?: string;
    }>;
}

export interface VMIngestRequest {
    data: Array<{
        computerName: string;
        failoverStatus: string;
        vmName?: string;
    }>;
}

export interface IngestResponse {
    success: boolean;
    ingestionId: string;
    recordsCount: number;
    message: string;
}

export interface MonitorResponse {
    backup: BackupReport[];
    vm: VMFailoverReport[];
    lastUpdated: string;
    latestBackupIngestion: string | null;
    latestVMIngestion: string | null;
}
