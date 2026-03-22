
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Note from './models/Note.js';

dotenv.config();

const SEED_USER_ID = '000000000000000000000001';

const notes = [
  {
    title: "AI-Driven Productivity: Mastering your Focus",
    description: "Learn how to leverage Sentience's AI features to maximize your study blocks.",
    content: "Productivity isn't about doing more; it's about doing what matters. Use the Focus Mode timer to break your work into 25-minute sprints (Pomodoro technique). Our AI analyzes your mood and focus levels to suggest optimal break times. Remember: Consistency beats intensity.",
    category: "Productivity",
    tags: ["AI", "Focus", "Study"],
    privacy: "global",
    author: {
      id: SEED_USER_ID,
      name: "Sentience Team",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sentience"
    }
  },
  {
    title: "The Science of Sentience: Understanding Mindfulness",
    description: "A guide to maintaining mental clarity during hectic exam seasons.",
    content: "Sentience is more than just a name; it's about awareness. When tracking your mood, pay attention to the environmental factors. Are you more stressed in the library or at home? Use the Mood Tracker to correlate your environment with your emotional state.",
    category: "Wellbeing",
    tags: ["Mindfulness", "Mental Health", "Sentience"],
    privacy: "global",
    author: {
      id: SEED_USER_ID,
      name: "Sentience Team",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sentience"
    }
  },
  {
    title: "Student Wellbeing: Balancing Academics and Life",
    description: "Why your GPA isn't the only thing that matters this semester.",
    content: "Burnout is real. We built the Study Planner to help you see your week at a glance. If your 'Self-Care' category is empty, you're doing it wrong. Balance your task tracker with non-academic goals—like exercise or social time.",
    category: "Wellbeing",
    tags: ["Balance", "Health", "Student Life"],
    privacy: "global",
    author: {
      id: SEED_USER_ID,
      name: "Sentience Team",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sentience"
    }
  },
  {
    title: "Digital Detox: Why Offline Time Matters",
    description: "Escaping the screen to recharge your cognitive batteries.",
    content: "Your brain needs down-time. Research shows that 'unstructured thought' is where creativity happens. Every 2 hours of Sentience usage, try 15 minutes of being completely offline. No phone, no laptop. Just you and your thoughts.",
    category: "Productivity",
    tags: ["Digital Detox", "Creativity", "Offline"],
    privacy: "global",
    author: {
      id: SEED_USER_ID,
      name: "Sentience Team",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sentience"
    }
  },
  {
    title: "The Power of Habit Tracking",
    description: "How small daily actions lead to massive long-term results.",
    content: "Atomic habits are the building blocks of success. Use the Task Tracker to set recurring small goals. It's better to study for 20 minutes every day than 10 hours once a week. Let Sentience help you visualize your streaks.",
    category: "Self-Improvement",
    tags: ["Habits", "Growth", "Consistency"],
    privacy: "global",
    author: {
      id: SEED_USER_ID,
      name: "Sentience Team",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sentience"
    }
  },
  {
    title: "Collaborative Learning in the Digital Age",
    description: "Using the Global Notes hub to learn from your community.",
    content: "Explaining a concept to someone else is the best way to learn it. Use NotesHub to publish your study guides to 'Global' privacy. Not only does it help others, but it solidifies your own understanding through teaching.",
    category: "Education",
    tags: ["Community", "Learning", "Collaboration"],
    privacy: "global",
    author: {
      id: SEED_USER_ID,
      name: "Sentience Team",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sentience"
    }
  },
  {
    title: "Sentience App: A User's Guide to Success",
    description: "Get started with the ultimate wellbeing and productivity toolkit.",
    content: "Welcome to Sentience! This platform is your secondary brain. Start by creating a private note, then set a timer in Focus Mode. As you use the app, your personalized dashboard will start showing trends in your productivity and mood.",
    category: "Tutorial",
    tags: ["Getting Started", "Guide", "App Tips"],
    privacy: "global",
    author: {
      id: SEED_USER_ID,
      name: "Sentience Team",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sentience"
    }
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for seeding...");
    
    // Check if seed notes already exist to avoid duplicates
    const existing = await Note.find({ 'author.id': SEED_USER_ID });
    if (existing.length > 0) {
      console.log("Seed notes already exist. Skipping.");
      process.exit(0);
    }
    
    await Note.insertMany(notes);
    console.log("✅ Successfully seeded 7 Global Notes!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
};

seedDB();
