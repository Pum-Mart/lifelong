import { Course, Instructor, WorkshopEvent, UserProfile } from '@/types';

export const INSTRUCTORS: Instructor[] = [
  {
    id: 'inst-1',
    name: 'Dr. Marcus Vance',
    title: 'Professor Emeritus of Computer Science & AI Ethics',
    bio: 'Dr. Vance has over 32 years of teaching experience at leading institutions. He specializes in demystifying cutting-edge technologies, artificial intelligence, and digital safety for adult learners of all backgrounds.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    credentials: ['Ph.D. in Computer Science', 'Senior IEEE Life Member', 'Lifelong Educator Award 2024'],
    rating: 4.95,
    totalStudents: 14200,
    coursesCount: 4,
  },
  {
    id: 'inst-2',
    name: 'Elena Rostova, MFA',
    title: 'Master Botanical Illustrator & Art Historian',
    bio: 'Elena is an internationally exhibited watercolorist whose passion is helping adults rediscover their artistic confidence. Her approach emphasizes mindful observation, gentle pacing, and joyful creativity.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    credentials: ['MFA Florence Academy of Art', 'Fellow of Society of Botanical Artists', 'Author of 3 Art Guides'],
    rating: 4.98,
    totalStudents: 8900,
    coursesCount: 3,
  },
  {
    id: 'inst-3',
    name: 'Dr. Julian Sterling, MD, FACSM',
    title: 'Geriatrician & Preventative Longevity Specialist',
    bio: 'Dr. Sterling combines clinical geriatric medicine with evidence-based physical therapy. His mission is providing practical, safe movement and cognitive fitness strategies for lifelong vitality and independence.',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
    credentials: ['MD Johns Hopkins Medicine', 'Fellow American College of Sports Medicine', 'Consultant in Active Aging'],
    rating: 4.92,
    totalStudents: 11450,
    coursesCount: 3,
  },
  {
    id: 'inst-4',
    name: 'Margaret Chen, CFP®',
    title: 'Senior Wealth Strategist & Retirement Transition Counselor',
    bio: 'Margaret has advised over 1,500 families through retirement, estate planning, and philanthropic legacy design. She translates complex tax and investment concepts into accessible, stress-free roadmaps.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    credentials: ['Certified Financial Planner (CFP®)', 'MS in Financial Economics', 'Author of "Your Second Act Wealth"'],
    rating: 4.89,
    totalStudents: 7600,
    coursesCount: 2,
  },
  {
    id: 'inst-5',
    name: 'Prof. Gianluigi Rossi',
    title: 'Cultural Historian & Linguist',
    bio: 'Born in Bologna, Italy, Gianluigi teaches languages through cultural immersion, culinary history, and cinema. He believes language learning is the greatest exercise for neuroplasticity at any age.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    credentials: ['Laurea Magistrale University of Bologna', 'Certified Italian Language Pedagogist'],
    rating: 4.96,
    totalStudents: 6200,
    coursesCount: 2,
  }
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-1',
    slug: 'ai-chatgpt-mastery-for-everyday-life',
    title: 'Generative AI & ChatGPT: Everyday Productivity & Creativity',
    subtitle: 'Learn to use modern AI assistants safely and effortlessly for writing, research, organization, and creative hobbies.',
    description: 'Artificial intelligence is not just for software engineers—it is a transformative tool for lifelong learners, retirees, and everyday problem-solvers. In this supportive, step-by-step course, Dr. Marcus Vance guides you through conversational AI without any confusing jargon. You will discover how to draft clear letters, plan family itineraries, summarize long articles, generate creative recipe ideas, and protect your privacy while using modern digital tools.',
    category: 'Technology & AI',
    level: 'Beginner',
    format: 'Online Self-Paced',
    duration: '6 Weeks (18 Hours total)',
    lecturesCount: 16,
    price: 49,
    originalPrice: 89,
    rating: 4.94,
    reviewsCount: 312,
    featured: true,
    popular: true,
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    instructorId: 'inst-1',
    tags: ['AI', 'ChatGPT', 'Digital Literacy', 'Tech for Seniors', 'Productivity'],
    learningOutcomes: [
      'Master prompt crafting for daily writing, summaries, and correspondence',
      'Use AI tools safely without exposing personal or financial information',
      'Organize personal archives, memoirs, and recipe collections using smart tools',
      'Recognize AI hallucinations and verify facts with reliable methods'
    ],
    prerequisites: ['Basic familiarity with web browsing on a laptop, tablet, or desktop'],
    targetAudience: [
      'Adult learners curious about AI but unsure where to begin',
      'Professionals looking to simplify daily administrative writing',
      'Seniors eager to stay connected with modern technological developments'
    ],
    ceus: 2.0,
    badge: 'Bestseller',
    enrolledStudentsCount: 2840,
    updatedAt: '2026-09-15',
    modules: [
      {
        id: 'mod-1',
        title: 'Module 1: Demystifying AI & Your First Conversation',
        description: 'Understand what Large Language Models are, dispel common myths, and set up your safe workspace.',
        lessons: [
          {
            id: 'les-101',
            title: 'Welcome & How AI Works in Plain English',
            duration: '14 min',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            summary: 'An introduction to generative artificial intelligence, comparing it to an ultra-well-read assistant.',
            notes: 'Key Takeaways: AI is pattern matching based on text training. It does not possess consciousness, but it excels at synthesis and rephrasing.',
            isFreePreview: true,
            quiz: [
              {
                id: 'q-101-1',
                question: 'What is the primary function of a Large Language Model like ChatGPT?',
                options: [
                  'To store human bank passwords',
                  'To predict and generate natural, contextual language responses based on patterns',
                  'To physically control household appliances',
                  'To replace human intuition entirely'
                ],
                correctAnswer: 1,
                explanation: 'LLMs are statistical pattern engines trained on language to generate coherent, context-aware responses.'
              }
            ]
          },
          {
            id: 'les-102',
            title: 'Setting Up Your Free Account & Privacy Settings',
            duration: '18 min',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            summary: 'Step-by-step guidance on creating an account and toggling data training settings off for confidentiality.',
            notes: 'Never paste sensitive personal information, social security numbers, or passwords into any public AI chatbot.',
            isFreePreview: true
          },
          {
            id: 'les-103',
            title: 'The Art of the Conversational Prompt',
            duration: '22 min',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            summary: 'The CLEAR prompt formula: Context, Length, Examples, Audience, and Role.',
            notes: 'Always specify the persona and target format (e.g., "Explain in simple terms for a 10-year-old").',
            quiz: [
              {
                id: 'q-103-1',
                question: 'What makes a prompt significantly more effective?',
                options: [
                  'Using all uppercase letters',
                  'Providing clear context, target audience, and desired output format',
                  'Typing as fast as possible',
                  'Asking only one-word questions'
                ],
                correctAnswer: 1,
                explanation: 'Context and constraints guide the AI to eliminate ambiguity and tailor the response specifically to your needs.'
              }
            ]
          }
        ]
      },
      {
        id: 'mod-2',
        title: 'Module 2: Practical Everyday Applications',
        description: 'Drafting emails, planning trips, organizing memories, and exploring creative storytelling.',
        lessons: [
          {
            id: 'les-104',
            title: 'Drafting Polished Letters, Inquiries & Speeches',
            duration: '25 min',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            summary: 'How to use AI to revise drafts, adjust emotional tone, and prepare speeches for family gatherings.',
            notes: 'Give your draft to the AI and prompt: "Please enhance the clarity and warmth of this text while maintaining my personal voice."'
          },
          {
            id: 'les-105',
            title: 'Trip Planning, Itineraries & Cultural Research',
            duration: '20 min',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
            summary: 'Creating customized multi-day itineraries with walking distances, hidden gems, and dietary needs.',
            notes: 'Always cross-reference business opening hours with official local websites.'
          }
        ]
      }
    ]
  },
  {
    id: 'course-2',
    slug: 'botanical-watercolor-mindful-art',
    title: 'Mindful Botanical Watercolor & Nature Illustration',
    subtitle: 'Awaken your inner artist with gentle watercolor techniques, color theory, and relaxing botanical studies.',
    description: 'Immerse yourself in the calming, contemplative craft of botanical painting. Whether you have never picked up a brush or are returning to art after decades, Elena Rostova provides a welcoming sanctuary where there are no mistakes, only organic discoveries. You will explore wet-on-dry washes, pigment layering, leaf veins, and delicate petals while cultivating a mindful observational practice that soothes the nervous system.',
    category: 'Creative Arts & Expression',
    level: 'All Levels',
    format: 'Online Self-Paced',
    duration: '5 Weeks (15 Hours total)',
    lecturesCount: 14,
    price: 55,
    originalPrice: 95,
    rating: 4.98,
    reviewsCount: 248,
    featured: true,
    popular: true,
    thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    instructorId: 'inst-2',
    tags: ['Watercolor', 'Botanical Art', 'Mindfulness', 'Painting', 'Stress Relief'],
    learningOutcomes: [
      'Master watercolor brushwork: flat washes, graded washes, and wet-on-wet blending',
      'Create accurate color swatches and mix harmonious natural greens and earth tones',
      'Illustrate realistic botanical textures: leaves, bark, blossoms, and seed pods',
      'Cultivate a lifelong sketchbook habit for daily tranquility'
    ],
    prerequisites: ['No prior artistic experience needed. A basic student watercolor set and 100% cotton paper.'],
    targetAudience: [
      'Adults seeking a relaxing, screen-free creative sanctuary',
      'Beginners wanting structured, encouraging guidance in painting',
      'Gardeners and nature enthusiasts who want to document flora'
    ],
    ceus: 1.5,
    badge: 'Popular',
    enrolledStudentsCount: 1980,
    updatedAt: '2026-09-28',
    modules: [
      {
        id: 'mod-201',
        title: 'Module 1: The Painter’s Tools & Water Control',
        description: 'Understanding cold-press paper, watercolor pigments, water-to-pigment ratios, and round brushes.',
        lessons: [
          {
            id: 'les-201',
            title: 'Selecting Your Gentle Materials & Studio Setup',
            duration: '16 min',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            summary: 'Understanding pan vs tube paints, brush ergonomics, and paper weight (300gsm/140lb).',
            notes: 'Using 100% cotton paper prevents buckling and makes wet-in-wet blending silky and controllable.',
            isFreePreview: true
          },
          {
            id: 'les-202',
            title: 'Water-to-Pigment Ratios: Tea, Milk, Honey, and Butter',
            duration: '24 min',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            summary: 'The four consistency levels of watercolor and how they govern transparency and value.',
            notes: 'Tea consistency produces transparent glazes; butter consistency provides deep dark accents.',
            quiz: [
              {
                id: 'q-202-1',
                question: 'Which consistency of watercolor wash is ideal for the first base layer of a leaf?',
                options: [
                  'Butter (thick & dry)',
                  'Tea or Light Coffee (diluted and luminous)',
                  'Straight out of the tube with no water',
                  'White gouache mixture'
                ],
                correctAnswer: 1,
                explanation: 'Watercolor relies on transparency. Working from light (tea) to dark preserves paper luminosity.'
              }
            ]
          }
        ]
      },
      {
        id: 'mod-202',
        title: 'Module 2: Foliage, Stems & Leaf Veins',
        description: 'Painting realistic botanical greens and mastering delicate rigger brushwork.',
        lessons: [
          {
            id: 'les-203',
            title: 'Mixing 12 Varieties of Botanical Greens without Phthalo Shock',
            duration: '22 min',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            summary: 'Blending yellow ochre, ultramarine, burnt sienna, and sap green for lifelike botanical palettes.',
            notes: 'Avoid using straight green from the pan; always temper greens with earth tones or complementary reds.'
          }
        ]
      }
    ]
  },
  {
    id: 'course-3',
    slug: 'functional-mobility-active-longevity-after-50',
    title: 'Functional Mobility, Posture & Vitality for Lifelong Independence',
    subtitle: 'Doctor-designed movement routines for joint lubrication, balance, spinal health, and fall prevention.',
    description: 'Vitality in our 50s, 60s, 70s and beyond is built on purposeful daily mobility. In this physician-led program, Dr. Julian Sterling presents safe, evidence-based physical routines you can do in your living room with zero specialized equipment. Learn how to protect your knees, stabilize your lumbar spine, enhance hip hinge mechanics, and improve proprioceptive balance so you can garden, hike, play with grandchildren, and travel with unwavering confidence.',
    category: 'Health, Longevity & Wellness',
    level: 'All Levels',
    format: 'Online Self-Paced',
    duration: '6 Weeks (12 Hours total)',
    lecturesCount: 18,
    price: 45,
    originalPrice: 85,
    rating: 4.96,
    reviewsCount: 380,
    featured: true,
    popular: true,
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
    instructorId: 'inst-3',
    tags: ['Health', 'Longevity', 'Mobility', 'Balance', 'Fall Prevention', 'Seniors'],
    learningOutcomes: [
      'Perform the 10-minute Morning Joint Lubrication protocol',
      'Strengthen foot arches and ankle stabilizers for fall reduction',
      'Relieve lower back tightness through pelvic tilting and gentle hip opening',
      'Build core endurance safely without dangerous sit-ups or strain'
    ],
    prerequisites: ['Doctor clearance for light, gentle functional exercise. A sturdy chair.'],
    targetAudience: [
      'Adults over 50 experiencing morning stiffness or balance uncertainty',
      'Caregivers looking for safe movement routines for family members',
      'Anyone committed to healthy aging and independent living'
    ],
    ceus: 2.2,
    badge: 'Doctor Recommended',
    enrolledStudentsCount: 3410,
    updatedAt: '2026-10-01',
    modules: [
      {
        id: 'mod-301',
        title: 'Module 1: The Foundations of Joint Longevity',
        description: 'Synovial fluid circulation, spinal decompression, and safe range of motion.',
        lessons: [
          {
            id: 'les-301',
            title: 'The Biology of Healthy Aging Joints',
            duration: '15 min',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            summary: 'How movement acts as mechanical medicine to hydrate cartilage and maintain bone density.',
            notes: 'Cartilage lacks direct blood vessels; it relies on cyclic compression and release to absorb nutrients.',
            isFreePreview: true
          },
          {
            id: 'les-302',
            title: 'The 10-Minute Morning Bed & Chair Routine',
            duration: '21 min',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            summary: 'Gentle ankle pumps, seated cat-cow, thoracic twists, and neck retractions.',
            notes: 'Perform slowly without forcing. Breathe continuously through your nose.',
            quiz: [
              {
                id: 'q-302-1',
                question: 'Why is morning ankle mobility so critical for older adults?',
                options: [
                  'It changes shoe size',
                  'It activates proprioceptors and stabilizes balance before taking the first steps of the day',
                  'It speeds up digestion',
                  'It replaces cardiac exercise'
                ],
                correctAnswer: 1,
                explanation: 'The ankles and feet house dense sensory nerves that signal the brain where your center of mass is situated.'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'course-4',
    slug: 'retirement-financial-literacy-legacy-planning',
    title: 'Modern Retirement & Legacy Blueprint: Taxes, Income & Security',
    subtitle: 'Strategic guidance on decumulation, healthcare buffers, social security optimization, and family wealth transfer.',
    description: 'Transitioning from accumulating wealth to spending and protecting it requires a completely different mindset. Margaret Chen, CFP®, guides you through the strategic architecture of retirement longevity. You will learn how to sequence withdrawals to minimize taxes, safeguard your estate against high long-term care costs, structure enduring charitable gifts, and initiate open, loving conversations with children about estate matters.',
    category: 'Business & Financial Literacy',
    level: 'Intermediate',
    format: 'Live Webinar',
    duration: '4 Weeks (10 Hours total)',
    lecturesCount: 12,
    price: 69,
    originalPrice: 120,
    rating: 4.88,
    reviewsCount: 195,
    featured: false,
    popular: true,
    thumbnail: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
    instructorId: 'inst-4',
    tags: ['Retirement', 'Finance', 'Estate Planning', 'Tax Strategy', 'Legacy'],
    learningOutcomes: [
      'Calculate your personalized safe withdrawal rate and longevity buffer',
      'Optimize Social Security claiming age to maximize lifetime benefit',
      'Understand the difference between wills, living trusts, and healthcare directives',
      'Implement multi-bucket portfolio allocations for sleep-at-night peace'
    ],
    prerequisites: ['Basic understanding of personal retirement savings accounts (401k/IRA/pension)'],
    targetAudience: [
      'Individuals within 5 years of retirement or newly retired',
      'Seniors looking to optimize estate transfers and minimize tax burdens for heirs'
    ],
    ceus: 1.8,
    badge: 'Accredited',
    enrolledStudentsCount: 1650,
    updatedAt: '2026-08-20',
    modules: [
      {
        id: 'mod-401',
        title: 'Module 1: The Decumulation Mindset & Safe Spending',
        description: 'How to switch from saver to confident spender without fear of running out.',
        lessons: [
          {
            id: 'les-401',
            title: 'De-mystifying the 4% Rule in Modern Market Conditions',
            duration: '28 min',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            summary: 'Why dynamic spending rules outperform rigid withdrawal rates.',
            notes: 'A three-bucket strategy (Cash for 1-2 years, Bonds for 3-7 years, Equities for 8+ years) provides psychological buffer.',
            isFreePreview: true
          }
        ]
      }
    ]
  },
  {
    id: 'course-5',
    slug: 'conversational-italian-culture-for-travelers',
    title: 'Conversational Italian & Mediterranean Culture for Travelers',
    subtitle: 'Learn to speak Italian with warmth, navigate trattorias and train stations, and appreciate Italy’s rich history.',
    description: 'Planning a dream trip to Tuscany, Sicily, or Rome? Or simply fascinated by the musicality of the Italian language? Professor Gianluigi Rossi brings the cobblestone piazzas of Italy right to your screen. This engaging, high-retention course focuses on practical, joyful conversational mastery: greeting locals with warmth, ordering artisanal wines and handmade pastas, asking for directions, and understanding Italian cultural gestures and traditions.',
    category: 'World Languages & Culture',
    level: 'Beginner',
    format: 'Online Self-Paced',
    duration: '8 Weeks (24 Hours total)',
    lecturesCount: 20,
    price: 52,
    originalPrice: 89,
    rating: 4.97,
    reviewsCount: 290,
    featured: false,
    popular: true,
    thumbnail: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80',
    instructorId: 'inst-5',
    tags: ['Italian', 'Travel', 'Languages', 'Culture', 'Culinary'],
    learningOutcomes: [
      'Speak essential Italian conversational phrases with authentic pronunciation',
      'Confidently order food, ask about dietary ingredients, and understand bills in Italy',
      'Navigate public transit, train ticket kiosks, and local taxi etiquette',
      'Understand regional Italian customs, coffee rituals, and historical etiquette'
    ],
    prerequisites: ['No prior knowledge of Italian or romance languages required.'],
    targetAudience: [
      'Travelers planning a holiday to Italy or Europe',
      'Lifelong language enthusiasts looking to stimulate cognitive agility'
    ],
    ceus: 2.5,
    badge: 'Popular',
    enrolledStudentsCount: 2150,
    updatedAt: '2026-09-10',
    modules: [
      {
        id: 'mod-501',
        title: 'Module 1: First Greetings & The Melody of Italian Vowels',
        description: 'Vowel pronunciation, formal vs informal greetings, and Italian phonetics.',
        lessons: [
          {
            id: 'les-501',
            title: 'Ciao, Buongiorno & Buonasera: Timing & Etiquette',
            duration: '18 min',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            summary: 'When to use Lei (formal) versus tu (informal) and how to greet shopkeepers upon entering.',
            notes: 'It is customary in Italy to say "Buongiorno" when entering a small boutique or pasticceria.',
            isFreePreview: true
          }
        ]
      }
    ]
  },
  {
    id: 'course-6',
    slug: 'creative-memoir-writing-family-stories',
    title: 'Creative Memoir Writing: Preserving Your Life Stories for Posterity',
    subtitle: 'Transform your cherished memories, historical moments, and family anecdotes into an enduring, beautifully written book.',
    description: 'Every life is a tapestry of historical epochs, personal triumphs, resilience, and unique wisdom. Your children, grandchildren, and future generations deserve to hear your authentic voice. In this nurturing, deeply satisfying workshop, Elena Rostova and guest literary mentors guide you through sensory memory triggers, dialogue writing, character sketching of ancestors, and structuring chapters so you finish with a keepsake family memoir.',
    category: 'Creative Arts & Expression',
    level: 'All Levels',
    format: 'In-Person Workshop',
    duration: '4 Weeks (12 Hours total)',
    lecturesCount: 10,
    price: 65,
    originalPrice: 110,
    rating: 4.93,
    reviewsCount: 165,
    featured: false,
    popular: false,
    thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
    instructorId: 'inst-2',
    tags: ['Writing', 'Memoir', 'Family History', 'Storytelling', 'Genealogy'],
    learningOutcomes: [
      'Organize life timeline milestones using sensory memory triggers',
      'Craft vivid dialogue that captures historical cadence and loved ones voices',
      'Format and self-publish small batch keepsake books for family distribution'
    ],
    prerequisites: ['Willingness to write by hand or computer. No previous publication experience necessary.'],
    targetAudience: [
      'Adults and retirees wishing to record their family history',
      'Aspiring writers wanting a supportive environment to practice craft'
    ],
    ceus: 1.5,
    badge: 'Community Favorite',
    enrolledStudentsCount: 1240,
    updatedAt: '2026-08-30',
    modules: [
      {
        id: 'mod-601',
        title: 'Module 1: Unlocking The Memory Vault',
        description: 'Using old photographs, scents, music, and heirloom objects to summon forgotten details.',
        lessons: [
          {
            id: 'les-601',
            title: 'The Sensory Archive: Smells, Sounds and Tastes of Childhood',
            duration: '22 min',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            summary: 'Techniques for triggering vivid episodic memories through sensory cues.',
            notes: 'Start with an object in your home. Describe its weight, texture, who gave it to you, and what room it lived in.',
            isFreePreview: true
          }
        ]
      }
    ]
  }
];

export const WORKSHOP_EVENTS: WorkshopEvent[] = [
  {
    id: 'evt-1',
    title: 'Live Q&A: Spotting Online Scams & Protecting Your Banking in 2026',
    description: 'Dr. Marcus Vance hosts an interactive 90-minute security clinic. Bring your questions about suspicious emails, fake SMS delivery alerts, two-factor authentication, and password managers.',
    instructorName: 'Dr. Marcus Vance',
    instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    date: 'Saturday, November 7, 2026',
    time: '10:00 AM - 11:30 AM EST',
    location: 'Interactive Live Zoom Session',
    format: 'Online',
    category: 'Technology & AI',
    seatsTotal: 100,
    seatsBooked: 76,
    isFree: true,
    tags: ['Cybersecurity', 'Free Clinic', 'Live Q&A']
  },
  {
    id: 'evt-2',
    title: 'Masterclass: Autumn Watercolor Leaves & Glazing Techniques',
    description: 'A hands-on painting afternoon with Elena Rostova. Paint alongside Elena in real-time as we mix deep ochres, burnt sienna, and crimson for maple and oak leaves.',
    instructorName: 'Elena Rostova, MFA',
    instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    date: 'Thursday, November 12, 2026',
    time: '2:00 PM - 4:30 PM EST',
    location: 'Studio Room 102, Main Campus & Online Stream',
    format: 'In-Person',
    category: 'Creative Arts & Expression',
    seatsTotal: 30,
    seatsBooked: 24,
    isFree: false,
    price: 25,
    tags: ['Watercolor', 'Hands-on', 'Workshop']
  },
  {
    id: 'evt-3',
    title: 'Longevity Seminar: The 4 Pillars of Brain Health & Memory Agility',
    description: 'Dr. Julian Sterling breaks down the newest peer-reviewed neuroscience on sleep hygiene, Mediterranean-DASH diets, social connection, and dual-task physical training.',
    instructorName: 'Dr. Julian Sterling, MD',
    instructorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
    date: 'Wednesday, November 18, 2026',
    time: '6:00 PM - 7:30 PM EST',
    location: 'Auditorium Hall B & Live Stream',
    format: 'Online',
    category: 'Health & Longevity',
    seatsTotal: 150,
    seatsBooked: 112,
    isFree: true,
    tags: ['Brain Health', 'Nutrition', 'Neuroscience']
  }
];

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'user-student',
    name: 'Eleanor Vance',
    email: 'eleanor.vance@example.com',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    bio: 'Retired high school biology teacher, passionate about watercolor painting, digital technology, and Italian travel.',
    interests: ['Technology & AI', 'Watercolor', 'Italian', 'Longevity']
  },
  {
    id: 'user-instructor',
    name: 'Dr. Marcus Vance',
    email: 'marcus.vance@continuum.edu',
    role: 'instructor',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Senior educator and curriculum director in computer science ethics and digital literacy.',
    interests: ['AI', 'Digital Safety', 'Curriculum Design']
  },
  {
    id: 'user-admin',
    name: 'Sophia Chen, Ed.D.',
    email: 'sophia.chen@continuum.edu',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    bio: 'Executive Director of Continuing Education & Lifelong Learning Academy.',
    interests: ['Lifelong Education', 'Institutional Analytics', 'Community Partnerships']
  }
];

export const CATEGORIES = [
  {
    id: 'all',
    name: 'កម្មវិធីទាំងអស់ (All Programs)',
    icon: 'Layers',
    description: 'កាតាឡុកកម្មវិធីសិក្សា និងការបណ្តុះបណ្តាលពេញមួយជីវិត'
  },
  {
    id: 'Digital Skills',
    name: 'ជំនាញឌីជីថល (Digital Skills)',
    icon: 'Cpu',
    description: 'AI, ស្មាតហ្វូន, សុវត្ថិភាពអ៊ីនធឺណិត និងធនាគារចល័ត'
  },
  {
    id: 'Literacy',
    name: 'អក្ខរកម្ម (Literacy)',
    icon: 'BookOpen',
    description: 'អក្ខរកម្មមុខងារ ការគិតលេខ និងការរៀនក្នុងគ្រួសារ'
  },
  {
    id: 'Agriculture',
    name: 'កសិកម្ម (Agriculture)',
    icon: 'Sprout',
    description: 'កសិកម្មឆ្លាតវៃ ប្រព័ន្ធដំណក់ទឹក និងជីធម្មជាតិ'
  },
  {
    id: 'Entrepreneurship',
    name: 'សហគ្រិនភាព (Entrepreneurship)',
    icon: 'Briefcase',
    description: 'ការចាប់ផ្តើមអាជីវកម្មខ្នាតតូច និងការលក់អនឡាញ'
  },
  {
    id: 'Vocational Skills',
    name: 'ជំនាញវិជ្ជាជីវៈ (Vocational Skills)',
    icon: 'Wrench',
    description: 'ថាមពលសូឡា ការកែច្នៃម្ហូបអាហារ និងជួសជុលអគ្គិសនី'
  }
];
