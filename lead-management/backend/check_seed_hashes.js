const bcrypt = require('bcrypt');

const run = async () => {
  const rohanHash = '$2b$10$336a1wmukS822PNzz1r1ZeR26KaI1rqp/hxGVox9NNUgI.tZWQT1K';
  const aaravHash = '$2b$10$G77HSuuBN8RRh/U5JnVvLeb6N6ZuZ3IRI6wwOq/.10C6WuKZMRKZe';

  const testPasswords = [
    'BM@12345', 'Admin@123', 'TL@12345', 'Dev@12345',
    'password', 'password123', '123456', 'rohan', 'aarav',
    'rohan.verma', 'aarav.mehta', 'rohan@123', 'aarav@123',
    'Rohan@123', 'Aarav@123', 'Rohan@12345', 'Aarav@12345'
  ];

  console.log('--- Rohan ---');
  for (const pw of testPasswords) {
    const match = await bcrypt.compare(pw, rohanHash);
    if (match) console.log(`Rohan matches: "${pw}"`);
  }

  console.log('--- Aarav ---');
  for (const pw of testPasswords) {
    const match = await bcrypt.compare(pw, aaravHash);
    if (match) console.log(`Aarav matches: "${pw}"`);
  }
};

run();
