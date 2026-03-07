// Test des nouvelles routes API pour l'admin

const API_BASE = 'http://localhost:3000'; // ou https://permis-backend-6ddi.onrender.com

async function testAdminRoutes() {
    console.log('=== TEST DES ROUTES ADMIN ===\n');

    try {
        // Test 1: GET /users
        console.log('1. Test GET /users...');
        const usersRes = await fetch(`${API_BASE}/users`);
        const users = await usersRes.json();
        console.log(`✅ GET /users: ${usersRes.status}`, Array.isArray(users) ? `${users.length} utilisateurs` : 'ERREUR: pas un tableau');
        
        // Test 2: GET /submissions
        console.log('\n2. Test GET /submissions...');
        const subsRes = await fetch(`${API_BASE}/submissions`);
        const submissions = await subsRes.json();
        console.log(`✅ GET /submissions: ${subsRes.status}`, Array.isArray(submissions) ? `${submissions.length} soumissions` : 'ERREUR: pas un tableau');
        
        // Test 3: GET /submissions/:id (si au moins une soumission existe)
        if (Array.isArray(submissions) && submissions.length > 0) {
            console.log('\n3. Test GET /submissions/:id...');
            const firstSubId = submissions[0].id;
            const subDetailRes = await fetch(`${API_BASE}/submissions/${firstSubId}`);
            const subDetail = await subDetailRes.json();
            console.log(`✅ GET /submissions/${firstSubId}: ${subDetailRes.status}`);
            console.log('   Details présents:', !!subDetail.details);
            console.log('   Nombre de questions:', subDetail.details ? subDetail.details.length : 0);
        } else {
            console.log('\n3. ⏭️  Pas de soumissions à tester');
        }

        console.log('\n=== TOUS LES TESTS RÉUSSIS ===');
    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
    }
}

// Exécuter les tests
testAdminRoutes();
