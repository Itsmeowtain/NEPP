# Remove redundant settings icons from HTML files - targeted approach
Write-Host "Removing redundant settings icons from HTML files..."

$htmlFolder = ".\public\html"
$htmlFiles = Get-ChildItem -Path $htmlFolder -Include "*.html"

$totalFiles = 0
foreach ($file in $htmlFiles) {
    $lines = Get-Content $file.FullName
    $newLines = @()
    $skipLines = $false
    $skipCount = 0
    
    for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        
        # Start skipping when we find the settings-top anchor
        if ($line -match 'class="settings-top"') {
            $skipLines = $true
            $skipCount = 0
            continue
        }
        
        # Skip lines until we find the closing </a> tag
        if ($skipLines) {
            $skipCount++
            if ($line -match '</a>' -and $skipCount -gt 1) {
                $skipLines = $false
                continue
            } else {
                continue
            }
        }
        
        # Add non-skipped lines
        $newLines += $line
    }
    
    # Check if any changes were made
    if ($newLines.Length -ne $lines.Length) {
        Set-Content -Path $file.FullName -Value $newLines
        Write-Host "Removed settings icon from: $($file.Name)"
        $totalFiles++
    }
}

Write-Host "Removed redundant settings icons from $totalFiles files"
