import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getInstructors, saveInstructor, deleteInstructor } from '@/lib/db';
import { imageFrom, saveImage, validateImage } from '@/lib/uploads';

// Multipart form with the same fields as POST /api/instructors; photo is optional here
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const { id } = await params;
    const existing = getInstructors().find(i => i.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Instructor not found' }, { status: 404 });
    }

    const form = await request.formData();
    const field = (name: string) => String(form.get(name) ?? '').trim();

    const name = field('name');
    if (!name) {
      return NextResponse.json({ success: false, error: 'សូមបញ្ចូលឈ្មោះគ្រូ' }, { status: 400 });
    }

    const photo = imageFrom(form, 'photo');
    if (photo) {
      const photoError = validateImage(photo);
      if (photoError) {
        return NextResponse.json({ success: false, error: photoError }, { status: 400 });
      }
    }

    const updated = saveInstructor({
      ...existing,
      name,
      title: field('title'),
      bio: field('bio'),
      experience: field('experience'),
      credentials: field('credentials').split('\n').map(s => s.trim()).filter(Boolean),
      avatar: photo ? await saveImage(photo, 'teacher') : existing.avatar
    });
    return NextResponse.json({ success: true, instructor: updated });
  } catch (error) {
    console.error('Error updating instructor:', error);
    return NextResponse.json({ success: false, error: 'Failed to update instructor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const { id } = await params;
    const result = deleteInstructor(id);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: `គ្រូនេះកំពុងបង្រៀន ${result.courseCount} វគ្គ។ សូមប្តូរគ្រូនៃវគ្គទាំងនោះជាមុនសិន។` },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting instructor:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete instructor' }, { status: 500 });
  }
}
