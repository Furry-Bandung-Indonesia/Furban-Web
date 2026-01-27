const bcrypt = require('bcryptjs');

const passwords = [
  'Admin123!',
  'Photo123!',
  'Publish123!',
  'User1234!'
];

passwords.forEach(p => {
  const hash = bcrypt.hashSync(p, 10);
  console.log(`${p} -> ${hash}`);
});
