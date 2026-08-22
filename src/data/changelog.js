/**
 * The changelog, newest first.
 *
 * This used to be a literal array inside Changelog.jsx, which is why it was
 * eight days stale: updating it meant editing a React component, so it only
 * happened when someone remembered. It is data, so it lives here now and the
 * page just renders it.
 *
 * Shape:
 *   { date: 'Month D, YYYY', items: [{ title, body, list?: string[] }] }
 *
 * Two rules worth keeping:
 *
 * 1. Write for someone using the product, not someone who wrote it. "You can
 *    now see how many people a broadcast will reach before sending it" - not
 *    "added count_campaign_recipients()".
 *
 * 2. Never edit or delete a past entry to reflect a later change. The July 25
 *    entry announces a template picker that no longer exists; the August 4 entry
 *    records its removal. A changelog that quietly rewrites itself is worth
 *    nothing to anyone trying to work out when their experience changed.
 *
 * Add an entry as part of shipping, not afterwards.
 */
export const CHANGELOG = [
    {
      date: 'August 21, 2026',
      items: [
        {
          title: 'Send to an area, properly',
          body: 'Filter your contacts by radius, then turn the result into a list and send to it. Choosing "Geo-Targeted" on a broadcast used to show a map that quietly did nothing - the radius was never applied and the broadcast went to your whole audience. That option has been removed rather than half-fixed.',
          list: [
            'Contacts, then draw a radius, then "Create list from these" - the list appears in the audience picker on a broadcast',
            'A list can be checked before you send, which a map cannot',
          ],
        },
        {
          title: 'The radius filter actually filters',
          body: 'Applying a radius showed the right count and then listed everybody. Two requests were racing and the unfiltered one usually won. It now shows the contacts inside the radius, and the export and list buttons act on exactly that set.',
          list: [
            'Selecting more than one area now searches all of them. Only the first was used, so adding a second area could empty your list entirely',
            'Picking 25 miles gave you 10 - the radius was being dropped on the way to the server',
            'Export CSV takes your current filter instead of always exporting everyone',
            'Contacts outside the radius are dimmed on the map, so it is clear what is selected',
          ],
        },
        {
          title: 'Smaller fixes',
          body: 'A pass over things that were wrong rather than merely rough.',
          list: [
            'The joined-after and joined-before filters were two unlabelled empty boxes',
            'The calendar view was showing the table underneath it',
            'Pages no longer get cut off on a phone',
            'Feedback, Newsletter, Event RSVP and SMS capture forms can be created - four of the six types could not be saved',
            'A coupon form now has somewhere to put the coupon code',
          ],
        },
      ],
    },
    {
      date: 'August 17, 2026',
      items: [
        {
          title: 'Choose when a broadcast sends',
          body: 'The last step of sending now asks when. Send now goes out immediately; schedule picks a date and time, shown in your own timezone. Previously there was no way to say when you wanted something to send.',
          list: [
            'A scheduled broadcast can be put back to draft any time before it goes',
            'Scheduled sends are now picked up within five minutes of the time you set, rather than once a day',
          ],
        },
        {
          title: 'Send now actually sends',
          body: 'Pressing Send did not send. It marked the broadcast as pending and handed it to a job that ran once a day at midnight UTC, so anything sent after that hour waited until the following night with nothing on screen to say so. Send now sends, and tells you how many it reached.',
        },
        {
          title: 'Your dashboard numbers are back',
          body: 'Audience, Broadcasts Sent, Avg Open Rate and Avg Click Rate all showed a dash on the overview page regardless of what was in the account. The figures were being read from the wrong place and never reached the cards. Recent activity was blank for the same reason.',
        },
        {
          title: 'A large send can no longer be sent twice',
          body: 'A broadcast too big to finish in one pass is completed in the background. Two internal corrections here: that follow-up could not record its own progress, and a send running longer than the interval between checks could be picked up a second time while the first was still going, which would have delivered it twice to the same people. Neither had been reached yet, as no send has been large enough.',
        },
      ],
    },
    {
      date: 'August 16, 2026',
      items: [
        {
          title: 'Broadcasts to a list work',
          body: 'Choosing a list as the audience failed with "Failed to create campaign", and picking Geo-Targeted made the draft stop saving. Both were the database rejecting a value the picker offered. Both audiences now work, and a rejected value says which one it was instead of reporting a generic failure.',
        },
        {
          title: 'Test sends arrive',
          body: 'Send yourself a test reported success and delivered nothing - it was wired to a provider that had never been configured. It now sends through your workspace provider with your branding, so the test looks like the real thing, and it tells you when the provider rejects it rather than claiming it was sent.',
        },
        {
          title: 'Preview without leaving the editor',
          body: 'Send Me A Preview is now in the editor itself. The split view also updates as you type - it painted once and then went stale, which is why it seemed to need clicking around to refresh.',
          list: [
            'The subject line suggester has been removed. It assembled confident-sounding lines out of the most common word in your draft, which is the wrong kind of help for the one line that decides whether the rest gets read',
          ],
        },
        {
          title: 'Analytics counts everyone',
          body: 'Subscriber growth read at most a thousand contacts and counted those, so on a large list the chart was flat and new signups were invisible. It is now counted by the database with no ceiling.',
          list: [
            'Capture form submissions and downloads now appear in analytics - they had no campaign attached, so they were excluded from every figure on the page',
            'The live activity feed works, and shows only your own workspace',
          ],
        },
        {
          title: 'Unsubscribing takes effect immediately',
          body: 'A large broadcast is delivered in batches over time. Someone who unsubscribed while one was in flight was still sent it, because the recipient list was fixed when the send started. Opting out now applies to a broadcast already on its way, not just the next one.',
        },
        {
          title: 'Contacts',
          body: 'The phone column is now shown, Export CSV has moved somewhere findable, and each export button says which set of contacts it means.',
          list: [
            'Ticking rows and exporting now exports those rows, rather than everything matching the current filter',
          ],
        },
        {
          title: 'Capture forms',
          body: 'Adding someone to a list is now an explicit choice on the form rather than something that happened automatically. A form that hands over a file and a form that signs someone up for future mail are different promises.',
          list: [
            'The delivery email can be edited per form - subject, message, and where the download button goes',
            'A headline field was added to that email',
            'The download stays behind the email when the email was sent, and is still offered on screen when it was not',
            'Embedded forms size themselves correctly - no clipped email field, no giant placeholder while loading, and they fill the width the page gives them',
          ],
        },
        {
          title: 'Signing in with Google and GitHub',
          body: 'Both were broken by an internal rename and now work again.',
        },
        {
          title: 'Marketing consent is enforced',
          body: 'Consent is recorded when contacts are imported, and automated emails now respect the same rules broadcasts do. Automations could previously mail people that a broadcast would have skipped.',
        },
      ],
    },
    {
      date: 'August 10, 2026',
      items: [
        {
          title: 'Capture forms now send the download they promise',
          body: 'A lead magnet form told people to check their inbox for their download link, and no email was ever sent. The link is now emailed as soon as the form is submitted, and it also appears on screen straight away so it arrives whether or not the email does.',
          list: [
            'If the email cannot be sent, the form says so instead of claiming it is on its way',
            'Opening the link is recorded, so you can see who claimed a download',
          ],
        },
        {
          title: 'Confirmation emails were never being sent',
          body: 'Signups through a capture form or an embedded form should receive a confirmation email. None of them ever did, because the sending was wired to a provider that had never been configured. It now uses the same provider setup as everything else.',
        },
        {
          title: 'Unsubscribes are remembered',
          body: 'Unsubscribing deleted the contact outright. That meant re-importing a list could quietly put someone back on it and start emailing them again. An unsubscribe is now kept as a permanent record: the contact stops receiving everything immediately, and stays that way even if the same address is imported later.',
          list: [
            'Their history is no longer erased, so past broadcast results stay accurate',
            'Use the delete option on a contact if you need their data removed entirely',
          ],
        },
        {
          title: 'Signing up could get stuck',
          body: 'The security check on the signup and sign-in forms could hang without ever finishing, leaving Create Account greyed out with no way forward. It now gives up after a short wait and lets you continue.',
        },
        {
          title: 'Passwords need at least 12 characters',
          body: 'The minimum was six. New passwords need twelve, and a passphrase is a good way to get there. Existing passwords keep working, and signing in is unaffected.',
        },
        {
          title: 'Smaller corrections',
          body: 'A pass over the marketing site and documentation for things that were inaccurate rather than merely rough.',
          list: [
            'Setup instructions asked for full-access provider keys; they now ask for send-only permissions, which is all Veloce uses',
            'Documentation links for features that had no page were removed rather than quietly showing the introduction',
            'The homepage "get notified" form was posting to a workspace that does not exist, so it never captured anyone',
            'Removed audience and campaign figures that were not real',
            'Pages now open at the top when you navigate to them',
          ],
        },
      ],
    },
    {
      date: 'August 4, 2026',
      items: [
        {
          title: 'Radius search actually works',
          body: 'Filtering contacts by distance from a point returned an error every time it was tried. It works now. Radius is measured consistently between filtering and sending, so the people you see are the people who get the broadcast.',
          list: [
            'Imported contacts need latitude and longitude columns to appear in a radius search - the CSV template now includes them',
            'Contacts who sign up through a capture form get their location automatically',
          ],
        },
        {
          title: 'Your brand colours and logo are used',
          body: 'Setting a logo and brand colours in Settings previously changed nothing anywhere. They now appear in the broadcasts you send and on the public web version of a broadcast.',
        },
        {
          title: 'Capture forms fit the page they are on',
          body: 'Embedded forms resize themselves to their content instead of using a fixed height guessed when you copied the code. That fixes forms being cut off on narrow screens and leaving empty space on wide ones. Re-copy your embed code to pick this up.',
        },
        {
          title: 'Lists and saved filters are no longer both called segments',
          body: 'A list is a group you put contacts into and they stay there. A saved filter re-runs itself every time you apply it. Both were called segments, which made it unclear which one you were looking at. Saved filters now show when one is applied and can be cleared or removed.',
        },
        {
          title: 'The template picker has been removed',
          body: 'New broadcasts open on an empty editor. The picker interrupted writing more than it helped, and saved templates went with it. (Announced July 25.)',
        },
      ],
    },
    {
      date: 'August 3, 2026',
      items: [
        {
          title: 'Sending now has steps',
          body: 'Writing and sending used to be one button and one confirmation. It is now write, preview, send yourself a test, confirm who is receiving it, then send.',
          list: [
            'A test send is required before the final send, and editing the content afterwards asks for a fresh one',
            'The recipient count is real - it is produced by the same rule that picks who actually receives the broadcast',
            'The old confirmation showed an invented recipient count, an invented cost, and named the wrong email provider',
          ],
        },
        {
          title: 'Security activity on your dashboard',
          body: 'Sign-ins, contact exports and imports, deletions, credential changes and team changes are now recorded and shown to account owners.',
        },
        {
          title: 'Exports return everyone',
          body: 'Exporting contacts silently stopped at 1,000 rows. Exports are also now limited to editors and owners, and are safe to open directly in a spreadsheet.',
        },
        {
          title: 'The contacts map stays behind the menu',
          body: 'The map on the Contacts page covered the navigation bar when scrolling up.',
        },
      ],
    },
    {
      date: 'August 2, 2026',
      items: [
        {
          title: 'Bring your own Resend or SendGrid account',
          body: 'Your provider API key is saved against your workspace, so your broadcasts send from your own account and your own sending reputation. Previously the key field looked like it saved and did not.',
        },
        {
          title: 'Deliverability tells you what is missing',
          body: 'The deliverability page reported a generic failure when it simply had no sender email to check. It now says so, and links to where to set one.',
        },
      ],
    },
    {
      date: 'July 25, 2026',
      items: [
        {
          title: 'Deeper analytics, faster answers',
          body: 'Click an hour on the activity heatmap to filter the day-by-day breakdown down to just that hour. Drag across the growth chart to compare any range against the period overall, and an always-visible average line makes trends easier to spot at a glance.',
        },
        {
          title: 'Start from a template',
          body: 'New broadcasts now offer a starting point instead of a blank editor - pick the built-in two-voice template or any of your own saved templates.',
        },
      ],
    },
    {
      date: 'July 23, 2026',
      items: [
        {
          title: 'More ways to send',
          body: 'Amazon SES now works alongside Resend and SendGrid, sending raw MIME so one-click unsubscribe headers are preserved, with automatic fallback to your backup provider on transient errors. Every option is named clearly wherever you look - the homepage, previews, and docs - so choosing is about your audience, not guesswork.',
        },
        {
          title: 'Better brand consistency',
          body: 'Fixed a theme mismatch that was silently rendering headings and the Veloce wordmark in the wrong font. Everything now displays in Bebas Neue across the site.',
        },
        {
          title: 'Improved accessibility',
          body: 'Focus rings and the demo button are now visible on dark sections, and the "Skip to content" link lands on the main content instead of nowhere.',
        },
        {
          title: 'A clearer demo experience',
          body: '"Watch Demo" is now "See Live Demo" - it opens an interactive product tour, not a video.',
        },
        {
          title: 'New newsletter example',
          body: 'Added a conversational, two-voice sample template with alternating speakers and a geo-personalized greeting, ready to preview and adapt for event announcements.',
        },
      ],
    },
    {
      date: 'July 22, 2026',
      items: [
        {
          title: 'More reliable campaigns',
          body: 'Campaign sending now runs through a durable per-recipient queue. If something interrupts a send, Veloce picks up where it left off instead of starting over.',
        },
        {
          title: 'Better error messages',
          body: 'Signup issues now tell you exactly what happened and what to do next, instead of a generic error banner.',
        },
        {
          title: 'Stability improvements',
          body: 'Fixed modal focus handling, a color-palette crash, and a contrast issue affecting secondary text.',
        },
      ],
    },
    {
      date: 'July 21, 2026',
      items: [
        {
          title: 'Introducing Deliverability Center',
          body: 'A new dashboard for understanding and improving email health. Check your domain setup, monitor authentication, and get recommendations for improving deliverability.',
          list: [
            'SPF, DKIM, DMARC, and MX checks',
            'Deliverability health scoring',
            'Domain verification tools',
            'Actionable, prioritized recommendations',
          ],
        },
        {
          title: 'Stronger foundations',
          body: 'Expanded TypeScript coverage across the app and improved API reliability.',
        },
      ],
    },
    {
      date: 'July 20, 2026',
      items: [
        {
          title: 'A stronger sending foundation',
          body: 'Rebuilt the email infrastructure to make providers interchangeable, with automatic fallback when one fails, smarter retry handling, and clearer send activity tracking.',
        },
        {
          title: 'Better testing tools',
          body: 'Added Sandbox Mode so you can test campaigns without sending real emails - preview engagement, analytics, and campaign behavior before going live.',
        },
        {
          title: 'Faster platform performance',
          body: 'Improved database performance, API consistency, and demo setup.',
        },
      ],
    },
    {
      date: 'July 19, 2026',
      items: [
        {
          title: 'Veloce becomes Audience OS',
          body: 'The product is shifting from a newsletter tool into a complete audience ownership platform. Updated language and navigation across the app:',
          list: [
            'Newsletters → Broadcasts',
            'Subscribers → Contacts',
            'Lists → Segments',
            'Widgets → Capture Forms',
          ],
        },
        {
          title: 'Better visibility',
          body: 'Added error monitoring, improved analytics, login tracking, and cleaner audience insights.',
        },
        {
          title: 'Cleaner experience',
          body: 'Removed unused systems, simplified navigation, and improved overall stability.',
        },
      ],
    },
    {
      date: 'July 18, 2026',
      items: [
        {
          title: 'Stronger security',
          body: 'Completed a security pass across the platform, including better protection for user data, safer authentication flows, improved API security, and updated dependencies.',
        },
        {
          title: 'Smarter capture forms',
          body: 'Forms now adapt based on what you are collecting - coupons reveal coupon codes, feedback forms collect responses, and lead magnets deliver downloads.',
        },
        {
          title: 'Better location tools',
          body: 'Improved geo-targeting with draggable map markers, saved location settings, and better location accuracy.',
        },
      ],
    },
    {
      date: 'July 17, 2026',
      items: [
        {
          title: 'Better onboarding',
          body: 'Added transactional emails for account creation and password resets.',
        },
        {
          title: 'Improved messaging tools',
          body: 'Added RCS previews, SMS improvements, location-based campaigns, and provider setup guidance.',
        },
        {
          title: 'Better imports',
          body: 'CSV imports now include clearer templates and guidance.',
        },
      ],
    },
    {
      date: 'July 16, 2026',
      items: [
        {
          title: 'More control over capture forms',
          body: 'Added full styling customization for widgets - colors, appearance, size, and embed behavior.',
        },
        {
          title: 'Audience targeting improvements',
          body: 'Added multi-location targeting, saved segments, and subscriber counts by area.',
        },
        {
          title: 'SMS and RCS foundations',
          body: 'Built the infrastructure for richer messaging beyond email.',
        },
      ],
    },
    {
      date: 'July 15, 2026',
      items: [
        {
          title: 'Better campaign infrastructure',
          body: 'Reworked campaign sending for reliability and scale, with improved queue handling, progress tracking, and better failure recovery.',
        },
        {
          title: 'Own your archive',
          body: 'Sent newsletters can now live as public pages, giving your content a longer life beyond the inbox.',
        },
        {
          title: 'Stronger positioning',
          body: 'Updated the product experience around audience ownership instead of just newsletters.',
        },
      ],
    },
    {
      date: 'July 14, 2026',
      items: [
        {
          title: 'Building the foundation',
          body: 'Added reusable UI components, improved SEO, and strengthened campaign workflows.',
          list: [
            'Component library',
            'Template saving',
            'Provider testing',
            'Structured metadata',
            'Improved search',
          ],
        },
      ],
    },
    {
      date: 'July 13, 2026',
      items: [
        {
          title: 'Email + SMS together',
          body: 'Veloce now supports multi-channel communication.',
          list: [
            'Email campaigns',
            'SMS campaigns',
            'RCS previews',
            'Location-based messaging',
            'Campaign analytics',
          ],
        },
      ],
    },
    {
      date: 'July 12, 2026',
      items: [
        {
          title: 'Better audience targeting',
          body: 'Added geographic filters, a campaign calendar, subject line suggestions, and subscriber search. Also improved workspace security and launched Landing Page V3.',
        },
      ],
    },
  ]
