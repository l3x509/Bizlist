// src/messages.js
// ============================================================
// BIZNIS BOSTON — All Bot Messages
// Every response the bot sends lives here.
// Supports Creole, French, English.
// To change any message — edit it here. Nowhere else.
// ============================================================

// ── WELCOME ───────────────────────────────────────────────

export const welcome = {
  creole: `👋 *Byenveni nan BIZNIS Boston!*

Mwen se yon asistan otomatik ki ede ou jwenn biznis ak pwofesyonèl ayisyen nan Greater Boston.

*Ki sèvis ou bezwen?* Jis ekri li!

Egzanp:
• _"Mwen bezwen yon avoka imigrasyon"_
• _"Ki kote mwen ka fè taks mwen?"_
• _"Doktè ki pale kreyòl"_
• _"Resto ayisyen Mattapan"_
• _"Salon cheve Dorchester"_

Tape *MENU* pou wè tout kategori yo.

_Reply STOP pou dezabòne nenpòt ki lè._`,

  english: `👋 *Welcome to BIZNIS Boston!*

I am an automated assistant helping you find Haitian businesses and professionals in Greater Boston.

*What service do you need?* Just type it!

Examples:
• _"I need an immigration lawyer"_
• _"Where can I do my taxes?"_
• _"Creole speaking doctor"_
• _"Haitian restaurant Mattapan"_
• _"Hair salon Dorchester"_

Type *MENU* to see all categories.

_Reply STOP to unsubscribe anytime._`,

  french: `👋 *Bienvenue sur BIZNIS Boston!*

Je suis un assistant automatique qui vous aide à trouver des entreprises et professionnels haïtiens dans le Grand Boston.

*Quel service cherchez-vous?* Écrivez-le simplement!

Exemples:
• _"J'ai besoin d'un avocat en immigration"_
• _"Où puis-je faire mes impôts?"_
• _"Médecin qui parle créole"_
• _"Restaurant haïtien Mattapan"_

Tapez *MENU* pour voir toutes les catégories.

_Répondez STOP pour vous désabonner._`,
};

// ── MENU ──────────────────────────────────────────────────

export const menu = {
  creole: `📋 *Kategori BIZNIS Boston:*

⚖️ *Sèvis Legal* — Avoka, Notè, Imigrasyon
💰 *Sèvis Taks* — Taks, Kontab, ITIN
🏥 *Sante* — Doktè, Dantis, Enfimyè, Famasi
🏠 *Imobilye* — Kay, Apaman, Mortgage
🚗 *Transpò* — Mekanik, Déménagement
🍽️ *Manje* — Resto, Traiteur, Boutik
💇 *Bote* — Salon Cheve, Bab, Zong
📚 *Lekòl* — Gadri, Lessons, Tuteur
⛪ *Legliz* — Legliz, Òganizasyon
💸 *Voye Kòb* — Transfert, Shipping Ayiti
🔨 *Konstriksyon* — Contractor, Plonmye, Elektrisyen

_Jis ekri kategori ou bezwen an nan lang ou vle!_`,

  english: `📋 *BIZNIS Boston Categories:*

⚖️ *Legal Services* — Lawyers, Notary, Immigration
💰 *Tax Services* — Taxes, Accounting, ITIN
🏥 *Health* — Doctors, Dentists, Nurses, Pharmacy
🏠 *Real Estate* — Homes, Apartments, Mortgage
🚗 *Transport* — Mechanics, Moving
🍽️ *Food* — Restaurants, Catering, Grocery
💇 *Beauty* — Hair Salons, Barbers, Nails
📚 *Education* — Daycare, Tutors, Lessons
⛪ *Church* — Churches, Organizations
💸 *Send Money* — Transfers, Shipping to Haiti
🔨 *Construction* — Contractors, Plumbers, Electricians

_Just type the category you need in any language!_`,

  french: `📋 *Catégories BIZNIS Boston:*

⚖️ *Services Juridiques* — Avocats, Notaire, Immigration
💰 *Services Fiscaux* — Impôts, Comptabilité, ITIN
🏥 *Santé* — Médecins, Dentistes, Infirmières, Pharmacie
🏠 *Immobilier* — Maisons, Appartements, Hypothèque
🚗 *Transport* — Mécaniciens, Déménagement
🍽️ *Nourriture* — Restaurants, Traiteur, Épicerie
💇 *Beauté* — Salons de Coiffure, Barbiers, Ongles
📚 *Éducation* — Garderie, Tuteurs, Cours
⛪ *Église* — Églises, Organisations
💸 *Envoyer de l'Argent* — Transferts, Envois en Haïti
🔨 *Construction* — Entrepreneurs, Plombiers, Électriciens

_Tapez simplement la catégorie dont vous avez besoin!_`,
};

// ── OPT OUT ───────────────────────────────────────────────

export const optOut = {
  creole: `✅ Ou dezabòne ak siksè.

Voye nenpòt mesaj pou rekòmanse nenpòt ki lè.

Mèsi pou te itilize BIZNIS Boston! 🙏`,

  english: `✅ You have been successfully unsubscribed.

Send any message to start again anytime.

Thank you for using BIZNIS Boston! 🙏`,

  french: `✅ Vous avez été désabonné avec succès.

Envoyez n'importe quel message pour recommencer.

Merci d'avoir utilisé BIZNIS Boston! 🙏`,
};

// ── NO RESULTS ────────────────────────────────────────────

