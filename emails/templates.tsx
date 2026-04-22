import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";

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

export function NewStayEmail({
  recipientName,
  createdByName,
  stayType,
  personLabel,
  startDate,
  endDate,
  notes,
  agendaUrl,
}: {
  recipientName: string;
  createdByName: string;
  stayType: "Famille" | "Location";
  personLabel: string;
  startDate: string;
  endDate: string;
  notes?: string;
  agendaUrl: string;
}) {
  return (
    <BaseTemplate preview="Nouveau sejour ajoute" title="Nouveau sejour ajoute">
      <Text>Bonjour {recipientName},</Text>
      <Text>
        {createdByName} a ajoute un sejour ({stayType}) pour {personLabel}.
      </Text>
      <Text>
        Dates: {startDate} au {endDate}
      </Text>
      {notes ? <Text>Notes: {notes}</Text> : null}
      <Text>
        Ouvrir l&apos;agenda: <Link href={agendaUrl}>{agendaUrl}</Link>
      </Text>
    </BaseTemplate>
  );
}

export function StayOverlapEmail({
  recipientName,
  createdByName,
  startDate,
  endDate,
  conflicts,
  agendaUrl,
}: {
  recipientName: string;
  createdByName: string;
  startDate: string;
  endDate: string;
  conflicts: string[];
  agendaUrl: string;
}) {
  return (
    <BaseTemplate preview="Alerte chevauchement de sejours" title="Alerte chevauchement">
      <Text>Bonjour {recipientName},</Text>
      <Text>
        Un conflit de dates a ete detecte sur un sejour ajoute/modifie par {createdByName} ({startDate} au {endDate}).
      </Text>
      <Text>Sejours en conflit:</Text>
      {conflicts.map((line) => (
        <Text key={line}>- {line}</Text>
      ))}
      <Text>
        Ouvrir l&apos;agenda: <Link href={agendaUrl}>{agendaUrl}</Link>
      </Text>
    </BaseTemplate>
  );
}

export function TodoAssignedEmail({
  assigneeName,
  assignedByName,
  title,
  priority,
  dueDate,
  status,
  todosUrl,
}: {
  assigneeName: string;
  assignedByName: string;
  title: string;
  priority: string;
  dueDate?: string;
  status: string;
  todosUrl: string;
}) {
  return (
    <BaseTemplate preview="Nouvelle tache assignee" title="Nouvelle tache assignee">
      <Text>Bonjour {assigneeName},</Text>
      <Text>{assignedByName} vous a assigne une nouvelle tache:</Text>
      <Text>Titre: {title}</Text>
      <Text>Priorite: {priority}</Text>
      <Text>Statut: {status}</Text>
      {dueDate ? <Text>Echeance: {dueDate}</Text> : null}
      <Text>
        Ouvrir les todos: <Link href={todosUrl}>{todosUrl}</Link>
      </Text>
    </BaseTemplate>
  );
}

export function NewExpenseEmail({
  recipientName,
  createdByName,
  nature,
  amount,
  date,
  category,
  description,
  financesUrl,
}: {
  recipientName: string;
  createdByName: string;
  nature: string;
  amount: string;
  date: string;
  category: string;
  description: string;
  financesUrl: string;
}) {
  return (
    <BaseTemplate preview="Nouvelle depense enregistree" title="Nouvelle depense">
      <Text>Bonjour {recipientName},</Text>
      <Text>{createdByName} a enregistre une nouvelle depense.</Text>
      <Text>
        {nature} - {amount} le {date}
      </Text>
      <Text>
        Categorie: {category} | Description: {description}
      </Text>
      <Text>
        Ouvrir Finances: <Link href={financesUrl}>{financesUrl}</Link>
      </Text>
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
