#!/usr/bin/env bash
# check-replies.sh — Monitor dustin+sprinter@ for replies and draft responses
# Runs via cron every 30 min during business hours (8am-8pm MT)
#
# Crontab entry (UTC, covers MST+MDT):
#   */30 14-23 * * * /home/ubuntu/projects/sprinter-van-for-sale/scripts/check-replies.sh >> /home/ubuntu/logs/sprinter-replies.log 2>&1
#   */30 0-3   * * * /home/ubuntu/projects/sprinter-van-for-sale/scripts/check-replies.sh >> /home/ubuntu/logs/sprinter-replies.log 2>&1
#
# Requirements:
#   - GOG CLI at ~/bin/gog with authenticated Google account
#   - ~/.gog_env with GOG_KEYRING_PASSWORD
#   - 1Password CLI at ~/bin/op with ~/.op_env
#   - Gmail label "Sprinter/Draft-Sent" created
#   - jq installed
#   - psql (postgresql-client) installed

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"
GOG="$HOME/bin/gog"
LABEL_NAME="Sprinter/Draft-Sent"
PROCESSED_FILE="$HOME/.sprinter-processed-ids"
DRAFTS_TODAY_FILE="$HOME/.sprinter-drafts-today"

# Load GOG keyring password
export GOG_KEYRING_PASSWORD=$(cat ~/.gog_env | cut -d= -f2)

# Load 1Password env for SendGrid and DB access
source ~/.op_env

# Get Supabase DB connection for recording drafts
DB_PASS=$($HOME/bin/op item get "Supabase DB Connection" --vault VPS --fields password --reveal 2>/dev/null)
export PGPASSWORD="$DB_PASS"
DB_URL="postgresql://postgres.fzrwopncgmmwrfvvxnsw@aws-1-us-west-1.pooler.supabase.com:5432/postgres"

echo "$LOG_PREFIX Starting reply check..."

# Reset daily draft counter at midnight (if file date != today)
if [[ -f "$DRAFTS_TODAY_FILE" ]]; then
    file_date=$(date -r "$DRAFTS_TODAY_FILE" '+%Y-%m-%d')
    today=$(date '+%Y-%m-%d')
    if [[ "$file_date" != "$today" ]]; then
        echo "0" > "$DRAFTS_TODAY_FILE"
    fi
else
    echo "0" > "$DRAFTS_TODAY_FILE"
fi

# Create processed IDs file if it doesn't exist
touch "$PROCESSED_FILE"

# Search for ALL unread messages TO dustin+sprinter@, excluding our own outgoing
# This catches replies regardless of subject changes
RESULTS=$($GOG gmail messages search \
    "to:dustin+sprinter@dustinwells.com is:unread -from:dustin@dustinwells.com -from:noreply" \
    --json --max 10 --no-input 2>/dev/null || echo '{"messages":[]}')

MSG_COUNT=$(echo "$RESULTS" | jq -r '.messages | length')

if [[ "$MSG_COUNT" == "0" ]] || [[ "$MSG_COUNT" == "null" ]]; then
    echo "$LOG_PREFIX No new replies found."
    exit 0
fi

echo "$LOG_PREFIX Found $MSG_COUNT unread message(s)."

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

    # Skip messages from ourselves (belt + suspenders with the search filter)
    if [[ "$FROM_EMAIL" == "dustin@dustinwells.com" ]] || [[ "$FROM_EMAIL" == "dustin+sprinter@dustinwells.com" ]]; then
        echo "$LOG_PREFIX Skipping own message $MSG_ID"
        echo "$MSG_ID" >> "$PROCESSED_FILE"
        continue
    fi

    # Extract just the reply content (before the quoted original)
    REPLY_TEXT=$(echo "$BODY" | sed '/^On .* wrote:$/,$d' | sed '/^>.*$/d' | head -20)
    if [[ -z "$REPLY_TEXT" ]]; then
        REPLY_TEXT="$SNIPPET"
    fi

    # Determine first name
    PROSPECT_NAME=$(echo "$SUBJECT" | grep -oP ', \K[^"]+$' || echo "there")
    FIRST_NAME=$(echo "$FROM_NAME" | awk '{print $1}')
    if [[ -z "$FIRST_NAME" ]] || [[ "$FIRST_NAME" == "$FROM_EMAIL" ]]; then
        FIRST_NAME="$PROSPECT_NAME"
    fi

    # Classify reply type by checking how many previous drafts we have for this email
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

    # Generate the draft response based on reply type and content
    REPLY_LOWER=$(echo "$REPLY_TEXT" | tr '[:upper:]' '[:lower:]')

    if [[ "$REPLY_TYPE" == "first" ]]; then
        # ── First reply: full contextual draft ──
        DRAFT_BODY="Hi ${FIRST_NAME},

