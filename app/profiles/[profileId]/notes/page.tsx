import ProfileNotesScreen from "@/app/components/profile-notes-screen";

export default async function ProfileNotesPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  return <ProfileNotesScreen profileId={profileId} />;
}
