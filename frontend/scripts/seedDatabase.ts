import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Import pure TS rules and static data
import { OFFICIAL_WEBSITE_RULES } from '../src/data/temples/rules/officialWebsiteRules';
import { OFFICIAL_HELPLINE_RULES } from '../src/data/temples/rules/officialHelplineRules';
import { DARSHAN_DETAILS_RULES } from '../src/data/temples/rules/darshanDetailsRules';
import { FACILITIES_RULES } from '../src/data/temples/rules/facilitiesRules';
import { VISITOR_GUIDELINES_RULES } from '../src/data/temples/rules/visitorGuidelinesRules';
import { AUTHENTIC_TEMPLE_DETAILS_RULES } from '../src/data/temples/rules/authenticTempleDetailsRules';
import { SPECIAL_TEMPLE_DATA } from '../src/data/templeStaticData';
import { FALLBACK_TEMPLE_BY_ID } from '../src/data/templeFallbackData';

// Connect to the SQLite DB created by Alembic in backend/
const dbPath = path.join(__dirname, '../../backend/brahmand.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Helper to generate slug
const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Helper to find temple UUID by matching keywords
function findTempleId(templeMap: Map<string, string>, condition: { any?: string[], all?: string[] }): string | null {
  const keywords = [...(condition.any || []), ...(condition.all || [])].map(k => k.toLowerCase());
  for (const [name, id] of templeMap.entries()) {
    const nameLower = name.toLowerCase();
    if (keywords.length > 0 && keywords.some(k => nameLower.includes(k))) {
      // Verify ID actually exists in database
      const row = db.prepare(`SELECT id FROM temples WHERE id = ?`).get(id);
      if (row) return id;
    }
  }
  return null;
}

function seed() {
  console.log('🌱 Starting SQLite seed...');
  
  // Wipe existing data for idempotency
  db.pragma('foreign_keys = OFF');
  const tables = [
    'temples', 'temple_metadata', 'temple_aliases', 'temple_official_links',
    'temple_darshan_details', 'temple_facilities', 'temple_visitor_guidelines',
    'temple_guideline_points', 'temple_festivals', 'temple_aarti_sessions', 'temple_media'
  ];
  for (const table of tables) {
    db.exec(`DELETE FROM ${table};`);
  }
  db.pragma('foreign_keys = ON');
  
  console.log('🧹 Cleared existing tables.');

  const templeMap = new Map<string, string>(); // name -> uuid
  const counts = { temples: 0, websites: 0, helplines: 0, darshan: 0, facilities: 0, guidelines: 0, metadata: 0, media: 0 };

  // 1. SEED BASE TEMPLES
  const templeEntries: { name: string; deity?: string; description?: string; guidance?: string; coords?: { latitude: number; longitude: number }; youtubeUrl?: string }[] = [];
  
  for (const [name, data] of Object.entries(SPECIAL_TEMPLE_DATA)) {
    const d = data as any;
    templeEntries.push({
      name,
      deity: d.deity || '',
      description: d.description,
      guidance: d.guidance,
      coords: d.coords,
      youtubeUrl: d.youtubeUrl,
    });
  }

  for (const [key, data] of Object.entries(FALLBACK_TEMPLE_BY_ID)) {
    if (data.name && !templeEntries.some(t => t.name === data.name)) {
      templeEntries.push({
        name: data.name,
        deity: data.deity,
        description: data.description,
        guidance: data.guidance || '',
        coords: data.coords,
        youtubeUrl: data.youtubeUrl,
      });
    }
  }

  const insertTemple = db.prepare(`
    INSERT OR IGNORE INTO temples (id, slug, name, deity, category, description, guidance, latitude, longitude, location_country, is_verified, is_active, version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'India', 1, 1, 1)
  `);

  const insertManyTemples = db.transaction(() => {
    for (const data of templeEntries) {
      const id = uuidv4();
      templeMap.set(data.name, id);
      const slug = slugify(data.name);
      
      const info = insertTemple.run(
        id, slug, data.name, 
        data.deity || '', 
        'sacred', 
        data.description || '', 
        data.guidance || '', 
        data.coords?.latitude || null, 
        data.coords?.longitude || null
      );
      if (info.changes > 0) {
        counts.temples++;

        // Seed YouTube URLs into temple_media if present
        if (data.youtubeUrl) {
          const mediaId = uuidv4();
          const mediaType = data.youtubeUrl.includes('live_stream') ? 'live_stream' : 'video';
          db.prepare(`INSERT INTO temple_media (id, temple_id, media_type, url, sort_order, is_active) VALUES (?, ?, ?, ?, 0, 1)`).run(mediaId, id, mediaType, data.youtubeUrl);
          counts.media++;
        }
      } else {
        // If temple already existed, retrieve existing ID
        const row = db.prepare(`SELECT id FROM temples WHERE slug = ?`).get(slug) as { id: string } | undefined;
        if (row) {
          templeMap.set(data.name, row.id);
        }
      }
    }
  });
  insertManyTemples();

  // 2. SEED OFFICIAL WEBSITES
  const insertLink = db.prepare(`INSERT INTO temple_official_links (id, temple_id, link_type, value, is_verified) VALUES (?, ?, ?, ?, 1)`);
  for (const rule of OFFICIAL_WEBSITE_RULES) {
    const templeId = findTempleId(templeMap, rule.condition);
    if (templeId) {
      insertLink.run(uuidv4(), templeId, 'website', rule.website);
      counts.websites++;
    }
  }

  // 3. SEED OFFICIAL HELPLINES
  for (const rule of OFFICIAL_HELPLINE_RULES) {
    const templeId = findTempleId(templeMap, rule.condition);
    if (templeId) {
      insertLink.run(uuidv4(), templeId, 'helpline', rule.helpline);
      counts.helplines++;
    }
  }

  // 4. SEED DARSHAN DETAILS
  const insertDarshan = db.prepare(`INSERT INTO temple_darshan_details (id, temple_id, opening_time, closing_time, general_darshan, vip_darshan) VALUES (?, ?, ?, ?, ?, ?)`);
  for (const rule of DARSHAN_DETAILS_RULES) {
    const templeId = findTempleId(templeMap, rule.condition);
    if (templeId) {
      insertDarshan.run(uuidv4(), templeId, rule.darshan.opening, rule.darshan.closing, rule.darshan.generalDarshan, rule.darshan.vipDarshan);
      counts.darshan++;
    }
  }

  // 5. SEED FACILITIES
  const insertFacility = db.prepare(`INSERT OR IGNORE INTO temple_facilities (id, temple_id, facility_key, sort_order, is_active) VALUES (?, ?, ?, ?, 1)`);
  for (const rule of FACILITIES_RULES) {
    const templeId = findTempleId(templeMap, rule.condition);
    if (templeId) {
      rule.facilities.forEach((fac, idx) => insertFacility.run(uuidv4(), templeId, fac, idx));
      counts.facilities += rule.facilities.length;
    }
  }

  // 6. SEED VISITOR GUIDELINES
  const insertGuideline = db.prepare(`INSERT INTO temple_visitor_guidelines (id, temple_id, language_code, icon, title, sort_order, is_active) VALUES (?, ?, 'en', ?, ?, ?, 1)`);
  const insertPoint = db.prepare(`INSERT INTO temple_guideline_points (id, guideline_id, point_text, sort_order) VALUES (?, ?, ?, ?)`);
  
  for (const rule of VISITOR_GUIDELINES_RULES) {
    const templeId = findTempleId(templeMap, rule.condition);
    if (templeId) {
      rule.guidelines.forEach((g, idx) => {
        const gId = uuidv4();
        insertGuideline.run(gId, templeId, g.icon, g.title, idx);
        g.points.forEach((p, pIdx) => insertPoint.run(uuidv4(), gId, p, pIdx));
        counts.guidelines++;
      });
    }
  }

  // 7. SEED AUTHENTIC METADATA
  const insertMeta = db.prepare(`INSERT OR IGNORE INTO temple_metadata (id, temple_id, language_code, about, history, architecture) VALUES (?, ?, 'en', ?, ?, ?)`);
  for (const rule of AUTHENTIC_TEMPLE_DETAILS_RULES) {
    const templeId = findTempleId(templeMap, rule.condition);
    if (templeId) {
      insertMeta.run(uuidv4(), templeId, rule.details.about, rule.details.history, rule.details.architecture);
      counts.metadata++;
    }
  }

  console.log('\n✅ SEED COMPLETE!');
  console.log(`Temples: ${counts.temples}`);
  console.log(`Websites: ${counts.websites}`);
  console.log(`Helplines: ${counts.helplines}`);
  console.log(`Darshan: ${counts.darshan}`);
  console.log(`Facilities: ${counts.facilities}`);
  console.log(`Guidelines: ${counts.guidelines}`);
  console.log(`Metadata: ${counts.metadata}`);
  console.log(`Media: ${counts.media}`);
  
  db.close();
}

seed();
