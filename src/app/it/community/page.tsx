import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import CommunityClient, { type CommunityCopy } from "@/app/community/section-client";

export const metadata = { title: "Community • Games Inc Jr" };

const copy: Partial<CommunityCopy> = {
  intro: "Condividi idee, feedback e festeggia i progressi con altri giocatori.",
  displayNameLabel: "Nome visibile (facoltativo)",
  displayNamePlaceholder: "es. SuperCoder",
  messageLabel: "Messaggio",
  messagePlaceholder: "Scrivi un suggerimento, un bug o qualcosa da festeggiare.",
  emptyState: "Nessun messaggio per ora: lascia tu il primo!",
  postButton: "Pubblica",
  posting: "Invio…",
  errorEmpty: "Scrivi qualcosa prima di pubblicare.",
  errorRefresh: "Non riusciamo ad aggiornare il feed. Riproviamo automaticamente.",
  errorSubmit: "Non siamo riusciti a pubblicare. Riprova più tardi.",
  characterHint: "I messaggi sono limitati a 500 caratteri per letture rapide.",
};

export default function CommunityItPage() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <PageHeader
          align="left"
          eyebrow="Community"
          title="Parla con noi e con la community"
          description="Lascia un messaggio: le note si aggiornano automaticamente così puoi tornare a leggere le risposte quando vuoi."
        />
        <CommunityClient copy={copy} />
      </div>
    </PageShell>
  );
}
