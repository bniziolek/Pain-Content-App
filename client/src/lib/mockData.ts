const spineImage = '/images/abstract_spine_anatomy_illustration.png';
const nerveImage = '/images/nervous_system_conceptual_art.png';
const stretchImage = '/images/healthy_person_stretching.png';
const brainImage = '/images/brain_processing_signals.png';

export const currentUser = {
  id: 'user_1',
  name: 'Dr. Sarah Mitchell',
  email: 'sarah.mitchell@clinic.com',
  role: 'clinician',
  subscriptionStatus: 'active', // 'active' | 'inactive'
};

export const stats = {
  sendsThisWeek: 24,
  sendsGrowth: '+12%',
  activeAssessments: 8,
  completionRate: '76%',
  topTags: ['Central Sensitivity', 'Sleep Hygiene', 'Movement Confidence']
};

export const contentItems = [
  {
    id: 'c1',
    title: 'Understanding Pain Pathways',
    summary: 'How the nervous system processes danger signals and why hurt doesn\'t always mean harm.',
    tags: ['Pain Neuroscience', 'Central Sensitivity'],
    image: nerveImage,
    readTime: '5 min'
  },
  {
    id: 'c2',
    title: 'Motion is Lotion',
    summary: 'Why gentle movement is critical for recovery even when you feel discomfort.',
    tags: ['Movement Confidence', 'Recovery'],
    image: stretchImage,
    readTime: '3 min'
  },
  {
    id: 'c3',
    title: 'The Spinal Structure Myth',
    summary: 'Debunking common misconceptions about "slipped discs" and spinal fragility.',
    tags: ['Anatomy', 'Fear Avoidance'],
    image: spineImage,
    readTime: '6 min'
  },
  {
    id: 'c4',
    title: 'Sleep & Recovery',
    summary: 'The critical role of sleep in reducing inflammation and pain sensitivity.',
    tags: ['Sleep Hygiene', 'Lifestyle'],
    image: brainImage,
    readTime: '4 min'
  },
  {
    id: 'c5',
    title: 'Stress & The Body',
    summary: 'Understanding the biological link between psychological stress and physical symptoms.',
    tags: ['Stress Management', 'Central Sensitivity'],
    image: brainImage,
    readTime: '7 min'
  },
  {
    id: 'c6',
    title: 'Graded Exposure Therapy',
    summary: 'A step-by-step guide to returning to activities you love without flaring up.',
    tags: ['Movement Confidence', 'Recovery'],
    image: stretchImage,
    readTime: '5 min'
  }
];

export const assessmentInvites = [
  {
    id: 'inv_1',
    patientEmail: 'james.wilson@example.com',
    status: 'Completed',
    date: '2024-05-14',
    result: 'High Central Sensitivity'
  },
  {
    id: 'inv_2',
    patientEmail: 'elena.rodriguez@example.com',
    status: 'Sent',
    date: '2024-05-15',
    result: '-'
  },
  {
    id: 'inv_3',
    patientEmail: 'michael.chang@example.com',
    status: 'Opened',
    date: '2024-05-16',
    result: '-'
  },
  {
    id: 'inv_4',
    patientEmail: 'sarah.connor@example.com',
    status: 'Completed',
    date: '2024-05-12',
    result: 'Fear Avoidance'
  }
];

export const internalScreenings = [
  {
    id: 'scr_1',
    patientName: 'David Kim',
    date: '2024-05-18',
    notes: 'Patient reports high anxiety about lifting.',
    result: 'Fear Avoidance'
  },
  {
    id: 'scr_2',
    patientName: 'Emma Watson',
    date: '2024-05-17',
    notes: 'Screened during follow-up.',
    result: 'Movement Confidence'
  }
];

export const assessmentQuestions = [
  {
    id: 'q1',
    text: "When I feel pain, I worry that something serious is wrong.",
    type: 'scale',
    minLabel: 'Never',
    maxLabel: 'Always'
  },
  {
    id: 'q2',
    text: "I avoid physical activity because I might get hurt.",
    type: 'scale',
    minLabel: 'Never',
    maxLabel: 'Always'
  },
  {
    id: 'q3',
    text: "My pain moves around to different parts of my body.",
    type: 'yes_no'
  },
  {
    id: 'q4',
    text: "How would you rate your sleep quality over the past week?",
    type: 'scale',
    minLabel: 'Very Poor',
    maxLabel: 'Excellent'
  }
];
