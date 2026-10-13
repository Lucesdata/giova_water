// Direct contact data and the mailto builder used by the contact form.
// The page has no backend: the form only prepares an email in the visitor's own
// mail app, so nothing is ever "sent" from here.

export const CONTACT = {
  email: 'lucesproject@gmail.com',
  phone: '+34 673 506 760',
  // wa.me wants the number with country code and digits only.
  whatsappNumber: '34673506760',
};

export const whatsappUrl = (text) =>
  `https://wa.me/${CONTACT.whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const telUrl = () => `tel:+${CONTACT.whatsappNumber}`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Returns { name, email, msg } with an error key per invalid required field. */
export function validateContact({ name = '', email = '', msg = '' }) {
  const errors = {};
  if (!name.trim()) errors.name = true;
  if (!EMAIL_RE.test(email.trim())) errors.email = true;
  if (!msg.trim()) errors.msg = true;
  return errors;
}

/**
 * Builds the mailto: link. `labels` are the translated field names and
 * `typeLabel` the visible label of the chosen category (not its internal id).
 * Empty optional fields are left out.
 */
export function buildMailto(form, { subject, labels, typeLabel }) {
  const lines = [
    `${labels.name}: ${form.name.trim()}`,
    `${labels.email}: ${form.email.trim()}`,
  ];
  if (form.org?.trim()) lines.push(`${labels.org}: ${form.org.trim()}`);
  if (typeLabel) lines.push(`${labels.type}: ${typeLabel}`);
  lines.push('', `${labels.msg}:`, form.msg.trim());
  return `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}
