/**
 * The Tivorah guide (tivorah.com/guide). The app opens this same page from
 * Profile → Settings & privacy → Help & information → Tivorah guide, so there is one copy for both.
 *
 * Keep every button, tab and screen name exactly as the app shows it, and check the code before
 * changing a step. Bottom tabs in the app: Events, Hubs, Chat (its screen is titled Messages),
 * Profile, and Shop only when it is switched on, so no step relies on the Shop tab.
 */

export type GuideTopic = {
  id: string;
  title: string;
  /** One sentence: what this is for. */
  summary: string;
  /** Where to find it, when that isn't obvious from the steps. */
  where?: string;
  steps: readonly string[];
  tip: string;
  /** Extra words people might search for. */
  keywords?: readonly string[];
};
export type GuideGroup = { id: string; title: string; intro: string; topics: readonly string[] };
export type GuideFaq = { id: string; question: string; answer: string; keywords?: readonly string[] };

export const startHere = [
  'Get the Tivorah app and tap Create free account. Enter your name and email, then choose a username and password and confirm you’re 18 or older.',
  'Check your email for a 6-digit code and enter it on the Verify your email screen.',
  'Follow the short welcome: your area, what you’re into, then Join your first Hubs. The Hubs you join are pinned to the top of your Hubs tab.',
  'Add a photo and a short bio from Profile → Edit, then open a Hub and say hello in Banter.',
] as const;

