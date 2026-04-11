import { notFound } from "next/navigation";
import NoteEditScreen from "../../../../components/note-edit-screen";
import { getKentaroSatoTimelineEntry } from "../../../../components/profile-content";

export default async function KentaroSatoNoteEditPage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = await params;
  const note = getKentaroSatoTimelineEntry(noteId);

  if (!note) {
    notFound();
  }

  return <NoteEditScreen noteId={note.id} date={note.date} body={note.body} />;
}
