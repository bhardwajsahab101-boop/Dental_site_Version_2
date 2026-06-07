# PowerShell script to add clinic subdomains to Windows hosts file.
# MUST BE RUN AS ADMINISTRATOR.

# 1. Fetch clinic slugs from MongoDB
$envFile = Join-Path $PSScriptRoot "../.env.local"
if (-not (Test-Path $envFile)) {
    Write-Error "Could not find .env.local file"
    Exit
}

$mongoUri = ""
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^MONGODB_URI=(.*)") {
        $mongoUri = $Matches[1].Trim().Trim("'").Trim('"')
    }
}

if (-not $mongoUri) {
    Write-Error "Could not find MONGODB_URI in .env.local"
    Exit
}

Write-Host "Fetching clinic slugs from database..."
# Run a quick node inline script to get the slugs
$nodeScript = @"
const mongoose = require('mongoose');
mongoose.connect('$mongoUri').then(async () => {
  const Clinic = mongoose.model('Clinic', new mongoose.Schema({ slug: String }));
  const clinics = await Clinic.find({});
  console.log(clinics.map(c => c.slug).filter(Boolean).join(','));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
"@

$slugsStr = node -e $nodeScript
if ($LASTEXITCODE -ne 0 -or -not $slugsStr) {
    Write-Error "Failed to fetch clinic slugs from database"
    Exit
}

$slugs = $slugsStr.Split(',')

# 2. Add entries to hosts file
$hostsPath = "$env:windir\System32\drivers\etc\hosts"
Write-Host "Updating hosts file at: $hostsPath"

# Read existing hosts content
$hostsContent = Get-Content $hostsPath

$modified = $false
foreach ($slug in $slugs) {
    $domain = "$slug.localhost"
    $entry = "127.0.0.1 $domain"
    
    # Check if entry already exists
    $exists = $false
    foreach ($line in $hostsContent) {
        if ($line.Trim() -match "^127\.0\.0\.1\s+$([regex]::Escape($domain))") {
            $exists = $true
            break
        }
    }
    
    if (-not $exists) {
        Write-Host "Adding entry: $entry"
        Add-Content -Path $hostsPath -Value $entry
        $modified = $true
    } else {
        Write-Host "Entry already exists for $domain"
    }
}

if ($modified) {
    Write-Host "Successfully updated hosts file. You may need to clear your DNS cache or restart your browser."
} else {
    Write-Host "No changes needed."
}
