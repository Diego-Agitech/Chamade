import ExcelJS from "exceljs";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

type ReportingData = {
  year: number;
  summary: {
    opexTotal: number;
    capexTotal: number;
    revenuesTotal: number;
    netResult: number;
  };
  monthly: Array<{ month: string; opex: number; capex: number; revenues: number }>;
  memberDistribution: Array<{ memberName: string; paid: number; received: number; net: number }>;
};

const money = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);

export function buildFinanceReportingCsv(data: ReportingData) {
  const lines: string[] = [];
  lines.push("Section;Cle;Valeur");
  lines.push(`Synthese;Annee;${data.year}`);
  lines.push(`Synthese;OPEX;${data.summary.opexTotal.toFixed(2)}`);
  lines.push(`Synthese;CAPEX;${data.summary.capexTotal.toFixed(2)}`);
  lines.push(`Synthese;Revenus;${data.summary.revenuesTotal.toFixed(2)}`);
  lines.push(`Synthese;ResultatNet;${data.summary.netResult.toFixed(2)}`);
  lines.push("");
  lines.push("Mensuel;Mois;OPEX;CAPEX;Revenus");
  for (const row of data.monthly) {
    lines.push(`Mensuel;${row.month};${row.opex.toFixed(2)};${row.capex.toFixed(2)};${row.revenues.toFixed(2)}`);
  }
  lines.push("");
  lines.push("Membres;Nom;Avance;Encaisse;Net");
  for (const row of data.memberDistribution) {
    lines.push(`Membres;${row.memberName};${row.paid.toFixed(2)};${row.received.toFixed(2)};${row.net.toFixed(2)}`);
  }
  return lines.join("\n");
}

export async function buildFinanceReportingExcel(data: ReportingData) {
  const workbook = new ExcelJS.Workbook();
  const summary = workbook.addWorksheet("Synthese");
  summary.addRow(["Annee", data.year]);
  summary.addRow(["OPEX", data.summary.opexTotal]);
  summary.addRow(["CAPEX", data.summary.capexTotal]);
  summary.addRow(["Revenus", data.summary.revenuesTotal]);
  summary.addRow(["Resultat net", data.summary.netResult]);

  const monthly = workbook.addWorksheet("Mensuel");
  monthly.addRow(["Mois", "OPEX", "CAPEX", "Revenus"]);
  data.monthly.forEach((row) => monthly.addRow([row.month, row.opex, row.capex, row.revenues]));

  const members = workbook.addWorksheet("Membres");
  members.addRow(["Membre", "Avance", "Encaisse", "Net"]);
  data.memberDistribution.forEach((row) => members.addRow([row.memberName, row.paid, row.received, row.net]));

  return workbook.xlsx.writeBuffer();
}

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 11 },
  title: { fontSize: 18, marginBottom: 10 },
  sectionTitle: { fontSize: 13, marginTop: 12, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
});

function FinanceReportPdf({ data }: { data: ReportingData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Rapport financier {data.year}</Text>

        <Text style={styles.sectionTitle}>Synthèse</Text>
        <View style={styles.row}>
          <Text>OPEX</Text>
          <Text>{money(data.summary.opexTotal)}</Text>
        </View>
        <View style={styles.row}>
          <Text>CAPEX</Text>
          <Text>{money(data.summary.capexTotal)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Revenus</Text>
          <Text>{money(data.summary.revenuesTotal)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Résultat net</Text>
          <Text>{money(data.summary.netResult)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Répartition par membre</Text>
        {data.memberDistribution.map((row) => (
          <View key={row.memberName} style={styles.row}>
            <Text>{row.memberName}</Text>
            <Text>{money(row.net)}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}

export async function buildFinanceReportingPdf(data: ReportingData) {
  return renderToBuffer(<FinanceReportPdf data={data} />);
}
