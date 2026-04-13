import ProfileNoteEditRecordScreen from "@/app/components/profile-note-edit-record-screen";

export default async function ProfileNoteEditPage({
  params,
}: {
  params: Promise<{ profileId: string; noteId: string }>;
}) {
  const { profileId, noteId } = await params;
  return <ProfileNoteEditRecordScreen profileId={profileId} noteId={noteId} />;
}
