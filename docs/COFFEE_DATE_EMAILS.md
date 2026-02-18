# Coffee Date Transactional Emails

> **Instructions:** Create these "Transactional" emails in Loops.so. You need to use the exact **Transaction ID** specified below.

## Email 1: The Invite (To the guest)
**Transaction ID:** `cmlpuhcf700pw0i1nqtlyw75w`

**Subject:** ☕️ {organizerName} wants to grab coffee

**Body:**

Hey!

**{organizerName}** invited you to grab a coffee at **{shopName}**.

> "{message}"

**When:** {date} at {time}
**Where:** {shopName}

[**View Invite & RSVP**]({link})

See you there,
The DripMap Team

---

## Email 2: Organizer Confirmation (To the host)
**Transaction ID:** `coffee_date_organizer_confirm`

**Subject:** Invite sent! 🚀

**Body:**

You successfully invited **{inviteeCount}** {inviteeCount == 1 ? "person" : "people"} to **{shopName}**.

**The Details:**
📅 {date}
⏰ {time}
☕️ {shopName}

We'll let you know when they accept.

Stay caffeinated,
The DripMap Team
