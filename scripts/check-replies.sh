#!/usr/bin/env bash
# check-replies.sh — Monitor dustin+sprinter@ for replies, generate AI drafts with calendar availability
# Runs via cron every 30 min. Uses Claude Sonnet for intelligent reply generation.
#
# Crontab: */30 * * * * /home/ubuntu/projects/sprinter-van-for-sale/scripts/check-replies.sh >> /home/ubuntu/logs/sprinter-replies.log 2>&1

set -euo pipefail

LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"
GOG="$HOME/bin/gog"
LABEL_NAME="Sprinter/Draft-Sent"
PROCESSED_FILE="$HOME/.sprinter-processed-ids"
DRAFTS_TODAY_FILE="$HOME/.sprinter-drafts-today"
LOCK_FILE="$HOME/.sprinter-replies.lock"

# Prevent overlapping runs
if [ -f "$LOCK_FILE" ]; then
    LOCK_PID=$(cat "$LOCK_FILE" 2>/dev/null)
    if kill -0 "$LOCK_PID" 2>/dev/null; then
        echo "$LOG_PREFIX Skipped — previous run still active (PID $LOCK_PID)"
        exit 0
    fi
    rm -f "$LOCK_FILE"
fi
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

# Clear Claude nesting detection (safe for cron, needed when testing from within Claude Code)
unset CLAUDECODE 2>/dev/null || true
unset CLAUDE_CODE_ENTRYPOINT 2>/dev/null || true

# Load credentials
export GOG_KEYRING_PASSWORD=$(cat ~/.gog_env | cut -d= -f2)
source ~/.op_env

# Get Supabase DB connection
DB_PASS=$($HOME/bin/op item get "Supabase DB Connection" --vault VPS --fields password --reveal 2>/dev/null)
export PGPASSWORD="$DB_PASS"
DB_URL="postgresql://postgres.fzrwopncgmmwrfvvxnsw@aws-1-us-west-1.pooler.supabase.com:5432/postgres"

echo "$LOG_PREFIX Starting reply check..."

# Reset daily draft counter at midnight
if [[ -f "$DRAFTS_TODAY_FILE" ]]; then
    file_date=$(date -r "$DRAFTS_TODAY_FILE" '+%Y-%m-%d')
    today=$(date '+%Y-%m-%d')
    if [[ "$file_date" != "$today" ]]; then
        echo "0" > "$DRAFTS_TODAY_FILE"
    fi
else
    echo "0" > "$DRAFTS_TODAY_FILE"
fi

touch "$PROCESSED_FILE"

# Search for unread messages TO dustin+sprinter@
RESULTS=$($GOG gmail messages search \
    "to:dustin+sprinter@dustinwells.com is:unread -from:dustin@dustinwells.com -from:noreply" \
    --json --max 10 --no-input 2>/dev/null || echo '{"messages":[]}')

MSG_COUNT=$(echo "$RESULTS" | jq -r '.messages | length')

if [[ "$MSG_COUNT" == "0" ]] || [[ "$MSG_COUNT" == "null" ]]; then
    echo "$LOG_PREFIX No new replies found."
    exit 0
fi

echo "$LOG_PREFIX Found $MSG_COUNT unread message(s)."

# Fetch calendar availability for next 7 days (once for all messages)
FROM_DATE=$(date '+%Y-%m-%d')
TO_DATE=$(date -d '+7 days' '+%Y-%m-%d')
CALENDAR_JSON=$($GOG calendar events --from="$FROM_DATE" --to="$TO_DATE" --all --json --max 50 --no-input 2>/dev/null || echo '[]')

echo "$LOG_PREFIX Calendar fetched for $FROM_DATE to $TO_DATE."

DRAFTS_CREATED=0

