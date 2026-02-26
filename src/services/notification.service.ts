import { getNotificationHubsClient } from "../config/azure.config";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import type { Alert, NotificationChannel } from "../models/alert.model";
import type { Worker } from "../models/worker.model";

// ─── Push Notifications via Azure Notification Hubs ───────────────────────────

async function sendPushNotification(params: {
  worker: Worker;
  alert: Alert;
}): Promise<boolean> {
  const { worker, alert } = params;
  if (!worker.deviceTokens?.length) return false;

  try {
    const client = getNotificationHubsClient();

    const notification = {
      body: alert.message,
      title: `Dustinel Alert — ${alert.severity}`,
      data: {
        alertId: alert.id,
        severity: alert.severity,
        type: alert.type,
      },
    };

    // Tag-based broadcast to this worker's devices
    await client.sendNotification(
      {
        headers: {
          "apns-priority": "10",
          "apns-topic": "safeguard.alerts",
        },
        body: alert.message,
      } as any,
      { tagExpression: `workerId:${worker.workerId}` }
    );

    logger.info("Push notification sent", {
      workerId: worker.workerId,
      alertId: alert.id,
    });
    return true;
  } catch (err: any) {
    logger.error("Push notification failed", {
      error: err.message,
      workerId: worker.workerId,
    });
    return false;
  }
}

// ─── SMS / Email via Azure Communication Services ─────────────────────────────

async function sendSmsAlert(params: { worker: Worker; alert: Alert }): Promise<boolean> {
  const { worker, alert } = params;
  if (!worker.phone) return false;

  try {
    // Dynamic import to avoid startup cost when unused
    const { SmsClient } = await import("@azure/communication-sms");
    const smsClient = new SmsClient(env.AZURE_COMMUNICATION_CONNECTION_STRING);

    await smsClient.send({
      from: env.AZURE_COMMUNICATION_SENDER_PHONE ?? "+15550001234",
      to: [worker.phone],
      message: `Dustinel Alert [${alert.severity}]: ${alert.message} — View full report in the app.`,
    });

    logger.info("SMS alert sent", { workerId: worker.workerId, alertId: alert.id });
    return true;
  } catch (err: any) {
    logger.error("SMS alert failed", { error: err.message });
    return false;
  }
}

async function sendEmailAlert(params: {
  worker: Worker;
  alert: Alert;
  adminEmails?: string[];
}): Promise<boolean> {
  const { worker, alert, adminEmails = [] } = params;

  try {
    const { EmailClient } = await import("@azure/communication-email");
    const emailClient = new EmailClient(env.AZURE_COMMUNICATION_CONNECTION_STRING);

    const recipients = [
      { address: worker.email, displayName: worker.name },
      ...adminEmails.map((email) => ({ address: email })),
    ];

    await emailClient.beginSend({
      senderAddress: env.AZURE_COMMUNICATION_SENDER_EMAIL,
      recipients: { to: recipients },
      content: {
        subject: `Dustinel Alert — ${alert.severity} Risk Detected — ${worker.name}`,
        plainText: `
Dustinel Worker Safety Alert
==============================
Worker: ${worker.name}
Site: ${alert.site}
Severity: ${alert.severity}
Time: ${new Date(alert.timestamp).toLocaleString()}

${alert.message}

Risk Factors:
${alert.riskFactors.map((f) => `• ${f}`).join("\n")}

Please take immediate action and review the full report in the Dustinel admin dashboard.
        `.trim(),
      },
    });

    logger.info("Email alert sent", {
      workerId: worker.workerId,
      alertId: alert.id,
      recipients: recipients.length,
    });
    return true;
  } catch (err: any) {
    logger.error("Email alert failed", { error: err.message });
    return false;
  }
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

/**
 * Sends notifications via appropriate channels based on severity.
 * Returns the list of channels that were successfully notified.
 */
export async function sendAlertNotifications(params: {
  worker: Worker;
  alert: Alert;
  adminEmails?: string[];
}): Promise<NotificationChannel[]> {
  const { alert } = params;
  const notified: NotificationChannel[] = [];

  // In-app is always sent
  notified.push("in-app");

  // Push for all alerts
  const pushOk = await sendPushNotification(params);
  if (pushOk) notified.push("push");

  // SMS + email only for HIGH or CRITICAL
  if (alert.severity === "HIGH" || alert.severity === "CRITICAL") {
    const smsOk = await sendSmsAlert(params);
    if (smsOk) notified.push("sms");

    const emailOk = await sendEmailAlert(params);
    if (emailOk) notified.push("email");
  }

  return notified;
}

/**
 * Checks if enough time has passed since the last alert of a given type
 * to avoid alert fatigue (default: 30 min cooldown).
 */
export function shouldThrottle(
  lastAlertTime: Date | null,
  cooldownMinutes = 30
): boolean {
  if (!lastAlertTime) return false;
  const elapsed = (Date.now() - lastAlertTime.getTime()) / 1000 / 60;
  return elapsed < cooldownMinutes;
}