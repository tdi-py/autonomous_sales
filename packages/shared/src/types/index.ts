export interface ApiResponse<T> { data: T; success: true; }
export interface ApiError { success: false; error: string; statusCode: number; details?: unknown; }
export interface PaginationParams { page?: number; limit?: number; }
export interface PaginatedResponse<T> { data: T[]; total: number; page: number; limit: number; totalPages: number; }

export interface AnalyzeUrlJobPayload { projectId: string; workspaceId: string; websiteUrl: string; agentType: 'analyzer'; }
export interface GenerateCampaignContentJobPayload { projectId: string; workspaceId: string; campaignId: string; agentType: 'communicator'; }
export interface SendOutreachJobPayload { projectId: string; workspaceId: string; campaignId: string; leadId: string; sequenceStepId: string; emailAccountId: string; agentType: 'communicator'; }
export interface WarmupExecuteJobPayload { emailAccountId: string; projectId: string; workspaceId: string; agentType: 'communicator'; }
export interface PhoneVerifyJobPayload { leadId: string; projectId: string; phoneNumber: string; agentType: 'analyzer'; }
export interface StrategyReviewJobPayload { projectId: string; workspaceId: string; agentType: 'strategist'; }
export interface ComplianceCheckJobPayload { outreachEventId: string; leadId: string; projectId: string; channel: 'email' | 'call' | 'linkedin' | 'contact_form'; targetCountry: string; targetState?: string; agentType: 'analyzer'; }

export interface ContactFormJobPayload {
  leadId: string;
  projectId: string;
  campaignId: string;
  websiteUrl: string;
  agentType: 'communicator';
  approvedContent?: { name: string; email: string; phone?: string; message: string; company?: string; };
}

export interface AnalyzeLeadWebsiteJobPayload {
  leadId: string;
  projectId: string;
  websiteUrl: string;
  agentType: 'analyzer';
}

export const QUEUE_NAMES = {
  ANALYZE_URL: 'analyze-url',
  GENERATE_CAMPAIGN_CONTENT: 'generate-campaign-content',
  SEND_OUTREACH: 'send-outreach',
  WARMUP_EXECUTE: 'warmup-execute',
  PHONE_VERIFY: 'phone-verify',
  STRATEGY_REVIEW: 'strategy-review',
  COMPLIANCE_CHECK: 'compliance-check',
  CONTACT_FORM_OUTREACH: 'contact-form-outreach',
  ANALYZE_LEAD_WEBSITE: 'analyze-lead-website',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface JwtPayload { sub: string; email: string; workspaceId: string; role: string; iat?: number; exp?: number; }
export type PhoneClassification = 'can_call_ai' | 'can_call_manual' | 'cannot_call';
export interface PhoneClassificationResult { classification: PhoneClassification; numberType: 'landline' | 'mobile' | 'voip' | 'unknown'; isOnDnc: boolean; reason: string; }
