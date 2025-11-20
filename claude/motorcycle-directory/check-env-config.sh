#!/bin/bash

# =============================================
# Environment Configuration Checker
# =============================================
# This script checks if your Supabase configuration is correct
# Run with: bash check-env-config.sh
# =============================================

echo "=================================="
echo "SUPABASE CONFIG CHECKER"
echo "=================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ ERROR: .env.local file not found!"
    echo ""
    echo "Create .env.local with:"
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
    exit 1
fi

echo "✅ .env.local file exists"
echo ""

# Read the .env.local file
echo "=================================="
echo "CHECKING ENVIRONMENT VARIABLES"
echo "=================================="
echo ""

# Check SUPABASE_URL
if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
    SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d '=' -f 2 | tr -d '"' | tr -d "'")

    if [ -z "$SUPABASE_URL" ]; then
        echo "❌ NEXT_PUBLIC_SUPABASE_URL is empty!"
    else
        echo "✅ NEXT_PUBLIC_SUPABASE_URL is set"

        # Check if URL format is correct
        if [[ $SUPABASE_URL == https://*.supabase.co ]] || [[ $SUPABASE_URL == http://localhost:* ]]; then
            echo "   URL: $SUPABASE_URL"
            echo "   Format: ✅ Valid"
        else
            echo "   URL: $SUPABASE_URL"
            echo "   Format: ⚠️  Unexpected format (should be https://xxxxx.supabase.co)"
        fi
    fi
else
    echo "❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local!"
fi

echo ""

# Check SUPABASE_ANON_KEY
if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
    SUPABASE_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local | cut -d '=' -f 2 | tr -d '"' | tr -d "'")

    if [ -z "$SUPABASE_KEY" ]; then
        echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is empty!"
    else
        echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set"

        # Check if key format looks correct (should start with eyJ)
        if [[ $SUPABASE_KEY == eyJ* ]]; then
            KEY_LENGTH=${#SUPABASE_KEY}
            echo "   Key length: $KEY_LENGTH characters"
            echo "   Format: ✅ Valid JWT format"
            echo "   Key preview: ${SUPABASE_KEY:0:20}..."
        else
            echo "   Format: ⚠️  Doesn't look like a valid JWT (should start with 'eyJ')"
            echo "   Key preview: ${SUPABASE_KEY:0:20}..."
        fi
    fi
else
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local!"
fi

echo ""
echo "=================================="
echo "CONFIGURATION FILE CONTENTS"
echo "=================================="
echo ""
echo "Current .env.local (keys masked):"
echo "---"

# Show masked version
while IFS= read -r line; do
    if [[ $line == NEXT_PUBLIC_SUPABASE_URL* ]]; then
        echo "$line"
    elif [[ $line == NEXT_PUBLIC_SUPABASE_ANON_KEY* ]]; then
        # Mask the key
        KEY_VAR=$(echo "$line" | cut -d '=' -f 1)
        KEY_VALUE=$(echo "$line" | cut -d '=' -f 2)
        KEY_PREVIEW="${KEY_VALUE:0:20}"
        echo "${KEY_VAR}=${KEY_PREVIEW}...[MASKED]"
    else
        echo "$line"
    fi
done < .env.local

echo "---"
echo ""

# Check if values match what's in Supabase dashboard
echo "=================================="
echo "VERIFICATION STEPS"
echo "=================================="
echo ""
echo "1. Go to your Supabase Dashboard"
echo "2. Navigate to Project Settings → API"
echo "3. Compare these values:"
echo ""
echo "   - Project URL should match NEXT_PUBLIC_SUPABASE_URL"
echo "   - anon/public key should match NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo ""
echo "4. If values don't match, update .env.local"
echo "5. Restart your development server after changing .env.local"
echo ""

# Check if server needs restart
echo "=================================="
echo "IMPORTANT REMINDERS"
echo "=================================="
echo ""
echo "⚠️  After changing .env.local, you MUST:"
echo "   1. Stop your dev server (Ctrl+C)"
echo "   2. Restart it (npm run dev)"
echo ""
echo "⚠️  .env.local should NOT be committed to git"
echo "   - Check that .env.local is in .gitignore"
echo ""

# Check .gitignore
if [ -f .gitignore ]; then
    if grep -q ".env.local" .gitignore; then
        echo "✅ .env.local is in .gitignore (correct)"
    else
        echo "⚠️  .env.local is NOT in .gitignore (add it!)"
    fi
else
    echo "⚠️  .gitignore file not found"
fi

echo ""
echo "=================================="
echo "SUMMARY"
echo "=================================="
echo ""

# Overall status
ISSUES=0

if [ -z "$SUPABASE_URL" ]; then
    ((ISSUES++))
fi

if [ -z "$SUPABASE_KEY" ]; then
    ((ISSUES++))
fi

if [ $ISSUES -eq 0 ]; then
    echo "✅ Configuration looks good!"
    echo ""
    echo "Next steps:"
    echo "1. Make sure dev server is running"
    echo "2. Run fix-auth-urgent.sql in Supabase"
    echo "3. Try to sign up/login"
else
    echo "❌ Found $ISSUES configuration issue(s)"
    echo ""
    echo "Please fix the issues above and run this script again"
fi

echo ""
echo "=================================="
