import ProfileBasicEditRecordScreen from "@/app/components/profile-basic-edit-record-screen";

export default async function ProfileEditPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  return <ProfileBasicEditRecordScreen profileId={profileId} />;
}
