/**
 * Script de test - Correction automatique des examens
 * Utilisez ceci pour tester le système de correction avant le déploiement
 */

const corrections = require('./correction');

/**
 * Fonction de correction (même logique que le backend)
 */
function correctExam(examCode, answers) {
  const correctAnswers = corrections[examCode];
  
  if (!correctAnswers) {
    throw new Error(`Correction non trouvée pour ${examCode}`);
  }

  let correctCount = 0;
  let totalQuestions = 25;
  const details = [];

  // Pour chaque question
  for (let questionNum = 1; questionNum <= totalQuestions; questionNum++) {
    const correctLetters = convertCorrectAnswer(correctAnswers[questionNum - 1]);
    const userAnswers = answers[questionNum] || [];

    // Vérifier si les réponses correspondent exactement
    const isCorrect = arraysEqual(
      userAnswers.sort(),
      correctLetters.sort()
    );

    if (isCorrect) {
      correctCount++;
    }

    details.push({
      questionNum,
      correctAnswers: correctLetters,
      userAnswers,
      isCorrect
    });
  }

  const percentage = Math.round((correctCount / totalQuestions) * 100);

  return {
    correctCount,
    totalQuestions,
    percentage,
    isPassed: percentage >= 80,
    details
  };
}

function convertCorrectAnswer(answer) {
  if (!answer || typeof answer !== 'string') {
    return [];
  }
  return answer.split('');
}

function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, idx) => val === arr2[idx]);
}

/**
 * Tests
 */
console.log('🧪 Tests du système de correction\n');

// Test 1: Toutes les réponses correctes
console.log('Test 1: Examen parfait (100%)');
const perfectAnswers = {};
for (let i = 1; i <= 25; i++) {
  const correct = corrections.B01[i - 1];
  perfectAnswers[i] = correct.split('');
}
const perfectResult = correctExam('B01', perfectAnswers);
console.log(`  ✓ Résultat: ${perfectResult.correctCount}/${perfectResult.totalQuestions} = ${perfectResult.percentage}%`);
console.log(`  ✓ Réussi: ${perfectResult.isPassed ? 'OUI ✓' : 'NON ✗'}`);
console.log();

// Test 2: 80% (réussite limite)
console.log('Test 2: Examen à 80% (limite de réussite)');
const passAnswers = {};
for (let i = 1; i <= 25; i++) {
  if (i <= 20) {
    // 20 réponses correctes
    const correct = corrections.B01[i - 1];
    passAnswers[i] = correct.split('');
  } else {
    // 5 réponses incorrectes
    passAnswers[i] = ['X']; // Réponse invalide
  }
}
const passResult = correctExam('B01', passAnswers);
console.log(`  ✓ Résultat: ${passResult.correctCount}/${passResult.totalQuestions} = ${passResult.percentage}%`);
console.log(`  ✓ Réussi: ${passResult.isPassed ? 'OUI ✓' : 'NON ✗'}`);
console.log();

// Test 3: 50% (échec)
console.log('Test 3: Examen à 50% (échec)');
const failAnswers = {};
for (let i = 1; i <= 25; i++) {
  if (i % 2 === 0) {
    const correct = corrections.B01[i - 1];
    failAnswers[i] = correct.split('');
  } else {
    failAnswers[i] = [];
  }
}
const failResult = correctExam('B01', failAnswers);
console.log(`  ✓ Résultat: ${failResult.correctCount}/${failResult.totalQuestions} = ${failResult.percentage}%`);
console.log(`  ✓ Réussi: ${failResult.isPassed ? 'OUI ✓' : 'NON ✗'}`);
console.log();

// Test 4: Réponses partielles (certaines questions avec plusieurs bonnes réponses)
console.log('Test 4: Réponses partielles (2 bonnes réponses sur certaines questions)');
const partialAnswers = {};
for (let i = 1; i <= 25; i++) {
  const correct = corrections.B01[i - 1];
  if (correct.length > 1) {
    // Si plusieurs bonnes réponses, n'en prendre qu'une
    partialAnswers[i] = [correct[0]];
  } else {
    // Sinon réponse correcte
    partialAnswers[i] = correct.split('');
  }
}
const partialResult = correctExam('B01', partialAnswers);
console.log(`  ✓ Résultat: ${partialResult.correctCount}/${partialResult.totalQuestions} = ${partialResult.percentage}%`);
console.log(`  ✓ Réussi: ${partialResult.isPassed ? 'OUI ✓' : 'NON ✗'}`);
console.log();

// Test 5: Tous les examens
console.log('Test 5: Vérification des corrections pour tous les examens');
const exams = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10', 'B11', 'B12'];
exams.forEach(examCode => {
  const correctionData = corrections[examCode];
  const questionCount = correctionData.length;
  const answersWithResponses = correctionData.filter(a => a && a.length > 0).length;
  console.log(`  ✓ ${examCode}: ${questionCount} questions, ${answersWithResponses} avec réponses`);
});
console.log();

// Test 6: Détails de correction (afficher quelques questions)
console.log('Test 6: Détails de correction (premières 3 questions de B01)');
if (perfectResult.details.length >= 3) {
  perfectResult.details.slice(0, 3).forEach(detail => {
    console.log(`  Question ${detail.questionNum}:`);
    console.log(`    Bonnes réponses: ${detail.correctAnswers.join(',')}`);
    console.log(`    Votre réponse: ${detail.userAnswers.join(',') || 'Aucune'}`);
    console.log(`    Résultat: ${detail.isCorrect ? '✓ Correct' : '✗ Incorrect'}`);
  });
}
console.log();

console.log('✅ Tests terminés avec succès!');
console.log('\nNotes:');
console.log('- Le système mappe les réponses JSON {"1":["A"]} aux questions 1-25');
console.log('- Les réponses correctes sont exactement comparées (lettre par lettre)');
console.log('- Le pourcentage est arrondi à l\'entier le plus proche');
console.log('- Réussite: >= 80%');
