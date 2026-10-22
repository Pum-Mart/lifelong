import { NextResponse } from 'next/server';
import { getCourses, saveCourse } from '@/lib/db';
import { Course, CourseModule } from '@/types';
import { requireAdmin } from '@/lib/auth';
import { publicCourse } from '@/lib/assessments';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const format = searchParams.get('format');
    const search = searchParams.get('search')?.toLowerCase();

    let courses = getCourses();

    if (category && category !== 'all') {
      courses = courses.filter(c => c.category === category);
    }
    if (level && level !== 'all') {
      courses = courses.filter(c => c.level === level);
    }
    if (format && format !== 'all') {
      courses = courses.filter(c => c.format === format);
    }
    if (search) {
      courses = courses.filter(c => 
        c.title.toLowerCase().includes(search) ||
        c.subtitle.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search) ||
        c.tags.some(t => t.toLowerCase().includes(search))
      );
    }

    // Never send quiz answers or exam questions to the browser
    return NextResponse.json({ success: true, courses: courses.map(publicCourse) });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();
    if (!body.title || !body.category) {
      return NextResponse.json({ success: false, error: 'Title and category are required' }, { status: 400 });
    }

    const newCourse: Course = {
      id: body.id || `course-${Date.now()}`,
      slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: body.title,
      subtitle: body.subtitle || '',
      description: body.description || '',
      category: body.category,
      level: body.level || 'All Levels',
      format: body.format || 'Online Self-Paced',
      duration: body.duration || '4 Weeks',
      lecturesCount: body.lecturesCount || (body.modules?.reduce((acc: number, m: CourseModule) => acc + (m.lessons?.length || 0), 0) || 1),
      price: Number(body.price) || 0,
      originalPrice: Number(body.originalPrice) || Number(body.price) || 0,
      rating: 5.0,
      reviewsCount: 1,
      thumbnail: body.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
      instructorId: body.instructorId || 'inst-1',
      tags: body.tags || ['Lifelong Learning'],
      learningOutcomes: body.learningOutcomes || ['Master fundamental principles and real-world techniques'],
      prerequisites: body.prerequisites || ['No prior prerequisites required'],
      targetAudience: body.targetAudience || ['All adult learners'],
      ceus: Number(body.ceus) || 1.0,
      badge: body.badge || 'New',
      startDate: /^\d{4}-\d{2}-\d{2}$/.test(body.startDate || '') ? body.startDate : undefined,
      endDate: /^\d{4}-\d{2}-\d{2}$/.test(body.endDate || '') ? body.endDate : undefined,
      enrolledStudentsCount: 0,
      updatedAt: new Date().toISOString().split('T')[0],
      modules: body.modules || [
        {
          id: `mod-${Date.now()}`,
          title: 'Introduction & Foundations',
          description: 'Getting started with key principles.',
          lessons: [
            {
              id: `les-${Date.now()}`,
              title: 'Welcome & Overview',
              duration: '15 min',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
              summary: 'Essential overview and objectives.',
              notes: 'Take notes and reflect on your personal learning goals.',
              isFreePreview: true
            }
          ]
        }
      ]
    };

    const saved = saveCourse(newCourse);
    return NextResponse.json({ success: true, course: saved });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ success: false, error: 'Failed to create course' }, { status: 500 });
  }
}