export const topics: readonly GuideTopic[] = [
  // ---- Getting started ----
  {
    id: 'create-account',
    title: 'Create your account',
    summary: 'Sign up with your email. Tivorah is for adults 18 and over.',
    steps: [
      'Open the app and tap Create free account.',
      'Enter your First name, Last name and Email, then tap Continue.',
      'Choose a Username (tap Shuffle for ideas), enter your date of birth and a Password.',
      'Tick “I’m 18 or older and agree to the Terms of Use and Privacy Policy”, then tap Create account.',
      'If you’re asked for a Quick security check, complete it. It just confirms you’re a person.',
    ],
    tip: 'Each email inbox can have one Tivorah account, and temporary or throwaway email addresses can’t be used. Use an email you’ll keep.',
    keywords: ['sign up', 'register', 'join tivorah', 'new account', 'captcha', 'human'],
  },
  {
    id: 'verify-email',
    title: 'Verify your email',
    summary: 'You need to confirm your email before you can use your account.',
    steps: [
      'After you create your account, we email you a 6-digit code.',
      'Enter it on the Verify your email screen and tap Verify and continue.',
      'Code not there? Check your junk or spam folder, then tap Send a new code. Each code works for 10 minutes.',
    ],
    tip: 'Never share your code with anyone, including people who say they’re from Tivorah.',
    keywords: ['code', 'confirm email', 'verification'],
  },
  {
    id: 'sign-in',
    title: 'Sign in or reset your password',
    summary: 'Get back into your account on a new phone or the website.',
    steps: [
      'Tap I already have an account, or Sign in on the website.',
      'Enter your Email or Username and your Password, then tap Sign in.',
      'Forgotten it? Tap Forgot Password? and follow the email we send you.',
    ],
    tip: 'Your Hubs, pinned Hubs, chats and tickets are saved to your account, so they appear wherever you sign in.',
    keywords: ['log in', 'login', 'password', 'forgot'],
  },
  {
    id: 'welcome',
    title: 'Set up and join your first Hubs',
    summary: 'The welcome steps help you find people and Hubs near you.',
    steps: [
      'Tap Let’s go after you verify your email.',
      'Where are you? Choose your area. Only your area is shown, never your address.',
      'What are you into? Pick a few interests.',
      'Join your first Hubs. Tap the Hubs you want. They’re pinned to the top of your Hubs tab.',
      'Say hi 👋 with Post hello, and choose whether to Turn on notifications.',
    ],
    tip: 'Every welcome step can be skipped. You can join Hubs, change your area and turn on notifications later.',
    keywords: ['onboarding', 'interests', 'location', 'area'],
  },

  // ---- Hubs ----
  {
    id: 'find-hubs',
    title: 'Find and join a Hub',
    summary: 'Hubs are local groups for people who share a background, interest or place.',
    steps: [
      'Go to the Hubs tab and tap Explore Hubs, or tap a category such as Culture, Students or Food.',
      'Search hubs and interests, or tap the filter button to choose a Country, Location and Hub interest.',
      'Open a Hub to read About this hub and its rules.',
      'Tap Join Hub. For a private Hub, tap Request to join.',
      'Read the Rules for this hub, tick “I’ve read these rules and agree to follow them”, then tap Join hub (or Send request).',
    ],
    tip: 'A private Hub shows Request pending until an admin approves you. You can tap Withdraw if you change your mind.',
    keywords: ['search', 'explore', 'community', 'group', 'private', 'request'],
  },
  {
    id: 'pin-hubs',
    title: 'Pin your favourite Hubs',
    summary: 'Pinned Hubs sit in a row at the top of the Hubs tab, and one tap opens their Banter.',
    where: 'Hubs tab, in the app',
    steps: [
      'On the Hubs tab, press and hold a Hub card under Your hubs. You’ll see “Pinned”.',
      'Or open the Hub, tap ⋯ and choose Pin to Hubs tab.',
      'Tap a pinned Hub at the top of the Hubs tab to go straight to its Banter.',
      'Press and hold a pin and choose Move to front or Unpin. You can also drag a pin up to unpin it.',
    ],
    tip: 'Pins are saved to your account, so they show on any phone you sign in on. You can pin up to 50 Hubs, and leaving a Hub removes its pin.',
    keywords: ['pin', 'unpin', 'favourite', 'shortcut', 'move to front'],
  },
  {
    id: 'banter',
    title: 'Post in Banter and reply in threads',
    summary: 'Banter is a Hub’s conversation. Each post can have its own thread of replies.',
    steps: [
      'Open a Hub you’ve joined and tap Open Banter (or tap its pin on the Hubs tab).',
      'Type in Start a message and send it.',
      'To add something, tap the attachment button and choose Library, Camera, Video, Files or Poll. You can also hold the mic to record a voice note.',
      'To reply to a post, tap its reply icon. This opens its Thread, where you type in Reply to banter.',
      'Press and hold a post to react to it.',
    ],
    tip: 'Only members of a Hub can read its Banter, in both public and private Hubs. Follow the Hub’s rules, and report a post instead of arguing in public.',
    keywords: ['post', 'message', 'thread', 'reply', 'react', 'poll', 'voice note', 'photo', 'video'],
  },
  {
    id: 'inside-hub',
    title: 'Announcements, listings, jobs and media',
    summary: 'Each Hub has its own announcements, member listings, jobs and shared media.',
    steps: [
      'Open a Hub you’ve joined.',
      'Tap Announcements for news from the Hub’s admins.',
      'Tap Listings to see items, services and events from members.',
      'Tap Jobs to see roles shared in the Hub.',
      'Tap View Hub media to see photos, videos and audio shared in Banter. Under People, tap View everyone to see members.',
    ],
    tip: 'Some of these can be switched off by a Hub’s admins, so not every Hub shows all of them.',
    keywords: ['announcements', 'members', 'people', 'media', 'listings'],
  },
  {
    id: 'create-hub',
    title: 'Create a Hub',
    summary: 'Start a Hub for your people, interest or area in three short steps.',
    where: 'In the app, or on the website under Your Hubs → Create a Hub',
    steps: [
      'On the Hubs tab, tap Create (or Create a hub on your Profile).',
      'Basics: add a Hub photo, a name, a Hub username, interests and location.',
      'Tap Add cover to add up to 4 cover photos and one short video (up to 30 seconds). They play as a slideshow. You can tap Arrange cover to change the order.',
      'About: add a slogan and description. Turn on Private hub if you want to approve everyone who joins.',
      'Rules: choose the rules members agree to (up to 12), then tap Create hub.',
    ],
    tip: 'The cover is optional. Without one, your Hub gets one of Tivorah’s colours. Cover videos are checked before they show.',
    keywords: ['new hub', 'start a hub', 'cover', 'slideshow', 'video', 'organiser'],
  },
  {
    id: 'run-hub',
    title: 'Run your Hub',
    summary: 'Approve members, post announcements and keep your Hub a good place to be.',
    steps: [
      'Open your Hub. Under People, tap Join requests to Approve or Decline people for a private Hub.',
      'Tap Announcements, then Post an announcement. You can mark it Important or Urgent and turn on Pin to the top.',
      'To manage someone, open People, tap ⋯ next to them and choose Hub moderation (Mute or Suspend) or Remove from hub.',
      'Tap ⋯ → More settings → Hub settings to choose who can post Banter, replies, listings, jobs, announcements and media.',
      'Tap ⋯ → Edit Hub details to change the photo, cover, description or rules.',
    ],
    tip: 'To make someone a moderator, use Your Hubs on the Tivorah website. Read the Hub Organiser Rules in Settings → Legal & policies.',
    keywords: ['admin', 'moderator', 'approve', 'mute', 'suspend', 'remove member', 'settings', 'delete hub', 'leave hub'],
  },

  // ---- Events & tickets ----
  {
    id: 'book-event',
    title: 'Find and book an event',
    summary: 'Browse what’s on near you and get tickets in a few taps.',
    steps: [
      'Go to the Events tab. Browse Happening near you, pick a category, or tap search or the filter button (Country, Location, When, Category).',
      'Open an event to check the date, place, organiser and price.',
      'Tap Choose tickets, choose your ticket types and quantity, and check the Total. It includes all booking fees.',
      'Tap Continue to pay securely, or Get free tickets for a free event.',
      'You’ll see “Confirming your booking…” for a moment, then Booking confirmed 🎉 and your ticket.',
    ],
    tip: 'On the website you can book as a guest without signing in. If you close the payment page, your tickets are held for a short time. Tap Resume checkout to finish.',
    keywords: ['tickets', 'buy', 'book', 'rsvp', 'free event', 'checkout', 'pay'],
  },
  {
    id: 'your-tickets',
    title: 'Find, use or send your tickets',
    summary: 'Your tickets are always in your account, ready to show at the door.',
    where: 'App: Profile → My bookings → Event tickets · Website: Account → Tickets',
    steps: [
      'Go to Profile → My bookings and open Event tickets.',
      'Tap a ticket to see its QR code and Entry code. Show it at the door.',
      'Tap Save ticket to keep a copy on your phone, or Download receipt (PDF).',
      'To give a ticket to someone, open Send to a friend, enter their email and tap Send invitation. They have 48 hours to accept, and your QR code stops working once they do.',
    ],
    tip: 'Keep your QR and entry code private. Anyone who has them could use your ticket. To ask for a refund or report a problem, open the ticket and tap Refunds & problems (on the website: Your tickets → Get help).',
    keywords: ['ticket', 'qr', 'entry code', 'transfer', 'refund', 'receipt', 'my bookings'],
  },
  {
    id: 'create-event',
    title: 'Create an event',
    summary: 'Host a free or paid event and share it with your Hubs.',
    where: 'In the app, or on the website with Create an event',
    steps: [
      'On the Events tab, tap Create.',
      'Basics: tap Add a cover to add up to 4 photos and one video of up to 30 seconds (shown as a slideshow), then add the name, categories and About the event.',
      'When & where: set the date and time, then choose In person (with the address) or Online (with an optional joining link).',
      'Tickets: turn on Free tickets, or add ticket types such as General admission or Early bird. You can limit capacity.',
      'Finish: tag the event to at least one Hub you’ve joined (up to 3), accept the organiser rules, then tap Publish event or Save as draft.',
    ],
    tip: 'Paid events need payouts set up first. If you haven’t, you’ll be asked to Open payout setup before you can publish.',
    keywords: ['host', 'organise', 'new event', 'cover', 'slideshow', 'ticket types', 'online event'],
  },
  {
    id: 'check-in',
    title: 'Check in guests at your event',
    summary: 'Scan tickets at the door and see who has arrived.',
    steps: [
      'Go to Profile → My creations, find your event and choose Check in guests (or open the event and tap Manage event).',
      'Tap Allow camera and point it at the QR code on the guest’s ticket.',
      'If scanning doesn’t work, use Enter entry code with the 6-digit code under their QR.',
      'Tap View attendees to search guests and see who has checked in.',
    ],
    tip: 'A ticket can only be checked in once. If you see Already checked in, check the guest’s name with the attendee list.',
    keywords: ['organiser', 'scan', 'door', 'attendees', 'manage event'],
  },

  // ---- Messages ----
  {
    id: 'friends',
    title: 'Connect with people',
    summary: 'Connect with people you meet so you can chat privately.',
    steps: [
      'Go to the Chat tab and tap Start a conversation. This opens Friends & people.',
      'Look in Discover for people nearby, or open someone’s profile from a Hub.',
      'Tap Connect. They’ll see your request in their Requests tab and can Accept or Decline.',
      'Once you’re Connected, tap Message on their profile to start a chat.',
    ],
    tip: 'Don’t want to be suggested to people nearby? Turn off Show me in Discover in Settings & privacy.',
    keywords: ['friends', 'connect', 'request', 'people', 'discover'],
  },
  {
    id: 'chats',
    title: 'Private chats',
    summary: 'Chat one to one with people you’re connected with.',
    where: 'App: Chat tab (Messages) · Website: Account → Messages → Chats',
    steps: [
      'Go to the Chat tab and open a conversation.',
      'Type your message and send it. Hold the mic to record a voice message.',
      'Press and hold a message to React, Reply, Copy text or Edit it. Tap More to delete it or pin it.',
      'Tap the options button at the top to Search messages, View profile, Pin conversation, Mute notifications or Clear chat for me. To remove a whole chat, swipe it in the list and tap Delete.',
    ],
    tip: 'Never send passwords, verification codes or bank details in a chat. Tivorah staff will never ask for them.',
    keywords: ['message', 'chat', 'dm', 'mute', 'pin conversation', 'delete message', 'voice'],
  },
  {
    id: 'photos-view-once',
    title: 'Send photos, videos and view once',
    summary: 'Share photos and videos in a chat, or send one that can only be opened once.',
    steps: [
      'In a private chat, tap the attachment button and choose a photo or video.',
      'Add a caption if you like.',
      'For something that disappears, turn on View once before you send it.',
      'The other person sees “Tap to view”. They can open it once, then it shows “Opened” and is gone.',
      'You see a “View once · Sent” card instead of the image.',
    ],
    tip: 'View once stops the photo staying in the chat, but it can’t stop someone taking a photo of their screen. Only send what you’re comfortable sharing. View once messages open in the app, not on the website.',
    keywords: ['photo', 'picture', 'video', 'image', 'attachment', 'disappearing', 'view once'],
  },
  {
    id: 'reply-react-media',
    title: 'Reply to or react to a photo or video',
    summary: 'Respond to a photo or video without leaving it.',
    steps: [
      'Tap a photo or video someone sent you to open it full screen.',
      'Tap a reaction (❤️ 😂 😮 😢 👍 🔥) to react to it.',
      'Or type in the Reply box at the bottom and send it. Your reply appears in the chat linked to that photo or video.',
    ],
    tip: 'You can also press and hold any message in the chat and choose React or Reply.',
    keywords: ['react', 'reaction', 'emoji', 'reply', 'full screen'],
  },
  {
    id: 'enquiries',
    title: 'Enquiries about listings, events and jobs',
    summary: 'Questions about an item, service, event or job are kept separate from your private chats.',
    steps: [
      'On an item, tap Message seller. On a service, tap Ask a question. On an event, job or shop, tap Message. You can tap a quick question such as “Is this still available?”.',
      'To see all your enquiries, go to the Chat tab and tap the enquiries (briefcase) button at the top. On the website, go to Account → Messages → Enquiries.',
      'Open an enquiry to read replies and continue the conversation.',
    ],
    tip: 'Arrange things through Tivorah messages so there’s a record. Be wary of anyone who asks you to pay outside Tivorah or by gift card.',
    keywords: ['enquiry', 'question', 'seller', 'organiser', 'ask'],
  },

  // ---- Buying & selling ----
  {
    id: 'buy-item',
    title: 'Buy an item',
    summary: 'Order items that Hub members are selling nearby.',
    where: 'A Hub’s Listings, or a seller’s shop page',
    steps: [
      'Open a Hub you’ve joined and tap Listings, then Items.',
      'Open an item. Tap Ask a question if you want to check anything first.',
      'Tap Order, choose the Quantity and Pickup or Delivery, and add a note if you like.',
      'Tap Send order request. You’ll see Order sent 🎉. Tap View your orders to follow it.',
    ],
    tip: 'Payment is arranged with the seller, who accepts or declines each order. Check the item before you pay, and meet somewhere public for pickups.',
    keywords: ['buy', 'order', 'item', 'marketplace', 'shop', 'pickup', 'delivery'],
  },
  {
    id: 'book-service',
    title: 'Book a service',
    summary: 'Book local services offered by Hub members.',
    steps: [
      'Open a Hub you’ve joined and tap Listings, then Services.',
      'Open a service and read Before you book.',
      'Tap Book service (or Request to book or Request a quote, depending on the service), then pick a time and add a note if you like.',
      'Tap Confirm, or Continue to pay if you’re paying now. You’ll see Appointment confirmed 🎉 (or Appointment booked 🎉 after paying). If the provider approves bookings first, you’ll see Request sent.',
    ],
    tip: 'Check what’s included, the price and the time before you book. Check licences or qualifications where they matter, such as electrical work.',
    keywords: ['service', 'appointment', 'booking', 'quote', 'provider'],
  },
  {
    id: 'sell',
    title: 'Sell an item or offer a service',
    summary: 'List something for the members of your Hubs.',
    steps: [
      'Open a Hub you’ve joined, tap Listings, then tap +. Or go to Profile → Sell locally.',
      'Choose Sell an item or Offer a service.',
      'About: start with a photo, then add a clear title and description.',
      'Details: set the price, location and how buyers order (take order requests for pickup or delivery, or Message me to arrange).',
      'Under Choose your Hubs, pick 1 to 3 of your Hubs. Members find it there.',
      'Review, then tap Publish listing (or Publish service).',
    ],
    tip: 'You can share to public Hubs you belong to, and each Hub’s rules apply. Keep listings up to date in Profile → My creations, where you can also Mark reserved or Mark sold.',
    keywords: ['sell', 'list', 'listing', 'offer', 'service', 'post an item'],
  },
  {
    id: 'orders-bookings',
    title: 'Your orders, bookings and appointments',
    summary: 'Everything you’ve booked or ordered, and everything people have booked with you.',
    where: 'App: Profile → My bookings, and Profile → My creations · Website: Account',
    steps: [
      'To see what you’ve booked, go to Profile → My bookings and choose Event tickets, Appointments or Orders.',
      'To see orders for things you sell, go to Profile → My creations and tap Orders received. Accept or Decline each order, then Mark ready and Complete it.',
      'For services you offer, tap Your appointments in My creations.',
      'Need help with a booking? Open it and use Report a problem or the refund option shown.',
    ],
    tip: 'We’ll notify you when an order or booking changes. Booking and ticket updates are always sent, even if you turn other notifications off.',
    keywords: ['orders', 'my bookings', 'appointments', 'accept', 'decline', 'seller'],
  },
  {
    id: 'payouts',
    title: 'Get paid with payouts',
    summary: 'Set up payouts to sell paid event tickets and take paid service bookings.',
    where: 'App: Profile → Payouts · Website: Payouts',
    steps: [
      'Go to Profile → Payouts.',
      'Choose your Business country, read and agree to the Partner Agreement.',
      'Tap Connect with Stripe and follow the steps. Your bank and identity details stay with Stripe.',
      'If you stop part way, tap Continue in Stripe to finish. Payout account shows Connected when you’re ready.',
    ],
    tip: 'Tivorah’s fees are shown before anyone pays. You can see payments and payouts on the Payouts screen.',
    keywords: ['stripe', 'bank', 'get paid', 'money', 'payout', 'fees'],
  },
  {
    id: 'your-shop',
    title: 'Your shop page',
    summary: 'One public page with everything you sell, offer and host.',
    steps: [
      'Go to Profile and look under Your public pages.',
      'Tap Create a shop. It opens Tivorah on the website, already signed in, to set it up.',
      'Once you have one, tap Your shop to see it as customers do.',
    ],
    tip: 'Check your public details before you share your shop link.',
    keywords: ['shop', 'store', 'business', 'public page'],
  },

  // ---- Jobs ----
  {
    id: 'find-job',
    title: 'Find and apply for a job',
    summary: 'See jobs shared in your Hubs and apply in the app.',
    where: 'In the app',
    steps: [
      'Open a Hub you’ve joined and tap Jobs.',
      'Open a job to read the role, location and pay.',
      'Tap Message to contact the person hiring on Tivorah (it goes to your Enquiries), or Apply to go to their website, depending on what the job offers.',
      'Want to talk about it with the Hub? Tap Discuss this job in Banter.',
    ],
    tip: 'Never pay to apply for a job, and don’t send ID documents or bank details before you’ve checked the employer. Use Report job if something seems wrong.',
    keywords: ['job', 'work', 'employment', 'apply', 'hiring'],
  },
  {
    id: 'post-job',
    title: 'Post a job',
    summary: 'Share a role with the members of a Hub.',
    steps: [
      'Open the Hub and tap Jobs, then Post a job.',
      'Add the Job title, Job type, Work setting, Location and Pay (optional), then a Description.',
      'Under How to apply, choose Message me on Tivorah, Apply on a website, or Either way.',
      'Tap Post job.',
    ],
    tip: 'If you can’t see Post a job, the Hub’s admins have limited who can post jobs, or turned job posts off.',
    keywords: ['hiring', 'recruit', 'job ad', 'post a job'],
  },

  // ---- Your profile & settings ----
  {
    id: 'profile',
    title: 'Edit your profile',
    summary: 'Choose how other members see you.',
    steps: [
      'Go to Profile and tap Edit.',
      'Tap your photo to change it, and update your name, Username, City, Country and Bio.',
      'Tap Save changes.',
      'To check how it looks to others, tap Public profile.',
    ],
    tip: 'Keep private details such as your phone number and home address out of your bio.',
    keywords: ['photo', 'bio', 'name', 'username', 'edit profile'],
  },
  {
    id: 'virtual-card',
    title: 'Virtual card and QR codes',
    summary: 'Share your profile with a QR code, and scan Tivorah codes.',
    steps: [
      'Go to Profile and tap Virtual card.',
      'Tap Share profile, Copy link or Save card. Only your public profile link is shared.',
      'To scan a Tivorah code (a virtual card, ticket or link), tap the QR button at the top of Profile and Allow camera.',
    ],
    tip: 'Your ticket QR codes are private. Don’t post them online.',
    keywords: ['qr', 'scan', 'card', 'share profile', 'camera'],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    summary: 'Choose what Tivorah tells you about.',
    steps: [
      'To see your notifications, tap the bell at the top of Profile. Use All, Unread and Mark all as read.',
      'To choose what you get, go to Profile → Settings & privacy → Notifications.',
      'Turn Push notifications, Messages & enquiries, Hubs and Tips from Tivorah on or off.',
    ],
    tip: 'Bookings & tickets notifications are always on, so you never miss a change to something you’ve paid for.',
    keywords: ['alerts', 'push', 'bell', 'mute'],
  },
  {
    id: 'settings',
    title: 'Theme, privacy and password',
    summary: 'Change how Tivorah looks and what others can see.',
    where: 'Profile → Settings & privacy',
    steps: [
      'Go to Profile → Settings & privacy.',
      'Under Appearance, choose Light, Dark or System.',
      'Under Privacy, turn Read receipts and Show me in Discover on or off.',
      'Under Your account, tap Change password, or Blocked people to see and unblock people.',
    ],
    tip: 'Location access is optional. You can still search by suburb without it.',
    keywords: ['dark mode', 'theme', 'appearance', 'privacy', 'read receipts', 'password', 'location'],
  },
  {
    id: 'delete-account',
    title: 'Delete your account',
    summary: 'Permanently close your Tivorah account.',
    steps: [
      'Go to Profile → Settings & privacy and tap Delete account.',
      'When asked to Confirm your password, enter it.',
      'Tap Permanently delete account.',
    ],
    tip: 'This can’t be undone. On the website, use Account → Settings → Delete account. Read “Account Deletion” in Legal & policies for what’s kept and why.',
    keywords: ['close account', 'remove account', 'delete'],
  },

  // ---- Staying safe ----
  {
    id: 'report',
    title: 'Report something',
    summary: 'Tell Tivorah’s safety team about harmful content or people.',
    steps: [
      'A message in Banter: tap ⋮ on it and choose Report message.',
      'A private chat message: press and hold it, tap More, then Report.',
      'A person, event or listing: tap the flag button at the top of their page.',
      'A Hub or Hub member: open the Hub, tap ⋯ → More settings → Report hub or Report a member.',
      'Choose the closest reason. You’ll see Report received.',
    ],
    tip: 'Reports are reviewed by our safety team. The person isn’t told who reported them.',
    keywords: ['report', 'abuse', 'scam', 'harassment', 'flag', 'under 18'],
  },
  {
    id: 'unwanted-contact',
    title: 'Stop unwanted contact',
    summary: 'Ways to take control when someone bothers you.',
    steps: [
      'Report the message or profile (see Report something).',
      'In the chat, tap the options button and choose Mute notifications, or Clear chat for me.',
      'In a Hub, admins can mute, suspend or remove a member. You can also use Report a member.',
      'To see or unblock people you’ve blocked, go to Settings & privacy → Blocked people.',
    ],
    tip: 'If you feel unsafe, stop replying and don’t agree to meet. Keep screenshots of anything threatening.',
    keywords: ['block', 'harassment', 'mute', 'unwanted', 'stalking'],
  },
  {
    id: 'get-help',
    title: 'Get help or make a complaint',
    summary: 'Contact the Tivorah team about your account, a booking or anything else.',
    where: 'Profile → Settings & privacy → Help & information',
    steps: [
      'Go to Profile → Settings & privacy.',
      'Under Help & information, tap Contact & complaints, or Safety Centre for safety advice.',
      'For a problem with a booking, open it and use Report a problem first. The details are attached for you.',
    ],
    tip: 'Tivorah is not an emergency service. If you or someone else is in immediate danger, call 000.',
    keywords: ['support', 'contact', 'complaint', 'emergency', '000', 'help'],
  },
];

