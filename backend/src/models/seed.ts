import bcrypt from 'bcryptjs';
import { db } from './db';
import { ragService } from '../services/ragService';
import { SAMPLE_COLLEGE_DOCS } from '../data/sampleDocuments';

export async function seedDemoData(): Promise<void> {
  try {
    const existingDemo = db.findUserByEmail('alex.student@college.edu');
    let demoUser = existingDemo;

    if (!demoUser) {
      console.log('[Seed] Creating demo user alex.student@college.edu...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('college123', salt);

      demoUser = db.createUser({
        name: 'Alex Johnson',
        email: 'alex.student@college.edu',
        passwordHash,
      });
      console.log(`[Seed] Demo user created with ID: ${demoUser._id}`);
    }

    // Check if demo user has documents
    const userDocs = db.findDocumentsByUserId(demoUser._id);
    if (userDocs.length === 0) {
      console.log('[Seed] Seeding sample college documents for demo user...');
      for (const sample of SAMPLE_COLLEGE_DOCS) {
        const buffer = Buffer.from(sample.content, 'utf-8');
        const doc = db.createDocument({
          userId: demoUser._id,
          filename: sample.filename,
          originalName: sample.originalName,
          fileType: sample.fileType,
          fileSize: buffer.length,
          status: 'Processing',
          chunkCount: 0,
        });

        await ragService.processAndIndexDocument(
          doc._id,
          demoUser._id,
          buffer,
          sample.originalName,
          'txt'
        );
      }
      console.log('[Seed] Sample college documents indexed successfully.');
    }

    // Startup check: Recover any documents left in 'Processing' state
    const allDocs = db.getAllDocuments();
    const processingDocs = allDocs.filter(d => d.status === 'Processing');
    if (processingDocs.length > 0) {
      console.log(`[Startup Recovery] Found ${processingDocs.length} documents in Processing state. Recovering...`);
      for (const doc of processingDocs) {
        try {
          // Check if sample doc
          const sample = SAMPLE_COLLEGE_DOCS.find(s => s.filename === doc.filename);
          if (sample) {
            const buffer = Buffer.from(sample.content, 'utf-8');
            await ragService.processAndIndexDocument(doc._id, doc.userId, buffer, sample.originalName, 'txt');
            continue;
          }

          // Check if on disk in uploads
          const fs = await import('fs');
          const path = await import('path');
          const uploadDir = path.join(process.cwd(), 'uploads');
          if (fs.existsSync(uploadDir)) {
            const files = fs.readdirSync(uploadDir);
            const matchedFile = files.find(f => f.startsWith(`${doc._id}_`));
            if (matchedFile) {
              const fileBuffer = fs.readFileSync(path.join(uploadDir, matchedFile));
              const ext = doc.fileType || path.extname(doc.filename).replace('.', '') || 'txt';
              await ragService.processAndIndexDocument(doc._id, doc.userId, fileBuffer, doc.originalName || doc.filename, ext);
              continue;
            }
          }

          // If no file buffer available, mark as Failed so it does not stay in Processing forever
          db.updateDocument(doc._id, {
            status: 'Failed',
            error: 'Document processing was interrupted. Please retry indexing.',
          });
        } catch (recoverErr: any) {
          console.error(`[Startup Recovery] Error recovering document ${doc._id}:`, recoverErr);
        }
      }
    }
  } catch (err) {
    console.error('[Seed] Failed to seed demo data:', err);
  }
}
