/**
 * The filename a CSV download arrives as.
 *
 * A list is named by the operator, so this is user input on its way to becoming
 * a filename. It needs to survive that: a folder of `subscribers-a1b2c3d4.csv`
 * says nothing about which list each file came from, while passing the raw name
 * through would produce `../../etc-contacts.csv` or a 200-character name for
 * anyone who pastes a sentence into the field.
 */

/** A name reduced to lowercase words joined by hyphens, or null if nothing survives. */
export function slugifyName(name) {
  const slug = String(name ?? '')
    .toLowerCase()
    // Anything that is not a letter or digit becomes a separator. This is what
    // removes path characters, so `../../etc` cannot climb anywhere.
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    // The slice can leave a trailing hyphen behind.
    .replace(/-+$/g, '')

  return slug || null
}

/**
 * `<list name>-contacts.csv`, falling back to something sane.
 *
 * The fallback matters more than it looks: a list named only with emoji, or in a
 * script with no ASCII, slugifies to nothing, and `-contacts.csv` is a worse
 * answer than a generic one.
 */
export function listExportFilename(name) {
  return `${slugifyName(name) ?? 'list'}-contacts.csv`
}
