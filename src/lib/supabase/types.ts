// Database type definitions for Supabase tables
// These match the schema defined in Phase 3

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          currency: string;
          color_index: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['groups']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['groups']['Insert']>;
      };
      members: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          color_hex: string;
          is_admin: boolean;
        };
        Insert: Omit<Database['public']['Tables']['members']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['members']['Insert']>;
      };
      expenses: {
        Row: {
          id: string;
          group_id: string;
          description: string;
          total_amount: number;
          payer_id: string;
          date: string;
          category: string;
          items: any[];
          splits: any[];
        };
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          lemonsqueezy_customer_id: string | null;
          lemonsqueezy_order_id: string | null;
          lemonsqueezy_subscription_id: string | null;
          plan_type: 'free' | 'pro' | 'unlimited';
          status: string;
          variant_id: string | null;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_subscriptions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_subscriptions']['Insert']>;
      };
      ocr_usage: {
        Row: {
          id: string;
          user_id: string;
          scan_date: string;
          scan_count: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ocr_usage']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ocr_usage']['Insert']>;
      };
    };
  };
}
