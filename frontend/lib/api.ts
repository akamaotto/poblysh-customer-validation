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

// User management methods
export const userApi = {
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
