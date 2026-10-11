const fs = require('fs');
const path = require('path');

const manifestPath = path.resolve(__dirname, '../android/app/src/main/AndroidManifest.xml');

if (!fs.existsSync(manifestPath)) {
  console.log('AndroidManifest.xml não encontrado em ' + manifestPath);
  process.exit(0);
}

let content = fs.readFileSync(manifestPath, 'utf8');

const permissions = [
  '    <uses-permission android:name="android.permission.BLUETOOTH" />',
  '    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />',
  '    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />',
  '    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />',
  '    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
  '    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
  '    <uses-feature android:name="android.hardware.bluetooth_le" android:required="true" />'
];

// Check if already injected
if (!content.includes('android.permission.BLUETOOTH_CONNECT')) {
  // Insert before </manifest>
  const insertIndex = content.lastIndexOf('</manifest>');
  if (insertIndex !== -1) {
    content = content.slice(0, insertIndex) + '\n' + permissions.join('\n') + '\n\n' + content.slice(insertIndex);
    fs.writeFileSync(manifestPath, content, 'utf8');
    console.log('Permissões de Bluetooth e Localização injetadas com sucesso no AndroidManifest.xml!');
  }
} else {
  console.log('Permissões já configuradas no AndroidManifest.xml.');
}
