import { TemplateItem } from '../types';

export const JOURNAL_TEMPLATES: TemplateItem[] = [
  {
    id: 'daily-reflection',
    title: 'Daily Reflection',
    category: 'daily',
    emoji: '🌸',
    description: 'A calming check-in to reflect on your day, feelings, and mindful moments.',
    defaultTags: ['Daily', 'Reflection', 'Mindfulness'],
    initialContent: `## 🌸 Today's Check-In

### 🌤️ How I am feeling right now:
- 

### ✨ Highlights & Meaningful Moments:
- 
- 

### 💭 A thought that lingered with me today:
- 

### 🌿 What I learned about myself:
- 

### 🌙 Tomorrow's gentle intention:
- `,
  },
  {
    id: 'night-journal',
    title: 'Night Journal',
    category: 'mindfulness',
    emoji: '🌙',
    description: 'Unwind your mind, release lingering stress, and prepare for a restful sleep.',
    defaultTags: ['Night', 'Unwind', 'Peace'],
    initialContent: `## 🌙 Evening Unwind & Release

### 🫖 Releasing Today's Weight:
- What challenged me today that I choose to let go of before sleeping?
  

### 🕯️ 3 Peaceful Things from Today:
1. 
2. 
3. 

### 💤 Bedtime Thought:
- `,
  },
  {
    id: 'gratitude',
    title: 'Gratitude Garden',
    category: 'mindfulness',
    emoji: '❤️',
    description: 'Nurture appreciation for the small, beautiful details and people in your life.',
    defaultTags: ['Gratitude', 'Joy', 'Appreciation'],
    initialContent: `## ❤️ Gratitude Journal

### 🌷 3 Small Joys I Felt Today:
1. 
2. 
3. 

### 💌 Someone I am Grateful For & Why:
- 

### 🎁 An unexpected gift or pleasant surprise:
- 

### ☀️ A simple everyday comfort I often overlook:
- `,
  },
  {
    id: 'goals',
    title: 'Goals & Intentions',
    category: 'growth',
    emoji: '🎯',
    description: 'Clarify your priorities, define actionable steps, and stay aligned with purpose.',
    defaultTags: ['Goals', 'Focus', 'Productivity'],
    initialContent: `## 🎯 Goals & Mindful Ambitions

### 🧭 Core Focus Area:
- 

### 🏆 What success looks like this week:
- 

### 🪜 3 Tiny Steps I Can Take Today:
- [ ] 
- [ ] 
- [ ] 

### 🛡️ Potential obstacles and how I will navigate them:
- `,
  },
  {
    id: 'brainstorm',
    title: 'Creative Brainstorm',
    category: 'creative',
    emoji: '💡',
    description: 'Unleash raw ideas, mind-maps, wild sparks, and novel possibilities.',
    defaultTags: ['Ideas', 'Brainstorm', 'Creativity'],
    initialContent: `## 💡 Creative Spark & Brainstorm

### ⚡ The Core Idea / Spark:
- 

### 🌊 Stream of Consciousness & Possibilities:
- What if...
- Another wild angle:
- 

### 🎨 Visual / Mood associations:
- 

### 💎 The most promising nugget to explore with Gemini:
- `,
  },
  {
    id: 'study-journal',
    title: 'Study Journal',
    category: 'academic',
    emoji: '📚',
    description: 'Log your learning progress, simplify difficult concepts, and track insights.',
    defaultTags: ['Study', 'Learning', 'Notes'],
    initialContent: `## 📚 Study & Knowledge Log

### 📖 Topic Studied:
- 

### 🧠 Core Concepts Mastered (Explain Like I am 10):
- 

### ❓ Unresolved Questions to Investigate:
- 

### ⏱️ Study Session Rating & Energy Level:
- Focus score: /10
- Next study milestone: `,
  },
  {
    id: 'campus-life',
    title: 'Campus Life & Friends',
    category: 'academic',
    emoji: '🎓',
    description: 'Capture student memories, lectures, conversations, and campus moments.',
    defaultTags: ['Campus', 'Friends', 'University'],
    initialContent: `## 🎓 Campus Life Notes

### 🏫 Classes & Lectures Today:
- 

### 👥 Conversations & Shared Laughs:
- 

### ☕ Cafeteria / Library spot of the day:
- 

### 🎒 Upcoming deadlines & campus events:
- `,
  },
  {
    id: 'work-journal',
    title: 'Work & Professional Log',
    category: 'work',
    emoji: '💻',
    description: 'Organize your workday, accomplishments, meeting insights, and strategic priorities.',
    defaultTags: ['Work', 'Career', 'Projects'],
    initialContent: `## 💻 Work Log & Retrospective

### 🚀 Key Accomplishments Today:
- 
- 

### 🤝 Key Decisions & Collaborations:
- 

### 🚧 Roadblocks & Solutions:
- 

### 📌 Top 3 Priorities for Tomorrow:
1. 
2. 
3. `,
  },
  {
    id: 'nature-journal',
    title: 'Nature & Solitude',
    category: 'lifestyle',
    emoji: '🌿',
    description: 'Connect with the outdoors, weather, seasons, and tranquil natural spaces.',
    defaultTags: ['Nature', 'Outdoors', 'Peace'],
    initialContent: `## 🌿 Nature & Sensory Walk

### 🌤️ Weather, Sky & Atmosphere:
- 

### 🌲 Sounds, Sights & Scents noticed:
- Sights: 
- Sounds: 
- Scents: 

### 🍃 How being in nature shifted my perspective:
- `,
  },
  {
    id: 'coffee-thoughts',
    title: 'Coffee & Cozy Thoughts',
    category: 'lifestyle',
    emoji: '☕',
    description: 'A relaxing slow-morning or cafe writing session with your favorite warm drink.',
    defaultTags: ['Coffee', 'Morning', 'Cozy'],
    initialContent: `## ☕ Cafe Thoughts & Slow Morning

### 🥐 Current Drink & Atmosphere:
- Drink: 
- Mood of the room: 

### ☕ What is flowing through my mind right now:
- 

### 📖 A quote or line that inspired me:
- `,
  },
  {
    id: 'travel-journal',
    title: 'Travel & Adventures',
    category: 'lifestyle',
    emoji: '✈️',
    description: 'Document travels, places visited, delicious food tasted, and unforgettable adventures.',
    defaultTags: ['Travel', 'Adventure', 'Memories'],
    initialContent: `## ✈️ Travel Diary

### 📍 Location & Setting:
- City / Spot: 

### 🗺️ What I explored today:
- 

### 🍜 Memorable food or flavors:
- 

### 📸 A snapshot in words I never want to forget:
- `,
  },
  {
    id: 'free-writing',
    title: 'Free Stream of Consciousness',
    category: 'creative',
    emoji: '📝',
    description: 'Unfiltered, open-ended writing without rules, structure, or judgment.',
    defaultTags: ['FreeWriting', 'Raw', 'Unfiltered'],
    initialContent: `## 📝 Free Writing

*(Write freely without pausing or editing yourself...)*

`,
  },
  {
    id: 'personal-growth',
    title: 'Personal Growth & Healing',
    category: 'growth',
    emoji: '🌱',
    description: 'Examine emotional habits, celebrate self-compassion, and nurture personal growth.',
    defaultTags: ['Growth', 'SelfLove', 'Healing'],
    initialContent: `## 🌱 Personal Growth Reflection

### 🌿 A boundary I respected or practiced:
- 

### 💖 A moment I showed myself kindness instead of criticism:
- 

### 🪞 What is my inner child needing from me right now?
- 

### 🌟 Words of encouragement for myself:
- `,
  },
  {
    id: 'happy-moments',
    title: 'Happy Moments & Scrapbook',
    category: 'daily',
    emoji: '⭐',
    description: 'Celebrate wins, giggles, wholesome moments, and radiant gratitude.',
    defaultTags: ['Happy', 'Joy', 'Memories'],
    initialContent: `## ⭐ Pure Happy Moments

### ☀️ The happiest minute of today:
- 

### 😂 Something that made me smile or laugh:
- 

### 🏆 A small personal victory:
- 

### 💌 Keep this feeling safe:
- `,
  },
];
