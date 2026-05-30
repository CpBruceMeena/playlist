#!/usr/bin/env bash
#
# 🎯 Product Development Review Runner
#
# Usage:
#   ./skills/run-review.sh <skill-name> [context-file...]
#
# Examples:
#   ./skills/run-review.sh ceo-review temp-prd.md
#   ./skills/run-review.sh design-review temp-prd.md
#   ./skills/run-review.sh qa-review temp-prd.md
#   ./skills/run-review.sh security-review temp-prd.md
#
# Skills: ceo-review, design-review, qa-review, product-manager-review,
#         technical-architecture-review, security-review, performance-review,
#         accessibility-review, code-review, devops-review, compliance-review

set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_NAME="${1:-}"
shift 2>/dev/null || true

if [ -z "$SKILL_NAME" ]; then
    echo "❌ Usage: ./skills/run-review.sh <skill-name> [context-file...]"
    echo ""
    echo "Available skills:"
    for f in "$SKILL_DIR"/*.md; do
        name=$(basename "$f" .md)
        [ "$name" = "README" ] && continue
        desc=$(head -1 "$f" | sed 's/# //' | sed 's/ Skill$//')
        echo "  📋 $name — $desc"
    done
    exit 1
fi

SKILL_FILE="$SKILL_DIR/$SKILL_NAME.md"

if [ ! -f "$SKILL_FILE" ]; then
    echo "❌ Skill '$SKILL_NAME' not found."
    echo "   Available: $(for f in "$SKILL_DIR"/*.md; do basename "$f" .md; done | grep -v README | tr '\n' ' ')"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔍 Review: $SKILL_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Show the skill description and checklist overview
grep -A2 "^#" "$SKILL_FILE" | head -6
echo ""
echo "Checklist sections:"
grep "^### " "$SKILL_FILE" | sed 's/###/-/'
echo ""
echo "⏱️  Estimated time: $(grep 'Estimated time' "$SKILL_FILE" | sed 's/.*\*\*//;s/\*\*//')"
echo ""

# Show context files if provided
if [ $# -gt 0 ]; then
    echo "--- Context files ---"
    for f in "$@"; do
        if [ -f "$f" ]; then
            echo "  📄 $f ($(wc -l < "$f") lines)"
        else
            echo "  ⚠️  $f (not found)"
        fi
    done
    echo ""
fi

echo "--- Prompt Template ---"
# Extract the prompt template section
in_template=false
while IFS= read -r line; do
    if echo "$line" | grep -q "^## Prompt Template"; then
        in_template=true
        continue
    fi
    if $in_template; then
        if echo "$line" | grep -q "^## "; then
            break
        fi
        echo "$line"
    fi
done < "$SKILL_FILE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  💡 To run this review, copy the prompt"
echo "     template above into your chat."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
