/**
 * Script de test local pour l'endpoint de soumission
 * Usage: node test_submission_local.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000'; // Changez si votre port est différent
// const API_URL = 'https://permis-backend-6ddi.onrender.com'; // Pour tester en prod

async function testSubmission() {
  try {
    console.log('🧪 Test de soumission d\'examen...\n');

    // Créer un payload de test avec les 25 questions
    const payload = {
      userId: 1, // ID utilisateur de test
      examCode: 'B01',
      answers: {}
    };

    // Remplir toutes les 25 questions (quelques bonnes, quelques mauvaises)
    for (let i = 1; i <= 25; i++) {
      payload.answers[i.toString()] = i <= 20 ? ['A'] : []; // 20 réponses, 5 vides
    }

    console.log('📦 Payload:', {
      userId: payload.userId,
      examCode: payload.examCode,
      answersCount: Object.keys(payload.answers).length,
      sampleAnswers: Object.entries(payload.answers).slice(0, 3)
    });

    console.log('\n📡 Envoi de la requête...\n');

    const response = await axios.post(`${API_URL}/submissions/submit`, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Succès!');
    console.log('Status:', response.status);
    console.log('Réponse:', JSON.stringify(response.data, null, 2));

    if (response.data.data) {
      const { correctCount, totalQuestions, percentage, isPassed } = response.data.data;
      console.log('\n📊 Résultats:');
      console.log(`   Bonnes réponses: ${correctCount}/${totalQuestions}`);
      console.log(`   Pourcentage: ${percentage}%`);
      console.log(`   Réussi: ${isPassed ? '✅ OUI' : '❌ NON'}`);
    }

  } catch (error) {
    console.error('\n❌ Erreur lors du test:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Données:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Pas de réponse reçue. Le serveur est-il démarré?');
      console.error('Request:', error.request._currentUrl);
    } else {
      console.error('Erreur:', error.message);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Le serveur ne répond pas. Vérifiez que:');
      console.error('   1. Le serveur est démarré (node server.js)');
      console.error('   2. L\'URL est correcte:', API_URL);
    }
  }
}

// Exécuter le test
testSubmission();
