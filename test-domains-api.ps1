# 测试域名 API
$headers = @{
    "X-User-ID" = "test-user"
    "Authorization" = "Bearer admin123"
}

Write-Host "测试 GET /api/domains..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8787/api/domains" -Headers $headers -Method GET
    Write-Host "状态码: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "响应内容:" -ForegroundColor Yellow
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "错误: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "响应内容: $responseBody" -ForegroundColor Yellow
    }
}

