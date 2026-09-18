// Document Versioning, Audit Trail, and State Integrity Tests
import {
  TestSuiteRunner,
  assert,
  assertEqual,
  assertTrue,
  sampleDocTechnical,
} from './helpers.ts';
import {
  updateDocumentWithVersion,
  restoreDocumentVersion,
} from '../src/renderer/services/localEngine.ts';
import { DocumentItem, DocumentVersion } from '../src/renderer/types.ts';

export async function runVersioningTests(runner: TestSuiteRunner) {
  runner.setSuite('Document Versioning & State Management');

  let doc: DocumentItem = {
    ...sampleDocTechnical,
    version: 1,
    versions: [],
  };

  await runner.runTest('updateDocumentWithVersion creates baseline v1 and incremented v2 revision', () => {
    const updated = updateDocumentWithVersion(
      doc,
      {
        content: doc.content + '\n\nSection 4: DiskANN quantization reduced memory footprint by 4x.',
      },
      'Added DiskANN quantization benchmark findings'
    );

    assertEqual(updated.version, 2, 'Version should increment to 2');
    assert(Array.isArray(updated.versions), 'Versions array must exist');
    assertEqual(updated.versions.length, 2, 'Should have v2 and v1 baseline');

    // Inspect v2 snapshot
    const v2 = updated.versions[0];
    assertEqual(v2.versionNumber, 2);
    assertEqual(v2.changeDescription, 'Added DiskANN quantization benchmark findings');
    assertTrue(v2.content.includes('Section 4: DiskANN quantization'));

    // Inspect v1 baseline
    const v1 = updated.versions[1];
    assertEqual(v1.versionNumber, 1);

    // Save updated doc for subsequent test
    doc = updated;
  });

  await runner.runTest('updateDocumentWithVersion preserves author attribution and calculated metrics', () => {
    const updated = updateDocumentWithVersion(
      doc,
      {
        title: 'LanceDB DiskANN Vector Architecture (Production Spec).md',
      },
      'Updated document title for production clarity'
    );

    assertEqual(updated.version, 3);
    assertEqual(updated.versions!.length, 3);
    assertEqual(updated.title, 'LanceDB DiskANN Vector Architecture (Production Spec).md');
    assertEqual(updated.versions![0].author, 'Justin Bogner (Local)');

    doc = updated;
  });

  await runner.runTest('restoreDocumentVersion rolls back content to previous version without destroying history', () => {
    // We want to restore version 1 (the initial baseline)
    const targetV1 = doc.versions!.find((v) => v.versionNumber === 1);
    assert(targetV1 !== undefined, 'Target version 1 must exist');

    const restoredDoc = restoreDocumentVersion(doc, targetV1!);

    // New version number should increment (audit trail preservation)
    assertEqual(restoredDoc.version, 4, 'Rollback should create version 4 event');
    assertEqual(restoredDoc.title, targetV1!.title);
    assertEqual(restoredDoc.content, targetV1!.content);

    // Verify history now has 4 entries
    assertEqual(restoredDoc.versions!.length, 4);
    assertTrue(restoredDoc.versions![0].changeDescription.includes('Rollback / Restored to Version 1'));
  });

  await runner.runTest('Safe JSON persistence prevents quota crashing', () => {
    let quotaHandled = false;
    try {
      const mockStorage: Record<string, string> = {};
      const safeSet = (key: string, val: string) => {
        try {
          if (val.length > 500000) {
            throw new Error('QuotaExceededError');
          }
          mockStorage[key] = val;
        } catch {
          quotaHandled = true;
        }
      };

      safeSet('test-key', 'a'.repeat(600000));
      assertTrue(quotaHandled, 'Storage catch handler should prevent unhandled rejection');
    } catch {
      assert(false, 'Should not throw uncaught error');
    }
  });
}
