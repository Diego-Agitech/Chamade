import { getAgendaPageData } from "@/lib/db/stays";
import { AgendaClient } from "@/components/agenda/AgendaClient";

export default async function AgendaPage() {
  const data = await getAgendaPageData();

  return <AgendaClient members={data.members} stays={data.stays} currentMemberId={data.currentMemberId} />;
}
