# Scores one answer against the fixture's ground-truth.md with a separate `claude -p` session (no tools, started
# outside the repository so no repository instructions are loaded).
$script:inv = [Globalization.CultureInfo]::InvariantCulture

function ConvertTo-Num($x) { [double]::Parse(([string]$x), $script:inv) }

function Get-MaxScore($fixtureDir) {
  $m = [regex]::Match((Get-Content (Join-Path $fixtureDir 'ground-truth.md') -Raw), '(?m)^Max score:\s*([0-9.]+)')
  if (-not $m.Success) { throw "$fixtureDir/ground-truth.md has no 'Max score: N' line" }
  ConvertTo-Num $m.Groups[1].Value
}

function Invoke-Judge($fixtureDir, $answer, $model, $effort) {
  $gt = Get-Content (Join-Path $fixtureDir 'ground-truth.md') -Raw
  $max = Get-MaxScore $fixtureDir
  $prompt = @"
You are grading one answer of an AI coding assistant against a ground-truth file. Do not use any tools.

<ground_truth>
$gt
</ground_truth>

<answer>
$answer
</answer>

Score the answer strictly by the Scoring section of the ground truth (maximum score $max). Respond with exactly one
line of JSON and nothing else:
{"score": <number between 0 and $max>, "falsePositives": <integer>, "notes": "<one or two sentences: which items were found or missed, and any false positive>"}
"@
  $judgeArgs = @('-p', '--model', $model, '--effort', $effort, '--no-session-persistence', '--strict-mcp-config', '--tools', '')
  for ($attempt = 1; $attempt -le 2; $attempt++) {
    Push-Location ([IO.Path]::GetTempPath())
    try { $out = ($prompt | & claude @judgeArgs 2>&1 | Out-String); $exit = $LASTEXITCODE } finally { Pop-Location }
    $a = $out.IndexOf('{'); $b = $out.LastIndexOf('}')
    if ($exit -eq 0 -and $a -ge 0 -and $b -gt $a) {
      try {
        $j = $out.Substring($a, $b - $a + 1) | ConvertFrom-Json
        $score = ConvertTo-Num $j.score; $fp = [int]$j.falsePositives
        if ($score -ge 0 -and $score -le $max -and $fp -ge 0) { return [pscustomobject]@{ Score = $score; Max = $max; FalsePositives = $fp; Notes = ([string]$j.notes).Trim() } }
      } catch { }
    }
  }
  return $null
}
