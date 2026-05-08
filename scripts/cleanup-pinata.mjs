/**
 * One-time cleanup script — deletes all cipherview_video files from Pinata.
 * Run with: node scripts/cleanup-pinata.mjs
 */

const PINATA_JWT = process.env.PINATA_JWT;

if (!PINATA_JWT) {
  console.error("❌ Set PINATA_JWT env var first:");
  console.error("   $env:PINATA_JWT='your_jwt_here'; node scripts/cleanup-pinata.mjs");
  process.exit(1);
}

async function listFiles() {
  const res = await fetch(
    "https://api.pinata.cloud/v3/files/public?limit=100&keyvalues=%7B%22type%22%3A%22cipherview_video%22%7D",
    { headers: { Authorization: `Bearer ${PINATA_JWT}` } }
  );
  const data = await res.json();
  return data.files || [];
}

async function deleteFile(id) {
  const res = await fetch(`https://api.pinata.cloud/v3/files/public/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
  });
  return res.ok;
}

async function main() {
  console.log("🔍 Fetching uploaded videos from Pinata...");
  const files = await listFiles();

  if (files.length === 0) {
    console.log("✅ No files found — nothing to delete.");
    return;
  }

  console.log(`🗑️  Found ${files.length} file(s). Deleting...`);

  for (const file of files) {
    const ok = await deleteFile(file.id);
    console.log(`  ${ok ? "✅" : "❌"} ${file.name} (${file.cid})`);
  }

  console.log("✅ Done.");
}

main().catch(console.error);
