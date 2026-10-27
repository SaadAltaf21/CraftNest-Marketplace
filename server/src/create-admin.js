// Usage: npm run create-admin -- --email you@example.com --password 'StrongPass123' --name 'Your Name'
// Creates the FIRST admin only if no admin exists. Otherwise it promotes an existing user only
// when called with an existing email — never use this to self-promote in production without owner approval.
require('dotenv').config();
const { connectDB } = require('./config/db');
const { User } = require('./models');
function arg(name) { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : null; }
async function main() {
  const email = (arg('email') || '').toLowerCase();
  const password = arg('password'); const name = arg('name') || 'Admin';
  if (!email || !password || password.length < 8) { console.error('Usage: npm run create-admin -- --email you@example.com --password StrongPass123 --name "Your Name" (password min 8 chars)'); process.exit(1); }
  await connectDB();
  const existingAdmin = await User.findOne({ role: 'admin' });
  let user = await User.findOne({ email });
  if (user) {
    if (existingAdmin && String(existingAdmin._id) !== String(user._id)) { console.error('An admin already exists. Refusing to create another via this script.'); process.exit(1); }
    user.role = 'admin'; user.password = password; await user.save();
    console.log(`Promoted existing user ${email} to admin.`);
  } else {
    if (existingAdmin) { console.error('An admin already exists. Refusing to create another via this script.'); process.exit(1); }
    await User.create({ name, email, password, role: 'admin' });
    console.log(`Created first admin ${email}.`);
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