export function noResults(category, language) {
  const messages = {
    creole: `😔 Nou poko gen *${category}* nan Boston.

Nou te note rechèch ou a. Nou ap travay pou ajoute plis biznis byento!

👉 _Ou konnen yon ${category} ayisyen nan Boston? Voye enfòmasyon yo ban nou epi nou ap ajoute yo gratis._

Tape *MENU* pou wè lòt kategori yo.`,

    english: `😔 We don't have *${category}* listed yet in Boston.

We noted your search and will add more businesses soon!

👉 _Know a Haitian ${category} in Boston? Send us their info and we'll add them for free._

Type *MENU* to see other categories.`,

    french: `😔 Nous n'avons pas encore de *${category}* à Boston.

Nous avons noté votre recherche et ajouterons plus d'entreprises bientôt!

👉 _Vous connaissez un ${category} haïtien à Boston? Envoyez-nous leurs informations._

Tapez *MENU* pour voir d'autres catégories.`,
  };

  return messages[language] || messages.creole;
}

// ── NOT UNDERSTOOD ────────────────────────────────────────

export const notUnderstood = {
  creole: `🤔 Mwen pa konprann mesaj ou a.

Eseye ekri tankou:
• _"avoka imigrasyon"_
• _"doktè kreyòl"_
• _"salon cheve"_
• _"taks"_

Oswa tape *MENU* pou wè tout opsyon yo.`,

  english: `🤔 I didn't quite understand that.

Try typing something like:
• _"immigration lawyer"_
• _"Creole speaking doctor"_
• _"hair salon"_
• _"taxes"_

Or type *MENU* to see all options.`,

  french: `🤔 Je n'ai pas tout à fait compris.

Essayez d'écrire quelque chose comme:
• _"avocat en immigration"_
• _"médecin créolophone"_
• _"salon de coiffure"_
• _"impôts"_

Ou tapez *MENU* pour voir toutes les options.`,
};

// ── AUDIO NOT SUPPORTED YET ───────────────────────────────

export const audioNotSupported = {
  creole: `🎤 Nou pa ka trete mesaj vwa yo pou kounye a.

Tanpri *ekri* sèvis ou bezwen an.

Egzanp: _"doktè"_ oswa _"avoka imigrasyon"_

Tape *MENU* pou wè tout kategori yo.`,

  english: `🎤 Voice messages are not supported yet.

Please *type* the service you are looking for.

Example: _"doctor"_ or _"immigration lawyer"_

Type *MENU* to see all categories.`,
};

// ── ERROR ─────────────────────────────────────────────────

export const error = {
  creole: `⚠️ Te gen yon erè. Tanpri eseye ankò nan kèk minit.

Si pwoblèm nan kontinye, kontakte nou dirèkteman.`,

  english: `⚠️ Something went wrong. Please try again in a moment.

If the problem continues, contact us directly.`,

  french: `⚠️ Une erreur s'est produite. Veuillez réessayer dans un moment.`,
};

// ── FORMAT BUSINESS RESULTS ───────────────────────────────

/**
 * Format a list of businesses into a WhatsApp message.
 * Premium and spotlight businesses shown with star badge.
 * Verified businesses shown with checkmark.
 *
 * @param {Array}  businesses - Array of business objects from Supabase
 * @param {string} category   - The searched category
 * @param {string} language   - 'creole' | 'english' | 'french'
 * @returns {string}          - Formatted WhatsApp message
 */
export function formatResults(businesses, category, language) {

  const headers = {
    creole:  `🔍 *${businesses.length} rezilta pou ${category}:*\n\n`,
    english: `🔍 *${businesses.length} result${businesses.length !== 1 ? 's' : ''} for ${category}:*\n\n`,
    french:  `🔍 *${businesses.length} résultat${businesses.length !== 1 ? 's' : ''} pour ${category}:*\n\n`,
  };

  const footers = {
    creole:  `\n_Tape nenpòt sèvis ou bezwen oswa tape *MENU*._`,
    english: `\n_Type any service you need or type *MENU*._`,
    french:  `\n_Tapez n'importe quel service ou tapez *MENU*._`,
  };

  const listings = businesses.map((b, i) => {
    // Badges
    const verified = b.is_verified ? ' ✅' : '';
    const premium  = (b.tier === 'premium' || b.tier === 'spotlight') ? ' ⭐' : '';

    // Description in user's language
    const description =
      language === 'creole'  ? b.description_creole  :
      language === 'french'  ? b.description_french  :
      b.description_english;

    // Languages spoken
    const langs = b.languages_spoken?.length
      ? `🗣️ ${b.languages_spoken.join(', ')}\n`
      : '';

    // Location
    const location = b.neighborhood
      ? `📍 ${b.neighborhood}, ${b.city}`
      : `📍 ${b.city}`;

    // Contact lines
    const phone    = b.phone    ? `📞 ${b.phone}\n`           : '';
    const whatsapp = b.whatsapp ? `💬 WhatsApp: ${b.whatsapp}\n` : '';
    const website  = b.website  ? `🌐 ${b.website}\n`          : '';

    // Description line
    const desc = description ? `_${description}_\n` : '';

    return (
      `*${i + 1}. ${b.name}*${verified}${premium}\n` +
      `${location}\n` +
      `${phone}` +
      `${whatsapp}` +
      `${website}` +
      `${langs}` +
      `${desc}` +
      `─────────────────`
    );
  });

  return (
    (headers[language] || headers.creole) +
    listings.join('\n\n') +
    (footers[language] || footers.creole)
  );
}
