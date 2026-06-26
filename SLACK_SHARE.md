# Cheers from Applied — Slack Share

## How to share a board in Slack

Paste the message below into any Slack channel to share a celebration board.
Replace the bracketed values before sending.

---

### Template

```
🎉 *Cheers from Applied* — a new celebration board just went live!

> *[HONOREE NAME]* — [OCCASION e.g. "Happy Birthday / Congrats on the promo!"]

Leave a message, drop a GIF, upload a photo, or record a voice note for them on the board 👇

🔗 *Board link:* https://cheers-from-applied.fly.dev/board/[BOARD-ID]
🌐 *Public share link:* https://cheers-from-applied.fly.dev/c/[SHARE-TOKEN]

_Board closes in [X] days — add your cheer before it wraps!_ 🥂
```

---

### Slack Block Kit version (paste into Incoming Webhook or Slack API)

```json
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "🎉 *Cheers from Applied* — celebrate *[HONOREE NAME]*!\n\n[OCCASION MESSAGE e.g. 'Happy Birthday! / Congrats on the promotion!']\n\nLeave a message, drop a GIF, upload a photo, or record a voice note. Board closes in *[X] days*."
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "🎉 Open Board", "emoji": true },
          "style": "primary",
          "url": "https://cheers-from-applied.fly.dev/board/[BOARD-ID]"
        },
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "🔗 Share Link", "emoji": true },
          "url": "https://cheers-from-applied.fly.dev/c/[SHARE-TOKEN]"
        }
      ]
    }
  ]
}
```

---

## Deploy URL

Once deployed to Fly.io:  
**https://cheers-from-applied.fly.dev**

## Deploy commands

```bash
cd /Users/yomiogbalaja/cheers-from-applied

# First time only
fly apps create cheers-from-applied
fly volumes create cheers_data --region iad --size 1 --app cheers-from-applied

# Deploy
fly deploy --app cheers-from-applied

# Set secrets (SMTP optional — app works without email)
fly secrets set SMTP_HOST=smtp.gmail.com --app cheers-from-applied
fly secrets set SMTP_PORT=587 --app cheers-from-applied
fly secrets set SMTP_USER=youraddr@applied.co --app cheers-from-applied
fly secrets set SMTP_PASS=yourpassword --app cheers-from-applied
```
