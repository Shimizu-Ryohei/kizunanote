import ProfileRecordDetailScreen from "@/app/components/profile-record-detail-screen";

export default async function ProfileRecordPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  return <ProfileRecordDetailScreen profileId={profileId} />;
}