echo "$RESULTS" | jq -r '.messages[].id' | while read -r MSG_ID; do
    # Skip if already processed
    if grep -q "^${MSG_ID}$" "$PROCESSED_FILE" 2>/dev/null; then
        echo "$LOG_PREFIX Skipping already-processed message $MSG_ID"
        continue
    fi

    echo "$LOG_PREFIX Processing message $MSG_ID..."

    # Get full message
    MSG_DATA=$($GOG gmail get "$MSG_ID" --json --no-input 2>/dev/null)

    # Extract fields
    FROM_FULL=$(echo "$MSG_DATA" | jq -r '.headers.from // ""')
    FROM_EMAIL=$(echo "$FROM_FULL" | grep -oP '<\K[^>]+' || echo "$FROM_FULL")
    FROM_NAME=$(echo "$FROM_FULL" | sed 's/ *<.*//' | tr -d '"')
    SUBJECT=$(echo "$MSG_DATA" | jq -r '.headers.subject // ""')
    SNIPPET=$(echo "$MSG_DATA" | jq -r '.snippet // ""')
    BODY=$(echo "$MSG_DATA" | jq -r '.body // ""')
    THREAD_ID=$(echo "$MSG_DATA" | jq -r '.message.threadId // ""')

    # Skip messages from ourselves
    if [[ "$FROM_EMAIL" == "dustin@dustinwells.com" ]] || [[ "$FROM_EMAIL" == "dustin+sprinter@dustinwells.com" ]]; then
        echo "$LOG_PREFIX Skipping own message $MSG_ID"
        echo "$MSG_ID" >> "$PROCESSED_FILE"
        continue
    fi

    # Extract reply content (before quoted original)
    REPLY_TEXT=$(echo "$BODY" | sed '/^On .* wrote:$/,$d' | sed '/^>.*$/d' | head -30)
    if [[ -z "$REPLY_TEXT" ]]; then
        REPLY_TEXT="$SNIPPET"
    fi

    # Get first name
    FIRST_NAME=$(echo "$FROM_NAME" | awk '{print $1}')
    if [[ -z "$FIRST_NAME" ]] || [[ "$FIRST_NAME" == "$FROM_EMAIL" ]]; then
        FIRST_NAME="there"
    fi

    # Classify reply type
    EMAIL_ESCAPED=$(echo "$FROM_EMAIL" | sed "s/'/''/g")
    PREV_COUNT=$(psql "$DB_URL" -t -A -c "
        SELECT COUNT(*) FROM forms.reply_drafts
        WHERE from_email = '${EMAIL_ESCAPED}' AND site_id = 'sprinter-van';
    " 2>/dev/null || echo "0")
    PREV_COUNT=$(echo "$PREV_COUNT" | tr -d '[:space:]')

    if [[ "$PREV_COUNT" == "0" ]]; then
        REPLY_TYPE="first"
        REPLY_TYPE_LABEL="First reply"
    else
        REPLY_NUM=$((PREV_COUNT + 1))
        REPLY_TYPE="follow-up"
        REPLY_TYPE_LABEL="Follow-up (#${REPLY_NUM})"
    fi

    echo "$LOG_PREFIX Reply from: $FROM_NAME <$FROM_EMAIL>"
    echo "$LOG_PREFIX Subject: $SUBJECT"
    echo "$LOG_PREFIX Type: $REPLY_TYPE_LABEL"
    echo "$LOG_PREFIX Reply snippet: $(echo "$REPLY_TEXT" | head -3 | tr '\n' ' ')"

    # Load scheduling preferences from DustyOS (single source of truth)
    SCHEDULING_RULES=$(cat "$HOME/projects/DustyOS/.claude/skills/schedule-meeting/references/scheduling-rules.md" 2>/dev/null || echo "Working hours: 9am-5pm MT. Default 25-min calls. Prefer stacking meetings adjacent to existing ones.")
    EVENT_DEFAULTS=$(cat "$HOME/projects/DustyOS/.claude/skills/schedule-meeting/references/event-defaults.md" 2>/dev/null || echo "Default video: Zoom. One slot per day, max 3 days. Format: Day M/D at H:MM AM/PM MST.")
    DRAFT_STYLE=$(cat "$HOME/projects/DustyOS/.claude/skills/inbox-drafter/references/draft-style.md" 2>/dev/null || echo "")

    # Build the AI prompt with all context
    PROMPT=$(cat <<PROMPT_EOF
You are drafting an email reply on behalf of Dustin Wells, who is selling a 2020 Mercedes-Benz Sprinter van.

LISTING CONTEXT:
- Vehicle: 2020 Mercedes-Benz Sprinter 2500, High Roof, 170" Extended Wheelbase
- Price: \$149,500
- Mileage: 68,743 miles
- Engine: 3.0L Diesel
- Interior: Bennett layout by Tommy Camper Vans (sleeps 2, rides 2)
- Electrical: 800Ah Renogy Lithium, 400W solar, 3000W inverter
- Suspension: RIP KIT VS30, Fox 2.5" shocks (brand new)
- Off-road: ARB Air Locker, Overlander XT wheels, Falken A/T4W tires
- Extras: Roof rack, Baja LED lights, Fiamma awning, Starlink Mini, Eberspacher heater, RTX 2000 A/C
- Location: Colorado's Western Slopes
- Disclosures: Cracked windshield (replacement recommended), torn awning shade, minor paint touch-ups, small floor scuff
- Trades: Not accepted
- Price stance: Firm but open to serious offers
- Delivery: Buyer responsible for pickup/delivery
- Financing: Not directly offered, works with third-party lenders
- Proof of funds/financing required before scheduling a viewing

PROSPECT INFO:
- Name: ${FROM_NAME}
- First name: ${FIRST_NAME}
- Email: ${FROM_EMAIL}
- Reply type: ${REPLY_TYPE_LABEL}
- Subject line: ${SUBJECT}

PROSPECT'S MESSAGE:
${REPLY_TEXT}

CALENDAR — DUSTIN'S NEXT 7 DAYS OF EVENTS (use to find available viewing times):
${CALENDAR_JSON}

DUSTIN'S SCHEDULING RULES (from central config):
${SCHEDULING_RULES}

DUSTIN'S EVENT DEFAULTS (from central config):
${EVENT_DEFAULTS}

LISTING-SPECIFIC SCHEDULING NOTES:
- Van viewings should be 50-60 minutes
- Exclude events Dustin has declined (responseStatus: "declined")
- If the prospect mentions wanting to come see the van, schedule a viewing, or asks about availability, include 2-3 specific available time slots
- Proof of funds/financing is needed before scheduling, but keep it casual and non-pushy

DUSTIN'S WRITING STYLE (from central config):
${DRAFT_STYLE}

LISTING-SPECIFIC DRAFT NOTES:
- If they ask about price, be straightforward: "\$149,500, firm but open to serious offers"
- If they ask about viewing, mention proof of funds/financing is needed before scheduling, but keep it casual and non-pushy
- If they seem excited or ready, suggest specific times from the calendar
- If they ask questions about specs, answer directly from the listing context

OUTPUT: Return ONLY the draft email body text. No subject line, no explanations, no markdown. Just the email text ready to paste into Gmail.
PROMPT_EOF
)

    # Generate draft with Claude Sonnet
    echo "$LOG_PREFIX Generating AI draft..."
    CLAUDE_STDERR=$(mktemp)
    DRAFT_BODY=$($HOME/.local/bin/claude --print \
        --model sonnet \
        --dangerously-skip-permissions \
        -p "$PROMPT" \
        2>"$CLAUDE_STDERR" || echo "")
    if [[ -s "$CLAUDE_STDERR" ]]; then
        echo "$LOG_PREFIX Claude stderr: $(cat "$CLAUDE_STDERR")"
    fi
    rm -f "$CLAUDE_STDERR"

    # Fallback if AI fails
    if [[ -z "$DRAFT_BODY" ]] || [[ ${#DRAFT_BODY} -lt 20 ]]; then
        echo "$LOG_PREFIX AI generation failed, using fallback template."
        DRAFT_BODY="Hey ${FIRST_NAME},

Thanks for getting back to me. I'd love to set up a time for you to see the van. I'm flexible on scheduling. What days/times work best for you this week or next?

The van is on Colorado's Western Slopes. Happy to jump on a quick call beforehand if you have any questions.

Dustin"
    fi

    # Create the draft as a reply in the same thread
    DRAFT_RESULT=$($GOG gmail drafts create \
        --to "$FROM_EMAIL" \
        --subject "Re: $SUBJECT" \
        --body "$DRAFT_BODY" \
        --reply-to-message-id "$MSG_ID" \
        --json --no-input 2>/dev/null || echo '{"error":"draft creation failed"}')

    DRAFT_ID=$(echo "$DRAFT_RESULT" | jq -r '.draftId // "unknown"')
    echo "$LOG_PREFIX Created draft $DRAFT_ID for $FROM_EMAIL ($REPLY_TYPE_LABEL)"

    # Record draft in Supabase
    SNIPPET_ESCAPED=$(echo "$REPLY_TEXT" | head -5 | tr '\n' ' ' | sed "s/'/''/g")
    NAME_ESCAPED=$(echo "$FROM_NAME" | sed "s/'/''/g")
    psql "$DB_URL" -q -c "
        INSERT INTO forms.reply_drafts (site_id, from_email, from_name, message_id, draft_id, reply_snippet, reply_type)
        VALUES ('sprinter-van', '${EMAIL_ESCAPED}', '${NAME_ESCAPED}', '${MSG_ID}', '${DRAFT_ID}', '${SNIPPET_ESCAPED}', '${REPLY_TYPE}')
        ON CONFLICT (message_id) DO NOTHING;
    " 2>/dev/null || echo "$LOG_PREFIX Warning: failed to record draft in Supabase"

    # Label the thread as processed
    $GOG gmail thread modify "$THREAD_ID" --add-labels "$LABEL_NAME" --no-input 2>/dev/null || true

    # Mark message as processed
    echo "$MSG_ID" >> "$PROCESSED_FILE"

    # Increment daily draft counter
    CURRENT_COUNT=$(cat "$DRAFTS_TODAY_FILE" 2>/dev/null || echo "0")
    echo $((CURRENT_COUNT + 1)) > "$DRAFTS_TODAY_FILE"
    DRAFTS_CREATED=$((DRAFTS_CREATED + 1))

    echo "$LOG_PREFIX Done processing $MSG_ID."
done

echo "$LOG_PREFIX Reply check complete."