export const groups: readonly GuideGroup[] = [
  { id: 'getting-started', title: 'Getting started', intro: 'Create your account and get set up.', topics: ['create-account', 'verify-email', 'sign-in', 'welcome'] },
  { id: 'hubs', title: 'Hubs', intro: 'Find your people, chat in Banter and run your own Hub.', topics: ['find-hubs', 'pin-hubs', 'banter', 'inside-hub', 'create-hub', 'run-hub'] },
  { id: 'events', title: 'Events & tickets', intro: 'Go to events, or host your own.', topics: ['book-event', 'your-tickets', 'create-event', 'check-in'] },
  { id: 'messages', title: 'Messages', intro: 'Private chats with people you’re connected with, and enquiries.', topics: ['friends', 'chats', 'photos-view-once', 'reply-react-media', 'enquiries'] },
  { id: 'buying-selling', title: 'Buying & selling', intro: 'Items and services from the people in your Hubs.', topics: ['buy-item', 'book-service', 'sell', 'orders-bookings', 'payouts', 'your-shop'] },
  { id: 'jobs', title: 'Jobs', intro: 'Roles shared in your Hubs.', topics: ['find-job', 'post-job'] },
  { id: 'profile-settings', title: 'Your profile & settings', intro: 'Your profile, card, notifications and account.', topics: ['profile', 'virtual-card', 'notifications', 'settings', 'delete-account'] },
  { id: 'safety', title: 'Staying safe', intro: 'Report problems and get help.', topics: ['report', 'unwanted-contact', 'get-help'] },
];

