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
      customers: {
        Row: {
          address: string | null
          business_type: string | null
          city: string | null
          created_at: string | null
          customer_type: string | null
          delivery_area: string | null
          delivery_instructions: string | null
          discount_percentage: number | null
          emergency_contact: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          gas_supplier_license: string | null
          id: string
          is_verified: boolean | null
          last_login_at: string | null
          last_safety_inspection_date: string | null
          locked_until: string | null
          login_attempts: number | null
          name: string | null
          notes: string | null
          phone: string
          phone_verified: boolean | null
          preferred_cylinder_types: string[] | null
          preferred_delivery_time: string | null
          price_list_id: string | null
          role: string | null
          safety_certifications: string[] | null
          special_requirements: string | null
          updated_at: string | null
          verification_code: string | null
          verification_code_expires_at: string | null
        }
        Insert: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          created_at?: string | null
          customer_type?: string | null
          delivery_area?: string | null
          delivery_instructions?: string | null
          discount_percentage?: number | null
          emergency_contact?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gas_supplier_license?: string | null
          id?: string
          is_verified?: boolean | null
          last_login_at?: string | null
          last_safety_inspection_date?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          name?: string | null
          notes?: string | null
          phone: string
          phone_verified?: boolean | null
          preferred_cylinder_types?: string[] | null
          preferred_delivery_time?: string | null
          price_list_id?: string | null
          role?: string | null
          safety_certifications?: string[] | null
          special_requirements?: string | null
          updated_at?: string | null
          verification_code?: string | null
          verification_code_expires_at?: string | null
        }
        Update: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          created_at?: string | null
          customer_type?: string | null
          delivery_area?: string | null
          delivery_instructions?: string | null
          discount_percentage?: number | null
          emergency_contact?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gas_supplier_license?: string | null
          id?: string
          is_verified?: boolean | null
          last_login_at?: string | null
          last_safety_inspection_date?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          name?: string | null
          notes?: string | null
          phone?: string
          phone_verified?: boolean | null
          preferred_cylinder_types?: string[] | null
          preferred_delivery_time?: string | null
          price_list_id?: string | null
          role?: string | null
          safety_certifications?: string[] | null
          special_requirements?: string | null
          updated_at?: string | null
          verification_code?: string | null
          verification_code_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_days: {
        Row: {
          cities: string[]
          created_at: string | null
          day_of_week: number
          id: string
          updated_at: string | null
        }
        Insert: {
          cities?: string[]
          created_at?: string | null
          day_of_week: number
          id?: string
          updated_at?: string | null
        }
        Update: {
          cities?: string[]
          created_at?: string | null
          day_of_week?: number
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          cylinder_condition: string | null
          cylinder_serial_number: string | null
          delivery_instructions: string | null
          id: string
          installation_notes: string | null
          order_id: string | null
          price: number
          product_id: string | null
          quantity: number
          safety_check_completed: boolean | null
        }
        Insert: {
          created_at?: string | null
          cylinder_condition?: string | null
          cylinder_serial_number?: string | null
          delivery_instructions?: string | null
          id?: string
          installation_notes?: string | null
          order_id?: string | null
          price: number
          product_id?: string | null
          quantity: number
          safety_check_completed?: boolean | null
        }
        Update: {
          created_at?: string | null
          cylinder_condition?: string | null
          cylinder_serial_number?: string | null
          delivery_instructions?: string | null
          id?: string
          installation_notes?: string | null
          order_id?: string | null
          price?: number
          product_id?: string | null
          quantity?: number
          safety_check_completed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_id: string | null
          cylinder_exchange: boolean | null
          delivery_address: string | null
          delivery_date: string | null
          delivery_time_preference: string | null
          delivery_time_slot: string | null
          delivery_type: string | null
          emergency_contact: string | null
          id: string
          installation_required: boolean | null
          order_number: number
          safety_inspection_required: boolean | null
          service_type: string | null
          special_instructions: string | null
          specific_delivery_date: string | null
          specific_delivery_time: string | null
          status: string | null
          target_date: string | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          cylinder_exchange?: boolean | null
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_time_preference?: string | null
          delivery_time_slot?: string | null
          delivery_type?: string | null
          emergency_contact?: string | null
          id?: string
          installation_required?: boolean | null
          order_number?: number
          safety_inspection_required?: boolean | null
          service_type?: string | null
          special_instructions?: string | null
          specific_delivery_date?: string | null
          specific_delivery_time?: string | null
          status?: string | null
          target_date?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          cylinder_exchange?: boolean | null
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_time_preference?: string | null
          delivery_time_slot?: string | null
          delivery_type?: string | null
          emergency_contact?: string | null
          id?: string
          installation_required?: boolean | null
          order_number?: number
          safety_inspection_required?: boolean | null
          service_type?: string | null
          special_instructions?: string | null
          specific_delivery_date?: string | null
          specific_delivery_time?: string | null
          status?: string | null
          target_date?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      price_list_items: {
        Row: {
          created_at: string | null
          id: string
          price: number
          price_list_id: string
          product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          price: number
          price_list_id: string
          product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          price?: number
          price_list_id?: string
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_list_items_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          available: boolean | null
          capacity_liters: number | null
          category: string | null
          certification: string | null
          created_at: string | null
          cylinder_type: string | null
          description: string | null
          featured: boolean | null
          id: string
          image: string | null
          is_frozen: boolean | null
          name: string
          package_amount: number | null
          pressure_bar: number | null
          price: number
          quantity_increment: number | null
          refillable: boolean | null
          service_type: string | null
          sku: string | null
          uom: string | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          available?: boolean | null
          capacity_liters?: number | null
          category?: string | null
          certification?: string | null
          created_at?: string | null
          cylinder_type?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image?: string | null
          is_frozen?: boolean | null
          name: string
          package_amount?: number | null
          pressure_bar?: number | null
          price: number
          quantity_increment?: number | null
          refillable?: boolean | null
          service_type?: string | null
          sku?: string | null
          uom?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          available?: boolean | null
          capacity_liters?: number | null
          category?: string | null
          certification?: string | null
          created_at?: string | null
          cylinder_type?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image?: string | null
          is_frozen?: boolean | null
          name?: string
          package_amount?: number | null
          pressure_bar?: number | null
          price?: number
          quantity_increment?: number | null
          refillable?: boolean | null
          service_type?: string | null
          sku?: string | null
          uom?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          address: string | null
          city: string | null
          completed_at: string | null
          created_at: string | null
          customer_id: string | null
          customer_phone: string | null
          description: string
          id: string
          image_url: string | null
          location: string | null
          preferred_date: string | null
          preferred_time_slot: string | null
          priority: string | null
          service_type: string | null
          status: string | null
          technician_notes: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_phone?: string | null
          description: string
          id?: string
          image_url?: string | null
          location?: string | null
          preferred_date?: string | null
          preferred_time_slot?: string | null
          priority?: string | null
          service_type?: string | null
          status?: string | null
          technician_notes?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_phone?: string | null
          description?: string
          id?: string
          image_url?: string | null
          location?: string | null
          preferred_date?: string | null
          preferred_time_slot?: string | null
          priority?: string | null
          service_type?: string | null
          status?: string | null
          technician_notes?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_type: string | null
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_type?: string | null
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string | null
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_updates: {
        Row: {
          content: string
          created_at: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_order_item: {
        Args: {
          p_cylinder_condition?: string
          p_cylinder_serial_number?: string
          p_day_of_week: string
          p_delivery_instructions?: string
          p_installation_notes?: string
          p_order_id: string
          p_price: number
          p_product_id: string
          p_quantity: number
          p_safety_check_completed?: boolean
        }
        Returns: Json
      }
      create_order: {
        Args: {
          p_customer_id: string
          p_cylinder_exchange?: boolean
          p_delivery_address?: string
          p_delivery_date?: string
          p_delivery_time_slot?: string
          p_delivery_type?: string
          p_emergency_contact?: string
          p_installation_required?: boolean
          p_safety_inspection_required?: boolean
          p_service_type?: string
          p_special_instructions?: string
        }
        Returns: Json
      }
      create_service_request: {
        Args: {
          p_customer_id: string
          p_customer_phone?: string
          p_description: string
          p_image_url?: string
          p_location?: string
          p_preferred_date?: string
          p_preferred_time_slot?: string
          p_priority?: string
          p_service_type?: string
          p_title: string
        }
        Returns: Json
      }
      format_order_number: { Args: { order_num: number }; Returns: string }
      generate_verification_code: { Args: Record<PropertyKey, never>; Returns: string }
      get_customer_orders: { Args: { p_customer_id: string }; Returns: Json }
      get_customer_profile: { Args: { p_customer_id: string }; Returns: Json }
      get_customer_service_requests: {
        Args: { p_customer_id: string }
        Returns: Json
      }
      get_order_with_items: { Args: { p_order_id: string }; Returns: Json }
      get_reorderable_orders: {
        Args: { p_customer_id: string; p_limit?: number }
        Returns: Json
      }
      register_customer: {
        Args: {
          p_address?: string
          p_delivery_instructions?: string
          p_emergency_contact?: string
          p_gas_supplier_license?: string
          p_name: string
          p_phone: string
          p_preferred_delivery_time?: string
        }
        Returns: Json
      }
      reorder_from_previous: {
        Args: {
          p_customer_id: string
          p_delivery_address?: string
          p_delivery_date?: string
          p_delivery_time_slot?: string
          p_previous_order_id: string
          p_special_instructions?: string
        }
        Returns: Json
      }
      send_verification_code: { Args: { p_phone: string }; Returns: string }
      update_customer_profile: {
        Args: {
          p_address?: string
          p_business_type?: string
          p_customer_id: string
          p_delivery_area?: string
          p_delivery_instructions?: string
          p_emergency_contact?: string
          p_emergency_contact_name?: string
          p_emergency_contact_phone?: string
          p_gas_supplier_license?: string
          p_name?: string
          p_preferred_delivery_time?: string
          p_special_requirements?: string
        }
        Returns: Json
      }
      verify_phone_number: {
        Args: { p_code: string; p_phone: string }
        Returns: Json
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
