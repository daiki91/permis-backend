/**
 * Script de test PRODUCTION pour l'endpoint de soumission sur Render
 * Usage: node test_submission_render.js
 */

// Utiliser fetch natif de Node.js 18+
const fetch = globalThis.fetch || require('node-fetch');

const API_URL = 'https://permis-backend-6ddi.onrender.com';

async function testSubmission() {
  try {
    console.log('🧪 Test de soumission en PRODUCTION sur Render...\n');

    // Créer un payload de test avec les 25 questions
    const payload = {
      userId: 1, // ID utilisateur de test
      examCode: 'B01',
      answers: {}
    };

    // Remplir toutes les 25 questions
    for (let i = 1; i <= 25; i++) {
      // Simuler quelques réponses
      if (i <= 20) {
        payload.answers[i.toString()] = i % 2 === 0 ? ['A'] : ['B'];
      } else {
        payload.answers[i.toString()] = []; // Questions non répondues
      }
    }

    console.log('📦 Payload:', {
      userId: payload.userId,
      examCode: payload.examCode,
      answersCount: Object.keys(payload.answers).length,
      sampleAnswers: Object.entries(payload.answers).slice(0, 5)
    });

    console.log('\n📡 Envoi de la requête à:', API_URL);
    console.log('⏳ Cela peut prendre quelques secondes...\n');

    const startTime = Date.now();
    const response = await fetch(`${API_URL}/submissions/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const duration = Date.now() - startTime;

    const data = await response.json();

    if (!response.ok) {
      throw { response: { status: response.status, data } };
    }

    console.log(`✅ Succès! (${duration}ms)`);
    console.log('Status:', response.status);
    console.log('\n📄 Réponse complète:');
    console.log(JSON.stringify(data, null, 2));

    if (data.data) {
      const { correctCount, totalQuestions, percentage, isPassed } = data.data;
      console.log('\n📊 Résultats de l\'examen:');
      console.log(`   Bonnes réponses: ${correctCount}/${totalQuestions}`);
      console.log(`   Pourcentage: ${percentage}%`);
      console.log(`   Statut: ${isPassed ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'}`);
      
      if (data.data.details) {
        console.log('\n🔍 Détails (5 premières questions):');
        data.data.details.slice(0, 5).forEach(q => {
          const icon = q.isCorrect ? '✅' : '❌';
          console.log(`   ${icon} Q${q.questionNum}: Réponse: ${q.userAnswers.join(',') || '-'} | Correct: ${q.correctAnswers.join(',')}`);
        });
      }
    }

  } catch (error) {
    console.error('\n❌ Erreur lors du test:');
    
    if (error.response) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('📊 Réponse du serveur:');
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data?.message || 'Pas de message');
      console.error('\n📄 Données complètes:');
      console.error(JSON.stringify(error.response.data, null, 2));
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (error.response.status === 500) {
        console.error('\n💡 Erreur 500 - Vérifiez les logs Render:');
        console.error('   → https://dashboard.render.com');
        console.error('   → Allez dans votre service');
        console.error('   → Cliquez sur "Logs"');
        console.error('   → Cherchez "=== SUBMISSION ERROR ==="');
      }
    } else if (error.name === 'FetchError' || error.code === 'ECONNREFUSED') {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('🌐 Pas de réponse reçue du serveur');
      console.error('   URL:', API_URL);
      console.error('   Erreur:', error.message);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('\n💡 Vérifications:');
      console.error('   1. Le service Render est-il déployé?');
      console.error('   2. L\'URL est-elle correcte?');
      console.error('   3. Le serveur répond-il? (timeout?)');
    } else {
      console.error('Erreur:', error.message);
      if (error.stack) console.error('Stack:', error.stack);
    }
  }
}

// Exécuter le test
console.log('═══════════════════════════════════════════════');
console.log('  Test de Soumission - Production Render');
console.log('═══════════════════════════════════════════════\n');

testSubmission().then(() => {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  Fin du test');
  console.log('═══════════════════════════════════════════════');
});
