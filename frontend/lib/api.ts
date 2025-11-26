const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Startup {
  id: string;
  name: string;
  category: string | null;
  website: string | null;
  newsroom_url: string | null;
  status: string;
  last_contact_date: string | null;
  next_step: string | null;
  admin_claimed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStartupRequest {
  name: string;
  category?: string;
  website?: string;
  newsroom_url?: string;
  status: string;
}

export interface Contact {
  id: string;
  startup_id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  is_primary: boolean;
  notes: string | null;
  is_trashed: boolean;
  owner_id: string | null;
  owner_name: string | null;
  owner_email: string | null;
}

export interface CreateContactRequest {
  startup_id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  is_primary?: boolean;
  notes?: string;
}

export interface UpdateContactRequest {
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  is_primary?: boolean;
  notes?: string;
}

interface ContactListParams {
  trashed?: boolean;
}

export interface OutreachLog {
  id: string;
  startup_id: string;
  contact_id: string | null;
  channel: string;
  direction: string;
  message_summary: string | null;
  message_id: string | null;
  subject: string | null;
  delivery_status: string | null;
  date: string;
  outcome: string;
}

export interface CreateOutreachLogRequest {
  startup_id: string;
  contact_id?: string;
  channel: string;
  direction: string;
  message_summary?: string;
  message_id?: string;
  subject?: string;
  delivery_status?: string;
  outcome: string;
}

export type EmailTemplateKey = 'intro' | 'follow-up' | 'custom';

export interface SendContactEmailRequest {
  subject?: string;
  body_html?: string;
  body_text?: string;
  template?: EmailTemplateKey;
}

export interface SendContactEmailResponse {
  message_id: string;
  delivery_status: string;
  outreach_log: OutreachLog;
}

export interface EmailStatusResponse {
  message_id: string;
  delivery_status: string;
  subject: string | null;
}

export const api = {
  // Startup methods
  async getStartups(): Promise<Startup[]> {
    const res = await fetch(`${API_BASE_URL}/api/startups`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch startups');
    return res.json();
  },

  async getStartup(id: string): Promise<Startup> {
    const res = await fetch(`${API_BASE_URL}/api/startups/${id}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch startup');
    return res.json();
  },

  async createStartup(data: CreateStartupRequest): Promise<Startup> {
    const res = await fetch(`${API_BASE_URL}/api/startups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create startup');
    return res.json();
  },

  async updateStartup(id: string, data: CreateStartupRequest): Promise<Startup> {
    const res = await fetch(`${API_BASE_URL}/api/startups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update startup');
    return res.json();
  },

  async deleteStartup(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/startups/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete startup');
  },

  // Contact methods
  async getContacts(params?: ContactListParams): Promise<Contact[]> {
    const query = params?.trashed ? `?trashed=${params.trashed}` : '';
    const res = await fetch(`${API_BASE_URL}/api/contacts${query}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch contacts');
    return res.json();
  },

  async getContactsForStartup(startupId: string, params?: ContactListParams): Promise<Contact[]> {
    const query = params?.trashed ? `?trashed=${params.trashed}` : '';
    const res = await fetch(`${API_BASE_URL}/api/startups/${startupId}/contacts${query}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch contacts');
    return res.json();
  },

  async createContact(data: CreateContactRequest): Promise<Contact> {
    const res = await fetch(`${API_BASE_URL}/api/startups/${data.startup_id}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create contact');
    return res.json();
  },

  async updateContact(id: string, data: UpdateContactRequest): Promise<Contact> {
    const res = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update contact');
    return res.json();
  },

  async trashContact(id: string): Promise<Contact> {
    const res = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to move contact to trash');
    return res.json();
  },

  async restoreContact(id: string): Promise<Contact> {
    const res = await fetch(`${API_BASE_URL}/api/admin/contacts/${id}/restore`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to restore contact');
    return res.json();
  },

  async permanentlyDeleteContact(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/admin/contacts/${id}/permanent`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to permanently delete contact');
  },

  async bulkRestoreContacts(contactIds: string[]): Promise<Contact[]> {
    const res = await fetch(`${API_BASE_URL}/api/admin/contacts/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ contact_ids: contactIds }),
    });
    if (!res.ok) throw new Error('Failed to restore contacts');
    return res.json();
  },

  async bulkDeleteContacts(contactIds: string[]): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/admin/contacts/delete-forever`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ contact_ids: contactIds }),
    });
    if (!res.ok) throw new Error('Failed to delete contacts');
  },

  // OutreachLog methods
  async getOutreachForStartup(startupId: string): Promise<OutreachLog[]> {
    const res = await fetch(`${API_BASE_URL}/api/startups/${startupId}/outreach`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch outreach logs');
    return res.json();
  },

  async createOutreachLog(data: CreateOutreachLogRequest): Promise<OutreachLog> {
    const res = await fetch(`${API_BASE_URL}/api/startups/${data.startup_id}/outreach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create outreach log');
    return res.json();
  },

  async sendContactEmail(startupId: string, contactId: string, data: SendContactEmailRequest): Promise<SendContactEmailResponse> {
    const res = await fetch(`${API_BASE_URL}/api/startups/${startupId}/contacts/${contactId}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send email');
    return res.json();
  },

  async getEmailStatus(messageId: string): Promise<EmailStatusResponse> {
    const res = await fetch(`${API_BASE_URL}/api/email-status/${messageId}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to refresh email status');
    return res.json();
  },

  // Interview methods
  async getInterviewsForStartup(startupId: string): Promise<Interview[]> {
    const res = await fetch(`${API_BASE_URL}/api/startups/${startupId}/interviews`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch interviews');
    return res.json();
  },

  async getInterviews(): Promise<Interview[]> {
    const res = await fetch(`${API_BASE_URL}/api/interviews`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch interviews');
    return res.json();
  },

  async createInterview(data: CreateInterviewRequest): Promise<Interview> {
    const res = await fetch(`${API_BASE_URL}/api/startups/${data.startup_id}/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create interview');
    return res.json();
  },

  // InterviewInsight methods
  async getInterviewInsight(interviewId: string): Promise<InterviewInsight> {
    const res = await fetch(`${API_BASE_URL}/api/interviews/${interviewId}/insight`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch interview insight');
    return res.json();
  },

  async createInterviewInsight(data: CreateInterviewInsightRequest): Promise<InterviewInsight> {
    const res = await fetch(`${API_BASE_URL}/api/interviews/${data.interview_id}/insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create interview insight');
    return res.json();
  },
};

export interface Interview {
  id: string;
  startup_id: string;
  contact_id: string | null;
  date: string;
  interview_type: string;
  recording_url: string | null;
  transcript_url: string | null;
  summary: string | null;
}

export interface CreateInterviewRequest {
  startup_id: string;
  contact_id?: string;
  date: string;
  interview_type: string;
  recording_url?: string;
  transcript_url?: string;
  summary?: string;
}

export interface InterviewInsight {
  id: string;
  interview_id: string;
  current_workflow: string | null;
  biggest_pains: string[] | null;
  desired_outcomes: string[] | null;
  jtbd_functional: string | null;
  jtbd_social: string | null;
  jtbd_emotional: string | null;
  excited_features: string[] | null;
  ignored_features: string[] | null;
  main_objections: string[] | null;
  interest_level: string;
  real_owner_role: string | null;
  willing_to_use_monthly: string | null;
  activation_candidate: boolean;
}

export interface CreateInterviewInsightRequest {
  interview_id: string;
  current_workflow?: string;
  biggest_pains: string[];
  desired_outcomes: string[];
  jtbd_functional?: string;
  jtbd_social?: string;
  jtbd_emotional?: string;
  excited_features: string[];
  ignored_features: string[];
  main_objections: string[];
  interest_level: string;
  real_owner_role?: string;
  willing_to_use_monthly?: string;
  activation_candidate: boolean;
}

export interface WeeklySynthesis {
  id: string;
  week_start_date: string;
  week_end_date: string;
  top_pains: string | null;
  top_desired_outcomes: string | null;
  top_features: string | null;
  top_objections: string | null;
  owner_persona_summary: string | null;
  activation_summary: string | null;
  product_implications: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  role?: string;
  is_active?: boolean;
}

export interface CreateWeeklySynthesisRequest {
  week_start: string;
  week_end: string;
  total_interviews: number;
  activation_candidates: number;
  top_pains: string[];
  top_features: string[];
  key_insights: string;
}

export interface WeeklyMetric {
  id: string | null;
  metric_type: 'input' | 'output';
  name: string;
  unit_label: string;
  owner_name: string | null;
  owner_id: string | null;
  target_value: number;
  actual_value: number;
  activity_type?: string | null;
  stage_name?: string | null;
}

export interface WeeklyPlan {
  id?: string | null;
  week_start: string;
  week_end: string;
  status: string;
  metrics: WeeklyMetric[];
}

export interface WeeklyMetricInput {
  metric_type: 'input' | 'output';
  name: string;
  unit_label: string;
  owner_name?: string;
  owner_id?: string;
  target_value: number;
  activity_type?: string;
  stage_name?: string;
  sort_order?: number;
}

export interface WeeklyPlanInput {
  week_start: string;
  metrics: WeeklyMetricInput[];
}

export interface ActivityEvent {
  id: string;
  activity_type: string;
  description: string;
  occurred_at: string;
  user_name?: string | null;
  startup_id?: string | null;
  startup_name?: string | null;
  contact_id?: string | null;
  contact_name?: string | null;
  stage_from?: string | null;
  stage_to?: string | null;
}

export interface WeeklyActivitySummary {
  current_plan: WeeklyPlan | null;
  activity_preview: ActivityEvent[];
}

export interface ActivityFeedResponse {
  total: number;
  page: number;
  page_size: number;
  results: ActivityEvent[];
}

export interface ActivityFeedParams {
  page?: number;
  page_size?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
  startup_id?: string;
  contact_id?: string;
  user_id?: string;
  stage?: string;
  activity_type?: string;
}

// User management methods
export const userApi = {
  async listUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE_URL}/api/users`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getUser(id: string): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async updateUser(id: string, data: Partial<UpdateUserRequest>): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  },

  async changeUserPassword(id: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ new_password: newPassword }),
    });
    if (!res.ok) throw new Error('Failed to change password');
    return res.json();
  },
};

export const weeklyApi = {
  async getWeeklySyntheses(): Promise<WeeklySynthesis[]> {
    const res = await fetch(`${API_BASE_URL}/api/weekly-synthesis`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch weekly syntheses');
    return res.json();
  },

  async createWeeklySynthesis(data: CreateWeeklySynthesisRequest): Promise<WeeklySynthesis> {
    const res = await fetch(`${API_BASE_URL}/api/weekly-synthesis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create weekly synthesis');
    return res.json();
  },
};

const buildQueryString = (params: Record<string, string | number | undefined>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export const activityApi = {
  async getSummary(): Promise<WeeklyActivitySummary> {
    const res = await fetch(`${API_BASE_URL}/api/activity/summary`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to load activity summary');
    return res.json();
  },

  async getFeed(params: ActivityFeedParams = {}): Promise<ActivityFeedResponse> {
    const query = buildQueryString(params);
    const res = await fetch(`${API_BASE_URL}/api/activity/feed${query}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to load activity feed');
    return res.json();
  },

  async getPlan(weekStart?: string): Promise<WeeklyPlan> {
    const query = buildQueryString(weekStart ? { week_start: weekStart } : {});
    const res = await fetch(`${API_BASE_URL}/api/activity/plan${query}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to load weekly plan');
    return res.json();
  },

  async updatePlan(payload: WeeklyPlanInput): Promise<WeeklyPlan> {
    const res = await fetch(`${API_BASE_URL}/api/activity/plan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to save weekly plan');
    return res.json();
  },

  async closePlan(planId: string): Promise<WeeklyPlan> {
    const res = await fetch(`${API_BASE_URL}/api/activity/plan/${planId}/close`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to close weekly plan');
    return res.json();
  },
};

// Email & Conversation types
export interface AdminEmailConfig {
  id: string;
  domain: string;
  imap_host: string;
  imap_port: number;
  imap_security: string;
  smtp_host: string;
  smtp_port: number;
  smtp_security: string;
  provider: string;
  require_app_password: boolean;
}

export type AdminEmailConfigInput = Omit<AdminEmailConfig, 'id'>;

export interface EmailConfigDto {
  email: string;
  password?: string;
  imap_host: string;
  imap_port: number;
  smtp_host: string;
  smtp_port: number;
  provider_settings_id?: string;
}

export interface EmailConfigResponse {
  email: string;
  imap_host: string;
  imap_port: number;
  smtp_host: string;
  smtp_port: number;
  is_configured: boolean;
  sync_status?: string | null;
  last_synced_at?: string | null;
  last_error?: string | null;
  provider_defaults?: AdminEmailConfig | null;
}

export interface EmailStatusResponse {
  sync_status: string;
  last_synced_at: string | null;
  last_sync_error: string | null;
}

export interface ConversationParticipant {
  role: 'from' | 'to' | 'cc' | 'bcc';
  email: string;
  name?: string | null;
}

export interface Conversation {
  id: string;
  user_id: string;
  subject: string;
  snippet: string | null;
  latest_message_at: string;
  has_attachments: boolean;
  is_read: boolean;
  is_archived: boolean;
  message_count: number;
  unread_count: number;
  thread_id?: string | null;
  startup_id?: string | null;
  participants: ConversationParticipant[];
  created_at: string;
  updated_at: string;
}

export interface MessageRecipient {
  email: string;
  name?: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  sender_name: string | null;
  sender_email: string;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  sent_at: string;
  delivered_at: string;
  read_at: string | null;
  direction: 'sent' | 'received';
  to_emails: MessageRecipient[];
  cc_emails: MessageRecipient[];
  bcc_emails: MessageRecipient[];
  in_reply_to?: string | null;
  references?: string | null;
  snippet?: string | null;
  is_read: boolean;
  is_from_me: boolean;
  has_attachments: boolean;
  attachment_count: number;
  created_at: string;
}

export interface MessageAttachment {
  id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  is_inline: boolean;
  content_id?: string | null;
}

export interface ConversationMessage {
  message: Message;
  attachments: MessageAttachment[];
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: ConversationMessage[];
}

export interface SendReplyPayload {
  body_text?: string;
  body_html?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  attachments?: ReplyAttachmentPayload[];
}

export interface ReplyAttachmentPayload {
  file_name: string;
  content_type: string;
  data_base64: string;
  is_inline?: boolean;
  content_id?: string;
}

export interface ConversationListParams {
  show_all?: boolean;
  startup_id?: string;
  unread_only?: boolean;
  has_attachments?: boolean;
  search?: string;
  participant?: string;
  page?: number;
  page_size?: number;
  archived?: boolean;
}

export const emailApi = {
  async getConfig(): Promise<EmailConfigResponse> {
    const res = await fetch(`${API_BASE_URL}/api/email/config`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch email config');
    return res.json();
  },

  async saveConfig(data: EmailConfigDto): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/email/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save email config');
  },

  async testConfig(data: EmailConfigDto): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/email/config/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to test email config');
  },

  async sync(): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/email/sync`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to sync emails');
  },

  async getStatus(): Promise<EmailStatusResponse> {
    const res = await fetch(`${API_BASE_URL}/api/user/email-status`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch email status');
    return res.json();
  },

  async getConversations(params: ConversationListParams = {}): Promise<ConversationSummary[]> {
    const query = buildQueryString(params);
    const res = await fetch(`${API_BASE_URL}/api/conversations${query}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  async getConversation(id: string): Promise<ConversationDetail> {
    const res = await fetch(`${API_BASE_URL}/api/conversations/${id}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch conversation');
    return res.json();
  },

  async reply(id: string, payload: SendReplyPayload): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/conversations/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to send reply');
  },

  async forward(id: string, payload: SendReplyPayload): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/conversations/${id}/forward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to forward message');
  },

  async markRead(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/conversations/${id}/mark-read`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to mark as read');
  },

  async markUnread(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/conversations/${id}/mark-unread`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to mark as unread');
  },

  async archive(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/conversations/${id}/archive`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to archive conversation');
  },

  async unarchive(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/conversations/${id}/unarchive`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to unarchive conversation');
  },

  async downloadAttachment(conversationId: string, attachmentId: string): Promise<Blob> {
    const res = await fetch(
      `${API_BASE_URL}/api/conversations/${conversationId}/attachments/${attachmentId}`,
      { credentials: 'include' },
    );
    if (!res.ok) throw new Error('Failed to download attachment');
    return res.blob();
  },
};

export interface ConversationSummary {
  conversation: Conversation;
  owner_name?: string | null;
  owner_email?: string | null;
}

export const emailAdminApi = {
  async listConfigs(): Promise<AdminEmailConfig[]> {
    const res = await fetch(`${API_BASE_URL}/api/admin/email-config`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch provider settings');
    return res.json();
  },

  async saveConfig(payload: AdminEmailConfigInput): Promise<AdminEmailConfig> {
    const res = await fetch(`${API_BASE_URL}/api/admin/email-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to save provider settings');
    return res.json();
  },
};
