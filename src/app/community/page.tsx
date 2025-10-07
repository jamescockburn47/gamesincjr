import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import CommunityClient from "./section-client";

export const metadata = { title: "Community • Games Inc Jr" };

export default function CommunityPage() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <PageHeader
          eyebrow="Community hub"
          title="Share feedback and cheer each other on"
          description="Drop ideas, celebrate wins and help us shape the next games. Posts refresh automatically, so you can leave a note and check back for replies."
          align="left"
        />
        <CommunityClient />
      </div>
    </PageShell>
  );
}
