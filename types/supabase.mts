export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      network_metadata: {
        Row: {
          active_nodes: number
          crawled_nodes: number
          id: number
          last_updated: string | null
          network_total: number
        }
        Insert: {
          active_nodes?: number
          crawled_nodes?: number
          id?: number
          last_updated?: string | null
          network_total?: number
        }
        Update: {
          active_nodes?: number
          crawled_nodes?: number
          id?: number
          last_updated?: string | null
          network_total?: number
        }
        Relationships: []
      }
      network_snapshots: {
        Row: {
          active_nodes: number
          avg_cpu_percent: number | null
          avg_ram_percent: number | null
          avg_uptime_hours: number | null
          created_at: string | null
          devnet_private: number | null
          devnet_public: number | null
          id: number
          mainnet_private: number | null
          mainnet_public: number | null
          network_health_score: number | null
          private_nodes: number
          snapshot_date: string
          total_nodes: number
          total_pages: number
          total_storage_bytes: number
        }
        Insert: {
          active_nodes?: number
          avg_cpu_percent?: number | null
          avg_ram_percent?: number | null
          avg_uptime_hours?: number | null
          created_at?: string | null
          devnet_private?: number | null
          devnet_public?: number | null
          id?: number
          mainnet_private?: number | null
          mainnet_public?: number | null
          network_health_score?: number | null
          private_nodes?: number
          snapshot_date: string
          total_nodes?: number
          total_pages?: number
          total_storage_bytes?: number
        }
        Update: {
          active_nodes?: number
          avg_cpu_percent?: number | null
          avg_ram_percent?: number | null
          avg_uptime_hours?: number | null
          created_at?: string | null
          devnet_private?: number | null
          devnet_public?: number | null
          id?: number
          mainnet_private?: number | null
          mainnet_public?: number | null
          network_health_score?: number | null
          private_nodes?: number
          snapshot_date?: string
          total_nodes?: number
          total_pages?: number
          total_storage_bytes?: number
        }
        Relationships: []
      }
      pnode_history: {
        Row: {
          cpu_percent: number | null
          created_at: string | null
          file_size: number | null
          id: number
          ip: string
          packets_received: number | null
          packets_sent: number | null
          ram_total: number | null
          ram_used: number | null
          storage_committed: number | null
          storage_used: number | null
          ts: number
          uptime: number | null
        }
        Insert: {
          cpu_percent?: number | null
          created_at?: string | null
          file_size?: number | null
          id?: number
          ip: string
          packets_received?: number | null
          packets_sent?: number | null
          ram_total?: number | null
          ram_used?: number | null
          storage_committed?: number | null
          storage_used?: number | null
          ts: number
          uptime?: number | null
        }
        Update: {
          cpu_percent?: number | null
          created_at?: string | null
          file_size?: number | null
          id?: number
          ip?: string
          packets_received?: number | null
          packets_sent?: number | null
          ram_total?: number | null
          ram_used?: number | null
          storage_committed?: number | null
          storage_used?: number | null
          ts?: number
          uptime?: number | null
        }
        Relationships: []
      }
      pnodes: {
        Row: {
          city: string | null
          confidence_score: number | null
          country: string | null
          country_code: string | null
          credits: number | null
          failed_checks: number | null
          has_pubkey: boolean | null
          id: number
          ip: string | null
          is_official: boolean | null
          is_registered: boolean | null
          last_crawled_at: string | null
          last_seen_gossip: string | null
          lat: number | null
          lng: number | null
          manager_wallet: string | null
          network: string | null
          network_confidence: string | null
          network_detection_method: string | null
          node_type: string | null
          pubkey: string | null
          source: string | null
          sources: string[] | null
          stats: Json | null
          status: string
          verified_by_rpc: boolean | null
          version: string | null
        }
        Insert: {
          city?: string | null
          confidence_score?: number | null
          country?: string | null
          country_code?: string | null
          credits?: number | null
          failed_checks?: number | null
          has_pubkey?: boolean | null
          id?: number
          ip?: string | null
          is_official?: boolean | null
          is_registered?: boolean | null
          last_crawled_at?: string | null
          last_seen_gossip?: string | null
          lat?: number | null
          lng?: number | null
          manager_wallet?: string | null
          network?: string | null
          network_confidence?: string | null
          network_detection_method?: string | null
          node_type?: string | null
          pubkey?: string | null
          source?: string | null
          sources?: string[] | null
          stats?: Json | null
          status: string
          verified_by_rpc?: boolean | null
          version?: string | null
        }
        Update: {
          city?: string | null
          confidence_score?: number | null
          country?: string | null
          country_code?: string | null
          credits?: number | null
          failed_checks?: number | null
          has_pubkey?: boolean | null
          id?: number
          ip?: string | null
          is_official?: boolean | null
          is_registered?: boolean | null
          last_crawled_at?: string | null
          last_seen_gossip?: string | null
          lat?: number | null
          lng?: number | null
          manager_wallet?: string | null
          network?: string | null
          network_confidence?: string | null
          network_detection_method?: string | null
          node_type?: string | null
          pubkey?: string | null
          source?: string | null
          sources?: string[] | null
          stats?: Json | null
          status?: string
          verified_by_rpc?: boolean | null
          version?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_history: {
        Args: never
        Returns: {
          deleted_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
