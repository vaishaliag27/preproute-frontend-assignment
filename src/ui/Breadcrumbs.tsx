import { Link } from 'react-router-dom'

export interface Crumb {
  label: string
  to?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={item.label} style={{ display: 'inline-flex', gap: 8 }}>
          {index > 0 && (
            <span className="crumbs__sep" aria-hidden="true">
              /
            </span>
          )}
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span className="crumbs__current">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
