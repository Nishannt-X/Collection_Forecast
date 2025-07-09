export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      company_payment_history: {
        Row: {
          created_at: string | null
          customer_id: string
          days_to_payment: number | null
          id: string
          invoice_id: string
          payment_efficiency: number | null
          payment_velocity: number | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          days_to_payment?: number | null
          id?: string
          invoice_id: string
          payment_efficiency?: number | null
          payment_velocity?: number | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          days_to_payment?: number | null
          id?: string
          invoice_id?: string
          payment_efficiency?: number | null
          payment_velocity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_payment_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_payment_history_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      consultancy_metrics: {
        Row: {
          amount: number
          contract_type: string | null
          created_at: string
          description: string | null
          id: string
          metric_name: string
          metric_type: string
          percentage: number | null
          period_end: string | null
          period_start: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          contract_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metric_name: string
          metric_type: string
          percentage?: number | null
          period_end?: string | null
          period_start?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metric_name?: string
          metric_type?: string
          percentage?: number | null
          period_end?: string | null
          period_start?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          contract_type: string | null
          created_at: string
          credit_score: number | null
          customer_number: string
          email: string | null
          id: string
          industry: string | null
          location: string | null
          name: string
          phone: string | null
          risk_level: string | null
          segment: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contract_type?: string | null
          created_at?: string
          credit_score?: number | null
          customer_number: string
          email?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          name: string
          phone?: string | null
          risk_level?: string | null
          segment?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contract_type?: string | null
          created_at?: string
          credit_score?: number | null
          customer_number?: string
          email?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          name?: string
          phone?: string | null
          risk_level?: string | null
          segment?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      forecast_data: {
        Row: {
          accuracy_percentage: number | null
          collected_amount: number | null
          created_at: string
          forecast_amount: number
          id: string
          month: string
          updated_at: string
        }
        Insert: {
          accuracy_percentage?: number | null
          collected_amount?: number | null
          created_at?: string
          forecast_amount: number
          id?: string
          month: string
          updated_at?: string
        }
        Update: {
          accuracy_percentage?: number | null
          collected_amount?: number | null
          created_at?: string
          forecast_amount?: number
          id?: string
          month?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          contract_type: string | null
          created_at: string
          currency: string | null
          customer_id: string | null
          days_late: number | null
          description: string | null
          due_date: string
          has_early_discount: boolean | null
          id: string
          invoice_number: string
          market_condition: number | null
          payment_due_days: number | null
          payment_method: string | null
          payment_urgency: number | null
          predicted_payment_date: string | null
          risk_level: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          contract_type?: string | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          days_late?: number | null
          description?: string | null
          due_date: string
          has_early_discount?: boolean | null
          id?: string
          invoice_number: string
          market_condition?: number | null
          payment_due_days?: number | null
          payment_method?: string | null
          payment_urgency?: number | null
          predicted_payment_date?: string | null
          risk_level?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_type?: string | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          days_late?: number | null
          description?: string | null
          due_date?: string
          has_early_discount?: boolean | null
          id?: string
          invoice_number?: string
          market_condition?: number | null
          payment_due_days?: number | null
          payment_method?: string | null
          payment_urgency?: number | null
          predicted_payment_date?: string | null
          risk_level?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_predictions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          invoice_id: string
          model_version: string | null
          predicted_days_to_payment: number | null
          prediction_date: string | null
          sequence_features: Json | null
          static_features: Json | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          invoice_id: string
          model_version?: string | null
          predicted_days_to_payment?: number | null
          prediction_date?: string | null
          sequence_features?: Json | null
          static_features?: Json | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          invoice_id?: string
          model_version?: string | null
          predicted_days_to_payment?: number | null
          prediction_date?: string | null
          sequence_features?: Json | null
          static_features?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_predictions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          reference_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_factors: {
        Row: {
          affected_customers: string[] | null
          count: number | null
          created_at: string
          description: string
          factor_type: string
          id: string
          severity: string
          updated_at: string
        }
        Insert: {
          affected_customers?: string[] | null
          count?: number | null
          created_at?: string
          description: string
          factor_type: string
          id?: string
          severity: string
          updated_at?: string
        }
        Update: {
          affected_customers?: string[] | null
          count?: number | null
          created_at?: string
          description?: string
          factor_type?: string
          id?: string
          severity?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
