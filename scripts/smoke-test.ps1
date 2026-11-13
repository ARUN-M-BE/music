param([string]$Base = "http://localhost:3200")
$ErrorActionPreference = "Continue"
function Status($url, $method = "GET", $body = $null, $extraHeaders = @{}, $session = $null) {
  try {
    $params = @{ Uri = "$Base$url"; Method = $method; UseBasicParsing = $true; MaximumRedirection = 0; Headers = $extraHeaders }
    if ($body -ne $null) { $params.Body = $body; $params.ContentType = "application/json" }
    if ($session) { $params.WebSession = $session }
    $res = Invoke-WebRequest @params -ErrorAction Stop
    return @{ code = [int]$res.StatusCode; body = $res.Content; headers = $res.Headers }
  } catch {
    $r = $_.Exception.Response
    if ($r -eq $null) { return @{ code = -1; body = $_.Exception.Message; headers = @{} } }
    $stream = $r.GetResponseStream(); $text = ""
    if ($stream) { $text = (New-Object System.IO.StreamReader($stream)).ReadToEnd() }
    return @{ code = [int]$r.StatusCode; body = $text; headers = $r.Headers }
  }
}

$results = @()
function Record($name, $pass, $detail) {
  $script:results += [pscustomobject]@{ Test = $name; Pass = $pass; Detail = $detail }
}

# 1. unauthenticated access to privileged endpoints
$users = Status "/api/users"
Record "GET /api/users (anon -> 401)" ($users.code -eq 401) "got $($users.code)"
$upload = Status "/api/media/upload" "POST" "{}"
Record "POST /api/media/upload (anon -> 401)" ($upload.code -eq 401) "got $($upload.code)"
$logs = Status "/api/security/logs"
Record "GET /api/security/logs (anon -> 401)" ($logs.code -eq 401) "got $($logs.code)"
$intHealth = Status "/api/integrations/health"
Record "GET /api/integrations/health (anon -> 401)" ($intHealth.code -eq 401) "got $($intHealth.code)"
$songPut = Status "/api/songs/507f1f77bcf86cd799439011" "PUT" '{"name":"hacked"}'
Record "PUT /api/songs/:id (anon -> 401)" ($songPut.code -eq 401) "got $($songPut.code)"

# 2. admin page gate
$admin = Status "/admin"
$loc = if ($admin.headers["Location"]) { $admin.headers["Location"] } else { "" }
Record "GET /admin (anon -> redirect to /login)" (($admin.code -eq 307 -or $admin.code -eq 302 -or $admin.code -eq 308) -and "$loc" -match "/login") "got $($admin.code) loc=$loc"

# 3. guest session (signed, HttpOnly cookie)
$sess = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$guest = Status "/api/auth/guest" "POST" "{}" @{} $sess
$setCookie = if ($guest.headers["Set-Cookie"]) { "$($guest.headers['Set-Cookie'])" } else { "" }
Record "POST /api/auth/guest (200)" ($guest.code -eq 200) "got $($guest.code)"
Record "session cookie is HttpOnly" ($setCookie -match "HttpOnly") $setCookie
Record "session cookie is SameSite=Lax" ($setCookie -match "SameSite=Lax") $setCookie
Record "session cookie is signed (gm_session)" ($setCookie -match "gm_session=") $setCookie

$current = Status "/api/auth/session" "GET" $null @{} $sess
Record "GET /api/auth/session with cookie -> user" (($current.code -eq 200) -and ($current.body -match '"email"')) "got $($current.code)"
# 4. authenticated member cannot perform admin actions (403)
$createSong = Status "/api/songs" "POST" '{"name":"Test","artist":"A","imageURL":"https://example.com/a.png","songURL":"https://example.com/a.mp3"}' @{} $sess
Record "POST /api/songs as member -> 403" ($createSong.code -eq 403) "got $($createSong.code) $($createSong.body)"
$bulk = Status "/api/songs/bulk" "POST" '{"songs":[]}' @{} $sess
Record "POST /api/songs/bulk as member -> 403" ($bulk.code -eq 403) "got $($bulk.code)"
$roleChange = Status "/api/users/507f1f77bcf86cd799439011/role" "PUT" '{"role":"superadmin"}' @{} $sess
Record "PUT /api/users/:id/role as member -> 401/403" ($roleChange.code -eq 403 -or $roleChange.code -eq 401) "got $($roleChange.code)"

# 5. forged / tampered cookie is rejected
$forged = Status "/api/auth/session" "GET" $null @{ "Cookie" = "gm_session=eyJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6InN1cGVyYWRtaW4ifQ.forged" }
Record "forged cookie rejected (no superadmin)" (($forged.code -eq 401 -or $forged.code -eq 200) -and ($forged.body -notmatch 'superadmin')) "got $($forged.code) $($forged.body)"

# 6. header impersonation is ignored
$impersonate = Status "/api/users" "GET" $null @{ "x-user-email" = "arunm102301@gmail.com" }
Record "x-user-email impersonation ignored (401)" ($impersonate.code -eq 401) "got $($impersonate.code)"
$bearer = Status "/api/users" "GET" $null @{ "Authorization" = "Bearer arunm102301@gmail.com" }
Record "Bearer <email> impersonation ignored (401)" ($bearer.code -eq 401) "got $($bearer.code)"

# 7. CORS / CSRF origin allow-list
$evil = Status "/api/auth/session" "POST" "{}" @{ "Origin" = "https://evil.example" }
Record "POST with evil Origin -> 403" ($evil.code -eq 403) "got $($evil.code)"
$preflight = Status "/api/songs" "OPTIONS" $null @{ "Origin" = "https://evil.example" }
Record "OPTIONS evil Origin -> 403" ($preflight.code -eq 403) "got $($preflight.code)"

# 8. validation errors do not leak internals
$bad = Status "/api/music/search?q=%00%01abc&limit=9999"
Record "GET /api/music/search sanitises input (200)" ($bad.code -eq 200) "got $($bad.code)"
$badId = Status "/api/music/artist/NoSuchArtistXyz"
Record "GET /api/music/artist unknown name -> 200" ($badId.code -eq 200) "got $($badId.code)"
$badAlbum = Status "/api/songs/not-an-objectid"
Record "GET /api/songs/:id invalid id -> 400" ($badAlbum.code -eq 400) "got $($badAlbum.code)"

# 9. rate limiting (60/min on /api/music/search)
$last = 0
for ($i = 1; $i -le 62; $i++) { $last = (Status "/api/music/search").code }
Record "rate limit returns 429 after 60 requests" ($last -eq 429) "last status $last"

# 10. health endpoint
$health = Status "/api/health"
Record "GET /api/health responds" ($health.code -eq 200 -or $health.code -eq 503) "got $($health.code): $($health.body.Substring(0, [Math]::Min(240, $health.body.Length)))"

# 11. CSP report sink
$csp = Status "/api/security/csp-report" "POST" '{"csp-report":{"document-uri":"https://x/","violated-directive":"script-src","blocked-uri":"inline"}}'
Record "POST /api/security/csp-report -> 204" ($csp.code -eq 204) "got $($csp.code)"

$results | Format-Table -AutoSize | Out-String -Width 200 | Write-Output
$failed = ($results | Where-Object { -not $_.Pass }).Count
Write-Output "TOTAL: $($results.Count)  FAILED: $failed"
