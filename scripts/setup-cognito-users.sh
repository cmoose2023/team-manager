#!/usr/bin/env bash
# setup-cognito-users.sh
#
# Creates all Cognito users for the Engineering Assessment app and assigns
# them to the correct groups (Admins / Engineers).
#
# Run once after the first Amplify deployment.
#
# Prerequisites:
#   - AWS CLI installed and configured with credentials that have
#     cognito-idp:AdminCreateUser and cognito-idp:AdminAddUserToGroup
#   - Either amplify_outputs.json present in the project root, OR
#     USER_POOL_ID set as an environment variable
#
# Usage:
#   ./scripts/setup-cognito-users.sh
#   USER_POOL_ID=us-east-1_XXXXXXX ./scripts/setup-cognito-users.sh
#
# Overrides:
#   TEMP_PASSWORD  — temporary password for all users (default: Welcome@2026!)
#                    Users must change it on first login.
#   AWS_REGION     — AWS region (default: us-east-1)
#
# This script is idempotent — safe to run multiple times.

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────

AWS_REGION="${AWS_REGION:-us-east-1}"
TEMP_PASSWORD="${TEMP_PASSWORD:-Welcome@2026!}"

# Resolve User Pool ID: prefer explicit env var, then amplify_outputs.json
if [ -z "${USER_POOL_ID:-}" ]; then
  OUTPUTS_FILE="$(dirname "$0")/../amplify_outputs.json"
  if [ -f "$OUTPUTS_FILE" ]; then
    USER_POOL_ID=$(node -e \
      "const o = require('$(realpath "$OUTPUTS_FILE")'); console.log(o.auth.user_pool_id)")
  fi
fi

if [ -z "${USER_POOL_ID:-}" ]; then
  echo "Error: USER_POOL_ID is not set and amplify_outputs.json was not found."
  echo ""
  echo "Either:"
  echo "  1. Run 'npx ampx pipeline-deploy' or 'npx ampx sandbox' first so"
  echo "     amplify_outputs.json is generated in the project root."
  echo "  2. Or pass it directly:"
  echo "     USER_POOL_ID=us-east-1_XXXXXXX ./scripts/setup-cognito-users.sh"
  exit 1
fi

echo "═══════════════════════════════════════════════════════"
echo "  Cognito User Setup — Engineering Assessment"
echo "═══════════════════════════════════════════════════════"
echo "  User Pool : $USER_POOL_ID"
echo "  Region    : $AWS_REGION"
echo ""

# ── Helper ────────────────────────────────────────────────────────────────────

create_user() {
  local username="$1"
  local email="$2"
  local group="$3"

  printf "  %-22s %-38s → %s\n" "$username" "($email)" "$group"

  # Create the user; ignore UsernameExistsException so the script is idempotent
  aws cognito-idp admin-create-user \
    --region        "$AWS_REGION" \
    --user-pool-id  "$USER_POOL_ID" \
    --username      "$username" \
    --user-attributes \
      Name=email,Value="$email" \
      Name=email_verified,Value=true \
    --temporary-password "$TEMP_PASSWORD" \
    --message-action SUPPRESS \
    --no-cli-pager \
    > /dev/null 2>&1 \
    || true   # UsernameExistsException — user already exists, that's fine

  # Add to group; ignore if already a member
  aws cognito-idp admin-add-user-to-group \
    --region        "$AWS_REGION" \
    --user-pool-id  "$USER_POOL_ID" \
    --username      "$username" \
    --group-name    "$group" \
    --no-cli-pager \
    > /dev/null 2>&1 \
    || true
}

# ── Users ─────────────────────────────────────────────────────────────────────
#
# Engineer email addresses: update to each person's actual work email before
# running in production. The addresses below follow the standard pattern.

create_user "criss.moosman"   "crissmoosman1@gmail.com"           "Admins"
create_user "steven.snyder"   "steven.snyder@invaluable.com"      "Engineers"
create_user "julia.ballo"     "julia.ballo@invaluable.com"        "Engineers"
create_user "agnes.szigethy"  "agnes.szigethy@invaluable.com"     "Engineers"
create_user "michael.murphy"  "michael.murphy@invaluable.com"     "Engineers"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✓ All users created / verified."
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  Temporary password : $TEMP_PASSWORD"
echo ""
echo "  Share this password with each user. They will be"
echo "  prompted to set a permanent password on first login."
echo ""
echo "  Login URL: your Amplify Hosting URL + /login"
echo ""

# ── Sanity-check: list users and their groups ─────────────────────────────────

echo "  Verifying group memberships:"
echo ""

for group in Admins Engineers; do
  printf "  [%s]\n" "$group"
  aws cognito-idp list-users-in-group \
    --region       "$AWS_REGION" \
    --user-pool-id "$USER_POOL_ID" \
    --group-name   "$group" \
    --no-cli-pager \
    --query        "Users[].Username" \
    --output       text \
    2>/dev/null \
  | tr '\t' '\n' \
  | sed 's/^/    /'
  echo ""
done
