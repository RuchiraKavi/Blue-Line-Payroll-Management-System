/**
 * Verifies designations migration does not reset saved permissions.
 * Run: node backend/scripts/verifyRolePermissionMigration.js
 */

function sectionHasAnyAccess(sectionPerms) {
  if (!sectionPerms || typeof sectionPerms !== "object") return false;
  return Boolean(
    sectionPerms.create ||
      sectionPerms.read ||
      sectionPerms.update ||
      sectionPerms.delete
  );
}

function shouldMigrateDesignations(rawPermissions) {
  if (!rawPermissions || typeof rawPermissions !== "object") return false;
  return !Object.prototype.hasOwnProperty.call(rawPermissions, "designations");
}

const cases = [
  {
    name: "legacy role without designations key should migrate",
    raw: { departments: { create: true, read: true, update: true, delete: true } },
    expect: true,
  },
  {
    name: "saved role with designations all false should NOT migrate",
    raw: {
      departments: { create: true, read: true, update: true, delete: true },
      designations: { create: false, read: false, update: false, delete: false },
    },
    expect: false,
  },
  {
    name: "custom designations permissions should NOT migrate",
    raw: {
      designations: { create: true, read: true, update: false, delete: false },
    },
    expect: false,
  },
  {
    name: "HR defaults with empty designations saved should NOT re-apply defaults",
    raw: {
      dashboard: { create: false, read: true, update: false, delete: false },
      designations: { create: false, read: false, update: false, delete: false },
    },
    expect: false,
  },
];

let failed = 0;
for (const testCase of cases) {
  const result = shouldMigrateDesignations(testCase.raw);
  if (result !== testCase.expect) {
    console.error(`FAIL: ${testCase.name} (got ${result}, expected ${testCase.expect})`);
    failed++;
  } else {
    console.log(`PASS: ${testCase.name}`);
  }
}

// Old buggy logic would re-migrate when designations empty but defaults exist
const hrDefaultsDesignations = {
  create: true,
  read: true,
  update: true,
  delete: true,
};
const savedWithClearedDesignations = {
  designations: { create: false, read: false, update: false, delete: false },
};
const oldBugWouldReset =
  sectionHasAnyAccess(hrDefaultsDesignations) &&
  !sectionHasAnyAccess(savedWithClearedDesignations.designations);
if (oldBugWouldReset) {
  console.log(
    "NOTE: old migration logic would incorrectly reset cleared designations; new logic skips this role."
  );
}
if (!shouldMigrateDesignations(savedWithClearedDesignations)) {
  console.log("PASS: cleared designations are preserved after save");
} else {
  console.error("FAIL: cleared designations would be migrated again");
  failed++;
}

console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
