# Coffee Date Transactional Emails

> **Instructions:** Create these "Transactional" emails in Loops.so. You need to use the exact **Transaction ID** specified below.

## Email 1: The Invite (To the guest)
**Transaction ID:** `cmlpuhcf700pw0i1nqtlyw75w`

**Subject:** ☕️ [Variable `organizerName`] wants to grab coffee

**Body:**

Hey!

**[Variable `organizerName`]** invited you to grab a coffee at **[Variable `shopName`]**.

> "[Variable `message`]"

**When:** [Variable `date`] at [Variable `time`]
**Where:** [Variable `shopName`]

[**Accept and Add to Calendar**](Make this a button point to `{{link}}`)

Can't make it? [**Propose a different time**](Make this a hyperlink pointing to `[Variable shopLink]`)

See you there,
The DripMap Team

---

## Email 2: Organizer Confirmation (To the host)
**Transaction ID:** `coffee_date_organizer_confirm`

**Subject:** Invite sent! 🚀

**Body:**

You successfully invited **[Variable `inviteeCount`]** person(s) to **[Variable `shopName`]**.

**The Details:**
📅 [Variable `date`]
⏰ [Variable `time`]
☕️ [Variable `shopName`]

We'll let you know when they accept.

[**Add to My Calendar**](Make this a button point to `{{link}}`)

Stay caffeinated,
The DripMap Team

---

## Email 4: Shop Owner Notification (To the claimed shop owner)
**Transaction ID:** `coffee_date_shop_owner_notification`

**Subject:** 🎉 Someone just planned a Coffee Date at [Variable `shopName`]!

**Body:**

Hi!

Awesome news: **[Variable `organizerName`]** just organized a DripMap Coffee Date at your shop for **[Variable `inviteeCount`]** people!

**The Details:**
📅 **Date:** [Variable `date`]
⏰ **Time:** [Variable `time`]

We wanted to give you a heads up so you can prepare for their visit. Thanks for being a part of the DripMap community!

Best,
The DripMap Team
