'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type CreateStartupRequest, type CreateContactRequest, type CreateOutreachLogRequest, type CreateInterviewRequest, type CreateInterviewInsightRequest } from '@/lib/api';

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

export function useContactsForStartup(startupId: string) {
  return useQuery({
    queryKey: ['contacts', startupId],
    queryFn: () => api.getContactsForStartup(startupId),
    enabled: !!startupId,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateContactRequest) => api.createContact(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.startup_id] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
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
