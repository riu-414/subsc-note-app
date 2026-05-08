export type BillingCycle = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'archived'
export type UsageFrequency = 'high' | 'medium' | 'low' | 'none'
export type CurrencyCode = 'JPY' | 'USD' | 'EUR' | 'GBP' | 'KRW' | (string & {})

type SubscriptionRow = {
  id: string
  user_id: string
  name: string
  plan_name: string | null
  price: number
  currency: CurrencyCode
  billing_cycle: BillingCycle
  payment_method: string | null
  next_billing_date: string | null
  trial_end_date: string | null
  usage_frequency: UsageFrequency | null
  status: SubscriptionStatus
  remarks: string | null
  created_at: string
  updated_at: string
}

type SubscriptionInsertRow = {
  id?: string
  user_id: string
  name: string
  plan_name?: string | null
  price: number
  currency?: CurrencyCode
  billing_cycle: BillingCycle
  payment_method?: string | null
  next_billing_date?: string | null
  trial_end_date?: string | null
  usage_frequency?: UsageFrequency | null
  status?: SubscriptionStatus
  remarks?: string | null
  created_at?: string
  updated_at?: string
}

type SubscriptionUpdateRow = Partial<SubscriptionInsertRow>

type GenreRow = {
  id: string
  user_id: string
  name: string
  color: string | null
  created_at: string
}

type GenreInsertRow = {
  id?: string
  user_id: string
  name: string
  color?: string | null
  created_at?: string
}

type GenreUpdateRow = Partial<GenreInsertRow>

type SubscriptionGenreRow = {
  subscription_id: string
  genre_id: string
}

type PaymentMethodRow = {
  id: string
  user_id: string
  name: string
  created_at: string
}

type PaymentMethodInsertRow = {
  id?: string
  user_id: string
  name: string
  created_at?: string
}

type PaymentMethodUpdateRow = Partial<PaymentMethodInsertRow>

export type Database = {
  public: {
    Tables: {
      subscriptions: {
        Row: SubscriptionRow
        Insert: SubscriptionInsertRow
        Update: SubscriptionUpdateRow
        Relationships: []
      }
      genres: {
        Row: GenreRow
        Insert: GenreInsertRow
        Update: GenreUpdateRow
        Relationships: []
      }
      subscription_genres: {
        Row: SubscriptionGenreRow
        Insert: SubscriptionGenreRow
        Update: Partial<SubscriptionGenreRow>
        Relationships: []
      }
      payment_methods: {
        Row: PaymentMethodRow
        Insert: PaymentMethodInsertRow
        Update: PaymentMethodUpdateRow
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Subscription = SubscriptionRow
export type SubscriptionInsert = SubscriptionInsertRow
export type SubscriptionUpdate = SubscriptionUpdateRow
export type Genre = GenreRow
export type GenreInsert = GenreInsertRow
export type GenreUpdate = GenreUpdateRow
export type SubscriptionGenre = SubscriptionGenreRow
export type PaymentMethod = PaymentMethodRow
export type PaymentMethodInsert = PaymentMethodInsertRow
export type PaymentMethodUpdate = PaymentMethodUpdateRow
