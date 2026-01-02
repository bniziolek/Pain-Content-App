import { storage } from "./storage";

export async function seedDatabase() {
  console.log("Seeding database...");

  // Seed content items
  const contentData = [
    {
      title: "Understanding Pain Pathways",
      summary: "How the nervous system processes danger signals and why hurt doesn't always mean harm.",
      body: "# Understanding Pain Pathways\n\nPain is not a simple signal from tissue damage. Learn how your nervous system creates the experience of pain and why it doesn't always correlate with actual tissue damage.",
      tags: ["Pain Neuroscience", "Central Sensitivity"],
      imageUrl: "/assets/generated_images/nervous_system_conceptual_art.png",
      readTime: "5 min",
    },
    {
      title: "Motion is Lotion",
      summary: "Why gentle movement is critical for recovery even when you feel discomfort.",
      body: "# Motion is Lotion\n\nDiscover why staying active is one of the best things you can do for recovery, even when movement feels uncomfortable.",
      tags: ["Movement Confidence", "Recovery"],
      imageUrl: "/assets/generated_images/healthy_person_stretching.png",
      readTime: "3 min",
    },
    {
      title: "The Spinal Structure Myth",
      summary: "Debunking common misconceptions about 'slipped discs' and spinal fragility.",
      body: "# The Spinal Structure Myth\n\nYour spine is strong and resilient. Let's dispel the myths about structural 'damage' that keep people stuck in fear.",
      tags: ["Anatomy", "Fear Avoidance"],
      imageUrl: "/assets/generated_images/abstract_spine_anatomy_illustration.png",
      readTime: "6 min",
    },
    {
      title: "Sleep & Recovery",
      summary: "The critical role of sleep in reducing inflammation and pain sensitivity.",
      body: "# Sleep & Recovery\n\nQuality sleep is your superpower for healing. Learn how sleep affects pain processing and inflammation.",
      tags: ["Sleep Hygiene", "Lifestyle"],
      imageUrl: "/assets/generated_images/brain_processing_signals.png",
      readTime: "4 min",
    },
    {
      title: "Stress & The Body",
      summary: "Understanding the biological link between psychological stress and physical symptoms.",
      body: "# Stress & The Body\n\nStress isn't just 'in your head' - it has real biological effects on pain, inflammation, and healing.",
      tags: ["Stress Management", "Central Sensitivity"],
      imageUrl: "/assets/generated_images/brain_processing_signals.png",
      readTime: "7 min",
    },
    {
      title: "Graded Exposure Therapy",
      summary: "A step-by-step guide to returning to activities you love without flaring up.",
      body: "# Graded Exposure Therapy\n\nLearn a systematic approach to gradually rebuilding confidence and capacity in movements you've been avoiding.",
      tags: ["Movement Confidence", "Recovery"],
      imageUrl: "/assets/generated_images/healthy_person_stretching.png",
      readTime: "5 min",
    },
  ];

  for (const content of contentData) {
    try {
      await storage.createContent(content);
      console.log(`Created content: ${content.title}`);
    } catch (error) {
      console.log(`Skipping existing content: ${content.title}`);
    }
  }

  console.log("Database seeded successfully!");
}
