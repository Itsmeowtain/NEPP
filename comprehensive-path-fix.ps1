# Comprehensive path fix for HTML files
Write-Host "Applying comprehensive path fixes..."

$rootPath = "."
$htmlFiles = Get-ChildItem -Path $rootPath -Recurse -Include "*.html"

$totalFiles = 0
foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Determine if file is in html subdirectory
    $isInHtmlFolder = $file.DirectoryName -like "*\html"
    
    if ($isInHtmlFolder) {
        # Files in html folder should use relative paths for CSS/JS, absolute for other resources
        $content = $content -replace 'href="/css/', 'href="../css/'
        $content = $content -replace 'src="/js/', 'src="../js/'
        # But keep absolute paths for config, components, services, utils
        $content = $content -replace 'src="\.\./config/', 'src="/config/'
        $content = $content -replace 'src="\.\./components/', 'src="/components/'
        $content = $content -replace 'src="\.\./services/', 'src="/services/'
        $content = $content -replace 'src="\.\./utils/', 'src="/utils/'
    } else {
        # Files in root should use absolute paths
        $content = $content -replace 'href="css/', 'href="/css/'
        $content = $content -replace 'src="js/', 'src="/js/'
        $content = $content -replace 'src="config/', 'src="/config/'
        $content = $content -replace 'src="components/', 'src="/components/'
        $content = $content -replace 'src="services/', 'src="/services/'
        $content = $content -replace 'src="utils/', 'src="/utils/'
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
        $totalFiles++
    }
}

Write-Host "Applied comprehensive fixes to $totalFiles files"
