
import pg from "pg";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    console.log("Running migration for Issue #64...");

    const queries = [
        `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS "clinician_user_id" VARCHAR REFERENCES users(id);`,
        `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS "moderation_status" TEXT NOT NULL DEFAULT 'approved';`,
        `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS "moderation_note" TEXT;`,
        `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMP;`
    ];

    for (const query of queries) {
        try {
            console.log(`Executing: ${query}`);
            await pool.query(query);
            console.log("Success.");
        } catch (error) {
            console.error(`Error executing query: ${query}`, error);
        }
    }

    console.log("Migration complete.");
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