Thanks for getting back to me."

        # Add contextual acknowledgment based on what they said
        if echo "$REPLY_LOWER" | grep -qiE "colorado|local|nearby|close"; then
            DRAFT_BODY="$DRAFT_BODY Great to hear you're in the area — makes it easy to set up a viewing."
        elif echo "$REPLY_LOWER" | grep -qiE "travel|fly|ship|transport|out of state|another state"; then
            DRAFT_BODY="$DRAFT_BODY I appreciate you being willing to travel for this — I can help coordinate logistics."
        fi

        if echo "$REPLY_LOWER" | grep -qiE "off.?road|overland|trail|adventure|camp"; then
            DRAFT_BODY="$DRAFT_BODY The off-road setup on this van is seriously impressive — I think you'll appreciate seeing it in person."
        elif echo "$REPLY_LOWER" | grep -qiE "interior|kitchen|build|cabinet|wood"; then
            DRAFT_BODY="$DRAFT_BODY The Tommy Camper Vans interior is really something special — photos don't do it justice."
        elif echo "$REPLY_LOWER" | grep -qiE "electric|solar|battery|power"; then
            DRAFT_BODY="$DRAFT_BODY The electrical system is one of the strongest parts of this build — 800Ah of lithium with a full solar setup."
        fi

        if echo "$REPLY_LOWER" | grep -qiE "sprinter|van life|owned|experience|drove"; then
            DRAFT_BODY="$DRAFT_BODY Since you have some experience with Sprinters/van life, I think you'll really notice the quality of this build."
        fi

        DRAFT_BODY="$DRAFT_BODY

I'd love to set up a time for you to see the van. I'm flexible on scheduling — what days/times work best for you this week or next?

The van is on Colorado's Western Slopes. If you want, I can also jump on a quick call to answer any questions before you make the trip.

Talk soon,
Dustin"

    else
        # ── Follow-up reply: shorter, conversational ──
        DRAFT_BODY="Hi ${FIRST_NAME},

Thanks for following up."

        if echo "$REPLY_LOWER" | grep -qiE "when|time|schedule|available|free|come by|visit|see it"; then
            DRAFT_BODY="$DRAFT_BODY I'm flexible — what days/times work best for you?"
        elif echo "$REPLY_LOWER" | grep -qiE "price|cost|offer|negotiate|deal|financing|pay"; then
            DRAFT_BODY="$DRAFT_BODY Happy to discuss the details. Would it be easier to hop on a quick call?"
        elif echo "$REPLY_LOWER" | grep -qiE "question|wondering|curious|tell me|more info|details"; then
            DRAFT_BODY="$DRAFT_BODY Of course — happy to answer any questions you have."
        fi

        DRAFT_BODY="$DRAFT_BODY

Let me know what works and we'll get something set up.

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

    # Record draft in Supabase for daily digest tracking
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

    # Send notification email
    SG_KEY=$($HOME/bin/op item get "SendGrid API Key" --vault VPS --fields password --reveal 2>/dev/null)

    if [[ -n "$SG_KEY" ]]; then
        NOTIFY_HTML="<div style=\"font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;color:#333;\">
<h3>New reply to Sprinter Van listing</h3>
<p><strong>From:</strong> ${FROM_NAME} &lt;${FROM_EMAIL}&gt;</p>
<p><strong>Type:</strong> ${REPLY_TYPE_LABEL}</p>
<p><strong>Subject:</strong> ${SUBJECT}</p>
<p><strong>Their reply:</strong></p>
<blockquote style=\"border-left:3px solid #5B7C99;padding-left:12px;color:#555;\">${REPLY_TEXT}</blockquote>
<p style=\"margin-top:1.5rem;\">A draft response has been created in your Gmail drafts. Review and send when ready.</p>
<p><a href=\"https://mail.google.com/mail/u/0/#drafts\" style=\"background:#5B7C99;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;\">Open Gmail Drafts</a></p>
<p style=\"margin-top:1rem;\"><a href=\"https://sprinter.dustinwells.com/admin\" style=\"color:#5B7C99;\">Open Admin Dashboard</a></p>
</div>"

        curl -s --request POST \
            --url https://api.sendgrid.com/v3/mail/send \
            --header "Authorization: Bearer $SG_KEY" \
            --header "Content-Type: application/json" \
            --data "$(jq -n \
                --arg to_email "dustin+sprinter@dustinwells.com" \
                --arg from_email "dustin@dustinwells.com" \
                --arg from_name "Sprinter Van Bot" \
                --arg subject "Draft ready: ${REPLY_TYPE_LABEL} from $FROM_NAME" \
                --arg html "$NOTIFY_HTML" \
                '{
                    personalizations: [{to: [{email: $to_email}]}],
                    from: {email: $from_email, name: $from_name},
                    subject: $subject,
                    content: [{type: "text/html", value: $html}]
                }')" > /dev/null

        echo "$LOG_PREFIX Notification email sent."
    fi

    echo "$LOG_PREFIX Done processing $MSG_ID."
done

echo "$LOG_PREFIX Reply check complete."
