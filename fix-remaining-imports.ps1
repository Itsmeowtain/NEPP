# Fix remaining relative import paths in all JavaScript files
Write-Host "Fixing remaining relative import paths in JavaScript files..."

$publicPath = "."
$files = Get-ChildItem -Path $publicPath -Recurse -Include "*.js" | Where-Object { $_.Name -ne "fix-remaining-imports.ps1" }

$replacements = @{
    "from '../config/" = "from '/config/"
    "from '../services/" = "from '/services/"
    "from '../components/" = "from '/components/"
    "from '../utils/" = "from '/utils/"
}

$totalFiles = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    foreach ($pattern in $replacements.Keys) {
        $replacement = $replacements[$pattern]
        $content = $content -replace [regex]::Escape($pattern), $replacement
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
        $totalFiles++
    }
}

Write-Host "Fixed import paths in $totalFiles files"
