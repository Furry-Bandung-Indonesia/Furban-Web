const { execSync } = require('child_process');
const path = require('path');

function runCommand(command, cwd) {
  try {
    console.log(`Running: ${command} in ${cwd}`);
    execSync(command, { cwd, stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to run command: ${command}`);
    process.exit(1);
  }
}

console.log('Resetting Databases...');

// Reset Backend DB
runCommand('npx wrangler d1 execute DB --file=schema.sql --local', path.resolve(__dirname, '../../backend'));

// Reset Auth DB
runCommand('npx wrangler d1 execute DB --file=schema.sql --local', path.resolve(__dirname, '../'));

// Seed Auth DB
runCommand('npx wrangler d1 execute DB --file=seed_simulation.sql --local', path.resolve(__dirname, '../'));

console.log('Databases reset and seeded.');
