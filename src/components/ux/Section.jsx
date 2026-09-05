/*
  Horizontal padding lives here rather than at each call site.
  Without it every section ran flush to the viewport edge - `index.css` resets
  `* { padding: 0 }`, so there was no UA fallback - while the nav and footer sat
  inset at px-4 sm:px-8. The hero h1 at clamp(3rem, 8vw, 7rem) touched the left
  edge of every phone. The section itself stays full-bleed so background colours
  still reach the edge; only the content is inset.

  Vertical padding is a prop, not a className override. Two `py-*` utilities
  have equal specificity, so which one wins is decided by Tailwind's generated
  source order rather than the order they appear in the attribute - passing
  `py-14` alongside the default `py-20` is a coin toss. A prop makes the
  page's spacing rhythm explicit and deterministic.
*/
export default function Section({ children, className = '', id, padding = 'py-20 sm:py-28', ...props }) {
  return (
    <section id={id} className={`px-4 sm:px-8 ${padding} ${className}`} {...props}>
      {children}
    </section>
  )
}
