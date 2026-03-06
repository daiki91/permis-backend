/**
 * Script de test de connexion Supabase
 * Teste les 3 types de connexion possibles
 */

require('dotenv').config();
const { Client } = require('pg');

const configs = [
  {
    name: 'Transaction Pooler (port 6543)',
    connectionString: `postgresql://postgres.jbnlncweknkqjhuuqfaw:P%40sser2022Daiki@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false }
  },
  {
    name: 'Session Pooler (port 5432)',
    connectionString: `postgresql://postgres.jbnlncweknkqjhuuqfaw:P%40sser2022Daiki@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
    ssl: { rejectUnauthorized: false }
  },
  {
    name: 'Direct Connection (db.*.supabase.co)',
    connectionString: `postgresql://postgres:P%40sser2022Daiki@db.jbnlncweknkqjhuuqfaw.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false }
  }
];

async function testConnection(config) {
  console.log(`\n🔄 Test: ${config.name}`);
  console.log(`   URL: ${config.connectionString.replace(/:[^:]+@/, ':****@')}`);
  
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log(`   ✅ SUCCÈS - Connexion établie!`);
    
    // Test simple query
    const result = await client.query('SELECT version()');
    console.log(`   ✅ Query OK - PostgreSQL ${result.rows[0].version.split(' ')[1]}`);
    
    await client.end();
    return true;
  } catch (error) {
    console.log(`   ❌ ÉCHEC - ${error.message}`);
    if (error.code) {
      console.log(`   Code erreur: ${error.code}`);
    }
    return false;
  }
}

async function testAll() {
  console.log('═'.repeat(70));
  console.log('🧪 TEST DE CONNEXION SUPABASE');
  console.log('═'.repeat(70));
  
  let successCount = 0;
  
  for (const config of configs) {
    const success = await testConnection(config);
    if (success) successCount++;
  }
  
  console.log('\n' + '═'.repeat(70));
  if (successCount > 0) {
    console.log(`✅ ${successCount}/${configs.length} configuration(s) fonctionnelle(s)`);
    console.log('\n💡 Utilisez la configuration qui fonctionne dans votre .env!');
  } else {
    console.log('❌ Aucune configuration ne fonctionne');
    console.log('\n🔍 Actions recommandées:');
    console.log('   1. Vérifiez que le projet Supabase est actif (pas en pause)');
    console.log('   2. Allez sur: https://supabase.com/dashboard/project/jbnlncweknkqjhuuqfaw/settings/database');
    console.log('   3. Copiez la Connection String exacte depuis le dashboard');
    console.log('   4. Vérifiez la région (peut-être pas eu-central-1)');
    console.log('   5. Vérifiez votre connexion internet et pare-feu');
  }
  console.log('═'.repeat(70));
}

testAll();
