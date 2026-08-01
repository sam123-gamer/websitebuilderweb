import { Resend } from "resend";

import AdminNotification, {
  getAdminNotificationSubject,
  type UserChoice,
} from "../emails/AdminNotification";
import UserConfirmation, {
  userConfirmationSubject,
} from "../emails/UserConfirmation";

interface ApiRequest {
  method?: string;
  body?: unknown;
}

interface ApiResponse {
  status(code: 200 | 500): ApiResponse;
  json(payload: { success: boolean; message: string }): void;
}

interface Submission {
  userName: string;
  userEmail: string;
  userChoices: UserChoice[];
  userAnswers: string[];
  submissionId: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_EMAIL = "contact@theweblo.com";
let resendClient: Resend | undefined;

export const config = { maxDuration: 15 };

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  return (resendClient ??= new Resend(apiKey));
};

const readRequiredEnv = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

const readText = (value: unknown, field: string, maxLength: number) => {
  if (typeof value !== "string") throw new Error(`${field} must be text`);

  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength || /[\r\n]/.test(normalized)) {
    throw new Error(`${field} is invalid`);
  }

  return normalized;
};

const readMultilineText = (value: unknown, field: string, maxLength: number) => {
  if (typeof value !== "string") throw new Error(`${field} must be text`);

  const normalized = value.replace(/\r\n?/g, "\n").trim();
  if (!normalized || normalized.length > maxLength) {
    throw new Error(`${field} is invalid`);
  }

  return normalized;
};

const parseBody = (body: unknown) => {
  const parsed = typeof body === "string" ? JSON.parse(body) : body;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Request body must be an object");
  }

  if (JSON.stringify(parsed).length > 15_000) {
    throw new Error("Request body is too large");
  }

  return parsed as Record<string, unknown>;
};

const parseSubmission = (input: Record<string, unknown>): Submission => {
  const userName = readText(input.userName, "userName", 100);
  const userEmail = readText(input.userEmail, "userEmail", 254).toLowerCase();
  if (!EMAIL_PATTERN.test(userEmail)) throw new Error("userEmail is invalid");

  if (!Array.isArray(input.userChoices) || input.userChoices.length > 5) {
    throw new Error("userChoices is invalid");
  }

  const userChoices = input.userChoices.map((choice, choiceIndex) => {
    if (!choice || typeof choice !== "object" || Array.isArray(choice)) {
      throw new Error(`userChoices[${choiceIndex}] is invalid`);
    }

    const entries = Object.entries(choice);
    if (entries.length === 0 || entries.length > 5) {
      throw new Error(`userChoices[${choiceIndex}] is invalid`);
    }

    return Object.fromEntries(
      entries.map(([key, value]) => {
        const normalizedKey = readText(key, "choice key", 80);
        if (!["string", "number", "boolean"].includes(typeof value)) {
          throw new Error(`userChoices[${choiceIndex}] contains an invalid value`);
        }

        return [normalizedKey, readText(String(value), normalizedKey, 500)];
      }),
    ) as UserChoice;
  });

  if (!Array.isArray(input.userAnswers) || input.userAnswers.length > 5) {
    throw new Error("userAnswers is invalid");
  }

  const userAnswers = input.userAnswers.map((answer, index) =>
    readMultilineText(answer, `userAnswers[${index}]`, 5_000),
  );
  const submissionId = readText(input.submissionId, "submissionId", 100);
  if (!/^[a-zA-Z0-9-]{16,100}$/.test(submissionId)) {
    throw new Error("submissionId is invalid");
  }

  return { userName, userEmail, userChoices, userAnswers, submissionId };
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method !== "POST") throw new Error("Method not allowed");
    const input = parseBody(req.body);
    if (typeof input.website === "string" && input.website.trim()) {
      return res.status(200).json({ success: true, message: "Submission received." });
    }

    const submission = parseSubmission(input);
    const resend = getResend();
    const from = readRequiredEnv("RESEND_FROM_EMAIL");
    const siteUrl = process.env.SITE_URL?.trim() || "https://theweblo.com";
    const logoUrl = process.env.EMAIL_LOGO_URL?.trim() || `${siteUrl}/favicon.svg`;

    const results = await Promise.all([
      resend.emails.send({
        from,
        to: submission.userEmail,
        replyTo: CONTACT_EMAIL,
        subject: userConfirmationSubject,
        react: UserConfirmation({
          userName: submission.userName,
          siteUrl,
          logoUrl,
          contactEmail: CONTACT_EMAIL,
        }),
      }, { idempotencyKey: `weblo-confirmation/${submission.submissionId}` }),
      resend.emails.send({
        from,
        to: CONTACT_EMAIL,
        replyTo: submission.userEmail,
        subject: getAdminNotificationSubject(submission.userName),
        react: AdminNotification({ ...submission, logoUrl }),
      }, { idempotencyKey: `weblo-admin/${submission.submissionId}` }),
    ]);

    if (results.some((result) => result.error)) {
      throw new Error("Resend rejected an email");
    }

    return res.status(200).json({
      success: true,
      message: "Submission received and emails sent.",
    });
  } catch (error) {
    console.error("Form submission email failed", error);
    return res.status(500).json({
      success: false,
      message: "Unable to process the submission.",
    });
  }
}