export const faqs: readonly GuideFaq[] = [
  {
    id: 'faq-email',
    question: 'Why can’t I sign up with my email?',
    answer: 'Each email inbox can have only one Tivorah account. Addresses like name+anything@gmail.com, or a Gmail address with extra dots, count as the same inbox. Temporary or throwaway email services can’t be used, and the email step tells you straight away. If you already have an account, tap Sign in, or use Forgot Password? to get back in. If you see a message that a lot of accounts were created from your network, wait an hour or try another connection.',
    keywords: ['sign up', 'email taken', 'already have an account', 'disposable', 'gmail'],
  },
  {
    id: 'faq-code',
    question: 'I didn’t get my verification code',
    answer: 'Check your junk or spam folder, and make sure the email address is spelt correctly. Codes work for 10 minutes. Tap Send a new code on the Verify your email screen to get another one.',
    keywords: ['verify', 'code', 'email'],
  },
  {
    id: 'faq-pins',
    question: 'Where did my pinned Hubs go?',
    answer: 'Pinned Hubs are saved to your account, not your phone. Sign in with the same account and open the Hubs tab, and they’ll appear at the top. If you’ve left a Hub, its pin is removed. If you’re offline, they update when you reconnect.',
    keywords: ['pins', 'pinned', 'new phone', 'missing'],
  },
  {
    id: 'faq-ticket',
    question: 'I paid but I don’t see my ticket',
    answer: 'Confirming a payment can take a few seconds, so you may see “Confirming your booking…” first. Then go to Profile → My bookings → Event tickets. On the website, look in Account → Tickets. If you booked as a guest, use the link in your confirmation email. If it says Finish your payment, tap Already paid? Get my tickets. Still missing? Use Contact & complaints. Don’t pay twice.',
    keywords: ['ticket', 'payment', 'paid', 'missing', 'booking'],
  },
  {
    id: 'faq-posts',
    question: 'Who can see my posts?',
    answer: 'Banter posts, threads and replies can only be seen by members of that Hub, in both public and private Hubs. A Hub’s public page shows only its description, interests and rules. Private chats can only be seen by the people in them. Your public profile, shop and published listings and events can be seen by others.',
    keywords: ['privacy', 'banter', 'public', 'who sees'],
  },
  {
    id: 'faq-shop',
    question: 'Where do I find items and services for sale?',
    answer: 'Open any Hub you’ve joined and tap Listings to see items, services and events from its members. You can also open a seller’s shop page from their listings or profile.',
    keywords: ['shop', 'marketplace', 'buy', 'listings'],
  },
  {
    id: 'faq-web',
    question: 'Can I use Tivorah on the website?',
    answer: 'Yes. On tivorah.com you can browse Hubs, events and services, book tickets (even as a guest), and sign in to see your tickets, appointments, orders and messages. Banter, jobs and view once messages are in the app.',
    keywords: ['web', 'website', 'computer', 'browser'],
  },
];
