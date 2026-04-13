import ProfileContactInfoEditScreen from "@/app/components/profile-contact-info-edit-screen";

export default async function ProfileContactInfoPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  return <ProfileContactInfoEditScreen profileId={profileId} />;
}
