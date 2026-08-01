import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export const userConfirmationSubject =
  "Submission Confirmed: We've received your request";

export interface UserConfirmationProps {
  userName: string;
  siteUrl?: string;
  logoUrl?: string;
  contactEmail?: string;
}

export default function UserConfirmation({
  userName,
  siteUrl = "https://yourcustomdomain.com",
  logoUrl = "https://yourcustomdomain.com",
  contactEmail = "contact@theweblo.com",
}: UserConfirmationProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{userConfirmationSubject}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src={logoUrl}
              width="120"
              height="36"
              alt="weblo"
              style={logo}
            />
          </Section>

          <Section style={header}>
            <Text style={eyebrow}>REQUEST RECEIVED</Text>
            <Heading as="h1" style={heading}>
              Your project brief is safely with us.
            </Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Hi {userName},</Text>
            <Text style={paragraph}>
              Thanks for reaching out to weblo. We have received your request
              and will review the details carefully. You can expect a personal
              response within two business days with questions and a clear next
              step.
            </Text>
            <Text style={paragraph}>
              There is nothing else you need to do in the meantime.
            </Text>
            <Section style={buttonSection}>
              <Button href={siteUrl} style={button}>
                Return to weblo
              </Button>
            </Section>
            <Hr style={divider} />
            <Text style={supportText}>
              Need to add something? Reply to this email or contact us at
              {contactEmail}.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>weblo · Bengaluru, India</Text>
            <Text style={footerText}>
              This transactional email was sent because you submitted a project
              request on the weblo website.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const fontFamily =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const body = {
  margin: "0",
  backgroundColor: "#f8fafc",
  color: "#111827",
  fontFamily,
} as const;

const container = {
  width: "100%",
  maxWidth: "600px",
  margin: "40px auto",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  backgroundColor: "#ffffff",
} as const;

const logoSection = { padding: "28px 32px", backgroundColor: "#ffffff" } as const;
const logo = { display: "block", border: "0", objectFit: "contain" } as const;

const header = { padding: "32px", backgroundColor: "#4f46e5" } as const;
const eyebrow = {
  margin: "0 0 12px",
  color: "#e0e7ff",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "1.5px",
} as const;
const heading = {
  margin: "0",
  color: "#ffffff",
  fontSize: "30px",
  lineHeight: "38px",
  fontWeight: "700",
} as const;

const content = { padding: "32px" } as const;
const paragraph = {
  margin: "0 0 18px",
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
} as const;
const buttonSection = { padding: "10px 0 18px" } as const;
const button = {
  display: "inline-block",
  borderRadius: "8px",
  backgroundColor: "#4f46e5",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "700",
  lineHeight: "20px",
  padding: "13px 22px",
  textDecoration: "none",
} as const;
const divider = { margin: "18px 0", borderColor: "#e5e7eb" } as const;
const supportText = {
  margin: "0",
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "22px",
} as const;

const footer = {
  padding: "24px 32px",
  borderTop: "1px solid #e5e7eb",
  backgroundColor: "#f9fafb",
} as const;
const footerText = {
  margin: "4px 0",
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "18px",
} as const;
