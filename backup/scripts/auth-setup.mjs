/**
 * Idempotently sets up the "Kunde" role + policy + permissions
 * and enables Directus public registration.
 *
 * Directus 11 model: Roles -> Policies (via directus_access) -> Permissions.
 */
import { directus } from './directus.mjs';
import {
  readRoles,
  createRole,
  readPolicies,
  createPolicy,
  customEndpoint,
  readPermissions,
  createPermission,
  readSettings,
  updateSettings,
} from '@directus/sdk';

const ROLE_NAME = 'Kunde';
const POLICY_NAME = 'Kunde Policy';

async function ensureRole() {
  const existing = await directus.request(readRoles({ filter: { name: { _eq: ROLE_NAME } }, limit: 1 }));
  if (existing.length) {
    console.log(`  ✓ role ${ROLE_NAME} (${existing[0].id})`);
    return existing[0].id;
  }
  const created = await directus.request(
    createRole({
      name: ROLE_NAME,
      icon: 'person',
      description: 'Endkunde der Website. Kann eigene Daten bearbeiten und Touren buchen.',
    }),
  );
  console.log(`  + created role ${ROLE_NAME} (${created.id})`);
  return created.id;
}

async function ensurePolicy() {
  const existing = await directus.request(readPolicies({ filter: { name: { _eq: POLICY_NAME } }, limit: 1 }));
  if (existing.length) {
    console.log(`  ✓ policy ${POLICY_NAME} (${existing[0].id})`);
    return existing[0].id;
  }
  const created = await directus.request(
    createPolicy({
      name: POLICY_NAME,
      icon: 'badge',
      description: 'Berechtigungen für Endkunden',
      app_access: false,
      admin_access: false,
    }),
  );
  console.log(`  + created policy ${POLICY_NAME} (${created.id})`);
  return created.id;
}

async function ensureAccess(roleId, policyId) {
  // directus_access is a system collection; readItems/createItem are blocked for it.
  // Use customEndpoint (raw REST) instead.
  const existing = await directus.request(
    customEndpoint({
      path: '/access',
      method: 'GET',
      params: { 'filter[role][_eq]': roleId, 'filter[policy][_eq]': policyId, limit: 1 },
    }),
  );
  if (existing.length) {
    console.log(`  ✓ access link role↔policy`);
    return;
  }
  await directus.request(
    customEndpoint({
      path: '/access',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: roleId, policy: policyId, sort: 1 }),
    }),
  );
  console.log(`  + linked role↔policy`);
}

async function ensurePermission(policyId, def) {
  const existing = await directus.request(
    readPermissions({
      filter: {
        policy: { _eq: policyId },
        collection: { _eq: def.collection },
        action: { _eq: def.action },
      },
      limit: 1,
    }),
  );
  if (existing.length) {
    console.log(`    ✓ ${def.collection} / ${def.action}`);
    return;
  }
  await directus.request(createPermission({ ...def, policy: policyId }));
  console.log(`    + ${def.collection} / ${def.action}`);
}

async function ensurePublicRegistration(roleId) {
  const settings = await directus.request(readSettings());
  const patch = {};
  if (!settings.public_registration) patch.public_registration = true;
  if (settings.public_registration_role !== roleId) patch.public_registration_role = roleId;
  if (settings.public_registration_verify_email !== false) patch.public_registration_verify_email = false;

  if (Object.keys(patch).length === 0) {
    console.log('  ✓ public_registration already configured');
    return;
  }
  await directus.request(updateSettings(patch));
  console.log('  + updated public_registration settings:', JSON.stringify(patch));
}

async function run() {
  console.log('→ auth setup');
  const roleId = await ensureRole();
  const policyId = await ensurePolicy();
  await ensureAccess(roleId, policyId);

  console.log('  → permissions on policy');
  await ensurePermission(policyId, {
    collection: 'directus_users',
    action: 'read',
    permissions: { id: { _eq: '$CURRENT_USER' } },
    fields: ['id', 'email', 'first_name', 'last_name', 'avatar', 'status'],
  });
  await ensurePermission(policyId, {
    collection: 'directus_users',
    action: 'update',
    permissions: { id: { _eq: '$CURRENT_USER' } },
    fields: ['email', 'password', 'first_name', 'last_name', 'avatar'],
  });
  await ensurePermission(policyId, {
    collection: 'directus_files',
    action: 'create',
    fields: ['*'],
  });
  await ensurePermission(policyId, {
    collection: 'directus_files',
    action: 'read',
    permissions: { uploaded_by: { _eq: '$CURRENT_USER' } },
    fields: ['*'],
  });
  await ensurePermission(policyId, {
    collection: 'touren',
    action: 'read',
    permissions: { status: { _eq: 'published' } },
    fields: ['*'],
  });

  console.log('  → public registration setting');
  await ensurePublicRegistration(roleId);

  console.log('✓ done');
}

run().catch((err) => {
  console.error('✗ failed:', err?.errors ?? err);
  process.exit(1);
});
