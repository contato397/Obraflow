import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";
import { createRequire } from 'module';
import { v4 as uuidv4 } from 'uuid';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Database
const db = new Database('obraflow.db');

// Database Schema Initialization
db.exec(`
  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE,
    description TEXT,
    unit TEXT,
    family TEXT,
    attributes JSON,
    rules JSON,
    logistics JSON,
    fiscal JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT,
    location TEXT,
    rating REAL,
    categories JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS memorials (
    id TEXT PRIMARY KEY,
    group_id TEXT,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT 0,
    name TEXT,
    content_text TEXT,
    original_filename TEXT,
    file_path TEXT,
    status TEXT DEFAULT 'pending', -- pending, processed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS requirements (
    id TEXT PRIMARY KEY,
    memorial_id TEXT,
    group_id TEXT, -- To track requirements across versions
    section TEXT,
    description TEXT,
    extracted_attributes JSON,
    match_status TEXT DEFAULT 'unmatched', -- unmatched, matched, manual
    matched_material_id TEXT,
    confidence_score REAL,
    FOREIGN KEY(memorial_id) REFERENCES memorials(id),
    FOREIGN KEY(matched_material_id) REFERENCES materials(id)
  );

  CREATE TABLE IF NOT EXISTS budget_items (
    id TEXT PRIMARY KEY,
    requirement_id TEXT,
    material_id TEXT,
    quantity REAL,
    unit_price REAL,
    taxes REAL,
    freight REAL,
    total_cost REAL,
    status TEXT DEFAULT 'draft',
    FOREIGN KEY(requirement_id) REFERENCES requirements(id),
    FOREIGN KEY(material_id) REFERENCES materials(id)
  );
`);

try {
  db.prepare('ALTER TABLE memorials ADD COLUMN file_path TEXT').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE memorials ADD COLUMN group_id TEXT').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE memorials ADD COLUMN version INTEGER DEFAULT 1').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE memorials ADD COLUMN is_active BOOLEAN DEFAULT 0').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE requirements ADD COLUMN group_id TEXT').run();
} catch (e) {}

// Initialize existing data if needed
db.prepare("UPDATE memorials SET group_id = id WHERE group_id IS NULL").run();
// Set the latest memorial of each group as active if none are active
db.prepare(`
  UPDATE memorials 
  SET is_active = 1 
  WHERE id IN (
    SELECT id FROM (
      SELECT id, group_id, ROW_NUMBER() OVER(PARTITION BY group_id ORDER BY created_at DESC) as rn
      FROM memorials
      WHERE group_id NOT IN (SELECT group_id FROM memorials WHERE is_active = 1)
    ) WHERE rn = 1
  )
`).run();

