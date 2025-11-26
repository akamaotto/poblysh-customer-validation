'use client';

import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api, type CreateStartupRequest, type CreateContactRequest, type CreateOutreachLogRequest, type CreateInterviewRequest, type CreateInterviewInsightRequest, type SendContactEmailRequest, type UpdateContactRequest } from '@/lib/api';

function invalidateContactQueries(queryClient: QueryClient, startupId?: string) {
  queryClient.invalidateQueries({ queryKey: ['contacts'] });
  if (startupId) {
    queryClient.invalidateQueries({ queryKey: ['contacts', startupId, 'active'] });
    queryClient.invalidateQueries({ queryKey: ['contacts', startupId, 'trashed'] });
  }
}

// Startup hooks
export function useStartups() {
  return useQuery({
    queryKey: ['startups'],
    queryFn: api.getStartups,
  });
}

export function useStartup(id: string) {
  return useQuery({
    queryKey: ['startups', id],
    queryFn: () => api.getStartup(id),
    enabled: !!id,
  });
}

export function useCreateStartup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateStartupRequest) => api.createStartup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startups'] });
    },
  });
}

export function useUpdateStartup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateStartupRequest }) =>
      api.updateStartup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startups'] });
    },
  });
}

export function useDeleteStartup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.deleteStartup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startups'] });
    },
  });
}

// Contact hooks
export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: api.getContacts,
  });
}

export function useContactsForStartup(startupId: string, options?: { trashed?: boolean; enabled?: boolean }) {
  const trashed = options?.trashed ?? false;
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ['contacts', startupId, trashed ? 'trashed' : 'active'],
    queryFn: () => api.getContactsForStartup(startupId, { trashed }),
    enabled: !!startupId && enabled,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateContactRequest) => api.createContact(data),
    onSuccess: (_, variables) => {
      invalidateContactQueries(queryClient, variables.startup_id);
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactRequest }) => api.updateContact(id, data),
    onSuccess: (contact) => {
      invalidateContactQueries(queryClient, contact.startup_id);
    },
  });
}

export function useTrashContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id }: { id: string; startupId: string }) => api.trashContact(id),
    onSuccess: (contact, variables) => {
      invalidateContactQueries(queryClient, variables.startupId);
    },
  });
}

export function useRestoreContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; startupId: string }) => api.restoreContact(id),
    onSuccess: (_, variables) => {
      invalidateContactQueries(queryClient, variables.startupId);
    },
  });
}

export function usePermanentDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; startupId: string }) => api.permanentlyDeleteContact(id),
    onSuccess: (_, variables) => {
      invalidateContactQueries(queryClient, variables.startupId);
    },
  });
}

export function useBulkRestoreContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactIds }: { contactIds: string[]; startupId: string }) =>
      api.bulkRestoreContacts(contactIds),
    onSuccess: (_, variables) => {
      invalidateContactQueries(queryClient, variables.startupId);
    },
  });
}

export function useBulkDeleteContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactIds }: { contactIds: string[]; startupId: string }) =>
      api.bulkDeleteContacts(contactIds),
    onSuccess: (_, variables) => {
      invalidateContactQueries(queryClient, variables.startupId);
    },
  });
}

// OutreachLog hooks
export function useOutreachForStartup(startupId: string) {
  return useQuery({
    queryKey: ['outreach', startupId],
    queryFn: () => api.getOutreachForStartup(startupId),
    enabled: !!startupId,
  });
}

export function useCreateOutreachLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateOutreachLogRequest) => api.createOutreachLog(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['outreach', variables.startup_id] });
    },
  });
}

export function useSendContactEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ startupId, contactId, data }: { startupId: string; contactId: string; data: SendContactEmailRequest }) =>
      api.sendContactEmail(startupId, contactId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['outreach', variables.startupId] });
    },
  });
}

export function useRefreshEmailStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId }: { messageId: string; startupId: string }) => api.getEmailStatus(messageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['outreach', variables.startupId] });
    },
  });
}

// Interview hooks
export function useInterviewsForStartup(startupId: string) {
  return useQuery({
    queryKey: ['interviews', startupId],
    queryFn: () => api.getInterviewsForStartup(startupId),
    enabled: !!startupId,
  });
}

export function useInterviews() {
  return useQuery({
    queryKey: ['interviews'],
    queryFn: api.getInterviews,
  });
}

export function useCreateInterview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateInterviewRequest) => api.createInterview(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interviews', variables.startup_id] });
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
}

// InterviewInsight hooks
export function useInterviewInsight(interviewId: string) {
  return useQuery({
    queryKey: ['interview-insight', interviewId],
    queryFn: () => api.getInterviewInsight(interviewId),
    enabled: !!interviewId,
  });
}

export function useCreateInterviewInsight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateInterviewInsightRequest) => api.createInterviewInsight(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interview-insight', data.interview_id] });
    },
  });
}
