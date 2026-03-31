(async () => {
  const prisma = require('../lib/prisma.ts').default;
  const bcrypt = require('bcryptjs');
  const email = 'manuel.magnani+parker@redify.co';
  const password = 'TempPassword123!';
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log(JSON.stringify({ exists: false }, null, 2));
    await prisma.$disconnect();
    return;
  }

  const passwordMatches = await bcrypt.compare(password, user.password || '');
  console.log(JSON.stringify({
    exists: true,
    activated: user.activated,
    email: user.email,
    name: user.name,
    lastname: user.lastname,
    passwordMatches,
  }, null, 2));
  await prisma.$disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
