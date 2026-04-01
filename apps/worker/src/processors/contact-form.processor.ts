import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { eq } from 'drizzle-orm';

import * as schema from '@autonomous-sales/database';
import { QUEUE_NAMES, type ContactFormJobPayload } from '@autonomous-sales/shared';
import { DATABASE_TOKEN, logExecution } from '../database/database.module';
import { ContactFormService } from '../services/contact-form.service';

@Processor(QUEUE_NAMES.CONTACT_FORM_OUTREACH)
export class ContactFormProcessor {
  private readonly logger = new Logger(ContactFormProcessor.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: any,
    private readonly contactFormService: ContactFormService,
  ) {}

  @Process()
  async handle(job: Job<ContactFormJobPayload>) {
    const startTime = Date.now();
    const { leadId, projectId, campaignId, websiteUrl, approvedContent } = job.data;

    this.logger.log(`[contact-form-processor] Job ${job.id} — lead: ${leadId}`);

    try {
      // ─── Case 1: Approved content — submit the form ───────────────────────
      if (approvedContent) {
        const submission = await this.db.query.contactFormSubmissions.findFirst({
          where: eq(schema.contactFormSubmissions.leadId, leadId),
          orderBy: (t: any, { desc }: any) => [desc(t.createdAt)],
        }) as schema.ContactFormSubmission | null;

        if (!submission) {
          throw new Error(`No pending submission found for lead: ${leadId}`);
        }

        const result = await this.contactFormService.submitForm(
          submission.contactFormUrl ?? websiteUrl,
          [],
          approvedContent,
        );

        // Update submission record
        await this.db
          .update(schema.contactFormSubmissions)
          .set({
            status: result.success ? 'submitted' : 'failed',
            submittedContent: approvedContent,
            submittedAt: result.success ? new Date() : null,
            errorMessage: result.error ?? null,
            updatedAt: new Date(),
          })
          .where(eq(schema.contactFormSubmissions.id, submission.id));

        // Log outreach event
        if (result.success) {
          await this.db.insert(schema.outreachEvents).values({
            leadId,
            campaignId: campaignId ?? submission.campaignId,
            channel: 'contact_form',
            status: 'sent',
            metadata: {
              submissionId: submission.id,
              formUrl: submission.contactFormUrl,
              content: approvedContent,
            },
          });

          // Update lead status to 'contacted' if still 'new'
          const lead = await this.db.query.leads.findFirst({
            where: eq(schema.leads.id, leadId),
          }) as schema.Lead | null;

          if (lead?.status === 'new') {
            await this.db
              .update(schema.leads)
              .set({ status: 'contacted', updatedAt: new Date() })
              .where(eq(schema.leads.id, leadId));
          }
        }

        await logExecution({
          db: this.db,
          projectId,
          agentType: 'communicator',
          trigger: QUEUE_NAMES.CONTACT_FORM_OUTREACH,
          inputPayload: job.data,
          outputPayload: { submitted: result.success, error: result.error },
          status: result.success ? 'success' : 'error',
          errorMessage: result.error,
          durationMs: Date.now() - startTime,
        });

        return;
      }

      // ─── Case 2: New request — analyze form and generate content ─────────
      const analysis = await this.contactFormService.analyzeAndGenerate(
        leadId,
        projectId,
        campaignId,
      );

      // Save to contactFormSubmissions as pending_approval
      const [submission] = await this.db
        .insert(schema.contactFormSubmissions)
        .values({
          leadId,
          campaignId: campaignId ?? null,
          websiteUrl,
          contactFormUrl: analysis.formFound ? analysis.formUrl : null,
          status: analysis.formFound ? 'pending_approval' : 'failed',
          generatedContent: {
            ...analysis.generatedContent,
            fields: analysis.fields,
          },
          aiReasoning: analysis.aiReasoning,
          errorMessage: analysis.formFound ? null : 'İletişim formu bulunamadı',
        })
        .returning();

      await logExecution({
        db: this.db,
        projectId,
        agentType: 'communicator',
        trigger: QUEUE_NAMES.CONTACT_FORM_OUTREACH,
        inputPayload: job.data,
        outputPayload: {
          submissionId: submission.id,
          formFound: analysis.formFound,
          formUrl: analysis.formUrl,
          generatedContent: analysis.generatedContent,
        },
        status: 'success',
        durationMs: Date.now() - startTime,
      });

      this.logger.log(
        `[contact-form-processor] Analysis done — formFound: ${analysis.formFound}, submissionId: ${submission.id}`,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[contact-form-processor] Job ${job.id} failed: ${err.message}`);

      await logExecution({
        db: this.db,
        projectId,
        agentType: 'communicator',
        trigger: QUEUE_NAMES.CONTACT_FORM_OUTREACH,
        inputPayload: job.data,
        status: 'error',
        errorMessage: err.message,
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }
}
