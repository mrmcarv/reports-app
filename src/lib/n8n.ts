/**
 * n8n Webhook Client
 *
 * Handles syncing completed work orders to n8n webhook, which then:
 * 1. Updates work order status in DeBloq Airtable base
 * 2. Creates form submissions in Reports Airtable base
 * 3. Creates battery swap records
 * 4. Creates parts used records (with proper linking)
 *
 * This is called AFTER saving to Supabase (source of truth).
 */

/**
 * Payload sent to n8n webhook when completing a work order
 */
export interface WorkOrderCompletionPayload {
  workOrderId: string;
  technicianEmail: string;
  completedAt: string; // ISO 8601 timestamp
  formSubmissions: FormSubmissionData[];
  batterySwaps: BatterySwapData[];
  partsUsed: PartUsedData[];
}

/**
 * Form submission data (includes Supabase ID for linking)
 */
export interface FormSubmissionData {
  localId: number; // Supabase form_submissions.id
  formType: 'maintenance' | 'wind_audit' | 'survey';
  formData: Record<string, any>; // Full form data with embedded photo URLs
}

/**
 * Battery swap data
 */
export interface BatterySwapData {
  batteryPosition: string; // "1", "2", "3"
  oldBatterySn: string;
  newBatterySn: string;
}

/**
 * Part used data (includes linking info)
 */
export interface PartUsedData {
  localId: number; // Supabase parts_used.id
  formSubmissionLocalId: number; // Links to form submission
  partName: string;
  quantity: number;
}

/**
 * n8n webhook response
 */
export interface N8nWebhookResponse {
  success: boolean;
  workOrderId?: string;
  message?: string;
  syncedAt?: string;
  error?: string;
}

/**
 * Send work order completion data to n8n webhook
 *
 * This triggers the n8n workflow which syncs data to Airtable.
 * Called after successfully saving to Supabase.
 *
 * @param payload - Work order completion data
 * @returns Response from n8n webhook
 * @throws Error if webhook call fails
 */
export async function syncWorkOrderToN8n(
  payload: WorkOrderCompletionPayload
): Promise<N8nWebhookResponse> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl) {
    throw new Error('N8N_WEBHOOK_URL not configured');
  }

  if (!webhookSecret) {
    throw new Error('N8N_WEBHOOK_SECRET not configured');
  }

  try {
    console.log('📤 Syncing work order to n8n:', payload.workOrderId);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhookSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ n8n webhook failed:', response.status, errorText);
      throw new Error(`n8n webhook failed: ${response.status} ${errorText}`);
    }

    // Try to parse response (may be empty for MVP)
    const responseText = await response.text();
    let responseData: N8nWebhookResponse;

    if (responseText) {
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        // Response is not JSON, but request succeeded
        responseData = { success: true };
      }
    } else {
      // Empty response, but 200 OK
      responseData = { success: true };
    }

    console.log('✅ n8n sync successful:', payload.workOrderId);
    return responseData;
  } catch (error) {
    console.error('❌ n8n sync error:', error);
    throw error;
  }
}

/**
 * Retry sync for failed work orders
 *
 * Useful for retrying work orders where syncedToAirtable = false
 *
 * @param payload - Work order completion data
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryDelay - Delay between retries in ms (default: 1000)
 * @returns Response from n8n webhook
 */
export async function syncWorkOrderWithRetry(
  payload: WorkOrderCompletionPayload,
  maxRetries = 3,
  retryDelay = 1000
): Promise<N8nWebhookResponse> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await syncWorkOrderToN8n(payload);
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `⚠️  n8n sync attempt ${attempt}/${maxRetries} failed:`,
        error
      );

      if (attempt < maxRetries) {
        console.log(`   Retrying in ${retryDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError || new Error('n8n sync failed after retries');
}
