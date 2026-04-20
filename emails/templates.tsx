import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";

function BaseTemplate({
  preview,
  title,
  children,
}: {
  preview: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "Arial, sans-serif", padding: "20px" }}>
        <Container style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px", padding: "20px" }}>
          <Heading style={{ margin: 0, color: "#18181b" }}>{title}</Heading>
          <Hr />
          <Section>{children}</Section>
          <Hr />
          <Text style={{ color: "#71717a", fontSize: "12px" }}>Chamade - plateforme familiale</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function PasswordResetEmail({ resetUrl }: { resetUrl: string }) {
  return (
    <BaseTemplate preview="Lien de réinitialisation" title="Réinitialisation de mot de passe">
      <Text>Utilise ce lien pour choisir un nouveau mot de passe:</Text>
      <Text>{resetUrl}</Text>
    </BaseTemplate>
  );
}

export function NotificationTestEmail({ name }: { name: string }) {
  return (
    <BaseTemplate preview="Email de test" title="Test notifications">
      <Text>Bonjour {name}, cet email confirme que les notifications fonctionnent.</Text>
    </BaseTemplate>
  );
}

export function WeeklyDigestEmail({ lines }: { lines: string[] }) {
  return (
    <BaseTemplate preview="Résumé hebdomadaire" title="Résumé hebdomadaire Chamade">
      {lines.map((line) => (
        <Text key={line}>{line}</Text>
      ))}
    </BaseTemplate>
  );
}

export function MonthlyFinanceReportEmail({ yearMonth, summary }: { yearMonth: string; summary: string }) {
  return (
    <BaseTemplate preview="Rapport mensuel finances" title={`Rapport financier ${yearMonth}`}>
      <Text>{summary}</Text>
    </BaseTemplate>
  );
}
