export default function Section({ children, className = '', id, ...props }) {
  return <section id={id} className={`py-20 sm:py-28 ${className}`} {...props}>{children}</section>
}