// Seed some data if empty
const materialsCount = db.prepare('SELECT count(*) as count FROM materials').get() as { count: number };
if (materialsCount.count === 0) {
  const seedMaterials = [
    {
      id: uuidv4(),
      code: 'MAT-001',
      description: 'Cimento Portland CP II-Z 32',
      unit: 'kg',
      family: 'Estrutural',
      attributes: JSON.stringify({ type: 'Cimento', strength: '32MPa', standard: 'NBR 11578' }),
      rules: JSON.stringify({ allowed_uses: ['Reboque', 'Contrapiso', 'Concreto simples'] }),
      logistics: JSON.stringify({ weight_kg: 50, packaging: 'Saco 50kg' }),
      fiscal: JSON.stringify({ ncm: '25232910' })
    },
    {
      id: uuidv4(),
      code: 'MAT-002',
      description: 'Cabo Flexível 2.5mm² 750V',
      unit: 'm',
      family: 'Elétrica',
      attributes: JSON.stringify({ type: 'Cabo', voltage: '750V', section: '2.5mm²', color: 'Various' }),
      rules: JSON.stringify({ standard: 'NBR NM 247-3' }),
      logistics: JSON.stringify({ weight_kg: 0.03, packaging: 'Rolo 100m' }),
      fiscal: JSON.stringify({ ncm: '85444921' })
    },
    {
      id: uuidv4(),
      code: 'MAT-003',
      description: 'Argamassa Colante AC-III',
      unit: 'kg',
      family: 'Revestimentos',
      attributes: JSON.stringify({ type: 'Argamassa', class: 'AC-III', usage: 'Interno/Externo' }),
      rules: JSON.stringify({ standard: 'NBR 14081' }),
      logistics: JSON.stringify({ weight_kg: 20, packaging: 'Saco 20kg' }),
      fiscal: JSON.stringify({ ncm: '38245000' })
    },
    {
      id: uuidv4(),
      code: 'MAT-004',
      description: 'Tijolo Cerâmico 9x19x19',
      unit: 'un',
      family: 'Alvenaria',
      attributes: JSON.stringify({ type: 'Tijolo', dimensions: '9x19x19cm', material: 'Cerâmica' }),
      rules: JSON.stringify({ standard: 'NBR 15270' }),
      logistics: JSON.stringify({ weight_kg: 2.5, packaging: 'Pallet' }),
      fiscal: JSON.stringify({ ncm: '69041000' })
    },
    {
      id: uuidv4(),
      code: 'MAT-005',
      description: 'Tinta Acrílica Fosca Branco Neve',
      unit: 'L',
      family: 'Pintura',
      attributes: JSON.stringify({ type: 'Tinta', finish: 'Fosco', color: 'Branco Neve', usage: 'Interno/Externo' }),
      rules: JSON.stringify({ standard: 'NBR 11702' }),
      logistics: JSON.stringify({ weight_kg: 18, packaging: 'Lata 18L' }),
      fiscal: JSON.stringify({ ncm: '32091010' })
    },
    {
      id: uuidv4(),
      code: 'MAT-006',
      description: 'Disjuntor Termomagnético Monopolar 16A',
      unit: 'un',
      family: 'Elétrica',
      attributes: JSON.stringify({ type: 'Disjuntor', current: '16A', poles: '1', curve: 'C' }),
      rules: JSON.stringify({ standard: 'NBR NM 60898' }),
      logistics: JSON.stringify({ weight_kg: 0.1, packaging: 'Caixa' }),
      fiscal: JSON.stringify({ ncm: '85362000' })
    }
  ];

  const insertMaterial = db.prepare(`
    INSERT INTO materials (id, code, description, unit, family, attributes, rules, logistics, fiscal)
    VALUES (@id, @code, @description, @unit, @family, @attributes, @rules, @logistics, @fiscal)
  `);

  seedMaterials.forEach(mat => insertMaterial.run(mat));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());
  const upload = multer({ storage: multer.memoryStorage() });

  // API Routes

  // 1. Materials API
  app.get('/api/materials', (req, res) => {
    const stmt = db.prepare('SELECT * FROM materials');
    const materials = stmt.all();
    res.json(materials.map((m: any) => ({
      ...m,
      attributes: JSON.parse(m.attributes || '{}'),
      rules: JSON.parse(m.rules || '{}'),
      logistics: JSON.parse(m.logistics || '{}'),
      fiscal: JSON.parse(m.fiscal || '{}')
    })));
  });

  app.post('/api/materials', (req, res) => {
    const { code, description, unit, family, attributes, rules, logistics, fiscal } = req.body;
    const id = uuidv4();
    try {
      const stmt = db.prepare(`
        INSERT INTO materials (id, code, description, unit, family, attributes, rules, logistics, fiscal)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, code, description, unit, family, JSON.stringify(attributes), JSON.stringify(rules), JSON.stringify(logistics), JSON.stringify(fiscal));
      res.json({ id, success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Memorials API
  app.get('/api/memorials', (req, res) => {
    // Get latest active version for each group, or just the latest if none active
    const stmt = db.prepare(`
      SELECT * FROM memorials 
      WHERE id IN (
        SELECT id FROM (
          SELECT id, group_id, ROW_NUMBER() OVER(PARTITION BY group_id ORDER BY is_active DESC, version DESC) as rn
          FROM memorials
        ) WHERE rn = 1
      )
      ORDER BY created_at DESC
    `);
    res.json(stmt.all());
  });

  app.get('/api/memorials/:groupId/versions', (req, res) => {
    const { groupId } = req.params;
    const stmt = db.prepare('SELECT * FROM memorials WHERE group_id = ? ORDER BY version DESC');
    res.json(stmt.all(groupId));
  });

  app.post('/api/memorials/:id/activate', (req, res) => {
    const { id } = req.params;
    const memorial = db.prepare('SELECT group_id FROM memorials WHERE id = ?').get(id) as any;
    if (!memorial) return res.status(404).json({ error: 'Memorial not found' });

    db.transaction(() => {
      db.prepare('UPDATE memorials SET is_active = 0 WHERE group_id = ?').run(memorial.group_id);
      db.prepare('UPDATE memorials SET is_active = 1 WHERE id = ?').run(id);
    })();

    res.json({ success: true });
  });

  app.get('/api/memorials/compare/:id1/:id2', async (req, res) => {
    const { id1, id2 } = req.params;
    const mem1 = db.prepare('SELECT * FROM memorials WHERE id = ?').get(id1) as any;
    const mem2 = db.prepare('SELECT * FROM memorials WHERE id = ?').get(id2) as any;

    if (!mem1 || !mem2) return res.status(404).json({ error: 'Memorial(s) not found' });

    const reqs1 = db.prepare('SELECT * FROM requirements WHERE memorial_id = ?').all(id1) as any[];
    const reqs2 = db.prepare('SELECT * FROM requirements WHERE memorial_id = ?').all(id2) as any[];

    res.json({ success: true, mem1, mem2, reqs1, reqs2 });
  });

  app.post('/api/memorials/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const id = uuidv4();
    const groupId = req.body.group_id || id;
    let version = 1;

    if (req.body.group_id) {
        const lastVersion = db.prepare('SELECT MAX(version) as v FROM memorials WHERE group_id = ?').get(req.body.group_id) as { v: number };
        version = (lastVersion.v || 0) + 1;
    }

    let textContent = '';
    const uploadDir = path.join(__dirname, 'uploads');
    
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir);
    }

    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${id}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    try {
      // Save file to disk
      fs.writeFileSync(filePath, req.file.buffer);

      if (req.file.mimetype === 'application/pdf') {
        const parser = new PDFParse({ data: req.file.buffer });
        const data = await parser.getText();
        textContent = data.text;
        await parser.destroy();
      } else {
        textContent = req.file.buffer.toString('utf-8');
      }

      const stmt = db.prepare('INSERT INTO memorials (id, group_id, version, is_active, name, content_text, original_filename, file_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      const isActive = version === 1 ? 1 : 0; // First version is active by default
      stmt.run(id, groupId, version, isActive, req.body.name || req.file.originalname, textContent, req.file.originalname, `/uploads/${fileName}`);

      res.json({ id, groupId, version, success: true });
    } catch (error: any) {
      console.error("Upload Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/memorials/:id/download', (req, res) => {
    const { id } = req.params;
    const memorial = db.prepare('SELECT * FROM memorials WHERE id = ?').get(id) as any;
    
    if (!memorial || !memorial.file_path) {
        return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(__dirname, memorial.file_path);
    if (fs.existsSync(filePath)) {
        res.download(filePath, memorial.original_filename);
    } else {
        res.status(404).json({ error: 'File not found on server' });
    }
  });

  // 3. Extraction & Requirements API (The AI Part)
  app.get('/api/requirements', (req, res) => {
    const stmt = db.prepare('SELECT * FROM requirements');
    const reqs = stmt.all();
    res.json(reqs.map((r: any) => ({
      ...r,
      extracted_attributes: JSON.parse(r.extracted_attributes || '{}')
    })));
  });

  app.get('/api/requirements/pending', (req, res) => {
    const stmt = db.prepare(`
      SELECT r.*, m.name as memorial_name 
      FROM requirements r 
      LEFT JOIN memorials m ON r.memorial_id = m.id 
      WHERE r.match_status = 'unmatched'
    `);
    const reqs = stmt.all();
    res.json(reqs.map((r: any) => ({
      ...r,
      extracted_attributes: JSON.parse(r.extracted_attributes || '{}')
    })));
  });

  app.get('/api/memorials/:id/content', (req, res) => {
    const { id } = req.params;
    const memorial = db.prepare('SELECT content_text FROM memorials WHERE id = ?').get(id) as any;
    
    if (!memorial) return res.status(404).json({ error: 'Memorial not found' });
    
    res.json({ success: true, content_text: memorial.content_text });
  });

  app.post('/api/memorials/:id/requirements', (req, res) => {
    const { id } = req.params;
    const { requirements } = req.body;

    if (!requirements || !Array.isArray(requirements)) {
      return res.status(400).json({ error: 'Invalid requirements format' });
    }

    const memorial = db.prepare('SELECT group_id FROM memorials WHERE id = ?').get(id) as any;
    if (!memorial) return res.status(404).json({ error: 'Memorial not found' });

    try {
      // Save to requirements table
      const insertReq = db.prepare(`
        INSERT INTO requirements (id, memorial_id, group_id, section, description, extracted_attributes, match_status)
        VALUES (?, ?, ?, ?, ?, ?, 'unmatched')
      `);

      const createdReqs = [];
      for (const item of requirements) {
        const reqId = uuidv4();
        insertReq.run(reqId, id, memorial.group_id, item.section, item.description, JSON.stringify(item.attributes));
        createdReqs.push({ ...item, id: reqId });
      }

      // Update memorial status
      db.prepare("UPDATE memorials SET status = 'processed' WHERE id = ?").run(id);

      res.json({ success: true, requirements: createdReqs });
    } catch (error: any) {
      console.error("Save Requirements Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/memorials/:id/requirements', (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM requirements WHERE memorial_id = ?');
    const reqs = stmt.all(id);
    res.json(reqs.map((r: any) => ({
      ...r,
      extracted_attributes: JSON.parse(r.extracted_attributes || '{}')
    })));
  });

  // 4. Matching API
  app.post('/api/requirements/:id/match', (req, res) => {
    const { id } = req.params;
    const { material_id } = req.body;
    
    const stmt = db.prepare('UPDATE requirements SET matched_material_id = ?, match_status = ? WHERE id = ?');
    stmt.run(material_id, 'matched', id);
    res.json({ success: true });
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
