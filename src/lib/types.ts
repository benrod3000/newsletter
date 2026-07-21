/** Auth store types */
export interface AuthState {
  token: string | null;
  workspaceId: string | null;
  email: string | null;
  role: string | null;
}

/** API response shape matching backend api-response.ts */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/** Analytics overview shape */
export interface AnalyticsOverview {
  total_subscribers: number;
  campaigns_sent: number;
  avg_open_rate: number;
  avg_click_rate: number;
  subscriber_growth: { date: string; count: number }[];
  top_campaigns: {
    id: string;
    name: string;
    sent: number;
    open_rate: number;
    click_rate: number;
  }[];
}

/** Campaign shape */
export interface Campaign {
  id: string;
  client_id: string;
  title?: string;
  name?: string;
  subject: string;
  audience: string;
  status: string;
  editor_html?: string;
  editor_css?: string | null;
  plain_text?: string | null;
  scheduled_for?: string | null;
  sent_count?: number;
  last_sent_at?: string | null;
  updated_at?: string;
  created_at?: string;
  public_archive?: boolean;
  public_slug?: string;
  geo_filter?: Record<string, unknown>;
}

/** Subscriber shape */
export interface Subscriber {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  confirmed: boolean;
  client_id: string;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  health_score?: string;
  created_at?: string;
  unsubscribe_token?: string;
}
