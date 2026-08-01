import {
  Body,
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

export type UserChoice = Record<string, string | number | boolean>;

export interface AdminNotificationProps {
  userName: string;
  userEmail: string;
  userChoices: UserChoice[];
  userAnswers: string[];
  logoUrl?: string;
}

export const getAdminNotificationSubject = (userName: string) =>
  `New project enquiry by ${userName}`;

const formatLabel = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());

export default function AdminNotification({
  userName,
  userEmail,
  userChoices,
  userAnswers,
  logoUrl = "https://yourcustomdomain.com",
}: AdminNotificationProps) {
  const rows = [
    { label: "Name", value: userName },
    { label: "Email", value: userEmail },
    ...userChoices.flatMap((choice) =>
      Object.entries(choice).map(([key, value]) => ({
        label: formatLabel(key),
        value: String(value),
      })),
    ),
    ...userAnswers.map((answer, index) => ({
      label: index === 0 ? "Project brief" : `Additional answer ${index + 1}`,
      value: answer,
    })),
  ];

  return (
    <Html lang="en">
      <Head />
      <Preview>{getAdminNotificationSubject(userName)}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={topBar} />
          <Section style={header}>
            <Img
              src={logoUrl}
              width="120"
              height="36"
              alt="weblo"
              style={logo}
            />
            <Text style={eyebrow}>NEW PROJECT INQUIRY</Text>
            <Heading as="h1" style={heading}>
              New submission from {userName}
            </Heading>
            <Text style={intro}>
              A new project brief was submitted through the weblo website.
            </Text>
          </Section>

          <Section style={tableSection}>
            <table
              role="presentation"
              width="100%"
              cellPadding="0"
              cellSpacing="0"
              style={table}
            >
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={`${row.label}-${index}`}
                    style={index % 2 === 0 ? lightRow : darkRow}
                  >
                    <td style={labelCell}>{row.label}</td>
                    <td style={valueCell}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section style={footer}>
            <Hr style={divider} />
            <Text style={footerText}>
              Reply directly to this message to contact {userName} at {userEmail}.
            </Text>
            <Text style={footerText}>weblo · Bengaluru, India</Text>
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
  maxWidth: "680px",
  margin: "40px auto",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  backgroundColor: "#ffffff",
} as const;
const topBar = { height: "8px", backgroundColor: "#4f46e5" } as const;
const header = { padding: "28px 32px 18px" } as const;
const logo = {
  display: "block",
  marginBottom: "28px",
  border: "0",
  objectFit: "contain",
} as const;
const eyebrow = {
  margin: "0 0 8px",
  color: "#4f46e5",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "1.4px",
} as const;
const heading = {
  margin: "0 0 12px",
  color: "#111827",
  fontSize: "28px",
  lineHeight: "36px",
  fontWeight: "700",
} as const;
const intro = {
  margin: "0",
  color: "#6b7280",
  fontSize: "15px",
  lineHeight: "24px",
} as const;

const tableSection = { padding: "12px 32px 24px" } as const;
const table = {
  width: "100%",
  border: "1px solid #e5e7eb",
  borderCollapse: "collapse",
  tableLayout: "fixed",
} as const;
const lightRow = { backgroundColor: "#ffffff" } as const;
const darkRow = { backgroundColor: "#f3f4f6" } as const;
const labelCell = {
  width: "32%",
  padding: "13px 14px",
  borderBottom: "1px solid #e5e7eb",
  color: "#4b5563",
  fontSize: "13px",
  fontWeight: "700",
  lineHeight: "20px",
  verticalAlign: "top",
  wordBreak: "break-word",
} as const;
const valueCell = {
  width: "68%",
  padding: "13px 14px",
  borderBottom: "1px solid #e5e7eb",
  borderLeft: "1px solid #e5e7eb",
  color: "#111827",
  fontSize: "14px",
  lineHeight: "21px",
  verticalAlign: "top",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
} as const;

const footer = { padding: "0 32px 28px" } as const;
const divider = { margin: "0 0 20px", borderColor: "#e5e7eb" } as const;
const footerText = {
  margin: "5px 0",
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "18px",
} as const;
