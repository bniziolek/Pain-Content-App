import { storage } from "./storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { seedPermissions } from "./rbac";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  console.log("Seeding database...");

  // Create admin user for testing
  try {
    const existingAdmin = await storage.getUserByEmail("admin@driverpath.com");
    if (!existingAdmin) {
      await storage.createUser({
        email: "admin@driverpath.com",
        password: await hashPassword("admin123"),
        name: "Admin User",
        role: "admin",
        subscriptionStatus: "active",
        subscriptionPeriodEnd: new Date("9999-12-31"),
      });
      console.log("Created admin user: admin@driverpath.com / admin123 (perpetual subscription)");
    } else if (existingAdmin.role !== "admin" || existingAdmin.subscriptionStatus !== "active") {
      // Update existing admin to have correct role and perpetual subscription
      await storage.updateUserRole(existingAdmin.id, "admin");
      await storage.updateUserSubscription(existingAdmin.id, {
        subscriptionStatus: "active",
        subscriptionPeriodEnd: new Date("9999-12-31"),
      });
      console.log("Updated admin user with perpetual subscription");
    }
  } catch (error) {
    console.log("Admin user setup error:", error);
  }

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

  // Seed template follow-up rules
  const templateRules = [
    {
      name: "3-Day No View Reminder",
      triggerType: "no_view",
      triggerDays: 3,
      action: "send_reminder",
      message: "We noticed you haven't had a chance to view the educational materials we sent. These resources can be really helpful for your recovery journey.",
      isTemplate: true,
      templateKey: "no_view_3day",
    },
    {
      name: "5-Day Partial View Follow-up",
      triggerType: "partial_view",
      triggerDays: 5,
      action: "send_reminder",
      message: "We see you started reviewing your educational materials. There's more helpful content waiting for you whenever you're ready.",
      isTemplate: true,
      templateKey: "partial_view_5day",
    },
    {
      name: "7-Day Check-in Reminder",
      triggerType: "time_based",
      triggerDays: 7,
      action: "send_reminder",
      message: "It's been a week since we sent your educational materials. Just a friendly reminder that these resources are here to support your recovery.",
      isTemplate: true,
      templateKey: "time_based_7day",
    },
  ];

  for (const rule of templateRules) {
    try {
      const existingTemplates = await storage.getTemplateFollowUpRules();
      const exists = existingTemplates.some(t => t.templateKey === rule.templateKey);
      if (!exists) {
        await storage.createFollowUpRule(rule as any);
        console.log(`Created template rule: ${rule.name}`);
      }
    } catch (error) {
      console.log(`Skipping existing template rule: ${rule.name}`);
    }
  }

  // Seed RBAC permissions
  try {
    await seedPermissions();
    console.log("Permissions seeded");
  } catch (error) {
    console.log("Permissions seeding error:", error);
  }

  // Seed data inventory for PHI classification
  const dataInventoryItems = [
    {
      dataAssetName: "Patient Email Addresses",
      tableName: "email_logs",
      fieldName: "patient_email",
      dataClassification: "PHI",
      description: "Email addresses of patients receiving educational content",
      containsPhi: true,
      phiTypes: ["email"],
      encryptedAtRest: true,
      encryptedInTransit: true,
      retentionDays: 2555, // 7 years
      disposalMethod: "secure_delete",
      accessRoles: ["clinician", "admin"],
    },
    {
      dataAssetName: "Patient Names",
      tableName: "patient_pathways",
      fieldName: "patient_name",
      dataClassification: "PHI",
      description: "Names of patients enrolled in care pathways",
      containsPhi: true,
      phiTypes: ["name"],
      encryptedAtRest: true,
      encryptedInTransit: true,
      retentionDays: 2555,
      disposalMethod: "secure_delete",
      accessRoles: ["clinician", "admin"],
    },
    {
      dataAssetName: "Assessment Responses",
      tableName: "assessment_responses",
      fieldName: "answers",
      dataClassification: "PHI",
      description: "Patient responses to health assessments",
      containsPhi: true,
      phiTypes: ["health_data", "assessment_scores"],
      encryptedAtRest: true,
      encryptedInTransit: true,
      retentionDays: 2555,
      disposalMethod: "secure_delete",
      accessRoles: ["clinician", "admin"],
    },
    {
      dataAssetName: "Internal Screening Data",
      tableName: "internal_screenings",
      fieldName: "answers",
      dataClassification: "PHI",
      description: "Clinician-conducted assessment results",
      containsPhi: true,
      phiTypes: ["name", "health_data", "assessment_scores"],
      encryptedAtRest: true,
      encryptedInTransit: true,
      retentionDays: 2555,
      disposalMethod: "secure_delete",
      accessRoles: ["clinician", "admin"],
    },
    {
      dataAssetName: "Access Codes",
      tableName: "email_logs",
      fieldName: "access_code_hash",
      dataClassification: "Sensitive",
      description: "Hashed access codes for patient portal authentication",
      containsPhi: false,
      phiTypes: [],
      encryptedAtRest: true,
      encryptedInTransit: true,
      retentionDays: 365,
      disposalMethod: "secure_delete",
      accessRoles: ["admin"],
    },
    {
      dataAssetName: "Clinician Credentials",
      tableName: "users",
      fieldName: "password",
      dataClassification: "Sensitive",
      description: "Hashed passwords for clinician accounts",
      containsPhi: false,
      phiTypes: [],
      encryptedAtRest: true,
      encryptedInTransit: true,
      retentionDays: null,
      disposalMethod: "secure_delete",
      accessRoles: ["admin"],
    },
    {
      dataAssetName: "Audit Logs",
      tableName: "audit_logs",
      fieldName: null,
      dataClassification: "Internal",
      description: "System audit trail for compliance tracking",
      containsPhi: false,
      phiTypes: [],
      encryptedAtRest: true,
      encryptedInTransit: true,
      retentionDays: 2555, // 7 years for HIPAA
      disposalMethod: "archive",
      accessRoles: ["admin"],
    },
    {
      dataAssetName: "Educational Content",
      tableName: "content_items",
      fieldName: null,
      dataClassification: "Internal",
      description: "Educational materials for patient education",
      containsPhi: false,
      phiTypes: [],
      encryptedAtRest: true,
      encryptedInTransit: true,
      retentionDays: null,
      disposalMethod: "archive",
      accessRoles: ["clinician", "admin", "readonly"],
    },
  ];

  try {
    const existingInventory = await storage.getDataInventory();
    for (const item of dataInventoryItems) {
      const exists = existingInventory.some(i => i.dataAssetName === item.dataAssetName);
      if (!exists) {
        await storage.createDataInventoryItem(item as any);
        console.log(`Created data inventory: ${item.dataAssetName}`);
      }
    }
    console.log("Data inventory seeded");
  } catch (error) {
    console.log("Data inventory seeding error:", error);
  }

  console.log("Database seeded successfully!");
}
