const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to database...');
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully!');

    console.log('🏗️  Creating tables from schema...');
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
    console.log('✅ Tables created successfully!');

    console.log('🌱 Seeding Users...');
    await pool.query(`
      INSERT INTO users (username, secret_phrase) 
      VALUES ('piyush-300609', 'password - piyush'), ('tannu-qwerty', 'password - tannu') 
      ON CONFLICT (username) DO NOTHING;
    `);
    console.log('✅ Users seeded!');

    console.log('🌱 Seeding Decoy Notes...');
    await pool.query(`
      INSERT INTO notes (title, body, subject, chapter) VALUES 
      ('Kinematics - 1D Motion', 'Speed = Distance / Time\nVelocity = Displacement / Time\nAvg Velocity = Total Disp / Total Time\n\nEquations of motion (constant acceleration):\n1. v = u + at\n2. s = ut + 1/2 at^2\n3. v^2 = u^2 + 2as\n\nRemember: Acceleration due to gravity (g) is approx 9.8 m/s^2 downwards. Always check sign conventions!', 'physics', 'Kinematics'), 
      ('Chemical Bonding - VSEPR Theory', 'Valence Shell Electron Pair Repulsion Theory:\n- Electron pairs around central atom repel each other.\n- Geometry depends on number of bond pairs (bp) and lone pairs (lp).\n\nShapes:\n2 e- pairs (0 lp): Linear (e.g. BeCl2)\n3 e- pairs (0 lp): Trigonal Planar (BF3)\n4 e- pairs (0 lp): Tetrahedral (CH4)\n4 e- pairs (1 lp): Trigonal Pyramidal (NH3) - angle < 109.5 due to lp-bp repulsion.\n4 e- pairs (2 lp): Bent/V-shape (H2O) - angle ~ 104.5.', 'chemistry', 'Chemical Bonding'), 
      ('Trigonometry Formulas', 'Basic Identities:\nsin^2(x) + cos^2(x) = 1\n1 + tan^2(x) = sec^2(x)\n1 + cot^2(x) = csc^2(x)\n\nDouble Angle:\nsin(2x) = 2sin(x)cos(x)\ncos(2x) = cos^2(x) - sin^2(x) = 2cos^2(x) - 1 = 1 - 2sin^2(x)\ntan(2x) = 2tan(x) / (1 - tan^2(x))\n\nNeed to memorize the ASTC rule (All, Sin, Tan, Cos) for quadrants!', 'maths', 'Trigonometry')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Decoy notes seeded!');

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding or connection:', error.message);
    process.exit(1);
  }
}

seedDatabase();
