const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('fs');

async function runTests() {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  // Connect to a locally running emulator on 127.0.0.1:8080
  const testEnv = await initializeTestEnvironment({ projectId: 'prabha-skin', firestore: { host: '127.0.0.1', port: 8080, rules } });

  const alice = testEnv.authenticatedContext('aliceUid');
  const admin = testEnv.authenticatedContext('adminUid', { admin: true });
  const aliceDb = alice.firestore();
  const adminDb = admin.firestore();

  // Test 1: alice can create her own payment request
  await assertSucceeds(aliceDb.collection('paymentRequests').doc('pay_alice_1').set({ id: 'pay_alice_1', userId: 'aliceUid', createdAt: new Date().toISOString() }));

  // Test 2: alice cannot update status field
  await assertFails(aliceDb.collection('paymentRequests').doc('pay_alice_1').update({ status: 'approved' }));

  // Test 3: admin can update status
  await assertSucceeds(adminDb.collection('paymentRequests').doc('pay_alice_1').update({ status: 'approved' }));

  console.log('All Firestore rule tests passed');
  await testEnv.cleanup();
}

runTests().catch((e) => {
  console.error('Tests failed:', e);
  process.exit(1);
});
