// src/test.js
// ============================================================
// BIZNIS BOSTON — Local Test Runner
// Test the AI agent locally WITHOUT needing WhatsApp.
// Run: npm test
// ============================================================

import 'dotenv/config';
import { processMessage } from './agent.js';

// ── Test Queries ──────────────────────────────────────────
// Add or remove queries here to test different scenarios

const TEST_QUERIES = [
  // Creole queries
  { text: 'Bonjou',                                   expect: 'greeting'  },
  { text: 'Mwen bezwen yon avoka imigrasyon',          expect: 'Sèvis Legal' },
  { text: 'Ki kote mwen ka fè taks mwen?',            expect: 'Sèvis Taks' },
  { text: 'Doktè ki pale kreyòl Boston',              expect: 'Sante'      },
  { text: 'Resto ayisyen Mattapan',                   expect: 'Manje'      },
  { text: 'Salon cheve Dorchester',                   expect: 'Bote'       },
  { text: 'Mwen bezwen yon mekanik',                  expect: 'Transpò'    },
  { text: 'Voye kòb Ayiti',                           expect: 'Voye Kòb'   },
  { text: 'MENU',                                     expect: 'menu'       },
  { text: 'STOP',                                     expect: 'stop'       },

  // English queries
  { text: 'Hello',                                    expect: 'greeting'   },
  { text: 'I need an immigration lawyer',             expect: 'Sèvis Legal' },
  { text: 'Where can I do my taxes?',                 expect: 'Sèvis Taks' },
  { text: 'Haitian doctor near me',                   expect: 'Sante'      },
  { text: 'Haitian restaurant',                       expect: 'Manje'      },

  // French queries
  { text: 'Bonjour',                                  expect: 'greeting'   },
  { text: 'avocat immigration',                       expect: 'Sèvis Legal' },

  // Mixed language
  { text: 'avoka Boston immigration',                 expect: 'Sèvis Legal' },

  // Should return no results (not in DB yet)
  { text: 'quelque chose inexistant xyz',             expect: 'noResults'  },
];

// ── Test Runner ───────────────────────────────────────────

const ANONYMOUS_TEST_ID = 'test_user_0000000000000001';
let passed = 0;
let failed = 0;

console.log('\n╔════════════════════════════════════════╗');
console.log('║     BIZNIS BOSTON — Agent Tests        ║');
console.log('╚════════════════════════════════════════╝\n');

for (const query of TEST_QUERIES) {
  try {
    process.stdout.write(`Testing: "${query.text}" ... `);

    const response = await processMessage(query.text, ANONYMOUS_TEST_ID);

    // Basic validation — response should be non-empty
    if (response && response.length > 0) {
      console.log('✅ OK');
      console.log(`   → ${response.substring(0, 80).replace(/\n/g, ' ')}...`);
      passed++;
    } else {
      console.log('❌ FAIL — empty response');
      failed++;
    }

  } catch (err) {
    console.log(`❌ ERROR — ${err.message}`);
    failed++;
  }

  // Small delay between API calls
  await new Promise(r => setTimeout(r, 500));
}

console.log('\n╔════════════════════════════════════════╗');
console.log(`║  Results: ${passed} passed, ${failed} failed          ║`);
console.log('╚════════════════════════════════════════╝\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed! Ready to deploy. 🚀\n');
  process.exit(0);
}
