# Fix CSS path issues in HTML files
Write-Host "Fixing CSS paths in HTML files..."

$rootPath = "."
$htmlFiles = Get-ChildItem -Path $rootPath -Recurse -Include "*.html"

$totalFiles = 0
foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Check if the file is in the root public directory or in html subdirectory
    $relativePath = $file.DirectoryName.Replace((Get-Location).Path, "").TrimStart('\')
    
    if ($relativePath -eq "public" -or $relativePath -eq "") {
        # Files in root public directory should use /css/
        $content = $content -replace 'href="css/', 'href="/css/'
        $content = $content -replace 'src="js/', 'src="/js/'
    } elseif ($relativePath -eq "public\html" -or $relativePath -eq "html") {
        # Files in html subdirectory should use ../css/
        $content = $content -replace 'href="/css/', 'href="../css/'
        $content = $content -replace 'src="/js/', 'src="../js/'
        # Fix double paths
        $content = $content -replace 'href="\.\./css/\.\./css/', 'href="../css/'
        $content = $content -replace 'src="\.\./js/\.\./js/', 'src="../js/'
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
        $totalFiles++
    }
}

Write-Host "Fixed paths in $totalFiles files"
